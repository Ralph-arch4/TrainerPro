-- TrainerPro — Hardening + open-ended plan support (idempotent, safe to re-run)
-- Run this in the Supabase SQL Editor.
--
-- 1. get_portal_data no longer leaks the full workout_plans row (user_id,
--    phase_id, timestamps): it returns only the columns the portal pages use.
-- 2. Drop the anon INSERT policy on exercise_logs: it only checked that the
--    plan HAS a share token, not that the caller knows it, so anyone with a
--    plan UUID could write logs. All client writes go through the
--    SECURITY DEFINER RPC upsert_exercise_log, which needs no policy.
-- 3. Raise the week_number cap from 52 to 260 so open-ended plans
--    (total_weeks = 0) don't hit a wall after one year.
-- 4. Opportunistic cleanup of expired rate-limit windows so the table
--    doesn't grow forever.

-- ── 1. Portal RPC: explicit column list ───────────────────────────────────────
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
    'plan', json_build_object(
      'id',            v_plan.id,
      'name',          v_plan.name,
      'description',   v_plan.description,
      'days_per_week', v_plan.days_per_week,
      'total_weeks',   v_plan.total_weeks,
      'exercises',     v_plan.exercises,
      'share_token',   v_plan.share_token,
      'client_id',     v_plan.client_id,
      'day_labels',    v_plan.day_labels,
      'supplements',   v_plan.supplements
    ),
    'logs',         COALESCE(v_logs, '[]'::json),
    'diets',        COALESCE(v_diet, '[]'::json),
    'trainer_name', COALESCE(v_trainer_name, 'Trainer')
  );
END;
$$;

GRANT EXECUTE ON FUNCTION public.get_portal_data(text) TO anon;

-- ── 2. Remove over-permissive anon INSERT policy ──────────────────────────────
DROP POLICY IF EXISTS "exercise_logs_anon_insert" ON public.exercise_logs;
-- (exercise_logs_public was already dropped by migration 010; repeat for safety)
DROP POLICY IF EXISTS "exercise_logs_public" ON public.exercise_logs;

-- ── 3. Raise week_number cap for open-ended plans ─────────────────────────────
ALTER TABLE public.exercise_logs
  DROP CONSTRAINT IF EXISTS exercise_logs_week_number_check;
ALTER TABLE public.exercise_logs
  ADD CONSTRAINT exercise_logs_week_number_check
  CHECK (week_number >= 1 AND week_number <= 260);

-- ── 4. Rate-limit window cleanup inside check_rate_limit ─────────────────────
create or replace function check_rate_limit(
  p_key        text,
  p_limit      int,
  p_window_sec int
)
returns boolean
language plpgsql
security definer
as $$
declare
  v_count    integer;
  v_reset_at timestamptz;
begin
  -- Opportunistic GC: ~1% of calls purge windows expired for over a day
  if random() < 0.01 then
    delete from rate_limit_windows where reset_at < now() - interval '1 day';
  end if;

  select count, reset_at
  into   v_count, v_reset_at
  from   rate_limit_windows
  where  key = p_key
  for update;

  if not found or now() > v_reset_at then
    insert into rate_limit_windows(key, count, reset_at)
    values (p_key, 1, now() + (p_window_sec || ' seconds')::interval)
    on conflict (key) do update
      set count    = 1,
          reset_at = now() + (p_window_sec || ' seconds')::interval;
    return true;
  end if;

  if v_count >= p_limit then
    return false;
  end if;

  update rate_limit_windows set count = count + 1 where key = p_key;
  return true;
end;
$$;
