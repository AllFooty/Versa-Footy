/**
 * Search utility functions for the library
 */

/**
 * Normalize a search query: lowercase, collapse whitespace, trim.
 * "  Toe   Taps " => "toe taps"
 */
export const normalizeSearchTerm = (term) =>
  term.toLowerCase().replace(/\s+/g, ' ').trim();

/**
 * Tokenized multi-word search.
 * Every token must appear somewhere in the text.
 * "ball cone" matches "Use Ball and Cones for this drill"
 */
export const matchesSearch = (text, normalizedTerm) => {
  if (!normalizedTerm) return true;
  if (!text) return false;
  const lower = text.toLowerCase();
  const tokens = normalizedTerm.split(' ');
  return tokens.every((token) => lower.includes(token));
};

/**
 * Check if a search term matches any of the provided text fields.
 * Returns true if ALL tokens appear within ANY single field.
 */
export const matchesAnyField = (fields, normalizedTerm) => {
  if (!normalizedTerm) return true;
  return fields.some((field) => matchesSearch(field, normalizedTerm));
};

/**
 * Whether a search is actively filtering (non-empty after normalization).
 */
export const isSearchActive = (searchTerm) =>
  normalizeSearchTerm(searchTerm).length > 0;

/**
 * Check if any advanced filter (beyond text search) is active.
 */
export const isAnyFilterActive = (filters) =>
  isSearchActive(filters.searchTerm) ||
  !!filters.ageGroup ||
  filters.exerciseFilter !== 'all' ||
  filters.difficultyMin != null ||
  filters.difficultyMax != null ||
  filters.equipment.length > 0 ||
  filters.noEquipment ||
  filters.durationMin != null ||
  filters.durationMax != null ||
  filters.hasVideo != null ||
  filters.comboFilter !== 'either' ||
  filters.categoryIds.length > 0;

/**
 * Apply exercise-level filters to a list of exercises.
 * Pure function shared by useData hook and TreeView.
 */
export const filterExercises = (exerciseList, filters = {}) => {
  let result = exerciseList;

  // Text search
  if (filters.searchTerm) {
    const term = normalizeSearchTerm(filters.searchTerm);
    if (term) {
      result = result.filter((e) =>
        matchesAnyField([e.name, e.description || '', ...(e.equipment || [])], term)
      );
    }
  }

  // Difficulty range
  if (filters.difficultyMin != null) {
    result = result.filter((e) => e.difficulty != null && e.difficulty >= filters.difficultyMin);
  }
  if (filters.difficultyMax != null) {
    result = result.filter((e) => e.difficulty != null && e.difficulty <= filters.difficultyMax);
  }

  // Equipment
  if (filters.noEquipment) {
    result = result.filter((e) => !e.equipment || e.equipment.length === 0);
  } else if (filters.equipment?.length > 0) {
    result = result.filter((e) =>
      filters.equipment.every((eq) => e.equipment?.includes(eq))
    );
  }

  // Duration range
  if (filters.durationMin != null) {
    result = result.filter((e) => e.minimumDuration != null && e.minimumDuration >= filters.durationMin);
  }
  if (filters.durationMax != null) {
    result = result.filter((e) => e.minimumDuration != null && e.minimumDuration <= filters.durationMax);
  }

  // Has video
  if (filters.hasVideo === true) {
    result = result.filter((e) => !!e.videoUrl);
  } else if (filters.hasVideo === false) {
    result = result.filter((e) => !e.videoUrl);
  }

  // Combo filter
  if (filters.comboFilter === 'combo') {
    result = result.filter((e) => e.skillIds.length > 1);
  } else if (filters.comboFilter === 'single') {
    result = result.filter((e) => e.skillIds.length === 1);
  }

  return result;
};
