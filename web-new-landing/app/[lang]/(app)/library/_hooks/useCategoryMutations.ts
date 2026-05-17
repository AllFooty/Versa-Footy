"use client";

import { supabase } from "../../../../_lib/supabase";
import type { Category, Exercise, Skill } from "../_lib/types";

export type CategoryInput = {
  name: string;
  icon: string | null;
  color: string | null;
};

export async function addCategory(input: CategoryInput): Promise<Category> {
  const { data, error } = await supabase
    .from("categories")
    .insert({ name: input.name, icon: input.icon, color: input.color })
    .select()
    .single();
  if (error) throw error;
  return {
    id: data.id as number,
    name: data.name as string,
    icon: (data.icon as string | null) ?? null,
    color: (data.color as string | null) ?? null,
  };
}

export async function updateCategory(id: number, input: CategoryInput): Promise<Category> {
  const { data, error } = await supabase
    .from("categories")
    .update({
      name: input.name,
      icon: input.icon,
      color: input.color,
      updated_at: new Date().toISOString(),
    })
    .eq("id", id)
    .select()
    .single();
  if (error) throw error;
  return {
    id: data.id as number,
    name: data.name as string,
    icon: (data.icon as string | null) ?? null,
    color: (data.color as string | null) ?? null,
  };
}

/**
 * Delete a category with cascade semantics matching the SPA's useData:
 *  1. Exercises whose every skillIds entry lives in this category are deleted outright.
 *  2. Exercises with at least one surviving skill: if their primary `skill_id` pointed into
 *     this category, repoint it to the first surviving skill (the junction row is removed
 *     when its skill row is deleted in step 3).
 *  3. Skills under this category are deleted (`exercise_skills` rows cascade via FK).
 *  4. The category row itself is deleted.
 *
 * Callers should pass the current `skills` + `exercises` snapshot so we can compute the
 * orphan set client-side — same approach as the SPA.
 */
export async function deleteCategory(
  id: number,
  snapshot: { skills: Skill[]; exercises: Exercise[] },
): Promise<void> {
  const categorySkillIds = snapshot.skills
    .filter((s) => s.categoryId === id)
    .map((s) => s.id);

  const orphanIds = snapshot.exercises
    .filter((e) => e.skillIds.every((sid) => categorySkillIds.includes(sid)))
    .map((e) => e.id);

  if (orphanIds.length > 0) {
    const { error } = await supabase.from("exercises").delete().in("id", orphanIds);
    if (error) throw error;
  }

  const survivors = snapshot.exercises.filter(
    (e) => !orphanIds.includes(e.id) && e.skillIds.some((sid) => categorySkillIds.includes(sid)),
  );
  for (const ex of survivors) {
    const remaining = ex.skillIds.filter((sid) => !categorySkillIds.includes(sid));
    if (categorySkillIds.includes(ex.skillId) && remaining.length > 0) {
      const { error } = await supabase
        .from("exercises")
        .update({ skill_id: remaining[0] })
        .eq("id", ex.id);
      if (error) throw error;
    }
  }

  const { error: skillsError } = await supabase
    .from("skills")
    .delete()
    .eq("category_id", id);
  if (skillsError) throw skillsError;

  const { error: categoryError } = await supabase.from("categories").delete().eq("id", id);
  if (categoryError) throw categoryError;
}
