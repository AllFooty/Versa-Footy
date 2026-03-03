import { useCallback, useEffect, useState } from 'react';
import { supabase } from '../../../lib/supabase';

// Age group ordering for roadmap
const AGE_GROUP_ORDER = ['U-7', 'U-8', 'U-9', 'U-10', 'U-11', 'U-12', 'U-13', 'U-14', 'U-15+'];

export default function usePlayerDetail(playerId) {
  const [profile, setProfile] = useState(null);
  const [skillProgress, setSkillProgress] = useState([]);
  const [allSkills, setAllSkills] = useState([]);
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
      const [profileRes, skillsRes, allSkillsRes, activityRes, sessionsRes] = await Promise.all([
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

        // All skills in the system (for full roadmap including not-started)
        supabase
          .from('skills')
          .select('id, name, age_group, category_id, categories(name, color, icon)')
          .order('id', { ascending: true }),

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
      setAllSkills(allSkillsRes.data || []);
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
  const roadmap = computeRoadmap(profile, allSkills, skillProgress);

  return {
    profile,
    skillProgress,
    allSkills,
    dailyActivity,
    recentSessions,
    categoryRadar,
    weeklyTrends,
    skillsByCategory,
    roadmap,
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

function computeRoadmap(profile, allSkills, progressRecords) {
  if (!profile || allSkills.length === 0) {
    return { playerAgeGroup: null, totalSkillsToMaster: 0, masteredCount: 0, progressPercent: 0, skillsByAge: [], categorySummary: [] };
  }

  const playerAgeGroup = profile.age_group || 'U-12';
  const playerAgeIndex = AGE_GROUP_ORDER.indexOf(playerAgeGroup);

  // Build a lookup of progress by skill_id
  const progressMap = {};
  progressRecords.forEach((sp) => {
    progressMap[sp.skill_id] = sp;
  });

  // Filter skills to those the player should master (their age group and below)
  const relevantSkills = allSkills.filter((skill) => {
    const skillAgeIndex = AGE_GROUP_ORDER.indexOf(skill.age_group);
    return skillAgeIndex >= 0 && skillAgeIndex <= playerAgeIndex;
  });

  // Merge skills with progress
  const skillsWithProgress = allSkills.map((skill) => {
    const progress = progressMap[skill.id];
    const timesPracticed = progress?.times_practiced || 0;
    const highRated = progress?.high_rated_completions || 0;
    const totalRatingSum = progress?.total_rating_sum || 0;
    const avgRating = timesPracticed > 0 ? totalRatingSum / timesPracticed : 0;
    const isMastered = progress?.status === 'mastered';

    // Mastery progress: weighted 50% completion (out of 10) + 50% rating (toward 4.5)
    const completionProgress = Math.min(1, timesPracticed / 10);
    const ratingProgress = Math.min(1, avgRating / 4.5);
    const masteryProgress = isMastered ? 1 : (completionProgress * 0.5 + ratingProgress * 0.5);

    return {
      id: skill.id,
      name: skill.name,
      ageGroup: skill.age_group,
      category: skill.categories?.name || 'Unknown',
      categoryColor: skill.categories?.color || '#3b82f6',
      categoryIcon: skill.categories?.icon || '',
      isMastered,
      status: progress?.status || 'not_started',
      timesPracticed,
      highRatedCompletions: highRated,
      avgRating,
      masteryProgress,
      isCloseToMastering: !isMastered && masteryProgress >= 0.75,
    };
  });

  // Group by age
  const byAge = {};
  AGE_GROUP_ORDER.forEach((ag) => { byAge[ag] = []; });
  skillsWithProgress.forEach((s) => {
    if (byAge[s.ageGroup]) byAge[s.ageGroup].push(s);
  });

  const skillsByAge = AGE_GROUP_ORDER
    .filter((ag) => byAge[ag].length > 0)
    .map((ag) => {
      const skills = byAge[ag];
      const mastered = skills.filter((s) => s.isMastered).length;
      const isRelevant = AGE_GROUP_ORDER.indexOf(ag) <= playerAgeIndex;
      return { ageGroup: ag, skills, mastered, total: skills.length, isRelevant };
    });

  // Overall stats (only for relevant age groups)
  const totalSkillsToMaster = relevantSkills.length;
  const masteredCount = relevantSkills.filter((s) => progressMap[s.id]?.status === 'mastered').length;
  const progressPercent = totalSkillsToMaster > 0 ? Math.round((masteredCount / totalSkillsToMaster) * 100) : 0;

  // Category summary across relevant skills
  const catMap = {};
  relevantSkills.forEach((skill) => {
    const catName = skill.categories?.name || 'Unknown';
    if (!catMap[catName]) {
      catMap[catName] = {
        name: catName,
        color: skill.categories?.color || '#3b82f6',
        icon: skill.categories?.icon || '',
        total: 0,
        mastered: 0,
      };
    }
    catMap[catName].total++;
    if (progressMap[skill.id]?.status === 'mastered') catMap[catName].mastered++;
  });

  return {
    playerAgeGroup,
    totalSkillsToMaster,
    masteredCount,
    progressPercent,
    skillsByAge,
    categorySummary: Object.values(catMap),
  };
}
