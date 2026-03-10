-- ============================================
-- Migration 007: Sync Web Migrations with iOS & Live DB
--
-- This migration brings the web migration history into alignment
-- with changes that were applied to the live DB via the iOS project
-- or directly via the Supabase SQL Editor.
--
-- All statements are idempotent (safe to re-run).
-- ============================================


-- ============================================
-- SECTION A: Missing Columns on player_profiles
-- ============================================

-- Leaderboard visibility flag (added by iOS leaderboard migration)
ALTER TABLE public.player_profiles
  ADD COLUMN IF NOT EXISTS visible_on_leaderboard BOOLEAN DEFAULT true;

-- ============================================
-- SECTION B: Streak Shields Constraint
-- iOS StreakManager.swift enforces maxShields = 5
-- but no DB constraint existed. Adding one now.
-- ============================================
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint
    WHERE conname = 'chk_streak_shields_range'
  ) THEN
    ALTER TABLE public.player_profiles
      ADD CONSTRAINT chk_streak_shields_range
      CHECK (streak_shields BETWEEN 0 AND 5);
  END IF;
END $$;

-- ============================================
-- SECTION C: Missing Columns on exercises
-- These exist in the live DB and are used by both
-- web UI (ExerciseModal, filters) and iOS app.
-- ============================================
ALTER TABLE public.exercises
  ADD COLUMN IF NOT EXISTS equipment TEXT[],
  ADD COLUMN IF NOT EXISTS minimum_duration INTEGER;

-- ============================================
-- SECTION D: Arabic Localization Columns
-- From iOS migration 20260305000000_add_arabic_columns.sql
-- NOTE: These have NOT been applied to the live DB yet.
-- They need to be run against the live Supabase DB via SQL Editor.
-- ============================================
ALTER TABLE public.categories ADD COLUMN IF NOT EXISTS name_ar TEXT;

ALTER TABLE public.skills ADD COLUMN IF NOT EXISTS name_ar TEXT;
ALTER TABLE public.skills ADD COLUMN IF NOT EXISTS description_ar TEXT;

ALTER TABLE public.exercises ADD COLUMN IF NOT EXISTS name_ar TEXT;
ALTER TABLE public.exercises ADD COLUMN IF NOT EXISTS description_ar TEXT;

ALTER TABLE public.achievements ADD COLUMN IF NOT EXISTS name_ar TEXT;
ALTER TABLE public.achievements ADD COLUMN IF NOT EXISTS description_ar TEXT;

-- ============================================
-- SECTION E: Leaderboard Indexes
-- From iOS leaderboard migration
-- ============================================
CREATE INDEX IF NOT EXISTS idx_daily_activity_date_user
  ON public.daily_activity(activity_date, user_id);

CREATE INDEX IF NOT EXISTS idx_skill_progress_status_user
  ON public.skill_progress(user_id, status);

CREATE INDEX IF NOT EXISTS idx_player_profiles_streak_age
  ON public.player_profiles(age_group, current_streak DESC);

CREATE INDEX IF NOT EXISTS idx_player_profiles_xp_age
  ON public.player_profiles(age_group, total_xp DESC);

-- ============================================
-- SECTION F: Leaderboard Helper Function
-- Maps age bracket strings to age group arrays
-- ============================================
CREATE OR REPLACE FUNCTION _leaderboard_age_groups(p_age_bracket TEXT)
RETURNS TEXT[] AS $$
BEGIN
  RETURN CASE p_age_bracket
    WHEN 'juniors' THEN ARRAY['U-7','U-8','U-9']
    WHEN 'intermediates' THEN ARRAY['U-10','U-11','U-12']
    WHEN 'seniors' THEN ARRAY['U-13','U-14','U-15+']
    ELSE ARRAY['U-7','U-8','U-9','U-10','U-11','U-12','U-13','U-14','U-15+']
  END;
END;
$$ LANGUAGE plpgsql IMMUTABLE;

-- ============================================
-- SECTION G: Leaderboard RPC Functions
-- From iOS leaderboard_fix_v2 (latest corrected versions)
-- ============================================

-- Weekly XP Leaderboard (resets every Sunday)
CREATE OR REPLACE FUNCTION get_weekly_xp_leaderboard(
  p_age_bracket TEXT,
  p_limit INT DEFAULT 20
)
RETURNS TABLE (
  rank BIGINT,
  user_id UUID,
  display_name TEXT,
  age_group TEXT,
  value BIGINT,
  current_level INT
) AS $$
BEGIN
  RETURN QUERY
  WITH week_start AS (
    SELECT (CURRENT_DATE - EXTRACT(DOW FROM CURRENT_DATE)::int)::date AS ws
  ),
  weekly_totals AS (
    SELECT
      pp.id AS pid,
      COALESCE(pp.display_name, 'Player')::TEXT AS dname,
      pp.age_group::TEXT AS ag,
      pp.current_level AS lvl,
      SUM(da.xp_earned)::BIGINT AS total_xp
    FROM public.daily_activity da
    JOIN public.player_profiles pp ON pp.id = da.user_id
    CROSS JOIN week_start w
    WHERE da.activity_date >= w.ws
      AND pp.age_group = ANY(_leaderboard_age_groups(p_age_bracket))
      AND pp.onboarding_completed_at IS NOT NULL
      AND pp.visible_on_leaderboard = true
    GROUP BY pp.id, pp.display_name, pp.age_group, pp.current_level
    HAVING SUM(da.xp_earned) > 0
  )
  SELECT
    ROW_NUMBER() OVER (ORDER BY wt.total_xp DESC, wt.pid) AS rank,
    wt.pid AS user_id,
    wt.dname AS display_name,
    wt.ag AS age_group,
    wt.total_xp AS value,
    wt.lvl AS current_level
  FROM weekly_totals wt
  ORDER BY wt.total_xp DESC, wt.pid
  LIMIT p_limit;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- All-Time XP Leaderboard
CREATE OR REPLACE FUNCTION get_alltime_xp_leaderboard(
  p_age_bracket TEXT,
  p_limit INT DEFAULT 20
)
RETURNS TABLE (
  rank BIGINT,
  user_id UUID,
  display_name TEXT,
  age_group TEXT,
  value BIGINT,
  current_level INT
) AS $$
BEGIN
  RETURN QUERY
  SELECT
    ROW_NUMBER() OVER (ORDER BY pp.total_xp DESC, pp.id) AS rank,
    pp.id AS user_id,
    COALESCE(pp.display_name, 'Player')::TEXT AS display_name,
    pp.age_group::TEXT AS age_group,
    pp.total_xp::BIGINT AS value,
    pp.current_level::INT AS current_level
  FROM public.player_profiles pp
  WHERE pp.age_group = ANY(_leaderboard_age_groups(p_age_bracket))
    AND pp.onboarding_completed_at IS NOT NULL
    AND pp.visible_on_leaderboard = true
    AND pp.total_xp > 0
  ORDER BY pp.total_xp DESC, pp.id
  LIMIT p_limit;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Skills Mastered Leaderboard
CREATE OR REPLACE FUNCTION get_mastery_leaderboard(
  p_age_bracket TEXT,
  p_limit INT DEFAULT 20
)
RETURNS TABLE (
  rank BIGINT,
  user_id UUID,
  display_name TEXT,
  age_group TEXT,
  value BIGINT,
  current_level INT
) AS $$
BEGIN
  RETURN QUERY
  WITH mastery_counts AS (
    SELECT
      pp.id AS pid,
      COALESCE(pp.display_name, 'Player')::TEXT AS dname,
      pp.age_group::TEXT AS ag,
      pp.current_level AS lvl,
      COUNT(*)::BIGINT AS skills_mastered
    FROM public.skill_progress sp
    JOIN public.player_profiles pp ON pp.id = sp.user_id
    WHERE sp.status = 'mastered'
      AND pp.age_group = ANY(_leaderboard_age_groups(p_age_bracket))
      AND pp.onboarding_completed_at IS NOT NULL
      AND pp.visible_on_leaderboard = true
    GROUP BY pp.id, pp.display_name, pp.age_group, pp.current_level
    HAVING COUNT(*) > 0
  )
  SELECT
    ROW_NUMBER() OVER (ORDER BY mc.skills_mastered DESC, mc.pid) AS rank,
    mc.pid AS user_id,
    mc.dname AS display_name,
    mc.ag AS age_group,
    mc.skills_mastered AS value,
    mc.lvl AS current_level
  FROM mastery_counts mc
  ORDER BY mc.skills_mastered DESC, mc.pid
  LIMIT p_limit;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Streak Champions Leaderboard
CREATE OR REPLACE FUNCTION get_streak_leaderboard(
  p_age_bracket TEXT,
  p_limit INT DEFAULT 20
)
RETURNS TABLE (
  rank BIGINT,
  user_id UUID,
  display_name TEXT,
  age_group TEXT,
  value BIGINT,
  current_level INT
) AS $$
BEGIN
  RETURN QUERY
  SELECT
    ROW_NUMBER() OVER (ORDER BY pp.current_streak DESC, pp.id) AS rank,
    pp.id AS user_id,
    COALESCE(pp.display_name, 'Player')::TEXT AS display_name,
    pp.age_group::TEXT AS age_group,
    pp.current_streak::BIGINT AS value,
    pp.current_level::INT AS current_level
  FROM public.player_profiles pp
  WHERE pp.age_group = ANY(_leaderboard_age_groups(p_age_bracket))
    AND pp.current_streak > 0
    AND pp.onboarding_completed_at IS NOT NULL
    AND pp.visible_on_leaderboard = true
  ORDER BY pp.current_streak DESC, pp.id
  LIMIT p_limit;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Get Player's Own Ranks (all 4 categories)
CREATE OR REPLACE FUNCTION get_player_ranks(
  p_user_id UUID,
  p_age_bracket TEXT
)
RETURNS TABLE (
  category TEXT,
  rank BIGINT,
  value BIGINT,
  total_players BIGINT
) AS $$
DECLARE
  v_age_groups TEXT[];
BEGIN
  v_age_groups := _leaderboard_age_groups(p_age_bracket);

  -- Weekly XP rank
  RETURN QUERY
  WITH week_start AS (
    SELECT (CURRENT_DATE - EXTRACT(DOW FROM CURRENT_DATE)::int)::date AS ws
  ),
  weekly_totals AS (
    SELECT
      pp.id AS pid,
      SUM(da.xp_earned)::BIGINT AS total_xp
    FROM public.daily_activity da
    JOIN public.player_profiles pp ON pp.id = da.user_id
    CROSS JOIN week_start w
    WHERE da.activity_date >= w.ws
      AND pp.age_group = ANY(v_age_groups)
      AND pp.onboarding_completed_at IS NOT NULL
      AND pp.visible_on_leaderboard = true
    GROUP BY pp.id
    HAVING SUM(da.xp_earned) > 0
  ),
  ranked AS (
    SELECT
      wt.pid,
      wt.total_xp,
      ROW_NUMBER() OVER (ORDER BY wt.total_xp DESC, wt.pid) AS rn,
      COUNT(*) OVER () AS total
    FROM weekly_totals wt
  )
  SELECT
    'weeklyXP'::TEXT AS category,
    COALESCE(r.rn, 0)::BIGINT AS rank,
    COALESCE(r.total_xp, 0)::BIGINT AS value,
    COALESCE(r.total, 0)::BIGINT AS total_players
  FROM (SELECT 1) AS dummy
  LEFT JOIN ranked r ON r.pid = p_user_id;

  -- All-Time XP rank
  RETURN QUERY
  WITH ranked AS (
    SELECT
      pp.id AS pid,
      pp.total_xp::BIGINT AS xp,
      ROW_NUMBER() OVER (ORDER BY pp.total_xp DESC, pp.id) AS rn,
      COUNT(*) OVER () AS total
    FROM public.player_profiles pp
    WHERE pp.age_group = ANY(v_age_groups)
      AND pp.onboarding_completed_at IS NOT NULL
      AND pp.visible_on_leaderboard = true
      AND pp.total_xp > 0
  )
  SELECT
    'allTimeXP'::TEXT AS category,
    COALESCE(r.rn, 0)::BIGINT AS rank,
    COALESCE(r.xp, 0)::BIGINT AS value,
    COALESCE(r.total, 0)::BIGINT AS total_players
  FROM (SELECT 1) AS dummy
  LEFT JOIN ranked r ON r.pid = p_user_id;

  -- Skills Mastered rank
  RETURN QUERY
  WITH mastery_counts AS (
    SELECT
      pp.id AS pid,
      COUNT(*)::BIGINT AS skills_mastered
    FROM public.skill_progress sp
    JOIN public.player_profiles pp ON pp.id = sp.user_id
    WHERE sp.status = 'mastered'
      AND pp.age_group = ANY(v_age_groups)
      AND pp.onboarding_completed_at IS NOT NULL
      AND pp.visible_on_leaderboard = true
    GROUP BY pp.id
    HAVING COUNT(*) > 0
  ),
  ranked AS (
    SELECT
      mc.pid,
      mc.skills_mastered,
      ROW_NUMBER() OVER (ORDER BY mc.skills_mastered DESC, mc.pid) AS rn,
      COUNT(*) OVER () AS total
    FROM mastery_counts mc
  )
  SELECT
    'skillsMastered'::TEXT AS category,
    COALESCE(r.rn, 0)::BIGINT AS rank,
    COALESCE(r.skills_mastered, 0)::BIGINT AS value,
    COALESCE(r.total, 0)::BIGINT AS total_players
  FROM (SELECT 1) AS dummy
  LEFT JOIN ranked r ON r.pid = p_user_id;

  -- Streak rank
  RETURN QUERY
  WITH ranked AS (
    SELECT
      pp.id AS pid,
      pp.current_streak::BIGINT AS streak,
      ROW_NUMBER() OVER (ORDER BY pp.current_streak DESC, pp.id) AS rn,
      COUNT(*) OVER () AS total
    FROM public.player_profiles pp
    WHERE pp.age_group = ANY(v_age_groups)
      AND pp.current_streak > 0
      AND pp.onboarding_completed_at IS NOT NULL
      AND pp.visible_on_leaderboard = true
  )
  SELECT
    'streaks'::TEXT AS category,
    COALESCE(r.rn, 0)::BIGINT AS rank,
    COALESCE(r.streak, 0)::BIGINT AS value,
    COALESCE(r.total, 0)::BIGINT AS total_players
  FROM (SELECT 1) AS dummy
  LEFT JOIN ranked r ON r.pid = p_user_id;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- ============================================
-- SECTION H: accept_invitation RPC
-- From iOS supabase_migration_accept_invitation.sql
-- Atomic invite acceptance: validates code, adds to org/team, updates status
-- ============================================
CREATE OR REPLACE FUNCTION accept_invitation(p_invite_code TEXT)
RETURNS JSON
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
    v_invitation RECORD;
    v_org_name TEXT;
    v_org_type TEXT;
    v_team_name TEXT;
BEGIN
    -- 1. Look up and validate the invitation
    SELECT * INTO v_invitation
    FROM invitations
    WHERE invite_code = UPPER(TRIM(p_invite_code))
      AND status = 'pending'
      AND (expires_at IS NULL OR expires_at > NOW());

    IF NOT FOUND THEN
        RAISE EXCEPTION 'Invalid or expired invite code';
    END IF;

    -- Fetch org info for the response
    SELECT name, type INTO v_org_name, v_org_type
    FROM organizations
    WHERE id = v_invitation.organization_id;

    -- 2. Insert into organization_members
    INSERT INTO organization_members (organization_id, user_id, role, invited_by)
    VALUES (
        v_invitation.organization_id,
        auth.uid(),
        v_invitation.role,
        v_invitation.invited_by
    )
    ON CONFLICT (organization_id, user_id) DO NOTHING;

    -- 3. Insert into team_members if a team is specified
    IF v_invitation.team_id IS NOT NULL THEN
        INSERT INTO team_members (team_id, player_id)
        VALUES (v_invitation.team_id, auth.uid())
        ON CONFLICT (team_id, player_id) DO NOTHING;

        SELECT name INTO v_team_name
        FROM teams
        WHERE id = v_invitation.team_id;
    END IF;

    -- 4. Mark invitation as accepted
    UPDATE invitations
    SET status = 'accepted',
        accepted_by = auth.uid()
    WHERE id = v_invitation.id;

    -- Return details for the client UI
    RETURN json_build_object(
        'id', v_invitation.id,
        'organization_id', v_invitation.organization_id,
        'organization_name', v_org_name,
        'organization_type', v_org_type,
        'role', v_invitation.role,
        'team_id', v_invitation.team_id,
        'team_name', v_team_name,
        'invited_by', v_invitation.invited_by
    );
END;
$$;

-- ============================================
-- SECTION I: delete_user_account RPC
-- From iOS supabase_migration_delete_account.sql
-- Required for Apple App Store compliance (account deletion).
-- NOTE: Column names corrected to match actual schema (user_id, not player_profile_id)
-- NOTE: Table name corrected (daily_activity, not daily_activities)
-- ============================================
CREATE OR REPLACE FUNCTION delete_user_account()
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  current_user_id uuid;
BEGIN
  current_user_id := auth.uid();

  IF current_user_id IS NULL THEN
    RAISE EXCEPTION 'Not authenticated';
  END IF;

  -- Delete user data from application tables
  -- Order matters due to foreign key constraints
  DELETE FROM public.exercise_completions WHERE user_id = current_user_id;
  DELETE FROM public.daily_activity WHERE user_id = current_user_id;
  DELETE FROM public.skill_progress WHERE user_id = current_user_id;
  DELETE FROM public.user_achievements WHERE user_id = current_user_id;
  DELETE FROM public.training_sessions WHERE user_id = current_user_id;
  DELETE FROM public.team_members WHERE player_id = current_user_id;
  DELETE FROM public.organization_members WHERE user_id = current_user_id;
  DELETE FROM public.player_profiles WHERE id = current_user_id;
  DELETE FROM public.profiles WHERE id = current_user_id;

  -- Delete the auth user record
  DELETE FROM auth.users WHERE id = current_user_id;
END;
$$;

-- ============================================
-- SECTION J: Grants
-- ============================================
GRANT EXECUTE ON FUNCTION accept_invitation(TEXT) TO authenticated;
REVOKE EXECUTE ON FUNCTION accept_invitation(TEXT) FROM PUBLIC, anon;

GRANT EXECUTE ON FUNCTION delete_user_account() TO authenticated;

GRANT EXECUTE ON FUNCTION get_weekly_xp_leaderboard TO authenticated;
GRANT EXECUTE ON FUNCTION get_alltime_xp_leaderboard TO authenticated;
GRANT EXECUTE ON FUNCTION get_mastery_leaderboard TO authenticated;
GRANT EXECUTE ON FUNCTION get_streak_leaderboard TO authenticated;
GRANT EXECUTE ON FUNCTION get_player_ranks TO authenticated;
GRANT EXECUTE ON FUNCTION _leaderboard_age_groups TO authenticated;

-- ============================================
-- SECTION K: Documentation — Orphan RPCs
-- The following RPC functions exist in the live Supabase DB but are
-- not referenced in either the web or iOS codebase. They were likely
-- created manually via the Supabase SQL Editor during development.
-- Keeping them for now; candidates for future cleanup.
--
--   - get_managed_player_ids()
--   - get_user_managed_org_ids()
--   - user_has_org_role()
--   - user_is_org_member()
--
-- ============================================

-- ============================================
-- SECTION L: Verify
-- ============================================
SELECT 'player_profiles columns' AS check_name,
       count(*) FILTER (WHERE column_name = 'visible_on_leaderboard') AS visible_lb
FROM information_schema.columns
WHERE table_name = 'player_profiles' AND table_schema = 'public';

SELECT 'exercises columns' AS check_name,
       count(*) FILTER (WHERE column_name = 'equipment') AS equipment,
       count(*) FILTER (WHERE column_name = 'minimum_duration') AS min_dur,
       count(*) FILTER (WHERE column_name = 'name_ar') AS name_ar
FROM information_schema.columns
WHERE table_name = 'exercises' AND table_schema = 'public';

SELECT 'arabic columns on skills' AS check_name,
       count(*) FILTER (WHERE column_name = 'name_ar') AS name_ar,
       count(*) FILTER (WHERE column_name = 'description_ar') AS desc_ar
FROM information_schema.columns
WHERE table_name = 'skills' AND table_schema = 'public';
