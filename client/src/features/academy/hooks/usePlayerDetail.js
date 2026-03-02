import { useCallback, useEffect, useState } from 'react';
import { supabase } from '../../../lib/supabase';

export default function usePlayerDetail(playerId) {
  const [profile, setProfile] = useState(null);
  const [skillProgress, setSkillProgress] = useState([]);
  const [dailyActivity, setDailyActivity] = useState([]);
  const [recentSessions, setRecentSessions] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  const fetchDetail = useCallback(async () => {
    if (!playerId) return;
    setLoading(true);
    setError(null);

    try {
      // Fetch all data in parallel
      const [profileRes, skillsRes, activityRes, sessionsRes] = await Promise.all([
        // Player profile + base profile for name
        supabase
          .from('player_profiles')
          .select('*, profiles(full_name, email)')
          .eq('id', playerId)
          .single(),

        // All skill progress with skill/category names
        supabase
          .from('skill_progress')
          .select('*, skills(name, age_group, categories(name, color, icon))')
          .eq('user_id', playerId),

        // Daily activity for last 180 days (for heatmap + trends)
        supabase
          .from('daily_activity')
          .select('*')
          .eq('user_id', playerId)
          .gte('activity_date', getMonthsAgoDate(6))
          .order('activity_date', { ascending: true }),

        // Recent training sessions (last 30 days)
        supabase
          .from('training_sessions')
          .select('*')
          .eq('user_id', playerId)
          .gte('started_at', getMonthsAgoDate(1))
          .order('started_at', { ascending: false }),
      ]);

      if (profileRes.error) throw profileRes.error;
      setProfile(profileRes.data);
      setSkillProgress(skillsRes.data || []);
      setDailyActivity(activityRes.data || []);
      setRecentSessions(sessionsRes.data || []);
    } catch (err) {
      console.error('Error fetching player detail:', err);
      setError(err.message);
    } finally {
      setLoading(false);
    }
  }, [playerId]);

  useEffect(() => {
    fetchDetail();
  }, [fetchDetail]);

  // Compute derived data
  const categoryRadar = computeCategoryRadar(skillProgress);
  const weeklyTrends = computeWeeklyTrends(dailyActivity);
  const skillsByCategory = groupSkillsByCategory(skillProgress);

  return {
    profile,
    skillProgress,
    dailyActivity,
    recentSessions,
    categoryRadar,
    weeklyTrends,
    skillsByCategory,
    loading,
    error,
  };
}

function getMonthsAgoDate(months) {
  const d = new Date();
  d.setMonth(d.getMonth() - months);
  return d.toISOString();
}

function computeCategoryRadar(skills) {
  const categories = {};
  skills.forEach((sp) => {
    const catName = sp.skills?.categories?.name || 'Unknown';
    if (!categories[catName]) {
      categories[catName] = { category: catName, total: 0, mastered: 0 };
    }
    categories[catName].total++;
    if (sp.status === 'mastered') categories[catName].mastered++;
  });

  return Object.values(categories).map((c) => ({
    ...c,
    masteryPercent: c.total > 0 ? Math.round((c.mastered / c.total) * 100) : 0,
  }));
}

function computeWeeklyTrends(activities) {
  const weeks = {};
  activities.forEach(({ activity_date, xp_earned, practice_minutes }) => {
    const weekKey = getWeekKey(new Date(activity_date));
    if (!weeks[weekKey]) {
      weeks[weekKey] = { week: weekKey, xp: 0, minutes: 0, days: 0 };
    }
    weeks[weekKey].xp += xp_earned || 0;
    weeks[weekKey].minutes += practice_minutes || 0;
    weeks[weekKey].days++;
  });

  return Object.values(weeks);
}

function getWeekKey(date) {
  const d = new Date(date);
  const day = d.getDay();
  const diff = d.getDate() - day + (day === 0 ? -6 : 1);
  d.setDate(diff);
  const month = d.toLocaleString('en', { month: 'short' });
  return `${month} ${d.getDate()}`;
}

function groupSkillsByCategory(skills) {
  const groups = {};
  skills.forEach((sp) => {
    const catName = sp.skills?.categories?.name || 'Unknown';
    const catColor = sp.skills?.categories?.color || '#3b82f6';
    const catIcon = sp.skills?.categories?.icon || '';
    if (!groups[catName]) {
      groups[catName] = { name: catName, color: catColor, icon: catIcon, skills: [] };
    }
    groups[catName].skills.push(sp);
  });
  return Object.values(groups);
}
