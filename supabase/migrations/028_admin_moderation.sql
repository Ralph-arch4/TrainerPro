-- 028 — CEO admin panel: manual account status, private admin notes, audit log (idempotent)
-- Run in the Supabase SQL Editor AFTER 026_plans_premium.sql and 027_trial_and_suspension.sql.
--
-- * No existing data is modified or deleted: every account starts 'active'.
-- * account_status is set only by the server (service_role) from /admin:
--     active    -> normal access
--     suspended -> subscription not paid / paused: trainer panel and client links blocked
--     banned    -> moderation ban: same block, plus the login is disabled in Supabase Auth
-- * A trainer can never change these fields from the browser; admin notes and
--   the audit log are readable only by the server.

-- ─── 1. Columns ───────────────────────────────────────────────────────────────
alter table public.profiles add column if not exists account_status text not null default 'active';
alter table public.profiles drop constraint if exists profiles_account_status_check;
alter table public.profiles add constraint profiles_account_status_check
  check (account_status in ('active', 'suspended', 'banned'));
alter table public.profiles add column if not exists status_reason     text;
alter table public.profiles add column if not exists status_changed_at timestamptz;
alter table public.profiles add column if not exists status_changed_by text;
alter table public.profiles add column if not exists paid_until        date;

-- ─── 2. Browser requests cannot touch the moderation fields ──────────────────
-- Separate trigger from protect_profile_plan (026/027) so the two stay independent.
create or replace function public.protect_profile_moderation()
returns trigger language plpgsql as $$
begin
  if coalesce(auth.role(), '') in ('authenticated', 'anon') then
    new.account_status    := old.account_status;
    new.status_reason     := old.status_reason;
    new.status_changed_at := old.status_changed_at;
    new.status_changed_by := old.status_changed_by;
    new.paid_until        := old.paid_until;
  end if;
  return new;
end;
$$;

drop trigger if exists protect_profile_moderation on public.profiles;
create trigger protect_profile_moderation
  before update on public.profiles
  for each row execute procedure public.protect_profile_moderation();

-- Private admin notes live in their own table (a trainer can read his whole
-- profile row, so they cannot be a profiles column).
create table if not exists public.admin_trainer_notes (
  user_id    uuid primary key references auth.users(id) on delete cascade,
  note       text not null default '',
  updated_at timestamptz not null default now(),
  updated_by text
);
alter table public.admin_trainer_notes enable row level security;
-- No policies: service role only.

-- ─── 3. One switch for every gate (extends 027) ──────────────────────────────
-- Same signature as 027: plan <> 'free' OR trial not over, AND the account is
-- not suspended or banned by the admin. The portal RPCs, the client limit and
-- the intake API all call this, so client links follow automatically.
create or replace function public.account_is_active(p_user uuid)
returns boolean language sql stable security definer set search_path = public as $$
  select coalesce((
    select coalesce(p.account_status, 'active') = 'active'
       and (coalesce(p.plan, 'free') <> 'free'
            or p.trial_ends_at is null
            or p.trial_ends_at > now())
    from public.profiles p
    where p.id = p_user
  ), true);
$$;
revoke all on function public.account_is_active(uuid) from public, anon;
grant execute on function public.account_is_active(uuid) to authenticated, service_role;

-- ─── 4. Audit log of admin actions (server only) ─────────────────────────────
create table if not exists public.admin_audit_log (
  id             uuid primary key default gen_random_uuid(),
  admin_email    text not null,
  action         text not null,
  target_user_id uuid,
  details        jsonb not null default '{}'::jsonb,
  created_at     timestamptz not null default now()
);
create index if not exists admin_audit_log_target_idx on public.admin_audit_log (target_user_id, created_at desc);
create index if not exists admin_audit_log_created_idx on public.admin_audit_log (created_at desc);
alter table public.admin_audit_log enable row level security;
-- No policies: only the service role (the /api/admin routes) can read or write.
