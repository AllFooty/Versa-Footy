"use client";

import { motion } from "motion/react";
import { EASE_VERSA } from "../../../../_data/motion";
import { Annotation } from "../../../../_components/primitives/Annotation";
import { Chip } from "../../../../_components/primitives/Chip";

type Easing = {
  token: string;
  curve: string;
  use: string;
};

const easings: Easing[] = [
  {
    token: "--ease-versa",
    curve: "cubic-bezier(0.22, 1, 0.36, 1)",
    use: "Signature cinematic ease. Default for every reveal, hover, transition. The brand's motion fingerprint.",
  },
  {
    token: "--ease-quick",
    curve: "cubic-bezier(0.4, 0, 0.2, 1)",
    use: "Utility motion. Use only for tight UI feedback (taps, toggles, focus rings) where ease-versa feels slow.",
  },
  {
    token: "--ease-spring",
    curve: "cubic-bezier(0.34, 1.56, 0.64, 1)",
    use: "Overshoot. Used for celebration moments: level-up, mastery earned, streak unlocked.",
  },
];

type Duration = {
  token: string;
  ms: number;
  use: string;
};

const durations: Duration[] = [
  { token: "--duration-fast", ms: 200, use: "Hover · focus · tap feedback" },
  { token: "--duration-medium", ms: 500, use: "Reveals · modals · toasts" },
  { token: "--duration-slow", ms: 1000, use: "Cinematic reveals · hero entrances" },
  { token: "--duration-hero", ms: 1500, use: "Continuous brand motion: breathe, flare, rotate" },
];

type Signature = {
  name: string;
  duration: string;
  scope: string;
  desc: string;
};

const signatures: Signature[] = [
  {
    name: "versa-breathe",
    duration: "4.6s",
    scope: "Flagship · landing + app",
    desc: "Character heartbeat. Scale 1 → 1.012 → 1. Every illustration of Versa runs this.",
  },
  {
    name: "wing-flare",
    duration: "4–5s",
    scope: "Landing continuous · app on-moment",
    desc: "Radial gold glow pulsing around Versa. In-app, triggered only on idle→active, level-up, streak earned.",
  },
  {
    name: "horizon-pulse",
    duration: "6s",
    scope: "Landing only",
    desc: "Stadium horizon translate. Atmosphere. Stays on /.",
  },
  {
    name: "twinkle",
    duration: "3–4s",
    scope: "Landing only",
    desc: "Skill universe star pulsing. Only on the constellation surface.",
  },
  {
    name: "float-y",
    duration: "6s",
    scope: "Landing only",
    desc: "Vertical bob on hero illustrations. Subtle. Lands the character.",
  },
  {
    name: "pulse-cta",
    duration: "2.8s",
    scope: "Landing + app · light surfaces",
    desc: "Burgundy ring around the gold primary CTA. The default pulse on cream and light backgrounds.",
  },
  {
    name: "pulse-cta-dark",
    duration: "2.8s",
    scope: "Landing + app · dark surfaces",
    desc: "Gold ring variant. Use on teal/dark backgrounds where burgundy would disappear.",
  },
  {
    name: "slow-rotate",
    duration: "80–120s",
    scope: "Landing only",
    desc: "Nebula rotation behind cinematic scenes. Glacially slow on purpose.",
  },
];

export function MotionSection() {
  return (
    <section
      id="motion"
      className="relative isolate w-full overflow-hidden bg-cream py-28"
    >
      <div aria-hidden className="bg-noise absolute inset-0 opacity-20" />

      <div className="relative z-10 mx-auto flex w-full max-w-[1500px] flex-col gap-20 px-6 md:px-10 lg:px-16">
        {/* header */}
        <div className="grid grid-cols-1 gap-8 md:grid-cols-12">
          <div className="md:col-span-4">
            <Chip tone="burgundy" size="xs">
              09 · Motion
            </Chip>
            <h2 className="mt-4 font-display font-black uppercase leading-[0.95] text-accent-dark text-[clamp(36px,5vw,72px)] tracking-[-0.02em]">
              Cinematic on the web.
              <span className="block">Responsive in the app.</span>
              <span className="block text-burgundy">One ease curve.</span>
            </h2>
          </div>
          <div className="md:col-span-8 md:pt-2">
            <p className="font-sans text-[clamp(15px,1.4vw,19px)] leading-snug text-warm-shadow">
              The landing page is cinematic by design: particles, breathing, parallax, scroll-scrubs. The app is not. Both inherit the same easing token and the same duration scale, but the app uses them sparingly. <span className="font-display label-sm text-burgundy">--ease-versa</span> is the brand's fingerprint, used everywhere unless there's a specific reason to override.
            </p>
          </div>
        </div>

        {/* live breathe demo */}
        <motion.div
          initial={{ opacity: 0, y: 24 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true, margin: "-10% 0px" }}
          transition={{ duration: 1, ease: EASE_VERSA }}
          className="grid grid-cols-1 gap-8 rounded-3xl border border-accent-dark/10 bg-cream/40 p-8 backdrop-blur md:grid-cols-12 md:gap-10 md:p-12"
        >
          <div className="md:col-span-5 flex flex-col justify-center">
            <span className="font-display uppercase label-xs text-burgundy">
              The flagship motion
            </span>
            <h3 className="mt-3 font-display font-black uppercase text-[clamp(32px,4vw,48px)] leading-[0.95] text-accent-dark tracking-[-0.02em]">
              versa-breathe.
            </h3>
            <p className="mt-4 max-w-md font-sans text-[clamp(15px,1.4vw,18px)] leading-snug text-warm-shadow">
              The heartbeat. Every illustration of Versa scales 1 → 1.012 → 1 over 4.6 seconds. Imperceptible per frame; alive after a beat or two. This is the motion you steal first if you're stealing one.
            </p>
            <div className="mt-6 inline-flex flex-wrap gap-2 font-display uppercase label-xs text-accent-dark/70">
              <span className="rounded-full border border-accent-dark/15 px-3 py-1.5">
                scale 1 → 1.012
              </span>
              <span className="rounded-full border border-accent-dark/15 px-3 py-1.5">
                4.6s infinite
              </span>
              <span className="rounded-full border border-accent-dark/15 px-3 py-1.5">
                ease-in-out
              </span>
            </div>
          </div>
          <div className="md:col-span-7 flex items-center justify-center py-6">
            <div className="relative w-full max-w-[320px]">
              <div
                aria-hidden
                className="absolute -inset-8 rounded-full blur-2xl"
                style={{
                  background:
                    "radial-gradient(closest-side, rgba(255,210,74,0.42), rgba(232,169,60,0.18) 55%, transparent 80%)",
                  animation: "wing-flare 5s ease-in-out infinite",
                }}
              />
              <div
                className="relative aspect-square overflow-hidden rounded-2xl border border-accent-dark/10 bg-cream"
                style={{ animation: "versa-breathe 4.6s ease-in-out infinite" }}
              >
                <div
                  className="absolute inset-0"
                  style={{
                    backgroundImage: "url('/versa-hero.webp')",
                    backgroundSize: "cover",
                    backgroundPosition: "center top",
                  }}
                />
              </div>
            </div>
          </div>
        </motion.div>

        {/* easing tokens */}
        <div className="flex flex-col gap-6">
          <div className="flex items-baseline justify-between">
            <h3 className="font-display uppercase text-heading-s tracking-[0.04em] text-accent-dark">
              Easing tokens
            </h3>
            <span className="font-display uppercase label-xs text-accent-dark/70">
              Default is --ease-versa
            </span>
          </div>

          <div className="grid grid-cols-1 gap-4 md:grid-cols-3">
            {easings.map((e, i) => (
              <motion.div
                key={e.token}
                initial={{ opacity: 0, y: 18 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true, margin: "-10% 0px" }}
                transition={{ duration: 0.6, delay: i * 0.08, ease: EASE_VERSA }}
                className="overflow-hidden rounded-2xl border border-accent-dark/10 bg-cream/40 p-6 backdrop-blur"
              >
                <div className="flex items-baseline justify-between">
                  <span className="font-display uppercase label-xs text-burgundy">
                    {e.token}
                  </span>
                  {i === 0 && (
                    <span className="rounded-full bg-glyph-gold px-2 py-0.5 font-display label-xs uppercase text-accent-dark">
                      default
                    </span>
                  )}
                </div>
                <p className="mt-3 font-display text-[13px] text-accent-dark/70">
                  {e.curve}
                </p>
                <p className="mt-4 font-sans text-caption leading-snug text-accent-dark/75">
                  {e.use}
                </p>
              </motion.div>
            ))}
          </div>
        </div>

        {/* duration scale */}
        <div className="flex flex-col gap-6">
          <div className="flex items-baseline justify-between">
            <h3 className="font-display uppercase text-heading-s tracking-[0.04em] text-accent-dark">
              Duration scale
            </h3>
            <span className="font-display uppercase label-xs text-accent-dark/70">
              Fast · medium · slow · hero
            </span>
          </div>

          <div className="grid grid-cols-2 gap-3 md:grid-cols-4">
            {durations.map((d, i) => (
              <motion.div
                key={d.token}
                initial={{ opacity: 0, y: 18 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true, margin: "-10% 0px" }}
                transition={{ duration: 0.6, delay: i * 0.06, ease: EASE_VERSA }}
                className="overflow-hidden rounded-2xl border border-accent-dark/10 bg-cream/40 p-5 backdrop-blur"
              >
                <span className="font-display uppercase label-xs text-burgundy">
                  {d.token.replace("--duration-", "")}
                </span>
                <p className="mt-2 font-display text-[36px] font-black leading-none text-accent-dark [font-variant-numeric:tabular-nums]">
                  {d.ms}
                  <span className="ml-1 font-display text-body-s font-normal text-accent-dark/70">
                    ms
                  </span>
                </p>
                <p className="mt-3 font-sans text-caption leading-snug text-accent-dark/70">
                  {d.use}
                </p>
              </motion.div>
            ))}
          </div>
        </div>

        {/* signature keyframes */}
        <div className="flex flex-col gap-6">
          <div className="flex items-baseline justify-between">
            <h3 className="font-display uppercase text-heading-s tracking-[0.04em] text-accent-dark">
              Signature keyframes
            </h3>
            <span className="font-display uppercase label-xs text-accent-dark/70">
              Defined in globals.css
            </span>
          </div>

          <div className="overflow-hidden rounded-2xl border border-accent-dark/10 bg-cream/30 backdrop-blur">
            {signatures.map((s, i) => (
              <div
                key={s.name}
                className={`grid grid-cols-1 gap-3 px-6 py-5 md:grid-cols-12 md:gap-6 md:px-8 md:py-6 ${
                  i < signatures.length - 1 ? "border-b border-accent-dark/10" : ""
                }`}
              >
                <div className="md:col-span-3">
                  <div className="font-display label-sm uppercase text-burgundy">
                    @keyframes {s.name}
                  </div>
                </div>
                <div className="md:col-span-2 md:text-right">
                  <span className="font-display label-xs uppercase text-accent-dark/70">
                    {s.duration}
                  </span>
                </div>
                <div className="md:col-span-3">
                  <span className="font-display label-xs uppercase text-accent-dark/70">
                    {s.scope}
                  </span>
                </div>
                <div className="md:col-span-4">
                  <p className="font-sans text-caption leading-snug text-accent-dark/75">
                    {s.desc}
                  </p>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* landing-only systems */}
        <div className="flex flex-col gap-6">
          <div className="flex items-baseline justify-between">
            <h3 className="font-display uppercase text-heading-s tracking-[0.04em] text-accent-dark">
              Landing-only systems
            </h3>
            <span className="font-display uppercase label-xs text-accent-dark/70">
              JS only · web only
            </span>
          </div>

          <p className="max-w-3xl font-sans text-body-s leading-snug text-warm-shadow">
            Beyond the keyframes above, the landing page runs a small set of JavaScript-driven systems for atmosphere. They are deliberately excluded from the app, which stays static and battery-cheap. Keep them on the marketing surface; do not port them into product flows.
          </p>

          <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
            {[
              {
                name: "ParticleField",
                where: "Hero · ColdOpen · SkillUniverse · ThePromise",
                file: "app/_components/ParticleField.tsx",
                desc: "Hue-shifting canvas particles. Density and hueRange tuned per scene. App stays static. Never instantiate inside the product surface.",
              },
              {
                name: "CursorParallax",
                where: "Hero (character) · VoiceFloor (phone fan)",
                file: "app/_components/CursorParallax.tsx",
                desc: "Mouse-tracked 3D tilt. Cinematic interaction for illustrations. The app uses static poses only.",
              },
              {
                name: "Scroll-scrub timeline",
                where: "HoursGap scene (landing)",
                file: "app/_components/sections/HoursGapSection.tsx",
                desc: "GSAP timeline pinned to scroll position. Bars fill, hours animate, wings drift. The time-passing metaphor, landing-exclusive.",
              },
              {
                name: "Stadium lights + horizon",
                where: "Hero atmosphere",
                file: "inline · conic + radial gradients",
                desc: "Conic-gradient floodlights and a breathing horizon-pulse layer. Pure cinema. Not a primitive, lives inline in the hero markup.",
              },
            ].map((s, i) => (
              <motion.div
                key={s.name}
                initial={{ opacity: 0, y: 18 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true, margin: "-10% 0px" }}
                transition={{ duration: 0.6, delay: i * 0.06, ease: EASE_VERSA }}
                className="rounded-2xl border border-accent-dark/10 bg-cream/40 p-6 backdrop-blur"
              >
                <div className="flex items-baseline justify-between gap-3">
                  <span className="font-display uppercase text-body-m tracking-[0.04em] text-accent-dark">
                    {s.name}
                  </span>
                  <span className="rounded-full border border-burgundy/40 px-2 py-0.5 font-display label-xs uppercase text-burgundy">
                    Landing only
                  </span>
                </div>
                <p className="mt-3 font-display uppercase label-xs text-accent-dark/70">
                  {s.where}
                </p>
                <p className="mt-1 font-display label-xs text-burgundy/85">
                  {s.file}
                </p>
                <p className="mt-3 font-sans text-caption leading-snug text-accent-dark/75">
                  {s.desc}
                </p>
              </motion.div>
            ))}
          </div>
        </div>

        {/* accessibility note */}
        <div className="rounded-2xl border border-deep-teal/30 bg-deep-teal/[0.04] p-6">
          <span className="font-display uppercase label-xs text-deep-teal">
            Accessibility · honored
          </span>
          <h4 className="mt-2 font-display uppercase text-heading-s tracking-[0.04em] text-accent-dark">
            prefers-reduced-motion
          </h4>
          <p className="mt-3 max-w-3xl font-sans text-caption leading-snug text-accent-dark/70">
            All animation and transition durations collapse to 0.01ms when the user requests reduced motion. The site stays readable, just static. No exceptions, no per-component opt-outs.
          </p>
        </div>
      </div>

      <Annotation
        size="xs"
        position="tr"
        tone="dark"
        n="09"
        title="MOTION"
        caption="Versa-breathe is the heartbeat. --ease-versa is the fingerprint. All tokens ship in globals.css."
      />
    </section>
  );
}
