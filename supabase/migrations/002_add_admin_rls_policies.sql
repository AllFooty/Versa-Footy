-- Migration: Add RLS policies for admin operations on categories, skills, exercises tables
-- and storage bucket policies for exercise videos

-- ============================================
-- CATEGORIES TABLE RLS POLICIES
-- ============================================

-- Enable RLS on categories (if not already enabled)
ALTER TABLE public.categories ENABLE ROW LEVEL SECURITY;

-- Allow anyone (including anonymous) to read categories
CREATE POLICY "Anyone can view categories"
  ON public.categories
  FOR SELECT
  USING (true);

-- Allow admins to insert categories
CREATE POLICY "Admins can insert categories"
  ON public.categories
  FOR INSERT
  WITH CHECK (public.is_admin() = true);

-- Allow admins to update categories
CREATE POLICY "Admins can update categories"
  ON public.categories
  FOR UPDATE
  USING (public.is_admin() = true)
  WITH CHECK (public.is_admin() = true);

-- Allow admins to delete categories
CREATE POLICY "Admins can delete categories"
  ON public.categories
  FOR DELETE
  USING (public.is_admin() = true);

-- ============================================
-- SKILLS TABLE RLS POLICIES
-- ============================================

-- Enable RLS on skills (if not already enabled)
ALTER TABLE public.skills ENABLE ROW LEVEL SECURITY;

-- Allow anyone (including anonymous) to read skills
CREATE POLICY "Anyone can view skills"
  ON public.skills
  FOR SELECT
  USING (true);

-- Allow admins to insert skills
CREATE POLICY "Admins can insert skills"
  ON public.skills
  FOR INSERT
  WITH CHECK (public.is_admin() = true);

-- Allow admins to update skills
CREATE POLICY "Admins can update skills"
  ON public.skills
  FOR UPDATE
  USING (public.is_admin() = true)
  WITH CHECK (public.is_admin() = true);

-- Allow admins to delete skills
CREATE POLICY "Admins can delete skills"
  ON public.skills
  FOR DELETE
  USING (public.is_admin() = true);

-- ============================================
-- EXERCISES TABLE RLS POLICIES
-- ============================================

-- Enable RLS on exercises (if not already enabled)
ALTER TABLE public.exercises ENABLE ROW LEVEL SECURITY;

-- Allow anyone (including anonymous) to read exercises
CREATE POLICY "Anyone can view exercises"
  ON public.exercises
  FOR SELECT
  USING (true);

-- Allow admins to insert exercises
CREATE POLICY "Admins can insert exercises"
  ON public.exercises
  FOR INSERT
  WITH CHECK (public.is_admin() = true);

-- Allow admins to update exercises
CREATE POLICY "Admins can update exercises"
  ON public.exercises
  FOR UPDATE
  USING (public.is_admin() = true)
  WITH CHECK (public.is_admin() = true);

-- Allow admins to delete exercises
CREATE POLICY "Admins can delete exercises"
  ON public.exercises
  FOR DELETE
  USING (public.is_admin() = true);

-- ============================================
-- STORAGE BUCKET POLICIES FOR EXERCISE VIDEOS
-- ============================================

-- Create the storage bucket if it doesn't exist (run this in Supabase dashboard SQL editor)
-- INSERT INTO storage.buckets (id, name, public) VALUES ('exercise-videos', 'exercise-videos', true)
-- ON CONFLICT (id) DO NOTHING;

-- Allow anyone to view/download exercise videos (public bucket)
CREATE POLICY "Anyone can view exercise videos"
  ON storage.objects
  FOR SELECT
  USING (bucket_id = 'exercise-videos');

-- Allow admins to upload exercise videos
CREATE POLICY "Admins can upload exercise videos"
  ON storage.objects
  FOR INSERT
  WITH CHECK (
    bucket_id = 'exercise-videos' 
    AND public.is_admin() = true
  );

-- Allow admins to update exercise videos
CREATE POLICY "Admins can update exercise videos"
  ON storage.objects
  FOR UPDATE
  USING (
    bucket_id = 'exercise-videos' 
    AND public.is_admin() = true
  )
  WITH CHECK (
    bucket_id = 'exercise-videos' 
    AND public.is_admin() = true
  );

-- Allow admins to delete exercise videos
CREATE POLICY "Admins can delete exercise videos"
  ON storage.objects
  FOR DELETE
  USING (
    bucket_id = 'exercise-videos' 
    AND public.is_admin() = true
  );

-- ============================================
-- GRANT PERMISSIONS
-- ============================================

-- Grant necessary table permissions to authenticated users
GRANT SELECT ON public.categories TO authenticated;
GRANT SELECT ON public.skills TO authenticated;
GRANT SELECT ON public.exercises TO authenticated;

GRANT INSERT, UPDATE, DELETE ON public.categories TO authenticated;
GRANT INSERT, UPDATE, DELETE ON public.skills TO authenticated;
GRANT INSERT, UPDATE, DELETE ON public.exercises TO authenticated;

-- Also grant SELECT to anon role for public read access
GRANT SELECT ON public.categories TO anon;
GRANT SELECT ON public.skills TO anon;
GRANT SELECT ON public.exercises TO anon;

-- Grant usage on sequences for auto-increment IDs
GRANT USAGE, SELECT ON ALL SEQUENCES IN SCHEMA public TO authenticated;
