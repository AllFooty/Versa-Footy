import type { MetadataRoute } from "next";

// Required for output: 'export' — pre-render at build time.
export const dynamic = "force-static";

const siteUrl = process.env.NEXT_PUBLIC_SITE_URL ?? "https://versafooty.com";

const HOME_LAST_MODIFIED = "2026-05-16";

export default function sitemap(): MetadataRoute.Sitemap {
  return [
    {
      url: `${siteUrl}/ar`,
      lastModified: HOME_LAST_MODIFIED,
      changeFrequency: "weekly",
      priority: 1,
      alternates: {
        languages: { ar: `${siteUrl}/ar`, en: `${siteUrl}/en` },
      },
    },
    {
      url: `${siteUrl}/en`,
      lastModified: HOME_LAST_MODIFIED,
      changeFrequency: "weekly",
      priority: 0.9,
      alternates: {
        languages: { ar: `${siteUrl}/ar`, en: `${siteUrl}/en` },
      },
    },
    {
      url: `${siteUrl}/ar/about`,
      lastModified: HOME_LAST_MODIFIED,
      changeFrequency: "monthly",
      priority: 0.7,
      alternates: {
        languages: { ar: `${siteUrl}/ar/about`, en: `${siteUrl}/en/about` },
      },
    },
    {
      url: `${siteUrl}/en/about`,
      lastModified: HOME_LAST_MODIFIED,
      changeFrequency: "monthly",
      priority: 0.65,
      alternates: {
        languages: { ar: `${siteUrl}/ar/about`, en: `${siteUrl}/en/about` },
      },
    },
  ];
}
