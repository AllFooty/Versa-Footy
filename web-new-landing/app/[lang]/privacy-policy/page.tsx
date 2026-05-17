import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { SmoothScrollProvider } from "../../_components/SmoothScrollProvider";
import { Navigation } from "../../_components/sections/Navigation";
import { Footer } from "../../_components/sections/Footer";
import { Reveal } from "../../_components/primitives/Reveal";
import { EASE_VERSA } from "../../_data/motion";
import { getDictionary, hasLocale } from "../../_dictionaries";

const siteUrl = process.env.NEXT_PUBLIC_SITE_URL ?? "https://versafooty.com";

export async function generateMetadata({
  params,
}: {
  params: Promise<{ lang: string }>;
}): Promise<Metadata> {
  const { lang } = await params;
  if (!hasLocale(lang)) return {};
  const dict = getDictionary(lang);
  const t = dict.privacy.meta;
  return {
    title: t.title,
    description: t.description,
    alternates: {
      canonical: `/${lang}/privacy-policy`,
      languages: {
        en: "/en/privacy-policy",
        ar: "/ar/privacy-policy",
        "x-default": "/ar/privacy-policy",
      },
    },
    openGraph: {
      title: t.title,
      description: t.description,
      type: "website",
      locale: lang === "ar" ? "ar_SA" : "en_US",
      alternateLocale: lang === "ar" ? ["en_US"] : ["ar_SA"],
      siteName: "Versa Footy",
      url: `${siteUrl}/${lang}/privacy-policy`,
    },
    twitter: {
      card: "summary",
      title: t.title,
      description: t.description,
    },
  };
}

export default async function PrivacyPolicyPage({
  params,
}: {
  params: Promise<{ lang: string }>;
}) {
  const { lang } = await params;
  if (!hasLocale(lang)) notFound();
  const dict = getDictionary(lang);
  const t = dict.privacy;

  return (
    <SmoothScrollProvider>
      <a href="#main-content" className="skip-link">
        {dict.a11y.skipToContent}
      </a>
      <Navigation dict={dict} lang={lang} />
      <main id="main-content" tabIndex={-1} className="relative flex flex-col">
        <section className="relative isolate w-full overflow-hidden bg-accent-dark text-cream">
          <div
            aria-hidden
            className="absolute inset-0"
            style={{
              background:
                "radial-gradient(ellipse 80% 60% at 50% 0%, rgba(232,169,60,0.18) 0%, transparent 65%)",
            }}
          />
          <div aria-hidden className="bg-noise absolute inset-0 opacity-[0.08]" />
          <div className="relative z-10 mx-auto max-w-[900px] px-8 pt-40 pb-20 md:px-16 lg:pt-48 lg:pb-24">
            <Reveal
              margin="-15%"
              initial={{ opacity: 0, y: 30 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 1, ease: EASE_VERSA }}
            >
              <h1 className="font-display font-black uppercase leading-[0.95] tracking-[-0.015em] text-[clamp(40px,6vw,80px)] text-cream">
                {t.title}
              </h1>
              <p className="mt-6 font-display uppercase label-sm text-cream/60">
                {t.lastUpdated}
              </p>
            </Reveal>
          </div>
        </section>

        <section className="relative isolate w-full overflow-hidden bg-cream">
          <div aria-hidden className="bg-noise absolute inset-0 opacity-[0.08]" />
          <div className="relative z-10 mx-auto max-w-[820px] px-8 py-20 md:px-16 lg:py-28">
            <Reveal
              margin="-15%"
              initial={{ opacity: 0, y: 30 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 1, ease: EASE_VERSA }}
            >
              <p className="font-sans text-body-l leading-relaxed text-accent-dark/85">
                {t.intro}
              </p>
            </Reveal>

            <div className="mt-14 space-y-12">
              {t.sections.map((s, i) => (
                <Reveal
                  key={s.heading}
                  margin="-15%"
                  initial={{ opacity: 0, y: 24 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.9, delay: 0.05 * i, ease: EASE_VERSA }}
                >
                  <h2 className="font-display uppercase font-black tracking-[-0.01em] text-[clamp(22px,3vw,32px)] text-burgundy">
                    {s.heading}
                  </h2>
                  <p className="mt-4 font-sans text-body-l leading-relaxed text-accent-dark/85">
                    {s.body}
                  </p>
                </Reveal>
              ))}
            </div>
          </div>
        </section>

        <Footer dict={dict} lang={lang} />
      </main>
    </SmoothScrollProvider>
  );
}
