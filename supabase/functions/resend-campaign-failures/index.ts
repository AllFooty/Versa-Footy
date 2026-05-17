// resend-campaign-failures
// Admin-only. Re-sends a campaign to recipients whose previous attempt failed.
// Payload (per CampaignDrilldownModal.tsx:116): { campaign_id: string }
// Response: { ok, sent, failed, skipped, error? }

import {
  corsPreflight,
  jsonResponse,
  requireAdmin,
  sendViaResend,
  serviceClient,
} from "../_shared/supabase.ts";

const RESEND_API_KEY = Deno.env.get("RESEND_API_KEY") ?? "";
const RESEND_FROM = Deno.env.get("RESEND_FROM") ?? "Versa Footy <hello@versafooty.com>";
const RESEND_REPLY_TO = Deno.env.get("RESEND_REPLY_TO") ?? undefined;
const APP_URL = Deno.env.get("APP_URL") ?? "https://versafooty.com";

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") return corsPreflight();
  if (req.method !== "POST") return jsonResponse({ ok: false, error: "method_not_allowed" }, 405);

  try {
    await requireAdmin(req);
  } catch (resp) {
    if (resp instanceof Response) return resp;
    return jsonResponse({ ok: false, error: "auth_failed" }, 401);
  }

  if (!RESEND_API_KEY) {
    return jsonResponse({ ok: false, error: "resend_not_configured" }, 500);
  }

  let payload: { campaign_id?: string };
  try {
    payload = await req.json();
  } catch {
    return jsonResponse({ ok: false, error: "invalid_json" }, 400);
  }
  const campaignId = payload.campaign_id;
  if (!campaignId) return jsonResponse({ ok: false, error: "missing_campaign_id" }, 400);

  const sc = serviceClient();

  const { data: campaign, error: cErr } = await sc
    .from("marketing_campaigns")
    .select("id, subject, html, subject_ar, html_ar")
    .eq("id", campaignId)
    .maybeSingle();
  if (cErr || !campaign) {
    return jsonResponse({ ok: false, error: cErr?.message ?? "campaign_not_found" }, 404);
  }

  const { data: failures, error: fErr } = await sc
    .from("marketing_campaign_recipients")
    .select("id, email")
    .eq("campaign_id", campaignId)
    .eq("status", "failed");
  if (fErr) return jsonResponse({ ok: false, error: fErr.message }, 500);
  if (!failures || failures.length === 0) {
    return jsonResponse({ ok: true, sent: 0, failed: 0, skipped: 0 });
  }

  // Honor suppressions added since the original send.
  const { data: suppressions } = await sc
    .from("marketing_suppressions")
    .select("email");
  const blocked = new Set((suppressions ?? []).map((r: { email: string }) => r.email.toLowerCase()));

  let sent = 0;
  let failed = 0;
  let skipped = 0;

  for (const row of failures as Array<{ id: string; email: string }>) {
    if (blocked.has(row.email.toLowerCase())) {
      skipped++;
      await sc
        .from("marketing_campaign_recipients")
        .update({ status: "skipped", error_message: "suppressed" })
        .eq("id", row.id);
      continue;
    }

    try {
      const html = (campaign.html ?? "").replaceAll(
        "{{unsubscribe_url}}",
        `${APP_URL}/en/unsubscribe?token=${encodeURIComponent(row.email)}`,
      );
      const out = await sendViaResend({
        apiKey: RESEND_API_KEY,
        from: RESEND_FROM,
        to: row.email,
        subject: campaign.subject,
        html,
        replyTo: RESEND_REPLY_TO,
      });
      sent++;
      await sc
        .from("marketing_campaign_recipients")
        .update({
          status: "sent",
          sent_at: new Date().toISOString(),
          error_message: null,
          provider_message_id: out.id,
        })
        .eq("id", row.id);
    } catch (e) {
      failed++;
      await sc
        .from("marketing_campaign_recipients")
        .update({
          status: "failed",
          error_message: e instanceof Error ? e.message : String(e),
        })
        .eq("id", row.id);
    }
  }

  // Refresh aggregate counters.
  const { data: agg } = await sc
    .from("marketing_campaign_recipients")
    .select("status")
    .eq("campaign_id", campaignId);
  if (agg) {
    const successful = agg.filter((r: { status: string }) => r.status === "sent").length;
    const total_failures = agg.filter((r: { status: string }) => r.status === "failed").length;
    await sc
      .from("marketing_campaigns")
      .update({ successful_sends: successful, total_failures })
      .eq("id", campaignId);
  }

  return jsonResponse({ ok: true, sent, failed, skipped });
});
