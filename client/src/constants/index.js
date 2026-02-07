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
  },
};
