import type { Metadata } from "next";
import { Suspense } from "react";
import { notFound } from "next/navigation";
import { getDictionary, hasLocale } from "../../_dictionaries";
import { FaqView } from "./FaqView";

const siteUrl = process.env.NEXT_PUBLIC_SITE_URL ?? "https://versafooty.com";

export async function generateMetadata({
  params,
}: {
  params: Promise<{ lang: string }>;
}): Promise<Metadata> {
  const { lang } = await params;
  if (!hasLocale(lang)) return {};
  const dict = getDictionary(lang);
  const t = dict.faq.meta;
  return {
    title: t.title,
    description: t.description,
    alternates: {
      canonical: `/${lang}/faq`,
      languages: {
        en: "/en/faq",
        ar: "/ar/faq",
        "x-default": "/ar/faq",
      },
    },
    openGraph: {
      title: t.title,
      description: t.description,
      type: "website",
      locale: lang === "ar" ? "ar_SA" : "en_US",
      alternateLocale: lang === "ar" ? ["en_US"] : ["ar_SA"],
      siteName: "Versa Footy",
      url: `${siteUrl}/${lang}/faq`,
    },
    twitter: {
      card: "summary_large_image",
      title: t.title,
      description: t.description,
    },
  };
}

export default async function FaqPage({
  params,
}: {
  params: Promise<{ lang: string }>;
}) {
  const { lang } = await params;
  if (!hasLocale(lang)) {
    notFound();
  }
  const dict = getDictionary(lang);

  return (
    <Suspense fallback={null}>
      <FaqView dict={dict} lang={lang} />
    </Suspense>
  );
}
