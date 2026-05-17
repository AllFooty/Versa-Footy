"use client";

import { supabase } from "../../../../_lib/supabase";
import type { AgeGroup } from "../../../../_lib/academy/constants";
import type { Exercise, Skill } from "../_lib/types";

export type SkillInput = {
  name: string;
  categoryId: number;
  ageGroup: AgeGroup | null;
  description: string | null;
};

function transform(row: {
  id: number;
  category_id: number;
  name: string;
  age_group: string | null;
  description: string | null;
}): Skill {
  return {
    id: row.id,
    categoryId: row.category_id,
    name: row.name,
    ageGroup: (row.age_group as AgeGroup | null) ?? null,
    description: row.description,
  };
}

export async function addSkill(input: SkillInput): Promise<Skill> {
  const { data, error } = await supabase
    .from("skills")
    .insert({
      category_id: input.categoryId,
      name: input.name,
      age_group: input.ageGroup,
      description: input.description,
    })
    .select()
    .single();
  if (error) throw error;
  return transform(data);
}

export async function updateSkill(id: number, input: SkillInput): Promise<Skill> {
  const { data, error } = await supabase
    .from("skills")
    .update({
      category_id: input.categoryId,
      name: input.name,
      age_group: input.ageGroup,
      description: input.description,
      updated_at: new Date().toISOString(),
    })
    .eq("id", id)
    .select()
    .single();
  if (error) throw error;
  return transform(data);
}

/**
 * Delete a skill with cascade semantics matching the SPA's useData:
 *  1. Exercises whose ONLY skill is this one are deleted outright.
 *  2. Multi-skill exercises whose primary `skill_id` is this one get repointed to the
 *     first remaining skill (junction rows for the dying skill cascade via FK).
 *  3. The skill row is deleted.
 */
export async function deleteSkill(
  id: number,
  snapshot: { exercises: Exercise[] },
): Promise<void> {
  const orphanIds = snapshot.exercises
    .filter((e) => e.skillIds.length === 1 && e.skillIds.includes(id))
    .map((e) => e.id);

  if (orphanIds.length > 0) {
    const { error } = await supabase.from("exercises").delete().in("id", orphanIds);
    if (error) throw error;
  }

  const multiSkill = snapshot.exercises.filter(
    (e) => e.skillIds.includes(id) && e.skillIds.length > 1,
  );
  for (const ex of multiSkill) {
    const remaining = ex.skillIds.filter((sid) => sid !== id);
    if (ex.skillId === id) {
      const { error } = await supabase
        .from("exercises")
        .update({ skill_id: remaining[0] })
        .eq("id", ex.id);
      if (error) throw error;
    }
  }

  const { error: skillError } = await supabase.from("skills").delete().eq("id", id);
  if (skillError) throw skillError;
}

/**
 * Compute the orphan count for a pending skill delete (exercises with this as their only skill).
 */
export function countOrphanExercisesForSkill(skillId: number, exercises: Exercise[]): number {
  return exercises.filter((e) => e.skillIds.length === 1 && e.skillIds.includes(skillId)).length;
}
