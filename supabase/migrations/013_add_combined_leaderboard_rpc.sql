-- ============================================================
-- Migration 008: Combined Leaderboard RPC + Security Fix
--
-- 1. Adds get_leaderboard_with_rank — the single RPC the iOS app
--    calls (LeaderboardService.swift). This function was applied
--    to the live DB via the iOS legacy migration pipeline but was
--    missing from the web migration history.
--
-- 2. Revokes the unnecessary EXECUTE grant on _leaderboard_age_groups
--    added by 007. It is a SECURITY DEFINER helper and does not need
--    to be callable directly by authenticated users.
--
-- 3. Optimises the CTE pattern: total_players is now computed with
--    COUNT(*) OVER () inside the CTE (one scan) rather than a
--    correlated subquery against the materialised result (two scans).
--
-- 4. Weekly XP reset is timezone-aware (p_tz parameter). DB session
--    timezone is UTC on Supabase; without this, a player in the
--    Americas playing Saturday evening would have that XP counted
--    in the *next* week.
--
-- 5. display_name is returned raw (NULL when unset) instead of being
--    coalesced to the English literal 'Player' in SQL. The client
--    resolves the localized fallback. player_rank also now carries
--    display_name so UIs can render a consistent name for the
--    caller without relying on potentially stale local profile data.
--
-- All statements are idempotent (safe to re-run).
-- ============================================================

-- ============================================================
-- SECTION A: Revoke unnecessary grant on private helper
-- ============================================================
REVOKE EXECUTE ON FUNCTION _leaderboard_age_groups(TEXT) FROM authenticated;

-- ============================================================
-- SECTION B: Combined Leaderboard + Player Rank RPC
--
-- Returns top-N entries AND the requesting player's own rank
-- in a single call, cutting RPC calls per view in half.
--
-- Parameters:
--   p_category    TEXT  — 'weeklyXP' | 'allTimeXP' | 'skillsMastered' | 'streaks'
--   p_age_bracket TEXT  — 'juniors' | 'intermediates' | 'seniors' (or any other = all)
--   p_user_id     UUID  — the requesting player's user id
--   p_limit       INT   — how many top entries to return (default 20)
--   p_tz          TEXT  — IANA timezone identifier for the weekly-reset boundary
--                         (default 'UTC'; falls back to UTC if unknown)
--
-- Returns JSON:
--   {
--     "entries":     [...],
--     "player_rank": { "rank": N, "value": V, "total_players": T, "display_name": "..." }
--   }
--   player_rank is NULL when the player has no activity in the chosen category.
--   display_name fields may be NULL; clients resolve a localized fallback.
-- ============================================================

-- Drop old signature if present (a prior deploy registered the 4-arg version).
DROP FUNCTION IF EXISTS public.get_leaderboard_with_rank(TEXT, TEXT, UUID, INT);

CREATE OR REPLACE FUNCTION get_leaderboard_with_rank(
  p_category    TEXT,
  p_age_bracket TEXT,
  p_user_id     UUID,
  p_limit       INT  DEFAULT 20,
  p_tz          TEXT DEFAULT 'UTC'
)
RETURNS JSON AS $$
DECLARE
  v_age_groups TEXT[];
  v_result     JSON;
  v_tz         TEXT;
BEGIN
  v_age_groups := _leaderboard_age_groups(p_age_bracket);

  -- Resolve timezone with safe fallback to UTC.
  v_tz := COALESCE(NULLIF(TRIM(p_tz), ''), 'UTC');
  IF NOT EXISTS (SELECT 1 FROM pg_timezone_names WHERE name = v_tz) THEN
    v_tz := 'UTC';
  END IF;

  -- -------------------------------------------------------
  -- Weekly XP (resets every Sunday, anchored to p_tz)
  -- -------------------------------------------------------
  IF p_category = 'weeklyXP' THEN
    WITH week_start AS (
      SELECT (
        (timezone(v_tz, now()))::date
        - EXTRACT(DOW FROM timezone(v_tz, now()))::int
      )::date AS ws
    ),
    all_ranked AS (
      SELECT
        ROW_NUMBER() OVER (ORDER BY totals.total_xp DESC, totals.pid) AS rank,
        COUNT(*)     OVER ()                                           AS total_count,
        totals.pid         AS user_id,
        totals.dname       AS display_name,
        totals.ag          AS age_group,
        totals.total_xp    AS value,
        totals.lvl         AS current_level
      FROM (
        SELECT
          pp.id                             AS pid,
          pp.display_name::TEXT             AS dname,
          pp.age_group::TEXT                AS ag,
          pp.current_level                  AS lvl,
          SUM(da.xp_earned)::BIGINT         AS total_xp
        FROM public.daily_activity da
        JOIN public.player_profiles pp ON pp.id = da.user_id
        CROSS JOIN week_start w
        WHERE da.activity_date >= w.ws
          AND pp.age_group = ANY(v_age_groups)
          AND pp.onboarding_completed_at IS NOT NULL
          AND pp.visible_on_leaderboard = true
        GROUP BY pp.id, pp.display_name, pp.age_group, pp.current_level
        HAVING SUM(da.xp_earned) > 0
      ) totals
    )
    SELECT json_build_object(
      'entries',
        COALESCE(
          (SELECT json_agg(row_to_json(r))
             FROM (SELECT rank, user_id, display_name, age_group, value, current_level
                     FROM all_ranked ORDER BY rank LIMIT p_limit) r),
          '[]'::json
        ),
      'player_rank',
        (SELECT json_build_object(
                  'rank',          ar.rank,
                  'value',         ar.value,
                  'total_players', ar.total_count,
                  'display_name',  ar.display_name
                )
           FROM all_ranked ar
          WHERE ar.user_id = p_user_id)
    ) INTO v_result;

  -- -------------------------------------------------------
  -- All-Time XP
  -- -------------------------------------------------------
  ELSIF p_category = 'allTimeXP' THEN
    WITH all_ranked AS (
      SELECT
        ROW_NUMBER() OVER (ORDER BY pp.total_xp DESC, pp.id) AS rank,
        COUNT(*)     OVER ()                                  AS total_count,
        pp.id                             AS user_id,
        pp.display_name::TEXT             AS display_name,
        pp.age_group::TEXT                AS age_group,
        pp.total_xp::BIGINT               AS value,
        pp.current_level::INT             AS current_level
      FROM public.player_profiles pp
      WHERE pp.age_group = ANY(v_age_groups)
        AND pp.onboarding_completed_at IS NOT NULL
        AND pp.visible_on_leaderboard = true
        AND pp.total_xp > 0
    )
    SELECT json_build_object(
      'entries',
        COALESCE(
          (SELECT json_agg(row_to_json(r))
             FROM (SELECT rank, user_id, display_name, age_group, value, current_level
                     FROM all_ranked ORDER BY rank LIMIT p_limit) r),
          '[]'::json
        ),
      'player_rank',
        (SELECT json_build_object(
                  'rank',          ar.rank,
                  'value',         ar.value,
                  'total_players', ar.total_count,
                  'display_name',  ar.display_name
                )
           FROM all_ranked ar
          WHERE ar.user_id = p_user_id)
    ) INTO v_result;

  -- -------------------------------------------------------
  -- Skills Mastered
  -- -------------------------------------------------------
  ELSIF p_category = 'skillsMastered' THEN
    WITH all_ranked AS (
      SELECT
        ROW_NUMBER() OVER (ORDER BY totals.skills_mastered DESC, totals.pid) AS rank,
        COUNT(*)     OVER ()                                                  AS total_count,
        totals.pid            AS user_id,
        totals.dname          AS display_name,
        totals.ag             AS age_group,
        totals.skills_mastered AS value,
        totals.lvl            AS current_level
      FROM (
        SELECT
          pp.id                             AS pid,
          pp.display_name::TEXT             AS dname,
          pp.age_group::TEXT                AS ag,
          pp.current_level                  AS lvl,
          COUNT(*)::BIGINT                  AS skills_mastered
        FROM public.skill_progress sp
        JOIN public.player_profiles pp ON pp.id = sp.user_id
        WHERE sp.status = 'mastered'
          AND pp.age_group = ANY(v_age_groups)
          AND pp.onboarding_completed_at IS NOT NULL
          AND pp.visible_on_leaderboard = true
        GROUP BY pp.id, pp.display_name, pp.age_group, pp.current_level
        HAVING COUNT(*) > 0
      ) totals
    )
    SELECT json_build_object(
      'entries',
        COALESCE(
          (SELECT json_agg(row_to_json(r))
             FROM (SELECT rank, user_id, display_name, age_group, value, current_level
                     FROM all_ranked ORDER BY rank LIMIT p_limit) r),
          '[]'::json
        ),
      'player_rank',
        (SELECT json_build_object(
                  'rank',          ar.rank,
                  'value',         ar.value,
                  'total_players', ar.total_count,
                  'display_name',  ar.display_name
                )
           FROM all_ranked ar
          WHERE ar.user_id = p_user_id)
    ) INTO v_result;

  -- -------------------------------------------------------
  -- Streaks
  -- -------------------------------------------------------
  ELSIF p_category = 'streaks' THEN
    WITH all_ranked AS (
      SELECT
        ROW_NUMBER() OVER (ORDER BY pp.current_streak DESC, pp.id) AS rank,
        COUNT(*)     OVER ()                                        AS total_count,
        pp.id                             AS user_id,
        pp.display_name::TEXT             AS display_name,
        pp.age_group::TEXT                AS age_group,
        pp.current_streak::BIGINT         AS value,
        pp.current_level::INT             AS current_level
      FROM public.player_profiles pp
      WHERE pp.age_group = ANY(v_age_groups)
        AND pp.current_streak > 0
        AND pp.onboarding_completed_at IS NOT NULL
        AND pp.visible_on_leaderboard = true
    )
    SELECT json_build_object(
      'entries',
        COALESCE(
          (SELECT json_agg(row_to_json(r))
             FROM (SELECT rank, user_id, display_name, age_group, value, current_level
                     FROM all_ranked ORDER BY rank LIMIT p_limit) r),
          '[]'::json
        ),
      'player_rank',
        (SELECT json_build_object(
                  'rank',          ar.rank,
                  'value',         ar.value,
                  'total_players', ar.total_count,
                  'display_name',  ar.display_name
                )
           FROM all_ranked ar
          WHERE ar.user_id = p_user_id)
    ) INTO v_result;

  ELSE
    v_result := json_build_object('entries', '[]'::json, 'player_rank', NULL);
  END IF;

  RETURN v_result;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Grant access to authenticated users
GRANT EXECUTE ON FUNCTION get_leaderboard_with_rank(TEXT, TEXT, UUID, INT, TEXT) TO authenticated;
