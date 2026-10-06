-- TrainerPro — Superserie + blocchi Cardio / Addome nelle schede (idempotent)
-- Run this in the Supabase SQL Editor.
--
-- Exercises live in workout_plans.exercises (JSONB array), so the new fields
-- need no new columns. This migration documents the element shape and
-- normalises legacy superset letters (lowercase / spaces) so grouping is
-- consistent across trainer and client views.
--
-- Element shape (all new keys optional; missing "kind" = "strength"):
--   {
--     "id": text, "name": text, "day": int, "order": int,
--     "sets": int, "targetReps": text, "perSetReps": text[],
--     "restSeconds": text, "notes": text, "videoUrl": text, "muscleGroup": text,
--     "supersetGroup": "A".."H"     -- same letter + adjacent = superserie
--     "kind": "strength" | "cardio" | "core",
--     "duration": text,             -- cardio: minutes, e.g. "20" or "15-20"
--     "intensity": text             -- cardio: e.g. "Zona 2", "130-140 bpm"
--   }
-- Cardio logs (exercise_logs) store the minutes done in `reps` as plain text.

COMMENT ON COLUMN public.workout_plans.exercises IS
  'JSONB array of exercises. Keys: id, name, day, order, sets, targetReps, perSetReps, restSeconds, notes, videoUrl, muscleGroup, supersetGroup (A-H, adjacent = superserie), kind (strength|cardio|core, default strength), duration (cardio min), intensity (cardio).';

-- Normalise superset letters: trim + uppercase; drop empty strings.
UPDATE public.workout_plans wp
SET exercises = sub.fixed
FROM (
  SELECT p.id,
         jsonb_agg(
           CASE
             WHEN e ? 'supersetGroup' AND btrim(coalesce(e->>'supersetGroup', '')) = ''
               THEN e - 'supersetGroup'
             WHEN e ? 'supersetGroup'
               THEN jsonb_set(e, '{supersetGroup}', to_jsonb(upper(btrim(e->>'supersetGroup'))))
             ELSE e
           END
           ORDER BY ord
         ) AS fixed
  FROM public.workout_plans p
  CROSS JOIN LATERAL jsonb_array_elements(CASE WHEN jsonb_typeof(p.exercises) = 'array' THEN p.exercises ELSE '[]'::jsonb END) WITH ORDINALITY AS t(e, ord)
  WHERE jsonb_typeof(p.exercises) = 'array'
    AND EXISTS (
      SELECT 1 FROM jsonb_array_elements(CASE WHEN jsonb_typeof(p.exercises) = 'array' THEN p.exercises ELSE '[]'::jsonb END) x
      WHERE x ? 'supersetGroup'
        AND ((x->>'supersetGroup') IS DISTINCT FROM upper(btrim(x->>'supersetGroup'))
             OR btrim(coalesce(x->>'supersetGroup', '')) = '')
    )
  GROUP BY p.id
) sub
WHERE wp.id = sub.id;
