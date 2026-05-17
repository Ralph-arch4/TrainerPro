-- 017_fitness_scans.sql
-- Fitness Scan feature: body transformation photos + AI body composition analysis
-- Security: private bucket, short TTL signed URLs, RLS on user_id

create table if not exists fitness_scans (
  id           uuid primary key default gen_random_uuid(),
  client_id    uuid not null references clients(id) on delete cascade,
  user_id      uuid not null references auth.users(id) on delete cascade,
  storage_path text not null,
  taken_at     date not null,
  notes        text,
  ai_analysis  jsonb,
  created_at   timestamptz not null default now()
);

alter table fitness_scans enable row level security;

create policy "trainer_owns_fitness_scans"
  on fitness_scans for all
  using (auth.uid() = user_id);

-- Index for fast lookup by client
create index if not exists fitness_scans_client_id_idx on fitness_scans(client_id);
create index if not exists fitness_scans_user_id_idx   on fitness_scans(user_id);

-- Storage bucket must be created manually in Supabase dashboard:
--   Name: fitness-scans
--   Public: false
--   Allowed MIME types: image/jpeg, image/png, image/webp
--   File size limit: 10 MB
