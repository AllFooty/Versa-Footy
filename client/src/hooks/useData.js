import { useState, useEffect, useCallback, useMemo } from 'react';
import { supabase } from '../lib/supabase';
import { normalizeDifficulty } from '../utils/difficulty';

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
 */
const transformExercise = (exercise) => ({
  id: exercise.id,
  skillId: exercise.skill_id,
  name: exercise.name,
  videoUrl: exercise.video_url,
  difficulty: normalizeDifficulty(exercise.difficulty),
  description: exercise.description,
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
        const [categoriesRes, skillsRes, exercisesRes] = await Promise.all([
          supabase.from('categories').select('*').order('id'),
          supabase.from('skills').select('*').order('id'),
          supabase.from('exercises').select('*').order('id'),
        ]);

        if (categoriesRes.error) throw categoriesRes.error;
        if (skillsRes.error) throw skillsRes.error;
        if (exercisesRes.error) throw exercisesRes.error;

        setCategories(categoriesRes.data.map(transformCategory));
        setSkills(skillsRes.data.map(transformSkill));
        setExercises(exercisesRes.data.map(transformExercise));
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
   * Delete a category and all its skills and exercises
   */
  const deleteCategory = useCallback(async (id) => {
    try {
      // Get skill IDs for this category to delete related exercises
      const skillIds = skills
        .filter((s) => s.categoryId === id)
        .map((s) => s.id);

      // Delete exercises for these skills
      if (skillIds.length > 0) {
        const { error: exercisesError } = await supabase
          .from('exercises')
          .delete()
          .in('skill_id', skillIds);
        if (exercisesError) throw exercisesError;
      }

      // Delete skills for this category
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
      setExercises((prev) => prev.filter((e) => !skillIds.includes(e.skillId)));
    } catch (err) {
      console.error('Error deleting category:', err);
      throw err;
    }
  }, [skills]);

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
   * Delete a skill and all its exercises
   */
  const deleteSkill = useCallback(async (id) => {
    try {
      // Delete exercises for this skill
      const { error: exercisesError } = await supabase
        .from('exercises')
        .delete()
        .eq('skill_id', id);
      if (exercisesError) throw exercisesError;

      // Delete the skill
      const { error: skillError } = await supabase
        .from('skills')
        .delete()
        .eq('id', id);
      if (skillError) throw skillError;

      // Update local state
      setSkills((prev) => prev.filter((s) => s.id !== id));
      setExercises((prev) => prev.filter((e) => e.skillId !== id));
    } catch (err) {
      console.error('Error deleting skill:', err);
      throw err;
    }
  }, []);

  // ============ Exercise CRUD Operations ============

  /**
   * Add a new exercise
   */
  const addExercise = useCallback(async (exerciseData) => {
    try {
      const { data, error } = await supabase
        .from('exercises')
        .insert({
          skill_id: parseInt(exerciseData.skillId, 10),
          name: exerciseData.name,
          video_url: exerciseData.videoUrl || null,
          difficulty: normalizeDifficulty(exerciseData.difficulty),
          description: exerciseData.description,
        })
        .select()
        .single();

      if (error) throw error;
      setExercises((prev) => [...prev, transformExercise(data)]);
    } catch (err) {
      console.error('Error adding exercise:', err);
      throw err;
    }
  }, []);

  /**
   * Update an existing exercise
   */
  const updateExercise = useCallback(async (id, exerciseData) => {
    try {
      const { data, error } = await supabase
        .from('exercises')
        .update({
          skill_id: parseInt(exerciseData.skillId, 10),
          name: exerciseData.name,
          video_url: exerciseData.videoUrl || null,
          difficulty: normalizeDifficulty(exerciseData.difficulty),
          description: exerciseData.description,
          updated_at: new Date().toISOString(),
        })
        .eq('id', id)
        .select()
        .single();

      if (error) throw error;
      setExercises((prev) =>
        prev.map((e) => (e.id === id ? transformExercise(data) : e))
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
    (categoryId, { searchTerm = '', filterAgeGroup = '' } = {}) => {
      let result = skills.filter((s) => s.categoryId === categoryId);

      if (filterAgeGroup) {
        result = result.filter((s) => s.ageGroup === filterAgeGroup);
      }

      if (searchTerm) {
        const term = searchTerm.toLowerCase();
        result = result.filter((s) => s.name.toLowerCase().includes(term));
      }

      return result;
    },
    [skills]
  );

  /**
   * Get exercises for a skill with optional filtering
   */
  const getExercisesForSkill = useCallback(
    (skillId, { searchTerm = '' } = {}) => {
      let result = exercises.filter((e) => e.skillId === skillId);

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
