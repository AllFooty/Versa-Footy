"use client";

import { useState } from "react";
import { EASE_VERSA } from "../../_data/motion";
import { Chip } from "../primitives/Chip";
import { Reveal } from "../primitives/Reveal";
import type { Dict } from "../../_dictionaries";

type Props = { dict: Dict };

const INITIAL_VISIBLE = 6;

export function FAQSection({ dict }: Props) {
  const t = dict.faq;
  const [expanded, setExpanded] = useState(false);
  const hasMore = t.items.length > INITIAL_VISIBLE;
  const visible = expanded ? t.items : t.items.slice(0, INITIAL_VISIBLE);

  const jsonLd = {
    "@context": "https://schema.org",
    "@type": "FAQPage",
    mainEntity: t.items.map((item) => ({
      "@type": "Question",
      name: item.q,
      acceptedAnswer: { "@type": "Answer", text: item.a },
    })),
  };

  return (
    <section
      id="faq"
      className="relative isolate w-full overflow-hidden bg-cream"
    >
      <div
        aria-hidden
        className="absolute inset-0"
        style={{
          background:
            "radial-gradient(ellipse 100% 50% at 50% 0%, rgba(232,169,60,0.08) 0%, transparent 60%)",
        }}
      />
      <div aria-hidden className="bg-noise absolute inset-0 opacity-[0.1]" />

      <div className="relative z-10 mx-auto max-w-[860px] px-6 pt-24 pb-24 md:px-10 lg:pt-32 lg:pb-32">
        <Reveal
          margin="-15%"
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.9, ease: EASE_VERSA }}
          className="flex flex-col items-center text-center"
        >
          <Chip tone="outline">{t.chip}</Chip>
          <h2 className="mt-6 font-display font-black uppercase leading-[0.95] tracking-[-0.015em] text-[clamp(34px,5vw,64px)]">
            <span className="block text-accent-dark">{t.headlineA}</span>
            <span className="block text-burgundy">{t.headlineB}</span>
          </h2>
          <p className="mt-5 max-w-xl font-sans text-body-l text-warm-shadow">
            {t.sub}
          </p>
        </Reveal>

        <ul className="mt-14 divide-y divide-accent-dark/15 border-y border-accent-dark/15">
          {visible.map((item, i) => (
            <Reveal
              key={item.q}
              as="li"
              margin="-10%"
              initial={{ opacity: 0, y: 16 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{
                duration: 0.7,
                delay: Math.min(i, INITIAL_VISIBLE - 1) * 0.05,
                ease: EASE_VERSA,
              }}
            >
              <details className="group py-5">
                <summary className="flex cursor-pointer list-none items-start justify-between gap-6 text-start font-display uppercase text-[clamp(16px,1.6vw,20px)] font-bold tracking-[-0.005em] text-accent-dark transition-colors hover:text-burgundy focus:outline-none focus-visible:text-burgundy [&::-webkit-details-marker]:hidden">
                  <span>{item.q}</span>
                  <span
                    aria-hidden="true"
                    className="mt-1 inline-flex h-6 w-6 shrink-0 items-center justify-center rounded-full border border-accent-dark/30 text-accent-dark transition-[transform,border-color,color] duration-300 group-open:rotate-180 group-open:border-burgundy group-open:text-burgundy group-hover:border-burgundy group-hover:text-burgundy"
                  >
                    <svg
                      width="10"
                      height="10"
                      viewBox="0 0 10 10"
                      fill="none"
                      stroke="currentColor"
                      strokeWidth="1.75"
                      strokeLinecap="round"
                      strokeLinejoin="round"
                    >
                      <path d="M2 4l3 3 3-3" />
                    </svg>
                  </span>
                </summary>
                <p className="mt-3 max-w-2xl font-sans text-body-m leading-relaxed text-warm-shadow">
                  {item.a}
                </p>
              </details>
            </Reveal>
          ))}
        </ul>

        {hasMore && (
          <div className="mt-10 flex justify-center">
            <button
              type="button"
              onClick={() => setExpanded((v) => !v)}
              aria-expanded={expanded}
              className="group inline-flex items-center gap-2 font-sans text-body-l text-burgundy/85 transition-colors hover:text-burgundy focus:outline-none focus-visible:ring-2 focus-visible:ring-burgundy focus-visible:ring-offset-2 focus-visible:ring-offset-cream"
            >
              {expanded ? t.showLess : t.showMore}
              <span
                aria-hidden="true"
                className={`inline-block transition-transform ${expanded ? "rotate-180" : ""}`}
              >
                ↓
              </span>
            </button>
          </div>
        )}
      </div>

      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }}
      />
    </section>
  );
}
