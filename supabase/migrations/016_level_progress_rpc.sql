-- ============================================================
-- Migration 012: Level Progress RPC
--
-- Adds a pure SQL formula and RPC for computing "XP until next
-- level" so the web client can render a progress bar without
-- duplicating the iOS `LevelCalculator` formula.
--
-- Formula mirrors LevelCalculator.swift:
--   xpRequired(level) = FLOOR(100 * level ^ 1.5)
--
-- `current_level` is *not* recomputed here — the iOS app
-- (and existing triggers) remain the source of truth for
-- player_profiles.current_level / total_xp. This RPC only
-- derives display-only deltas from those stored values.
--
-- All statements are idempotent.
-- ============================================================

-- ============================================================
-- SECTION A: Level-XP formula helper
-- ============================================================
CREATE OR REPLACE FUNCTION public.xp_required_for_level(lvl INT)
RETURNS INT
LANGUAGE sql
IMMUTABLE
AS $$
  SELECT CASE
    WHEN lvl IS NULL OR lvl < 1 THEN 0
    ELSE FLOOR(100 * POWER(lvl::NUMERIC, 1.5))::INT
  END;
$$;

-- Safe for any authenticated caller to invoke.
GRANT EXECUTE ON FUNCTION public.xp_required_for_level(INT) TO authenticated;

-- ============================================================
-- SECTION B: get_player_level_progress RPC
--
-- Parameters:
--   p_player_id UUID — the player_profiles.id to look up.
--
-- Returns one row with:
--   current_level              — stored level from player_profiles
--   total_xp                   — stored total XP
--   xp_in_current_level        — total_xp - xpRequired(current_level)
--   xp_required_for_next_level — xpRequired(current_level + 1)
--                                - xpRequired(current_level)
--
-- Empty result if the player_profile doesn't exist.
-- ============================================================
CREATE OR REPLACE FUNCTION public.get_player_level_progress(p_player_id UUID)
RETURNS TABLE (
  current_level              INT,
  total_xp                   INT,
  xp_in_current_level        INT,
  xp_required_for_next_level INT
)
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT
    pp.current_level,
    pp.total_xp,
    GREATEST(0, pp.total_xp - public.xp_required_for_level(pp.current_level))::INT
      AS xp_in_current_level,
    GREATEST(
      1,
      public.xp_required_for_level(pp.current_level + 1)
        - public.xp_required_for_level(pp.current_level)
    )::INT AS xp_required_for_next_level
  FROM public.player_profiles pp
  WHERE pp.id = p_player_id
  LIMIT 1;
$$;

GRANT EXECUTE ON FUNCTION public.get_player_level_progress(UUID) TO authenticated;
