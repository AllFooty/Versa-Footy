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
    const { data: { user } } = await supabase.auth.getUser();

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

    if (insertError) throw insertError;
    setInvitations((prev) => [data, ...prev]);
    return data;
  };

  const inviteByCode = async ({ role, teamId }) => {
    if (!orgId) throw new Error('No organization selected');
    const { data: { user } } = await supabase.auth.getUser();

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

    if (insertError) throw insertError;
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

// Standalone function to look up an invite by code (used in join flow)
export async function lookupInviteCode(code) {
  const { data, error } = await supabase
    .from('invitations')
    .select('*, organizations(name, type)')
    .eq('invite_code', code.toUpperCase().trim())
    .eq('status', 'pending')
    .single();

  if (error) return { invitation: null, error: error.message };
  if (!data) return { invitation: null, error: 'Invalid or expired invite code' };

  // Check expiration client-side too
  if (data.expires_at && new Date(data.expires_at) < new Date()) {
    return { invitation: null, error: 'This invite code has expired' };
  }

  return { invitation: data, error: null };
}

// Accept an invitation atomically via server-side RPC.
// The RPC handles all 3 steps in one transaction:
//   1. INSERT into organization_members
//   2. INSERT into team_members (if team specified)
//   3. UPDATE invitations status to 'accepted'
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
