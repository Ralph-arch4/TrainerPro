-- TrainerPro — Scaling indexes (idempotent, safe to re-run)
-- Run this in the Supabase SQL Editor.
--
-- Supports the data-loading access patterns that appear once a trainer has many
-- clients / many logs. All indexes use IF NOT EXISTS so re-running is a no-op.

-- SupabaseDataLoader loads exercise_logs with:
--   WHERE workout_plan_id = ANY(...) ORDER BY logged_at ASC
-- A composite (workout_plan_id, logged_at) lets Postgres scan each plan's rows
-- already ordered, instead of a filter + separate sort of the whole set.
CREATE INDEX IF NOT EXISTS idx_exercise_logs_plan_logged_at
  ON public.exercise_logs (workout_plan_id, logged_at);

-- Belt-and-braces: ensure the child-table client_id indexes from migration 004
-- exist in prod (the loader filters every child table by client_id IN (...)).
CREATE INDEX IF NOT EXISTS idx_workout_plans_client_id ON public.workout_plans (client_id);
CREATE INDEX IF NOT EXISTS idx_phases_client_id        ON public.phases (client_id);
CREATE INDEX IF NOT EXISTS idx_diet_plans_client_id    ON public.diet_plans (client_id);
CREATE INDEX IF NOT EXISTS idx_measurements_client_id  ON public.body_measurements (client_id);
CREATE INDEX IF NOT EXISTS idx_notes_client_id         ON public.notes (client_id);

-- The clients list / dashboard always scopes by the authenticated trainer.
CREATE INDEX IF NOT EXISTS idx_clients_user_id ON public.clients (user_id);
