import { useState, useEffect, useCallback, useMemo } from 'react';
import { supabase } from '../../../lib/supabase';
import { useAuth } from '../../../lib/AuthContext';

/**
 * Level progression thresholds
 * XP = 100 * level^1.5 (polynomial curve)
 */
const LEVEL_THRESHOLDS = [
  { level: 1, totalXP: 0, title: 'Rookie' },
  { level: 2, totalXP: 100, title: 'Rookie' },
  { level: 3, totalXP: 283, title: 'Rookie' },
  { level: 4, totalXP: 520, title: 'Rookie' },
  { level: 5, totalXP: 800, title: 'Rising Star' },
  { level: 6, totalXP: 1117, title: 'Rising Star' },
  { level: 7, totalXP: 1470, title: 'Rising Star' },
  { level: 8, totalXP: 1856, title: 'Rising Star' },
  { level: 9, totalXP: 2271, title: 'Rising Star' },
  { level: 10, totalXP: 2714, title: 'Skilled Player' },
  { level: 15, totalXP: 5809, title: 'Skilled Player' },
  { level: 20, totalXP: 10472, title: 'Advanced Player' },
  { level: 25, totalXP: 16535, title: 'Advanced Player' },
  { level: 30, totalXP: 23888, title: 'Elite Player' },
  { level: 40, totalXP: 42426, title: 'Master' },
  { level: 50, totalXP: 66454, title: 'Champion' },
  { level: 75, totalXP: 145774, title: 'Legend' },
  { level: 100, totalXP: 257850, title: 'Football Genius' },
];

/**
 * Calculate level from total XP
 */
const getLevelFromXP = (totalXP) => {
  for (let i = LEVEL_THRESHOLDS.length - 1; i >= 0; i--) {
    if (totalXP >= LEVEL_THRESHOLDS[i].totalXP) {
      return LEVEL_THRESHOLDS[i];
    }
  }
  return LEVEL_THRESHOLDS[0];
};

/**
 * Calculate progress toward next level
 */
const getLevelProgress = (totalXP) => {
  const currentLevelInfo = getLevelFromXP(totalXP);
  const currentLevel = currentLevelInfo.level;

  // Find next level
  const nextLevelIndex = LEVEL_THRESHOLDS.findIndex((l) => l.level > currentLevel);

  if (nextLevelIndex === -1) {
    return {
      level: currentLevel,
      progress: 100,
      xpToNext: 0,
      title: currentLevelInfo.title,
      nextTitle: currentLevelInfo.title,
    };
  }

  const nextLevelInfo = LEVEL_THRESHOLDS[nextLevelIndex];
  const xpInLevel = totalXP - currentLevelInfo.totalXP;
  const xpNeeded = nextLevelInfo.totalXP - currentLevelInfo.totalXP;

  return {
    level: currentLevel,
    progress: Math.round((xpInLevel / xpNeeded) * 100),
    xpToNext: nextLevelInfo.totalXP - totalXP,
    xpInLevel,
    xpNeeded,
    title: currentLevelInfo.title,
    nextTitle: nextLevelInfo.title,
  };
};

/**
 * Age group to birth year approximation (for validation)
 */
const AGE_GROUP_YEARS = {
  'U-7': 7,
  'U-8': 8,
  'U-9': 9,
  'U-10': 10,
  'U-11': 11,
  'U-12': 12,
  'U-13': 13,
  'U-14': 14,
  'U-15+': 15,
};

/**
 * Custom hook for managing player progress and gamification
 */
export const usePlayerProgress = () => {
  const { user } = useAuth();
  const [playerProfile, setPlayerProfile] = useState(null);
  const [dailyActivity, setDailyActivity] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  /**
   * Fetch player profile from database
   */
  const fetchPlayerProfile = useCallback(async () => {
    if (!user?.id) {
      setPlayerProfile(null);
      setLoading(false);
      return null;
    }

    try {
      const { data, error: fetchError } = await supabase
        .from('player_profiles')
        .select('*')
        .eq('id', user.id)
        .single();

      if (fetchError && fetchError.code !== 'PGRST116') {
        // PGRST116 = no rows found (expected for new users)
        throw fetchError;
      }

      setPlayerProfile(data);
      return data;
    } catch (err) {
      console.error('Error fetching player profile:', err);
      setError(err.message);
      return null;
    } finally {
      setLoading(false);
    }
  }, [user?.id]);

  /**
   * Fetch today's activity
   */
  const fetchTodayActivity = useCallback(async () => {
    if (!user?.id) return null;

    const today = new Date().toISOString().split('T')[0];

    try {
      const { data, error: fetchError } = await supabase
        .from('daily_activity')
        .select('*')
        .eq('user_id', user.id)
        .eq('activity_date', today)
        .single();

      if (fetchError && fetchError.code !== 'PGRST116') {
        throw fetchError;
      }

      setDailyActivity(data);
      return data;
    } catch (err) {
      console.error('Error fetching daily activity:', err);
      return null;
    }
  }, [user?.id]);

  // Fetch data on mount and when user changes
  useEffect(() => {
    if (user?.id) {
      setLoading(true);
      Promise.all([fetchPlayerProfile(), fetchTodayActivity()]).finally(() => {
        setLoading(false);
      });
    } else {
      setPlayerProfile(null);
      setDailyActivity(null);
      setLoading(false);
    }
  }, [user?.id, fetchPlayerProfile, fetchTodayActivity]);

  /**
   * Create player profile (during onboarding)
   */
  const createPlayerProfile = useCallback(
    async (profileData) => {
      if (!user?.id) {
        throw new Error('No user logged in');
      }

      try {
        const { data, error: insertError } = await supabase
          .from('player_profiles')
          .insert({
            id: user.id,
            age_group: profileData.ageGroup,
            daily_xp_goal: profileData.dailyXPGoal || 50,
            onboarding_completed_at: new Date().toISOString(),
          })
          .select()
          .single();

        if (insertError) throw insertError;

        setPlayerProfile(data);
        return data;
      } catch (err) {
        console.error('Error creating player profile:', err);
        throw err;
      }
    },
    [user?.id]
  );

  /**
   * Update player profile
   */
  const updatePlayerProfile = useCallback(
    async (updates) => {
      if (!user?.id || !playerProfile) {
        throw new Error('No player profile found');
      }

      try {
        const { data, error: updateError } = await supabase
          .from('player_profiles')
          .update({
            ...updates,
            updated_at: new Date().toISOString(),
          })
          .eq('id', user.id)
          .select()
          .single();

        if (updateError) throw updateError;

        setPlayerProfile(data);
        return data;
      } catch (err) {
        console.error('Error updating player profile:', err);
        throw err;
      }
    },
    [user?.id, playerProfile]
  );

  /**
   * Add XP and update related stats
   */
  const addXP = useCallback(
    async (xpAmount, context = {}) => {
      if (!user?.id || !playerProfile) {
        throw new Error('No player profile found');
      }

      const newTotalXP = playerProfile.total_xp + xpAmount;
      const newLevelInfo = getLevelFromXP(newTotalXP);
      const leveledUp = newLevelInfo.level > playerProfile.current_level;

      try {
        // Update player profile
        const { data: updatedProfile, error: profileError } = await supabase
          .from('player_profiles')
          .update({
            total_xp: newTotalXP,
            current_level: newLevelInfo.level,
            updated_at: new Date().toISOString(),
          })
          .eq('id', user.id)
          .select()
          .single();

        if (profileError) throw profileError;

        // Update or create daily activity
        const today = new Date().toISOString().split('T')[0];
        const { data: existingActivity } = await supabase
          .from('daily_activity')
          .select('*')
          .eq('user_id', user.id)
          .eq('activity_date', today)
          .single();

        if (existingActivity) {
          const newDailyXP = existingActivity.xp_earned + xpAmount;
          const newExercisesCount = existingActivity.exercises_completed + (context.exerciseCompleted ? 1 : 0);
          const goalMet = newDailyXP >= playerProfile.daily_xp_goal;

          await supabase
            .from('daily_activity')
            .update({
              xp_earned: newDailyXP,
              exercises_completed: newExercisesCount,
              goal_met: goalMet,
              updated_at: new Date().toISOString(),
            })
            .eq('id', existingActivity.id);

          setDailyActivity({
            ...existingActivity,
            xp_earned: newDailyXP,
            exercises_completed: newExercisesCount,
            goal_met: goalMet,
          });
        } else {
          const goalMet = xpAmount >= playerProfile.daily_xp_goal;
          const { data: newActivity } = await supabase
            .from('daily_activity')
            .insert({
              user_id: user.id,
              activity_date: today,
              xp_earned: xpAmount,
              exercises_completed: context.exerciseCompleted ? 1 : 0,
              goal_met: goalMet,
            })
            .select()
            .single();

          setDailyActivity(newActivity);
        }

        setPlayerProfile(updatedProfile);

        return {
          xpAdded: xpAmount,
          totalXP: newTotalXP,
          leveledUp,
          newLevel: leveledUp ? newLevelInfo.level : null,
          newTitle: leveledUp ? newLevelInfo.title : null,
        };
      } catch (err) {
        console.error('Error adding XP:', err);
        throw err;
      }
    },
    [user?.id, playerProfile]
  );

  /**
   * Update streak (called after completing an exercise)
   */
  const updateStreak = useCallback(async () => {
    if (!user?.id || !playerProfile) {
      throw new Error('No player profile found');
    }

    const today = new Date().toISOString().split('T')[0];
    const lastPractice = playerProfile.last_practice_date;

    let newStreak = playerProfile.current_streak;
    let streakStatus = 'maintained';
    let shieldsUsed = 0;
    let shieldEarned = false;

    if (!lastPractice) {
      // First ever practice
      newStreak = 1;
      streakStatus = 'started';
    } else {
      const lastDate = new Date(lastPractice);
      const todayDate = new Date(today);
      const daysDiff = Math.floor((todayDate - lastDate) / (1000 * 60 * 60 * 24));

      if (daysDiff === 0) {
        // Same day - streak already counted
        streakStatus = 'already_counted';
      } else if (daysDiff === 1) {
        // Consecutive day
        newStreak = playerProfile.current_streak + 1;
        streakStatus = 'extended';
      } else if (daysDiff <= 3 && playerProfile.streak_shields > 0) {
        // Missed days but have shields
        const missedDays = daysDiff - 1;
        const shieldsNeeded = Math.min(missedDays, playerProfile.streak_shields);

        if (shieldsNeeded >= missedDays) {
          shieldsUsed = shieldsNeeded;
          newStreak = playerProfile.current_streak + 1;
          streakStatus = 'protected';
        } else {
          newStreak = 1;
          streakStatus = 'broken';
        }
      } else {
        // Too many missed days
        newStreak = 1;
        streakStatus = 'broken';
      }
    }

    // Award shield at 7-day milestones
    if (newStreak > 0 && newStreak % 7 === 0 && newStreak > playerProfile.current_streak) {
      if (playerProfile.streak_shields < 5) {
        shieldEarned = true;
      }
    }

    try {
      const { data, error: updateError } = await supabase
        .from('player_profiles')
        .update({
          current_streak: newStreak,
          longest_streak: Math.max(playerProfile.longest_streak, newStreak),
          last_practice_date: today,
          streak_shields: playerProfile.streak_shields - shieldsUsed + (shieldEarned ? 1 : 0),
          updated_at: new Date().toISOString(),
        })
        .eq('id', user.id)
        .select()
        .single();

      if (updateError) throw updateError;

      setPlayerProfile(data);

      return {
        previousStreak: playerProfile.current_streak,
        newStreak,
        status: streakStatus,
        shieldsUsed,
        shieldEarned,
        hitMilestone: [3, 7, 14, 21, 30, 50, 100].includes(newStreak) && newStreak > playerProfile.current_streak,
      };
    } catch (err) {
      console.error('Error updating streak:', err);
      throw err;
    }
  }, [user?.id, playerProfile]);

  /**
   * Calculate level progress info
   */
  const levelProgress = useMemo(() => {
    if (!playerProfile) return null;
    return getLevelProgress(playerProfile.total_xp);
  }, [playerProfile]);

  /**
   * Check if onboarding is needed
   */
  const needsOnboarding = useMemo(() => {
    if (loading) return false;
    if (!user) return false;
    return !playerProfile?.onboarding_completed_at;
  }, [loading, user, playerProfile]);

  /**
   * Calculate daily goal progress
   */
  const dailyGoalProgress = useMemo(() => {
    if (!playerProfile || !dailyActivity) {
      return { current: 0, goal: playerProfile?.daily_xp_goal || 50, progress: 0, met: false };
    }

    const goal = playerProfile.daily_xp_goal;
    const current = dailyActivity.xp_earned;

    return {
      current,
      goal,
      progress: Math.min(100, Math.round((current / goal) * 100)),
      met: dailyActivity.goal_met,
      exercisesCompleted: dailyActivity.exercises_completed,
    };
  }, [playerProfile, dailyActivity]);

  return {
    // Data
    playerProfile,
    dailyActivity,
    loading,
    error,

    // Calculated values
    levelProgress,
    needsOnboarding,
    dailyGoalProgress,

    // Actions
    createPlayerProfile,
    updatePlayerProfile,
    addXP,
    updateStreak,
    refetch: fetchPlayerProfile,

    // Utilities
    getLevelFromXP,
    getLevelProgress,
  };
};

export default usePlayerProgress;
