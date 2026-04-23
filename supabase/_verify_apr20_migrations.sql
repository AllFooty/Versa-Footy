-- ============================================================
-- VERIFICATION — run AFTER the combined migrations succeed.
-- Expected: every has_* = 1, legacy_* = 0, leaderboard_args shows the 5-arg signature.
-- ============================================================
SELECT
  (SELECT COUNT(*) FROM pg_proc WHERE proname = 'lookup_invite_code' AND pronamespace = 'public'::regnamespace) AS has_lookup_invite_code,
  (SELECT COUNT(*) FROM pg_proc WHERE proname = 'get_player_level_progress' AND pronamespace = 'public'::regnamespace) AS has_level_progress,
  (SELECT COUNT(*) FROM pg_proc WHERE proname = 'xp_required_for_level' AND pronamespace = 'public'::regnamespace) AS has_xp_required,
  (SELECT COUNT(*) FROM pg_proc WHERE proname = 'set_primary_organization' AND pronamespace = 'public'::regnamespace) AS has_set_primary,
  (SELECT COUNT(*) FROM pg_proc WHERE proname = 'ensure_primary_org_on_insert' AND pronamespace = 'public'::regnamespace) AS has_ensure_primary_trigger,
  (SELECT COUNT(*) FROM pg_proc WHERE proname = 'promote_primary_org_on_delete' AND pronamespace = 'public'::regnamespace) AS has_promote_primary_trigger,
  (SELECT COUNT(*) FROM information_schema.columns WHERE table_schema='public' AND table_name='organization_members' AND column_name='is_primary') AS has_is_primary_col,
  (SELECT COUNT(*) FROM pg_indexes WHERE schemaname='public' AND indexname='uq_org_members_one_primary_per_user') AS has_uq_primary_idx,
  (SELECT COUNT(*) FROM pg_indexes WHERE schemaname='public' AND indexname='uq_invitations_pending_email_role') AS has_uq_invite_idx,
  (SELECT COUNT(*) FROM pg_indexes WHERE schemaname='public' AND indexname='idx_skill_progress_mastered') AS has_mastered_idx,
  (SELECT pg_get_function_arguments(oid) FROM pg_proc WHERE proname = 'get_leaderboard_with_rank' AND pronamespace = 'public'::regnamespace LIMIT 1) AS leaderboard_args,
  (SELECT COUNT(*) FROM pg_policy p JOIN pg_class c ON p.polrelid=c.oid WHERE c.relname='invitations' AND polname='Admins can insert invitations') AS has_new_invite_insert_policy,
  (SELECT COUNT(*) FROM pg_proc WHERE proname IN ('get_weekly_xp_leaderboard','get_alltime_xp_leaderboard','get_mastery_leaderboard','get_streak_leaderboard','get_player_ranks') AND pronamespace = 'public'::regnamespace) AS legacy_leaderboards_should_be_zero;
