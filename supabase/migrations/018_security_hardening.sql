-- 018_security_hardening.sql
-- Purpose: DB-backed rate limiting + scan access audit log
-- Both tables use security definer functions so they are only writable
-- by the server via service_role — no client can touch them directly.

-- ─── Persistent rate-limit windows ─────────────────────────────────────────
-- Replaces the in-memory Map that doesn't survive across Vercel serverless
-- invocations. Each unique key (ip:endpoint) gets one row; the function is
-- atomic via ON CONFLICT + row lock.

create table if not exists rate_limit_windows (
  key       text        primary key,
  count     integer     not null default 0,
  reset_at  timestamptz not null
);

-- Auto-cleanup: delete expired windows so the table doesn't grow forever.
create index if not exists rate_limit_windows_reset_at_idx on rate_limit_windows(reset_at);

-- Atomic check-and-increment.
-- Returns true (allowed) or false (blocked).
create or replace function check_rate_limit(
  p_key        text,
  p_limit      int,
  p_window_sec int
)
returns boolean
language plpgsql
security definer
as $$
declare
  v_count    integer;
  v_reset_at timestamptz;
begin
  -- Lock the row for this key for the duration of the transaction
  select count, reset_at
  into   v_count, v_reset_at
  from   rate_limit_windows
  where  key = p_key
  for update;

  -- No row yet, or window expired → start fresh
  if not found or now() > v_reset_at then
    insert into rate_limit_windows(key, count, reset_at)
    values (p_key, 1, now() + (p_window_sec || ' seconds')::interval)
    on conflict (key) do update
      set count    = 1,
          reset_at = now() + (p_window_sec || ' seconds')::interval;
    return true;
  end if;

  -- Window still valid but already at limit
  if v_count >= p_limit then
    return false;
  end if;

  -- Increment within the window
  update rate_limit_windows set count = count + 1 where key = p_key;
  return true;
end;
$$;

-- No direct user access to this table
alter table rate_limit_windows enable row level security;
-- (No policies needed — only service_role bypasses RLS)


-- ─── Scan access audit log ──────────────────────────────────────────────────
-- GDPR Art. 30 / Art. 32: maintain a record of processing activities and
-- be able to demonstrate security measures. We store a SHA-256 hash of the
-- IP address (pseudonymisation) — not the plain IP — so the log is GDPR-
-- compliant while still allowing pattern analysis after an incident.

create table if not exists scan_access_logs (
  id         uuid        primary key default gen_random_uuid(),
  scan_id    uuid        references fitness_scans(id) on delete set null,
  client_id  uuid        references clients(id)       on delete set null,
  action     text        not null check (action in ('view','upload','delete','analyze')),
  actor      text        not null check (actor in ('client','trainer')),
  ip_hash    text,        -- SHA-256(real_ip) — pseudonymous, GDPR-safe
  user_agent text,
  created_at timestamptz not null default now()
);

create index if not exists scan_access_logs_scan_id_idx     on scan_access_logs(scan_id);
create index if not exists scan_access_logs_client_id_idx   on scan_access_logs(client_id);
create index if not exists scan_access_logs_created_at_idx  on scan_access_logs(created_at);

-- 90-day retention policy: logs older than this can be purged.
-- (Implement via a pg_cron job or external scheduler — not done here.)

alter table scan_access_logs enable row level security;
-- (No policies — service_role only, no direct client access)

comment on table scan_access_logs is
  'Audit trail for fitness scan operations. IP stored as SHA-256 hash only.';
comment on column scan_access_logs.ip_hash is
  'SHA-256 of the client IP address. Pseudonymous — cannot be reversed.';
