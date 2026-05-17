// Cloudflare Pages middleware: reverse-proxy old Vite SPA paths to APP_ORIGIN.
// Runs before static-file serving. SPA paths go to app-origin; everything else
// falls through to Next.js static export.

const SPA_PREFIXES = [
  // /academy itself is now native; sub-routes (/academy/players, /teams,
  // /invitations, /settings) still proxy until ported in this phase.
  "/academy/players",
  "/academy/invitations",
  "/academy/teams",
  "/academy/settings",
  "/library",
  "/videos-audit",
  "/marketing",
  "/assets",
  "/Favicons",
  "/attached_assets",
];

// Inline types — avoids depending on @cloudflare/workers-types in package.json.
type EventContext = {
  request: Request;
  env: { APP_ORIGIN?: string };
  next: () => Promise<Response>;
};

// /<lang>/join/<CODE> still ships in shared invite links. The Next.js app
// uses /<lang>/join?code=<CODE> instead (static export can't take an arbitrary
// dynamic [code] segment), so rewrite the legacy path here.
// Matches /<lang>/join/<CODE> and the legacy un-prefixed /join/<CODE>
// (old SPA didn't have locale segments). Default to /ar when missing.
const JOIN_LEGACY_RE = /^(?:\/([a-z]{2}))?\/join\/([A-Za-z0-9]+)\/?$/;

export const onRequest = async (context: EventContext): Promise<Response> => {
  const appOrigin = context.env.APP_ORIGIN ?? "https://app-origin.versafooty.com";
  const url = new URL(context.request.url);
  const { pathname } = url;

  const joinMatch = JOIN_LEGACY_RE.exec(pathname);
  if (joinMatch) {
    const [, lang, code] = joinMatch;
    return Response.redirect(
      `${url.origin}/${lang ?? "ar"}/join?code=${encodeURIComponent(code.toUpperCase())}`,
      302,
    );
  }
  // Bare /join with no locale → default locale
  if (pathname === "/join" || pathname === "/join/") {
    return Response.redirect(`${url.origin}/ar/join`, 302);
  }
  // Bare /academy with no locale → default locale (old SPA URLs)
  if (pathname === "/academy" || pathname === "/academy/") {
    return Response.redirect(`${url.origin}/ar/academy`, 302);
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
