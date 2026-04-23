-- ============================================================
-- Migration 009: Leaderboard Cleanup
--
-- 1. Drops the five per-category leaderboard RPCs that were created
--    in migration 007 (sections F/G/J). They have been superseded by
--    get_leaderboard_with_rank (migration 008) and have no callers
--    in the iOS app, React web client, or Node server. Keeping them
--    is surface area that drifts from the active RPC.
--
--    Retained: _leaderboard_age_groups (still used by 008).
--
-- 2. Adds a partial index on skill_progress to accelerate the
--    skillsMastered branch of get_leaderboard_with_rank. The existing
--    idx_skill_progress_status_user (user_id, status) leads on user_id,
--    which forces a per-user scan; a partial index WHERE status='mastered'
--    lets the planner read only mastered rows directly.
--
-- All statements are idempotent (safe to re-run).
-- ============================================================

-- ============================================================
-- SECTION A: Drop legacy per-category leaderboard RPCs
-- ============================================================
DROP FUNCTION IF EXISTS public.get_weekly_xp_leaderboard(TEXT, INT);
DROP FUNCTION IF EXISTS public.get_alltime_xp_leaderboard(TEXT, INT);
DROP FUNCTION IF EXISTS public.get_mastery_leaderboard(TEXT, INT);
DROP FUNCTION IF EXISTS public.get_streak_leaderboard(TEXT, INT);
DROP FUNCTION IF EXISTS public.get_player_ranks(UUID, TEXT);

-- ============================================================
-- SECTION B: Partial index for skillsMastered leaderboard branch
-- ============================================================
CREATE INDEX IF NOT EXISTS idx_skill_progress_mastered
  ON public.skill_progress(user_id)
  WHERE status = 'mastered';
