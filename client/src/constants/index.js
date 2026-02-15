/**
 * Application constants
 */

/**
 * Difficulty level options for exercises
 */
export const DIFFICULTY_OPTIONS = [
  { value: 1, label: '1 Star - Easiest' },
  { value: 2, label: '2 Stars' },
  { value: 3, label: '3 Stars' },
  { value: 4, label: '4 Stars' },
  { value: 5, label: '5 Stars - Hardest' },
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
  if (!option) return 'Auto';
  if (short) {
    // Return compact form for list badges
    return option.label;
  }
  return option.label;
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
