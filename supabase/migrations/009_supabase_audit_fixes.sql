-- ============================================
-- Migration 009: Supabase Audit Fixes
--
-- Fixes identified during full codebase review:
-- 1. Remove overly permissive storage policies (security vulnerability)
-- 2. Add bucket constraints (file size + mime type)
-- 3. Add delete_user_account function (GDPR/privacy)
-- 4. Remove duplicate RLS policies
-- ============================================

-- 1. Remove overly permissive storage policies
-- These "Allow all" policies bypassed admin-only restrictions,
-- allowing any user (including anon) to upload/update storage objects.
DROP POLICY IF EXISTS "Allow all insert storage.objects" ON storage.objects;
DROP POLICY IF EXISTS "Allow all update storage.objects" ON storage.objects;

-- 2. Add bucket constraints: 100MB max file size, video-only mime types
UPDATE storage.buckets
SET file_size_limit = 104857600,
    allowed_mime_types = ARRAY['video/mp4', 'video/quicktime', 'video/webm', 'video/x-msvideo']
WHERE id = 'exercise-videos';

-- 3. Add delete_user_account function for account deletion (GDPR/privacy)
-- Note: The original Dev version was broken (referenced non-existent
-- columns "player_profile_id" and table "daily_activities"). This is
-- the corrected version using the actual column names.
CREATE OR REPLACE FUNCTION public.delete_user_account()
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $function$
DECLARE
  current_user_id uuid;
BEGIN
  current_user_id := auth.uid();

  IF current_user_id IS NULL THEN
    RAISE EXCEPTION 'Not authenticated';
  END IF;

  -- Delete in order respecting foreign key constraints
  DELETE FROM exercise_completions WHERE user_id = current_user_id;
  DELETE FROM daily_activity WHERE user_id = current_user_id;
  DELETE FROM skill_progress WHERE user_id = current_user_id;
  DELETE FROM user_achievements WHERE user_id = current_user_id;
  DELETE FROM training_sessions WHERE user_id = current_user_id;
  DELETE FROM player_profiles WHERE id = current_user_id;
  DELETE FROM profiles WHERE id = current_user_id;

  -- Delete the auth user record
  DELETE FROM auth.users WHERE id = current_user_id;
END;
$function$;

GRANT EXECUTE ON FUNCTION delete_user_account() TO authenticated;

-- 4. Remove duplicate "Allow anon read" RLS policies
-- These were redundant with the existing *_select policies
DROP POLICY IF EXISTS "Allow anon read" ON categories;
DROP POLICY IF EXISTS "Allow anon read" ON exercise_skills;
DROP POLICY IF EXISTS "Allow anon read" ON exercises;
DROP POLICY IF EXISTS "Allow anon read" ON skills;
