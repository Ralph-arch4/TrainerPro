-- TrainerPro — Expose trainer full_name in get_portal_data RPC
-- Joins profiles to return the trainer's display name to the client portal.

CREATE OR REPLACE FUNCTION public.get_portal_data(p_token text)
RETURNS json
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_plan          public.workout_plans%ROWTYPE;
  v_logs          json;
  v_diet          json;
  v_trainer_name  text;
BEGIN
  SELECT * INTO v_plan
  FROM public.workout_plans
  WHERE share_token = p_token
  LIMIT 1;

  IF v_plan IS NULL THEN
    RETURN json_build_object('error', 'not_found');
  END IF;

  SELECT full_name INTO v_trainer_name
  FROM public.profiles
  WHERE id = v_plan.user_id;

  SELECT json_agg(row_to_json(l)) INTO v_logs
  FROM public.exercise_logs l
  WHERE l.workout_plan_id = v_plan.id;

  SELECT json_agg(row_to_json(d) ORDER BY d.created_at DESC) INTO v_diet
  FROM public.diet_plans d
  WHERE d.client_id = v_plan.client_id
    AND d.active = true;

  RETURN json_build_object(
    'plan',         row_to_json(v_plan),
    'logs',         COALESCE(v_logs, '[]'::json),
    'diets',        COALESCE(v_diet, '[]'::json),
    'trainer_name', COALESCE(v_trainer_name, 'Trainer')
  );
END;
$$;
