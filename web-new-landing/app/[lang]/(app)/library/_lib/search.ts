import type { Exercise, LibraryFilters } from "./types";

export const normalizeSearchTerm = (term: string): string =>
  term.toLowerCase().replace(/\s+/g, " ").trim();

export const matchesSearch = (text: string | null | undefined, normalizedTerm: string): boolean => {
  if (!normalizedTerm) return true;
  if (!text) return false;
  const lower = text.toLowerCase();
  const tokens = normalizedTerm.split(" ");
  return tokens.every((token) => lower.includes(token));
};

export const matchesAnyField = (
  fields: (string | null | undefined)[],
  normalizedTerm: string,
): boolean => {
  if (!normalizedTerm) return true;
  return fields.some((field) => matchesSearch(field, normalizedTerm));
};

export const isSearchActive = (searchTerm: string): boolean =>
  normalizeSearchTerm(searchTerm).length > 0;

export const isAnyFilterActive = (filters: LibraryFilters): boolean =>
  isSearchActive(filters.searchTerm) ||
  !!filters.ageGroup ||
  filters.exerciseFilter !== "all" ||
  filters.difficultyMin != null ||
  filters.difficultyMax != null ||
  filters.equipment.length > 0 ||
  filters.noEquipment ||
  filters.durationMin != null ||
  filters.durationMax != null ||
  filters.hasVideo != null ||
  filters.comboFilter !== "either";

export function filterExercises(exerciseList: Exercise[], filters: LibraryFilters): Exercise[] {
  let result = exerciseList;

  if (filters.searchTerm) {
    const term = normalizeSearchTerm(filters.searchTerm);
    if (term) {
      result = result.filter((e) =>
        matchesAnyField([e.name, e.description ?? "", ...(e.equipment ?? [])], term),
      );
    }
  }

  if (filters.difficultyMin != null) {
    const min = filters.difficultyMin;
    result = result.filter((e) => e.difficulty != null && e.difficulty >= min);
  }
  if (filters.difficultyMax != null) {
    const max = filters.difficultyMax;
    result = result.filter((e) => e.difficulty != null && e.difficulty <= max);
  }

  if (filters.noEquipment) {
    result = result.filter((e) => !e.equipment || e.equipment.length === 0);
  } else if (filters.equipment.length > 0) {
    result = result.filter((e) =>
      filters.equipment.every((eq) => e.equipment?.includes(eq)),
    );
  }

  if (filters.durationMin != null) {
    const min = filters.durationMin;
    result = result.filter((e) => e.minimumDuration != null && e.minimumDuration >= min);
  }
  if (filters.durationMax != null) {
    const max = filters.durationMax;
    result = result.filter((e) => e.minimumDuration != null && e.minimumDuration <= max);
  }

  if (filters.hasVideo === true) {
    result = result.filter((e) => !!e.videoUrl);
  } else if (filters.hasVideo === false) {
    result = result.filter((e) => !e.videoUrl);
  }

  if (filters.comboFilter === "combo") {
    result = result.filter((e) => e.skillIds.length > 1);
  } else if (filters.comboFilter === "single") {
    result = result.filter((e) => e.skillIds.length === 1);
  }

  return result;
}
