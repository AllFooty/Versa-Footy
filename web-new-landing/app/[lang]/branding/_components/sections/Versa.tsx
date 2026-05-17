"use client";

import Image from "next/image";
import { motion, useInView } from "motion/react";
import { EASE_VERSA } from "../../../../_data/motion";
import { useRef } from "react";
import { Annotation } from "../../../../_components/primitives/Annotation";
import { Chip } from "../../../../_components/primitives/Chip";

type Callout = {
  id: string;
  label: string;
  caption: string;
  side: "L" | "R";
  yPct: number;
  anchorXPct: number;
  anchorYPct: number;
};

const anatomy: Callout[] = [
  { id: "eyes", label: "Golden falcon eyes", caption: "Alive · mischievous · always tracking the ball", side: "L", yPct: 10, anchorXPct: 48, anchorYPct: 14 },
  { id: "crest", label: "Asymmetric crest", caption: "The silhouette people recognize across a stadium", side: "R", yPct: 4, anchorXPct: 60, anchorYPct: 6 },
  { id: "wings", label: "Wings: for emotion, not flight", caption: "Flare in joy, droop in sulk, fold in focus", side: "R", yPct: 30, anchorXPct: 78, anchorYPct: 36 },
  { id: "chest", label: "Chest crest = brand logo", caption: "One mark, one face. Character and logo are the same", side: "L", yPct: 38, anchorXPct: 44, anchorYPct: 38 },
  { id: "patterns", label: "Geometric desert accents", caption: "Echoes Arabic tile work without quoting it", side: "R", yPct: 54, anchorXPct: 70, anchorYPct: 54 },
  { id: "legs", label: "Athletic legs · clawed talons", caption: "His signature. Plays barefoot inside the boots.", side: "L", yPct: 66, anchorXPct: 42, anchorYPct: 72 },
  { id: "boots", label: "Gold football boots", caption: "Gold uppers, black soles. Persistent across every pose.", side: "L", yPct: 82, anchorXPct: 46, anchorYPct: 90 },
  { id: "trail", label: "Kick-trail motion", caption: "Dust + feather wake. Visible in motion and inside the logo.", side: "R", yPct: 80, anchorXPct: 60, anchorYPct: 92 },
];

type Trait = { is: string; not: string };

const traits: Trait[] = [
  { is: "Mischievous", not: "but never snarky" },
  { is: "Disciplined", not: "but never stern" },
  { is: "Joyful", not: "but never goofy" },
];

type Pose = {
  id: string;
  file: string | null;
  name: string;
  role: string;
  pending?: boolean;
};

const poses: Pose[] = [
  { id: "hero", file: "/versa-hero.webp", name: "Hero", role: "Default · confident foot-on-ball stance" },
  { id: "dribbling", file: "/versa-dribbling.webp", name: "Dribbling", role: "Action · mid-stride session UI" },
  { id: "celebrating", file: "/versa-celebrating.webp", name: "Celebrating", role: "Reward · wings flared, mastery moments" },
  { id: "focused", file: "/versa-focused.webp", name: "Focused", role: "Drill intro · wings folded, locked in" },
  { id: "wink", file: "/versa-wink.webp", name: "Wink", role: "Onboarding · friendly greeting" },
  { id: "sulking", file: null, name: "Sulking", role: "Missed streak · empty state · wings droop, head down", pending: true },
  { id: "resting", file: null, name: "Resting", role: "Idle screen · sitting on ball, calm", pending: true },
  { id: "coaching", file: null, name: "Coaching", role: "Tutorial intros · pointing, teaching gesture", pending: true },
];

export function VersaSection() {
  const ref = useRef<HTMLDivElement>(null);
  const inView = useInView(ref, { once: true, margin: "-15% 0px" });

  return (
    <section
      id="versa"
      className="relative isolate w-full overflow-hidden bg-cream py-28"
    >
      <div
        aria-hidden
        className="absolute inset-0"
        style={{
          background:
            "radial-gradient(120% 80% at 50% 50%, rgba(255,255,255,0) 0%, rgba(232,169,60,0.08) 55%, rgba(187,90,43,0.13) 85%, rgba(36,23,15,0.18) 100%)",
        }}
      />
      <div aria-hidden className="bg-noise absolute inset-0 opacity-25" />

      <div className="relative z-10 mx-auto flex w-full max-w-[1500px] flex-col gap-20 px-6 md:px-10 lg:px-16">
        {/* header */}
        <div className="grid grid-cols-1 gap-8 md:grid-cols-12">
          <div className="md:col-span-4">
            <Chip tone="burgundy" size="xs">
              05 · Versa
            </Chip>
            <h2 className="mt-4 font-display font-black uppercase leading-[0.95] text-accent-dark text-[clamp(36px,5vw,72px)] tracking-[-0.02em]">
              The brand
              <span className="block">mascot.</span>
              <span className="block text-burgundy">Three traits in tension.</span>
            </h2>
          </div>
          <div className="md:col-span-8 md:pt-2">
            <p className="font-sans text-[clamp(15px,1.4vw,19px)] leading-snug text-warm-shadow">
              Versa is the brand mascot, a desert falcon, designed in homage to KSA heritage. Not appropriation, intentional craft. He is what the illustrations show, what the bible quote describes, and the canonical noun across marketing, legal, and product. The mascot carries the brand wherever the wordmark can&apos;t.
            </p>
          </div>
        </div>

        {/* the bible quote — canonical */}
        <motion.figure
          initial={{ opacity: 0, y: 24 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true, margin: "-10% 0px" }}
          transition={{ duration: 1, ease: EASE_VERSA }}
          className="relative overflow-hidden rounded-3xl border border-accent-dark/10 bg-cream/40 p-10 backdrop-blur md:p-16"
        >
          <span className="font-display uppercase label-xs text-burgundy">
            Who is Versa · canonical
          </span>
          <blockquote className="mt-6 font-display font-black leading-[1.04] text-accent-dark text-[clamp(28px,4.2vw,56px)] tracking-[-0.01em]">
            Takes football seriously.
            <span className="block">Takes himself lightly.</span>
            <span className="block">Speaks rarely, in short sentences.</span>
            <span className="block">Sulks honestly when his player skips a day.</span>
          </blockquote>
          <figcaption className="mt-6 font-display uppercase label-sm text-warm-shadow">
            Character Bible
          </figcaption>
        </motion.figure>

        {/* anatomy + dossier */}
        <div className="grid grid-cols-1 gap-12 md:grid-cols-12">
          <div ref={ref} className="md:col-span-7">
            <span className="font-display uppercase label-xs text-burgundy">
              Anatomy · 8 callouts
            </span>
            <h3 className="mt-2 font-display uppercase text-heading-s tracking-[0.04em] text-accent-dark">
              The signatures
            </h3>

            <div className="relative mx-auto mt-8 aspect-[2/3] w-full max-w-[540px]">
              <div
                aria-hidden
                className="absolute inset-0 rounded-[40%]"
                style={{
                  background:
                    "radial-gradient(60% 50% at 50% 45%, rgba(255,210,74,0.35) 0%, rgba(232,169,60,0.15) 35%, transparent 75%)",
                  animation: "wing-flare 5s ease-in-out infinite",
                }}
              />

              <motion.div
                initial={{ opacity: 0, y: 24 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true, margin: "-15% 0px" }}
                transition={{ duration: 1.1, ease: EASE_VERSA }}
                className="relative h-full w-full"
              >
                <Image
                  src="/versa-hero.webp"
                  alt="Anatomy of Versa"
                  fill
                  className="object-contain drop-shadow-[0_25px_30px_rgba(36,23,15,0.32)]"
                  sizes="(max-width: 768px) 80vw, 540px"
                  style={{ animation: "float-y 6s ease-in-out infinite" }}
                />
              </motion.div>

              <svg
                aria-hidden
                viewBox="0 0 100 150"
                preserveAspectRatio="none"
                className="absolute inset-0 z-10 h-full w-full"
              >
                {anatomy.map((c, i) => {
                  const endX = c.side === "L" ? -8 : 108;
                  const endY = c.yPct + 6;
                  return (
                    <motion.line
                      key={c.id}
                      x1={c.anchorXPct}
                      y1={c.anchorYPct * 1.5}
                      x2={endX}
                      y2={endY * 1.5}
                      stroke="#7A1F2E"
                      strokeWidth="0.25"
                      strokeDasharray="0.8 1.4"
                      initial={{ pathLength: 0, opacity: 0 }}
                      animate={inView ? { pathLength: 1, opacity: 0.7 } : {}}
                      transition={{ duration: 0.9, delay: 0.4 + i * 0.12 }}
                    />
                  );
                })}
                {anatomy.map((c, i) => (
                  <motion.circle
                    key={`${c.id}-dot`}
                    cx={c.anchorXPct}
                    cy={c.anchorYPct * 1.5}
                    r="0.6"
                    fill="#7A1F2E"
                    initial={{ opacity: 0, scale: 0 }}
                    animate={inView ? { opacity: 1, scale: 1 } : {}}
                    transition={{ duration: 0.4, delay: 1.1 + i * 0.12 }}
                  />
                ))}
              </svg>

              {anatomy.map((c, i) => (
                <motion.div
                  key={`${c.id}-label`}
                  initial={{ opacity: 0, x: c.side === "L" ? -16 : 16 }}
                  animate={inView ? { opacity: 1, x: 0 } : {}}
                  transition={{
                    duration: 0.8,
                    delay: 1.2 + i * 0.12,
                    ease: EASE_VERSA,
                  }}
                  style={{
                    top: `${c.yPct}%`,
                    ...(c.side === "L"
                      ? { right: "calc(100% + 8px)", textAlign: "right" as const }
                      : { left: "calc(100% + 8px)" }),
                  }}
                  className="absolute hidden w-[170px] md:block"
                >
                  <div className="flex flex-col gap-1">
                    <span className="font-display uppercase label-xs text-burgundy">
                      {c.label}
                    </span>
                    <span className="font-sans text-caption leading-snug text-accent-dark/70">
                      {c.caption}
                    </span>
                  </div>
                </motion.div>
              ))}
            </div>

            {/* mobile callouts list */}
            <div className="mt-8 grid grid-cols-1 gap-3 md:hidden">
              {anatomy.map((c) => (
                <div key={`m-${c.id}`} className="flex flex-col">
                  <span className="font-display uppercase label-xs text-burgundy">
                    {c.label}
                  </span>
                  <span className="font-sans text-body-s text-accent-dark/70">
                    {c.caption}
                  </span>
                </div>
              ))}
            </div>
          </div>

          {/* dossier panel */}
          <div className="md:col-span-5">
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true, margin: "-10% 0px" }}
              transition={{ duration: 0.9, delay: 0.3, ease: EASE_VERSA }}
              className="relative rounded-2xl border border-accent-dark/15 bg-cream/80 p-7 shadow-floating backdrop-blur"
            >
              <div className="absolute -right-4 -top-4 hidden h-16 w-16 rotate-12 items-center justify-center rounded-2xl bg-glyph-gold font-display text-heading-s font-black text-accent-dark shadow-lg md:flex">
                V
              </div>

              <span className="font-display uppercase label-xs text-burgundy">
                Trait pairs · the tension
              </span>
              <p className="mt-3 font-sans text-caption leading-snug text-accent-dark/75">
                Every trait runs against a near-neighbor it must never become. The best coaches all hold this line. Pep, Klopp, Ancelotti. Discipline that never tips into stern. Mischief that never tips into snark.
              </p>

              <div className="mt-6 flex flex-col gap-5">
                {traits.map((t, i) => (
                  <motion.div
                    key={t.is}
                    initial={{ opacity: 0, x: -8 }}
                    animate={inView ? { opacity: 1, x: 0 } : {}}
                    transition={{ duration: 0.7, delay: 0.5 + i * 0.12, ease: EASE_VERSA }}
                  >
                    <div className="font-display uppercase label-sm text-accent-dark">
                      Versa is <span className="text-burgundy">{t.is}</span>
                    </div>
                    <div className="mt-1 font-sans text-body-s leading-snug text-accent-dark/70">
                      {t.not}
                    </div>
                  </motion.div>
                ))}
              </div>

              <div className="mt-8 border-t border-accent-dark/10 pt-6">
                <span className="font-display uppercase label-xs text-burgundy">
                  The canonical noun
                </span>
                <p className="mt-2 font-sans text-caption leading-snug text-accent-dark/75">
                  &ldquo;Versa is the brand mascot, a desert falcon.&rdquo; Use it across marketing, legal, and product. The species is deliberate cultural craft. Keep it explicit; no drift.
                </p>
              </div>
            </motion.div>
          </div>
        </div>

        {/* pose gallery */}
        <div className="flex flex-col gap-8">
          <div className="flex items-baseline justify-between">
            <h3 className="font-display uppercase text-heading-s tracking-[0.04em] text-accent-dark">
              Pose set · 5 + 3 pending
            </h3>
            <span className="font-display uppercase label-xs text-accent-dark/70">
              Five shipped · three open
            </span>
          </div>

          <div className="grid grid-cols-2 gap-4 md:grid-cols-4">
            {poses.map((p, i) => (
              <motion.div
                key={p.id}
                initial={{ opacity: 0, y: 18 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true, margin: "-10% 0px" }}
                transition={{ duration: 0.6, delay: i * 0.06, ease: EASE_VERSA }}
                className={`overflow-hidden rounded-2xl border ${
                  p.pending
                    ? "border-dashed border-burgundy/40 bg-burgundy/[0.03]"
                    : "border-accent-dark/10 bg-cream/40"
                } backdrop-blur`}
              >
                <div className="relative aspect-[2/3] w-full bg-cream/40">
                  {p.file ? (
                    <Image
                      src={p.file}
                      alt={`Versa: ${p.name}`}
                      fill
                      className="object-contain"
                      sizes="(max-width: 768px) 50vw, 25vw"
                    />
                  ) : (
                    <div className="flex h-full w-full items-center justify-center">
                      <div className="text-center">
                        <div className="mx-auto h-16 w-16 rounded-full border-2 border-dashed border-burgundy/40" />
                        <p className="mt-4 font-display uppercase label-xs text-burgundy">
                          To commission
                        </p>
                      </div>
                    </div>
                  )}
                </div>
                <div className="border-t border-accent-dark/10 p-4">
                  <div className="flex items-baseline justify-between">
                    <span className="font-display uppercase label-sm text-accent-dark">
                      {p.name}
                    </span>
                    {p.pending && (
                      <span className="font-display label-xs uppercase text-burgundy">
                        pending
                      </span>
                    )}
                  </div>
                  <p className="mt-2 font-sans text-caption leading-snug text-accent-dark/70">
                    {p.role}
                  </p>
                </div>
              </motion.div>
            ))}
          </div>

          <div className="rounded-2xl border border-burgundy/30 bg-burgundy/[0.04] p-6">
            <span className="font-display uppercase label-xs text-burgundy">
              Why three more
            </span>
            <p className="mt-2 max-w-3xl font-sans text-body-s leading-snug text-accent-dark/80">
              The bible quote says he sulks honestly when his player skips a day, but there is no sulking pose. The app needs an idle state, an empty state, and a tutorial-coaching state. These three close those gaps.
            </p>
          </div>
        </div>
      </div>

      <Annotation
        size="xs"
        position="tr"
        tone="dark"
        n="05"
        title="VERSA"
        caption="The brand mascot. Bible quote, eight anatomy callouts, three traits in tension, five poses shipped, three to commission."
      />
    </section>
  );
}

