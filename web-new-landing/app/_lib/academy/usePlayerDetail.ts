"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import { supabase } from "../supabase";
import { AGE_GROUPS } from "./constants";

const AGE_GROUP_ORDER: readonly string[] = AGE_GROUPS;

export type PlayerProfile = {
  id: string;
  display_name: string | null;
  age_group: string | null;
  current_level: number;
  total_xp: number;
  current_streak: number;
  longest_streak: number;
  profiles?: { full_name?: string | null; email?: string | null } | null;
  [k: string]: unknown;
};

export type SkillProgressRow = {
  skill_id: string;
  user_id: string;
  status: string;
  times_practiced: number | null;
  total_rating_sum: number | null;
  skills?: {
    name: string;
    age_group: string;
    categories?: { name: string; color: string; icon: string } | null;
  } | null;
};

export type SkillRow = {
  id: string;
  name: string;
  age_group: string;
  category_id: string;
  categories?: { name: string; color: string; icon: string } | null;
};

export type DailyActivity = {
  activity_date: string;
  xp_earned: number | null;
  practice_minutes: number | null;
};

export type TrainingSession = {
  id: string;
  user_id: string;
  session_type: string;
  status: "completed" | "abandoned" | "in_progress" | string;
  exercises_completed: number;
  total_xp_earned: number;
  average_rating: number | null;
  started_at: string;
};

export type LevelProgress = {
  current_level: number;
  xp_in_current_level: number;
  xp_required_for_next_level: number;
} | null;

export type CategoryRadarPoint = {
  category: string;
  total: number;
  mastered: number;
  masteryPercent: number;
};

export type WeeklyTrendPoint = {
  week: string;
  xp: number;
  minutes: number;
  days: number;
};

export type RoadmapSkill = {
  id: string;
  name: string;
  ageGroup: string;
  category: string;
  categoryColor: string;
  categoryIcon: string;
  isMastered: boolean;
  status: string;
  timesPracticed: number;
  avgRating: number;
  masteryProgress: number;
  isCloseToMastering: boolean;
  needsRatingBoost: boolean;
};

export type RoadmapCategorySummary = {
  name: string;
  color: string;
  icon: string;
  total: number;
  mastered: number;
};

export type RoadmapGroup = {
  ageGroup: string;
  skills: RoadmapSkill[];
  mastered: number;
  total: number;
  isRelevant: boolean;
};

export type Roadmap = {
  playerAgeGroup: string | null;
  totalSkillsToMaster: number;
  masteredCount: number;
  progressPercent: number;
  skillsByAge: RoadmapGroup[];
  categorySummary: RoadmapCategorySummary[];
  missingAgeGroup: boolean;
};

type SectionErrors = {
  skillProgress: string | null;
  allSkills: string | null;
  dailyActivity: string | null;
  recentSessions: string | null;
  levelProgress: string | null;
};

const EMPTY_SECTION_ERRORS: SectionErrors = {
  skillProgress: null,
  allSkills: null,
  dailyActivity: null,
  recentSessions: null,
  levelProgress: null,
};

function getMonthsAgoDate(months: number): string {
  const d = new Date();
  d.setMonth(d.getMonth() - months);
  return d.toISOString().split("T")[0];
}
function getDaysAgoDate(days: number): string {
  const d = new Date();
  d.setDate(d.getDate() - days);
  return d.toISOString();
}
function parseLocalDate(dateStr: string): Date | null {
  const m = /^(\d{4})-(\d{2})-(\d{2})/.exec(dateStr);
  if (!m) return null;
  const d = new Date(Number(m[1]), Number(m[2]) - 1, Number(m[3]));
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

function computeCategoryRadar(skills: SkillProgressRow[]): CategoryRadarPoint[] {
  const cats: Record<string, { category: string; total: number; mastered: number }> = {};
  skills.forEach((sp) => {
    const name = sp.skills?.categories?.name || "Unknown";
    if (!cats[name]) cats[name] = { category: name, total: 0, mastered: 0 };
    cats[name].total++;
    if (sp.status === "mastered") cats[name].mastered++;
  });
  return Object.values(cats).map((c) => ({
    ...c,
    masteryPercent:
      c.total > 0 ? Math.round((c.mastered / c.total) * 100) : 0,
  }));
}

function computeWeeklyTrends(activities: DailyActivity[], lang: string): WeeklyTrendPoint[] {
  const weeks: Record<string, WeeklyTrendPoint> = {};
  for (let i = 25; i >= 0; i--) {
    const d = new Date();
    d.setDate(d.getDate() - i * 7);
    const key = getWeekKey(d, lang);
    weeks[key] = { week: key, xp: 0, minutes: 0, days: 0 };
  }
  activities.forEach(({ activity_date, xp_earned, practice_minutes }) => {
    const parsed = parseLocalDate(activity_date);
    if (!parsed) return;
    const key = getWeekKey(parsed, lang);
    if (weeks[key]) {
      weeks[key].xp += xp_earned ?? 0;
      weeks[key].minutes += practice_minutes ?? 0;
      weeks[key].days += 1;
    }
  });
  return Object.values(weeks);
}

function computeRoadmap(
  profile: PlayerProfile | null,
  allSkills: SkillRow[],
  progressRecords: SkillProgressRow[],
): Roadmap {
  if (!profile || allSkills.length === 0) {
    return {
      playerAgeGroup: null,
      totalSkillsToMaster: 0,
      masteredCount: 0,
      progressPercent: 0,
      skillsByAge: [],
      categorySummary: [],
      missingAgeGroup: false,
    };
  }
  if (!profile.age_group) {
    return {
      playerAgeGroup: null,
      totalSkillsToMaster: 0,
      masteredCount: 0,
      progressPercent: 0,
      skillsByAge: [],
      categorySummary: [],
      missingAgeGroup: true,
    };
  }

  const playerAgeIndex = AGE_GROUP_ORDER.indexOf(profile.age_group);
  const progressMap: Record<string, SkillProgressRow> = {};
  progressRecords.forEach((sp) => {
    progressMap[sp.skill_id] = sp;
  });

  const relevantSkills = allSkills.filter((skill) => {
    const idx = AGE_GROUP_ORDER.indexOf(skill.age_group);
    return idx >= 0 && idx <= playerAgeIndex;
  });

  const skillsWithProgress: RoadmapSkill[] = allSkills.map((skill) => {
    const progress = progressMap[skill.id];
    const timesPracticed = progress?.times_practiced ?? 0;
    const totalRatingSum = progress?.total_rating_sum ?? 0;
    const avgRating = timesPracticed > 0 ? totalRatingSum / timesPracticed : 0;
    const isMastered = progress?.status === "mastered";
    const completionProgress = Math.min(1, timesPracticed / 10);
    const ratingProgress = Math.min(1, avgRating / 4.5);
    const masteryProgress = isMastered
      ? 1
      : completionProgress * 0.5 + ratingProgress * 0.5;
    return {
      id: skill.id,
      name: skill.name,
      ageGroup: skill.age_group,
      category: skill.categories?.name || "Unknown",
      categoryColor: skill.categories?.color || "var(--color-deep-teal)",
      categoryIcon: skill.categories?.icon || "",
      isMastered,
      status: progress?.status || "not_started",
      timesPracticed,
      avgRating,
      masteryProgress,
      isCloseToMastering: !isMastered && masteryProgress >= 0.75,
      needsRatingBoost: !isMastered && timesPracticed >= 10 && avgRating < 4.5,
    };
  });

  const byAge: Record<string, RoadmapSkill[]> = {};
  AGE_GROUP_ORDER.forEach((ag) => {
    byAge[ag] = [];
  });
  skillsWithProgress.forEach((s) => {
    if (byAge[s.ageGroup]) byAge[s.ageGroup].push(s);
  });

  const skillsByAge: RoadmapGroup[] = AGE_GROUP_ORDER.filter(
    (ag) => byAge[ag].length > 0,
  ).map((ag) => {
    const skills = byAge[ag];
    const mastered = skills.filter((s) => s.isMastered).length;
    return {
      ageGroup: ag,
      skills,
      mastered,
      total: skills.length,
      isRelevant: AGE_GROUP_ORDER.indexOf(ag) <= playerAgeIndex,
    };
  });

  const totalSkillsToMaster = relevantSkills.length;
  const masteredCount = relevantSkills.filter(
    (s) => progressMap[s.id]?.status === "mastered",
  ).length;
  const progressPercent =
    totalSkillsToMaster > 0
      ? Math.round((masteredCount / totalSkillsToMaster) * 100)
      : 0;

  const catMap: Record<string, RoadmapCategorySummary> = {};
  relevantSkills.forEach((skill) => {
    const name = skill.categories?.name || "Unknown";
    if (!catMap[name]) {
      catMap[name] = {
        name,
        color: skill.categories?.color || "var(--color-deep-teal)",
        icon: skill.categories?.icon || "",
        total: 0,
        mastered: 0,
      };
    }
    catMap[name].total++;
    if (progressMap[skill.id]?.status === "mastered") catMap[name].mastered++;
  });

  return {
    playerAgeGroup: profile.age_group,
    totalSkillsToMaster,
    masteredCount,
    progressPercent,
    skillsByAge,
    categorySummary: Object.values(catMap),
    missingAgeGroup: false,
  };
}

type SettledQuery<T> = PromiseSettledResult<{
  data: T | null;
  error: { message?: string } | null;
}>;

function takeOrRecord<T, K extends keyof SectionErrors>(
  result: SettledQuery<T>,
  key: K,
  errors: SectionErrors,
): T | null {
  if (result.status === "rejected") {
    errors[key] =
      (result.reason as { message?: string } | undefined)?.message ??
      "Failed to load";
    return null;
  }
  const value = result.value;
  if (value.error) {
    errors[key] = value.error.message ?? "Failed to load";
    return null;
  }
  return value.data;
}

export function usePlayerDetail(playerId: string | undefined, lang: string = "en") {
  const [profile, setProfile] = useState<PlayerProfile | null>(null);
  const [skillProgress, setSkillProgress] = useState<SkillProgressRow[]>([]);
  const [allSkills, setAllSkills] = useState<SkillRow[]>([]);
  const [dailyActivity, setDailyActivity] = useState<DailyActivity[]>([]);
  const [recentSessions, setRecentSessions] = useState<TrainingSession[]>([]);
  const [levelProgress, setLevelProgress] = useState<LevelProgress>(null);
  const [sectionErrors, setSectionErrors] = useState<SectionErrors>(
    EMPTY_SECTION_ERRORS,
  );
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const fetchDetail = useCallback(async () => {
    if (!playerId) return;
    setLoading(true);
    setError(null);
    setSectionErrors({ ...EMPTY_SECTION_ERRORS });
    try {
      const profileRes = await supabase
        .from("player_profiles")
        .select("*, profiles(full_name, email)")
        .eq("id", playerId)
        .single();
      if (profileRes.error) throw profileRes.error;
      setProfile(profileRes.data as PlayerProfile);

      const [skillsRes, allSkillsRes, activityRes, sessionsRes, levelRes] =
        await Promise.allSettled([
          supabase
            .from("skill_progress")
            .select(
              "*, skills(name, age_group, categories(name, color, icon))",
            )
            .eq("user_id", playerId),
          supabase
            .from("skills")
            .select(
              "id, name, age_group, category_id, categories(name, color, icon)",
            )
            .order("id", { ascending: true }),
          supabase
            .from("daily_activity")
            .select("*")
            .eq("user_id", playerId)
            .gte("activity_date", getMonthsAgoDate(6))
            .order("activity_date", { ascending: true }),
          supabase
            .from("training_sessions")
            .select("*")
            .eq("user_id", playerId)
            .gte("started_at", getDaysAgoDate(30))
            .order("started_at", { ascending: false }),
          supabase.rpc("get_player_level_progress", { p_player_id: playerId }),
        ]);

      const nextErrors: SectionErrors = { ...EMPTY_SECTION_ERRORS };
      setSkillProgress(
        (takeOrRecord(
          skillsRes as SettledQuery<SkillProgressRow[]>,
          "skillProgress",
          nextErrors,
        ) ?? []) as SkillProgressRow[],
      );
      setAllSkills(
        (takeOrRecord(
          allSkillsRes as SettledQuery<SkillRow[]>,
          "allSkills",
          nextErrors,
        ) ?? []) as SkillRow[],
      );
      setDailyActivity(
        (takeOrRecord(
          activityRes as SettledQuery<DailyActivity[]>,
          "dailyActivity",
          nextErrors,
        ) ?? []) as DailyActivity[],
      );
      setRecentSessions(
        (takeOrRecord(
          sessionsRes as SettledQuery<TrainingSession[]>,
          "recentSessions",
          nextErrors,
        ) ?? []) as TrainingSession[],
      );
      const levelData = takeOrRecord(
        levelRes as SettledQuery<LevelProgress | LevelProgress[]>,
        "levelProgress",
        nextErrors,
      );
      setLevelProgress(
        Array.isArray(levelData) ? levelData[0] ?? null : levelData ?? null,
      );
      setSectionErrors(nextErrors);
    } catch (err) {
      setError((err as Error).message);
    } finally {
      setLoading(false);
    }
  }, [playerId]);

  useEffect(() => {
    fetchDetail();
  }, [fetchDetail]);

  const categoryRadar = useMemo(
    () => computeCategoryRadar(skillProgress),
    [skillProgress],
  );
  const weeklyTrends = useMemo(
    () => computeWeeklyTrends(dailyActivity, lang),
    [dailyActivity, lang],
  );
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
