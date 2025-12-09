-- ============================================================================
-- COMPLETE FIX FOR ADMIN RLS POLICIES
-- Run this ENTIRE script in Supabase SQL Editor
-- ============================================================================

-- ============================================================================
-- STEP 1: Drop ALL existing policies on the tables (clean slate)
-- ============================================================================

-- Drop all policies on categories
DO $$ 
DECLARE
    pol RECORD;
BEGIN
    FOR pol IN SELECT policyname FROM pg_policies WHERE tablename = 'categories' AND schemaname = 'public'
    LOOP
        EXECUTE format('DROP POLICY IF EXISTS %I ON public.categories', pol.policyname);
    END LOOP;
END $$;

-- Drop all policies on skills
DO $$ 
DECLARE
    pol RECORD;
BEGIN
    FOR pol IN SELECT policyname FROM pg_policies WHERE tablename = 'skills' AND schemaname = 'public'
    LOOP
        EXECUTE format('DROP POLICY IF EXISTS %I ON public.skills', pol.policyname);
    END LOOP;
END $$;

-- Drop all policies on exercises
DO $$ 
DECLARE
    pol RECORD;
BEGIN
    FOR pol IN SELECT policyname FROM pg_policies WHERE tablename = 'exercises' AND schemaname = 'public'
    LOOP
        EXECUTE format('DROP POLICY IF EXISTS %I ON public.exercises', pol.policyname);
    END LOOP;
END $$;

-- Drop storage policies for exercise-videos
DO $$ 
DECLARE
    pol RECORD;
BEGIN
    FOR pol IN SELECT policyname FROM pg_policies WHERE tablename = 'objects' AND schemaname = 'storage'
    LOOP
        IF pol.policyname LIKE '%exercise%' OR pol.policyname LIKE '%video%' THEN
            EXECUTE format('DROP POLICY IF EXISTS %I ON storage.objects', pol.policyname);
        END IF;
    END LOOP;
END $$;

-- ============================================================================
-- STEP 2: Recreate the is_admin() function (make sure it works)
-- ============================================================================

CREATE OR REPLACE FUNCTION public.is_admin()
RETURNS BOOLEAN 
LANGUAGE sql 
SECURITY DEFINER 
STABLE
AS $$
  SELECT COALESCE(
    (SELECT is_admin FROM public.profiles WHERE id = auth.uid()),
    FALSE
  );
$$;

-- ============================================================================
-- STEP 3: Ensure RLS is enabled on all tables
-- ============================================================================

ALTER TABLE public.categories ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.skills ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.exercises ENABLE ROW LEVEL SECURITY;

-- ============================================================================
-- STEP 4: Create new policies for CATEGORIES
-- ============================================================================

-- Anyone can read categories
CREATE POLICY "categories_select_all" 
ON public.categories 
FOR SELECT 
TO public
USING (true);

-- Admins can insert categories
CREATE POLICY "categories_insert_admin" 
ON public.categories 
FOR INSERT 
TO authenticated
WITH CHECK (public.is_admin() = true);

-- Admins can update categories
CREATE POLICY "categories_update_admin" 
ON public.categories 
FOR UPDATE 
TO authenticated
USING (public.is_admin() = true)
WITH CHECK (public.is_admin() = true);

-- Admins can delete categories
CREATE POLICY "categories_delete_admin" 
ON public.categories 
FOR DELETE 
TO authenticated
USING (public.is_admin() = true);

-- ============================================================================
-- STEP 5: Create new policies for SKILLS
-- ============================================================================

-- Anyone can read skills
CREATE POLICY "skills_select_all" 
ON public.skills 
FOR SELECT 
TO public
USING (true);

-- Admins can insert skills
CREATE POLICY "skills_insert_admin" 
ON public.skills 
FOR INSERT 
TO authenticated
WITH CHECK (public.is_admin() = true);

-- Admins can update skills
CREATE POLICY "skills_update_admin" 
ON public.skills 
FOR UPDATE 
TO authenticated
USING (public.is_admin() = true)
WITH CHECK (public.is_admin() = true);

-- Admins can delete skills
CREATE POLICY "skills_delete_admin" 
ON public.skills 
FOR DELETE 
TO authenticated
USING (public.is_admin() = true);

-- ============================================================================
-- STEP 6: Create new policies for EXERCISES
-- ============================================================================

-- Anyone can read exercises
CREATE POLICY "exercises_select_all" 
ON public.exercises 
FOR SELECT 
TO public
USING (true);

-- Admins can insert exercises
CREATE POLICY "exercises_insert_admin" 
ON public.exercises 
FOR INSERT 
TO authenticated
WITH CHECK (public.is_admin() = true);

-- Admins can update exercises
CREATE POLICY "exercises_update_admin" 
ON public.exercises 
FOR UPDATE 
TO authenticated
USING (public.is_admin() = true)
WITH CHECK (public.is_admin() = true);

-- Admins can delete exercises
CREATE POLICY "exercises_delete_admin" 
ON public.exercises 
FOR DELETE 
TO authenticated
USING (public.is_admin() = true);

-- ============================================================================
-- STEP 7: Create storage bucket (if not exists) and policies
-- ============================================================================

-- Create bucket if it doesn't exist
INSERT INTO storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
VALUES (
  'exercise-videos', 
  'exercise-videos', 
  true,
  104857600,
  ARRAY['video/mp4', 'video/webm', 'video/quicktime', 'video/x-msvideo', 'video/mpeg']
)
ON CONFLICT (id) DO UPDATE SET public = true;

-- Storage policy: Anyone can view videos
CREATE POLICY "storage_videos_select_all"
ON storage.objects 
FOR SELECT 
TO public
USING (bucket_id = 'exercise-videos');

-- Storage policy: Admins can upload videos
CREATE POLICY "storage_videos_insert_admin"
ON storage.objects 
FOR INSERT 
TO authenticated
WITH CHECK (bucket_id = 'exercise-videos' AND public.is_admin() = true);

-- Storage policy: Admins can update videos
CREATE POLICY "storage_videos_update_admin"
ON storage.objects 
FOR UPDATE 
TO authenticated
USING (bucket_id = 'exercise-videos' AND public.is_admin() = true)
WITH CHECK (bucket_id = 'exercise-videos' AND public.is_admin() = true);

-- Storage policy: Admins can delete videos
CREATE POLICY "storage_videos_delete_admin"
ON storage.objects 
FOR DELETE 
TO authenticated
USING (bucket_id = 'exercise-videos' AND public.is_admin() = true);

-- ============================================================================
-- STEP 8: Grant necessary permissions
-- ============================================================================

GRANT SELECT ON public.categories TO anon, authenticated;
GRANT SELECT ON public.skills TO anon, authenticated;
GRANT SELECT ON public.exercises TO anon, authenticated;

GRANT INSERT, UPDATE, DELETE ON public.categories TO authenticated;
GRANT INSERT, UPDATE, DELETE ON public.skills TO authenticated;
GRANT INSERT, UPDATE, DELETE ON public.exercises TO authenticated;

GRANT USAGE, SELECT ON ALL SEQUENCES IN SCHEMA public TO authenticated;

-- ============================================================================
-- STEP 9: VERIFICATION - Check the results
-- ============================================================================

-- Show all policies on our tables
SELECT tablename, policyname, cmd, roles 
FROM pg_policies 
WHERE schemaname = 'public' 
  AND tablename IN ('categories', 'skills', 'exercises')
ORDER BY tablename, policyname;

-- Show storage policies for exercise-videos
SELECT policyname, cmd, roles 
FROM pg_policies 
WHERE schemaname = 'storage' 
  AND tablename = 'objects'
  AND policyname LIKE '%video%'
ORDER BY policyname;

-- Test the is_admin function
SELECT 'is_admin() test result:' as test, public.is_admin() as result;

