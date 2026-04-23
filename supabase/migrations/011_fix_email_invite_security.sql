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
