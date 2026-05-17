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
  filters.exerciseFilter !== "all";

export function filterExercises(exerciseList: Exercise[], filters: LibraryFilters): Exercise[] {
  if (!filters.searchTerm) return exerciseList;
  const term = normalizeSearchTerm(filters.searchTerm);
  if (!term) return exerciseList;
  return exerciseList.filter((e) =>
    matchesAnyField([e.name, e.description ?? "", ...(e.equipment ?? [])], term),
  );
}
