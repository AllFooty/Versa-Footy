import { useState, useEffect, useCallback, useMemo } from 'react';
import { supabase } from '../lib/supabase';
import { normalizeDifficulty } from '../utils/difficulty';
import { AGE_GROUPS } from '../constants';

/**
 * Transform Supabase category to frontend format
 */
const transformCategory = (cat) => ({
  id: cat.id,
  name: cat.name,
  icon: cat.icon,
  color: cat.color,
});

/**
 * Transform Supabase skill to frontend format
 */
const transformSkill = (skill) => ({
  id: skill.id,
  categoryId: skill.category_id,
  name: skill.name,
  ageGroup: skill.age_group,
  description: skill.description,
});

/**
 * Transform Supabase exercise to frontend format
 * @param {object} exercise - raw Supabase exercise row
 * @param {Map<number, number[]>} skillIdsMap - exercise_id → skill_id[] from junction table
 */
const transformExercise = (exercise, skillIdsMap) => ({
  id: exercise.id,
  skillId: exercise.skill_id,
  skillIds: skillIdsMap?.get(exercise.id) || [exercise.skill_id],
  name: exercise.name,
  videoUrl: exercise.video_url,
  difficulty: normalizeDifficulty(exercise.difficulty),
  description: exercise.description,
  equipment: exercise.equipment || [],
});

/**
 * Custom hook for managing football training data
 * Handles Supabase persistence and CRUD operations
 */
export const useData = () => {
  const [categories, setCategories] = useState([]);
  const [skills, setSkills] = useState([]);
  const [exercises, setExercises] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  // Fetch all data from Supabase on mount
  useEffect(() => {
    const fetchData = async () => {
      setLoading(true);
      setError(null);

      try {
        const [categoriesRes, skillsRes, exercisesRes, exerciseSkillsRes] = await Promise.all([
          supabase.from('categories').select('*').order('id'),
          supabase.from('skills').select('*').order('id'),
          supabase.from('exercises').select('*').order('id'),
          supabase.from('exercise_skills').select('exercise_id, skill_id').order('exercise_id'),
        ]);

        if (categoriesRes.error) throw categoriesRes.error;
        if (skillsRes.error) throw skillsRes.error;
        if (exercisesRes.error) throw exercisesRes.error;
        if (exerciseSkillsRes.error) throw exerciseSkillsRes.error;

        // Build exercise_id → skill_id[] map from junction table
        const skillIdsMap = new Map();
        for (const row of exerciseSkillsRes.data) {
          const existing = skillIdsMap.get(row.exercise_id) || [];
          existing.push(row.skill_id);
          skillIdsMap.set(row.exercise_id, existing);
        }

        setCategories(categoriesRes.data.map(transformCategory));
        setSkills(skillsRes.data.map(transformSkill));
        setExercises(exercisesRes.data.map((e) => transformExercise(e, skillIdsMap)));
      } catch (err) {
        console.error('Error fetching data:', err);
        setError(err.message);
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, []);

  // ============ Category CRUD Operations ============

  /**
   * Add a new category
   */
  const addCategory = useCallback(async (categoryData) => {
    try {
      const { data, error } = await supabase
        .from('categories')
        .insert({
          name: categoryData.name,
          icon: categoryData.icon,
          color: categoryData.color,
        })
        .select()
        .single();

      if (error) throw error;
      setCategories((prev) => [...prev, transformCategory(data)]);
    } catch (err) {
      console.error('Error adding category:', err);
      throw err;
    }
  }, []);

  /**
   * Update an existing category
   */
  const updateCategory = useCallback(async (id, categoryData) => {
    try {
      const { data, error } = await supabase
        .from('categories')
        .update({
          name: categoryData.name,
          icon: categoryData.icon,
          color: categoryData.color,
          updated_at: new Date().toISOString(),
        })
        .eq('id', id)
        .select()
        .single();

      if (error) throw error;
      setCategories((prev) =>
        prev.map((c) => (c.id === id ? transformCategory(data) : c))
      );
    } catch (err) {
      console.error('Error updating category:', err);
      throw err;
    }
  }, []);

  /**
   * Delete a category and its skills. Exercises with only skills from
   * this category are deleted; exercises with cross-category skills survive.
   */
  const deleteCategory = useCallback(async (id) => {
    try {
      const categorySkillIds = skills
        .filter((s) => s.categoryId === id)
        .map((s) => s.id);

      // Find exercises that ONLY have skills from this category
      const orphanIds = exercises
        .filter((e) => e.skillIds.every((sid) => categorySkillIds.includes(sid)))
        .map((e) => e.id);

      // Delete orphaned exercises
      if (orphanIds.length > 0) {
        const { error: exercisesError } = await supabase
          .from('exercises')
          .delete()
          .in('id', orphanIds);
        if (exercisesError) throw exercisesError;
      }

      // For surviving exercises, update skill_id if it pointed to a deleted skill
      const survivingExercises = exercises.filter(
        (e) => !orphanIds.includes(e.id) && e.skillIds.some((sid) => categorySkillIds.includes(sid))
      );
      for (const ex of survivingExercises) {
        const remainingSkills = ex.skillIds.filter((sid) => !categorySkillIds.includes(sid));
        if (categorySkillIds.includes(ex.skillId) && remainingSkills.length > 0) {
          await supabase
            .from('exercises')
            .update({ skill_id: remainingSkills[0] })
            .eq('id', ex.id);
        }
      }

      // Delete skills (cascades exercise_skills rows)
      const { error: skillsError } = await supabase
        .from('skills')
        .delete()
        .eq('category_id', id);
      if (skillsError) throw skillsError;

      // Delete the category
      const { error: categoryError } = await supabase
        .from('categories')
        .delete()
        .eq('id', id);
      if (categoryError) throw categoryError;

      // Update local state
      setCategories((prev) => prev.filter((c) => c.id !== id));
      setSkills((prev) => prev.filter((s) => s.categoryId !== id));
      setExercises((prev) =>
        prev
          .filter((e) => !orphanIds.includes(e.id))
          .map((e) => {
            if (e.skillIds.some((sid) => categorySkillIds.includes(sid))) {
              const remaining = e.skillIds.filter((sid) => !categorySkillIds.includes(sid));
              return {
                ...e,
                skillIds: remaining,
                skillId: categorySkillIds.includes(e.skillId) ? remaining[0] : e.skillId,
              };
            }
            return e;
          })
      );
    } catch (err) {
      console.error('Error deleting category:', err);
      throw err;
    }
  }, [skills, exercises]);

  // ============ Skill CRUD Operations ============

  /**
   * Add a new skill
   */
  const addSkill = useCallback(async (skillData) => {
    try {
      const { data, error } = await supabase
        .from('skills')
        .insert({
          category_id: parseInt(skillData.categoryId, 10),
          name: skillData.name,
          age_group: skillData.ageGroup,
          description: skillData.description,
        })
        .select()
        .single();

      if (error) throw error;
      setSkills((prev) => [...prev, transformSkill(data)]);
    } catch (err) {
      console.error('Error adding skill:', err);
      throw err;
    }
  }, []);

  /**
   * Update an existing skill
   */
  const updateSkill = useCallback(async (id, skillData) => {
    try {
      const { data, error } = await supabase
        .from('skills')
        .update({
          category_id: parseInt(skillData.categoryId, 10),
          name: skillData.name,
          age_group: skillData.ageGroup,
          description: skillData.description,
          updated_at: new Date().toISOString(),
        })
        .eq('id', id)
        .select()
        .single();

      if (error) throw error;
      setSkills((prev) =>
        prev.map((s) => (s.id === id ? transformSkill(data) : s))
      );
    } catch (err) {
      console.error('Error updating skill:', err);
      throw err;
    }
  }, []);

  /**
   * Delete a skill. Exercises with only this skill are deleted;
   * exercises with other skills survive with this skill removed.
   */
  const deleteSkill = useCallback(async (id) => {
    try {
      // Find exercises that ONLY have this skill (will be orphaned)
      const orphanIds = exercises
        .filter((e) => e.skillIds.length === 1 && e.skillIds.includes(id))
        .map((e) => e.id);

      // Delete orphaned exercises
      if (orphanIds.length > 0) {
        const { error: exercisesError } = await supabase
          .from('exercises')
          .delete()
          .in('id', orphanIds);
        if (exercisesError) throw exercisesError;
      }

      // For exercises that have other skills, update skill_id to their next remaining skill
      const multiSkillExercises = exercises.filter(
        (e) => e.skillIds.includes(id) && e.skillIds.length > 1
      );
      for (const ex of multiSkillExercises) {
        const remainingSkills = ex.skillIds.filter((sid) => sid !== id);
        if (ex.skillId === id) {
          await supabase
            .from('exercises')
            .update({ skill_id: remainingSkills[0] })
            .eq('id', ex.id);
        }
      }

      // Delete the skill (cascades exercise_skills rows)
      const { error: skillError } = await supabase
        .from('skills')
        .delete()
        .eq('id', id);
      if (skillError) throw skillError;

      // Update local state
      setSkills((prev) => prev.filter((s) => s.id !== id));
      setExercises((prev) =>
        prev
          .filter((e) => !orphanIds.includes(e.id))
          .map((e) =>
            e.skillIds.includes(id)
              ? {
                  ...e,
                  skillIds: e.skillIds.filter((sid) => sid !== id),
                  skillId: e.skillId === id ? e.skillIds.find((sid) => sid !== id) : e.skillId,
                }
              : e
          )
      );
    } catch (err) {
      console.error('Error deleting skill:', err);
      throw err;
    }
  }, [exercises]);

  // ============ Exercise CRUD Operations ============

  /**
   * Add a new exercise with multi-skill support
   */
  const addExercise = useCallback(async (exerciseData) => {
    try {
      const skillIds = exerciseData.skillIds.map((id) => parseInt(id, 10));

      // Insert exercise (skill_id = first skill for backward compat)
      const { data, error } = await supabase
        .from('exercises')
        .insert({
          skill_id: skillIds[0],
          name: exerciseData.name,
          video_url: exerciseData.videoUrl || null,
          difficulty: normalizeDifficulty(exerciseData.difficulty),
          description: exerciseData.description,
          equipment: exerciseData.equipment || [],
        })
        .select()
        .single();

      if (error) throw error;

      // Insert junction rows
      const { error: junctionError } = await supabase
        .from('exercise_skills')
        .insert(skillIds.map((sid) => ({ exercise_id: data.id, skill_id: sid })));

      if (junctionError) throw junctionError;

      const skillIdsMap = new Map([[data.id, skillIds]]);
      setExercises((prev) => [...prev, transformExercise(data, skillIdsMap)]);
    } catch (err) {
      console.error('Error adding exercise:', err);
      throw err;
    }
  }, []);

  /**
   * Update an existing exercise with multi-skill support
   */
  const updateExercise = useCallback(async (id, exerciseData) => {
    try {
      const skillIds = exerciseData.skillIds.map((sid) => parseInt(sid, 10));

      // Update exercise table (skill_id = first skill for backward compat)
      const { data, error } = await supabase
        .from('exercises')
        .update({
          skill_id: skillIds[0],
          name: exerciseData.name,
          video_url: exerciseData.videoUrl || null,
          difficulty: normalizeDifficulty(exerciseData.difficulty),
          description: exerciseData.description,
          equipment: exerciseData.equipment || [],
          updated_at: new Date().toISOString(),
        })
        .eq('id', id)
        .select()
        .single();

      if (error) throw error;

      // Replace junction rows: delete all, re-insert
      const { error: deleteError } = await supabase
        .from('exercise_skills')
        .delete()
        .eq('exercise_id', id);
      if (deleteError) throw deleteError;

      const { error: insertError } = await supabase
        .from('exercise_skills')
        .insert(skillIds.map((sid) => ({ exercise_id: id, skill_id: sid })));
      if (insertError) throw insertError;

      const skillIdsMap = new Map([[id, skillIds]]);
      setExercises((prev) =>
        prev.map((e) => (e.id === id ? transformExercise(data, skillIdsMap) : e))
      );
    } catch (err) {
      console.error('Error updating exercise:', err);
      throw err;
    }
  }, []);

  /**
   * Delete an exercise
   */
  const deleteExercise = useCallback(async (id) => {
    try {
      const { error } = await supabase
        .from('exercises')
        .delete()
        .eq('id', id);

      if (error) throw error;
      setExercises((prev) => prev.filter((e) => e.id !== id));
    } catch (err) {
      console.error('Error deleting exercise:', err);
      throw err;
    }
  }, []);

  // ============ Query Helpers ============

  /**
   * Get a skill by its ID
   */
  const getSkillById = useCallback(
    (skillId) => skills.find((s) => s.id === skillId),
    [skills]
  );

  /**
   * Get a category by its ID
   */
  const getCategoryById = useCallback(
    (categoryId) => categories.find((c) => c.id === categoryId),
    [categories]
  );

  /**
   * Get skills for a category with optional filtering
   */
  const getSkillsForCategory = useCallback(
    (categoryId, { searchTerm = '', filterAgeGroup = '', filterHasExercises = false, exactAgeMatch = false } = {}) => {
      let result = skills.filter((s) => s.categoryId === categoryId);

      if (filterAgeGroup) {
        if (exactAgeMatch) {
          // Exact match: only show skills for the selected age
          result = result.filter((s) => s.ageGroup === filterAgeGroup);
        } else {
          // Cumulative: show all skills up to and including the selected age
          const maxIndex = AGE_GROUPS.indexOf(filterAgeGroup);
          result = result.filter((s) => AGE_GROUPS.indexOf(s.ageGroup) <= maxIndex);
        }
      }

      if (filterHasExercises) {
        result = result.filter((s) => exercises.some((e) => e.skillIds.includes(s.id)));
      }

      if (searchTerm) {
        const term = searchTerm.toLowerCase();
        result = result.filter((s) => s.name.toLowerCase().includes(term));
      }

      return result;
    },
    [skills, exercises]
  );

  /**
   * Get exercises for a skill with optional filtering
   */
  const getExercisesForSkill = useCallback(
    (skillId, { searchTerm = '' } = {}) => {
      let result = exercises.filter((e) => e.skillIds.includes(skillId));

      if (searchTerm) {
        const term = searchTerm.toLowerCase();
        result = result.filter((e) => e.name.toLowerCase().includes(term));
      }

      return result;
    },
    [exercises]
  );

  // ============ Stats ============

  const stats = useMemo(
    () => ({
      totalCategories: categories.length,
      totalSkills: skills.length,
      totalExercises: exercises.length,
    }),
    [categories.length, skills.length, exercises.length]
  );

  return {
    // Data
    categories,
    skills,
    exercises,
    stats,
    loading,
    error,

    // Category operations
    addCategory,
    updateCategory,
    deleteCategory,

    // Skill operations
    addSkill,
    updateSkill,
    deleteSkill,

    // Exercise operations
    addExercise,
    updateExercise,
    deleteExercise,

    // Query helpers
    getSkillById,
    getCategoryById,
    getSkillsForCategory,
    getExercisesForSkill,
  };
};

export default useData;
