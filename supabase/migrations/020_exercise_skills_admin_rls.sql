-- Add admin-only INSERT/UPDATE/DELETE policies on public.exercise_skills.
-- Public SELECT policy already exists per 005_ios_sync_columns.sql.
-- Pattern mirrors 002_add_admin_rls_policies.sql / 003_complete_admin_fix.sql
-- (uses public.is_admin() helper defined in 003).

ALTER TABLE public.exercise_skills ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Admins can insert exercise_skills" ON public.exercise_skills;
DROP POLICY IF EXISTS "Admins can update exercise_skills" ON public.exercise_skills;
DROP POLICY IF EXISTS "Admins can delete exercise_skills" ON public.exercise_skills;

CREATE POLICY "Admins can insert exercise_skills"
  ON public.exercise_skills
  FOR INSERT
  WITH CHECK (public.is_admin() = true);

CREATE POLICY "Admins can update exercise_skills"
  ON public.exercise_skills
  FOR UPDATE
  USING (public.is_admin() = true)
  WITH CHECK (public.is_admin() = true);

CREATE POLICY "Admins can delete exercise_skills"
  ON public.exercise_skills
  FOR DELETE
  USING (public.is_admin() = true);

GRANT INSERT, UPDATE, DELETE ON public.exercise_skills TO authenticated;
