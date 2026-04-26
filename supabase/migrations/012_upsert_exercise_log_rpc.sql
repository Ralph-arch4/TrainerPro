-- TrainerPro — Secure upsert RPC for client portal exercise logs
-- Problem: migration 010 created only a FOR INSERT policy for anon users.
-- PostgreSQL UPSERT (INSERT ON CONFLICT DO UPDATE) requires an UPDATE policy too.
-- Without it, the first log save works but every subsequent update fails silently.
-- Fix: SECURITY DEFINER function that validates the share token then writes freely.
-- Run this in Supabase SQL Editor.

CREATE OR REPLACE FUNCTION public.upsert_exercise_log(
  p_token       text,
  p_exercise_id text,
  p_week_number int,
  p_weight      numeric DEFAULT NULL,
  p_reps        text    DEFAULT NULL,
  p_note        text    DEFAULT NULL
) RETURNS json
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_plan_id uuid;
  v_log_id  uuid;
BEGIN
  SELECT id INTO v_plan_id
  FROM public.workout_plans
  WHERE share_token = p_token
  LIMIT 1;

  IF v_plan_id IS NULL THEN
    RETURN json_build_object('error', 'not_found');
  END IF;

  INSERT INTO public.exercise_logs
    (workout_plan_id, exercise_id, week_number, weight, reps, note, logged_at)
  VALUES
    (v_plan_id, p_exercise_id, p_week_number, p_weight, p_reps, p_note, now())
  ON CONFLICT (workout_plan_id, exercise_id, week_number)
  DO UPDATE SET
    weight    = EXCLUDED.weight,
    reps      = EXCLUDED.reps,
    note      = EXCLUDED.note,
    logged_at = EXCLUDED.logged_at
  RETURNING id INTO v_log_id;

  RETURN json_build_object('id', v_log_id);
END;
$$;

GRANT EXECUTE ON FUNCTION public.upsert_exercise_log(text, text, int, numeric, text, text) TO anon;
