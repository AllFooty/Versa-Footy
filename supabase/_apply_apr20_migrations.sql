-- ================================================================
-- COMBINED APRIL 20 MIGRATIONS (v5 — verification split out)
-- Apply order: 011 -> 013 -> 014 -> 015 -> 016
-- All statements are idempotent (safe to re-run).
-- ================================================================

-- Disable strict function-body validation for this script.
SET check_function_bodies = off;



-- ============================================================
-- === 011_fix_email_invite_security ===
-- ============================================================
-- Migration 011: Fix email invite security gap
-- The accept_invitation RPC previously accepted any authenticated user regardless
-- of whether the invite was email-targeted. This migration adds a check that
-- ensures email-specific invites can only be accepted by the matching user.

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
    v_user_email TEXT;
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

    -- 2. For email-targeted invites, verify the caller's email matches
    IF v_invitation.email IS NOT NULL THEN
        SELECT email INTO v_user_email FROM auth.users WHERE id = auth.uid();
        IF lower(v_user_email) != lower(v_invitation.email) THEN
            RAISE EXCEPTION 'This invitation was sent to a different email address';
        END IF;
    END IF;

    -- Fetch org info for the response
    SELECT name, type INTO v_org_name, v_org_type
    FROM organizations
    WHERE id = v_invitation.organization_id;

    -- 3. Insert into organization_members
    INSERT INTO organization_members (organization_id, user_id, role, invited_by)
    VALUES (
        v_invitation.organization_id,
        auth.uid(),
        v_invitation.role,
        v_invitation.invited_by
    )
    ON CONFLICT (organization_id, user_id) DO NOTHING;

    -- 4. Insert into team_members if a team is specified
    IF v_invitation.team_id IS NOT NULL THEN
        INSERT INTO team_members (team_id, player_id)
        VALUES (v_invitation.team_id, auth.uid())
        ON CONFLICT (team_id, player_id) DO NOTHING;

        SELECT name INTO v_team_name
        FROM teams
        WHERE id = v_invitation.team_id;
    END IF;

    -- 5. Mark invitation as accepted
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


-- ============================================================
-- === 013_add_combined_leaderboard_rpc ===
-- ============================================================
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


-- ============================================================
-- === 014_cleanup_leaderboard ===
-- ============================================================
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


-- ============================================================
-- === 015_org_audit_fixes ===
-- ============================================================
-- ============================================
-- Migration 012: Organizations audit fixes
--
-- Consolidates security, data integrity, and UX fixes for the
-- Organizations (Academy Support) features audited in April 2026.
--
-- P0 Security:
--   * Remove blanket SELECT policy on invitations (invite-code enumeration).
--   * Add role-ceiling enforcement on invitation inserts.
--
-- P1 Data integrity:
--   * is_primary flag on organization_members with partial unique index
--     and auto-promote triggers (insert + delete).
--   * accept_invitation returns already_member for client UX.
--   * get_my_organizations deterministically orders (primary first).
--   * Inline expiry sweep inside lookup_invite_code — no pg_cron needed.
--
-- P2 UX:
--   * lookup_invite_code RPC returns minimal preview payload.
--   * set_primary_organization RPC.
--   * Unique partial index prevents duplicate pending email invites.
--
-- P3 Cleanup:
--   * Drop orphan RPCs.
--
-- All sections are idempotent (IF NOT EXISTS / CREATE OR REPLACE /
-- DROP ... IF EXISTS) so the migration can be re-applied safely.
-- ============================================


-- ============================================
-- A. is_primary column on organization_members
-- ============================================
ALTER TABLE public.organization_members
  ADD COLUMN IF NOT EXISTS is_primary BOOLEAN NOT NULL DEFAULT false;

-- At most one primary row per user
CREATE UNIQUE INDEX IF NOT EXISTS uq_org_members_one_primary_per_user
  ON public.organization_members(user_id)
  WHERE is_primary = true;

-- Backfill: mark the earliest-joined membership per user as primary.
-- Only runs when no existing primary is set, so re-applying is safe.
UPDATE public.organization_members om
SET is_primary = true
WHERE om.id IN (
  SELECT DISTINCT ON (user_id) id
  FROM public.organization_members
  WHERE NOT EXISTS (
    SELECT 1 FROM public.organization_members om2
    WHERE om2.user_id = organization_members.user_id
      AND om2.is_primary = true
  )
  ORDER BY user_id, joined_at ASC NULLS LAST, id ASC
);


-- ============================================
-- B. Auto-primary triggers
-- ============================================

-- On INSERT: if the user has no primary yet, mark this row primary.
CREATE OR REPLACE FUNCTION public.ensure_primary_org_on_insert()
RETURNS TRIGGER
LANGUAGE plpgsql
AS $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM public.organization_members
    WHERE user_id = NEW.user_id
      AND is_primary = true
      AND id <> NEW.id
  ) THEN
    NEW.is_primary := true;
  END IF;
  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS trg_ensure_primary_org ON public.organization_members;
CREATE TRIGGER trg_ensure_primary_org
  BEFORE INSERT ON public.organization_members
  FOR EACH ROW EXECUTE FUNCTION public.ensure_primary_org_on_insert();

-- On DELETE: if we removed the primary row and the user has other
-- memberships, promote the earliest remaining one.
CREATE OR REPLACE FUNCTION public.promote_primary_org_on_delete()
RETURNS TRIGGER
LANGUAGE plpgsql
AS $$
BEGIN
  IF OLD.is_primary THEN
    UPDATE public.organization_members
    SET is_primary = true
    WHERE id = (
      SELECT id FROM public.organization_members
      WHERE user_id = OLD.user_id
      ORDER BY joined_at ASC NULLS LAST, id ASC
      LIMIT 1
    );
  END IF;
  RETURN OLD;
END;
$$;

DROP TRIGGER IF EXISTS trg_promote_primary_org ON public.organization_members;
CREATE TRIGGER trg_promote_primary_org
  AFTER DELETE ON public.organization_members
  FOR EACH ROW EXECUTE FUNCTION public.promote_primary_org_on_delete();


-- ============================================
-- C. Replace invite-code enumeration policy with RPC
-- ============================================
DROP POLICY IF EXISTS "Users can lookup invite codes" ON public.invitations;

CREATE OR REPLACE FUNCTION public.lookup_invite_code(p_code TEXT)
RETURNS JSON
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_code TEXT;
  v_inv RECORD;
  v_org RECORD;
  v_team_name TEXT;
BEGIN
  IF auth.uid() IS NULL THEN
    RAISE EXCEPTION 'Not authenticated';
  END IF;

  v_code := UPPER(TRIM(p_code));
  IF v_code IS NULL OR length(v_code) < 6 THEN
    RAISE EXCEPTION 'Invalid invite code format';
  END IF;

  -- Opportunistic scoped expiry sweep: only touches the row being looked up.
  UPDATE public.invitations
    SET status = 'expired'
  WHERE invite_code = v_code
    AND status = 'pending'
    AND expires_at IS NOT NULL
    AND expires_at <= NOW();

  SELECT * INTO v_inv
  FROM public.invitations
  WHERE invite_code = v_code
    AND status = 'pending'
    AND (expires_at IS NULL OR expires_at > NOW());

  IF NOT FOUND THEN
    RAISE EXCEPTION 'Invalid or expired invite code';
  END IF;

  SELECT id, name, type, logo_url, description INTO v_org
  FROM public.organizations
  WHERE id = v_inv.organization_id;

  IF v_inv.team_id IS NOT NULL THEN
    SELECT name INTO v_team_name FROM public.teams WHERE id = v_inv.team_id;
  END IF;

  RETURN json_build_object(
    'invitation_id', v_inv.id,
    'organization_id', v_org.id,
    'organization_name', v_org.name,
    'organization_type', v_org.type,
    'organization_logo_url', v_org.logo_url,
    'organization_description', v_org.description,
    'role', v_inv.role,
    'team_id', v_inv.team_id,
    'team_name', v_team_name,
    'requires_email_match', (v_inv.email IS NOT NULL),
    'already_member', EXISTS (
      SELECT 1 FROM public.organization_members
      WHERE organization_id = v_org.id AND user_id = auth.uid()
    )
  );
END;
$$;


-- ============================================
-- D. accept_invitation with already_member flag
-- Replaces migration 011's version. Same signature + existing keys.
-- ============================================
CREATE OR REPLACE FUNCTION public.accept_invitation(p_invite_code TEXT)
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
  v_user_email TEXT;
  v_already_member BOOLEAN;
BEGIN
  -- 1. Look up and validate
  SELECT * INTO v_invitation
  FROM public.invitations
  WHERE invite_code = UPPER(TRIM(p_invite_code))
    AND status = 'pending'
    AND (expires_at IS NULL OR expires_at > NOW());

  IF NOT FOUND THEN
    RAISE EXCEPTION 'Invalid or expired invite code';
  END IF;

  -- 2. Email-targeted invites: verify caller's email matches
  IF v_invitation.email IS NOT NULL THEN
    SELECT email INTO v_user_email FROM auth.users WHERE id = auth.uid();
    IF lower(v_user_email) != lower(v_invitation.email) THEN
      RAISE EXCEPTION 'This invitation was sent to a different email address';
    END IF;
  END IF;

  -- Fetch org info for the response
  SELECT name, type INTO v_org_name, v_org_type
  FROM public.organizations
  WHERE id = v_invitation.organization_id;

  -- 3. Check whether caller is already a member (for UX copy)
  SELECT EXISTS (
    SELECT 1 FROM public.organization_members
    WHERE organization_id = v_invitation.organization_id
      AND user_id = auth.uid()
  ) INTO v_already_member;

  IF NOT v_already_member THEN
    INSERT INTO public.organization_members (organization_id, user_id, role, invited_by)
    VALUES (
      v_invitation.organization_id,
      auth.uid(),
      v_invitation.role,
      v_invitation.invited_by
    );
  END IF;

  -- 4. Insert into team_members if a team is specified
  IF v_invitation.team_id IS NOT NULL THEN
    INSERT INTO public.team_members (team_id, player_id)
    VALUES (v_invitation.team_id, auth.uid())
    ON CONFLICT (team_id, player_id) DO NOTHING;

    SELECT name INTO v_team_name FROM public.teams WHERE id = v_invitation.team_id;
  END IF;

  -- 5. Mark invitation accepted
  UPDATE public.invitations
  SET status = 'accepted',
      accepted_by = auth.uid()
  WHERE id = v_invitation.id;

  RETURN json_build_object(
    'id', v_invitation.id,
    'organization_id', v_invitation.organization_id,
    'organization_name', v_org_name,
    'organization_type', v_org_type,
    'role', v_invitation.role,
    'team_id', v_invitation.team_id,
    'team_name', v_team_name,
    'invited_by', v_invitation.invited_by,
    'already_member', v_already_member
  );
END;
$$;


-- ============================================
-- E. Role-escalation guard on invitations
-- Split the blanket FOR ALL policy into SELECT/INSERT/UPDATE/DELETE
-- with the INSERT check enforcing role ceiling.
-- ============================================
DROP POLICY IF EXISTS "Admins can manage invitations" ON public.invitations;

DROP POLICY IF EXISTS "Admins can view invitations" ON public.invitations;
CREATE POLICY "Admins can view invitations"
  ON public.invitations FOR SELECT
  USING (
    organization_id IN (
      SELECT organization_id FROM public.organization_members
      WHERE user_id = auth.uid() AND role IN ('owner', 'admin', 'coach')
    )
  );

DROP POLICY IF EXISTS "Admins can insert invitations" ON public.invitations;
CREATE POLICY "Admins can insert invitations"
  ON public.invitations FOR INSERT
  WITH CHECK (
    invited_by = auth.uid()
    AND CASE (
      SELECT role FROM public.organization_members
      WHERE user_id = auth.uid()
        AND organization_id = invitations.organization_id
    )
      WHEN 'owner' THEN TRUE
      WHEN 'admin' THEN invitations.role IN ('coach', 'player', 'parent')
      WHEN 'coach' THEN invitations.role IN ('player', 'parent')
      ELSE FALSE
    END
  );

DROP POLICY IF EXISTS "Admins can update invitations" ON public.invitations;
CREATE POLICY "Admins can update invitations"
  ON public.invitations FOR UPDATE
  USING (
    organization_id IN (
      SELECT organization_id FROM public.organization_members
      WHERE user_id = auth.uid() AND role IN ('owner', 'admin', 'coach')
    )
  );

DROP POLICY IF EXISTS "Admins can delete invitations" ON public.invitations;
CREATE POLICY "Admins can delete invitations"
  ON public.invitations FOR DELETE
  USING (
    organization_id IN (
      SELECT organization_id FROM public.organization_members
      WHERE user_id = auth.uid() AND role IN ('owner', 'admin', 'coach')
    )
  );


-- ============================================
-- F. Duplicate-invite prevention (pending email invites)
-- ============================================
CREATE UNIQUE INDEX IF NOT EXISTS uq_invitations_pending_email_role
  ON public.invitations (organization_id, lower(email), role)
  WHERE status = 'pending' AND email IS NOT NULL;


-- ============================================
-- G. get_my_organizations: include is_primary + deterministic order
-- Drop first — adding is_primary changes the return type, which
-- CREATE OR REPLACE cannot handle (PG error 42P13).
-- ============================================
DROP FUNCTION IF EXISTS public.get_my_organizations();

CREATE OR REPLACE FUNCTION public.get_my_organizations()
RETURNS TABLE (
  id UUID,
  name TEXT,
  type TEXT,
  role TEXT,
  player_count BIGINT,
  coach_count BIGINT,
  is_primary BOOLEAN,
  joined_at TIMESTAMPTZ
)
LANGUAGE sql
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT
    o.id,
    o.name,
    o.type,
    om.role,
    (SELECT COUNT(*) FROM public.organization_members
      WHERE organization_id = o.id AND role = 'player'),
    (SELECT COUNT(*) FROM public.organization_members
      WHERE organization_id = o.id AND role = 'coach'),
    om.is_primary,
    om.joined_at
  FROM public.organizations o
  JOIN public.organization_members om ON o.id = om.organization_id
  WHERE om.user_id = auth.uid()
  ORDER BY om.is_primary DESC, om.joined_at ASC NULLS LAST;
$$;


-- ============================================
-- H. set_primary_organization RPC
-- ============================================
CREATE OR REPLACE FUNCTION public.set_primary_organization(p_org_id UUID)
RETURNS VOID
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  IF auth.uid() IS NULL THEN
    RAISE EXCEPTION 'Not authenticated';
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM public.organization_members
    WHERE user_id = auth.uid() AND organization_id = p_org_id
  ) THEN
    RAISE EXCEPTION 'Not a member of that organization';
  END IF;

  -- Clear any other primary first so the partial unique index is not tripped.
  UPDATE public.organization_members
    SET is_primary = false
  WHERE user_id = auth.uid()
    AND is_primary = true
    AND organization_id <> p_org_id;

  UPDATE public.organization_members
    SET is_primary = true
  WHERE user_id = auth.uid()
    AND organization_id = p_org_id;
END;
$$;


-- ============================================
-- I. Drop orphan RPCs (P3 cleanup) — SKIPPED
--
-- Originally intended to drop get_managed_player_ids(),
-- get_user_managed_org_ids(), user_has_org_role(), user_is_org_member().
--
-- Verified on a live DB that get_managed_player_ids() is still
-- referenced by 6 RLS policies (profiles, daily_activity,
-- exercise_completions, player_profiles, skill_progress,
-- training_sessions). The others likely have similar dependents.
--
-- Dropping would require CASCADE + policy recreation, which is a
-- separate, more invasive change. Deferred to a dedicated migration.
-- ============================================


-- ============================================
-- J. Grants
-- ============================================
GRANT EXECUTE ON FUNCTION public.lookup_invite_code(TEXT) TO authenticated;
REVOKE EXECUTE ON FUNCTION public.lookup_invite_code(TEXT) FROM PUBLIC, anon;

GRANT EXECUTE ON FUNCTION public.accept_invitation(TEXT) TO authenticated;
REVOKE EXECUTE ON FUNCTION public.accept_invitation(TEXT) FROM PUBLIC, anon;

GRANT EXECUTE ON FUNCTION public.set_primary_organization(UUID) TO authenticated;
REVOKE EXECUTE ON FUNCTION public.set_primary_organization(UUID) FROM PUBLIC, anon;

GRANT EXECUTE ON FUNCTION public.get_my_organizations() TO authenticated;


-- ============================================
-- K. Verification
-- ============================================
SELECT 'is_primary column' AS check, COUNT(*) AS present
FROM information_schema.columns
WHERE table_schema = 'public'
  AND table_name = 'organization_members'
  AND column_name = 'is_primary';

SELECT 'primary-per-user index' AS check, COUNT(*) AS present
FROM pg_indexes
WHERE schemaname = 'public'
  AND indexname = 'uq_org_members_one_primary_per_user';

SELECT 'duplicate-invite index' AS check, COUNT(*) AS present
FROM pg_indexes
WHERE schemaname = 'public'
  AND indexname = 'uq_invitations_pending_email_role';


-- ============================================================
-- === 016_level_progress_rpc ===
-- ============================================================
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

