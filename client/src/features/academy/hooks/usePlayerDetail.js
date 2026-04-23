import { useCallback, useEffect, useMemo, useState } from 'react';
import { supabase } from '../../../lib/supabase';
import { AGE_GROUPS } from '../../../constants';

// Age group ordering for roadmap — canonical list lives in `constants/index.js`.
const AGE_GROUP_ORDER = AGE_GROUPS;

const EMPTY_SECTION_ERRORS = Object.freeze({
  skillProgress: null,
  allSkills: null,
  dailyActivity: null,
  recentSessions: null,
  levelProgress: null,
});

export default function usePlayerDetail(playerId) {
  const [profile, setProfile] = useState(null);
  const [skillProgress, setSkillProgress] = useState([]);
  const [allSkills, setAllSkills] = useState([]);
  const [dailyActivity, setDailyActivity] = useState([]);
  const [recentSessions, setRecentSessions] = useState([]);
  const [levelProgress, setLevelProgress] = useState(null);
  const [sectionErrors, setSectionErrors] = useState(EMPTY_SECTION_ERRORS);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  const fetchDetail = useCallback(async () => {
    if (!playerId) return;
    setLoading(true);
    setError(null);
    setSectionErrors(EMPTY_SECTION_ERRORS);

    try {
      // Profile load is fatal — without a profile there's no page to show.
      const profileRes = await supabase
        .from('player_profiles')
        .select('*, profiles(full_name, email)')
        .eq('id', playerId)
        .single();
      if (profileRes.error) throw profileRes.error;
      setProfile(profileRes.data);

      // Secondary queries fire in parallel; any individual failure only
      // degrades its section rather than the whole page.
      const [skillsRes, allSkillsRes, activityRes, sessionsRes, levelRes] = await Promise.allSettled([
        supabase
          .from('skill_progress')
          .select('*, skills(name, age_group, categories(name, color, icon))')
          .eq('user_id', playerId),

        supabase
          .from('skills')
          .select('id, name, age_group, category_id, categories(name, color, icon)')
          .order('id', { ascending: true }),

        supabase
          .from('daily_activity')
          .select('*')
          .eq('user_id', playerId)
          .gte('activity_date', getMonthsAgoDate(6))
          .order('activity_date', { ascending: true }),

        supabase
          .from('training_sessions')
          .select('*')
          .eq('user_id', playerId)
          .gte('started_at', getDaysAgoDate(30))
          .order('started_at', { ascending: false }),

        supabase.rpc('get_player_level_progress', { p_player_id: playerId }),
      ]);

      const nextErrors = { ...EMPTY_SECTION_ERRORS };
      setSkillProgress(takeOrRecord(skillsRes, 'skillProgress', nextErrors) || []);
      setAllSkills(takeOrRecord(allSkillsRes, 'allSkills', nextErrors) || []);
      setDailyActivity(takeOrRecord(activityRes, 'dailyActivity', nextErrors) || []);
      setRecentSessions(takeOrRecord(sessionsRes, 'recentSessions', nextErrors) || []);

      const levelData = takeOrRecord(levelRes, 'levelProgress', nextErrors);
      // RPC returns a table; grab the single row.
      setLevelProgress(Array.isArray(levelData) ? (levelData[0] || null) : (levelData || null));

      setSectionErrors(nextErrors);
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

  const categoryRadar = useMemo(() => computeCategoryRadar(skillProgress), [skillProgress]);
  const weeklyTrends = useMemo(() => computeWeeklyTrends(dailyActivity), [dailyActivity]);
  const roadmap = useMemo(
    () => computeRoadmap(profile, allSkills, skillProgress),
    [profile, allSkills, skillProgress],
  );

  return {
    profile,
    skillProgress,
    allSkills,
    dailyActivity,
    recentSessions,
    levelProgress,
    categoryRadar,
    weeklyTrends,
    roadmap,
    loading,
    error,
    sectionErrors,
  };
}

function takeOrRecord(settledResult, key, errors) {
  if (settledResult.status === 'rejected') {
    console.error(`usePlayerDetail: ${key} failed`, settledResult.reason);
    errors[key] = settledResult.reason?.message || 'Failed to load';
    return null;
  }
  const { data, error: queryError } = settledResult.value || {};
  if (queryError) {
    console.error(`usePlayerDetail: ${key} query error`, queryError);
    errors[key] = queryError.message || 'Failed to load';
    return null;
  }
  return data;
}

function getMonthsAgoDate(months) {
  const d = new Date();
  d.setMonth(d.getMonth() - months);
  return d.toISOString().split('T')[0];
}

function getDaysAgoDate(days) {
  const d = new Date();
  d.setDate(d.getDate() - days);
  return d.toISOString();
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

  for (let i = 25; i >= 0; i--) {
    const d = new Date();
    d.setDate(d.getDate() - i * 7);
    const weekKey = getWeekKey(d);
    weeks[weekKey] = { week: weekKey, xp: 0, minutes: 0, days: 0 };
  }

  activities.forEach(({ activity_date, xp_earned, practice_minutes }) => {
    const parsed = parseLocalDate(activity_date);
    if (!parsed) return;
    const weekKey = getWeekKey(parsed);
    if (weeks[weekKey]) {
      weeks[weekKey].xp += xp_earned || 0;
      weeks[weekKey].minutes += practice_minutes || 0;
      weeks[weekKey].days++;
    }
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

function computeRoadmap(profile, allSkills, progressRecords) {
  if (!profile || allSkills.length === 0) {
    return { playerAgeGroup: null, totalSkillsToMaster: 0, masteredCount: 0, progressPercent: 0, skillsByAge: [], categorySummary: [], missingAgeGroup: false };
  }

  // Player must have an age group set for the roadmap to be meaningful.
  if (!profile.age_group) {
    return { playerAgeGroup: null, totalSkillsToMaster: 0, masteredCount: 0, progressPercent: 0, skillsByAge: [], categorySummary: [], missingAgeGroup: true };
  }

  const playerAgeGroup = profile.age_group;
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
      avgRating,
      masteryProgress,
      isCloseToMastering: !isMastered && masteryProgress >= 0.75,
      needsRatingBoost: !isMastered && timesPracticed >= 10 && avgRating < 4.5,
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
    missingAgeGroup: false,
  };
}
