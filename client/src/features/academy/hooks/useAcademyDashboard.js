import { useCallback, useEffect, useState } from 'react';
import { supabase } from '../../../lib/supabase';

export default function useAcademyDashboard(orgId) {
  const [stats, setStats] = useState(null);
  const [weeklyActivity, setWeeklyActivity] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  const fetchDashboard = useCallback(async () => {
    if (!orgId) return;
    setLoading(true);
    setError(null);

    try {
      // Fetch KPI stats via RPC
      const { data: statsData, error: statsError } = await supabase.rpc(
        'get_academy_dashboard_stats',
        { p_org_id: orgId }
      );
      if (statsError) throw statsError;
      setStats(statsData);

      // Fetch player IDs in this org
      const { data: members, error: membersError } = await supabase
        .from('organization_members')
        .select('user_id')
        .eq('organization_id', orgId)
        .eq('role', 'player');

      if (membersError) throw membersError;

      const playerIds = (members || []).map((m) => m.user_id);

      // Skip activity query if no players (empty .in() causes errors)
      if (playerIds.length === 0) {
        setWeeklyActivity(aggregateWeekly([]));
      } else {
        const { data: activityData, error: activityError } = await supabase
          .from('daily_activity')
          .select('user_id, activity_date, xp_earned')
          .gte('activity_date', getWeeksAgoDate(12))
          .in('user_id', playerIds);

        if (activityError) throw activityError;
        setWeeklyActivity(aggregateWeekly(activityData || []));
      }
    } catch (err) {
      console.error('Error fetching dashboard:', err);
      setError(err.message);
    } finally {
      setLoading(false);
    }
  }, [orgId]);

  useEffect(() => {
    fetchDashboard();
  }, [fetchDashboard]);

  return { stats, weeklyActivity, loading, error, refresh: fetchDashboard };
}

function getWeeksAgoDate(weeks) {
  const d = new Date();
  d.setDate(d.getDate() - weeks * 7);
  return d.toISOString().split('T')[0];
}

function parseLocalDate(dateStr) {
  if (typeof dateStr !== 'string') return null;
  const match = /^(\d{4})-(\d{2})-(\d{2})/.exec(dateStr);
  if (!match) return null;
  const year = Number(match[1]);
  const month = Number(match[2]);
  const day = Number(match[3]);
  const d = new Date(year, month - 1, day);
  return Number.isNaN(d.getTime()) ? null : d;
}

function aggregateWeekly(activities) {
  const weeks = {};

  // Initialize last 12 weeks
  for (let i = 11; i >= 0; i--) {
    const d = new Date();
    d.setDate(d.getDate() - i * 7);
    const weekKey = getWeekKey(d);
    weeks[weekKey] = { week: weekKey, activePlayers: new Set(), totalXp: 0 };
  }

  activities.forEach(({ user_id, activity_date, xp_earned }) => {
    const parsed = parseLocalDate(activity_date);
    if (!parsed) return;
    const weekKey = getWeekKey(parsed);
    if (weeks[weekKey]) {
      weeks[weekKey].activePlayers.add(user_id);
      weeks[weekKey].totalXp += xp_earned || 0;
    }
  });

  return Object.values(weeks).map((w) => ({
    week: w.week,
    activePlayers: w.activePlayers.size,
    totalXp: w.totalXp,
  }));
}

function getWeekKey(date) {
  const d = new Date(date);
  // Get Monday of the week
  const day = d.getDay();
  const diff = d.getDate() - day + (day === 0 ? -6 : 1);
  d.setDate(diff);
  const month = d.toLocaleString('en', { month: 'short' });
  return `${month} ${d.getDate()}`;
}
