"use client";

import { useCallback, useEffect, useState } from "react";
import { supabase } from "../supabase";

export type InvitationRole = "player" | "coach" | "parent";
export type InvitationStatus = "pending" | "accepted" | "revoked" | "expired";

export type Invitation = {
  id: string;
  organization_id: string;
  email: string | null;
  invite_code: string | null;
  role: InvitationRole | string;
  team_id: string | null;
  invited_by: string;
  status: InvitationStatus | string;
  created_at: string;
  [k: string]: unknown;
};

const PG_UNIQUE_VIOLATION = "23505";

function isDuplicateInviteError(err: {
  code?: string;
  message?: string;
}): boolean {
  return (
    err.code === PG_UNIQUE_VIOLATION ||
    !!err.message?.includes("uq_invitations_pending_email_role")
  );
}

const CODE_ALPHABET = "ABCDEFGHJKLMNPQRSTUVWXYZ23456789";
function generateInviteCode(): string {
  let code = "";
  for (let i = 0; i < 8; i++) {
    code += CODE_ALPHABET.charAt(
      Math.floor(Math.random() * CODE_ALPHABET.length),
    );
  }
  return code;
}

export function useInvitations(orgId: string | undefined) {
  const [invitations, setInvitations] = useState<Invitation[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const fetchInvitations = useCallback(async () => {
    if (!orgId) return;
    setLoading(true);
    setError(null);
    try {
      const { data, error: fetchError } = await supabase
        .from("invitations")
        .select("*")
        .eq("organization_id", orgId)
        .order("created_at", { ascending: false });
      if (fetchError) throw fetchError;
      setInvitations((data ?? []) as Invitation[]);
    } catch (err) {
      setError((err as Error).message);
    } finally {
      setLoading(false);
    }
  }, [orgId]);

  useEffect(() => {
    fetchInvitations();
  }, [fetchInvitations]);

  const inviteByEmail = async ({
    email,
    role,
    teamId,
  }: {
    email: string;
    role: InvitationRole;
    teamId?: string | null;
  }): Promise<Invitation> => {
    if (!orgId) throw new Error("No organization selected");
    const {
      data: { user },
      error: authError,
    } = await supabase.auth.getUser();
    if (authError || !user) throw new Error("You must be logged in to send invitations");

    const { data, error: insertError } = await supabase
      .from("invitations")
      .insert({
        organization_id: orgId,
        email: email.toLowerCase().trim(),
        role,
        team_id: teamId ?? null,
        invited_by: user.id,
      })
      .select()
      .single();
    if (insertError) {
      if (isDuplicateInviteError(insertError)) {
        throw new Error("This email already has a pending invitation for that role.");
      }
      throw insertError;
    }
    const inv = data as Invitation;
    setInvitations((prev) => [inv, ...prev]);
    return inv;
  };

  const inviteByCode = async ({
    role,
    teamId,
  }: {
    role: InvitationRole;
    teamId?: string | null;
  }): Promise<Invitation> => {
    if (!orgId) throw new Error("No organization selected");
    const {
      data: { user },
      error: authError,
    } = await supabase.auth.getUser();
    if (authError || !user) throw new Error("You must be logged in to send invitations");

    const code = generateInviteCode();
    const { data, error: insertError } = await supabase
      .from("invitations")
      .insert({
        organization_id: orgId,
        invite_code: code,
        role,
        team_id: teamId ?? null,
        invited_by: user.id,
      })
      .select()
      .single();
    if (insertError) {
      if (isDuplicateInviteError(insertError)) {
        throw new Error("A pending invite already exists for this role.");
      }
      throw insertError;
    }
    const inv = data as Invitation;
    setInvitations((prev) => [inv, ...prev]);
    return inv;
  };

  const revokeInvitation = async (invitationId: string): Promise<void> => {
    const { error: updateError } = await supabase
      .from("invitations")
      .update({ status: "revoked" })
      .eq("id", invitationId);
    if (updateError) throw updateError;
    setInvitations((prev) =>
      prev.map((inv) =>
        inv.id === invitationId ? { ...inv, status: "revoked" } : inv,
      ),
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
