/**
 * Application constants
 */

/**
 * XP Calculation Formula (must match iOS XPCalculator.swift)
 *
 * Base XP by difficulty:
 *   1 (Beginner) = 10 XP
 *   2 (Easy)     = 15 XP
 *   3 (Medium)   = 20 XP
 *   4 (Hard)     = 30 XP
 *   5 (Expert)   = 50 XP
 *
 * Rating multiplier (self-assessment 1-5):
 *   1 (Tough!)    = 0.5x
 *   2 (Tricky)    = 0.75x
 *   3 (OK)        = 1.0x
 *   4 (Good!)     = 1.25x
 *   5 (Nailed it) = 1.5x
 *
 * Bonuses:
 *   First-time completion = +50%
 *   Streak bonus = +5% per consecutive day (max +50%)
 *
 * Mastery:
 *   Requires 10+ completions with avg rating >= 4.5
 *   Mastery bonus = 500 XP
 *
 * Streak shields: max 5, earn 1 every 7 consecutive days
 */

/**
 * Difficulty level options for exercises
 */
/**
 * Generate difficulty options with i18n labels
 * @param {function} t - i18next translation function
 * @returns {array} Array of difficulty options with localized labels
 */
export const getDifficultyOptions = (t) => [
  { value: 1, label: t('constants.difficulty.star1') },
  { value: 2, label: t('constants.difficulty.star2') },
  { value: 3, label: t('constants.difficulty.star3') },
  { value: 4, label: t('constants.difficulty.star4') },
  { value: 5, label: t('constants.difficulty.star5') },
];

// Legacy export for backward compatibility (to be removed)
export const DIFFICULTY_OPTIONS = [
  { value: 1, label: '⭐ Beginner' },
  { value: 2, label: '⭐⭐ Easy' },
  { value: 3, label: '⭐⭐⭐ Medium' },
  { value: 4, label: '⭐⭐⭐⭐ Hard' },
  { value: 5, label: '⭐⭐⭐⭐⭐ Expert' },
];

/**
 * Available age groups for skills
 */
export const AGE_GROUPS = [
  'U-7',
  'U-8',
  'U-9',
  'U-10',
  'U-11',
  'U-12',
  'U-13',
  'U-14',
  'U-15+',
];

/**
 * Minimum duration options for exercises (seconds → display label)
 * NULL = Auto (calculated by the iOS app based on category & difficulty)
 */
export const DURATION_OPTIONS = [
  { value: null, label: 'Auto (based on category & difficulty)' },
  { value: 30, label: '30 seconds' },
  { value: 45, label: '45 seconds' },
  { value: 60, label: '1 minute' },
  { value: 90, label: '1 min 30s' },
  { value: 120, label: '2 minutes' },
  { value: 150, label: '2 min 30s' },
  { value: 180, label: '3 minutes' },
];

/**
 * Get the friendly display label for a minimum_duration value
 * @param {number|null} value - duration in seconds or null
 * @param {boolean} short - if true, returns compact label for badges
 */
export const getDurationLabel = (value, short = false) => {
  if (value === null || value === undefined) return 'Auto';
  const option = DURATION_OPTIONS.find((opt) => opt.value === value);
  return option ? option.label : 'Auto';
};

/**
 * Common equipment options for exercises
 */
export const EQUIPMENT_OPTIONS = [
  'Ball',
  'Cones',
  'Agility Ladder',
  'Goal',
  'Wall',
  'Mannequin',
  'Resistance Band',
  'Hurdles',
  'Poles',
  'Rebounder',
];

/**
 * Default filter state for the advanced search/filter system
 */
export const DEFAULT_FILTERS = {
  searchTerm: '',
  ageGroup: '',
  exactAgeMatch: false,
  exerciseFilter: 'all',       // 'all' | 'has' | 'none'
  difficultyMin: null,          // 1-5 or null
  difficultyMax: null,          // 1-5 or null
  equipment: [],                // selected equipment strings (AND logic)
  noEquipment: false,           // true = only exercises with empty equipment
  durationMin: null,            // seconds or null
  durationMax: null,            // seconds or null
  hasVideo: null,               // null=either, true=yes, false=no
  comboFilter: 'either',       // 'either' | 'single' | 'combo'
  categoryIds: [],              // empty = all categories
};

/**
 * Default values for new items
 */
export const DEFAULTS = {
  category: {
    name: '',
    icon: '⚽',
    color: '#E63946',
  },
  skill: {
    name: '',
    categoryId: '',
    ageGroup: 'U-7',
    description: '',
  },
  exercise: {
    name: '',
    skillIds: [],
    videoUrl: '',
    difficulty: 1,
    description: '',
    equipment: [],
    minimumDuration: null,
  },
};
