-- 025 — Remove client photos and AI body-scan data (GDPR data minimisation)
--
-- The app no longer stores client photos nor runs any AI analysis on them.
-- This script permanently deletes the related data. IT IS NOT REVERSIBLE:
-- export anything a trainer wants to keep BEFORE running it.
--
-- Run manually in the Supabase SQL Editor. Then, in Storage, empty and delete
-- the buckets "fitness-scans", "progress-photos" and "Trainer Progress Bar"
-- (files cannot be removed from SQL: use the dashboard or the Storage API).

drop table if exists public.fitness_scan_comparisons cascade;
drop table if exists public.scan_access_logs cascade;
drop table if exists public.fitness_scans cascade;
drop table if exists public.photo_view_tokens cascade;
drop table if exists public.photo_access_pins cascade;
drop table if exists public.progress_photos cascade;

-- Storage policies of the removed buckets (names from migrations 015 and 022)
do $$
declare p record;
begin
  for p in
    select policyname from pg_policies
    where schemaname = 'storage' and tablename = 'objects'
      and (qual ilike '%fitness-scans%' or with_check ilike '%fitness-scans%'
        or qual ilike '%progress-photos%' or with_check ilike '%progress-photos%'
        or qual ilike '%Trainer Progress Bar%' or with_check ilike '%Trainer Progress Bar%')
  loop
    execute format('drop policy if exists %I on storage.objects', p.policyname);
  end loop;
end $$;
