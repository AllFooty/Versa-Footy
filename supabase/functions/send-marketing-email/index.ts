// send-marketing-email v11 — audit fixes 2026-04-30.
// Changes from v10:
//   P0-4: marketing_sends rows are inserted per-batch instead of bulk-at-end so
//         resend-webhook can correlate events that arrive during a long send.
//   P0-5: HTML-encodes merge values when substituting into HTML body to prevent
//         stored-XSS-style injection from a malicious profile.full_name etc.
//   P1-1: AR recipients with no inline {{unsubscribe_url}} now get an Arabic
//         RTL footer instead of the English one.
//   P2-5: CORS tightened from * to APP_URL (admin JWT remains the auth).
//   P2-10: AR locale matching uses ^ar(-|_|$) to avoid false positives.
import "jsr:@supabase/functions-js/edge-runtime.d.ts";
import { createClient } from "jsr:@supabase/supabase-js@2";

const RESEND_API_KEY = Deno.env.get("RESEND_API_KEY");
const SUPABASE_URL = Deno.env.get("SUPABASE_URL")!;
const SUPABASE_SERVICE_ROLE_KEY = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;

const FROM_ADDRESS = "Versa Footy <launch@versafooty.com>";
const REPLY_TO = "hi@all4footy.com";
const APP_URL = Deno.env.get("APP_URL") ?? "https://versafooty.com";
const ONECLICK_URL = `${SUPABASE_URL}/functions/v1/unsubscribe-oneclick`;

function corsHeaders(req: Request): Record<string, string> {
  const origin = req.headers.get("Origin") ?? "";
  // Allow APP_URL + localhost dev. Anything else gets no ACAO header — admin
  // JWT is the actual auth, this is defense-in-depth.
  const allowed = origin === APP_URL || /^https?:\/\/(localhost|127\.0\.0\.1)(:\d+)?$/.test(origin);
  return {
    "Access-Control-Allow-Origin": allowed ? origin : APP_URL,
    "Vary": "Origin",
    "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
    "Access-Control-Allow-Methods": "POST, OPTIONS",
  };
}

const VALID_CATEGORIES = new Set(["product_updates", "training_tips", "promotions"]);
const MERGE_TAG_RE = /\{\{\s*([a-zA-Z_]+)(?:\s*\|\s*"([^"]*)")?\s*\}\}/g;
const AR_LOCALE_RE = /^ar(?:[-_]|$)/i;
const DAILY_LIMIT = Number(Deno.env.get("MARKETING_DAILY_LIMIT") ?? "10");

type Audience = "test" | "subscribers" | "opted_in_users" | "all_users" | "segment";
type Category = "product_updates" | "training_tips" | "promotions";

interface RequestBody { subject: string; html: string; audience: Audience; testRecipient?: string; category?: Category; segmentId?: string; subject_ar?: string; html_ar?: string; }
interface Recipient {
  email: string; unsubscribe_token: string;
  recipient_type: "subscriber" | "user" | "test";
  preferences?: Record<string, boolean> | null;
  locale?: string | null;
  vars: Record<string, string>;
}

function json(body: unknown, status = 200, req?: Request): Response {
  const headers = req ? corsHeaders(req) : {};
  return new Response(JSON.stringify(body), { status, headers: { ...headers, "Content-Type": "application/json" } });
}
function renderUnsubscribeUrl(token: string): string { return `${APP_URL}/preferences?token=${encodeURIComponent(token)}`; }
function renderOneclickUrl(token: string): string { return `${ONECLICK_URL}?token=${encodeURIComponent(token)}`; }

function prepareHtml(template: string, unsubscribeUrl: string, isAr = false): string {
  if (template.includes("{{unsubscribe_url}}")) return template.replaceAll("{{unsubscribe_url}}", unsubscribeUrl);
  if (isAr) {
    const footer = `<hr style="margin:32px 0;border:none;border-top:1px solid #e5e7eb"/><p dir="rtl" style="font-size:12px;color:#6b7280;text-align:center;font-family:Inter,Arial,sans-serif">تتلقى هذه الرسالة لأنك سجّلت في versafooty.com. <a href="${unsubscribeUrl}" style="color:#6b7280;text-decoration:underline">إدارة التفضيلات</a>.</p>`;
    return template + footer;
  }
  const footer = `<hr style="margin:32px 0;border:none;border-top:1px solid #e5e7eb"/><p style="font-size:12px;color:#6b7280;text-align:center;font-family:Inter,Arial,sans-serif">You're receiving this because you signed up at versafooty.com. <a href="${unsubscribeUrl}" style="color:#6b7280;text-decoration:underline">Manage preferences</a>.</p>`;
  return template + footer;
}

// HTML-encode user-supplied values destined for an HTML context (body, attrs).
// Subjects are RFC 2822 headers and not rendered as HTML; do NOT encode there.
function htmlEncode(s: string): string {
  return s.replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;").replace(/"/g, "&quot;").replace(/'/g, "&#39;");
}

// Apply {{name}} / {{name|"fallback"}} substitutions. Leaves {{unsubscribe_url}} untouched.
// Pass `forHtml=true` to HTML-encode substituted values (P0-5).
function applyMergeTags(template: string, vars: Record<string, string>, forHtml = false): string {
  if (!template) return template;
  const enc = forHtml ? htmlEncode : (s: string) => s;
  return template.replace(MERGE_TAG_RE, (match, name, fallback) => {
    if (name === "unsubscribe_url") return match;
    const v = vars[name];
    if (v != null && v !== "") return enc(v);
    return fallback != null ? enc(fallback) : "";
  });
}

function profileToVars(p: { full_name?: string | null; current_level?: number | null; current_streak?: number | null; }): Record<string, string> {
  const fullName = p.full_name ?? "";
  const firstName = fullName ? fullName.split(/\s+/)[0] : "";
  return {
    first_name: firstName,
    full_name: fullName,
    current_level: p.current_level != null ? String(p.current_level) : "",
    streak_days: p.current_streak != null ? String(p.current_streak) : "",
  };
}

function htmlToText(html: string): string {
  return html.replace(/<style[\s\S]*?<\/style>/gi, "").replace(/<script[\s\S]*?<\/script>/gi, "")
    .replace(/<a\s+[^>]*href="([^"]+)"[^>]*>([\s\S]*?)<\/a>/gi, "$2 ($1)")
    .replace(/<\/(p|div|h[1-6]|li|tr|br)>/gi, "\n").replace(/<br\s*\/?>(\s*)/gi, "\n")
    .replace(/<[^>]+>/g, "").replace(/&nbsp;/g, " ").replace(/&amp;/g, "&")
    .replace(/&lt;/g, "<").replace(/&gt;/g, ">").replace(/&quot;/g, '"').replace(/&#39;/g, "'")
    .replace(/[ \t]+/g, " ").replace(/\n{3,}/g, "\n\n").trim();
}
function sleep(ms: number) { return new Promise((r) => setTimeout(r, ms)); }

type ItemResult = { id?: string; error?: string };

async function sendBatch(
  batch: Recipient[], subjectTpl: string, htmlTpl: string,
  subjectArTpl: string | null, htmlArTpl: string | null,
): Promise<ItemResult[]> {
  const hasAr = !!(subjectArTpl && htmlArTpl);
  const payload = batch.map((r) => {
    const useAr = hasAr && AR_LOCALE_RE.test(r.locale ?? "");
    const subjTpl = useAr ? subjectArTpl! : subjectTpl;
    const bodyTpl = useAr ? htmlArTpl! : htmlTpl;
    const unsubUrl = renderUnsubscribeUrl(r.unsubscribe_token);
    const oneclickUrl = renderOneclickUrl(r.unsubscribe_token);
    const personalizedSubject = applyMergeTags(subjTpl, r.vars, false);
    const personalizedHtmlPre = applyMergeTags(bodyTpl, r.vars, true);
    const html = prepareHtml(personalizedHtmlPre, unsubUrl, useAr);
    return {
      from: FROM_ADDRESS, to: r.email, subject: personalizedSubject, html,
      text: htmlToText(html), reply_to: REPLY_TO,
      headers: { "List-Unsubscribe": `<${oneclickUrl}>, <${unsubUrl}>`, "List-Unsubscribe-Post": "List-Unsubscribe=One-Click" },
    };
  });
  const callOnce = async () => {
    const res = await fetch("https://api.resend.com/emails/batch", {
      method: "POST",
      headers: { Authorization: `Bearer ${RESEND_API_KEY}`, "Content-Type": "application/json" },
      body: JSON.stringify(payload),
    });
    return { status: res.status, text: await res.text() };
  };
  let { status, text } = await callOnce();
  if (status === 429 || (status >= 500 && status < 600)) { await sleep(1000); ({ status, text } = await callOnce()); }
  if (status < 200 || status >= 300) {
    const msg = `Resend ${status}: ${text.slice(0, 500)}`;
    return batch.map(() => ({ error: msg }));
  }
  let parsed: { data?: Array<{ id?: string; error?: { message?: string } | string }> } = {};
  try { parsed = JSON.parse(text); } catch { /* ignore */ }
  const items = parsed.data ?? [];
  return batch.map((_, i) => {
    const item = items[i];
    if (!item) return { error: "No response from Resend for this recipient" };
    if (item.error) {
      const errMsg = typeof item.error === "string" ? item.error : (item.error.message ?? "Unknown error");
      return { error: errMsg };
    }
    return { id: item.id };
  });
}

// Synthetic filter for opted_in_users / all_users so they share the segment recipient path.
function filterForAudience(audience: Audience): Record<string, unknown> | null {
  if (audience === "opted_in_users") return { match: "all", rules: [{ field: "marketing_opt_in", op: "eq", value: true }] };
  if (audience === "all_users") return { match: "all", rules: [] };
  return null;
}

Deno.serve(async (req: Request) => {
  if (req.method === "OPTIONS") return new Response(null, { headers: corsHeaders(req) });
  if (req.method !== "POST") return json({ error: "Method not allowed" }, 405, req);
  if (!RESEND_API_KEY) return json({ error: "RESEND_API_KEY not configured" }, 500, req);

  const authHeader = req.headers.get("Authorization");
  if (!authHeader) return json({ error: "Missing Authorization" }, 401, req);

  const supabaseAuth = createClient(SUPABASE_URL, Deno.env.get("SUPABASE_ANON_KEY")!, { global: { headers: { Authorization: authHeader } } });
  const { data: userData, error: userErr } = await supabaseAuth.auth.getUser();
  if (userErr || !userData?.user) return json({ error: "Unauthorized" }, 401, req);

  const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY);
  const { data: profile } = await supabase.from("profiles").select("is_admin").eq("id", userData.user.id).single();
  if (!profile?.is_admin) return json({ error: "Admin access required" }, 403, req);

  let body: RequestBody;
  try { body = await req.json(); } catch { return json({ error: "Invalid JSON body" }, 400, req); }
  const { subject, html, audience, testRecipient, category, segmentId, subject_ar, html_ar } = body;
  if (!subject || !html || !audience) return json({ error: "subject, html, and audience are required" }, 400, req);
  if (audience === "test" && !testRecipient) return json({ error: "testRecipient required for audience=test" }, 400, req);
  if (audience === "segment" && !segmentId) return json({ error: "segmentId required for audience=segment" }, 400, req);
  if (category && !VALID_CATEGORIES.has(category)) return json({ error: `Invalid category: ${category}` }, 400, req);
  if ((subject_ar == null) !== (html_ar == null)) return json({ error: "subject_ar and html_ar must both be set or both be null" }, 400, req);
  const subjectArTpl = subject_ar ?? null;
  const htmlArTpl = html_ar ?? null;

  // Rate limit (per-admin, per UTC day; test sends bypass).
  if (audience !== "test") {
    const startOfDay = new Date(); startOfDay.setUTCHours(0, 0, 0, 0);
    const { data: dailyCount, error: rateErr } = await supabase.rpc("marketing_admin_daily_count", {
      p_user_id: userData.user.id, p_since: startOfDay.toISOString(),
    });
    if (rateErr) return json({ error: `Rate limit check failed: ${rateErr.message}` }, 500, req);
    if ((dailyCount ?? 0) >= DAILY_LIMIT) {
      return json({ error: `Daily campaign limit reached (${DAILY_LIMIT}). Try again tomorrow or contact an admin to raise the limit.` }, 429, req);
    }
  }

  let recipients: Recipient[] = [];
  let preferenceFilteredCount = 0;
  let resolvedSegmentId: string | null = null;

  // For test sends, infer locale from the body (?testLocale) so admin can preview AR variant.
  const testLocale = (body as any).testLocale as string | undefined;

  if (audience === "test") {
    recipients = [{ email: testRecipient!, unsubscribe_token: "test-" + crypto.randomUUID(), recipient_type: "test", locale: testLocale ?? null, vars: profileToVars({}) }];
  } else if (audience === "subscribers") {
    const { data, error } = await supabase.from("marketing_subscribers").select("email, unsubscribe_token, locale").is("unsubscribed_at", null);
    if (error) return json({ error: error.message }, 500, req);
    recipients = (data ?? []).map((r: any) => ({ email: r.email, unsubscribe_token: r.unsubscribe_token, recipient_type: "subscriber" as const, locale: r.locale ?? null, vars: profileToVars({}) }));
  } else {
    // opted_in_users / all_users / segment all flow through segment_recipients RPC.
    let filterToUse: Record<string, unknown> | null = filterForAudience(audience);
    if (audience === "segment") {
      const { data: seg, error: segErr } = await supabase.from("marketing_segments").select("id, filter, is_active").eq("id", segmentId!).single();
      if (segErr || !seg) return json({ error: `Segment not found: ${segmentId}` }, 404, req);
      if (seg.is_active === false) return json({ error: "Segment is not active" }, 400, req);
      resolvedSegmentId = seg.id;
      filterToUse = seg.filter as Record<string, unknown>;
    }
    if (!filterToUse) return json({ error: `Unknown audience: ${audience}` }, 400, req);

    const { data: rows, error: resErr } = await supabase.rpc("marketing_segment_recipients", { p_filter: filterToUse });
    if (resErr) return json({ error: resErr.message }, 500, req);
    recipients = (rows ?? []).map((r: any) => ({
      email: r.email,
      unsubscribe_token: r.marketing_unsubscribe_token,
      recipient_type: "user" as const,
      preferences: r.marketing_preferences as Record<string, boolean> | null,
      locale: r.locale ?? null,
      vars: profileToVars(r),
    }));
    if (category) {
      const before = recipients.length;
      recipients = recipients.filter((r) => r.preferences == null || r.preferences[category!] !== false);
      preferenceFilteredCount = before - recipients.length;
    }
  }

  // Dedupe by lowercased email — first occurrence wins.
  const seen = new Set<string>();
  recipients = recipients.filter((r) => {
    const key = r.email.trim().toLowerCase();
    if (!key || seen.has(key)) return false;
    seen.add(key);
    return true;
  });

  // Suppression filter (bounced / complained / manual). Test sends bypass.
  let suppressedCount = 0;
  if (audience !== "test" && recipients.length > 0) {
    const emails = recipients.map((r) => r.email.toLowerCase());
    const { data: suppressions } = await supabase.from("marketing_suppressions").select("email").in("email", emails);
    const suppressedSet = new Set((suppressions ?? []).map((s) => s.email));
    if (suppressedSet.size > 0) {
      const before = recipients.length;
      recipients = recipients.filter((r) => !suppressedSet.has(r.email.toLowerCase()));
      suppressedCount = before - recipients.length;
    }
  }

  if (recipients.length === 0) return json({ error: "No recipients in selected audience (after filters)" }, 400, req);

  const { data: campaign, error: campaignErr } = await supabase.from("marketing_campaigns").insert({
    subject, html, subject_ar: subjectArTpl, html_ar: htmlArTpl,
    audience: resolvedSegmentId ? `segment:${resolvedSegmentId}` : audience,
    category: category ?? null,
    test_recipient: audience === "test" ? testRecipient : null,
    sent_by: userData.user.id, total_recipients: recipients.length, status: "sending",
  }).select("id").single();
  if (campaignErr || !campaign) return json({ error: campaignErr?.message ?? "Could not create campaign" }, 500, req);

  const BATCH_SIZE = 100;
  let successful = 0, failed = 0;
  // P0-4: Insert marketing_sends rows per-batch instead of bulk-at-end so the
  // resend-webhook can correlate delivery/open/click events that arrive before
  // the entire campaign finishes sending.
  for (let i = 0; i < recipients.length; i += BATCH_SIZE) {
    const batch = recipients.slice(i, i + BATCH_SIZE);
    const results = await sendBatch(batch, subject, html, subjectArTpl, htmlArTpl);
    const batchRows: Array<Record<string, unknown>> = [];
    for (let j = 0; j < batch.length; j++) {
      const r = batch[j];
      const result = results[j];
      if (result.error) {
        failed++;
        batchRows.push({ campaign_id: campaign.id, email: r.email, recipient_type: r.recipient_type, status: "failed", error_message: result.error });
      } else {
        successful++;
        batchRows.push({ campaign_id: campaign.id, email: r.email, recipient_type: r.recipient_type, status: "sent", resend_email_id: result.id ?? null });
      }
    }
    if (batchRows.length > 0) {
      await supabase.from("marketing_sends").insert(batchRows);
    }
  }
  await supabase.from("marketing_campaigns").update({
    successful_sends: successful, failed_sends: failed,
    status: failed > 0 && successful === 0 ? "failed" : "completed",
    completed_at: new Date().toISOString(),
  }).eq("id", campaign.id);

  return json({
    ok: true, campaignId: campaign.id, totalRecipients: recipients.length,
    successful, failed, suppressed: suppressedCount, preference_filtered: preferenceFilteredCount,
  }, 200, req);
});
