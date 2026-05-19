-- 019_scan_comparisons.sql
-- AI-guided improvement analysis between two fitness scans (beta-in-beta)
-- Plus: per-client upload quota to prevent storage abuse

-- ─── Upload quota enforcement ─────────────────────────────────────────────
-- Prevents a single client from accumulating unlimited scans.
-- The function is called server-side before each upload.

create or replace function check_scan_upload_quota(
  p_client_id uuid,
  p_max       int default 120
)
returns boolean
language plpgsql
security definer
as $$
declare
  v_count int;
begin
  select count(*) into v_count
  from fitness_scans
  where client_id = p_client_id;
  return v_count < p_max;
end;
$$;

-- ─── Scan comparisons ─────────────────────────────────────────────────────
-- Stores the result of comparing two scans with Claude Vision.
-- One row per (before, after) pair — unique constraint prevents duplicates.

create table if not exists fitness_scan_comparisons (
  id              uuid        primary key default gen_random_uuid(),
  user_id         uuid        not null references auth.users(id)   on delete cascade,
  client_id       uuid        not null references clients(id)       on delete cascade,
  scan_before_id  uuid        not null references fitness_scans(id) on delete cascade,
  scan_after_id   uuid        not null references fitness_scans(id) on delete cascade,
  analysis        jsonb,
  created_at      timestamptz not null default now(),
  constraint unique_comparison unique (scan_before_id, scan_after_id)
);

alter table fitness_scan_comparisons enable row level security;

create policy "trainer_owns_comparisons"
  on fitness_scan_comparisons for all
  using (auth.uid() = user_id);

create index if not exists fsc_client_id_idx  on fitness_scan_comparisons(client_id);
create index if not exists fsc_user_id_idx    on fitness_scan_comparisons(user_id);
create index if not exists fsc_before_id_idx  on fitness_scan_comparisons(scan_before_id);
create index if not exists fsc_after_id_idx   on fitness_scan_comparisons(scan_after_id);

comment on table fitness_scan_comparisons is
  'AI improvement analysis between two fitness scans. Indexed by before/after scan IDs.';
