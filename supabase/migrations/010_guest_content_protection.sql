-- =============================================================================
-- GUEST CONTENT PROTECTION
-- Adds is_preview flag to exercises and restricts anonymous access to previews only.
-- =============================================================================

-- STEP 1: Add is_preview column to exercises
-- =============================================================================
ALTER TABLE public.exercises
  ADD COLUMN IF NOT EXISTS is_preview BOOLEAN DEFAULT false NOT NULL;

CREATE INDEX IF NOT EXISTS idx_exercises_is_preview ON public.exercises(is_preview);

-- STEP 2: Mark the 2 easiest exercises per category as preview
-- =============================================================================
WITH ranked AS (
  SELECT e.id, s.category_id,
    ROW_NUMBER() OVER (
      PARTITION BY s.category_id
      ORDER BY e.difficulty ASC, e.id ASC
    ) AS rn
  FROM public.exercises e
  JOIN public.skills s ON e.skill_id = s.id
)
UPDATE public.exercises
SET is_preview = true
WHERE id IN (SELECT id FROM ranked WHERE rn <= 2);

-- STEP 3: RPC function for guest exercise counts per category
-- Returns total and preview counts so the app can show "N more with an account"
-- Uses SECURITY DEFINER to bypass RLS and return aggregate counts.
-- =============================================================================
CREATE OR REPLACE FUNCTION public.guest_exercise_counts()
RETURNS TABLE(category_id INT, total_count BIGINT, preview_count BIGINT)
LANGUAGE sql SECURITY DEFINER STABLE AS $$
  SELECT
    s.category_id,
    COUNT(*)::BIGINT AS total_count,
    COUNT(*) FILTER (WHERE e.is_preview = true)::BIGINT AS preview_count
  FROM public.exercises e
  JOIN public.skills s ON e.skill_id = s.id
  GROUP BY s.category_id;
$$;

GRANT EXECUTE ON FUNCTION public.guest_exercise_counts() TO anon, authenticated;

-- STEP 4: Replace open SELECT policy with split anon/authenticated policies
-- =============================================================================

-- Drop existing open SELECT policies (from migrations 003 and 20260315)
DROP POLICY IF EXISTS "Anyone can view exercises" ON public.exercises;
DROP POLICY IF EXISTS "Allow anon read" ON public.exercises;

-- Authenticated users see everything
CREATE POLICY "Authenticated users can view all exercises"
  ON public.exercises
  FOR SELECT
  TO authenticated
  USING (true);

-- Anonymous users see only preview exercises
CREATE POLICY "Anonymous users can view preview exercises"
  ON public.exercises
  FOR SELECT
  TO anon
  USING (is_preview = true);
