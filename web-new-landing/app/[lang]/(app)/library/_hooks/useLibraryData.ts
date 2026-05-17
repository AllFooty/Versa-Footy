"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import { supabase } from "../../../../_lib/supabase";
import { AGE_GROUPS } from "../../../../_lib/academy/constants";
import {
  filterExercises,
  matchesAnyField,
  matchesSearch,
  normalizeSearchTerm,
} from "../_lib/search";
import type { Category, Exercise, LibraryFilters, Skill } from "../_lib/types";

type RawCategory = { id: number; name: string; icon: string | null; color: string | null };
type RawSkill = {
  id: number;
  category_id: number;
  name: string;
  age_group: string | null;
  description: string | null;
};
type RawExercise = {
  id: number;
  skill_id: number;
  name: string;
  video_url: string | null;
  difficulty: number | null;
  description: string | null;
  equipment: string[] | null;
  minimum_duration: number | null;
};
type RawJunction = { exercise_id: number; skill_id: number };

function transformCategory(c: RawCategory): Category {
  return { id: c.id, name: c.name, icon: c.icon, color: c.color };
}

function transformSkill(s: RawSkill): Skill {
  return {
    id: s.id,
    categoryId: s.category_id,
    name: s.name,
    ageGroup: (s.age_group as Skill["ageGroup"]) ?? null,
    description: s.description,
  };
}

function transformExercise(
  e: RawExercise,
  skillIdsMap: Map<number, number[]>,
): Exercise {
  return {
    id: e.id,
    skillId: e.skill_id,
    skillIds: skillIdsMap.get(e.id) ?? [e.skill_id],
    name: e.name,
    videoUrl: e.video_url,
    difficulty: e.difficulty,
    description: e.description,
    equipment: e.equipment ?? [],
    minimumDuration: e.minimum_duration,
  };
}

export type LibraryStats = {
  totalCategories: number;
  totalSkills: number;
  totalExercises: number;
};

export function useLibraryData() {
  const [categories, setCategories] = useState<Category[]>([]);
  const [skills, setSkills] = useState<Skill[]>([]);
  const [exercises, setExercises] = useState<Exercise[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [version, setVersion] = useState(0);
  const refresh = useCallback(() => setVersion((v) => v + 1), []);

  useEffect(() => {
    let cancelled = false;
    setLoading(true);
    setError(null);
    void (async () => {
      try {
        const [cRes, sRes, eRes, jRes] = await Promise.all([
          supabase.from("categories").select("*").order("id"),
          supabase.from("skills").select("*").order("id"),
          supabase.from("exercises").select("*").order("id"),
          supabase.from("exercise_skills").select("exercise_id, skill_id").order("exercise_id"),
        ]);
        if (cRes.error) throw cRes.error;
        if (sRes.error) throw sRes.error;
        if (eRes.error) throw eRes.error;
        if (jRes.error) throw jRes.error;

        const skillIdsMap = new Map<number, number[]>();
        for (const row of (jRes.data ?? []) as RawJunction[]) {
          const existing = skillIdsMap.get(row.exercise_id) ?? [];
          existing.push(row.skill_id);
          skillIdsMap.set(row.exercise_id, existing);
        }

        if (cancelled) return;
        setCategories((cRes.data as RawCategory[]).map(transformCategory));
        setSkills((sRes.data as RawSkill[]).map(transformSkill));
        setExercises(
          (eRes.data as RawExercise[]).map((e) => transformExercise(e, skillIdsMap)),
        );
      } catch (err) {
        if (!cancelled) setError(err instanceof Error ? err.message : String(err));
      } finally {
        if (!cancelled) setLoading(false);
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [version]);

  const exercisesBySkillId = useMemo(() => {
    const m = new Map<number, Exercise[]>();
    for (const e of exercises) {
      for (const sid of e.skillIds) {
        const list = m.get(sid) ?? [];
        list.push(e);
        m.set(sid, list);
      }
    }
    return m;
  }, [exercises]);

  const getSkillsForCategory = useCallback(
    (categoryId: number, filters: LibraryFilters): Skill[] => {
      let result = skills.filter((s) => s.categoryId === categoryId);

      const ageGroup = filters.ageGroup;
      if (ageGroup) {
        if (filters.exactAgeMatch) {
          result = result.filter((s) => s.ageGroup === ageGroup);
        } else {
          const maxIndex = (AGE_GROUPS as readonly string[]).indexOf(ageGroup);
          result = result.filter((s) => {
            if (!s.ageGroup) return false;
            return (AGE_GROUPS as readonly string[]).indexOf(s.ageGroup) <= maxIndex;
          });
        }
      }

      if (filters.exerciseFilter === "has") {
        result = result.filter((s) => {
          const list = exercisesBySkillId.get(s.id) ?? [];
          return filterExercises(list, filters).length > 0;
        });
      } else if (filters.exerciseFilter === "none") {
        result = result.filter((s) => {
          const list = exercisesBySkillId.get(s.id) ?? [];
          return filterExercises(list, filters).length === 0;
        });
      }

      const searchTerm = filters.searchTerm;
      if (searchTerm) {
        const term = normalizeSearchTerm(searchTerm);
        if (term) {
          result = result.filter((s) => {
            if (matchesAnyField([s.name, s.description ?? ""], term)) return true;
            const list = exercisesBySkillId.get(s.id) ?? [];
            return list.some((e) =>
              matchesAnyField([e.name, e.description ?? "", ...e.equipment], term),
            );
          });
        }
      }

      return result;
    },
    [skills, exercisesBySkillId],
  );

  const getExercisesForSkill = useCallback(
    (skillId: number, filters: LibraryFilters): Exercise[] => {
      const list = exercisesBySkillId.get(skillId) ?? [];
      const filtered = filterExercises(list, filters);
      const sorted = [...filtered];
      sorted.sort((a, b) => {
        if (a.difficulty == null && b.difficulty == null) return 0;
        if (a.difficulty == null) return 1;
        if (b.difficulty == null) return -1;
        return a.difficulty - b.difficulty;
      });
      return sorted;
    },
    [exercisesBySkillId],
  );

  const getCategoriesMatchingSearch = useCallback(
    (searchTerm: string): Set<number> => {
      if (!searchTerm) return new Set();
      const term = normalizeSearchTerm(searchTerm);
      if (!term) return new Set();
      return new Set(
        categories.filter((c) => matchesSearch(c.name, term)).map((c) => c.id),
      );
    },
    [categories],
  );

  const stats: LibraryStats = useMemo(
    () => ({
      totalCategories: categories.length,
      totalSkills: skills.length,
      totalExercises: exercises.length,
    }),
    [categories.length, skills.length, exercises.length],
  );

  return {
    categories,
    skills,
    exercises,
    exercisesBySkillId,
    stats,
    loading,
    error,
    refresh,
    getSkillsForCategory,
    getExercisesForSkill,
    getCategoriesMatchingSearch,
  };
}
