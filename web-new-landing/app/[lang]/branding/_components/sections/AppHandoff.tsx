"use client";

import { motion } from "motion/react";
import { EASE_VERSA } from "../../../../_data/motion";
import { Annotation } from "../../../../_components/primitives/Annotation";
import { Chip } from "../../../../_components/primitives/Chip";

const pendingComponents = [
  { name: "Drill card", note: "Title, type, duration, mastery state, thumbnail. The unit of work." },
  { name: "Bottom tab bar", note: "Home, Training, Mastery, Versa. Native iOS / Android conventions." },
  { name: "Modal sheet", note: "Bottom-drawer pattern. Drag handle. Spring open, ease close." },
  { name: "Streak indicator", note: "Number + flame glyph. Goes red after 24 hours away." },
  { name: "Avatar", note: "Round, illustrated. Status dot (active / resting / sulking)." },
  { name: "Toggle · switch", note: "On / off. Track and thumb. Pull from Lucide if available." },
  { name: "Slider", note: "Self-assessment scale. 1–10 with mastery-bar gradient fill." },
  { name: "Skeleton loader", note: "Shimmer-free pulse. Calm. Doesn't compete with content." },
  { name: "Empty state", note: "Versa pose + one-line message + action. Default: versa-resting." },
  { name: "Onboarding step indicator", note: "Progress beads. Filled / current / unfilled tones." },
];

const openQuestions = [
  {
    title: "Motion travel list",
    body: "Which animations cross from /landing to /app? versa-breathe and pulse-cta are obvious yes; wing-flare becomes triggered (idle→active, level-up, streak earned). The full list is decided when app design starts.",
  },
  {
    title: "Arabic voice translation",
    body: "How do “we are brief” + “no exclamation marks” map to Arabic rhetorical norms? The Arabic locale is split off as future work, this question rides with it.",
  },
  {
    title: "Dark monochrome logo",
    body: "A dark single-color variant of the logo is on the commission list, needed for light-on-light contexts (white paper on cream, invoice templates, embossed print).",
  },
  {
    title: "App icon final",
    body: "app/icon.png and app/apple-icon.png are in place but uncommitted. Lock the cropping + the safe-area inside the iOS rounded-square mask before App Store submission.",
  },
];

export function AppHandoffSection() {
  return (
    <section
      id="app-handoff"
      className="relative isolate w-full overflow-hidden py-28"
      style={{
        background:
          "linear-gradient(180deg, #FAF6EE 0%, #FAF6EE 40%, #0D5959 100%)",
      }}
    >
      <div aria-hidden className="bg-noise absolute inset-0 opacity-15 mix-blend-overlay" />

      <div className="relative z-10 mx-auto flex w-full max-w-[1500px] flex-col gap-20 px-6 md:px-10 lg:px-16">
        {/* header */}
        <div className="grid grid-cols-1 gap-8 md:grid-cols-12">
          <div className="md:col-span-4">
            <Chip tone="burgundy" size="xs">
              Phase 2 · App handoff
            </Chip>
            <h2 className="mt-4 font-display font-black uppercase leading-[0.95] text-accent-dark text-[clamp(36px,5vw,72px)] tracking-[-0.02em]">
              Ghosted in.
              <span className="block">Filled in</span>
              <span className="block text-burgundy">when the app starts.</span>
            </h2>
          </div>
          <div className="md:col-span-8 md:pt-2">
            <p className="font-sans text-[clamp(15px,1.4vw,19px)] leading-snug text-warm-shadow">
              These are the components the mobile app will need that the landing page doesn&apos;t. They&apos;re listed by name with a one-line brief, not spec&apos;d yet. When app design begins, this section becomes a real section with examples and rules.
            </p>
          </div>
        </div>

        {/* pending components — ghost cards */}
        <div className="flex flex-col gap-6">
          <div className="flex items-baseline justify-between">
            <h3 className="font-display uppercase text-heading-s tracking-[0.04em] text-accent-dark">
              Pending components
            </h3>
            <span className="font-display uppercase label-xs text-accent-dark/70">
              Briefs · not specs · yet
            </span>
          </div>
          <div className="grid grid-cols-1 gap-3 md:grid-cols-2 lg:grid-cols-3">
            {pendingComponents.map((c, i) => (
              <motion.div
                key={c.name}
                initial={{ opacity: 0, y: 18 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true, margin: "-10% 0px" }}
                transition={{ duration: 0.5, delay: i * 0.04, ease: EASE_VERSA }}
                className="rounded-2xl border border-dashed border-accent-dark/25 bg-cream/30 p-5 backdrop-blur"
              >
                <div className="flex items-baseline justify-between">
                  <span className="font-display label-sm uppercase text-accent-dark">
                    {c.name}
                  </span>
                  <span className="font-display label-xs uppercase text-burgundy">
                    pending
                  </span>
                </div>
                <p className="mt-3 font-sans text-caption leading-snug text-accent-dark/70">
                  {c.note}
                </p>
              </motion.div>
            ))}
          </div>
        </div>

        {/* open questions */}
        <div className="flex flex-col gap-6">
          <div className="flex items-baseline justify-between">
            <h3 className="font-display uppercase text-heading-s tracking-[0.04em] text-cream/85">
              Open questions
            </h3>
            <span className="font-display uppercase label-xs text-cream/70">
              Resolved at app handoff
            </span>
          </div>
          <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
            {openQuestions.map((q, i) => (
              <motion.div
                key={q.title}
                initial={{ opacity: 0, y: 18 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true, margin: "-10% 0px" }}
                transition={{ duration: 0.6, delay: i * 0.06, ease: EASE_VERSA }}
                className="rounded-2xl border border-cream/15 bg-darker-teal/40 p-6 backdrop-blur"
              >
                <span className="font-display uppercase label-xs text-glyph-gold">
                  Open · {String(i + 1).padStart(2, "0")}
                </span>
                <h4 className="mt-2 font-display uppercase text-heading-s tracking-[0.04em] text-cream">
                  {q.title}
                </h4>
                <p className="mt-3 font-sans text-[13.5px] leading-snug text-cream/75">
                  {q.body}
                </p>
              </motion.div>
            ))}
          </div>
        </div>

        {/* colophon footer */}
        <div className="mt-10 flex flex-col items-center gap-6 border-t border-cream/15 pt-12 text-center">
          <span className="font-display uppercase label-xs text-glyph-gold">
            Brand System · v1.0
          </span>
          <p className="max-w-2xl font-sans text-[clamp(15px,1.4vw,19px)] leading-snug text-cream/75">
            A living spec. Eight pillars. Locked 2026-05-13. Updated by the founding designer. Mobile-app handoff begins when the app design starts.
          </p>
          <div className="flex flex-wrap items-center justify-center gap-x-6 gap-y-2 font-display uppercase label-xs text-cream/70">
            <span>An All Footy company</span>
            <span className="opacity-40">·</span>
            <span>Riyadh 2026</span>
            <span className="opacity-40">·</span>
            <a href="/" className="hover:text-glyph-gold transition-colors">
              ← Back to versafooty.com
            </a>
            <span className="opacity-40">·</span>
            <a href="/branding" className="hover:text-glyph-gold transition-colors">
              See the brand system
            </a>
          </div>
        </div>
      </div>

      <Annotation
        size="xs"
        position="tr"
        tone="cream"
        n="09"
        title="APP HANDOFF"
        caption="Ten components ghosted in. Four open questions parked. Spec ends here for now."
      />
    </section>
  );
}
