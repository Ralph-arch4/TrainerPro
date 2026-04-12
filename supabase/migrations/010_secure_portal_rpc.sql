-- TrainerPro — Secure portal access via RPC (idempotent, safe to re-run)
-- Replaces direct table access for client portals with a token-validated function.
-- Run this in Supabase SQL Editor.

-- ── 1. Revoke direct anon SELECT on workout_plans (prevent enumeration) ────────
DROP POLICY IF EXISTS "workout_plans_public_read" ON public.workout_plans;

-- ── 2. Revoke direct anon SELECT on exercise_logs ─────────────────────────────
DROP POLICY IF EXISTS "exercise_logs_public" ON public.exercise_logs;

-- ── 3. Revoke direct anon SELECT on diet_plans ────────────────────────────────
DROP POLICY IF EXISTS "diet_plans_public_read" ON public.diet_plans;

-- ── 4. Create secure RPC: get_portal_data(token) ─────────────────────────────
-- Returns plan + exercises + logs + diet for a specific share token.
-- SECURITY DEFINER bypasses RLS; the function itself validates the token.
-- Only data for that exact token is returned — no enumeration possible.
CREATE OR REPLACE FUNCTION public.get_portal_data(p_token text)
RETURNS json
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_plan     public.workout_plans%ROWTYPE;
  v_logs     json;
  v_diet     json;
BEGIN
  -- Validate token and fetch plan
  SELECT * INTO v_plan
  FROM public.workout_plans
  WHERE share_token = p_token
  LIMIT 1;

  IF v_plan IS NULL THEN
    RETURN json_build_object('error', 'not_found');
  END IF;

  -- Fetch exercise logs for this plan only
  SELECT json_agg(row_to_json(l)) INTO v_logs
  FROM public.exercise_logs l
  WHERE l.workout_plan_id = v_plan.id;

  -- Fetch active diet plan for this client only
  SELECT json_agg(row_to_json(d) ORDER BY d.created_at DESC) INTO v_diet
  FROM public.diet_plans d
  WHERE d.client_id = v_plan.client_id
    AND d.active = true;

  RETURN json_build_object(
    'plan', row_to_json(v_plan),
    'logs', COALESCE(v_logs, '[]'::json),
    'diets', COALESCE(v_diet, '[]'::json)
  );
END;
$$;

-- Grant execute to anon role only (not other roles)
GRANT EXECUTE ON FUNCTION public.get_portal_data(text) TO anon;

-- ── 5. Keep exercise_logs INSERT open for anon (clients log weights) ──────────
-- But restrict to plans that have a share_token (no phantom inserts)
DROP POLICY IF EXISTS "exercise_logs_anon_insert" ON public.exercise_logs;
CREATE POLICY "exercise_logs_anon_insert" ON public.exercise_logs
  FOR INSERT WITH CHECK (
    EXISTS (
      SELECT 1 FROM public.workout_plans wp
      WHERE wp.id = workout_plan_id AND wp.share_token IS NOT NULL
    )
  );

-- ── 6. Keep authenticated trainer full access (unchanged) ─────────────────────
DROP POLICY IF EXISTS "exercise_logs_owner" ON public.exercise_logs;
CREATE POLICY "exercise_logs_owner" ON public.exercise_logs
  FOR ALL USING (
    EXISTS (
      SELECT 1 FROM public.workout_plans wp
      WHERE wp.id = workout_plan_id AND wp.user_id = auth.uid()
    )
  );
