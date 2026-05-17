"use client";

import { motion } from "motion/react";
import { EASE_VERSA } from "../../../../_data/motion";
import { Annotation } from "../../../../_components/primitives/Annotation";
import { Chip } from "../../../../_components/primitives/Chip";

// Button v1.3 spec (locked 2026-05-15): primary = Deep Teal.
// Iteration history: v1.0 Glyph Gold (too soft on cream),
// v1.1 Deep Teal (provisional), v1.2 Burgundy (authority but too heavy),
// v1.3 Deep Teal (locked — grounded, cool, authoritative without
// dominating). Burgundy returned to editorial-only ("voice, not action").
// Glyph Gold stays as accent / focus rings / logo.
type ButtonVariant = "primary" | "secondary" | "ghost" | "danger";
type ButtonSize = "md" | "lg";

const v1ButtonVariants: Record<ButtonVariant, string> = {
  primary:
    "bg-deep-teal text-cream hover:-translate-y-0.5 hover:bg-darker-teal hover:shadow-glow-gold",
  secondary:
    "border border-deep-teal/70 text-deep-teal hover:bg-deep-teal hover:text-cream hover:-translate-y-0.5",
  ghost: "text-accent-dark hover:text-burgundy",
  danger:
    "bg-error text-cream hover:-translate-y-0.5 hover:shadow-glow-error",
};

const v1ButtonSizes: Record<ButtonSize, string> = {
  md: "h-11 px-6 text-[13px]",
  lg: "h-14 px-9 text-[14.5px]",
};

function V1Button({
  variant,
  size = "lg",
  children,
}: {
  variant: ButtonVariant;
  size?: ButtonSize;
  children: React.ReactNode;
}) {
  return (
    <button
      type="button"
      className={`inline-flex items-center justify-center gap-2 rounded-full font-display uppercase tracking-[0.16em] transition-all duration-fast ease-out focus:outline-none focus-visible:ring-2 focus-visible:ring-glyph-gold focus-visible:ring-offset-2 focus-visible:ring-offset-cream ${v1ButtonVariants[variant]} ${v1ButtonSizes[size]}`}
    >
      {children}
    </button>
  );
}

export function ComponentsSection() {
  return (
    <section
      id="components"
      className="relative isolate w-full overflow-hidden bg-cream py-28"
    >
      <div aria-hidden className="bg-noise absolute inset-0 opacity-20" />

      <div className="relative z-10 mx-auto flex w-full max-w-[1500px] flex-col gap-20 px-6 md:px-10 lg:px-16">
        {/* header */}
        <div className="grid grid-cols-1 gap-8 md:grid-cols-12">
          <div className="md:col-span-4">
            <Chip tone="burgundy" size="xs">
              07 · Components
            </Chip>
            <h2 className="mt-4 font-display font-black uppercase leading-[0.95] text-accent-dark text-[clamp(36px,5vw,72px)] tracking-[-0.02em]">
              Few primitives.
              <span className="block">Strong rules.</span>
              <span className="block text-burgundy">App-ready.</span>
            </h2>
          </div>
          <div className="md:col-span-8 md:pt-2">
            <p className="font-sans text-[clamp(15px,1.4vw,19px)] leading-snug text-warm-shadow">
              Buttons, chips, inputs, progress, toasts, cards: the pieces both the site and the app draw from. Each one is a real primitive with a single job. Every variant below is backed by a real token; the danger button uses <span className="font-display label-sm text-burgundy">bg-error</span>, the inputs use <span className="font-display label-sm text-burgundy">--color-error</span> for invalid states, focus rings use Glyph Gold.
            </p>
          </div>
        </div>

        {/* buttons */}
        <div className="grid grid-cols-1 gap-10 md:grid-cols-12">
          <div className="md:col-span-4">
            <span className="font-display uppercase label-xs text-burgundy">
              Primitive · Button
            </span>
            <h3 className="mt-3 font-display uppercase text-heading-s tracking-[0.04em] text-accent-dark">
              Four variants.
            </h3>
            <p className="mt-3 font-sans text-caption leading-snug text-accent-dark/70">
              Primary = the action. Secondary = the alternative. Ghost = the quiet. Danger = the destructive. The old &ldquo;gold&rdquo; variant is retired (it was duplicate of the new primary).
            </p>
          </div>
          <div className="md:col-span-8 grid grid-cols-1 gap-4 md:grid-cols-2">
            <div className="rounded-2xl border border-accent-dark/10 bg-cream/40 p-6 backdrop-blur">
              <span className="font-display uppercase label-xs text-accent-dark/70">Primary</span>
              <div className="mt-4 flex flex-wrap items-center gap-3">
                <V1Button variant="primary" size="lg">Join the waitlist</V1Button>
                <V1Button variant="primary" size="md">Start</V1Button>
              </div>
              <p className="mt-4 font-sans text-[12px] leading-snug text-accent-dark/70">
                bg-deep-teal text-cream · the action button
              </p>
            </div>
            <div className="rounded-2xl border border-accent-dark/10 bg-cream/40 p-6 backdrop-blur">
              <span className="font-display uppercase label-xs text-accent-dark/70">Primary · with icon</span>
              <div className="mt-4 flex flex-wrap items-center gap-3">
                <V1Button variant="primary" size="lg"><span aria-hidden>★</span> Master</V1Button>
                <V1Button variant="primary" size="md"><span aria-hidden>▶</span> Start drill</V1Button>
              </div>
              <p className="mt-4 font-sans text-[12px] leading-snug text-accent-dark/70">
                Icon precedes label. Used for in-app mastery moments, the star earns the action.
              </p>
            </div>
            <div className="rounded-2xl border border-accent-dark/10 bg-cream/40 p-6 backdrop-blur">
              <span className="font-display uppercase label-xs text-accent-dark/70">Secondary</span>
              <div className="mt-4 flex flex-wrap items-center gap-3">
                <V1Button variant="secondary" size="lg">Learn more</V1Button>
                <V1Button variant="secondary" size="md">Skip</V1Button>
              </div>
              <p className="mt-4 font-sans text-[12px] leading-snug text-accent-dark/70">
                border-deep-teal text-deep-teal · the alternative
              </p>
            </div>
            <div className="rounded-2xl border border-accent-dark/10 bg-cream/40 p-6 backdrop-blur">
              <span className="font-display uppercase label-xs text-accent-dark/70">Ghost</span>
              <div className="mt-4 flex flex-wrap items-center gap-3">
                <V1Button variant="ghost" size="lg">Cancel</V1Button>
                <V1Button variant="ghost" size="md">Back</V1Button>
              </div>
              <p className="mt-4 font-sans text-[12px] leading-snug text-accent-dark/70">
                text-accent-dark · the quiet
              </p>
            </div>
            <div className="rounded-2xl border border-accent-dark/10 bg-cream/40 p-6 backdrop-blur">
              <span className="font-display uppercase label-xs text-accent-dark/70">Danger · new</span>
              <div className="mt-4 flex flex-wrap items-center gap-3">
                <V1Button variant="danger" size="lg">Delete</V1Button>
                <V1Button variant="danger" size="md">Quit drill</V1Button>
              </div>
              <p className="mt-4 font-sans text-[12px] leading-snug text-accent-dark/70">
                bg-error text-cream · the destructive
              </p>
            </div>
          </div>
        </div>

        {/* chips */}
        <div className="grid grid-cols-1 gap-10 md:grid-cols-12">
          <div className="md:col-span-4">
            <span className="font-display uppercase label-xs text-burgundy">
              Primitive · Chip
            </span>
            <h3 className="mt-3 font-display uppercase text-heading-s tracking-[0.04em] text-accent-dark">
              Six tones.
            </h3>
            <p className="mt-3 font-sans text-caption leading-snug text-accent-dark/70">
              Burgundy is the declared exception to the &ldquo;salt only&rdquo; rule: section-eyebrow chips ARE where burgundy lives freely. Everywhere else, sparingly.
            </p>
          </div>
          <div className="md:col-span-8">
            <div className="rounded-2xl border border-accent-dark/10 bg-cream/40 p-6 backdrop-blur">
              <span className="font-display uppercase label-xs text-accent-dark/70">
                Six tones · three sizes
              </span>
              <div className="mt-5 flex flex-wrap items-center gap-3">
                <Chip tone="burgundy">Mastery 7/10</Chip>
                <Chip tone="gold">Streak 12 days</Chip>
                <Chip tone="teal">New drill</Chip>
                <Chip tone="outline">Level 4</Chip>
                <Chip tone="dark">Coach mode</Chip>
                <Chip tone="cream">Default</Chip>
              </div>
              <div className="mt-5 flex flex-wrap items-center gap-3">
                <Chip tone="burgundy" size="xs">XS · 12px</Chip>
                <Chip tone="burgundy" size="sm">SM · 13px</Chip>
                <Chip tone="burgundy" size="md">MD · 14px</Chip>
              </div>
              <p className="mt-5 font-sans text-[12px] leading-snug text-accent-dark/70">
                Section eyebrows on the brand spec all use <span className="font-display">tone=&quot;burgundy&quot; size=&quot;xs&quot;</span>.
              </p>
            </div>
          </div>
        </div>

        {/* input + waitlist form */}
        <div className="grid grid-cols-1 gap-10 md:grid-cols-12">
          <div className="md:col-span-4">
            <span className="font-display uppercase label-xs text-burgundy">
              Primitive · Input
            </span>
            <h3 className="mt-3 font-display uppercase text-heading-s tracking-[0.04em] text-accent-dark">
              Pill input.
            </h3>
            <p className="mt-3 font-sans text-caption leading-snug text-accent-dark/70">
              Rounded-full. Cream background on dark sections, cream on cream surfaces. Focus ring uses Glyph Gold. Error state uses the new Error token, not Tailwind red.
            </p>
          </div>
          <div className="md:col-span-8 flex flex-col gap-5">
            <div className="rounded-2xl border border-accent-dark/10 bg-cream/40 p-6 backdrop-blur">
              <span className="font-display uppercase label-xs text-accent-dark/70">
                Default
              </span>
              <div className="mt-4 flex items-stretch gap-0 rounded-full border border-accent-dark/15 bg-cream p-1">
                <input
                  placeholder="your.email@stadium.sa"
                  className="flex-1 bg-transparent px-5 font-sans text-body-s text-accent-dark placeholder-accent-dark/70 outline-none"
                />
                <V1Button variant="primary" size="md">Join</V1Button>
              </div>
            </div>
            <div className="rounded-2xl border border-accent-dark/10 bg-cream/40 p-6 backdrop-blur">
              <span className="font-display uppercase label-xs text-accent-dark/70">
                Error · bg-error
              </span>
              <div className="mt-4 flex items-stretch gap-0 rounded-full border border-error/50 bg-error/[0.08] p-1">
                <input
                  defaultValue="not-an-email"
                  className="flex-1 bg-transparent px-5 font-sans text-body-s text-accent-dark outline-none"
                />
                <V1Button variant="primary" size="md">Join</V1Button>
              </div>
              <p className="mt-3 font-sans text-caption text-error">
                That doesn&apos;t look like an email.
              </p>
            </div>
          </div>
        </div>

        {/* progress + stat bars */}
        <div className="grid grid-cols-1 gap-10 md:grid-cols-12">
          <div className="md:col-span-4">
            <span className="font-display uppercase label-xs text-burgundy">
              Primitive · Progress bar
            </span>
            <h3 className="mt-3 font-display uppercase text-heading-s tracking-[0.04em] text-accent-dark">
              Gradient progress.
            </h3>
            <p className="mt-3 font-sans text-caption leading-snug text-accent-dark/70">
              Body Gold → Glyph Gold gradient. Progress climbs into the loudest gold. Action stays in the gold register; burgundy is voice, never volume. The bar is the only place the gradient appears in motion.
            </p>
          </div>
          <div className="md:col-span-8 rounded-2xl border border-accent-dark/10 bg-cream/40 p-6 backdrop-blur">
            {[
              { label: "Almost there", width: 88 },
              { label: "In progress", width: 60 },
              { label: "Just started", width: 25 },
            ].map((m, i) => (
              <motion.div
                key={m.label}
                initial={{ opacity: 0, y: 12 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true, margin: "-10% 0px" }}
                transition={{ duration: 0.6, delay: i * 0.1, ease: EASE_VERSA }}
                className={i > 0 ? "mt-6" : ""}
              >
                <div className="font-display uppercase label-xs text-accent-dark/70">
                  {m.label}
                </div>
                <div className="mt-2 h-[6px] w-full overflow-hidden rounded-full bg-accent-dark/10">
                  <motion.div
                    initial={{ width: "0%" }}
                    whileInView={{ width: `${m.width}%` }}
                    viewport={{ once: true, margin: "-10% 0px" }}
                    transition={{ duration: 1.4, ease: EASE_VERSA }}
                    className="h-full rounded-full"
                    style={{
                      background:
                        "linear-gradient(90deg, #E8A93C 0%, #FFD24A 100%)",
                    }}
                  />
                </div>
              </motion.div>
            ))}
          </div>
        </div>

        {/* toast */}
        <div className="grid grid-cols-1 gap-10 md:grid-cols-12">
          <div className="md:col-span-4">
            <span className="font-display uppercase label-xs text-burgundy">
              Primitive · Toast
            </span>
            <h3 className="mt-3 font-display uppercase text-heading-s tracking-[0.04em] text-accent-dark">
              Versa speaks.
            </h3>
            <p className="mt-3 font-sans text-caption leading-snug text-accent-dark/70">
              Dark background. Gold avatar tile. The label says VERSA in glyph gold. The body always follows the brevity budget: 12 words, 2 sentences.
            </p>
          </div>
          <div className="md:col-span-8 flex flex-col gap-4">
            {[
              { body: "Mastered. Next." },
              { body: "Five days. Don't lose it now." },
              { body: "Close. Adjust your plant foot. Again." },
            ].map((t, i) => (
              <motion.div
                key={i}
                initial={{ opacity: 0, x: -12 }}
                whileInView={{ opacity: 1, x: 0 }}
                viewport={{ once: true, margin: "-10% 0px" }}
                transition={{ duration: 0.6, delay: i * 0.1, ease: EASE_VERSA }}
                className="flex items-center gap-3 rounded-2xl border border-accent-dark/10 bg-accent-dark p-3 text-cream"
              >
                <div className="h-9 w-9 shrink-0 rounded-xl bg-glyph-gold" />
                <div className="flex-1">
                  <div className="font-display uppercase label-xs text-glyph-gold">Versa</div>
                  <div className="font-sans text-body-s">{t.body}</div>
                </div>
              </motion.div>
            ))}
          </div>
        </div>

        {/* card */}
        <div className="grid grid-cols-1 gap-10 md:grid-cols-12">
          <div className="md:col-span-4">
            <span className="font-display uppercase label-xs text-burgundy">
              Primitive · Card
            </span>
            <h3 className="mt-3 font-display uppercase text-heading-s tracking-[0.04em] text-accent-dark">
              Cream on cream.
            </h3>
            <p className="mt-3 font-sans text-caption leading-snug text-accent-dark/70">
              <span className="font-display">rounded-2xl border border-accent-dark/10 bg-cream/40 backdrop-blur</span>. The container almost every other primitive lives inside.
            </p>
          </div>
          <div className="md:col-span-8 grid grid-cols-1 gap-4 md:grid-cols-2">
            <div className="rounded-2xl border border-accent-dark/10 bg-cream/40 p-6 backdrop-blur">
              <span className="font-display uppercase label-xs text-burgundy">Card · default</span>
              <h4 className="mt-2 font-display uppercase text-heading-s tracking-[0.04em] text-accent-dark">
                One container.
              </h4>
              <p className="mt-2 font-sans text-caption leading-snug text-accent-dark/70">
                Used for every grouped block on the site. Hovers gain a subtle lift.
              </p>
            </div>
            <div className="rounded-2xl border border-burgundy/30 bg-burgundy/[0.04] p-6">
              <span className="font-display uppercase label-xs text-burgundy">Card · burgundy</span>
              <h4 className="mt-2 font-display uppercase text-heading-s tracking-[0.04em] text-accent-dark">
                Used for callouts.
              </h4>
              <p className="mt-2 font-sans text-caption leading-snug text-accent-dark/70">
                The exception variant, used for &ldquo;rules&rdquo; and corrections.
              </p>
            </div>
          </div>
        </div>
      </div>

      <Annotation
        size="xs"
        position="tr"
        tone="dark"
        n="07"
        title="COMPONENTS"
        caption="Few primitives, strong rules. Primary is gold; danger is bg-error; progress climbs into the loudest gold."
      />
    </section>
  );
}
