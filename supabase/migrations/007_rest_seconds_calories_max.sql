-- Add rest_seconds to workout_plans (default rest between sets in seconds)
ALTER TABLE public.workout_plans
  ADD COLUMN IF NOT EXISTS rest_seconds integer DEFAULT NULL;

-- Add calorie and macro range columns to diet_plans
ALTER TABLE public.diet_plans
  ADD COLUMN IF NOT EXISTS calories_max integer DEFAULT NULL,
  ADD COLUMN IF NOT EXISTS protein_max  numeric  DEFAULT NULL,
  ADD COLUMN IF NOT EXISTS carbs_max    numeric  DEFAULT NULL,
  ADD COLUMN IF NOT EXISTS fat_max      numeric  DEFAULT NULL;
