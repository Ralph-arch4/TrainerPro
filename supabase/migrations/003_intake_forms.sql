-- ─── Intake Forms ─────────────────────────────────────────────────────────────
-- Trainers create intake links; clients fill the form without logging in.

CREATE TABLE IF NOT EXISTS intake_forms (
  id           UUID        PRIMARY KEY DEFAULT gen_random_uuid(),
  trainer_id   UUID        NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  token        TEXT        UNIQUE NOT NULL DEFAULT encode(gen_random_bytes(24), 'hex'),
  label        TEXT,                                   -- trainer's internal label
  status       TEXT        NOT NULL DEFAULT 'pending', -- 'pending' | 'submitted'
  response     JSONB,                                  -- all client answers
  submitted_at TIMESTAMPTZ,
  created_at   TIMESTAMPTZ NOT NULL DEFAULT now()
);

ALTER TABLE intake_forms ENABLE ROW LEVEL SECURITY;

-- Trainers: full access to their own forms
CREATE POLICY "trainer_all" ON intake_forms
  FOR ALL TO authenticated
  USING  (trainer_id = auth.uid())
  WITH CHECK (trainer_id = auth.uid());

-- Anon: read any form by token (the query filter .eq("token", t) restricts to one row)
CREATE POLICY "anon_read" ON intake_forms
  FOR SELECT TO anon
  USING (true);

-- Anon: submit (update) a still-pending form
CREATE POLICY "anon_submit" ON intake_forms
  FOR UPDATE TO anon
  USING  (status = 'pending')
  WITH CHECK (true);
