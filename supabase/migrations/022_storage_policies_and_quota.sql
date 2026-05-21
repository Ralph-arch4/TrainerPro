-- Migration 022: Storage bucket + policies + missing quota RPC
-- Run this in Supabase SQL Editor.
--
-- Fixes:
--  1. Create the "fitness-scans" private bucket (was manual-only before)
--  2. Add storage.objects RLS policies so trainer dashboard uploads work
--     even without the server-side upload API route
--  3. Add check_scan_upload_quota RPC used by the client portal upload API

-- ─── 1. Create bucket if not exists ─────────────────────────────────────────
INSERT INTO storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
VALUES (
  'fitness-scans',
  'fitness-scans',
  false,
  10485760,  -- 10 MB max
  ARRAY['image/jpeg','image/png','image/webp','image/heic','image/heif']
)
ON CONFLICT (id) DO UPDATE
  SET file_size_limit    = excluded.file_size_limit,
      allowed_mime_types = excluded.allowed_mime_types;

-- ─── 2. Storage RLS policies for fitness-scans bucket ───────────────────────
-- Path format: {user_id}/{client_id}/{taken_at}-{uuid}.jpg
-- Trainers can only access files inside their own user_id/ folder.

-- Drop old policies if they exist (safe to re-run)
DROP POLICY IF EXISTS "trainer_upload_fitness_scans"  ON storage.objects;
DROP POLICY IF EXISTS "trainer_select_fitness_scans"  ON storage.objects;
DROP POLICY IF EXISTS "trainer_delete_fitness_scans"  ON storage.objects;
DROP POLICY IF EXISTS "trainer_update_fitness_scans"  ON storage.objects;

-- INSERT: trainer can upload files under their own user_id folder
CREATE POLICY "trainer_upload_fitness_scans"
ON storage.objects FOR INSERT
TO authenticated
WITH CHECK (
  bucket_id = 'fitness-scans'
  AND (storage.foldername(name))[1] = auth.uid()::text
);

-- SELECT: trainer can read/sign URLs for their own files
CREATE POLICY "trainer_select_fitness_scans"
ON storage.objects FOR SELECT
TO authenticated
USING (
  bucket_id = 'fitness-scans'
  AND (storage.foldername(name))[1] = auth.uid()::text
);

-- DELETE: trainer can remove their own files
CREATE POLICY "trainer_delete_fitness_scans"
ON storage.objects FOR DELETE
TO authenticated
USING (
  bucket_id = 'fitness-scans'
  AND (storage.foldername(name))[1] = auth.uid()::text
);

-- UPDATE: needed for some Supabase storage SDK versions
CREATE POLICY "trainer_update_fitness_scans"
ON storage.objects FOR UPDATE
TO authenticated
USING (
  bucket_id = 'fitness-scans'
  AND (storage.foldername(name))[1] = auth.uid()::text
);

-- ─── 3. check_scan_upload_quota RPC ─────────────────────────────────────────
-- Used by /api/fitness-scan/client/route.ts (client portal upload).
-- Returns true if the client has fewer than p_max scans, false otherwise.
-- security definer = runs as the function owner (bypasses RLS) so it can
-- count rows the caller cannot directly see.

CREATE OR REPLACE FUNCTION check_scan_upload_quota(
  p_client_id uuid,
  p_max       int
)
RETURNS boolean
LANGUAGE sql
SECURITY DEFINER
STABLE
AS $$
  SELECT COUNT(*) < p_max
  FROM fitness_scans
  WHERE client_id = p_client_id;
$$;

COMMENT ON FUNCTION check_scan_upload_quota IS
  'Returns true when the client has not yet reached their scan quota (p_max).
   Used by the client portal upload API to prevent storage abuse.';

-- ─── Also create progress-photos bucket while we are here ──────────────────
INSERT INTO storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
VALUES (
  'Trainer Progress Bar',
  'Trainer Progress Bar',
  false,
  10485760,
  ARRAY['image/jpeg','image/png','image/webp']
)
ON CONFLICT (id) DO NOTHING;

DROP POLICY IF EXISTS "trainer_upload_progress_photos"  ON storage.objects;
DROP POLICY IF EXISTS "trainer_select_progress_photos"  ON storage.objects;
DROP POLICY IF EXISTS "trainer_delete_progress_photos"  ON storage.objects;

CREATE POLICY "trainer_upload_progress_photos"
ON storage.objects FOR INSERT TO authenticated
WITH CHECK (
  bucket_id = 'Trainer Progress Bar'
  AND (storage.foldername(name))[1] = auth.uid()::text
);

CREATE POLICY "trainer_select_progress_photos"
ON storage.objects FOR SELECT TO authenticated
USING (
  bucket_id = 'Trainer Progress Bar'
  AND (storage.foldername(name))[1] = auth.uid()::text
);

CREATE POLICY "trainer_delete_progress_photos"
ON storage.objects FOR DELETE TO authenticated
USING (
  bucket_id = 'Trainer Progress Bar'
  AND (storage.foldername(name))[1] = auth.uid()::text
);
