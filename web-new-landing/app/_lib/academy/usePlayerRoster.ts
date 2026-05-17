"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import { supabase } from "../supabase";

export type PlayerStatus = "active" | "idle" | "inactive";

export type Player = {
  player_id: string;
  display_name: string | null;
  age_group: string | null;
  current_level: number;
  total_xp: number;
  xp_this_week: number;
  skills_mastered: number;
  current_streak: number;
  longest_streak: number;
  avg_self_rating: number;
  last_practice_date: string | null;
  [k: string]: unknown;
};

type SortField = "display_name" | "current_level" | "total_xp" | "current_streak";
type SortDir = "asc" | "desc";

export function getPlayerStatus(player: Player): PlayerStatus {
  if (!player.last_practice_date) return "inactive";
  const [y, m, d] = player.last_practice_date.split("-").map(Number);
  const practiceDate = new Date(y, m - 1, d);
  const daysSince = Math.floor(
    (Date.now() - practiceDate.getTime()) / 86_400_000,
  );
  if (daysSince <= 3) return "active";
  if (daysSince <= 7) return "idle";
  return "inactive";
}

export function usePlayerRoster(orgId: string | undefined) {
  const [players, setPlayers] = useState<Player[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [sortField, setSortField] = useState<SortField>("display_name");
  const [sortDir, setSortDir] = useState<SortDir>("asc");
  const [search, setSearch] = useState("");
  const [filterAgeGroup, setFilterAgeGroup] = useState("");
  const [filterStatus, setFilterStatus] = useState<PlayerStatus | "">("");

  const fetchRoster = useCallback(async () => {
    if (!orgId) return;
    setLoading(true);
    setError(null);
    try {
      const { data, error: rpcError } = await supabase.rpc(
        "get_academy_player_roster",
        { p_org_id: orgId },
      );
      if (rpcError) throw rpcError;
      setPlayers((data ?? []) as Player[]);
    } catch (err) {
      setError((err as Error).message);
    } finally {
      setLoading(false);
    }
  }, [orgId]);

  useEffect(() => {
    fetchRoster();
  }, [fetchRoster]);

  const toggleSort = (field: SortField) => {
    if (sortField === field) {
      setSortDir((d) => (d === "asc" ? "desc" : "asc"));
    } else {
      setSortField(field);
      setSortDir("asc");
    }
  };

  const filteredPlayers = useMemo(() => {
    let result = [...players];
    if (search.trim()) {
      const term = search.toLowerCase();
      result = result.filter((p) =>
        p.display_name?.toLowerCase().includes(term),
      );
    }
    if (filterAgeGroup) {
      result = result.filter((p) => p.age_group === filterAgeGroup);
    }
    if (filterStatus) {
      result = result.filter((p) => getPlayerStatus(p) === filterStatus);
    }
    result.sort((a, b) => {
      const av = (a[sortField] ?? "") as string | number;
      const bv = (b[sortField] ?? "") as string | number;
      if (typeof av === "string") {
        const cmp = av.localeCompare(String(bv));
        return sortDir === "asc" ? cmp : -cmp;
      }
      const cmp = (av as number) - (bv as number);
      return sortDir === "asc" ? cmp : -cmp;
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
