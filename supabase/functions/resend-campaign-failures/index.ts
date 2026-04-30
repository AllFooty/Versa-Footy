// resend-campaign-failures
// Admin-gated. Takes a campaign id, atomically claims every marketing_sends
// row for that campaign with status='failed' (transitions them to 'resending'),
// looks up recipient profile/subscriber state, re-sends using the campaign's
// stored subject/html (+ AR variant if any), and appends new marketing_sends
// rows under the same campaign so analytics keep aggregating. Skips suppressed
// addresses and unsubscribed users.
//
// Audit fixes 2026-04-30: P0-3 (atomic claim via marketing_campaign_claim_failures),
// P0-5 (HTML-encode merge tags), P1-1 (AR auto-footer), P2-5 (CORS tightened),
// P2-10 (AR locale regex).
import "jsr:@supabase/functions-js/edge-runtime.d.ts";
import { createClient } from "jsr:@supabase/supabase-js@2";

const RESEND_API_KEY = Deno.env.get("RESEND_API_KEY");
const SUPABASE_URL = Deno.env.get("SUPABASE_URL")!;
const SUPABASE_SERVICE_ROLE_KEY = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;

const FROM_ADDRESS = "Versa Footy <launch@versafooty.com>";
const REPLY_TO = "hi@all4footy.com";
const APP_URL = Deno.env.get("APP_URL") ?? "https://versafooty.com";
const ONECLICK_URL = `${SUPABASE_URL}/functions/v1/unsubscribe-oneclick`;
const MERGE_TAG_RE = /\{\{\s*([a-zA-Z_]+)(?:\s*\|\s*"([^"]*)")?\s*\}\}/g;
const AR_LOCALE_RE = /^ar(?:[-_]|$)/i;

function corsHeaders(req: Request): Record<string, string> {
  const origin = req.headers.get("Origin") ?? "";
  const allowed = origin === APP_URL || /^https?:\/\/(localhost|127\.0\.0\.1)(:\d+)?$/.test(origin);
  return {
    "Access-Control-Allow-Origin": allowed ? origin : APP_URL,
    "Vary": "Origin",
    "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
    "Access-Control-Allow-Methods": "POST, OPTIONS",
  };
}
function json(body: unknown, status = 200, req?: Request): Response {
  const headers = req ? corsHeaders(req) : {};
  return new Response(JSON.stringify(body), { status, headers: { ...headers, "Content-Type": "application/json" } });
}

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
function profileToVars(p: { full_name?: string | null; current_level?: number | null; current_streak?: number | null }) {
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
  const { data: prof } = await supabase.from("profiles").select("is_admin").eq("id", userData.user.id).single();
  if (!prof?.is_admin) return json({ error: "Admin access required" }, 403, req);

  let body: { campaign_id?: string };
  try { body = await req.json(); } catch { return json({ error: "Invalid JSON" }, 400, req); }
  const campaignId = body.campaign_id;
  if (!campaignId) return json({ error: "campaign_id required" }, 400, req);

  const { data: campaign, error: cErr } = await supabase.from("marketing_campaigns")
    .select("subject, html, subject_ar, html_ar, category").eq("id", campaignId).single();
  if (cErr || !campaign) return json({ error: "Campaign not found" }, 404, req);

  // P0-3: atomic claim. Transitions status='failed' → 'resending' for every
  // matching row in one statement. Concurrent invocations see no rows because
  // the rows have already moved out of 'failed'. No double-fire to the same
  // address even if the admin double-clicks the button.
  const { data: claimedRows, error: fErr } = await supabase.rpc("marketing_campaign_claim_failures", { p_campaign_id: campaignId });
  if (fErr) return json({ error: fErr.message }, 500, req);
  const emails = Array.from(new Set(((claimedRows ?? []) as Array<{ email: string }>).map((r) => r.email.toLowerCase()))).filter(Boolean);
  if (emails.length === 0) return json({ ok: true, total: 0, sent: 0, failed: 0, skipped: 0 }, 200, req);

  // Suppression filter.
  const { data: supRows } = await supabase.from("marketing_suppressions").select("email").in("email", emails);
  const suppressed = new Set((supRows ?? []).map((s: any) => s.email));

  // Look up profile data for these emails (locale + merge fields + unsub token).
  const { data: profiles } = await supabase.from("profiles")
    .select("email, full_name, locale, marketing_unsubscribe_token, marketing_unsubscribed_at, marketing_preferences, player_profiles(current_level, current_streak)")
    .in("email", emails);
  const profByEmail = new Map<string, any>();
  for (const p of (profiles ?? []) as any[]) profByEmail.set((p.email ?? "").toLowerCase(), p);

  // Subscribers fallback for any email that isn't a profile.
  const missingForSubscribers = emails.filter((e) => !profByEmail.has(e));
  const subByEmail = new Map<string, any>();
  if (missingForSubscribers.length > 0) {
    const { data: subs } = await supabase.from("marketing_subscribers")
      .select("email, locale, unsubscribe_token, unsubscribed_at").in("email", missingForSubscribers);
    for (const s of (subs ?? []) as any[]) subByEmail.set((s.email ?? "").toLowerCase(), s);
  }

  let sent = 0, failed = 0, skipped = 0;
  const sendRows: Array<Record<string, unknown>> = [];

  for (const email of emails) {
    if (suppressed.has(email)) { skipped++; continue; }

    const p = profByEmail.get(email);
    const s = subByEmail.get(email);
    if (!p && !s) { skipped++; continue; }
    if (p?.marketing_unsubscribed_at) { skipped++; continue; }
    if (s?.unsubscribed_at) { skipped++; continue; }
    const token = p?.marketing_unsubscribe_token ?? s?.unsubscribe_token;
    if (!token) { skipped++; continue; }
    if (campaign.category && p?.marketing_preferences && p.marketing_preferences[campaign.category] === false) { skipped++; continue; }

    const locale = (p?.locale ?? s?.locale ?? "").toString();
    const useAr = !!(campaign.subject_ar && campaign.html_ar) && AR_LOCALE_RE.test(locale);
    const subjectTpl = useAr ? campaign.subject_ar! : campaign.subject;
    const htmlTpl = useAr ? campaign.html_ar! : campaign.html;
    const player = (p?.player_profiles && Array.isArray(p.player_profiles)) ? p.player_profiles[0] : p?.player_profiles;
    const vars = profileToVars({ full_name: p?.full_name, current_level: player?.current_level, current_streak: player?.current_streak });

    const unsubUrl = `${APP_URL}/preferences?token=${encodeURIComponent(token)}`;
    const oneclickUrl = `${ONECLICK_URL}?token=${encodeURIComponent(token)}`;
    const html = prepareHtml(applyMergeTags(htmlTpl, vars, true), unsubUrl, useAr);
    const subject = applyMergeTags(subjectTpl, vars, false);

    const res = await fetch("https://api.resend.com/emails", {
      method: "POST",
      headers: { Authorization: `Bearer ${RESEND_API_KEY}`, "Content-Type": "application/json" },
      body: JSON.stringify({
        from: FROM_ADDRESS, to: email, subject, html, text: htmlToText(html), reply_to: REPLY_TO,
        headers: { "List-Unsubscribe": `<${oneclickUrl}>, <${unsubUrl}>`, "List-Unsubscribe-Post": "List-Unsubscribe=One-Click" },
      }),
    });
    const text = await res.text();
    if (res.status >= 200 && res.status < 300) {
      let parsed: { id?: string } = {};
      try { parsed = JSON.parse(text); } catch { /* */ }
      sent++;
      sendRows.push({ campaign_id: campaignId, email, recipient_type: p ? "user" : "subscriber", status: "sent", resend_email_id: parsed.id ?? null });
    } else {
      failed++;
      sendRows.push({ campaign_id: campaignId, email, recipient_type: p ? "user" : "subscriber", status: "failed", error_message: `Resend ${res.status}: ${text.slice(0, 300)}` });
    }
  }

  if (sendRows.length > 0) await supabase.from("marketing_sends").insert(sendRows);

  // Recompute aggregate counters for this campaign. Counts everything in
  // 'sent', plus everything still in 'failed' or 'resending' (the latter being
  // claimed-but-not-yet-completed retries from a concurrent dispatcher; here we
  // also re-mark any still-in-'resending' rows as 'failed' since this caller
  // is the one that claimed them).
  await supabase.from("marketing_sends")
    .update({ status: "failed" })
    .eq("campaign_id", campaignId)
    .eq("status", "resending");
  const { data: allSends } = await supabase.from("marketing_sends").select("status").eq("campaign_id", campaignId);
  const totals = (allSends ?? []).reduce((acc: any, r: any) => {
    if (r.status === "sent") acc.s++; else if (r.status === "failed") acc.f++;
    return acc;
  }, { s: 0, f: 0 });
  await supabase.from("marketing_campaigns").update({
    successful_sends: totals.s, failed_sends: totals.f,
    total_recipients: totals.s + totals.f,
  }).eq("id", campaignId);

  return json({ ok: true, total: emails.length, sent, failed, skipped }, 200, req);
});
