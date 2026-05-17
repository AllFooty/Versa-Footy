"use client";

import Image from "next/image";
import { motion } from "motion/react";
import { EASE_VERSA } from "../../../../_data/motion";
import { Annotation } from "../../../../_components/primitives/Annotation";
import { Chip } from "../../../../_components/primitives/Chip";

type WingPattern = {
  file: string;
  name: string;
  color: string;
  background: string;
};

const wingPatterns: WingPattern[] = [
  {
    file: "/pattern-wing-burgundy.webp",
    name: "pattern-wing-burgundy",
    color: "Burgundy",
    background: "#FAF6EE",
  },
  {
    file: "/pattern-wing-gold.webp",
    name: "pattern-wing-gold",
    color: "Gold",
    background: "#0D5959",
  },
  {
    file: "/pattern-wing-cream.webp",
    name: "pattern-wing-cream",
    color: "Cream",
    background: "#24170F",
  },
  {
    file: "/pattern-wing-teal.webp",
    name: "pattern-wing-teal",
    color: "Teal",
    background: "#FAF6EE",
  },
];

const iconStrategy = [
  {
    bucket: "Utility",
    source: "lucide-react",
    examples: "arrow-right · chevron-down · check · x · plus · menu · search · settings · info",
    note: "Fast, reliable, system-wide. Imported on demand from the Lucide package.",
  },
  {
    bucket: "Brand moment",
    source: "Custom SVG, geometric-tile language",
    examples: "achievement crests · drill-type pictograms · mastery glyphs · streak flame",
    note: "Bespoke. Designed to match the wing-pattern motif. Commission set when app design begins.",
  },
];

const imageryRules = [
  {
    surface: "Marketing site",
    rule: "Versa illustrations only. No kid photos, no instructor photos, no stock.",
  },
  {
    surface: "App home",
    rule: "Versa poses + abstract drill diagrams. No photography.",
  },
  {
    surface: "Drill thumbnails",
    rule: "Stylized illustrations. Geometric, flat, brand-colored.",
  },
  {
    surface: "Achievements",
    rule: "Custom badge illustrations in the geometric-tile language.",
  },
  {
    surface: "User profiles",
    rule: "Character avatars (not photos). Sidesteps consent complexity for under-14 users.",
  },
];

export function PatternsSection() {
  return (
    <section
      id="patterns"
      className="relative isolate w-full overflow-hidden bg-cream py-28"
    >
      <div aria-hidden className="bg-noise absolute inset-0 opacity-20" />

      <div className="relative z-10 mx-auto flex w-full max-w-[1500px] flex-col gap-20 px-6 md:px-10 lg:px-16">
        {/* header */}
        <div className="grid grid-cols-1 gap-8 md:grid-cols-12">
          <div className="md:col-span-4">
            <Chip tone="burgundy" size="xs">
              08 · Patterns & Iconography
            </Chip>
            <h2 className="mt-4 font-display font-black uppercase leading-[0.95] text-accent-dark text-[clamp(36px,5vw,72px)] tracking-[-0.02em]">
              Wings.
              <span className="block">Icons.</span>
              <span className="block text-burgundy">No photos.</span>
            </h2>
          </div>
          <div className="md:col-span-8 md:pt-2">
            <p className="font-sans text-[clamp(15px,1.4vw,19px)] leading-snug text-warm-shadow">
              Four wing-pattern motifs carry the geometric-desert signature, echoing the rhythm of Islamic geometric tradition without quoting any specific motif. Utility icons come from Lucide; brand-moment icons stay custom. Photography is out of scope. The whole brand is illustration.
            </p>
          </div>
        </div>

        {/* wing patterns */}
        <div className="flex flex-col gap-8">
          <div className="flex items-baseline justify-between">
            <h3 className="font-display uppercase text-heading-s tracking-[0.04em] text-accent-dark">
              Wing patterns · four colors
            </h3>
            <span className="font-display uppercase label-xs text-accent-dark/70">
              Atmosphere, not content
            </span>
          </div>

          <div className="grid grid-cols-2 gap-4 md:grid-cols-4">
            {wingPatterns.map((p, i) => (
              <motion.div
                key={p.file}
                initial={{ opacity: 0, y: 18 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true, margin: "-10% 0px" }}
                transition={{ duration: 0.6, delay: i * 0.08, ease: EASE_VERSA }}
                className="overflow-hidden rounded-2xl border border-accent-dark/10"
              >
                <div
                  className="relative aspect-square"
                  style={{ background: p.background }}
                >
                  <Image
                    src={p.file}
                    alt=""
                    fill
                    className="object-cover"
                    sizes="240px"
                  />
                </div>
                <div className="bg-cream/40 p-4 backdrop-blur">
                  <span className="font-display uppercase label-xs text-burgundy">
                    {p.color}
                  </span>
                  <p className="mt-1 font-display label-xs uppercase text-accent-dark">
                    {p.name}
                  </p>
                </div>
              </motion.div>
            ))}
          </div>

          {/* usage rules */}
          <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
            <div className="rounded-2xl border border-deep-teal/30 bg-deep-teal/[0.04] p-6">
              <span className="font-display uppercase label-xs text-deep-teal">
                Rule
              </span>
              <h4 className="mt-2 font-display uppercase text-heading-s tracking-[0.04em] text-accent-dark">
                Max opacity · 0.15
              </h4>
              <p className="mt-3 font-sans text-caption leading-snug text-accent-dark/70">
                Wing patterns are atmosphere, not content. Never push past 0.15 opacity. Most sections use 0.05–0.08.
              </p>
            </div>
            <div className="rounded-2xl border border-deep-teal/30 bg-deep-teal/[0.04] p-6">
              <span className="font-display uppercase label-xs text-deep-teal">
                Rule
              </span>
              <h4 className="mt-2 font-display uppercase text-heading-s tracking-[0.04em] text-accent-dark">
                Corners and edges
              </h4>
              <p className="mt-3 font-sans text-caption leading-snug text-accent-dark/70">
                Patterns frame the content. They never sit dead-center, never compete with the type, never occupy the eyeline.
              </p>
            </div>
          </div>

          <p className="font-sans text-caption leading-snug text-accent-dark/70">
            Color, size, and rotation are designer judgment. The rules above are the only hard constraints.
          </p>

          {/* Islamic geometric tradition note */}
          <div className="rounded-2xl border border-burgundy/30 bg-burgundy/[0.04] p-6">
            <span className="font-display uppercase label-xs text-burgundy">
              The pattern tradition
            </span>
            <h4 className="mt-2 font-display uppercase text-heading-s tracking-[0.04em] text-accent-dark">
              Echoing, not quoting.
            </h4>
            <p className="mt-3 max-w-3xl font-sans text-[13.5px] leading-snug text-accent-dark/75">
              The wing motifs share the rhythm of Islamic geometric tradition: rotational symmetry, interlocking shapes, the sense that the surface continues past the frame. But they never reproduce a specific historical motif. The reference is to a way of building pattern, not to any particular tile in any particular wall.
            </p>
            <p className="mt-3 max-w-3xl font-sans text-[13.5px] leading-snug text-accent-dark/75">
              This matters for the KSA/GCC market: borrowing carelessly from regional craft reads as appropriation. Echoing the rhythm without quoting the source reads as respect.
            </p>
          </div>
        </div>

        {/* icon strategy */}
        <div className="grid grid-cols-1 gap-10 md:grid-cols-12">
          <div className="md:col-span-4">
            <span className="font-display uppercase label-xs text-burgundy">
              Icons · hybrid
            </span>
            <h3 className="mt-3 font-display uppercase text-heading-s tracking-[0.04em] text-accent-dark">
              Lucide for utility.
              <span className="block">Custom for brand.</span>
            </h3>
            <p className="mt-3 font-sans text-caption leading-snug text-accent-dark/70">
              Everything bespoke would burn the budget. Everything system would lose the signature. The split lets us move fast on common icons and slow down on the ones that matter.
            </p>
          </div>
          <div className="md:col-span-8 grid grid-cols-1 gap-4 md:grid-cols-2">
            {iconStrategy.map((s, i) => (
              <motion.div
                key={s.bucket}
                initial={{ opacity: 0, y: 18 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true, margin: "-10% 0px" }}
                transition={{ duration: 0.6, delay: i * 0.08, ease: EASE_VERSA }}
                className="rounded-2xl border border-accent-dark/10 bg-cream/40 p-6 backdrop-blur"
              >
                <span className="font-display uppercase label-xs text-burgundy">
                  {s.bucket}
                </span>
                <h4 className="mt-2 font-display uppercase text-heading-s tracking-[0.04em] text-accent-dark">
                  {s.source}
                </h4>
                <p className="mt-3 font-display text-[13px] tracking-[0.04em] text-accent-dark/70 leading-snug">
                  {s.examples}
                </p>
                <p className="mt-4 font-sans text-caption leading-snug text-accent-dark/75">
                  {s.note}
                </p>
              </motion.div>
            ))}
          </div>
        </div>

        {/* imagery / photography */}
        <div className="grid grid-cols-1 gap-10 md:grid-cols-12">
          <div className="md:col-span-4">
            <span className="font-display uppercase label-xs text-burgundy">
              Imagery · illustration-only
            </span>
            <h3 className="mt-3 font-display uppercase text-heading-s tracking-[0.04em] text-accent-dark">
              No photography.
            </h3>
            <p className="mt-3 font-sans text-caption leading-snug text-accent-dark/70">
              The whole brand is illustrated. This isn&apos;t a stylistic preference, it&apos;s a legal one too. Under-14 users in KSA/GCC means parental consent flows for every photo. Illustration sidesteps that entirely.
            </p>
          </div>
          <div className="md:col-span-8">
            <div className="overflow-hidden rounded-2xl border border-accent-dark/10 bg-cream/30 backdrop-blur">
              {imageryRules.map((r, i) => (
                <div
                  key={r.surface}
                  className={`grid grid-cols-1 gap-3 px-6 py-5 md:grid-cols-12 md:px-8 ${
                    i < imageryRules.length - 1 ? "border-b border-accent-dark/10" : ""
                  }`}
                >
                  <div className="md:col-span-4">
                    <span className="font-display label-sm uppercase text-burgundy">
                      {r.surface}
                    </span>
                  </div>
                  <div className="md:col-span-8">
                    <p className="font-sans text-body-s leading-snug text-accent-dark/80">
                      {r.rule}
                    </p>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* illustration style — passes / doesn't */}
        <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
          <div className="rounded-2xl border border-deep-teal/30 bg-deep-teal/[0.04] p-6">
            <div className="font-display uppercase label-xs text-deep-teal">
              ✓ Passes
            </div>
            <ul className="mt-4 space-y-2 font-sans text-body-s leading-snug text-accent-dark">
              <li>· Flat, brand-colored fills (cream, gold, teal, burgundy)</li>
              <li>· Hand-drawn line weight with visible craft</li>
              <li>· Geometric construction (circles, arcs, polygons)</li>
              <li>· Versa poses with consistent proportions</li>
              <li>· Drill diagrams: pitch shape + arrow + ball, no realism</li>
            </ul>
          </div>
          <div className="rounded-2xl border border-burgundy/30 bg-burgundy/[0.04] p-6">
            <div className="font-display uppercase label-xs text-burgundy">
              ✗ Does not pass
            </div>
            <ul className="mt-4 space-y-2 font-sans text-body-s leading-snug text-accent-dark">
              <li>· Photorealism or gradient-heavy 3D renders</li>
              <li>· Neon palettes, lens flares, &ldquo;sports startup&rdquo; aesthetic</li>
              <li>· Stock photos of children, instructors, or stadiums</li>
              <li>· AI-generated photo-style imagery</li>
              <li>· Cartoon styles that read as childish (we are editorial)</li>
            </ul>
          </div>
        </div>
      </div>

      <Annotation
        size="xs"
        position="tr"
        tone="dark"
        n="08"
        title="PATTERNS & ICONOGRAPHY"
        caption="Wing patterns at corner-only / 0.15 max opacity. Lucide + custom hybrid icons. Illustration-only imagery, echoing not quoting Islamic geometry."
      />
    </section>
  );
}
