/**
 * Category-aware timer presets (mirrors iOS TimerPresets.swift)
 *
 * Determines how each exercise category is practiced:
 * - 'interval': Work/rest countdown (ball mastery, dribbling, etc.)
 * - 'reps': Tap-to-count reps with rest between sets (shooting, throw-ins, etc.)
 */

/**
 * Maps age group string to tier: 'young' | 'middle' | 'senior'
 */
export function getAgeTier(ageGroup) {
  switch (ageGroup) {
    case 'U-7':
    case 'U-8':
    case 'U-9':
      return 'young';
    case 'U-10':
    case 'U-11':
    case 'U-12':
      return 'middle';
    case 'U-13':
    case 'U-14':
    case 'U-15+':
      return 'senior';
    default:
      return 'middle';
  }
}

/**
 * Timer presets keyed by category name (matches Supabase categories.name)
 * Each category has a mode and per-tier config: { workSeconds, restSeconds, sets, reps }
 */
export const TIMER_PRESETS = {
  'Ball Mastery': {
    mode: 'interval',
    young:  { workSeconds: 20, restSeconds: 15, sets: 2 },
    middle: { workSeconds: 30, restSeconds: 10, sets: 3 },
    senior: { workSeconds: 30, restSeconds: 10, sets: 4 },
  },
  'Dribbling & Skill Moves': {
    mode: 'interval',
    young:  { workSeconds: 20, restSeconds: 20, sets: 2 },
    middle: { workSeconds: 30, restSeconds: 15, sets: 3 },
    senior: { workSeconds: 45, restSeconds: 15, sets: 3 },
  },
  'Passing & First Touch': {
    mode: 'interval',
    young:  { workSeconds: 30, restSeconds: 20, sets: 2 },
    middle: { workSeconds: 45, restSeconds: 15, sets: 3 },
    senior: { workSeconds: 60, restSeconds: 15, sets: 3 },
  },
  'Shooting & Finishing': {
    mode: 'reps',
    young:  { reps: 5, restSeconds: 30, sets: 2 },
    middle: { reps: 8, restSeconds: 30, sets: 3 },
    senior: { reps: 10, restSeconds: 30, sets: 3 },
  },
  'Crossing & Long Passing': {
    mode: 'interval',
    young:  { workSeconds: 30, restSeconds: 20, sets: 2 },
    middle: { workSeconds: 45, restSeconds: 20, sets: 3 },
    senior: { workSeconds: 60, restSeconds: 30, sets: 3 },
  },
  'Turns': {
    mode: 'interval',
    young:  { workSeconds: 20, restSeconds: 15, sets: 2 },
    middle: { workSeconds: 30, restSeconds: 15, sets: 3 },
    senior: { workSeconds: 30, restSeconds: 15, sets: 4 },
  },
  'Throw-Ins': {
    mode: 'reps',
    young:  { reps: 5, restSeconds: 20, sets: 2 },
    middle: { reps: 8, restSeconds: 25, sets: 3 },
    senior: { reps: 10, restSeconds: 30, sets: 3 },
  },
  'Defending & Tackling': {
    mode: 'interval',
    young:  { workSeconds: 15, restSeconds: 30, sets: 2 },
    middle: { workSeconds: 20, restSeconds: 30, sets: 3 },
    senior: { workSeconds: 30, restSeconds: 30, sets: 3 },
  },
  'Heading': {
    mode: 'reps',
    young:  { reps: 5, restSeconds: 30, sets: 1 },
    middle: { reps: 5, restSeconds: 30, sets: 1 },
    senior: { reps: 5, restSeconds: 30, sets: 2 },
  },
  'Juggling': {
    mode: 'interval',
    young:  { workSeconds: 20, restSeconds: 20, sets: 2 },
    middle: { workSeconds: 30, restSeconds: 15, sets: 3 },
    senior: { workSeconds: 45, restSeconds: 15, sets: 4 },
  },
};

/**
 * Get the resolved timer config for a category name and age group.
 * Returns { mode, workSeconds, restSeconds, sets, reps }
 */
export function getTimerConfig(categoryName, ageGroup = 'U-10') {
  const preset = TIMER_PRESETS[categoryName];
  if (!preset) {
    // Fallback for unknown categories
    return { mode: 'interval', workSeconds: 30, restSeconds: 15, sets: 3, reps: 0 };
  }

  const tier = getAgeTier(ageGroup);
  const tierConfig = preset[tier] || preset.middle;

  return {
    mode: preset.mode,
    workSeconds: tierConfig.workSeconds || 0,
    restSeconds: tierConfig.restSeconds || 0,
    sets: tierConfig.sets || 3,
    reps: tierConfig.reps || 0,
  };
}

/**
 * Get a human-readable description of a timer config for admin display.
 * e.g., "Interval: 30s work / 10s rest / 3 sets" or "Reps: 8 reps / 30s rest / 3 sets"
 */
export function getTimerDescription(categoryName, ageGroup = 'U-10') {
  const config = getTimerConfig(categoryName, ageGroup);

  if (config.mode === 'interval') {
    return `Interval: ${config.workSeconds}s work / ${config.restSeconds}s rest / ${config.sets} sets`;
  }
  return `Reps: ${config.reps} reps / ${config.restSeconds}s rest / ${config.sets} sets`;
}
