-- ============================================
-- Migration 005: iOS App Sync Columns
-- Adds columns needed for iOS mastery system and progress sync
-- Run this in Supabase SQL Editor (Dashboard > SQL Editor > New query)
-- ============================================

-- ============================================
-- 1. SKILL_PROGRESS — Add iOS mastery tracking columns
-- iOS mastery criteria: 8+ completions with avg rating >= 4.5
-- ============================================
ALTER TABLE public.skill_progress
  ADD COLUMN IF NOT EXISTS high_rated_completions INTEGER DEFAULT 0 NOT NULL,
  ADD COLUMN IF NOT EXISTS nailed_completions INTEGER DEFAULT 0 NOT NULL,
  ADD COLUMN IF NOT EXISTS total_rating_sum INTEGER DEFAULT 0 NOT NULL;

-- Column mapping:
--   times_practiced     ↔ iOS totalCompletions
--   high_rated_completions ↔ iOS highRatedCompletions (rating >= 4)
--   nailed_completions  ↔ iOS nailedCompletions (rating = 5)
--   total_rating_sum    ↔ iOS totalRatingSum (sum of all ratings)
--   mastered_at         ↔ iOS masteredAt
--   last_practiced_at   ↔ iOS lastPracticedAt
--   status              ↔ derived from mastery check

-- ============================================
-- 2. DAILY_ACTIVITY — Add practice minutes tracking
-- iOS tracks total practice time per day
-- ============================================
ALTER TABLE public.daily_activity
  ADD COLUMN IF NOT EXISTS practice_minutes INTEGER DEFAULT 0 NOT NULL;

-- ============================================
-- 3. EXERCISE_COMPLETIONS — Add duration tracking
-- iOS records how long each exercise took
-- ============================================
ALTER TABLE public.exercise_completions
  ADD COLUMN IF NOT EXISTS duration_seconds INTEGER DEFAULT 0;

-- ============================================
-- 4. EXERCISE_SKILLS — Ensure junction table exists
-- (May already exist if you ran supabase_migration_exercise_skills.sql)
-- ============================================
CREATE TABLE IF NOT EXISTS exercise_skills (
  id SERIAL PRIMARY KEY,
  exercise_id INT NOT NULL REFERENCES exercises(id) ON DELETE CASCADE,
  skill_id INT NOT NULL REFERENCES skills(id) ON DELETE CASCADE,
  created_at TIMESTAMPTZ DEFAULT now(),
  UNIQUE(exercise_id, skill_id)
);

-- Enable RLS (public read access)
ALTER TABLE exercise_skills ENABLE ROW LEVEL SECURITY;

-- Only create policy if it doesn't exist (safe re-run)
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies
    WHERE tablename = 'exercise_skills' AND policyname = 'Allow public read access'
  ) THEN
    CREATE POLICY "Allow public read access"
      ON exercise_skills
      FOR SELECT
      USING (true);
  END IF;
END $$;

-- Create indexes (IF NOT EXISTS handles re-runs)
CREATE INDEX IF NOT EXISTS idx_exercise_skills_exercise_id ON exercise_skills(exercise_id);
CREATE INDEX IF NOT EXISTS idx_exercise_skills_skill_id ON exercise_skills(skill_id);

-- Migrate any existing single-skill data into junction table (safe re-run)
INSERT INTO exercise_skills (exercise_id, skill_id)
SELECT id, skill_id FROM exercises WHERE skill_id IS NOT NULL
ON CONFLICT (exercise_id, skill_id) DO NOTHING;

-- Grant permissions
GRANT SELECT ON exercise_skills TO authenticated;
GRANT SELECT ON exercise_skills TO anon;

-- ============================================
-- 5. VERIFY
-- ============================================
SELECT 'skill_progress columns' AS check_name,
       count(*) FILTER (WHERE column_name = 'high_rated_completions') AS high_rated,
       count(*) FILTER (WHERE column_name = 'nailed_completions') AS nailed,
       count(*) FILTER (WHERE column_name = 'total_rating_sum') AS rating_sum
FROM information_schema.columns
WHERE table_name = 'skill_progress' AND table_schema = 'public';

SELECT 'daily_activity columns' AS check_name,
       count(*) FILTER (WHERE column_name = 'practice_minutes') AS practice_min
FROM information_schema.columns
WHERE table_name = 'daily_activity' AND table_schema = 'public';

SELECT 'exercise_completions columns' AS check_name,
       count(*) FILTER (WHERE column_name = 'duration_seconds') AS duration_sec
FROM information_schema.columns
WHERE table_name = 'exercise_completions' AND table_schema = 'public';

SELECT 'exercise_skills rows' AS check_name, count(*) AS row_count
FROM exercise_skills;
