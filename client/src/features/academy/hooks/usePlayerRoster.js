import { useCallback, useEffect, useMemo, useState } from 'react';
import { supabase } from '../../../lib/supabase';

export default function usePlayerRoster(orgId) {
  const [players, setPlayers] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [sortField, setSortField] = useState('display_name');
  const [sortDir, setSortDir] = useState('asc');
  const [search, setSearch] = useState('');
  const [filterAgeGroup, setFilterAgeGroup] = useState('');
  const [filterStatus, setFilterStatus] = useState('');

  const fetchRoster = useCallback(async () => {
    if (!orgId) return;
    setLoading(true);
    setError(null);

    try {
      const { data, error: rpcError } = await supabase.rpc(
        'get_academy_player_roster',
        { p_org_id: orgId }
      );
      if (rpcError) throw rpcError;
      setPlayers(data || []);
    } catch (err) {
      console.error('Error fetching roster:', err);
      setError(err.message);
    } finally {
      setLoading(false);
    }
  }, [orgId]);

  useEffect(() => {
    fetchRoster();
  }, [fetchRoster]);

  const toggleSort = (field) => {
    if (sortField === field) {
      setSortDir((d) => (d === 'asc' ? 'desc' : 'asc'));
    } else {
      setSortField(field);
      setSortDir('asc');
    }
  };

  const filteredPlayers = useMemo(() => {
    let result = [...players];

    // Search filter
    if (search.trim()) {
      const term = search.toLowerCase();
      result = result.filter((p) =>
        p.display_name?.toLowerCase().includes(term)
      );
    }

    // Age group filter
    if (filterAgeGroup) {
      result = result.filter((p) => p.age_group === filterAgeGroup);
    }

    // Status filter
    if (filterStatus) {
      result = result.filter((p) => getPlayerStatus(p) === filterStatus);
    }

    // Sort
    result.sort((a, b) => {
      let aVal = a[sortField];
      let bVal = b[sortField];

      if (aVal == null) aVal = '';
      if (bVal == null) bVal = '';

      if (typeof aVal === 'string') {
        const cmp = aVal.localeCompare(bVal);
        return sortDir === 'asc' ? cmp : -cmp;
      }

      const cmp = aVal - bVal;
      return sortDir === 'asc' ? cmp : -cmp;
    });

    return result;
  }, [players, search, filterAgeGroup, filterStatus, sortField, sortDir]);

  return {
    players: filteredPlayers,
    allPlayers: players,
    loading,
    error,
    sortField,
    sortDir,
    toggleSort,
    search,
    setSearch,
    filterAgeGroup,
    setFilterAgeGroup,
    filterStatus,
    setFilterStatus,
    refresh: fetchRoster,
  };
}

export function getPlayerStatus(player) {
  if (!player.last_practice_date) return 'inactive';
  const [y, m, d] = player.last_practice_date.split('-').map(Number);
  const practiceDate = new Date(y, m - 1, d);
  const daysSince = Math.floor((Date.now() - practiceDate.getTime()) / (1000 * 60 * 60 * 24));
  if (daysSince <= 3) return 'active';
  if (daysSince <= 7) return 'idle';
  return 'inactive';
}
