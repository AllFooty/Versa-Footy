// resend-webhook
// Public endpoint for Resend webhooks (Svix-signed). Updates marketing_sends with
// delivery / engagement events and auto-suppresses bounced or complained addresses.
//
// Deploy with verify_jwt: false (Svix signature is the authenticator):
//   supabase functions deploy resend-webhook --no-verify-jwt --project-ref knbksbvzzliuxwvyjzoj
//
// Required secrets (set in Supabase dashboard → Edge Functions → resend-webhook):
//   RESEND_WEBHOOK_SECRET   The full `whsec_...` secret from Resend's webhook page.
//
// Configure in Resend dashboard:
//   Webhook URL: https://knbksbvzzliuxwvyjzoj.supabase.co/functions/v1/resend-webhook
//   Events: email.sent, email.delivered, email.opened, email.clicked,
//           email.bounced, email.complained, email.delivery_delayed
import "jsr:@supabase/functions-js/edge-runtime.d.ts";
import { createClient } from "jsr:@supabase/supabase-js@2";

const SUPABASE_URL = Deno.env.get("SUPABASE_URL")!;
const SUPABASE_SERVICE_ROLE_KEY = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
const WEBHOOK_SECRET = Deno.env.get("RESEND_WEBHOOK_SECRET");

// Svix signature scheme (Resend, others use it):
//   sig_input = `${svix-id}.${svix-timestamp}.${rawBody}`
//   expected  = base64( HMAC-SHA256( decoded_secret, sig_input ) )
//   header svix-signature contains one or more `v1,base64sig` entries (space-separated)
async function verifySvixSignature(
  rawBody: string,
  headers: Headers,
  secret: string,
): Promise<boolean> {
  const id = headers.get("svix-id");
  const timestamp = headers.get("svix-timestamp");
  const sigHeader = headers.get("svix-signature");
  if (!id || !timestamp || !sigHeader) return false;

  // Reject events older than 5 minutes (replay protection).
  const ts = parseInt(timestamp, 10);
  if (!Number.isFinite(ts) || Math.abs(Date.now() / 1000 - ts) > 300) return false;

  const secretBytes = secret.startsWith("whsec_")
    ? Uint8Array.from(atob(secret.slice(6)), (c) => c.charCodeAt(0))
    : new TextEncoder().encode(secret);

  const key = await crypto.subtle.importKey(
    "raw",
    secretBytes,
    { name: "HMAC", hash: "SHA-256" },
    false,
    ["sign"],
  );
  const toSign = new TextEncoder().encode(`${id}.${timestamp}.${rawBody}`);
  const sigBuf = await crypto.subtle.sign("HMAC", key, toSign);
  const expected = btoa(String.fromCharCode(...new Uint8Array(sigBuf)));

  // Header may contain multiple sigs; any match is OK.
  for (const part of sigHeader.split(" ")) {
    const [version, value] = part.split(",");
    if (version === "v1" && timingSafeEqual(value, expected)) return true;
  }
  return false;
}

function timingSafeEqual(a: string, b: string): boolean {
  if (a.length !== b.length) return false;
  let diff = 0;
  for (let i = 0; i < a.length; i++) diff |= a.charCodeAt(i) ^ b.charCodeAt(i);
  return diff === 0;
}

interface ResendEvent {
  type: string;
  created_at?: string;
  data: {
    email_id?: string;
    to?: string | string[];
    from?: string;
    subject?: string;
    [k: string]: unknown;
  };
}

Deno.serve(async (req: Request) => {
  if (req.method !== "POST") {
    return new Response("Method not allowed", { status: 405 });
  }
  if (!WEBHOOK_SECRET) {
    console.error("RESEND_WEBHOOK_SECRET not configured");
    return new Response("Server misconfigured", { status: 500 });
  }

  const rawBody = await req.text();
  const ok = await verifySvixSignature(rawBody, req.headers, WEBHOOK_SECRET);
  if (!ok) {
    return new Response("Invalid signature", { status: 401 });
  }

  let event: ResendEvent;
  try {
    event = JSON.parse(rawBody);
  } catch {
    return new Response("Invalid JSON", { status: 400 });
  }

  const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY);
  const emailId = event.data?.email_id;
  const eventTime = event.created_at ?? new Date().toISOString();
  const recipientRaw = Array.isArray(event.data?.to) ? event.data!.to![0] : event.data?.to;
  const recipient = typeof recipientRaw === "string" ? recipientRaw.toLowerCase() : null;

  // Find the matching send row by Resend's email id. If we can't find it,
  // ack 200 anyway so Resend doesn't retry forever (likely a test event).
  let sendId: string | null = null;
  let campaignId: string | null = null;
  if (emailId) {
    const { data } = await supabase
      .from("marketing_sends")
      .select("id, campaign_id")
      .eq("resend_email_id", emailId)
      .maybeSingle();
    if (data) {
      sendId = data.id;
      campaignId = data.campaign_id;
    }
  }

  switch (event.type) {
    case "email.sent":
      // We already mark sent at dispatch; nothing to do.
      break;

    case "email.delivered":
      if (sendId) {
        await supabase
          .from("marketing_sends")
          .update({ delivery_status: "delivered", delivered_at: eventTime })
          .eq("id", sendId);
      }
      break;

    case "email.opened":
      if (sendId) {
        // Increment open_count atomically via SQL; set first-open and last-open timestamps.
        await supabase.rpc("marketing_sends_record_open", {
          p_send_id: sendId,
          p_at: eventTime,
        }).catch(async () => {
          // Fallback if the helper RPC isn't installed: best-effort update.
          await supabase
            .from("marketing_sends")
            .update({
              opened_at: eventTime,
              last_opened_at: eventTime,
              open_count: 1,
            })
            .eq("id", sendId);
        });
      }
      break;

    case "email.clicked":
      if (sendId) {
        await supabase.rpc("marketing_sends_record_click", {
          p_send_id: sendId,
          p_at: eventTime,
        }).catch(async () => {
          await supabase
            .from("marketing_sends")
            .update({
              clicked_at: eventTime,
              last_clicked_at: eventTime,
              click_count: 1,
            })
            .eq("id", sendId);
        });
      }
      break;

    case "email.bounced":
      if (sendId) {
        await supabase
          .from("marketing_sends")
          .update({ delivery_status: "bounced", bounced_at: eventTime })
          .eq("id", sendId);
      }
      if (recipient) await suppress(supabase, recipient, "bounced", campaignId);
      break;

    case "email.complained":
      if (sendId) {
        await supabase
          .from("marketing_sends")
          .update({ delivery_status: "complained", complained_at: eventTime })
          .eq("id", sendId);
      }
      if (recipient) await suppress(supabase, recipient, "complained", campaignId);
      break;

    case "email.delivery_delayed":
      if (sendId) {
        await supabase
          .from("marketing_sends")
          .update({ delivery_status: "delayed", delayed_at: eventTime })
          .eq("id", sendId);
      }
      break;

    default:
      // Unknown event types: log and ack.
      console.log("Unknown event:", event.type);
  }

  return new Response(JSON.stringify({ ok: true }), {
    status: 200,
    headers: { "Content-Type": "application/json" },
  });
});

async function suppress(
  supabase: ReturnType<typeof createClient>,
  email: string,
  reason: "bounced" | "complained",
  campaignId: string | null,
) {
  await supabase
    .from("marketing_suppressions")
    .upsert(
      { email, reason, campaign_id: campaignId },
      { onConflict: "email", ignoreDuplicates: false },
    );

  // P1-6: lookup is case-insensitive. profiles.email may not be lowercased
  // even though webhook events are; using LOWER(email) on both sides via the
  // RPC sidesteps the issue without depending on a DB-level invariant.
  await supabase.rpc("marketing_suppress_user_by_email", { p_email: email });
}
