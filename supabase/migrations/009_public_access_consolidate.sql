-- TrainerPro — Public access consolidation (idempotent, safe to re-run)
-- Run this in Supabase SQL Editor if clients cannot access the portal.
-- Covers migrations 002 + 005 + 008 in one shot.

-- ── 1. supplements column (from migration 008) ────────────────────────────────
ALTER TABLE public.workout_plans
  ADD COLUMN IF NOT EXISTS supplements jsonb DEFAULT '[]'::jsonb;

-- ── 2. workout_plans: public read via share_token ─────────────────────────────
DROP POLICY IF EXISTS "workout_plans_public_read" ON public.workout_plans;
CREATE POLICY "workout_plans_public_read" ON public.workout_plans
  FOR SELECT USING (share_token IS NOT NULL);

-- ── 3. exercise_logs: anon can read + write logs for shared plans ─────────────
DROP POLICY IF EXISTS "exercise_logs_public" ON public.exercise_logs;
CREATE POLICY "exercise_logs_public" ON public.exercise_logs
  FOR ALL USING (
    EXISTS (
      SELECT 1 FROM public.workout_plans wp
      WHERE wp.id = workout_plan_id AND wp.share_token IS NOT NULL
    )
  );

-- ── 4. diet_plans: anon can read active plans for clients with a shared plan ──
DROP POLICY IF EXISTS "diet_plans_public_read" ON public.diet_plans;
CREATE POLICY "diet_plans_public_read" ON public.diet_plans
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM public.workout_plans wp
      WHERE wp.client_id = diet_plans.client_id
        AND wp.share_token IS NOT NULL
    )
  );
