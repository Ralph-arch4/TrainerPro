-- TrainerPro — Day Labels for workout plans
-- Allows trainers to rename "Giorno 1" → "Pull Day", etc.
-- Run this in the Supabase SQL Editor (idempotent — safe to re-run).

ALTER TABLE public.workout_plans
  ADD COLUMN IF NOT EXISTS day_labels jsonb DEFAULT NULL;
