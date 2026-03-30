-- ─── Intake Forms ─────────────────────────────────────────────────────────────
-- Trainers create intake links; clients submit via server-side API route
-- (service role key), so no anon RLS policies are needed.

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

-- Trainers: full CRUD access to their own forms
CREATE POLICY "trainer_all" ON intake_forms
  FOR ALL TO authenticated
  USING  (trainer_id = auth.uid())
  WITH CHECK (trainer_id = auth.uid());

-- Note: client form reads/submits go through /api/intake/[token]
-- which uses SUPABASE_SERVICE_ROLE_KEY server-side and bypasses RLS entirely.
-- No anon policies needed.
