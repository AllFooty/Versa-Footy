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
