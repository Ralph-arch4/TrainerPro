-- Migration 021: Add tier as a generated column on fitness_scans
-- The tier is stored inside ai_analysis JSONB, but we also expose it as a
-- lightweight generated column so we can query/filter by tier without
-- loading the full JSONB in list queries.

-- Tier is computed deterministically in TypeScript (lib/tier-system.ts).
-- This column is populated via UPDATE when the AI analysis is saved.
-- It is NOT a Postgres generated column (body_fat_est lives inside JSONB)
-- so we use a regular nullable column updated by the API route.

ALTER TABLE fitness_scans
  ADD COLUMN IF NOT EXISTS tier TEXT
  CHECK (tier IS NULL OR tier IN ('E','D','C','B','A','S'));

COMMENT ON COLUMN fitness_scans.tier IS
  'Solo Leveling rank (E→S). Computed from ai_analysis.body_fat_est + muscle_mass_est.';

-- Index to support leaderboard / ranking queries per trainer
CREATE INDEX IF NOT EXISTS fitness_scans_tier_user
  ON fitness_scans(user_id, tier)
  WHERE tier IS NOT NULL;
