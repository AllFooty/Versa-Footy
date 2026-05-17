import type { Metadata } from "next";
import Image from "next/image";
import Link from "next/link";
import { notFound } from "next/navigation";
import { SmoothScrollProvider } from "../../_components/SmoothScrollProvider";
import { Navigation } from "../../_components/sections/Navigation";
import { Footer } from "../../_components/sections/Footer";
import { Chip } from "../../_components/primitives/Chip";
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
  const t = dict.about.meta;
  return {
    title: t.title,
    description: t.description,
    alternates: {
      canonical: `/${lang}/about`,
      languages: {
        en: "/en/about",
        ar: "/ar/about",
        "x-default": "/ar/about",
      },
    },
    openGraph: {
      title: t.title,
      description: t.description,
      type: "website",
      locale: lang === "ar" ? "ar_SA" : "en_US",
      alternateLocale: lang === "ar" ? ["en_US"] : ["ar_SA"],
      siteName: "Versa Footy",
      url: `${siteUrl}/${lang}/about`,
    },
    twitter: {
      card: "summary_large_image",
      title: t.title,
      description: t.description,
    },
  };
}

export default async function AboutPage({
  params,
}: {
  params: Promise<{ lang: string }>;
}) {
  const { lang } = await params;
  if (!hasLocale(lang)) notFound();
  const dict = getDictionary(lang);
  const t = dict.about;

  return (
    <SmoothScrollProvider>
      <a href="#main-content" className="skip-link">
        {dict.a11y.skipToContent}
      </a>
      <Navigation dict={dict} lang={lang} />
      <main id="main-content" tabIndex={-1} className="relative flex flex-col">
        {/* HERO */}
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
          <div className="relative z-10 mx-auto grid max-w-[1400px] grid-cols-1 items-center gap-12 px-8 pt-40 pb-24 md:px-16 lg:grid-cols-12 lg:pt-48 lg:pb-32">
            <Reveal
              margin="-15%"
              initial={{ opacity: 0, y: 30 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 1, ease: EASE_VERSA }}
              className="lg:col-span-7"
            >
              <Chip tone="outline" className="!border-cream/30 !text-cream/80">
                {t.hero.eyebrow}
              </Chip>
              <h1 className="mt-6 font-display font-black uppercase leading-[0.95] tracking-[-0.015em] text-[clamp(48px,7vw,104px)]">
                <span className="block text-cream">{t.hero.headlineA}</span>
                <span className="block text-glyph-gold">{t.hero.headlineB}</span>
              </h1>
              <p className="mt-8 max-w-xl font-sans text-body-l leading-relaxed text-cream/80">
                {t.hero.sub}
              </p>
            </Reveal>
            <Reveal
              as="figure"
              margin="-15%"
              initial={{ opacity: 0, x: 30 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ duration: 1.2, delay: 0.2, ease: EASE_VERSA }}
              className="relative mx-auto w-full max-w-[420px] lg:col-span-5"
            >
              <div
                aria-hidden
                className="absolute -inset-6 rounded-[2.5rem] bg-gradient-to-br from-glyph-gold/25 to-burgundy/20 blur-3xl"
              />
              <div className="relative aspect-square">
                <Image
                  src="/versa-focused.webp"
                  alt={t.hero.versaAlt}
                  fill
                  sizes="(max-width: 1024px) 80vw, 420px"
                  className="object-contain"
                  priority
                />
              </div>
            </Reveal>
          </div>
        </section>

        {/* MISSION */}
        <section className="relative isolate w-full overflow-hidden bg-cream">
          <div aria-hidden className="bg-noise absolute inset-0 opacity-[0.1]" />
          <div className="relative z-10 mx-auto max-w-[1200px] px-8 py-24 md:px-16 lg:py-32">
            <Reveal
              margin="-20%"
              initial={{ opacity: 0, y: 30 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 1, ease: EASE_VERSA }}
              className="flex justify-center"
            >
              <Chip tone="outline">{t.mission.chip}</Chip>
            </Reveal>
            <Reveal
              margin="-20%"
              initial={{ opacity: 0, y: 30 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 1.1, delay: 0.15, ease: EASE_VERSA }}
              className="mt-10 text-center"
            >
              <h2 className="mx-auto max-w-4xl font-display font-black uppercase leading-[0.95] tracking-[-0.015em] text-[clamp(40px,6vw,88px)]">
                <span className="block text-accent-dark">{t.mission.headlineA}</span>
                <span className="block text-burgundy">{t.mission.headlineB}</span>
              </h2>
              <p className="mx-auto mt-8 max-w-2xl font-sans text-body-l leading-relaxed text-warm-shadow">
                {t.mission.body}
              </p>
            </Reveal>

            <div className="mt-16 grid grid-cols-1 gap-6 md:grid-cols-3 lg:mt-20 lg:gap-8">
              {t.mission.pillars.map((pillar, i) => (
                <Reveal
                  key={pillar.title}
                  margin="-15%"
                  initial={{ opacity: 0, y: 30 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ duration: 1, delay: 0.1 * i, ease: EASE_VERSA }}
                  className="rounded-2xl border border-accent-dark/15 bg-cream p-7 shadow-[0_30px_60px_-40px_rgba(36,23,15,0.35)]"
                >
                  <h3 className="font-display uppercase label-md font-bold text-burgundy">
                    {pillar.title}
                  </h3>
                  <p className="mt-3 font-sans text-body-m leading-relaxed text-accent-dark/85">
                    {pillar.body}
                  </p>
                </Reveal>
              ))}
            </div>
          </div>
        </section>

        {/* STORY */}
        <section className="relative isolate w-full overflow-hidden bg-warm-shadow/5">
          <div
            aria-hidden
            className="pointer-events-none absolute -right-24 top-12 h-72 w-72 opacity-[0.08]"
          >
            <Image
              src="/pattern-wing-burgundy.webp"
              alt=""
              fill
              sizes="300px"
              className="object-contain"
            />
          </div>
          <div className="relative z-10 mx-auto grid max-w-[1200px] grid-cols-1 gap-12 px-8 py-24 md:px-16 lg:grid-cols-12 lg:py-32">
            <Reveal
              margin="-20%"
              initial={{ opacity: 0, y: 30 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 1, ease: EASE_VERSA }}
              className="lg:col-span-5"
            >
              <Chip tone="outline">{t.story.chip}</Chip>
              <h2 className="mt-6 font-display font-black uppercase leading-[0.95] tracking-[-0.015em] text-[clamp(40px,5.5vw,80px)]">
                <span className="block text-accent-dark">{t.story.headlineA}</span>
                <span className="block text-burgundy">{t.story.headlineB}</span>
              </h2>
              <figure className="mt-10 border-s-2 border-burgundy/40 ps-5">
                <blockquote className="font-sans italic text-body-l leading-snug text-accent-dark/85">
                  &ldquo;{t.story.pullQuote}&rdquo;
                </blockquote>
                <figcaption className="mt-3 font-display uppercase label-sm text-warm-shadow">
                  {t.story.pullQuoteAttribution}
                </figcaption>
              </figure>
            </Reveal>
            <Reveal
              margin="-15%"
              initial={{ opacity: 0, y: 30 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 1.1, delay: 0.15, ease: EASE_VERSA }}
              className="space-y-6 lg:col-span-7"
            >
              {t.story.paragraphs.map((p, i) => (
                <p
                  key={i}
                  className="font-sans text-body-l leading-relaxed text-accent-dark/85"
                >
                  {p}
                </p>
              ))}
            </Reveal>
          </div>
        </section>

        {/* TEAM */}
        <section className="relative isolate w-full overflow-hidden bg-cream">
          <div className="relative z-10 mx-auto max-w-[1200px] px-8 py-24 md:px-16 lg:py-32">
            <Reveal
              margin="-20%"
              initial={{ opacity: 0, y: 30 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 1, ease: EASE_VERSA }}
              className="text-center"
            >
              <Chip tone="outline">{t.team.chip}</Chip>
              <h2 className="mx-auto mt-6 max-w-3xl font-display font-black uppercase leading-[0.95] tracking-[-0.015em] text-[clamp(40px,5.5vw,80px)]">
                <span className="block text-accent-dark">{t.team.headlineA}</span>
                <span className="block text-deep-teal">{t.team.headlineB}</span>
              </h2>
              <p className="mx-auto mt-6 max-w-xl font-sans text-body-l leading-relaxed text-warm-shadow">
                {t.team.sub}
              </p>
            </Reveal>

            <div className="mx-auto mt-16 grid max-w-3xl grid-cols-1 gap-10 sm:grid-cols-2 lg:mt-20">
              {t.team.members.map((m, i) => (
                <Reveal
                  key={m.role}
                  margin="-15%"
                  initial={{ opacity: 0, y: 30 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ duration: 1, delay: 0.1 * i, ease: EASE_VERSA }}
                  className="flex flex-col items-center text-center"
                >
                  <div
                    aria-label={m.imageAlt}
                    role="img"
                    className="relative h-32 w-32 overflow-hidden rounded-full border border-accent-dark/15 bg-warm-shadow/15"
                  >
                    {/* TODO: replace with real headshot via Image when assets are ready */}
                    <div className="absolute inset-0 grid place-items-center font-display label-md uppercase text-warm-shadow/70">
                      {m.name.split("—")[0].trim().slice(0, 2)}
                    </div>
                  </div>
                  <h3 className="mt-5 font-display uppercase label-md font-bold text-accent-dark">
                    {m.name}
                  </h3>
                  <p className="mt-1 font-display uppercase label-sm text-burgundy">
                    {m.role}
                  </p>
                  <p className="mt-3 max-w-[280px] font-sans text-body-m leading-relaxed text-accent-dark/80">
                    {m.bio}
                  </p>
                </Reveal>
              ))}
            </div>
          </div>
        </section>

        {/* FAMILY */}
        <section className="relative isolate w-full overflow-hidden bg-accent-dark text-cream">
          <div
            aria-hidden
            className="absolute inset-0"
            style={{
              background:
                "radial-gradient(ellipse 80% 70% at 50% 100%, rgba(232,169,60,0.18) 0%, transparent 65%)",
            }}
          />
          <div className="relative z-10 mx-auto max-w-[1000px] px-8 py-24 text-center md:px-16 lg:py-32">
            <Reveal
              margin="-20%"
              initial={{ opacity: 0, y: 30 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 1, ease: EASE_VERSA }}
            >
              <Chip tone="outline" className="!border-cream/30 !text-cream/80">
                {t.family.chip}
              </Chip>
              <h2 className="mx-auto mt-6 max-w-3xl font-display font-black uppercase leading-[0.95] tracking-[-0.015em] text-[clamp(36px,5vw,72px)]">
                <span className="block text-cream">{t.family.headlineA}</span>
                <span className="block text-glyph-gold">{t.family.headlineB}</span>
              </h2>
              <p className="mx-auto mt-8 max-w-2xl font-sans text-body-l leading-relaxed text-cream/80">
                {t.family.body}
              </p>
              <Link
                href={`/${lang}#all-footy-family`}
                className="group mt-10 inline-flex items-center gap-2 font-sans text-body-l text-glyph-gold/90 transition-colors hover:text-glyph-gold focus:outline-none focus-visible:ring-2 focus-visible:ring-glyph-gold focus-visible:ring-offset-2 focus-visible:ring-offset-accent-dark"
              >
                {t.backToHome}
                <span
                  aria-hidden="true"
                  className="inline-block transition-transform group-hover:translate-x-0.5 rtl:group-hover:-translate-x-0.5"
                >
                  →
                </span>
              </Link>
            </Reveal>
          </div>
        </section>

        <Footer dict={dict} lang={lang} />
      </main>
    </SmoothScrollProvider>
  );
}
