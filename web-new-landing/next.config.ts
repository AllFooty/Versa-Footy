import type { NextConfig } from "next";

// Old Vite SPA paths reverse-proxied to APP_ORIGIN until they're ported to Next.
const SPA_PROXY_PATHS = [
  "/login",
  "/about-us",
  "/faq",
  "/terms-of-service",
  "/privacy-policy",
  "/unsubscribe",
  "/preferences",
  "/home",
  "/settings",
  "/org/create",
  "/join",
  "/join/:code*",
  "/academy",
  "/academy/:path*",
  "/library",
  "/library/:path*",
  "/videos-audit",
  "/marketing",
  "/marketing/:path*",
  "/assets/:path*",
  "/Favicons/:path*",
  "/attached_assets/:path*",
];

const APP_ORIGIN = process.env.APP_ORIGIN;

const nextConfig: NextConfig = {
  turbopack: {
    root: __dirname,
  },
  async rewrites() {
    if (!APP_ORIGIN) return [];
    return SPA_PROXY_PATHS.map((source) => ({
      source,
      destination: `${APP_ORIGIN}${source}`,
    }));
  },
  images: {
    formats: ["image/avif", "image/webp"],
    deviceSizes: [640, 750, 828, 1080, 1200, 1920],
    imageSizes: [16, 32, 48, 64, 96, 128, 256, 384],
    qualities: [75, 85],
    minimumCacheTTL: 2678400,
  },
  async headers() {
    return [
      {
        source: "/:path*",
        headers: [
          { key: "Referrer-Policy", value: "strict-origin-when-cross-origin" },
          { key: "X-Content-Type-Options", value: "nosniff" },
          { key: "X-Frame-Options", value: "DENY" },
          { key: "X-DNS-Prefetch-Control", value: "on" },
          { key: "Permissions-Policy", value: "camera=(), microphone=(), geolocation=()" },
        ],
      },
      {
        source: "/:all*(svg|jpg|jpeg|png|webp|avif|ico|woff|woff2)",
        headers: [
          { key: "Cache-Control", value: "public, max-age=31536000, immutable" },
        ],
      },
    ];
  },
};

export default nextConfig;
