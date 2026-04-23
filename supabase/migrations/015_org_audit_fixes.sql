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
