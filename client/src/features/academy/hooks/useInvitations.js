import { useCallback, useEffect, useState } from 'react';
import { supabase } from '../../../lib/supabase';

function generateInviteCode() {
  const chars = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789'; // no I/1/O/0 confusion
  let code = '';
  for (let i = 0; i < 8; i++) {
    code += chars.charAt(Math.floor(Math.random() * chars.length));
  }
  return code;
}

// Postgres unique-violation code (duplicate pending invite)
const PG_UNIQUE_VIOLATION = '23505';

function isDuplicateInviteError(err) {
  return (
    err?.code === PG_UNIQUE_VIOLATION ||
    err?.message?.includes('uq_invitations_pending_email_role')
  );
}

export default function useInvitations(orgId) {
  const [invitations, setInvitations] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  const fetchInvitations = useCallback(async () => {
    if (!orgId) return;
    setLoading(true);
    setError(null);
    try {
      const { data, error: fetchError } = await supabase
        .from('invitations')
        .select('*')
        .eq('organization_id', orgId)
        .order('created_at', { ascending: false });

      if (fetchError) throw fetchError;
      setInvitations(data || []);
    } catch (err) {
      console.error('Error fetching invitations:', err);
      setError(err.message);
    } finally {
      setLoading(false);
    }
  }, [orgId]);

  useEffect(() => {
    fetchInvitations();
  }, [fetchInvitations]);

  const inviteByEmail = async ({ email, role, teamId }) => {
    if (!orgId) throw new Error('No organization selected');
    const { data: { user }, error: authError } = await supabase.auth.getUser();
    if (authError || !user) throw new Error('You must be logged in to send invitations');

    const { data, error: insertError } = await supabase
      .from('invitations')
      .insert({
        organization_id: orgId,
        email: email.toLowerCase().trim(),
        role,
        team_id: teamId || null,
        invited_by: user.id,
      })
      .select()
      .single();

    if (insertError) {
      if (isDuplicateInviteError(insertError)) {
        throw new Error('This email already has a pending invitation for that role.');
      }
      throw insertError;
    }
    setInvitations((prev) => [data, ...prev]);
    return data;
  };

  const inviteByCode = async ({ role, teamId }) => {
    if (!orgId) throw new Error('No organization selected');
    const { data: { user }, error: authError } = await supabase.auth.getUser();
    if (authError || !user) throw new Error('You must be logged in to send invitations');

    const inviteCode = generateInviteCode();
    const { data, error: insertError } = await supabase
      .from('invitations')
      .insert({
        organization_id: orgId,
        invite_code: inviteCode,
        role,
        team_id: teamId || null,
        invited_by: user.id,
      })
      .select()
      .single();

    if (insertError) {
      if (isDuplicateInviteError(insertError)) {
        throw new Error('A pending invite already exists for this role.');
      }
      throw insertError;
    }
    setInvitations((prev) => [data, ...prev]);
    return data;
  };

  const revokeInvitation = async (invitationId) => {
    const { error: updateError } = await supabase
      .from('invitations')
      .update({ status: 'revoked' })
      .eq('id', invitationId);

    if (updateError) throw updateError;
    setInvitations((prev) =>
      prev.map((inv) =>
        inv.id === invitationId ? { ...inv, status: 'revoked' } : inv
      )
    );
  };

  return {
    invitations,
    loading,
    error,
    fetchInvitations,
    inviteByEmail,
    inviteByCode,
    revokeInvitation,
  };
}

// Look up an invite by code via the server-side RPC.
// Previously we did a direct SELECT on invitations, which required the blanket
// "Users can lookup invite codes" RLS policy — that policy let any authenticated
// user enumerate all pending invites. The RPC takes an exact code and returns
// only the preview fields, so enumeration is no longer possible.
export async function lookupInviteCode(code) {
  const { data, error } = await supabase.rpc('lookup_invite_code', { p_code: code });

  if (error) {
    if (error.message?.includes('Invalid or expired')) {
      return { invitation: null, error: 'Invalid or expired invite code' };
    }
    return { invitation: null, error: error.message };
  }
  if (!data) return { invitation: null, error: 'Invalid or expired invite code' };

  // Normalize to the shape the existing UI expects (data.organizations.*)
  return {
    invitation: {
      id: data.invitation_id,
      organization_id: data.organization_id,
      role: data.role,
      team_id: data.team_id,
      team_name: data.team_name,
      organizations: {
        name: data.organization_name,
        type: data.organization_type,
        logo_url: data.organization_logo_url,
        description: data.organization_description,
      },
      already_member: data.already_member,
      requires_email_match: data.requires_email_match,
    },
    error: null,
  };
}

// Accept an invitation atomically via server-side RPC.
// The RPC handles all 3 steps in one transaction and now returns an
// `already_member` flag so clients can distinguish first-join from rejoin.
export async function acceptInvitation(inviteCode) {
  const { data, error } = await supabase.rpc('accept_invitation', {
    p_invite_code: inviteCode,
  });

  if (error) {
    if (error.message?.includes('Invalid or expired')) {
      throw new Error('Invalid or expired invite code');
    }
    throw error;
  }

  return data;
}

// Set the user's primary organization.
export async function setPrimaryOrganization(orgId) {
  const { error } = await supabase.rpc('set_primary_organization', { p_org_id: orgId });
  if (error) throw error;
}
