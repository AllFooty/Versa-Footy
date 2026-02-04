import { useState, useCallback, useEffect } from 'react';
import { supabase } from '../../../lib/supabase';
import { useAuth } from '../../../lib/AuthContext';

/**
 * Base XP by exercise difficulty
 */
const DIFFICULTY_XP = {
  1: 10, // Easy
  2: 15, // Medium-Easy
  3: 20, // Medium
  4: 30, // Hard
  5: 50, // Expert
};

/**
 * Rating labels and XP modifiers
 */
const RATING_CONFIG = {
  1: { label: 'Tough!', emoji: '😣', xpMultiplier: 0.5 },
  2: { label: 'Tricky', emoji: '😕', xpMultiplier: 0.75 },
  3: { label: 'OK', emoji: '😐', xpMultiplier: 1.0 },
  4: { label: 'Good!', emoji: '😊', xpMultiplier: 1.25 },
  5: { label: 'Nailed it!', emoji: '🌟', xpMultiplier: 1.5 },
};

/**
 * Session configuration by type
 */
const SESSION_CONFIG = {
  quick: { exerciseCount: 3, label: 'Quick Practice' },
  standard: { exerciseCount: 5, label: 'Standard Session' },
  deep: { exerciseCount: 8, label: 'Deep Practice' },
  review: { exerciseCount: 4, label: 'Review Session' },
};

/**
 * Age group order for filtering
 */
const AGE_GROUP_ORDER = ['U-7', 'U-8', 'U-9', 'U-10', 'U-11', 'U-12', 'U-13', 'U-14', 'U-15+'];

/**
 * Calculate XP for an exercise completion
 */
const calculateXP = (exercise, rating, context = {}) => {
  const baseXP = DIFFICULTY_XP[exercise.difficulty] || 10;
  const ratingMultiplier = RATING_CONFIG[rating]?.xpMultiplier || 1.0;

  let totalXP = Math.round(baseXP * ratingMultiplier);
  const bonuses = [];

  // First time bonus (+50%)
  if (context.isFirstTime) {
    const bonus = Math.round(totalXP * 0.5);
    totalXP += bonus;
    bonuses.push({ type: 'first_time', xp: bonus, label: 'First Time!' });
  }

  // Streak bonus (+5% per day, max 50%)
  if (context.currentStreak > 0) {
    const streakMultiplier = Math.min(0.5, context.currentStreak * 0.05);
    const bonus = Math.round(baseXP * streakMultiplier);
    totalXP += bonus;
    bonuses.push({ type: 'streak', xp: bonus, label: `${context.currentStreak} Day Streak!` });
  }

  return {
    baseXP,
    bonuses,
    totalXP,
    rating,
    ratingLabel: RATING_CONFIG[rating]?.label,
    ratingEmoji: RATING_CONFIG[rating]?.emoji,
  };
};

/**
 * Custom hook for managing training sessions
 */
export const useTrainingSession = () => {
  const { user } = useAuth();
  const [session, setSession] = useState(null);
  const [exercises, setExercises] = useState([]);
  const [currentExerciseIndex, setCurrentExerciseIndex] = useState(0);
  const [completedExercises, setCompletedExercises] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  /**
   * Get age group index for comparison
   */
  const getAgeGroupIndex = (ageGroup) => {
    return AGE_GROUP_ORDER.indexOf(ageGroup);
  };

  /**
   * Select exercises for a session based on player's age group
   */
  const selectExercisesForSession = useCallback(
    async (playerAgeGroup, sessionType = 'standard') => {
      const config = SESSION_CONFIG[sessionType];
      const targetCount = config.exerciseCount;

      // Get player's age group index (allow exercises up to one level above)
      const playerAgeIndex = getAgeGroupIndex(playerAgeGroup);
      const maxAgeIndex = Math.min(playerAgeIndex + 1, AGE_GROUP_ORDER.length - 1);

      try {
        // Fetch all skills that are age-appropriate
        const { data: skills, error: skillsError } = await supabase
          .from('skills')
          .select('id, name, age_group, category_id')
          .order('id');

        if (skillsError) throw skillsError;

        // Filter skills by age group
        const appropriateSkills = skills.filter((skill) => {
          const skillAgeIndex = getAgeGroupIndex(skill.age_group);
          return skillAgeIndex >= 0 && skillAgeIndex <= maxAgeIndex;
        });

        const skillIds = appropriateSkills.map((s) => s.id);

        if (skillIds.length === 0) {
          return [];
        }

        // Fetch exercises for these skills
        const { data: allExercises, error: exercisesError } = await supabase
          .from('exercises')
          .select('*, skills(name, age_group, category_id, categories(name, icon, color))')
          .in('skill_id', skillIds)
          .order('difficulty');

        if (exercisesError) throw exercisesError;

        if (!allExercises || allExercises.length === 0) {
          return [];
        }

        // Group exercises by difficulty for balanced selection
        const byDifficulty = {
          easy: allExercises.filter((e) => e.difficulty <= 2),
          medium: allExercises.filter((e) => e.difficulty === 3),
          hard: allExercises.filter((e) => e.difficulty >= 4),
        };

        // Select a balanced mix
        const selected = [];
        const usedIds = new Set();

        // Helper to add random exercise from array
        const addRandom = (arr, count) => {
          const available = arr.filter((e) => !usedIds.has(e.id));
          const shuffled = [...available].sort(() => Math.random() - 0.5);
          const toAdd = shuffled.slice(0, count);
          toAdd.forEach((e) => {
            selected.push(e);
            usedIds.add(e.id);
          });
        };

        // Start with 1 easy (warmup)
        addRandom(byDifficulty.easy, 1);

        // Add medium difficulty (60% of remaining)
        const mediumCount = Math.ceil((targetCount - 1) * 0.6);
        addRandom(byDifficulty.medium, mediumCount);

        // Add more easy if needed
        const easyCount = Math.ceil((targetCount - selected.length) * 0.5);
        addRandom(byDifficulty.easy, easyCount);

        // Fill rest with hard (challenge)
        addRandom(byDifficulty.hard, targetCount - selected.length);

        // If still not enough, add any remaining
        if (selected.length < targetCount) {
          addRandom(allExercises, targetCount - selected.length);
        }

        // Transform for frontend
        return selected.slice(0, targetCount).map((exercise) => ({
          id: exercise.id,
          name: exercise.name,
          description: exercise.description,
          videoUrl: exercise.video_url,
          difficulty: exercise.difficulty,
          skillId: exercise.skill_id,
          skillName: exercise.skills?.name,
          skillAgeGroup: exercise.skills?.age_group,
          categoryId: exercise.skills?.category_id,
          categoryName: exercise.skills?.categories?.name,
          categoryIcon: exercise.skills?.categories?.icon,
          categoryColor: exercise.skills?.categories?.color,
        }));
      } catch (err) {
        console.error('Error selecting exercises:', err);
        throw err;
      }
    },
    []
  );

  /**
   * Start a new training session
   */
  const startSession = useCallback(
    async (playerProfile, sessionType = 'standard') => {
      if (!user?.id) {
        throw new Error('No user logged in');
      }

      setLoading(true);
      setError(null);

      try {
        // Select exercises for this session
        const selectedExercises = await selectExercisesForSession(
          playerProfile.age_group,
          sessionType
        );

        if (selectedExercises.length === 0) {
          throw new Error('No exercises available for your age group yet. Check back soon!');
        }

        // Create session in database
        const { data: newSession, error: sessionError } = await supabase
          .from('training_sessions')
          .insert({
            user_id: user.id,
            session_type: sessionType,
            status: 'in_progress',
          })
          .select()
          .single();

        if (sessionError) throw sessionError;

        setSession(newSession);
        setExercises(selectedExercises);
        setCurrentExerciseIndex(0);
        setCompletedExercises([]);

        return {
          session: newSession,
          exercises: selectedExercises,
        };
      } catch (err) {
        console.error('Error starting session:', err);
        setError(err.message);
        throw err;
      } finally {
        setLoading(false);
      }
    },
    [user?.id, selectExercisesForSession]
  );

  /**
   * Complete an exercise within the session
   */
  const completeExercise = useCallback(
    async (rating, context = {}) => {
      if (!session || !user?.id) {
        throw new Error('No active session');
      }

      const exercise = exercises[currentExerciseIndex];
      if (!exercise) {
        throw new Error('No current exercise');
      }

      try {
        // Check if this is the first time completing this exercise
        const { data: previousCompletions } = await supabase
          .from('exercise_completions')
          .select('id')
          .eq('user_id', user.id)
          .eq('exercise_id', exercise.id)
          .limit(1);

        const isFirstTime = !previousCompletions || previousCompletions.length === 0;

        // Calculate XP
        const xpResult = calculateXP(exercise, rating, {
          ...context,
          isFirstTime,
        });

        // Record completion
        const { error: completionError } = await supabase.from('exercise_completions').insert({
          session_id: session.id,
          user_id: user.id,
          exercise_id: exercise.id,
          skill_id: exercise.skillId,
          self_rating: rating,
          xp_earned: xpResult.totalXP,
          is_first_time: isFirstTime,
        });

        if (completionError) throw completionError;

        // Update local state
        const completion = {
          exercise,
          rating,
          xpResult,
          isFirstTime,
        };

        setCompletedExercises((prev) => [...prev, completion]);

        // Move to next exercise
        if (currentExerciseIndex < exercises.length - 1) {
          setCurrentExerciseIndex((prev) => prev + 1);
        }

        return completion;
      } catch (err) {
        console.error('Error completing exercise:', err);
        throw err;
      }
    },
    [session, user?.id, exercises, currentExerciseIndex]
  );

  /**
   * Skip current exercise
   */
  const skipExercise = useCallback(() => {
    if (currentExerciseIndex < exercises.length - 1) {
      setCurrentExerciseIndex((prev) => prev + 1);
    }
  }, [currentExerciseIndex, exercises.length]);

  /**
   * Complete the entire session
   */
  const finishSession = useCallback(async () => {
    if (!session || !user?.id) {
      throw new Error('No active session');
    }

    try {
      // Calculate session totals
      const totalXP = completedExercises.reduce((sum, c) => sum + c.xpResult.totalXP, 0);
      const totalRating =
        completedExercises.length > 0
          ? completedExercises.reduce((sum, c) => sum + c.rating, 0) / completedExercises.length
          : 0;

      // Update session in database
      const { data: updatedSession, error: updateError } = await supabase
        .from('training_sessions')
        .update({
          status: 'completed',
          completed_at: new Date().toISOString(),
          exercises_completed: completedExercises.length,
          total_xp_earned: totalXP,
          average_rating: Math.round(totalRating * 10) / 10,
        })
        .eq('id', session.id)
        .select()
        .single();

      if (updateError) throw updateError;

      const result = {
        session: updatedSession,
        completedExercises,
        totalXP,
        averageRating: totalRating,
        exerciseCount: completedExercises.length,
      };

      // Reset state
      setSession(null);
      setExercises([]);
      setCurrentExerciseIndex(0);
      setCompletedExercises([]);

      return result;
    } catch (err) {
      console.error('Error finishing session:', err);
      throw err;
    }
  }, [session, user?.id, completedExercises]);

  /**
   * Abandon session
   */
  const abandonSession = useCallback(async () => {
    if (!session) return;

    try {
      await supabase
        .from('training_sessions')
        .update({
          status: 'abandoned',
          completed_at: new Date().toISOString(),
        })
        .eq('id', session.id);

      setSession(null);
      setExercises([]);
      setCurrentExerciseIndex(0);
      setCompletedExercises([]);
    } catch (err) {
      console.error('Error abandoning session:', err);
    }
  }, [session]);

  /**
   * Get current exercise
   */
  const currentExercise = exercises[currentExerciseIndex] || null;

  /**
   * Check if session is complete
   */
  const isSessionComplete = currentExerciseIndex >= exercises.length - 1 && completedExercises.length >= exercises.length;

  /**
   * Session progress
   */
  const progress = {
    current: currentExerciseIndex + 1,
    total: exercises.length,
    completed: completedExercises.length,
    percentage: exercises.length > 0 ? Math.round((completedExercises.length / exercises.length) * 100) : 0,
  };

  return {
    // State
    session,
    exercises,
    currentExercise,
    currentExerciseIndex,
    completedExercises,
    loading,
    error,
    progress,
    isSessionComplete,

    // Actions
    startSession,
    completeExercise,
    skipExercise,
    finishSession,
    abandonSession,

    // Utilities
    calculateXP,
    RATING_CONFIG,
    SESSION_CONFIG,
  };
};

export default useTrainingSession;
