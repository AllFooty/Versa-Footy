import { useCallback, useEffect, useState } from 'react';
import { supabase } from '../../../lib/supabase';

export default function useTeams(orgId) {
  const [teams, setTeams] = useState([]);
  const [loading, setLoading] = useState(false);

  const fetchTeams = useCallback(async () => {
    if (!orgId) return;
    setLoading(true);

    const { data, error } = await supabase
      .from('teams')
      .select('*, team_members(player_id)')
      .eq('organization_id', orgId)
      .order('name');

    if (!error) {
      setTeams(
        (data || []).map((t) => ({
          ...t,
          player_count: t.team_members?.length || 0,
        }))
      );
    }
    setLoading(false);
  }, [orgId]);

  useEffect(() => {
    fetchTeams();
  }, [fetchTeams]);

  const createTeam = async ({ name, age_group }) => {
    const { error } = await supabase
      .from('teams')
      .insert({ organization_id: orgId, name, age_group });
    if (error) throw error;
    await fetchTeams();
  };

  const deleteTeam = async (teamId) => {
    const { error } = await supabase.from('teams').delete().eq('id', teamId);
    if (error) throw error;
    await fetchTeams();
  };

  const getTeamMembers = async (teamId) => {
    const { data: members } = await supabase
      .from('team_members')
      .select('player_id')
      .eq('team_id', teamId);

    if (!members?.length) return [];

    const playerIds = members.map((m) => m.player_id);
    const { data: profiles } = await supabase
      .from('player_profiles')
      .select('id, display_name, age_group, current_level, total_xp')
      .in('id', playerIds);

    return profiles || [];
  };

  const addPlayer = async (teamId, playerId) => {
    const { error } = await supabase
      .from('team_members')
      .insert({ team_id: teamId, player_id: playerId });
    if (error) throw error;
    await fetchTeams();
  };

  const removePlayer = async (teamId, playerId) => {
    const { error } = await supabase
      .from('team_members')
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
