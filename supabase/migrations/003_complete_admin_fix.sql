-- =============================================================================
-- COMPLETE ADMIN FIX - Run this entire script in Supabase SQL Editor
-- =============================================================================

-- STEP 1: Create storage bucket for exercise videos
-- =============================================================================
INSERT INTO storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
VALUES (
  'exercise-videos', 
  'exercise-videos', 
  true,
  104857600,
  ARRAY['video/mp4', 'video/webm', 'video/quicktime', 'video/x-msvideo', 'video/mpeg']
)
ON CONFLICT (id) DO UPDATE SET 
  public = true,
  file_size_limit = 104857600;

-- STEP 2: Ensure is_admin() function exists
-- =============================================================================
CREATE OR REPLACE FUNCTION public.is_admin()
RETURNS BOOLEAN AS $$
  SELECT COALESCE(
    (SELECT is_admin FROM public.profiles WHERE id = auth.uid()),
    FALSE
  );
$$ LANGUAGE sql SECURITY DEFINER STABLE;

-- STEP 3: Create profiles for existing users who don't have one
-- =============================================================================
INSERT INTO public.profiles (id, email, full_name, is_admin)
SELECT 
  au.id,
  au.email,
  COALESCE(au.raw_user_meta_data->>'full_name', ''),
  FALSE
FROM auth.users au
WHERE NOT EXISTS (
  SELECT 1 FROM public.profiles p WHERE p.id = au.id
);

-- STEP 4: Set the FIRST user as admin (or you can change the email below)
-- =============================================================================
UPDATE public.profiles 
SET is_admin = true 
WHERE id = (SELECT id FROM auth.users ORDER BY created_at ASC LIMIT 1);

-- STEP 5: Enable RLS on all tables
-- =============================================================================
ALTER TABLE public.categories ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.skills ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.exercises ENABLE ROW LEVEL SECURITY;

-- STEP 6: Drop existing policies to avoid conflicts
-- =============================================================================
DROP POLICY IF EXISTS "Anyone can view categories" ON public.categories;
DROP POLICY IF EXISTS "Admins can insert categories" ON public.categories;
DROP POLICY IF EXISTS "Admins can update categories" ON public.categories;
DROP POLICY IF EXISTS "Admins can delete categories" ON public.categories;

DROP POLICY IF EXISTS "Anyone can view skills" ON public.skills;
DROP POLICY IF EXISTS "Admins can insert skills" ON public.skills;
DROP POLICY IF EXISTS "Admins can update skills" ON public.skills;
DROP POLICY IF EXISTS "Admins can delete skills" ON public.skills;

DROP POLICY IF EXISTS "Anyone can view exercises" ON public.exercises;
DROP POLICY IF EXISTS "Admins can insert exercises" ON public.exercises;
DROP POLICY IF EXISTS "Admins can update exercises" ON public.exercises;
DROP POLICY IF EXISTS "Admins can delete exercises" ON public.exercises;

DROP POLICY IF EXISTS "Anyone can view exercise videos" ON storage.objects;
DROP POLICY IF EXISTS "Admins can upload exercise videos" ON storage.objects;
DROP POLICY IF EXISTS "Admins can update exercise videos" ON storage.objects;
DROP POLICY IF EXISTS "Admins can delete exercise videos" ON storage.objects;

-- STEP 7: Create table RLS policies
-- =============================================================================

-- Categories
CREATE POLICY "Anyone can view categories" 
  ON public.categories FOR SELECT USING (true);
CREATE POLICY "Admins can insert categories" 
  ON public.categories FOR INSERT WITH CHECK (public.is_admin() = true);
CREATE POLICY "Admins can update categories" 
  ON public.categories FOR UPDATE USING (public.is_admin() = true);
CREATE POLICY "Admins can delete categories" 
  ON public.categories FOR DELETE USING (public.is_admin() = true);

-- Skills
CREATE POLICY "Anyone can view skills" 
  ON public.skills FOR SELECT USING (true);
CREATE POLICY "Admins can insert skills" 
  ON public.skills FOR INSERT WITH CHECK (public.is_admin() = true);
CREATE POLICY "Admins can update skills" 
  ON public.skills FOR UPDATE USING (public.is_admin() = true);
CREATE POLICY "Admins can delete skills" 
  ON public.skills FOR DELETE USING (public.is_admin() = true);

-- Exercises
CREATE POLICY "Anyone can view exercises" 
  ON public.exercises FOR SELECT USING (true);
CREATE POLICY "Admins can insert exercises" 
  ON public.exercises FOR INSERT WITH CHECK (public.is_admin() = true);
CREATE POLICY "Admins can update exercises" 
  ON public.exercises FOR UPDATE USING (public.is_admin() = true);
CREATE POLICY "Admins can delete exercises" 
  ON public.exercises FOR DELETE USING (public.is_admin() = true);

-- STEP 8: Create storage policies
-- =============================================================================
CREATE POLICY "Anyone can view exercise videos"
  ON storage.objects FOR SELECT
  USING (bucket_id = 'exercise-videos');

CREATE POLICY "Admins can upload exercise videos"
  ON storage.objects FOR INSERT
  WITH CHECK (bucket_id = 'exercise-videos' AND public.is_admin() = true);

CREATE POLICY "Admins can update exercise videos"
  ON storage.objects FOR UPDATE
  USING (bucket_id = 'exercise-videos' AND public.is_admin() = true);

CREATE POLICY "Admins can delete exercise videos"
  ON storage.objects FOR DELETE
  USING (bucket_id = 'exercise-videos' AND public.is_admin() = true);

-- STEP 9: Grant permissions
-- =============================================================================
GRANT SELECT ON public.categories TO anon, authenticated;
GRANT SELECT ON public.skills TO anon, authenticated;
GRANT SELECT ON public.exercises TO anon, authenticated;

GRANT INSERT, UPDATE, DELETE ON public.categories TO authenticated;
GRANT INSERT, UPDATE, DELETE ON public.skills TO authenticated;
GRANT INSERT, UPDATE, DELETE ON public.exercises TO authenticated;

GRANT USAGE, SELECT ON ALL SEQUENCES IN SCHEMA public TO authenticated;

-- STEP 10: Verify the fix
-- =============================================================================
-- This should show your admin user:
SELECT id, email, is_admin FROM public.profiles WHERE is_admin = true;

