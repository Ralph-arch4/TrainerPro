-- TrainerPro — Platform feedback notes (Talk with Ralph)
-- Trainers can log bugs, improvements and ideas visible only to them.
-- Ralph (platform owner) reads them to prioritise development.

CREATE TABLE IF NOT EXISTS public.platform_feedback (
  id          uuid        PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id     uuid        NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  title       text        NOT NULL,
  category    text        NOT NULL DEFAULT 'improvement'
              CHECK (category IN ('bug', 'improvement', 'idea')),
  description text        NOT NULL,
  created_at  timestamptz DEFAULT now()
);

ALTER TABLE public.platform_feedback ENABLE ROW LEVEL SECURITY;

CREATE POLICY "feedback_own"
  ON public.platform_feedback
  FOR ALL
  USING  (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);
