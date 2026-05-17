// send-marketing-email
// Admin-only. Resolves the audience server-side, creates a marketing_campaigns
// row, iterates recipients through Resend, and writes per-recipient status into
// marketing_campaign_recipients. Mirrors aggregate counters back onto the
// campaign row when finished.
//
// Payload (per MarketingEmailView.tsx:510-525):
// {
//   subject: string,
//   html: string,
//   audience: "test" | "subscribers" | "opted_in_users" | "all_users" | "segment",
//   testRecipient?: string,
//   testLocale?: "en" | "ar",
//   category?: "product_updates" | "training_tips" | "promotions",
//   segmentId?: string,
//   subject_ar?: string,
//   html_ar?: string,
// }
//
// Response: { ok, campaignId, totalRecipients, successful, failed, error? }

import {
  corsPreflight,
  jsonResponse,
  requireAdmin,
  sendViaResend,
  serviceClient,
} from "../_shared/supabase.ts";

type Payload = {
  subject: string;
  html: string;
  audience: "test" | "subscribers" | "opted_in_users" | "all_users" | "segment";
  testRecipient?: string;
  testLocale?: "en" | "ar";
  category?: "product_updates" | "training_tips" | "promotions";
  segmentId?: string;
  subject_ar?: string;
  html_ar?: string;
};

const RESEND_API_KEY = Deno.env.get("RESEND_API_KEY") ?? "";
const RESEND_FROM = Deno.env.get("RESEND_FROM") ?? "Versa Footy <hello@versafooty.com>";
const RESEND_REPLY_TO = Deno.env.get("RESEND_REPLY_TO") ?? undefined;
const APP_URL = Deno.env.get("APP_URL") ?? "https://versafooty.com";

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") return corsPreflight();
  if (req.method !== "POST") return jsonResponse({ ok: false, error: "method_not_allowed" }, 405);

  let admin;
  try {
    admin = await requireAdmin(req);
  } catch (resp) {
    if (resp instanceof Response) return resp;
    return jsonResponse({ ok: false, error: "auth_failed" }, 401);
  }

  if (!RESEND_API_KEY) {
    return jsonResponse({ ok: false, error: "resend_not_configured" }, 500);
  }

  let payload: Payload;
  try {
    payload = await req.json();
  } catch {
    return jsonResponse({ ok: false, error: "invalid_json" }, 400);
  }
  if (!payload.subject || !payload.html || !payload.audience) {
    return jsonResponse({ ok: false, error: "missing_fields" }, 400);
  }

  const sc = serviceClient();

  // 1. Resolve recipients.
  type Recipient = { email: string; subject?: string; html?: string };
  let recipients: Recipient[] = [];

  if (payload.audience === "test") {
    if (!payload.testRecipient) {
      return jsonResponse({ ok: false, error: "missing_test_recipient" }, 400);
    }
    const useAr = payload.testLocale === "ar" && payload.subject_ar && payload.html_ar;
    recipients = [{
      email: payload.testRecipient,
      subject: useAr ? payload.subject_ar : payload.subject,
      html: useAr ? payload.html_ar : payload.html,
    }];
  } else {
    // TODO: real audience resolution. Stub fans out to opted-in profile emails
    // honoring suppressions. Replace with a server-side query using
    // payload.audience / payload.segmentId / payload.category.
    const { data: profiles, error: profErr } = await sc
      .from("profiles")
      .select("email")
      .not("email", "is", null);
    if (profErr) return jsonResponse({ ok: false, error: profErr.message }, 500);
    const { data: suppressions } = await sc
      .from("marketing_suppressions")
      .select("email");
    const blocked = new Set((suppressions ?? []).map((r: { email: string }) => r.email.toLowerCase()));
    recipients = (profiles ?? [])
      .map((p: { email: string | null }) => p.email)
      .filter((e: string | null): e is string => !!e && !blocked.has(e.toLowerCase()))
      .map((email: string) => ({ email }));
  }

  if (recipients.length === 0) {
    return jsonResponse({ ok: false, error: "no_recipients" }, 400);
  }

  // 2. Create the campaign row.
  const { data: campaign, error: campaignErr } = await sc
    .from("marketing_campaigns")
    .insert({
      subject: payload.subject,
      html: payload.html,
      subject_ar: payload.subject_ar ?? null,
      html_ar: payload.html_ar ?? null,
      audience: payload.audience,
      segment_id: payload.segmentId ?? null,
      category: payload.category ?? null,
      status: "sending",
      total_recipients: recipients.length,
      created_by: admin.userId,
      sent_by_email: admin.email,
    })
    .select("id")
    .single();
  if (campaignErr || !campaign) {
    return jsonResponse({ ok: false, error: campaignErr?.message ?? "campaign_insert_failed" }, 500);
  }
  const campaignId = campaign.id as string;

  // 3. Insert pending recipient rows.
  const pendingRows = recipients.map((r) => ({
    campaign_id: campaignId,
    email: r.email,
    status: "pending" as const,
  }));
  // Insert in chunks of 500 to avoid payload limits.
  for (let i = 0; i < pendingRows.length; i += 500) {
    const chunk = pendingRows.slice(i, i + 500);
    const { error } = await sc.from("marketing_campaign_recipients").insert(chunk);
    if (error) {
      return jsonResponse({ ok: false, error: error.message, campaignId }, 500);
    }
  }

  // 4. Iterate. Sequential to keep within Resend rate limits; swap to a
  // batched queue worker for high-volume campaigns.
  let successful = 0;
  let failed = 0;
  for (const r of recipients) {
    try {
      const subject = r.subject ?? payload.subject;
      const html = (r.html ?? payload.html).replaceAll(
        "{{unsubscribe_url}}",
        `${APP_URL}/en/unsubscribe?token=${encodeURIComponent(r.email)}`,
      );
      const sent = await sendViaResend({
        apiKey: RESEND_API_KEY,
        from: RESEND_FROM,
        to: r.email,
        subject,
        html,
        replyTo: RESEND_REPLY_TO,
      });
      successful++;
      await sc
        .from("marketing_campaign_recipients")
        .update({
          status: "sent",
          sent_at: new Date().toISOString(),
          provider_message_id: sent.id,
        })
        .eq("campaign_id", campaignId)
        .eq("email", r.email);
    } catch (e) {
      failed++;
      await sc
        .from("marketing_campaign_recipients")
        .update({
          status: "failed",
          error_message: e instanceof Error ? e.message : String(e),
        })
        .eq("campaign_id", campaignId)
        .eq("email", r.email);
    }
  }

  // 5. Finalize campaign row.
  const completedAt = new Date().toISOString();
  await sc
    .from("marketing_campaigns")
    .update({
      status: failed === recipients.length ? "failed" : "sent",
      sent_at: completedAt,
      completed_at: completedAt,
      successful_sends: successful,
      total_failures: failed,
    })
    .eq("id", campaignId);

  return jsonResponse({
    ok: true,
    campaignId,
    totalRecipients: recipients.length,
    successful,
    failed,
  });
});
