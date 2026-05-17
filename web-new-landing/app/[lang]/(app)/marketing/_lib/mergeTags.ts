// Merge-tag substitution. Mirror of the send-marketing-email edge function —
// keep these implementations in sync.
//
// Syntax:
//   {{first_name}}                 — variable substitution; empty if missing
//   {{first_name|"there"}}         — fallback if variable is missing/empty

export const MERGE_TAGS = [
  "first_name",
  "full_name",
  "current_level",
  "streak_days",
] as const;

export type MergeTag = (typeof MERGE_TAGS)[number];

const TAG_RE = /\{\{\s*([a-zA-Z_]+)(?:\s*\|\s*"([^"]*)")?\s*\}\}/g;

// HTML-encode user-provided values so a profile.full_name like "<script>"
// can't break out of attributes or inject markup. Subjects (RFC 2822 headers)
// are not HTML and pass through unencoded.
function htmlEncode(s: unknown): string {
  return String(s)
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#39;");
}

export type RecipientSample = {
  email?: string | null;
  first_name?: string | null;
  full_name?: string | null;
  current_level?: number | null;
  current_streak?: number | null;
};

export type MergeVars = {
  first_name: string;
  full_name: string;
  current_level: string;
  streak_days: string;
};

export function recipientToVars(recipient: RecipientSample | null): MergeVars {
  if (!recipient) {
    return { first_name: "", full_name: "", current_level: "", streak_days: "" };
  }
  const fullName = recipient.full_name ?? null;
  const firstName =
    recipient.first_name ??
    (fullName ? String(fullName).split(/\s+/)[0] : null);
  return {
    first_name: firstName ?? "",
    full_name: fullName ?? "",
    current_level: recipient.current_level != null ? String(recipient.current_level) : "",
    streak_days: recipient.current_streak != null ? String(recipient.current_streak) : "",
  };
}

// `opts.encode = 'html'` HTML-encodes substituted values. Leave undefined for
// plain-text contexts (subjects). {{unsubscribe_url}} is left untouched —
// that's a server-only token.
export function applyMergeTags(
  template: string | null | undefined,
  vars: Partial<MergeVars> | null | undefined,
  opts?: { encode?: "html" },
): string {
  if (!template) return template ?? "";
  const encode = opts?.encode === "html" ? htmlEncode : (s: unknown) => String(s);
  return template.replace(TAG_RE, (match, name: string, fallback?: string) => {
    if (name === "unsubscribe_url") return match;
    const value = (vars as Record<string, unknown> | null | undefined)?.[name];
    if (value != null && value !== "") return encode(value);
    return fallback != null ? encode(fallback) : "";
  });
}

export function findUnknownTags(template: string | null | undefined): string[] {
  const found = new Set<string>();
  if (!template) return [];
  TAG_RE.lastIndex = 0;
  let m: RegExpExecArray | null;
  while ((m = TAG_RE.exec(template)) !== null) {
    if (m[1] === "unsubscribe_url") continue;
    if (!(MERGE_TAGS as readonly string[]).includes(m[1])) found.add(m[1]);
  }
  return Array.from(found);
}
