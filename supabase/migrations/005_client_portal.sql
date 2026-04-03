-- TrainerPro — Client Portal
-- Allows clients to view their diet plans via the workout plan share token.
-- Run this in the Supabase SQL Editor (idempotent — safe to re-run).

-- ─── Public read of diet_plans for clients whose trainer shared a plan ─────────
DROP POLICY IF EXISTS "diet_plans_public_read" ON public.diet_plans;
CREATE POLICY "diet_plans_public_read" ON public.diet_plans
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM public.workout_plans wp
      WHERE wp.client_id = diet_plans.client_id
        AND wp.share_token IS NOT NULL
    )
  );
