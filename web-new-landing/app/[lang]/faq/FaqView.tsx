"use client";

import Link from "next/link";
import { SmoothScrollProvider } from "../../_components/SmoothScrollProvider";
import { Navigation } from "../../_components/sections/Navigation";
import { Footer } from "../../_components/sections/Footer";
import { FAQSection } from "../../_components/sections/FAQSection";
import { Reveal } from "../../_components/primitives/Reveal";
import { EASE_VERSA } from "../../_data/motion";
import type { Dict, Locale } from "../../_dictionaries";

type Props = { dict: Dict; lang: Locale };

export function FaqView({ dict, lang }: Props) {
  const t = dict.faq;

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
          <div className="relative z-10 mx-auto max-w-[900px] px-8 pt-40 pb-20 md:px-16 lg:pt-48 lg:pb-24 text-center">
            <Reveal
              margin="-15%"
              initial={{ opacity: 0, y: 30 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 1, ease: EASE_VERSA }}
            >
              <h1 className="font-display font-black uppercase leading-[0.95] tracking-[-0.015em] text-[clamp(40px,6vw,80px)] text-cream">
                {t.pageTitle}
              </h1>
              <p className="mx-auto mt-6 max-w-2xl font-sans text-body-l leading-relaxed text-cream/80">
                {t.pageSubtitle}
              </p>
            </Reveal>
          </div>
        </section>

        <FAQSection dict={dict} />

        <section className="relative isolate w-full overflow-hidden bg-cream">
          <div className="relative z-10 mx-auto max-w-[1200px] px-8 pb-24 text-center md:px-16">
            <Link
              href={`/${lang}`}
              className="group inline-flex items-center gap-2 font-sans text-body-l text-burgundy/85 transition-colors hover:text-burgundy focus:outline-none focus-visible:ring-2 focus-visible:ring-burgundy focus-visible:ring-offset-2 focus-visible:ring-offset-cream"
            >
              {t.backToHome}
              <span
                aria-hidden="true"
                className="inline-block transition-transform group-hover:translate-x-0.5 rtl:group-hover:-translate-x-0.5"
              >
                →
              </span>
            </Link>
          </div>
        </section>

        <Footer dict={dict} lang={lang} />
      </main>
    </SmoothScrollProvider>
  );
}
