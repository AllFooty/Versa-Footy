"use client";

import { motion } from "motion/react";
import { EASE_VERSA } from "../../../../_data/motion";
import { Annotation } from "../../../../_components/primitives/Annotation";
import { Chip } from "../../../../_components/primitives/Chip";

type Step = { token: string; px: number; use: string };

const spacing: Step[] = [
  { token: "--spacing-1", px: 4, use: "Hairlines · icon nudges · 1-px gaps" },
  { token: "--spacing-2", px: 8, use: "Chip padding · tight inline gaps" },
  { token: "--spacing-3", px: 12, use: "Form-row gaps · button inner space" },
  { token: "--spacing-4", px: 16, use: "Card padding · default block gap" },
  { token: "--spacing-5", px: 24, use: "Section-internal rhythm" },
  { token: "--spacing-6", px: 32, use: "Card-to-card on dense layouts" },
  { token: "--spacing-7", px: 48, use: "Block separators · grid gaps" },
  { token: "--spacing-8", px: 64, use: "Major section breathing" },
];

const radii = [
  { token: "--radius-sm", px: 8, sample: "rounded-lg", use: "Chips · inline tags" },
  { token: "--radius-md", px: 16, sample: "rounded-2xl", use: "Cards · containers · inputs" },
  { token: "--radius-lg", px: 24, sample: "rounded-3xl", use: "Hero cards · feature panels" },
  { token: "--radius-full", px: 9999, sample: "rounded-full", use: "Buttons · pill inputs · avatars" },
];

const elevations = [
  {
    token: "--elevation-rest",
    box: "0 0 0 0 rgba(36,23,15,0)",
    use: "Default · flat surfaces, no shadow",
  },
  {
    token: "--elevation-raised",
    box: "0 8px 24px -8px rgba(36,23,15,0.18)",
    use: "Hover · subtle lift on cards and buttons",
  },
  {
    token: "--elevation-floating",
    box: "0 30px 60px -30px rgba(36,23,15,0.45)",
    use: "Modals · dossier panels · the dramatic lift",
  },
];

const breakpoints = [
  { token: "--bp-sm", px: 640, label: "phone landscape" },
  { token: "--bp-md", px: 768, label: "tablet portrait" },
  { token: "--bp-lg", px: 1024, label: "tablet landscape · small laptop" },
  { token: "--bp-xl", px: 1280, label: "desktop · default reading width" },
  { token: "--container-max", px: 1500, label: "section container ceiling" },
];

export function FoundationsSection() {
  return (
    <section
      id="foundations"
      className="relative isolate w-full overflow-hidden bg-cream py-28"
    >
      <div aria-hidden className="bg-noise absolute inset-0 opacity-20" />

      <div className="relative z-10 mx-auto flex w-full max-w-[1500px] flex-col gap-20 px-6 md:px-10 lg:px-16">
        {/* header */}
        <div className="grid grid-cols-1 gap-8 md:grid-cols-12">
          <div className="md:col-span-4">
            <Chip tone="burgundy" size="xs">
              02 · Foundations
            </Chip>
            <h2 className="mt-4 font-display font-black uppercase leading-[0.95] text-accent-dark text-[clamp(36px,5vw,72px)] tracking-[-0.02em]">
              Four-base spacing.
              <span className="block">Three-tier elevation.</span>
              <span className="block text-burgundy">One container.</span>
            </h2>
          </div>
          <div className="md:col-span-8 md:pt-2">
            <p className="font-sans text-[clamp(15px,1.4vw,19px)] leading-snug text-warm-shadow">
              The substrate the whole brand sits on. Spacing in fours, radii in named tiers, elevation in three steps. Every component on every section above is built from this. Engineering uses the tokens directly, design judgments stay inside them.
            </p>
            <div className="mt-6 flex flex-wrap items-center gap-3 font-display uppercase label-xs text-accent-dark/70">
              <Chip tone="outline" size="xs">4-base spacing</Chip>
              <Chip tone="outline" size="xs">4 radius steps</Chip>
              <Chip tone="outline" size="xs">3 elevations</Chip>
              <Chip tone="outline" size="xs">Real CSS vars</Chip>
            </div>
          </div>
        </div>

        {/* spacing scale */}
        <div className="flex flex-col gap-6">
          <div className="flex items-baseline justify-between">
            <h3 className="font-display uppercase text-heading-s tracking-[0.04em] text-accent-dark">
              Spacing scale · 8 steps
            </h3>
            <span className="font-display uppercase label-xs text-accent-dark/70">
              4 · 8 · 12 · 16 · 24 · 32 · 48 · 64
            </span>
          </div>

          <div className="overflow-hidden rounded-2xl border border-accent-dark/10 bg-cream/30 backdrop-blur">
            {spacing.map((s, i) => (
              <motion.div
                key={s.token}
                initial={{ opacity: 0, y: 12 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true, margin: "-10% 0px" }}
                transition={{ duration: 0.5, delay: i * 0.04, ease: EASE_VERSA }}
                className={`grid grid-cols-1 items-center gap-4 px-6 py-5 md:grid-cols-12 md:gap-6 md:px-8 ${
                  i < spacing.length - 1 ? "border-b border-accent-dark/10" : ""
                }`}
              >
                <div className="md:col-span-3">
                  <div className="font-display uppercase label-xs text-burgundy">
                    {s.token}
                  </div>
                  <div className="mt-1 font-display text-heading-s font-black text-accent-dark [font-variant-numeric:tabular-nums]">
                    {s.px}
                    <span className="ml-1 font-display text-[12px] font-normal text-accent-dark/70">
                      px
                    </span>
                  </div>
                </div>
                <div className="md:col-span-6">
                  <div className="flex items-center">
                    <div
                      className="h-3 rounded-full bg-burgundy/80"
                      style={{ width: `${s.px}px` }}
                      aria-hidden
                    />
                  </div>
                </div>
                <div className="md:col-span-3">
                  <p className="font-sans text-caption leading-snug text-accent-dark/70">
                    {s.use}
                  </p>
                </div>
              </motion.div>
            ))}
          </div>
        </div>

        {/* radius scale */}
        <div className="flex flex-col gap-6">
          <div className="flex items-baseline justify-between">
            <h3 className="font-display uppercase text-heading-s tracking-[0.04em] text-accent-dark">
              Radius scale · 4 steps
            </h3>
            <span className="font-display uppercase label-xs text-accent-dark/70">
              Cards default to md
            </span>
          </div>

          <div className="grid grid-cols-2 gap-3 md:grid-cols-4">
            {radii.map((r, i) => (
              <motion.div
                key={r.token}
                initial={{ opacity: 0, y: 18 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true, margin: "-10% 0px" }}
                transition={{ duration: 0.6, delay: i * 0.06, ease: EASE_VERSA }}
                className="overflow-hidden rounded-2xl border border-accent-dark/10 bg-cream/40 p-5 backdrop-blur"
              >
                <span className="font-display uppercase label-xs text-burgundy">
                  {r.token}
                </span>
                <div className="mt-3 flex items-end justify-center">
                  <div
                    className="h-20 w-20 border border-accent-dark/40 bg-glyph-gold/30"
                    style={{
                      borderRadius:
                        r.px >= 9999 ? "9999px" : `${r.px}px`,
                    }}
                    aria-hidden
                  />
                </div>
                <div className="mt-4">
                  <div className="font-display text-body-s font-black text-accent-dark [font-variant-numeric:tabular-nums]">
                    {r.px >= 9999 ? "∞" : `${r.px}px`}
                    <span className="ml-2 font-display text-[12px] font-normal text-accent-dark/70">
                      {r.sample}
                    </span>
                  </div>
                  <p className="mt-2 font-sans text-caption leading-snug text-accent-dark/70">
                    {r.use}
                  </p>
                </div>
              </motion.div>
            ))}
          </div>
        </div>

        {/* elevation */}
        <div className="flex flex-col gap-6">
          <div className="flex items-baseline justify-between">
            <h3 className="font-display uppercase text-heading-s tracking-[0.04em] text-accent-dark">
              Elevation · 3 tiers
            </h3>
            <span className="font-display uppercase label-xs text-accent-dark/70">
              Rest · raised · floating
            </span>
          </div>

          <div className="grid grid-cols-1 gap-4 md:grid-cols-3">
            {elevations.map((e, i) => (
              <motion.div
                key={e.token}
                initial={{ opacity: 0, y: 18 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true, margin: "-10% 0px" }}
                transition={{ duration: 0.6, delay: i * 0.08, ease: EASE_VERSA }}
                className="rounded-2xl border border-accent-dark/10 bg-cream/40 p-6 backdrop-blur"
              >
                <span className="font-display uppercase label-xs text-burgundy">
                  {e.token.replace("--elevation-", "")}
                </span>
                <div className="mt-5 flex items-center justify-center py-6">
                  <div
                    className="h-20 w-32 rounded-2xl bg-cream"
                    style={{ boxShadow: e.box }}
                    aria-hidden
                  />
                </div>
                <p className="mt-3 font-sans text-caption leading-snug text-accent-dark/70">
                  {e.use}
                </p>
              </motion.div>
            ))}
          </div>
        </div>

        {/* breakpoints + container */}
        <div className="grid grid-cols-1 gap-10 md:grid-cols-12">
          <div className="md:col-span-4">
            <span className="font-display uppercase label-xs text-burgundy">
              Breakpoints + container
            </span>
            <h3 className="mt-3 font-display uppercase text-heading-s tracking-[0.04em] text-accent-dark">
              Container caps at 1500.
            </h3>
            <p className="mt-3 font-sans text-caption leading-snug text-accent-dark/70">
              Tailwind drives the utilities. These tokens are the reference values, useful when motion config, JS measurement, or a custom CSS rule needs to match Tailwind&apos;s breakpoint math.
            </p>
          </div>
          <div className="md:col-span-8">
            <div className="overflow-hidden rounded-2xl border border-accent-dark/10 bg-cream/30 backdrop-blur">
              {breakpoints.map((b, i) => (
                <div
                  key={b.token}
                  className={`grid grid-cols-1 gap-3 px-6 py-4 md:grid-cols-12 md:px-8 ${
                    i < breakpoints.length - 1 ? "border-b border-accent-dark/10" : ""
                  }`}
                >
                  <div className="md:col-span-4">
                    <span className="font-display label-sm uppercase text-burgundy">
                      {b.token}
                    </span>
                  </div>
                  <div className="md:col-span-3 md:text-right">
                    <span className="font-display text-heading-s font-black text-accent-dark [font-variant-numeric:tabular-nums]">
                      {b.px}
                      <span className="ml-1 font-display text-[12px] font-normal text-accent-dark/70">
                        px
                      </span>
                    </span>
                  </div>
                  <div className="md:col-span-5">
                    <p className="font-sans text-caption leading-snug text-accent-dark/70">
                      {b.label}
                    </p>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* touch-target note */}
        <div className="grid grid-cols-1 gap-6 md:grid-cols-2">
          <div className="rounded-2xl border border-deep-teal/30 bg-deep-teal/[0.04] p-6">
            <span className="font-display uppercase label-xs text-deep-teal">
              Rule · touch targets
            </span>
            <h4 className="mt-2 font-display uppercase text-heading-s tracking-[0.04em] text-accent-dark">
              44 iOS · 48 Android
            </h4>
            <p className="mt-3 font-sans text-caption leading-snug text-accent-dark/70">
              Any tappable element on the app meets platform minimums. On web, primary CTAs use lg buttons (h-14 = 56px). Hit areas may extend beyond visible bounds for small icons.
            </p>
          </div>
          <div className="rounded-2xl border border-deep-teal/30 bg-deep-teal/[0.04] p-6">
            <span className="font-display uppercase label-xs text-deep-teal">
              Rule · grid
            </span>
            <h4 className="mt-2 font-display uppercase text-heading-s tracking-[0.04em] text-accent-dark">
              12-column grid · gap 24px
            </h4>
            <p className="mt-3 font-sans text-caption leading-snug text-accent-dark/70">
              Sections use a 12-column grid with <span className="font-display">md:gap-10</span> (40px) by default. Mobile collapses to a single column. Container max-width is <span className="font-display">--container-max</span>.
            </p>
          </div>
        </div>
      </div>

      <Annotation
        size="xs"
        position="tr"
        tone="dark"
        n="02"
        title="FOUNDATIONS"
        caption="The substrate. Spacing in fours, radii in tiers, elevation in three. Real CSS vars."
      />
    </section>
  );
}
