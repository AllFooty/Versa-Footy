// Cloudflare Pages middleware: reverse-proxy old Vite SPA paths to APP_ORIGIN.
// Runs before static-file serving. SPA paths go to app-origin; everything else
// falls through to Next.js static export.

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

interface Env {
  APP_ORIGIN?: string;
}

export const onRequest: PagesFunction<Env> = async (context) => {
  const appOrigin = context.env.APP_ORIGIN ?? "https://app-origin.versafooty.com";
  const url = new URL(context.request.url);
  const { pathname } = url;

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
