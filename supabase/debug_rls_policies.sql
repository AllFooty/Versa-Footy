-- ============================================================================
-- DEBUG RLS POLICIES - Run this in Supabase SQL Editor to diagnose the issue
-- ============================================================================

-- 1. Check all RLS policies on exercises table
SELECT 
  schemaname,
  tablename,
  policyname,
  permissive,
  roles,
  cmd,
  qual,
  with_check
FROM pg_policies 
WHERE tablename = 'exercises'
ORDER BY policyname;

-- 2. Check all RLS policies on categories table
SELECT 
  schemaname,
  tablename,
  policyname,
  permissive,
  roles,
  cmd,
  qual,
  with_check
FROM pg_policies 
WHERE tablename = 'categories'
ORDER BY policyname;

-- 3. Check all RLS policies on skills table
SELECT 
  schemaname,
  tablename,
  policyname,
  permissive,
  roles,
  cmd,
  qual,
  with_check
FROM pg_policies 
WHERE tablename = 'skills'
ORDER BY policyname;

-- 4. Check if RLS is enabled on tables
SELECT 
  schemaname,
  tablename,
  rowsecurity
FROM pg_tables 
WHERE schemaname = 'public' 
  AND tablename IN ('categories', 'skills', 'exercises', 'profiles');

-- 5. Check if is_admin() function exists
SELECT 
  routine_name,
  routine_type,
  security_type
FROM information_schema.routines 
WHERE routine_schema = 'public' 
  AND routine_name = 'is_admin';

-- 6. Test is_admin() function directly (should return true for you when logged in)
SELECT public.is_admin() as is_admin_result;

-- 7. Check storage policies for exercise-videos bucket
SELECT 
  policyname,
  permissive,
  roles,
  cmd,
  qual,
  with_check
FROM pg_policies 
WHERE tablename = 'objects' 
  AND schemaname = 'storage'
ORDER BY policyname;

-- 8. Check your current user info
SELECT auth.uid() as current_user_id;

-- 9. Check your profile
SELECT * FROM public.profiles WHERE id = auth.uid();

