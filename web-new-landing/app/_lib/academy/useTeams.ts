"use client";

import { useCallback, useEffect, useState } from "react";
import { supabase } from "../supabase";

export type Team = {
  id: string;
  organization_id: string;
  name: string;
  age_group: string | null;
  player_count: number;
  [k: string]: unknown;
};

export type TeamMember = {
  id: string;
  display_name: string | null;
  age_group: string | null;
  current_level: number;
  total_xp: number;
};

export function useTeams(orgId: string | undefined) {
  const [teams, setTeams] = useState<Team[]>([]);
  const [loading, setLoading] = useState(false);

  const fetchTeams = useCallback(async () => {
    if (!orgId) return;
    setLoading(true);
    const { data, error } = await supabase
      .from("teams")
      .select("*, team_members(player_id)")
      .eq("organization_id", orgId)
      .order("name");
    if (!error) {
      setTeams(
        (data ?? []).map((row: { team_members?: unknown[] } & Record<string, unknown>) => ({
          ...(row as Omit<Team, "player_count">),
          player_count: row.team_members?.length ?? 0,
        })) as Team[],
      );
    }
    setLoading(false);
  }, [orgId]);

  useEffect(() => {
    fetchTeams();
  }, [fetchTeams]);

  const createTeam = async ({
    name,
    age_group,
  }: {
    name: string;
    age_group: string | null;
  }) => {
    if (!orgId) throw new Error("No organization selected");
    const { error } = await supabase
      .from("teams")
      .insert({ organization_id: orgId, name, age_group });
    if (error) throw error;
    await fetchTeams();
  };

  const deleteTeam = async (teamId: string) => {
    const { error } = await supabase.from("teams").delete().eq("id", teamId);
    if (error) throw error;
    await fetchTeams();
  };

  const getTeamMembers = async (teamId: string): Promise<TeamMember[]> => {
    const { data: members } = await supabase
      .from("team_members")
      .select("player_id")
      .eq("team_id", teamId);
    if (!members?.length) return [];
    const playerIds = members.map((m: { player_id: string }) => m.player_id);
    const { data: profiles } = await supabase
      .from("player_profiles")
      .select("id, display_name, age_group, current_level, total_xp")
      .in("id", playerIds);
    return (profiles ?? []) as TeamMember[];
  };

  const addPlayer = async (teamId: string, playerId: string) => {
    const { error } = await supabase
      .from("team_members")
      .insert({ team_id: teamId, player_id: playerId });
    if (error) throw error;
    await fetchTeams();
  };

  const removePlayer = async (teamId: string, playerId: string) => {
    const { error } = await supabase
      .from("team_members")
      .delete()
      .match({ team_id: teamId, player_id: playerId });
    if (error) throw error;
    await fetchTeams();
  };

  return {
    teams,
    loading,
    createTeam,
    deleteTeam,
    getTeamMembers,
    addPlayer,
    removePlayer,
    refetch: fetchTeams,
  };
}
