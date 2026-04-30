// dispatch-automation-runs
// pg_cron every 15 min. Two phases:
//   1. enroll() — find newly-eligible users, insert pending run rows (idempotent via UNIQUE).
//      Backfill suppressed via marketing_automations.activated_at (P0-1).
//   2. claim_due() + send — atomically flip pending→sending, fire the email,
//      log to marketing_sends under the step's campaign, mark the run sent/failed.
//
// Audit fixes 2026-04-30: P0-5 (HTML-encode merge tags), P1-1 (AR auto-footer),
// P2-10 (AR locale regex).
//
// Auth: service-role bearer (same pattern as dispatch-scheduled-emails).
import "jsr:@supabase/functions-js/edge-runtime.d.ts";
import { createClient } from "jsr:@supabase/supabase-js@2";

const RESEND_API_KEY = Deno.env.get("RESEND_API_KEY");
const SUPABASE_URL = Deno.env.get("SUPABASE_URL")!;
const SUPABASE_SERVICE_ROLE_KEY = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;

const FROM_ADDRESS = "Versa Footy <launch@versafooty.com>";
const REPLY_TO = "hi@all4footy.com";
const APP_URL = Deno.env.get("APP_URL") ?? "https://versafooty.com";
const ONECLICK_URL = `${SUPABASE_URL}/functions/v1/unsubscribe-oneclick`;
const CLAIM_LIMIT = 50;
const MERGE_TAG_RE = /\{\{\s*([a-zA-Z_]+)(?:\s*\|\s*"([^"]*)")?\s*\}\}/g;
const AR_LOCALE_RE = /^ar(?:[-_]|$)/i;
const VALID_CATEGORIES = new Set(["product_updates", "training_tips", "promotions"]);

interface DueRun {
  run_id: string; automation_id: string; step_id: string; user_id: string;
  step_order: number; subject: string; html: string;
  subject_ar: string | null; html_ar: string | null;
  category: string | null; step_campaign_id: string | null;
  email: string | null; full_name: string | null;
  current_level: number | null; current_streak: number | null;
  locale: string | null;
  marketing_unsubscribe_token: string | null;
  marketing_preferences: Record<string, boolean> | null;
  marketing_unsubscribed_at: string | null;
}

function json(body: unknown, status = 200): Response {
  return new Response(JSON.stringify(body), { status, headers: { "Content-Type": "application/json" } });
}
function renderUnsubscribeUrl(token: string): string { return `${APP_URL}/preferences?token=${encodeURIComponent(token)}`; }
function renderOneclickUrl(token: string): string { return `${ONECLICK_URL}?token=${encodeURIComponent(token)}`; }

function htmlEncode(s: string): string {
  return s.replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;").replace(/"/g, "&quot;").replace(/'/g, "&#39;");
}

function applyMergeTags(template: string, vars: Record<string, string>, forHtml = false): string {
  if (!template) return template;
  const enc = forHtml ? htmlEncode : (s: string) => s;
  return template.replace(MERGE_TAG_RE, (m, name, fb) => {
    if (name === "unsubscribe_url") return m;
    const v = vars[name];
    if (v != null && v !== "") return enc(v);
    return fb != null ? enc(fb) : "";
  });
}
function profileToVars(p: { full_name?: string | null; current_level?: number | null; current_streak?: number | null }): Record<string, string> {
  const fullName = p.full_name ?? "";
  return {
    first_name: fullName ? fullName.split(/\s+/)[0] : "",
    full_name: fullName,
    current_level: p.current_level != null ? String(p.current_level) : "",
    streak_days: p.current_streak != null ? String(p.current_streak) : "",
  };
}
function prepareHtml(template: string, unsubUrl: string, isAr = false): string {
  if (template.includes("{{unsubscribe_url}}")) return template.replaceAll("{{unsubscribe_url}}", unsubUrl);
  if (isAr) {
    const footer = `<hr style="margin:32px 0;border:none;border-top:1px solid #e5e7eb"/><p dir="rtl" style="font-size:12px;color:#6b7280;text-align:center;font-family:Inter,Arial,sans-serif">تتلقى هذه الرسالة لأنك سجّلت في versafooty.com. <a href="${unsubUrl}" style="color:#6b7280;text-decoration:underline">إدارة التفضيلات</a>.</p>`;
    return template + footer;
  }
  const footer = `<hr style="margin:32px 0;border:none;border-top:1px solid #e5e7eb"/><p style="font-size:12px;color:#6b7280;text-align:center;font-family:Inter,Arial,sans-serif">You're receiving this because you signed up at versafooty.com. <a href="${unsubUrl}" style="color:#6b7280;text-decoration:underline">Manage preferences</a>.</p>`;
  return template + footer;
}
function htmlToText(html: string): string {
  return html.replace(/<style[\s\S]*?<\/style>/gi, "").replace(/<script[\s\S]*?<\/script>/gi, "")
    .replace(/<a\s+[^>]*href="([^"]+)"[^>]*>([\s\S]*?)<\/a>/gi, "$2 ($1)")
    .replace(/<\/(p|div|h[1-6]|li|tr|br)>/gi, "\n").replace(/<br\s*\/?>(\s*)/gi, "\n")
    .replace(/<[^>]+>/g, "").replace(/&nbsp;/g, " ").replace(/&amp;/g, "&")
    .replace(/&lt;/g, "<").replace(/&gt;/g, ">").replace(/&quot;/g, '"').replace(/&#39;/g, "'")
    .replace(/[ \t]+/g, " ").replace(/\n{3,}/g, "\n\n").trim();
}

async function sendOne(run: DueRun, suppressed: boolean): Promise<{ ok: boolean; id?: string; error?: string; skipped?: string }> {
  if (!run.email) return { ok: false, skipped: "no email" };
  if (run.marketing_unsubscribed_at) return { ok: false, skipped: "unsubscribed" };
  if (!run.marketing_unsubscribe_token) return { ok: false, skipped: "no unsubscribe token" };
  if (suppressed) return { ok: false, skipped: "suppressed" };
  if (run.category && VALID_CATEGORIES.has(run.category)) {
    const prefs = run.marketing_preferences;
    if (prefs && prefs[run.category] === false) return { ok: false, skipped: "category opted out" };
  }

  const useAr = !!(run.subject_ar && run.html_ar) && AR_LOCALE_RE.test(run.locale ?? "");
  const subjectTpl = useAr ? run.subject_ar! : run.subject;
  const htmlTpl = useAr ? run.html_ar! : run.html;
  const vars = profileToVars(run);
  const subject = applyMergeTags(subjectTpl, vars, false);
  const unsubUrl = renderUnsubscribeUrl(run.marketing_unsubscribe_token);
  const oneclickUrl = renderOneclickUrl(run.marketing_unsubscribe_token);
  const html = prepareHtml(applyMergeTags(htmlTpl, vars, true), unsubUrl, useAr);

  const res = await fetch("https://api.resend.com/emails", {
    method: "POST",
    headers: { Authorization: `Bearer ${RESEND_API_KEY}`, "Content-Type": "application/json" },
    body: JSON.stringify({
      from: FROM_ADDRESS, to: run.email, subject, html, text: htmlToText(html), reply_to: REPLY_TO,
      headers: { "List-Unsubscribe": `<${oneclickUrl}>, <${unsubUrl}>`, "List-Unsubscribe-Post": "List-Unsubscribe=One-Click" },
    }),
  });
  const text = await res.text();
  if (res.status < 200 || res.status >= 300) {
    return { ok: false, error: `Resend ${res.status}: ${text.slice(0, 300)}` };
  }
  let parsed: { id?: string } = {};
  try { parsed = JSON.parse(text); } catch { /* ignore */ }
  return { ok: true, id: parsed.id };
}

Deno.serve(async (req: Request) => {
  if (req.method !== "POST") return json({ error: "Method not allowed" }, 405);
  if (!RESEND_API_KEY) return json({ error: "RESEND_API_KEY not configured" }, 500);

  const auth = req.headers.get("Authorization") ?? "";
  const token = auth.replace(/^Bearer\s+/i, "");
  if (!token || token !== SUPABASE_SERVICE_ROLE_KEY) return json({ error: "Unauthorized" }, 401);

  const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY);

  // Phase 1: enroll new eligible users.
  const { data: enrolled, error: enrollErr } = await supabase.rpc("marketing_automation_enroll");
  if (enrollErr) return json({ error: `enroll failed: ${enrollErr.message}` }, 500);

  // Phase 2: claim due runs.
  const { data: dueRows, error: claimErr } = await supabase.rpc("marketing_automation_claim_due", { p_limit: CLAIM_LIMIT });
  if (claimErr) return json({ error: `claim failed: ${claimErr.message}` }, 500);
  const due = (dueRows ?? []) as DueRun[];
  if (due.length === 0) return json({ ok: true, enrolled: enrolled ?? 0, dispatched: 0 });

  // Suppression filter: lookup once.
  const emails = due.map((r) => (r.email ?? "").toLowerCase()).filter(Boolean);
  const { data: suppressionRows } = await supabase.from("marketing_suppressions").select("email").in("email", emails);
  const suppressedSet = new Set((suppressionRows ?? []).map((s: any) => s.email));

  let sent = 0, failed = 0, skipped = 0;
  // Cache step → campaign id so we don't ensure() repeatedly per tick.
  const stepCampaignCache = new Map<string, string>();

  for (const run of due) {
    let campaignId = run.step_campaign_id;
    if (!campaignId) {
      const cached = stepCampaignCache.get(run.step_id);
      if (cached) campaignId = cached;
      else {
        const { data: cid, error } = await supabase.rpc("marketing_automation_ensure_step_campaign", { p_step_id: run.step_id });
        if (error || !cid) {
          await supabase.from("marketing_automation_runs").update({
            status: "failed", error_message: `ensure_step_campaign: ${error?.message ?? "unknown"}`,
          }).eq("id", run.run_id);
          failed++;
          continue;
        }
        campaignId = cid as string;
        stepCampaignCache.set(run.step_id, campaignId);
      }
    }

    const result = await sendOne(run, suppressedSet.has((run.email ?? "").toLowerCase()));

    if (result.skipped) {
      await supabase.from("marketing_automation_runs").update({
        status: "skipped", error_message: result.skipped, sent_at: new Date().toISOString(),
      }).eq("id", run.run_id);
      skipped++;
    } else if (result.ok) {
      await supabase.from("marketing_automation_runs").update({
        status: "sent", sent_at: new Date().toISOString(), resend_email_id: result.id ?? null,
      }).eq("id", run.run_id);
      await supabase.from("marketing_sends").insert({
        campaign_id: campaignId, email: run.email, recipient_type: "user",
        status: "sent", resend_email_id: result.id ?? null,
      });
      sent++;
    } else {
      await supabase.from("marketing_automation_runs").update({
        status: "failed", error_message: result.error ?? "unknown",
      }).eq("id", run.run_id);
      await supabase.from("marketing_sends").insert({
        campaign_id: campaignId, email: run.email, recipient_type: "user",
        status: "failed", error_message: result.error ?? "unknown",
      });
      failed++;
    }
  }

  // Best-effort: bump aggregate counters on each step campaign we touched.
  for (const stepId of new Set(due.map((r) => r.step_id))) {
    const campaignId = stepCampaignCache.get(stepId)
      ?? due.find((r) => r.step_id === stepId)?.step_campaign_id;
    if (!campaignId) continue;
    const { data: counts } = await supabase.from("marketing_sends").select("status").eq("campaign_id", campaignId);
    const totals = (counts ?? []).reduce((acc: any, r: any) => {
      if (r.status === "sent") acc.s++; else if (r.status === "failed") acc.f++;
      return acc;
    }, { s: 0, f: 0 });
    await supabase.from("marketing_campaigns").update({
      total_recipients: totals.s + totals.f,
      successful_sends: totals.s, failed_sends: totals.f,
      status: totals.s > 0 ? "completed" : "failed",
      completed_at: new Date().toISOString(),
    }).eq("id", campaignId);
  }

  return json({ ok: true, enrolled: enrolled ?? 0, dispatched: due.length, sent, failed, skipped });
});
