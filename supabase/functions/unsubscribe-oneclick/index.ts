// unsubscribe-oneclick
// Public endpoint for RFC 8058 List-Unsubscribe-Post (one-click unsubscribe).
// - POST /unsubscribe-oneclick?token=...  → unsubscribe and return 200
// - GET  /unsubscribe-oneclick?token=...  → 302 redirect to the user-facing /unsubscribe page
// - No JWT required. Token is the only authenticator (128-bit random per recipient).
//
// Deploy with verify_jwt=false:
//   supabase functions deploy unsubscribe-oneclick --no-verify-jwt
import "jsr:@supabase/functions-js/edge-runtime.d.ts";
import { createClient } from "jsr:@supabase/supabase-js@2";

const SUPABASE_URL = Deno.env.get("SUPABASE_URL")!;
const SUPABASE_SERVICE_ROLE_KEY = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
const APP_URL = Deno.env.get("APP_URL") ?? "https://versafooty.com";

const CORS_HEADERS = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "content-type",
  "Access-Control-Allow-Methods": "GET, POST, OPTIONS",
};

Deno.serve(async (req: Request) => {
  if (req.method === "OPTIONS") return new Response(null, { headers: CORS_HEADERS });

  const url = new URL(req.url);
  let token = url.searchParams.get("token");

  // RFC 8058 one-click POSTs `List-Unsubscribe=One-Click` as form body. Token is in the URL.
  // Some clients may put the token in the body — accept both.
  if (!token && req.method === "POST") {
    try {
      const ct = req.headers.get("content-type") ?? "";
      if (ct.includes("application/x-www-form-urlencoded")) {
        const form = new URLSearchParams(await req.text());
        token = form.get("token");
      } else if (ct.includes("application/json")) {
        const body = await req.json();
        token = body?.token ?? null;
      }
    } catch { /* ignore */ }
  }

  if (!token) {
    return new Response("Missing token", { status: 400, headers: CORS_HEADERS });
  }

  // GET: redirect to user-facing page (token is preserved so the React page processes it).
  if (req.method === "GET") {
    return new Response(null, {
      status: 302,
      headers: {
        ...CORS_HEADERS,
        Location: `${APP_URL}/unsubscribe?token=${encodeURIComponent(token)}`,
      },
    });
  }

  if (req.method !== "POST") {
    return new Response("Method not allowed", { status: 405, headers: CORS_HEADERS });
  }

  const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY);
  const { data, error } = await supabase.rpc("unsubscribe_by_token", { p_token: token });

  if (error) {
    return new Response(JSON.stringify({ ok: false, error: error.message }), {
      status: 500,
      headers: { ...CORS_HEADERS, "Content-Type": "application/json" },
    });
  }

  return new Response(JSON.stringify(data ?? { ok: true }), {
    status: 200,
    headers: { ...CORS_HEADERS, "Content-Type": "application/json" },
  });
});
