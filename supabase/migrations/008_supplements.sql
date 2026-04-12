-- TrainerPro — Supplements (recommended products per workout plan)
-- Safe to re-run (idempotent)

-- Add supplements JSONB column to workout_plans
ALTER TABLE public.workout_plans
  ADD COLUMN IF NOT EXISTS supplements jsonb DEFAULT '[]'::jsonb;
