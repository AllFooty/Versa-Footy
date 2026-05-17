import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { Suspense } from "react";
import { LoginForm } from "./LoginForm";
import { getDictionary, hasLocale } from "../../_dictionaries";
import { getProductDictionary } from "../../_dictionaries/product";

const siteUrl = process.env.NEXT_PUBLIC_SITE_URL ?? "https://versafooty.com";

export async function generateMetadata({
  params,
}: {
  params: Promise<{ lang: string }>;
}): Promise<Metadata> {
  const { lang } = await params;
  if (!hasLocale(lang)) return {};
  const productDict = getProductDictionary(lang);
  const title = productDict.login.titleEmail;
  const description = productDict.login.subtitleEmail;
  return {
    title,
    description,
    robots: { index: false, follow: false },
    alternates: {
      canonical: `/${lang}/login`,
      languages: {
        en: "/en/login",
        ar: "/ar/login",
        "x-default": "/ar/login",
      },
    },
    openGraph: {
      title,
      description,
      type: "website",
      locale: lang === "ar" ? "ar_SA" : "en_US",
      siteName: "Versa Footy",
      url: `${siteUrl}/${lang}/login`,
    },
  };
}

export default async function LoginPage({
  params,
}: {
  params: Promise<{ lang: string }>;
}) {
  const { lang } = await params;
  if (!hasLocale(lang)) notFound();
  const dict = getDictionary(lang);
  const productDict = getProductDictionary(lang);

  return (
    <main className="relative isolate flex min-h-screen items-center justify-center overflow-hidden bg-accent-dark px-6 py-16 text-cream">
      <div
        aria-hidden
        className="absolute inset-0"
        style={{
          background:
            "radial-gradient(ellipse 70% 50% at 50% 0%, rgba(232,169,60,0.18) 0%, transparent 65%), radial-gradient(ellipse 70% 50% at 50% 100%, rgba(187,90,43,0.15) 0%, transparent 60%)",
        }}
      />
      <div aria-hidden className="bg-noise absolute inset-0 opacity-[0.08]" />
      <a href={`/${lang}`} className="absolute top-6 left-6 right-6 flex items-center justify-center md:justify-start" aria-label={dict.nav.homeAria}>
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img src="/versa-lockup-white.webp" alt={dict.footer.logoAlt} width={40} height={40} className="h-10 w-10" />
      </a>
      <Suspense fallback={<div className="w-full max-w-md" />}>
        <LoginForm dict={productDict} lang={lang} />
      </Suspense>
    </main>
  );
}
