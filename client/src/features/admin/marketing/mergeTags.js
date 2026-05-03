// Merge-tag substitution. Used both in the frontend preview and (mirror copy)
// in the send-marketing-email edge function. Keep these implementations in sync.
//
// Syntax:
//   {{first_name}}                 — variable substitution; empty if missing
//   {{first_name|"there"}}         — fallback if variable is missing/empty
//
// Supported variables: first_name, full_name, current_level, streak_days.

export const MERGE_TAGS = ['first_name', 'full_name', 'current_level', 'streak_days'];

const TAG_RE = /\{\{\s*([a-zA-Z_]+)(?:\s*\|\s*"([^"]*)")?\s*\}\}/g;

// HTML-encode user-provided values so a profile.full_name like "<script>" or
// `Jenny "the boss"` can't break out of attributes or inject markup. Used when
// substituting into HTML body. Subjects are RFC 2822 headers and not rendered
// as HTML, so we leave them alone.
function htmlEncode(s) {
  return String(s)
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#39;');
}

// Map a recipient row → the variable bag the templates reference.
// Accepts the shape returned by marketing_sample_recipient or marketing_segment_recipients.
export function recipientToVars(recipient) {
  if (!recipient) return {};
  const fullName = recipient.full_name ?? null;
  const firstName = recipient.first_name ?? (fullName ? String(fullName).split(/\s+/)[0] : null);
  return {
    first_name: firstName ?? '',
    full_name: fullName ?? '',
    current_level: recipient.current_level != null ? String(recipient.current_level) : '',
    streak_days: recipient.current_streak != null ? String(recipient.current_streak) : '',
  };
}

// Substitute tags in a single string. `vars` keyed by tag name.
// Missing variable + no fallback → empty string. Missing + fallback → fallback.
// {{unsubscribe_url}} is intentionally NOT processed here — that's a server-only token.
//
// `opts.encode = 'html'` HTML-encodes substituted values. Use this for HTML
// bodies. Leave undefined/falsy for plain-text contexts (subjects).
export function applyMergeTags(template, vars, opts) {
  if (!template) return template;
  const encode = opts?.encode === 'html' ? htmlEncode : (s) => String(s);
  return template.replace(TAG_RE, (match, name, fallback) => {
    if (name === 'unsubscribe_url') return match; // leave for server
    const value = vars?.[name];
    if (value != null && value !== '') return encode(value);
    return fallback != null ? encode(fallback) : '';
  });
}

// Highlight unresolved tags in preview HTML so the editor can spot typos.
export function findUnknownTags(template) {
  const found = new Set();
  if (!template) return [];
  let m;
  TAG_RE.lastIndex = 0;
  while ((m = TAG_RE.exec(template)) !== null) {
    if (m[1] === 'unsubscribe_url') continue;
    if (!MERGE_TAGS.includes(m[1])) found.add(m[1]);
  }
  return Array.from(found);
}
