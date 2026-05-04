-- TrainerPro — Progress photos
-- Stored in Supabase Storage bucket "progress-photos" (private).
-- Only the owning trainer can read/write/delete via RLS.
-- Photos are NEVER exposed to the client portal — PT-side only.

CREATE TABLE IF NOT EXISTS public.progress_photos (
  id           uuid        PRIMARY KEY DEFAULT gen_random_uuid(),
  client_id    uuid        NOT NULL REFERENCES public.clients(id)  ON DELETE CASCADE,
  user_id      uuid        NOT NULL REFERENCES auth.users(id)      ON DELETE CASCADE,
  storage_path text        NOT NULL,
  taken_at     date        NOT NULL DEFAULT CURRENT_DATE,
  notes        text,
  created_at   timestamptz DEFAULT now()
);

ALTER TABLE public.progress_photos ENABLE ROW LEVEL SECURITY;

-- Only the trainer who owns the client can access their photos
CREATE POLICY "photos_owner_only"
  ON public.progress_photos
  FOR ALL
  USING  (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

-- Storage RLS: authenticated users can only access their own folder
-- (Configure this in Supabase Storage bucket policies UI:
--  Allow: auth.uid()::text = (storage.foldername(name))[1] )
