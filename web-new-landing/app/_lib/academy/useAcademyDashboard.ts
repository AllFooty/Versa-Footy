"use client";

import { useCallback, useEffect, useState } from "react";
import { supabase } from "../supabase";

export type AcademyStats = {
  total_players?: number;
  active_this_week?: number;
  total_skills_mastered?: number;
  avg_player_level?: number;
  total_xp_this_week?: number;
  avg_streak?: number;
} | null;

export type WeeklyActivityPoint = {
  week: string;
  activePlayers: number;
  totalXp: number;
};

type DailyActivityRow = {
  user_id: string;
  activity_date: string;
  xp_earned: number | null;
};

function getWeeksAgoDate(weeks: number): string {
  const d = new Date();
  d.setDate(d.getDate() - weeks * 7);
  return d.toISOString().split("T")[0];
}

function parseLocalDate(dateStr: string): Date | null {
  const match = /^(\d{4})-(\d{2})-(\d{2})/.exec(dateStr);
  if (!match) return null;
  const d = new Date(Number(match[1]), Number(match[2]) - 1, Number(match[3]));
  return Number.isNaN(d.getTime()) ? null : d;
}

function getWeekKey(date: Date, lang: string): string {
  const d = new Date(date);
  const day = d.getDay();
  const diff = d.getDate() - day + (day === 0 ? -6 : 1);
  d.setDate(diff);
  const month = d.toLocaleString(lang, { month: "short" });
  return `${month} ${d.getDate()}`;
}

function aggregateWeekly(
  activities: DailyActivityRow[],
  lang: string,
): WeeklyActivityPoint[] {
  const weeks: Record<
    string,
    { week: string; activePlayers: Set<string>; totalXp: number }
  > = {};
  for (let i = 11; i >= 0; i--) {
    const d = new Date();
    d.setDate(d.getDate() - i * 7);
    const key = getWeekKey(d, lang);
    weeks[key] = { week: key, activePlayers: new Set(), totalXp: 0 };
  }
  activities.forEach(({ user_id, activity_date, xp_earned }) => {
    const parsed = parseLocalDate(activity_date);
    if (!parsed) return;
    const key = getWeekKey(parsed, lang);
    if (weeks[key]) {
      weeks[key].activePlayers.add(user_id);
      weeks[key].totalXp += xp_earned ?? 0;
    }
  });
  return Object.values(weeks).map((w) => ({
    week: w.week,
    activePlayers: w.activePlayers.size,
    totalXp: w.totalXp,
  }));
}

export function useAcademyDashboard(orgId: string | undefined, lang: string = "en") {
  const [stats, setStats] = useState<AcademyStats>(null);
  const [weeklyActivity, setWeeklyActivity] = useState<WeeklyActivityPoint[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const fetchDashboard = useCallback(async () => {
    if (!orgId) return;
    setLoading(true);
    setError(null);
    try {
      const { data: statsData, error: statsError } = await supabase.rpc(
        "get_academy_dashboard_stats",
        { p_org_id: orgId },
      );
      if (statsError) throw statsError;
      setStats(statsData as AcademyStats);

      const { data: members, error: membersError } = await supabase
        .from("organization_members")
        .select("user_id")
        .eq("organization_id", orgId)
        .eq("role", "player");
      if (membersError) throw membersError;

      const playerIds = (members ?? []).map((m: { user_id: string }) => m.user_id);
      if (playerIds.length === 0) {
        setWeeklyActivity(aggregateWeekly([], lang));
      } else {
        const { data: activityData, error: activityError } = await supabase
          .from("daily_activity")
          .select("user_id, activity_date, xp_earned")
          .gte("activity_date", getWeeksAgoDate(12))
          .in("user_id", playerIds);
        if (activityError) throw activityError;
        setWeeklyActivity(aggregateWeekly((activityData ?? []) as DailyActivityRow[], lang));
      }
    } catch (err) {
      setError((err as Error).message);
    } finally {
      setLoading(false);
    }
  }, [orgId, lang]);

  useEffect(() => {
    fetchDashboard();
  }, [fetchDashboard]);

  return { stats, weeklyActivity, loading, error, refresh: fetchDashboard };
}
