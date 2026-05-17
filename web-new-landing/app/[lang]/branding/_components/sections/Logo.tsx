"use client";

import Image from "next/image";
import { motion } from "motion/react";
import { EASE_VERSA } from "../../../../_data/motion";
import { Annotation } from "../../../../_components/primitives/Annotation";
import { Chip } from "../../../../_components/primitives/Chip";

type Variant = {
  name: string;
  file: string | null;
  background: string;
  contrast: "dark" | "light";
  use: string;
  pending?: boolean;
};

const logoVariants: Variant[] = [
  {
    name: "Full color",
    file: "/versa-lockup-navy.webp",
    background: "#FAF6EE",
    contrast: "dark",
    use: "Primary. Default. Use everywhere contrast allows.",
  },
  {
    name: "Solid white",
    file: "/versa_logo_white_solid_transparent_HD_4096.webp",
    background: "#0D5959",
    contrast: "light",
    use: "Pure silhouette. Tight UI, favicon overlays, watermarks.",
  },
  {
    name: "Detailed white",
    file: "/versa_logo_white_detailed_transparent_HD_4096.webp",
    background: "#24170F",
    contrast: "light",
    use: "White silhouette with inner detail preserved. Monochrome marketing, press kits.",
  },
  {
    name: "Solid dark",
    file: null,
    background: "#FAF6EE",
    contrast: "dark",
    use: "Dark silhouette for light-on-light contexts: white press kits, invoice templates, embossed print. Commission scheduled.",
    pending: true,
  },
];

const wordmarkVariants = [
  {
    name: "Dark wordmark",
    file: "/VERSA_FOOTY_wordmark_accent-dark_24170F_transparent.webp",
    background: "#FAF6EE",
    use: "Use on cream and any light surface.",
  },
  {
    name: "Light wordmark",
    file: "/VERSA_FOOTY_wordmark_white_transparent.webp",
    background: "#0D5959",
    use: "Use on dark and brand-color backgrounds.",
  },
];

export function LogoSection() {
  return (
    <section
      id="logo"
      className="relative isolate w-full overflow-hidden bg-cream py-28"
    >
      <div aria-hidden className="bg-noise absolute inset-0 opacity-20" />

      <div className="relative z-10 mx-auto flex w-full max-w-[1500px] flex-col gap-20 px-6 md:px-10 lg:px-16">
        {/* header */}
        <div className="grid grid-cols-1 gap-8 md:grid-cols-12">
          <div className="md:col-span-4">
            <Chip tone="burgundy" size="xs">
              01 · Logo & Wordmark
            </Chip>
            <h2 className="mt-4 font-display font-black uppercase leading-[0.95] text-accent-dark text-[clamp(36px,5vw,72px)] tracking-[-0.02em]">
              Two marks.
              <span className="block">One brand.</span>
              <span className="block text-burgundy">Together is default.</span>
            </h2>
          </div>
          <div className="md:col-span-8 md:pt-2">
            <p className="font-sans text-[clamp(15px,1.4vw,19px)] leading-snug text-warm-shadow">
              The logo and the wordmark are independent first-class marks. Most surfaces show them together. That is the default lockup. Each can stand alone in exceptions: the logo for app icons and favicons; the wordmark for inline mentions in body copy.
            </p>
          </div>
        </div>

        {/* hero — the lockup default */}
        <motion.div
          initial={{ opacity: 0, y: 24 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true, margin: "-10% 0px" }}
          transition={{ duration: 1, ease: EASE_VERSA }}
          className="relative overflow-hidden rounded-3xl border border-accent-dark/10 bg-cream/40 p-10 backdrop-blur md:p-16"
        >
          <span className="font-display uppercase label-xs text-burgundy">
            Default usage · the lockup
          </span>
          <div className="mt-8 flex flex-col items-center justify-center gap-8 md:flex-row md:gap-12">
            <div className="relative w-[200px] flex-shrink-0 md:w-[260px]">
              <Image
                src="/versa-lockup-navy.webp"
                alt="Versa Footy logo"
                width={520}
                height={520}
                sizes="260px"
                className="h-auto w-full"
              />
            </div>
            <div className="hidden h-32 w-px bg-accent-dark/15 md:block" />
            <div className="block h-px w-32 bg-accent-dark/15 md:hidden" />
            <div className="relative w-[280px] md:w-[420px]">
              <Image
                src="/VERSA_FOOTY_wordmark_accent-dark_24170F_transparent.webp"
                alt="VERSA FOOTY"
                width={1100}
                height={420}
                sizes="(max-width: 768px) 280px, 420px"
                className="h-auto w-full"
              />
            </div>
          </div>
          <p className="mt-10 max-w-2xl font-sans text-[clamp(14px,1.3vw,17px)] leading-snug text-warm-shadow">
            Logo on the left, wordmark to the right. Logo height = 1.0 × wordmark cap-height. Gap between them = 0.5 × logo height. Solo uses are exceptions: app icon and favicon take just the logo; inline body mentions take just the wordmark.
          </p>
        </motion.div>

        {/* logo variants */}
        <div className="flex flex-col gap-8">
          <div className="flex items-baseline justify-between">
            <h3 className="font-display uppercase text-heading-s tracking-[0.04em] text-accent-dark">
              Logo · four variants
            </h3>
            <span className="font-display uppercase label-xs text-accent-dark/70">
              Pick by background
            </span>
          </div>

          <div className="grid grid-cols-1 gap-4 md:grid-cols-2 lg:grid-cols-4">
            {logoVariants.map((v, i) => (
              <motion.div
                key={v.name}
                initial={{ opacity: 0, y: 18 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true, margin: "-10% 0px" }}
                transition={{ duration: 0.6, delay: i * 0.08, ease: EASE_VERSA }}
                className={`overflow-hidden rounded-2xl border ${
                  v.pending
                    ? "border-dashed border-burgundy/40"
                    : "border-accent-dark/10"
                }`}
              >
                <div
                  className="flex aspect-square items-center justify-center"
                  style={{ background: v.background }}
                >
                  {v.file ? (
                    <div className="relative h-[70%] w-[70%]">
                      <Image
                        src={v.file}
                        alt={v.name}
                        fill
                        sizes="320px"
                        className="object-contain"
                      />
                    </div>
                  ) : (
                    <div className="flex flex-col items-center justify-center text-center">
                      <div className="h-20 w-20 rounded-full border-2 border-dashed border-burgundy/50" />
                      <p className="mt-4 font-display uppercase label-xs text-burgundy">
                        Commission scheduled
                      </p>
                    </div>
                  )}
                </div>
                <div className="bg-cream/40 p-5 backdrop-blur">
                  <div className="flex items-baseline justify-between">
                    <span className="font-display uppercase label-xs text-burgundy">
                      {v.name}
                    </span>
                    {v.pending && (
                      <span className="font-display label-xs uppercase text-burgundy">
                        pending
                      </span>
                    )}
                  </div>
                  <p className="mt-2 font-sans text-caption leading-snug text-accent-dark/75">
                    {v.use}
                  </p>
                </div>
              </motion.div>
            ))}
          </div>
        </div>

        {/* wordmark variants */}
        <div className="flex flex-col gap-8">
          <div className="flex items-baseline justify-between">
            <h3 className="font-display uppercase text-heading-s tracking-[0.04em] text-accent-dark">
              Wordmark · two variants
            </h3>
            <span className="font-display uppercase label-xs text-accent-dark/70">
              Custom slab · not Saira
            </span>
          </div>

          <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
            {wordmarkVariants.map((v, i) => (
              <motion.div
                key={v.name}
                initial={{ opacity: 0, y: 18 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true, margin: "-10% 0px" }}
                transition={{ duration: 0.6, delay: i * 0.08, ease: EASE_VERSA }}
                className="overflow-hidden rounded-2xl border border-accent-dark/10"
              >
                <div
                  className="flex aspect-[16/5] items-center justify-center p-8"
                  style={{ background: v.background }}
                >
                  <Image
                    src={v.file}
                    alt={v.name}
                    width={1100}
                    height={420}
                    sizes="(max-width: 768px) 80vw, 420px"
                    className="h-auto w-full max-w-[420px]"
                  />
                </div>
                <div className="bg-cream/40 p-5 backdrop-blur">
                  <span className="font-display uppercase label-xs text-burgundy">
                    {v.name}
                  </span>
                  <p className="mt-2 font-sans text-caption leading-snug text-accent-dark/75">
                    {v.use}
                  </p>
                </div>
              </motion.div>
            ))}
          </div>
        </div>

        {/* clear-space + min-size rules */}
        <div className="grid grid-cols-1 gap-6 md:grid-cols-2">
          {/* clear space */}
          <div className="rounded-2xl border border-accent-dark/10 bg-cream/40 p-8 backdrop-blur">
            <span className="font-display uppercase label-xs text-burgundy">
              Rule · clear space
            </span>
            <h4 className="mt-2 font-display uppercase text-heading-s tracking-[0.04em] text-accent-dark">
              Breathing room
            </h4>

            {/* visualization */}
            <div className="mt-6 relative aspect-[5/3] overflow-hidden rounded-xl border border-dashed border-burgundy/40 bg-cream/30">
              <div className="absolute inset-[15%] rounded-md border border-burgundy/30 bg-burgundy/[0.02]" />
              <div className="absolute inset-0 flex items-center justify-center">
                <Image
                  src="/versa-lockup-navy.webp"
                  alt=""
                  width={200}
                  height={200}
                  sizes="160px"
                  className="h-[60%] w-auto"
                />
              </div>
              <div className="absolute left-[15%] right-[15%] top-1 flex items-center gap-2">
                <span className="h-px flex-1 bg-burgundy/40" />
                <span className="font-display label-xs uppercase text-burgundy/75">0.25 × h</span>
                <span className="h-px flex-1 bg-burgundy/40" />
              </div>
              <div className="absolute bottom-1 left-[15%] right-[15%] flex items-center gap-2">
                <span className="h-px flex-1 bg-burgundy/40" />
                <span className="font-display label-xs uppercase text-burgundy/75">0.25 × h</span>
                <span className="h-px flex-1 bg-burgundy/40" />
              </div>
            </div>

            <ul className="mt-6 space-y-2 font-sans text-body-s leading-snug text-accent-dark/80">
              <li>
                <span className="font-display label-xs uppercase text-burgundy mr-2">Logo</span>
                Clear space = 0.25 × logo height, on all sides
              </li>
              <li>
                <span className="font-display label-xs uppercase text-burgundy mr-2">Wordmark</span>
                Clear space = 1.0 × cap-height of the &ldquo;V&rdquo;
              </li>
              <li>
                <span className="font-display label-xs uppercase text-burgundy mr-2">Lockup</span>
                Gap between marks = 0.5 × logo height
              </li>
            </ul>
          </div>

          {/* min size */}
          <div className="rounded-2xl border border-accent-dark/10 bg-cream/40 p-8 backdrop-blur">
            <span className="font-display uppercase label-xs text-burgundy">
              Rule · minimum size
            </span>
            <h4 className="mt-2 font-display uppercase text-heading-s tracking-[0.04em] text-accent-dark">
              Don&rsquo;t whisper
            </h4>

            <div className="mt-6 flex items-end justify-around rounded-xl border border-accent-dark/10 bg-cream/30 p-6">
              <div className="flex flex-col items-center gap-3">
                <Image
                  src="/versa-lockup-navy.webp"
                  alt=""
                  width={64}
                  height={64}
                  sizes="64px"
                  className="h-16 w-16"
                />
                <span className="font-display label-xs uppercase text-accent-dark/70">
                  Min · 32–64px
                </span>
              </div>
              <div className="flex flex-col items-center gap-3">
                <Image
                  src="/VERSA_FOOTY_wordmark_accent-dark_24170F_transparent.webp"
                  alt=""
                  width={260}
                  height={100}
                  sizes="200px"
                  className="h-auto w-[160px]"
                />
                <span className="font-display label-xs uppercase text-accent-dark/70">
                  Min · 96px wide
                </span>
              </div>
            </div>

            <ul className="mt-6 space-y-2 font-sans text-body-s leading-snug text-accent-dark/80">
              <li>
                <span className="font-display label-xs uppercase text-burgundy mr-2">Logo</span>
                32px (favicon) · 64px (any UI usage)
              </li>
              <li>
                <span className="font-display label-xs uppercase text-burgundy mr-2">Wordmark</span>
                96px wide on web · 32pt wide on print
              </li>
            </ul>
          </div>
        </div>

        {/* wordmark spec — image-only */}
        <div className="grid grid-cols-1 gap-6 md:grid-cols-2">
          <div className="rounded-2xl border border-burgundy/30 bg-burgundy/[0.04] p-6">
            <span className="font-display uppercase label-xs text-burgundy">
              Wordmark · image-only
            </span>
            <h4 className="mt-2 font-display uppercase text-heading-s tracking-[0.04em] text-accent-dark">
              Fixed artwork, not text.
            </h4>
            <p className="mt-3 font-sans text-caption leading-snug text-accent-dark/70">
              The wordmark is a custom slab-italic artwork ship&rsquo;d as <span className="font-display">.webp</span>. It is not text set in a font.
            </p>
            <ul className="mt-3 space-y-1.5 font-sans text-caption leading-snug text-accent-dark/70">
              <li>· No runtime re-setting · use the file as-is</li>
              <li>· Localization needs a new artwork file</li>
              <li>· Backlog: SVG version for sharp scaling</li>
              <li>· Backlog: Arabic wordmark when the locale ships</li>
            </ul>
          </div>
          <div className="rounded-2xl border border-deep-teal/30 bg-deep-teal/[0.04] p-6">
            <span className="font-display uppercase label-xs text-deep-teal">
              Co-brand · All Footy
            </span>
            <h4 className="mt-2 font-display uppercase text-heading-s tracking-[0.04em] text-accent-dark">
              Quiet endorsement.
            </h4>
            <p className="mt-3 font-sans text-caption leading-snug text-accent-dark/70">
              &ldquo;An All Footy company&rdquo; appears in footers, the App Store publisher field, and legal contexts only. Not on hero, not on nav, not on the app splash. Versa Footy stands as its own brand.
            </p>
          </div>
        </div>

        {/* not part of the brand */}
        <div className="rounded-2xl border border-burgundy/30 bg-burgundy/[0.04] p-6">
          <span className="font-display uppercase label-xs text-burgundy">
            Not the brand
          </span>
          <h4 className="mt-2 font-display uppercase text-heading-s tracking-[0.04em] text-accent-dark">
            The V crest glyph.
          </h4>
          <p className="mt-3 max-w-2xl font-sans text-caption leading-snug text-accent-dark/70">
            The chevron + diamond SVG glyph drawn in early concept work is not part of the system. The logo carries the brand glyph role on its own.
          </p>
        </div>
      </div>

      <Annotation
        size="xs"
        position="tr"
        tone="dark"
        n="01"
        title="LOGO & WORDMARK"
        caption="Two marks. Together is the default. Logo height = 1.0 × wordmark cap-height. Gap = 0.5 × logo height."
      />
    </section>
  );
}
