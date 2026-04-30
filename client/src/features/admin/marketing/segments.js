// Field/operator metadata for the segment builder. Must mirror the whitelist
// inside marketing_segment_match (migration 025) — when you add a field there,
// add it here too.

export const OPERATORS = {
  is_null: { label: 'is empty', valueless: true },
  is_not_null: { label: 'is set', valueless: true },
  eq: { label: '=' },
  neq: { label: '≠' },
  gt: { label: '>' },
  gte: { label: '≥' },
  lt: { label: '<' },
  lte: { label: '≤' },
  before: { label: 'before' },
  after: { label: 'after' },
  within_last_days: { label: 'within last (days)' },
  older_than_days: { label: 'older than (days)' },
  like: { label: 'contains' },
  in: { label: 'is one of (CSV)' },
};

export const FIELDS = [
  { key: 'email', label: 'Email', type: 'text', ops: ['is_not_null', 'is_null', 'eq', 'neq', 'like'] },
  { key: 'marketing_opt_in', label: 'Marketing opt-in', type: 'bool', ops: ['eq'] },
  { key: 'marketing_unsubscribed_at', label: 'Marketing unsubscribed', type: 'timestamp', ops: ['is_null', 'is_not_null'] },
  { key: 'locale', label: 'Locale', type: 'enum', options: [
      { value: 'en', label: 'English' }, { value: 'ar', label: 'Arabic' },
    ], ops: ['eq', 'neq', 'in'] },
  { key: 'profile_created_at', label: 'Account age', type: 'timestamp',
    ops: ['within_last_days', 'older_than_days', 'before', 'after'] },
  { key: 'current_level', label: 'Current level', type: 'int',
    ops: ['eq', 'neq', 'gt', 'gte', 'lt', 'lte', 'is_null'] },
  { key: 'current_streak', label: 'Current streak', type: 'int',
    ops: ['eq', 'gt', 'gte', 'lt', 'lte'] },
  { key: 'last_practice_date', label: 'Last practice date', type: 'date',
    ops: ['is_null', 'is_not_null', 'before', 'after'] },
  { key: 'days_since_last_practice', label: 'Days since last practice', type: 'int', ops: ['gte', 'lte'] },
];

export function getField(key) {
  return FIELDS.find((f) => f.key === key);
}

export function emptyRule() {
  return { field: 'email', op: 'is_not_null' };
}

export function emptyFilter() {
  return { match: 'all', rules: [emptyRule()] };
}

// Coerce a UI value back into the JSON shape the server expects.
export function coerceValue(field, op, raw) {
  if (OPERATORS[op]?.valueless) return undefined;
  if (!field) return raw;
  switch (field.type) {
    case 'bool':
      return raw === true || raw === 'true';
    case 'int':
      return Number.parseInt(raw, 10);
    case 'enum':
      if (op === 'in') {
        return String(raw).split(',').map((s) => s.trim()).filter(Boolean);
      }
      return String(raw);
    default:
      return raw;
  }
}
