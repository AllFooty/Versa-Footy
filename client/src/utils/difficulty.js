/**
 * Utility functions for handling exercise difficulty ratings
 */

/**
 * Clamps a difficulty value between 1 and 5
 * @param {number} value - The value to clamp
 * @returns {number} The clamped value (1-5)
 */
export const clampDifficulty = (value) => Math.min(5, Math.max(1, value));

/**
 * Normalizes various difficulty formats to a 1-5 numeric scale
 * @param {number|string} value - The difficulty value to normalize
 * @returns {number} A number between 1 and 5
 */
export const normalizeDifficulty = (value) => {
  if (typeof value === 'number' && !Number.isNaN(value)) {
    return clampDifficulty(value);
  }

  const str = String(value || '').toLowerCase();
  const mapped = {
    beginner: 1,
    easy: 1,
    intermediate: 2,
    medium: 3,
    advanced: 4,
    hard: 4,
    expert: 5,
  }[str];

  if (mapped) return mapped;

  const parsed = parseInt(value, 10);
  return Number.isNaN(parsed) ? 1 : clampDifficulty(parsed);
};

/**
 * Renders difficulty as star characters
 * @param {number|string} value - The difficulty value
 * @returns {string} Star representation (e.g., "★★★☆☆")
 */
export const renderDifficultyStars = (value) => {
  const rating = normalizeDifficulty(value);
  return `${'★'.repeat(rating)}${'☆'.repeat(5 - rating)}`;
};

/**
 * Gets the color style for a difficulty rating
 * @param {number|string} value - The difficulty value
 * @returns {object} Style object with background and color
 */
export const getDifficultyStyle = (value) => {
  const palette = ['#22c55e', '#84cc16', '#eab308', '#f97316', '#ef4444'];
  const rating = normalizeDifficulty(value);
  const color = palette[rating - 1] || '#3b82f6';
  return { background: `${color}20`, color, letterSpacing: 1 };
};
