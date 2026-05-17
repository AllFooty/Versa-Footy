import type { Metadata, Viewport } from "next";
import { notFound } from "next/navigation";
import { Nunito, Saira_Condensed, Tajawal } from "next/font/google";
import { MotionProvider } from "../_components/MotionProvider";
import { getDictionary, hasLocale, LOCALES, type Locale } from "../_dictionaries";
import "../globals.css";

const saira = Saira_Condensed({
  variable: "--font-saira",
  subsets: ["latin"],
  weight: ["500", "700", "800", "900"],
  display: "swap",
});

const nunito = Nunito({
  variable: "--font-nunito",
  subsets: ["latin"],
  weight: ["400", "600", "700", "800"],
  style: ["normal", "italic"],
  display: "swap",
});

const tajawal = Tajawal({
  variable: "--font-tajawal",
  subsets: ["arabic", "latin"],
  weight: ["400", "500", "700", "800", "900"],
  display: "swap",
});

const siteUrl = process.env.NEXT_PUBLIC_SITE_URL ?? "https://versafooty.com";

export const viewport: Viewport = {
  width: "device-width",
  initialScale: 1,
  viewportFit: "cover",
  themeColor: [
    { media: "(prefers-color-scheme: light)", color: "#FAF6EE" },
    { media: "(prefers-color-scheme: dark)", color: "#24170F" },
  ],
};

export async function generateStaticParams() {
  return LOCALES.map((lang) => ({ lang }));
}

export async function generateMetadata({
  params,
}: {
  params: Promise<{ lang: string }>;
}): Promise<Metadata> {
  const { lang } = await params;
  if (!hasLocale(lang)) return {};
  const dict = getDictionary(lang);

  return {
    metadataBase: new URL(siteUrl),
    title: { default: dict.meta.title, template: dict.meta.titleTemplate },
    description: dict.meta.description,
    applicationName: "Versa Footy",
    icons: {
      icon: "/icon.png",
      apple: "/apple-icon.png",
      shortcut: "/favicon.ico",
    },
    keywords: [
      "AI football coach",
      "kids football training",
      "Saudi Arabia football",
      "GCC football",
      "youth football app",
      "Versa Footy",
      "تدريب كرة قدم",
      "ذكاء اصطناعي",
    ],
    authors: [{ name: "Versa Footy" }],
    creator: "Versa Footy",
    publisher: "All Footy",
    category: "sports",
    robots: {
      index: true,
      follow: true,
      googleBot: { index: true, follow: true, "max-image-preview": "large" },
    },
    alternates: {
      canonical: `/${lang}`,
      languages: {
        en: "/en",
        ar: "/ar",
        "x-default": "/ar",
      },
    },
    openGraph: {
      title: dict.meta.title,
      description: dict.meta.ogDescription,
      type: "website",
      locale: lang === "ar" ? "ar_SA" : "en_US",
      alternateLocale: lang === "ar" ? ["en_US"] : ["ar_SA"],
      siteName: "Versa Footy",
      url: `/${lang}`,
    },
    twitter: {
      card: "summary_large_image",
      title: dict.meta.title,
      description: dict.meta.ogDescription,
    },
  };
}

const organizationJsonLd = {
  "@context": "https://schema.org",
  "@type": "Organization",
  name: "Versa Footy",
  url: siteUrl,
  logo: `${siteUrl}/VERSA_FOOTY_wordmark_accent-dark_24170F_transparent.webp`,
  description:
    "AI football training for kids ages 7–14, launching in Saudi Arabia and the GCC.",
  parentOrganization: { "@type": "Organization", name: "All Footy" },
  areaServed: [
    { "@type": "Country", name: "Saudi Arabia" },
    { "@type": "Place", name: "Gulf Cooperation Council" },
  ],
};

export default async function RootLayout({
  children,
  params,
}: Readonly<{
  children: React.ReactNode;
  params: Promise<{ lang: string }>;
}>) {
  const { lang } = await params;
  if (!hasLocale(lang)) notFound();

  const isRtl = lang === "ar";
  const bodyFont = isRtl ? "font-arabic" : "";

  return (
    <html
      lang={lang}
      dir={isRtl ? "rtl" : "ltr"}
      className={`${saira.variable} ${nunito.variable} ${tajawal.variable} relative h-full antialiased`}
    >
      <body className={`min-h-full flex flex-col bg-cream text-accent-dark ${bodyFont}`}>
        <MotionProvider>{children}</MotionProvider>
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{ __html: JSON.stringify(organizationJsonLd) }}
        />
      </body>
    </html>
  );
}
