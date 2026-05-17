"use client";

import { motion } from "motion/react";
import { EASE_VERSA } from "../../../../_data/motion";
import { Annotation } from "../../../../_components/primitives/Annotation";
import { Chip } from "../../../../_components/primitives/Chip";

type ScaleEntry = {
  step: string;
  size: string;
  family: string;
  weight: string;
  sample: string;
  className: string;
};

const scale: ScaleEntry[] = [
  {
    step: "Display XL",
    size: "clamp(80, 12vw, 180)",
    family: "Saira Condensed",
    weight: "Black 900",
    sample: "Versatility.",
    className: "font-display font-black uppercase text-[clamp(80px,12vw,180px)] leading-[0.9] tracking-[-0.03em]",
  },
  {
    step: "Display L",
    size: "clamp(64, 8vw, 104)",
    family: "Saira Condensed",
    weight: "Black 900",
    sample: "Every kid.",
    className: "font-display font-black uppercase text-[clamp(64px,8vw,104px)] leading-[0.92] tracking-[-0.025em]",
  },
  {
    step: "Display M",
    size: "clamp(48, 6vw, 72)",
    family: "Saira Condensed",
    weight: "Black 900",
    sample: "Versatility wins.",
    className: "font-display font-black uppercase text-[clamp(48px,6vw,72px)] leading-[0.94] tracking-[-0.02em]",
  },
  {
    step: "Display S",
    size: "clamp(32, 5vw, 48)",
    family: "Saira Condensed",
    weight: "Black 900",
    sample: "We close the hours gap.",
    className: "font-display font-black uppercase text-[clamp(32px,5vw,48px)] leading-[0.96] tracking-[-0.015em]",
  },
  {
    step: "Heading L",
    size: "28px",
    family: "Saira Condensed",
    weight: "Extrabold 800",
    sample: "Skill universe: 170 skills.",
    className: "font-display uppercase text-heading-l font-extrabold leading-tight tracking-[-0.01em]",
  },
  {
    step: "Heading M",
    size: "22px",
    family: "Saira Condensed",
    weight: "Extrabold 800",
    sample: "Dribbling: 42 skills",
    className: "font-display uppercase text-heading-m font-extrabold leading-snug",
  },
  {
    step: "Heading S",
    size: "18px",
    family: "Saira Condensed",
    weight: "Bold 700",
    sample: "Mastered. Next.",
    className: "font-display uppercase text-heading-s font-bold leading-snug tracking-[0.02em]",
  },
  {
    step: "Body L",
    size: "20px",
    family: "Nunito",
    weight: "Regular 400",
    sample: "A coach in every pocket, so talent isn’t decided by what your family can afford.",
    className: "font-sans text-body-l leading-relaxed",
  },
  {
    step: "Body M",
    size: "16px",
    family: "Nunito",
    weight: "Regular 400",
    sample: "Personalized drills, daily, in his hand. Five days, twenty drills.",
    className: "font-sans text-body-m leading-relaxed",
  },
  {
    step: "Caption",
    size: "14px",
    family: "Nunito",
    weight: "Regular 400",
    sample: "Hover a tile to read its use case.",
    className: "font-sans text-caption leading-snug",
  },
  {
    step: "Label",
    size: "13–15px",
    family: "Saira Condensed",
    weight: "Bold 700, uppercase",
    sample: "01 · DESIGN STORY",
    className: "font-display uppercase label-sm font-bold",
  },
];

export function TypographySection() {
  return (
    <section
      id="typography"
      className="relative isolate w-full overflow-hidden bg-cream py-28"
    >
      <div aria-hidden className="bg-noise absolute inset-0 opacity-15" />

      <div className="relative z-10 mx-auto flex w-full max-w-[1500px] flex-col gap-20 px-6 md:px-10 lg:px-16">
        {/* header */}
        <div className="grid grid-cols-1 gap-8 md:grid-cols-12">
          <div className="md:col-span-4">
            <Chip tone="burgundy" size="xs">
              04 · Typography
            </Chip>
            <h2 className="mt-4 font-display font-black uppercase leading-[0.95] text-accent-dark text-[clamp(36px,5vw,72px)] tracking-[-0.02em]">
              Two fonts.
              <span className="block">One job each.</span>
              <span className="block text-burgundy">Built for kids 7–14.</span>
            </h2>
          </div>
          <div className="md:col-span-8 md:pt-2">
            <p className="font-sans text-[clamp(15px,1.4vw,19px)] leading-snug text-warm-shadow">
              Saira Condensed Black carries the display: headlines, hero moments, short labels. Nunito carries everything you read: body, captions, leads, lists. Sentence case wins for readability with young players. Italic is reserved for true emphasis, never the default voice. Eleven type steps. Arabic uses Tajawal when the locale ships.
            </p>
          </div>
        </div>

        {/* the headline mood specimen — editorial poster */}
        <motion.div
          initial={{ opacity: 0, y: 24 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true, margin: "-10% 0px" }}
          transition={{ duration: 1, ease: EASE_VERSA }}
          className="relative grid grid-cols-1 items-end gap-8 border-t border-b border-accent-dark/15 py-10 md:grid-cols-12 md:gap-10 md:py-16"
        >
          <div className="md:col-span-3 flex flex-col gap-4">
            <span className="font-display uppercase label-xs text-burgundy">
              Headline mood · Display XL
            </span>
            <p className="font-sans text-[clamp(15px,1.3vw,18px)] leading-snug text-warm-shadow">
              One word, set in Saira Condensed Black. The brand&rsquo;s personality lives in this register: condensed, dark, editorial. Everything else scales down from here.
            </p>
            <div className="mt-2 inline-flex flex-wrap gap-2 font-display uppercase label-xs text-accent-dark/70">
              <span className="rounded-full border border-accent-dark/15 px-3 py-1.5">
                Saira Condensed
              </span>
              <span className="rounded-full border border-accent-dark/15 px-3 py-1.5">
                Black · 900
              </span>
              <span className="rounded-full border border-accent-dark/15 px-3 py-1.5">
                clamp(80, 15vw, 220)
              </span>
            </div>
          </div>
          <div className="md:col-span-9 relative">
            <p className="font-display font-black uppercase leading-[0.85] tracking-[-0.035em] text-accent-dark text-[clamp(80px,15vw,220px)]">
              Versatility.
            </p>
            <span className="absolute -top-1 right-0 font-display uppercase label-xs text-accent-dark/70 md:top-0">
              01
            </span>
          </div>
        </motion.div>

        {/* the type scale */}
        <div className="grid grid-cols-1 gap-6">
          <div className="flex items-baseline justify-between">
            <h3 className="font-display uppercase text-heading-s tracking-[0.04em] text-accent-dark">
              The type scale
            </h3>
            <span className="font-display uppercase label-xs text-accent-dark/70">
              Display × 4 · Heading × 3 · Body × 2 · Caption · Label
            </span>
          </div>

          <div className="overflow-hidden rounded-2xl border border-accent-dark/10 bg-cream/30 backdrop-blur">
            {scale.map((s, i) => (
              <motion.div
                key={s.step}
                initial={{ opacity: 0, y: 12 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true, margin: "-10% 0px" }}
                transition={{ duration: 0.5, delay: i * 0.04, ease: EASE_VERSA }}
                className={`grid grid-cols-1 gap-4 px-6 py-7 md:grid-cols-12 md:gap-6 md:px-8 ${
                  i < scale.length - 1 ? "border-b border-accent-dark/10" : ""
                }`}
              >
                <div className="md:col-span-3">
                  <div className="font-display uppercase label-xs text-burgundy">
                    {s.step}
                  </div>
                  <div className="mt-1 font-display uppercase label-xs text-accent-dark/70">
                    {s.size} · {s.weight}
                  </div>
                  <div className="mt-1 font-sans text-[12px] text-accent-dark/70">
                    {s.family}
                  </div>
                </div>
                <div className="md:col-span-9">
                  <p className={`${s.className} text-accent-dark`}>{s.sample}</p>
                </div>
              </motion.div>
            ))}
          </div>
        </div>

        {/* the two-font rule — pick by job, not surface */}
        <div className="grid grid-cols-1 gap-10 md:grid-cols-12">
          <div className="md:col-span-4">
            <span className="font-display uppercase label-xs text-burgundy">
              Two fonts · one job
            </span>
            <h3 className="mt-3 font-display text-heading-s uppercase tracking-[0.04em] text-accent-dark">
              Pick by job, not by surface.
            </h3>
            <p className="mt-2 font-sans text-caption leading-snug text-accent-dark/70">
              Saira is the voice that shouts: display, hero moments, short labels, chips, buttons. Nunito is the voice that reads: body, captions, leads, lists. Cap Saira at four words or fewer; anything longer becomes a Nunito sentence. Italic stays reserved for true emphasis on a single phrase, never as a default body voice.
            </p>
          </div>

          <div className="md:col-span-8 grid grid-cols-1 gap-4 md:grid-cols-2">
            <div className="rounded-2xl border border-deep-teal/30 bg-deep-teal/[0.04] p-6">
              <div className="font-display uppercase label-xs text-deep-teal">
                Saira · display + labels
              </div>
              <ul className="mt-4 space-y-2 font-sans text-body-s leading-snug text-accent-dark">
                <li>· Hero and section headlines</li>
                <li>· Chip and tag labels, eyebrows</li>
                <li>· Button labels (uppercase)</li>
                <li>· Short pull-quotes (≤ 4 words)</li>
                <li>· Stat numerics (tabular)</li>
              </ul>
            </div>
            <div className="rounded-2xl border border-burgundy/30 bg-burgundy/[0.04] p-6">
              <div className="font-display uppercase label-xs text-burgundy">
                Nunito · everything you read
              </div>
              <ul className="mt-4 space-y-2 font-sans text-body-s leading-snug text-accent-dark">
                <li>· Body copy across site and app</li>
                <li>· Captions, attributions, footnotes</li>
                <li>· Section leads and intros</li>
                <li>· Manifesto and character quotes</li>
                <li>· Form labels and helper text</li>
              </ul>
            </div>
          </div>
        </div>

        {/* brevity / numerics / arabic notes */}
        <div className="grid grid-cols-1 gap-6 md:grid-cols-3">
          <div className="rounded-2xl border border-accent-dark/10 bg-cream/40 p-6 backdrop-blur">
            <span className="font-display uppercase label-xs text-burgundy">Rule</span>
            <h4 className="mt-2 font-display uppercase text-heading-s tracking-[0.04em] text-accent-dark">
              Tabular numerics for stats
            </h4>
            <p className="mt-3 font-sans text-caption leading-snug text-accent-dark/70">
              Counts, totals, and ages use Saira <span className="font-display [font-variant-numeric:tabular-nums]">tabular-nums</span> so columns align without manual nudging.
            </p>
            <div className="mt-4 flex items-center gap-4 font-display text-heading-l font-black text-accent-dark [font-variant-numeric:tabular-nums]">
              <span>42</span>
              <span className="opacity-30">·</span>
              <span>1,000</span>
              <span className="opacity-30">·</span>
              <span>170</span>
            </div>
          </div>

          <div className="rounded-2xl border border-accent-dark/10 bg-cream/40 p-6 backdrop-blur">
            <span className="font-display uppercase label-xs text-burgundy">Rule</span>
            <h4 className="mt-2 font-display uppercase text-heading-s tracking-[0.04em] text-accent-dark">
              Label readability floor
            </h4>
            <p className="mt-3 font-sans text-caption leading-snug text-accent-dark/70">
              <span className="font-display">.label-xs</span> 13px / 0.18em · <span className="font-display">.label-sm</span> 14px / 0.16em · <span className="font-display">.label-md</span> 15px / 0.14em. Apply alongside <span className="font-display">font-display uppercase</span>. Two-tier rule: consumer surfaces (landing, app) start at <span className="font-display">.label-sm</span>; <span className="font-display">.label-xs</span> is spec-only. Opacity stays ≥ 70% on any small label.
            </p>
          </div>

          <div className="rounded-2xl border border-accent-dark/10 bg-cream/40 p-6 backdrop-blur">
            <span className="font-display uppercase label-xs text-burgundy">Future</span>
            <h4 className="mt-2 font-display uppercase text-heading-s tracking-[0.04em] text-accent-dark">
              Arabic pair · Tajawal
            </h4>
            <p className="mt-3 font-sans text-caption leading-snug text-accent-dark/70">
              Tajawal is loaded but disabled while the site is English-only. Re-enable in <span className="font-display">app/layout.tsx</span> when the Arabic locale ships. Brevity and exclamation rules need a translation pass first.
            </p>
          </div>
        </div>
      </div>

      <Annotation
        size="xs"
        position="tr"
        tone="dark"
        n="04"
        title="TYPOGRAPHY"
        caption="Two fonts, one job each. Saira shouts, Nunito reads. Built for kids 7–14, sentence case, no italic body."
      />
    </section>
  );
}
