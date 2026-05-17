// Cloudflare Pages middleware: reverse-proxy old Vite SPA paths to APP_ORIGIN.
// Runs before static-file serving. SPA paths go to app-origin; everything else
// falls through to Next.js static export.

const SPA_PREFIXES = [
  "/assets",
  "/Favicons",
  "/attached_assets",
];

// Native Next routes that the old SPA also served at the un-prefixed URL
// (the old SPA had no /<lang>/ segment). Visitors arriving from old links
// or muscle-memory at e.g. /login get bounced to the default locale.
const BARE_NATIVE_PATHS = [
  "/login",
  "/home",
  "/settings",
  "/preferences",
  "/unsubscribe",
  "/terms-of-service",
  "/privacy-policy",
  "/org/create",
  "/academy",
  "/academy/invitations",
  "/academy/teams",
  "/academy/settings",
  "/academy/players",
  "/academy/players/detail",
  "/library",
  "/videos-audit",
  "/marketing",
  "/marketing/segments",
  "/marketing/automations",
  "/join",
];

const SUPPORTED_LOCALES = ["en", "ar"] as const;
type Locale = (typeof SUPPORTED_LOCALES)[number];
const DEFAULT_LOCALE: Locale = "ar";

// Inline types — avoids depending on @cloudflare/workers-types in package.json.
type EventContext = {
  request: Request;
  env: { APP_ORIGIN?: string };
  next: () => Promise<Response>;
};

// Pick the best locale for a bare (un-prefixed) request:
//   1. NEXT_LOCALE cookie if set to a supported value
//   2. Accept-Language header (en* → "en", otherwise "ar")
//   3. DEFAULT_LOCALE
function pickLocale(request: Request): Locale {
  const cookieHeader = request.headers.get("cookie") ?? "";
  for (const part of cookieHeader.split(";")) {
    const [rawName, ...rest] = part.split("=");
    if (rawName?.trim() === "NEXT_LOCALE") {
      const value = rest.join("=").trim();
      if ((SUPPORTED_LOCALES as readonly string[]).includes(value)) {
        return value as Locale;
      }
    }
  }
  const accept = request.headers.get("accept-language") ?? "";
  const primary = accept.split(",")[0]?.trim().toLowerCase() ?? "";
  if (primary.startsWith("en")) return "en";
  if (primary.startsWith("ar")) return "ar";
  return DEFAULT_LOCALE;
}

// /<lang>/join/<CODE> still ships in shared invite links. The Next.js app
// uses /<lang>/join?code=<CODE> instead (static export can't take an arbitrary
// dynamic [code] segment), so rewrite the legacy path here.
// Matches /<lang>/join/<CODE> and the legacy un-prefixed /join/<CODE>
// (old SPA didn't have locale segments). Default to /ar when missing.
const JOIN_LEGACY_RE = /^(?:\/([a-z]{2}))?\/join\/([A-Za-z0-9]+)\/?$/;

// /<lang>/academy/players/<UUID> and the legacy un-prefixed
// /academy/players/<UUID> → /<lang>/academy/players/detail?id=<UUID>
// (same static-export trade-off as /join: arbitrary IDs can't be
// pre-generated, so the native detail route reads ?id=).
const PLAYER_DETAIL_RE =
  /^(?:\/([a-z]{2}))?\/academy\/players\/([0-9a-fA-F]{8}-[0-9a-fA-F]{4}-[0-9a-fA-F]{4}-[0-9a-fA-F]{4}-[0-9a-fA-F]{12})\/?$/;

export const onRequest = async (context: EventContext): Promise<Response> => {
  const appOrigin = context.env.APP_ORIGIN ?? "https://app-origin.versafooty.com";
  const url = new URL(context.request.url);
  const { pathname } = url;

  const joinMatch = JOIN_LEGACY_RE.exec(pathname);
  if (joinMatch) {
    const [, lang, code] = joinMatch;
    return Response.redirect(
      `${url.origin}/${lang ?? pickLocale(context.request)}/join?code=${encodeURIComponent(code.toUpperCase())}`,
      302,
    );
  }
  const playerMatch = PLAYER_DETAIL_RE.exec(pathname);
  if (playerMatch) {
    const [, lang, id] = playerMatch;
    return Response.redirect(
      `${url.origin}/${lang ?? pickLocale(context.request)}/academy/players/detail?id=${encodeURIComponent(id)}`,
      302,
    );
  }

  // Bare un-localized native paths (old SPA URL shapes) → default-locale page.
  // Permanent canonicalization (308 preserves method + body).
  const stripped = pathname.endsWith("/") && pathname !== "/"
    ? pathname.slice(0, -1)
    : pathname;
  if (BARE_NATIVE_PATHS.includes(stripped)) {
    return Response.redirect(
      `${url.origin}/${pickLocale(context.request)}${stripped}${url.search}`,
      308,
    );
  }

  const isSpaPath = SPA_PREFIXES.some(
    (p) => pathname === p || pathname.startsWith(`${p}/`),
  );
  if (!isSpaPath) return context.next();

  const target = `${appOrigin}${pathname}${url.search}`;
  const init: RequestInit = {
    method: context.request.method,
    headers: context.request.headers,
    redirect: "manual",
  };
  if (context.request.method !== "GET" && context.request.method !== "HEAD") {
    init.body = context.request.body;
  }
  return fetch(target, init);
};
