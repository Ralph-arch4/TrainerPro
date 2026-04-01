-- ─── Performance indexes ──────────────────────────────────────────────────────
-- These speed up the most common queries made by TrainerPro.

-- clients: trainer lists their own clients
CREATE INDEX IF NOT EXISTS idx_clients_user_id
  ON clients (user_id);

-- workout_plans: loading all plans for a client
CREATE INDEX IF NOT EXISTS idx_workout_plans_client_id
  ON workout_plans (client_id);

-- exercise_logs: loading all logs for a plan
CREATE INDEX IF NOT EXISTS idx_exercise_logs_workout_plan_id
  ON exercise_logs (workout_plan_id);

-- exercise_logs: looking up logs by share token via join
CREATE INDEX IF NOT EXISTS idx_workout_plans_share_token
  ON workout_plans (share_token) WHERE share_token IS NOT NULL;

-- intake_forms: trainer dashboard loads by trainer_id
CREATE INDEX IF NOT EXISTS idx_intake_forms_trainer_id
  ON intake_forms (trainer_id);

-- intake_forms: token lookups (already UNIQUE, so already indexed — belt-and-braces)
CREATE INDEX IF NOT EXISTS idx_intake_forms_token
  ON intake_forms (token);

-- phases, diet_plans, measurements, notes: all load by client_id
CREATE INDEX IF NOT EXISTS idx_phases_client_id        ON phases        (client_id);
CREATE INDEX IF NOT EXISTS idx_diet_plans_client_id    ON diet_plans    (client_id);
CREATE INDEX IF NOT EXISTS idx_measurements_client_id  ON body_measurements  (client_id);
CREATE INDEX IF NOT EXISTS idx_notes_client_id         ON notes         (client_id);


-- ─── Soft delete for clients ──────────────────────────────────────────────────
-- Instead of permanently deleting a client, mark them with deleted_at.
-- This lets trainers recover deleted clients and preserves audit history.

ALTER TABLE clients
  ADD COLUMN IF NOT EXISTS deleted_at TIMESTAMPTZ;

-- Trainer queries should only return non-deleted clients by default.
-- The existing RLS policy (trainer_all) already limits by user_id.
-- Add a partial index so filtering out deleted rows is fast.
CREATE INDEX IF NOT EXISTS idx_clients_active
  ON clients (user_id)
  WHERE deleted_at IS NULL;


-- ─── Intake form: submission attempt counter ──────────────────────────────────
-- Tracks how many times a link has been opened; useful for analytics.
ALTER TABLE intake_forms
  ADD COLUMN IF NOT EXISTS view_count INTEGER NOT NULL DEFAULT 0;
