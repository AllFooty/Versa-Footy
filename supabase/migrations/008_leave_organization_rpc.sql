-- ============================================
-- Migration 008: Atomic leave_organization RPC
--
-- Replaces the multi-step client-side leave flow
-- (fetch teams → delete team_members → delete org_members)
-- with a single atomic server-side function.
-- ============================================

CREATE OR REPLACE FUNCTION leave_organization(p_organization_id UUID)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  current_user_id UUID;
BEGIN
  current_user_id := auth.uid();

  IF current_user_id IS NULL THEN
    RAISE EXCEPTION 'Not authenticated';
  END IF;

  -- 1. Remove from all teams belonging to this organization
  DELETE FROM public.team_members
  WHERE player_id = current_user_id
    AND team_id IN (
      SELECT id FROM public.teams
      WHERE organization_id = p_organization_id
    );

  -- 2. Remove from the organization itself
  DELETE FROM public.organization_members
  WHERE user_id = current_user_id
    AND organization_id = p_organization_id;
END;
$$;

-- Grants: only authenticated users can call this
GRANT EXECUTE ON FUNCTION leave_organization(UUID) TO authenticated;
