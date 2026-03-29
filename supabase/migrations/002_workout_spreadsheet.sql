-- TrainerPro — Workout Spreadsheet (exercise logs + share tokens)
-- Run this in the Supabase SQL Editor (idempotent — safe to re-run)

-- ─── Add share_token + logs columns to workout_plans ─────────────────────────
ALTER TABLE public.workout_plans ADD COLUMN IF NOT EXISTS share_token text;
ALTER TABLE public.workout_plans ADD COLUMN IF NOT EXISTS total_weeks integer NOT NULL DEFAULT 12;

CREATE UNIQUE INDEX IF NOT EXISTS workout_plans_share_token_idx
  ON public.workout_plans(share_token) WHERE share_token IS NOT NULL;

-- Allow anonymous SELECT of shared workout plans (share link is the auth)
DROP POLICY IF EXISTS "workout_plans_public_read" ON public.workout_plans;
CREATE POLICY "workout_plans_public_read" ON public.workout_plans
  FOR SELECT USING (share_token IS NOT NULL);

-- ─── Exercise logs table ──────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS public.exercise_logs (
  id              uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  workout_plan_id uuid REFERENCES public.workout_plans(id) ON DELETE CASCADE NOT NULL,
  exercise_id     text NOT NULL,
  week_number     integer NOT NULL CHECK (week_number >= 1 AND week_number <= 52),
  weight          numeric(6,2),
  reps            text,
  note            text,
  logged_at       timestamptz DEFAULT now(),
  UNIQUE(workout_plan_id, exercise_id, week_number)
);

ALTER TABLE public.exercise_logs ENABLE ROW LEVEL SECURITY;

-- Authenticated trainers can manage logs for their own plans
DROP POLICY IF EXISTS "exercise_logs_owner" ON public.exercise_logs;
CREATE POLICY "exercise_logs_owner" ON public.exercise_logs
  FOR ALL USING (
    EXISTS (
      SELECT 1 FROM public.workout_plans wp
      WHERE wp.id = workout_plan_id AND wp.user_id = auth.uid()
    )
  );

-- Anonymous clients can read/write logs for any shared plan (token = auth)
DROP POLICY IF EXISTS "exercise_logs_public" ON public.exercise_logs;
CREATE POLICY "exercise_logs_public" ON public.exercise_logs
  FOR ALL USING (
    EXISTS (
      SELECT 1 FROM public.workout_plans wp
      WHERE wp.id = workout_plan_id AND wp.share_token IS NOT NULL
    )
  );
