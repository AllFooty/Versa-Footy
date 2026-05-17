// Field/operator metadata for the segment builder. Must mirror the whitelist
// inside marketing_segment_match (migration 025) — when you add a field there,
// add it here too.

export type OperatorKey =
  | "is_null"
  | "is_not_null"
  | "eq"
  | "neq"
  | "gt"
  | "gte"
  | "lt"
  | "lte"
  | "before"
  | "after"
  | "within_last_days"
  | "older_than_days"
  | "like"
  | "in";

export const OPERATORS: Record<OperatorKey, { valueless?: boolean }> = {
  is_null: { valueless: true },
  is_not_null: { valueless: true },
  eq: {},
  neq: {},
  gt: {},
  gte: {},
  lt: {},
  lte: {},
  before: {},
  after: {},
  within_last_days: {},
  older_than_days: {},
  like: {},
  in: {},
};

export type FieldType = "text" | "bool" | "timestamp" | "enum" | "int" | "date";

export type FieldDef = {
  key: string;
  type: FieldType;
  ops: OperatorKey[];
  options?: { value: string }[];
};

export const FIELDS: FieldDef[] = [
  { key: "email", type: "text", ops: ["is_not_null", "is_null", "eq", "neq", "like"] },
  { key: "marketing_opt_in", type: "bool", ops: ["eq"] },
  { key: "marketing_unsubscribed_at", type: "timestamp", ops: ["is_null", "is_not_null"] },
  {
    key: "locale",
    type: "enum",
    options: [{ value: "en" }, { value: "ar" }],
    ops: ["eq", "neq", "in"],
  },
  {
    key: "profile_created_at",
    type: "timestamp",
    ops: ["within_last_days", "older_than_days", "before", "after"],
  },
  {
    key: "current_level",
    type: "int",
    ops: ["eq", "neq", "gt", "gte", "lt", "lte", "is_null"],
  },
  { key: "current_streak", type: "int", ops: ["eq", "gt", "gte", "lt", "lte"] },
  {
    key: "last_practice_date",
    type: "date",
    ops: ["is_null", "is_not_null", "before", "after"],
  },
  { key: "days_since_last_practice", type: "int", ops: ["gte", "lte"] },
];

export function getField(key: string): FieldDef | undefined {
  return FIELDS.find((f) => f.key === key);
}

export type Rule = {
  field: string;
  op: OperatorKey;
  value?: unknown;
};

export type SegmentFilter = {
  match: "all" | "any";
  rules: Rule[];
};

export function emptyRule(): Rule {
  return { field: "email", op: "is_not_null" };
}

export function emptyFilter(): SegmentFilter {
  return { match: "all", rules: [emptyRule()] };
}

export function coerceValue(
  field: FieldDef | undefined,
  op: OperatorKey,
  raw: unknown,
): unknown {
  if (OPERATORS[op]?.valueless) return undefined;
  if (!field) return raw;
  switch (field.type) {
    case "bool":
      return raw === true || raw === "true";
    case "int":
      return Number.parseInt(String(raw), 10);
    case "enum":
      if (op === "in") {
        return String(raw)
          .split(",")
          .map((s) => s.trim())
          .filter(Boolean);
      }
      return String(raw);
    default:
      return raw;
  }
}
