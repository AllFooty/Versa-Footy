import type { NextConfig } from "next";

// Static export for Cloudflare Pages. SPA path forwarding and locale redirect
// live in public/_redirects (read by Cloudflare at the edge, before files).
// Response headers live in public/_headers.
const nextConfig: NextConfig = {
  output: "export",
  trailingSlash: false,
  turbopack: {
    root: __dirname,
  },
  images: {
    // next/image's optimizer needs a runtime — static export has none.
    unoptimized: true,
  },
};

export default nextConfig;
