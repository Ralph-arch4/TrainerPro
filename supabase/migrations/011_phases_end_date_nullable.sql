-- TrainerPro — Make phases.end_date nullable (idempotent, safe to re-run)
-- Reason: a trainer may start a phase (e.g. bulk) without knowing the exact end date.
-- The UI can show "In corso" when end_date is NULL.
ALTER TABLE public.phases
  ALTER COLUMN end_date DROP NOT NULL;

