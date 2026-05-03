-- TrainerPro — Admin access for platform feedback
-- Adds trainer identity columns + supervisor RLS policy + status tracking.
-- Run in Supabase SQL Editor after 013_platform_feedback.sql

-- 1. Add trainer identity and status columns
ALTER TABLE public.platform_feedback
  ADD COLUMN IF NOT EXISTS trainer_name  text,
  ADD COLUMN IF NOT EXISTS trainer_email text,
  ADD COLUMN IF NOT EXISTS status        text NOT NULL DEFAULT 'nuovo'
    CHECK (status IN ('nuovo', 'in_review', 'fatto'));

-- 2. Helper: returns true only for the platform owner (Ralph)
CREATE OR REPLACE FUNCTION public.is_platform_admin()
RETURNS boolean
LANGUAGE sql
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT EXISTS (
    SELECT 1 FROM auth.users
    WHERE id = auth.uid()
      AND email = 'raffaele.dinora0409@gmail.com'
  );
$$;

-- 3. Admin can read every note from every trainer
CREATE POLICY "admin_read_all"
  ON public.platform_feedback
  FOR SELECT
  USING (is_platform_admin());

-- 4. Admin can update status on any note
CREATE POLICY "admin_update_status"
  ON public.platform_feedback
  FOR UPDATE
  USING (is_platform_admin())
  WITH CHECK (is_platform_admin());
