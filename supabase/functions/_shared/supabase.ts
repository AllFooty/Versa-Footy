// Shared helpers for marketing Edge Functions.
//
// Two clients:
//   - `userClient`: forwards the caller's JWT. Use for auth checks (RLS applies).
//   - `serviceClient`: uses the service-role key. Use for cross-table writes
//     that bypass RLS (e.g. inserting recipient rows for any campaign).

import { createClient, SupabaseClient } from "https://esm.sh/@supabase/supabase-js@2.45.4";

const SUPABASE_URL = Deno.env.get("SUPABASE_URL")!;
const SERVICE_ROLE_KEY = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
const ANON_KEY = Deno.env.get("SUPABASE_ANON_KEY")!;

export function serviceClient(): SupabaseClient {
  return createClient(SUPABASE_URL, SERVICE_ROLE_KEY, {
    auth: { persistSession: false, autoRefreshToken: false },
  });
}

export function userClient(authHeader: string | null): SupabaseClient {
  return createClient(SUPABASE_URL, ANON_KEY, {
    global: { headers: authHeader ? { Authorization: authHeader } : {} },
    auth: { persistSession: false, autoRefreshToken: false },
  });
}

export type AdminContext = { userId: string; email: string | null };

/**
 * Validates that the caller is an authenticated admin.
 * Throws Response on failure so the handler can `return` it directly.
 */
export async function requireAdmin(req: Request): Promise<AdminContext> {
  const auth = req.headers.get("Authorization");
  if (!auth?.startsWith("Bearer ")) {
    throw jsonResponse({ ok: false, error: "missing_authorization" }, 401);
  }
  const uc = userClient(auth);
  const { data: userData, error: userErr } = await uc.auth.getUser();
  if (userErr || !userData.user) {
    throw jsonResponse({ ok: false, error: "invalid_token" }, 401);
  }
  const sc = serviceClient();
  const { data: profile, error: profErr } = await sc
    .from("profiles")
    .select("is_admin, email")
    .eq("id", userData.user.id)
    .maybeSingle();
  if (profErr || !profile?.is_admin) {
    throw jsonResponse({ ok: false, error: "forbidden" }, 403);
  }
  return { userId: userData.user.id, email: profile.email ?? userData.user.email ?? null };
}

export function jsonResponse(body: unknown, status = 200): Response {
  return new Response(JSON.stringify(body), {
    status,
    headers: {
      "content-type": "application/json",
      "access-control-allow-origin": "*",
      "access-control-allow-headers": "authorization, content-type",
      "access-control-allow-methods": "POST, OPTIONS",
    },
  });
}

export function corsPreflight(): Response {
  return new Response(null, {
    status: 204,
    headers: {
      "access-control-allow-origin": "*",
      "access-control-allow-headers": "authorization, content-type",
      "access-control-allow-methods": "POST, OPTIONS",
    },
  });
}

// Minimal Resend API wrapper. Returns provider id on success, throws on error.
export async function sendViaResend(opts: {
  apiKey: string;
  from: string;
  to: string;
  subject: string;
  html: string;
  replyTo?: string;
}): Promise<{ id: string }> {
  const res = await fetch("https://api.resend.com/emails", {
    method: "POST",
    headers: {
      Authorization: `Bearer ${opts.apiKey}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      from: opts.from,
      to: opts.to,
      subject: opts.subject,
      html: opts.html,
      reply_to: opts.replyTo,
    }),
  });
  if (!res.ok) {
    const text = await res.text();
    throw new Error(`resend ${res.status}: ${text}`);
  }
  return (await res.json()) as { id: string };
}
