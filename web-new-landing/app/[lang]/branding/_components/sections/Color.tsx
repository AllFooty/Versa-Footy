"use client";

import { motion } from "motion/react";
import { EASE_VERSA } from "../../../../_data/motion";
import { useState } from "react";
import { Annotation } from "../../../../_components/primitives/Annotation";
import { Chip } from "../../../../_components/primitives/Chip";

type Swatch = {
  name: string;
  hex: string;
  rule: string;
  ink: "light" | "dark";
};

const palette: Swatch[] = [
  { name: "Cream", hex: "#FAF6EE", rule: "Background base · the cream the whole brand sits on", ink: "dark" },
  { name: "Body Gold", hex: "#E8A93C", rule: "Versa's body · warm anchor · also Warning state", ink: "dark" },
  { name: "Shadow Plumage", hex: "#BB5A2B", rule: "Versa's shadow · general warm shadow surface", ink: "light" },
  { name: "Deep Teal", hex: "#147373", rule: "PRIMARY CTA · primary brand cool · also Info state", ink: "light" },
  { name: "Darker Teal", hex: "#0D5959", rule: "Deeper hierarchy · backgrounds below jersey", ink: "light" },
  { name: "Burgundy", hex: "#7A1F2E", rule: "Editorial accent: eyebrows, accent phrases, callouts. Voice, not action.", ink: "light" },
  { name: "Glyph Gold", hex: "#FFD24A", rule: "Logo · cinematic highlights · focus rings · accents (not the primary CTA)", ink: "dark" },
  { name: "Accent Dark", hex: "#24170F", rule: "Type · serious tone", ink: "light" },
];

const states = [
  { name: "Success", hex: "#9CA856", note: "Pistachio sage. New token. Distinct from the gold CTA." },
  { name: "Error", hex: "#B5301F", note: "Crimson. Warmer than burgundy, no conflict." },
  { name: "Warning", hex: "#E8A93C", note: "= Body Gold (reuse)." },
  { name: "Info", hex: "#147373", note: "= Deep Teal (reuse)." },
];

export function ColorSection() {
  const [active, setActive] = useState<number | null>(null);

  return (
    <section
      id="color"
      className="relative isolate w-full overflow-hidden bg-cream py-28"
    >
      <div aria-hidden className="bg-noise absolute inset-0 opacity-20" />

      <div className="relative z-10 mx-auto flex w-full max-w-[1500px] flex-col gap-20 px-6 md:px-10 lg:px-16">
        {/* header */}
        <div className="grid grid-cols-1 gap-8 md:grid-cols-12">
          <div className="md:col-span-4">
            <Chip tone="burgundy" size="xs">
              03 · Color
            </Chip>
            <h2 className="mt-4 font-display font-black uppercase leading-[0.95] text-accent-dark text-[clamp(36px,5vw,72px)] tracking-[-0.02em]">
              Warm shadows.
              <span className="block">Cool brand.</span>
              <span className="block text-burgundy">Salt for emphasis.</span>
            </h2>
          </div>
          <div className="md:col-span-8 md:pt-2">
            <p className="font-sans text-[clamp(15px,1.4vw,19px)] leading-snug text-warm-shadow">
              The system rests on cream, anchored in golds and teals, lifted by burgundy used sparingly. Deep Teal carries primary actions: grounded, cool, authoritative. Burgundy stays as the editorial accent, and Glyph Gold lights the logo, focus rings, and moments of mastery. Token names stay poetic; the rules below say what they actually do.
            </p>
            <div className="mt-6 flex flex-wrap items-center gap-3 font-display uppercase label-xs text-accent-dark/70">
              <Chip tone="outline" size="xs">No cool grays</Chip>
              <Chip tone="outline" size="xs">No neon</Chip>
              <Chip tone="outline" size="xs">Warm shadows only</Chip>
            </div>
          </div>
        </div>

        {/* palette */}
        <div className="flex flex-col gap-8">
          <div className="flex items-baseline justify-between">
            <h3 className="font-display uppercase text-heading-s tracking-[0.04em] text-accent-dark">
              The palette · 8 swatches
            </h3>
            <span className="font-display uppercase label-xs text-accent-dark/70">
              Hover for use rule
            </span>
          </div>

          <div className="grid grid-cols-2 gap-3 md:grid-cols-4">
            {palette.map((s, i) => (
              <motion.button
                key={s.hex}
                type="button"
                onMouseEnter={() => setActive(i)}
                onMouseLeave={() => setActive(null)}
                onFocus={() => setActive(i)}
                onBlur={() => setActive(null)}
                aria-label={`${s.name} ${s.hex}: ${s.rule}`}
                initial={{ opacity: 0, y: 18 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true, margin: "-10% 0px" }}
                transition={{ duration: 0.7, delay: i * 0.05, ease: EASE_VERSA }}
                className="group relative aspect-[4/5] overflow-hidden rounded-2xl text-left transition-transform duration-medium hover:-translate-y-1 focus:outline-none focus-visible:ring-2 focus-visible:ring-accent-dark focus-visible:ring-offset-2 focus-visible:ring-offset-cream"
                style={{ background: s.hex }}
              >
                <div
                  aria-hidden
                  className="absolute inset-0 opacity-0 transition-opacity duration-medium group-hover:opacity-60"
                  style={{
                    background:
                      "radial-gradient(80% 80% at 50% 0%, rgba(255,255,255,0.4), transparent 70%)",
                  }}
                />
                <div className="absolute inset-0 flex flex-col justify-between p-4">
                  <div
                    className={`flex items-center justify-between font-display uppercase label-xs ${
                      s.ink === "light" ? "text-cream" : "text-accent-dark"
                    }`}
                  >
                    <span>{s.name}</span>
                    <span className="opacity-60">{String(i + 1).padStart(2, "0")}</span>
                  </div>
                  <div
                    className={`${
                      s.ink === "light" ? "text-cream" : "text-accent-dark"
                    }`}
                  >
                    <div className="font-display text-body-s font-black tracking-[0.04em]">
                      {s.hex}
                    </div>
                    <div className="mt-1 font-sans text-caption opacity-85 leading-snug">
                      {s.rule}
                    </div>
                  </div>
                </div>
              </motion.button>
            ))}
          </div>

          <div className="flex items-center justify-between rounded-2xl border border-burgundy/40 bg-burgundy/5 px-5 py-3">
            <span className="font-display uppercase label-xs text-burgundy">
              ◆ Poetic names · literal rules
            </span>
            <span className="hidden font-sans text-body-s text-warm-shadow md:inline">
              {active !== null
                ? `${palette[active].name}: ${palette[active].rule}`
                : "Hover any tile to read its use rule"}
            </span>
          </div>
        </div>

        {/* burgundy rule — sanctioned editorial accent */}
        <div className="grid grid-cols-1 gap-10 md:grid-cols-12">
          <div className="md:col-span-4">
            <span className="font-display uppercase label-xs text-burgundy">
              The burgundy rule
            </span>
            <h3 className="mt-3 font-display text-heading-s uppercase tracking-[0.04em] text-accent-dark">
              The editorial accent.
            </h3>
            <p className="mt-2 font-sans text-caption leading-snug text-accent-dark/70">
              Burgundy is the brand&rsquo;s editorial signature. It carries voice, not action. The rule is the surface, not the volume.
            </p>
          </div>

          <div className="md:col-span-8 grid grid-cols-1 gap-4 md:grid-cols-2">
            <div className="rounded-2xl border border-deep-teal/30 bg-deep-teal/[0.04] p-6">
              <div className="font-display uppercase label-xs text-deep-teal">
                ✓ Yes: burgundy lives here
              </div>
              <ul className="mt-4 space-y-2 font-sans text-body-s leading-snug text-accent-dark">
                <li>· Section eyebrows + eyebrow chips</li>
                <li>· H2 accent phrases (the third line)</li>
                <li>· Callout-card borders and fills</li>
                <li>· Inline-text emphasis on cream surfaces</li>
              </ul>
            </div>
            <div className="rounded-2xl border border-burgundy/30 bg-burgundy/[0.04] p-6">
              <div className="font-display uppercase label-xs text-burgundy">
                ✗ No: burgundy stays out
              </div>
              <ul className="mt-4 space-y-2 font-sans text-body-s leading-snug text-accent-dark">
                <li>· Buttons of any variant</li>
                <li>· App-screen primary fills</li>
                <li>· Body or content backgrounds</li>
                <li>· Default card surfaces</li>
                <li>· Anywhere it would compete with the primary teal CTA</li>
              </ul>
            </div>
          </div>
        </div>

        {/* state tokens */}
        <div className="grid grid-cols-1 gap-10 md:grid-cols-12">
          <div className="md:col-span-4">
            <span className="font-display uppercase label-xs text-burgundy">
              State tokens
            </span>
            <h3 className="mt-3 font-display text-heading-s uppercase tracking-[0.04em] text-accent-dark">
              Four states.
            </h3>
            <p className="mt-2 font-sans text-caption leading-snug text-accent-dark/70">
              The states the app needs on day one. Success and Error are dedicated colors so the celebration tile never collides with the gold CTA; Warning and Info reuse brand palette tokens.
            </p>
          </div>

          <div className="md:col-span-8">
            <div className="grid grid-cols-2 gap-3 md:grid-cols-4">
              {states.map((s, i) => (
                <motion.div
                  key={s.name}
                  initial={{ opacity: 0, y: 18 }}
                  whileInView={{ opacity: 1, y: 0 }}
                  viewport={{ once: true, margin: "-10% 0px" }}
                  transition={{ duration: 0.7, delay: 0.1 + i * 0.05, ease: EASE_VERSA }}
                  className="overflow-hidden rounded-2xl border border-accent-dark/10 bg-cream/40 backdrop-blur"
                >
                  <div
                    className="h-24 w-full"
                    style={{ background: s.hex }}
                    aria-hidden
                  />
                  <div className="p-4">
                    <div className="flex items-baseline justify-between">
                      <span className="font-display uppercase label-xs text-accent-dark">
                        {s.name}
                      </span>
                      <span className="font-display text-[12px] font-black text-accent-dark/70">
                        {s.hex}
                      </span>
                    </div>
                    <p className="mt-2 font-sans text-caption leading-snug text-accent-dark/70">
                      {s.note}
                    </p>
                  </div>
                </motion.div>
              ))}
            </div>
          </div>
        </div>

      </div>

      <Annotation
        size="xs"
        position="tr"
        tone="dark"
        n="03"
        title="COLOR"
        caption="Eight swatches. Four state tokens. Burgundy is the editorial accent; gold carries action; Success is its own color so it never collides with the CTA."
      />
    </section>
  );
}
