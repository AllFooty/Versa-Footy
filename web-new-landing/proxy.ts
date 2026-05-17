import { NextResponse, type NextRequest } from "next/server";
import { LOCALES, DEFAULT_LOCALE, hasLocale } from "./app/_dictionaries";

const LOCALE_COOKIE = "NEXT_LOCALE";

function pickLocale(request: NextRequest): string {
  const cookie = request.cookies.get(LOCALE_COOKIE)?.value;
  if (cookie && hasLocale(cookie)) return cookie;

  const accept = request.headers.get("accept-language") ?? "";
  // Lightweight Accept-Language parse — enough for two locales.
  const ordered = accept
    .split(",")
    .map((part) => {
      const [tagRaw, qRaw] = part.trim().split(";q=");
      return { tag: tagRaw.toLowerCase(), q: qRaw ? Number(qRaw) : 1 };
    })
    .sort((a, b) => b.q - a.q);

  for (const { tag } of ordered) {
    const base = tag.split("-")[0];
    if (hasLocale(base)) return base;
  }
  return DEFAULT_LOCALE;
}

// Paths that belong to the old SPA (handled by next.config rewrites).
// Must skip the locale redirect so /login doesn't get rewritten to /ar/login.
const SPA_PREFIXES = [
  "/login",
  "/about-us",
  "/faq",
  "/terms-of-service",
  "/privacy-policy",
  "/unsubscribe",
  "/preferences",
  "/home",
  "/settings",
  "/org",
  "/join",
  "/academy",
  "/library",
  "/videos-audit",
  "/marketing",
  "/assets",
  "/Favicons",
  "/attached_assets",
];

export function proxy(request: NextRequest) {
  const { pathname } = request.nextUrl;

  if (SPA_PREFIXES.some((p) => pathname === p || pathname.startsWith(`${p}/`))) {
    return;
  }

  const hasLocalePrefix = LOCALES.some(
    (l) => pathname === `/${l}` || pathname.startsWith(`/${l}/`),
  );
  if (hasLocalePrefix) return;

  const locale = pickLocale(request);
  const url = request.nextUrl.clone();
  url.pathname = `/${locale}${pathname === "/" ? "" : pathname}`;
  return NextResponse.redirect(url);
}

export const config = {
  // Skip Next internals, API routes, and any path with a file extension
  // (favicons, og-image, sitemap.xml, robots.txt, /branding's static assets).
  matcher: ["/((?!_next|api|.*\\..*).*)"],
};
