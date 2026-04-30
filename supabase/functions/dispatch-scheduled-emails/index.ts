// dispatch-scheduled-emails
// Invoked by pg_cron every minute. Atomically claims any campaigns whose
// scheduled_for has passed (status: scheduled → sending) and runs the same
// send pipeline as send-marketing-email v11.
//
// Audit fixes 2026-04-30: P0-4 (per-batch send-row inserts), P0-5 (HTML-encode
// merge tags), P1-1 (AR auto-footer), P2-10 (AR locale regex).
//
// Auth: caller must present the project's SERVICE_ROLE_KEY as a bearer token.
// pg_cron + pg_net does this automatically when configured per the migration.
import "jsr:@supabase/functions-js/edge-runtime.d.ts";
import { createClient } from "jsr:@supabase/supabase-js@2";

const RESEND_API_KEY = Deno.env.get("RESEND_API_KEY");
const SUPABASE_URL = Deno.env.get("SUPABASE_URL")!;
const SUPABASE_SERVICE_ROLE_KEY = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;

const FROM_ADDRESS = "Versa Footy <launch@versafooty.com>";
const REPLY_TO = "hi@all4footy.com";
const APP_URL = Deno.env.get("APP_URL") ?? "https://versafooty.com";
const ONECLICK_URL = `${SUPABASE_URL}/functions/v1/unsubscribe-oneclick`;

const VALID_CATEGORIES = new Set(["product_updates", "training_tips", "promotions"]);
const MERGE_TAG_RE = /\{\{\s*([a-zA-Z_]+)(?:\s*\|\s*"([^"]*)")?\s*\}\}/g;
const AR_LOCALE_RE = /^ar(?:[-_]|$)/i;
const CLAIM_LIMIT = 20;

type Audience = "subscribers" | "opted_in_users" | "all_users" | "segment";
interface ScheduledParams {
  subject: string;
  html: string;
  audience: Audience;
  segmentId?: string | null;
  category?: string | null;
  subject_ar?: string | null;
  html_ar?: string | null;
}
interface Recipient {
  email: string;
  unsubscribe_token: string;
  recipient_type: "subscriber" | "user";
  preferences?: Record<string, boolean> | null;
  locale?: string | null;
  vars: Record<string, string>;
}

function json(body: unknown, status = 200): Response {
  return new Response(JSON.stringify(body), { status, headers: { "Content-Type": "application/json" } });
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

function htmlEncode(s: string): string {
  return s.replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;").replace(/"/g, "&quot;").replace(/'/g, "&#39;");
}

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

function profileToVars(p: { full_name?: string | null; current_level?: number | null; current_streak?: number | null }): Record<string, string> {
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

function filterForAudience(audience: Audience): Record<string, unknown> | null {
  if (audience === "opted_in_users") return { match: "all", rules: [{ field: "marketing_opt_in", op: "eq", value: true }] };
  if (audience === "all_users") return { match: "all", rules: [] };
  return null;
}

async function dispatchOne(
  supabase: ReturnType<typeof createClient>,
  campaignId: string,
  params: ScheduledParams,
): Promise<{ ok: boolean; successful: number; failed: number; total: number; error?: string }> {
  const { subject, html, audience, segmentId, category, subject_ar, html_ar } = params;
  const subjectArTpl = subject_ar ?? null;
  const htmlArTpl = html_ar ?? null;
  if (!subject || !html || !audience) {
    return { ok: false, successful: 0, failed: 0, total: 0, error: "missing scheduled_params" };
  }
  if (category && !VALID_CATEGORIES.has(category)) {
    return { ok: false, successful: 0, failed: 0, total: 0, error: `invalid category: ${category}` };
  }

  let recipients: Recipient[] = [];

  if (audience === "subscribers") {
    const { data, error } = await supabase.from("marketing_subscribers").select("email, unsubscribe_token, locale").is("unsubscribed_at", null);
    if (error) return { ok: false, successful: 0, failed: 0, total: 0, error: error.message };
    recipients = (data ?? []).map((r: any) => ({ email: r.email, unsubscribe_token: r.unsubscribe_token, recipient_type: "subscriber", locale: r.locale ?? null, vars: profileToVars({}) }));
  } else {
    let filterToUse: Record<string, unknown> | null = filterForAudience(audience);
    let resolvedSegmentId: string | null = null;
    if (audience === "segment") {
      if (!segmentId) return { ok: false, successful: 0, failed: 0, total: 0, error: "segmentId required" };
      const { data: seg, error: segErr } = await supabase.from("marketing_segments").select("id, filter, is_active").eq("id", segmentId).single();
      if (segErr || !seg) return { ok: false, successful: 0, failed: 0, total: 0, error: `segment not found: ${segmentId}` };
      if (seg.is_active === false) return { ok: false, successful: 0, failed: 0, total: 0, error: "segment is not active" };
      resolvedSegmentId = seg.id;
      filterToUse = seg.filter as Record<string, unknown>;
    }
    if (!filterToUse) return { ok: false, successful: 0, failed: 0, total: 0, error: `unknown audience: ${audience}` };

    const { data: rows, error: resErr } = await supabase.rpc("marketing_segment_recipients", { p_filter: filterToUse });
    if (resErr) return { ok: false, successful: 0, failed: 0, total: 0, error: resErr.message };
    recipients = (rows ?? []).map((r: any) => ({
      email: r.email,
      unsubscribe_token: r.marketing_unsubscribe_token,
      recipient_type: "user" as const,
      preferences: r.marketing_preferences as Record<string, boolean> | null,
      locale: r.locale ?? null,
      vars: profileToVars(r),
    }));
    if (category) {
      recipients = recipients.filter((r) => r.preferences == null || r.preferences[category] !== false);
    }
    if (resolvedSegmentId) {
      // Update audience label so RecentCampaignsPanel matches the immediate-send path.
      await supabase.from("marketing_campaigns").update({ audience: `segment:${resolvedSegmentId}` }).eq("id", campaignId);
    }
  }

  // Dedupe.
  const seen = new Set<string>();
  recipients = recipients.filter((r) => {
    const key = r.email?.trim().toLowerCase();
    if (!key || seen.has(key)) return false;
    seen.add(key);
    return true;
  });

  // Suppression filter.
  if (recipients.length > 0) {
    const emails = recipients.map((r) => r.email.toLowerCase());
    const { data: suppressions } = await supabase.from("marketing_suppressions").select("email").in("email", emails);
    const suppressedSet = new Set((suppressions ?? []).map((s: any) => s.email));
    if (suppressedSet.size > 0) recipients = recipients.filter((r) => !suppressedSet.has(r.email.toLowerCase()));
  }

  if (recipients.length === 0) {
    await supabase.from("marketing_campaigns").update({
      status: "failed", failed_sends: 0, successful_sends: 0, total_recipients: 0,
      completed_at: new Date().toISOString(),
    }).eq("id", campaignId);
    return { ok: false, successful: 0, failed: 0, total: 0, error: "no recipients after filters" };
  }

  await supabase.from("marketing_campaigns").update({ total_recipients: recipients.length }).eq("id", campaignId);

  const BATCH_SIZE = 100;
  let successful = 0, failed = 0;
  // P0-4: per-batch insert so resend-webhook can correlate events that arrive
  // before the entire campaign finishes sending.
  for (let i = 0; i < recipients.length; i += BATCH_SIZE) {
    const batch = recipients.slice(i, i + BATCH_SIZE);
    const results = await sendBatch(batch, subject, html, subjectArTpl, htmlArTpl);
    const batchRows: Array<Record<string, unknown>> = [];
    for (let j = 0; j < batch.length; j++) {
      const r = batch[j];
      const result = results[j];
      if (result.error) {
        failed++;
        batchRows.push({ campaign_id: campaignId, email: r.email, recipient_type: r.recipient_type, status: "failed", error_message: result.error });
      } else {
        successful++;
        batchRows.push({ campaign_id: campaignId, email: r.email, recipient_type: r.recipient_type, status: "sent", resend_email_id: result.id ?? null });
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
  }).eq("id", campaignId);

  return { ok: true, successful, failed, total: recipients.length };
}

Deno.serve(async (req: Request) => {
  if (req.method !== "POST") return json({ error: "Method not allowed" }, 405);
  if (!RESEND_API_KEY) return json({ error: "RESEND_API_KEY not configured" }, 500);

  // Require service-role bearer (pg_cron / pg_net injects this).
  const auth = req.headers.get("Authorization") ?? "";
  const token = auth.replace(/^Bearer\s+/i, "");
  if (!token || token !== SUPABASE_SERVICE_ROLE_KEY) {
    return json({ error: "Unauthorized" }, 401);
  }

  const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY);

  const { data: claimed, error: claimErr } = await supabase.rpc("marketing_claim_due_scheduled", { p_limit: CLAIM_LIMIT });
  if (claimErr) return json({ error: `claim failed: ${claimErr.message}` }, 500);

  const list = (claimed ?? []) as Array<{ id: string; scheduled_params: ScheduledParams }>;
  if (list.length === 0) return json({ ok: true, dispatched: 0 });

  const results: Array<Record<string, unknown>> = [];
  for (const row of list) {
    try {
      const r = await dispatchOne(supabase, row.id, row.scheduled_params);
      results.push({ id: row.id, ...r });
    } catch (e) {
      const msg = (e as Error)?.message ?? String(e);
      await supabase.from("marketing_campaigns").update({
        status: "failed", completed_at: new Date().toISOString(),
      }).eq("id", row.id);
      results.push({ id: row.id, ok: false, error: msg });
    }
  }
  return json({ ok: true, dispatched: list.length, results });
});
