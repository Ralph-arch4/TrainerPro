-- Add rest_seconds to workout_plans (default rest between sets in seconds)
ALTER TABLE public.workout_plans
  ADD COLUMN IF NOT EXISTS rest_seconds integer DEFAULT NULL;

-- Add calories_max to diet_plans (for calorie range display)
ALTER TABLE public.diet_plans
  ADD COLUMN IF NOT EXISTS calories_max integer DEFAULT NULL;
