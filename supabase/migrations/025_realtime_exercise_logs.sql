-- TrainerPro — Realtime updates of client logs for the trainer (idempotent)
-- Run this in the Supabase SQL Editor.
--
-- The trainer dashboard subscribes to changes on exercise_logs, so sets, reps,
-- session times and notes saved by the client from the portal show up without
-- a page reload. Supabase only pushes changes for tables in the
-- supabase_realtime publication. RLS still applies: a trainer receives only
-- rows of their own plans (policy exercise_logs_owner).
--
-- Without this migration the dashboard still refreshes every 20 seconds and
-- whenever the tab regains focus.

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_publication_tables
    WHERE pubname = 'supabase_realtime' AND schemaname = 'public' AND tablename = 'exercise_logs'
  ) THEN
    ALTER PUBLICATION supabase_realtime ADD TABLE public.exercise_logs;
  END IF;
END $$;
