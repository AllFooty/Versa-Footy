"use client";

import Image from "next/image";
import { motion } from "motion/react";
import { EASE_VERSA } from "../../../../_data/motion";
import { Annotation } from "../../../../_components/primitives/Annotation";

const pillars = [
  "01 · Logo",
  "02 · Foundations",
  "03 · Color",
  "04 · Typography",
  "05 · Versa",
  "06 · Voice",
  "07 · Components",
  "08 · Patterns",
  "09 · Motion",
];

export function CoverSection() {
  return (
    <section
      id="cover"
      className="relative isolate flex min-h-[100svh] w-full items-center overflow-hidden"
      style={{
        background:
          "radial-gradient(120% 80% at 50% 100%, #E8A93C 0%, #BB5A2B 22%, #147373 58%, #0D5959 82%, #062b2b 100%)",
      }}
    >
      <div aria-hidden className="bg-noise absolute inset-0 opacity-25 mix-blend-overlay" />

      {/* light rays */}
      <div
        aria-hidden
        className="absolute -top-1/3 left-1/2 h-[160%] w-[160%] -translate-x-1/2 opacity-25 mix-blend-screen"
        style={{
          background:
            "conic-gradient(from 200deg at 50% 0%, transparent 0deg, rgba(255,210,74,0.32) 12deg, transparent 24deg, transparent 80deg, rgba(255,210,74,0.18) 92deg, transparent 104deg, transparent 160deg, rgba(255,210,74,0.28) 172deg, transparent 184deg)",
        }}
      />

      <div className="relative z-10 mx-auto grid w-full max-w-[1500px] grid-cols-1 items-center gap-12 px-6 py-24 md:grid-cols-12 md:gap-10 md:px-12 lg:px-16">
        {/* text column */}
        <div className="md:col-span-7">
          <motion.div
            initial={{ opacity: 0, y: 12 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.9, delay: 0.1, ease: EASE_VERSA }}
            className="flex items-center gap-3"
          >
            <span className="h-px w-10 bg-glyph-gold/70" />
            <p className="font-display uppercase label-xs text-glyph-gold">
              Brand System · v1.0
            </p>
          </motion.div>

          {/* wordmark */}
          <motion.div
            initial={{ clipPath: "inset(0 100% 0 0)", opacity: 0 }}
            animate={{ clipPath: "inset(0 0% 0 0)", opacity: 1 }}
            transition={{ duration: 1.6, delay: 0.4, ease: [0.77, 0, 0.18, 1] }}
            className="mt-8"
          >
            <Image
              src="/VERSA_FOOTY_wordmark_white_transparent.webp"
              alt="VERSA FOOTY"
              width={1100}
              height={420}
              sizes="(max-width: 768px) 80vw, 640px"
              className="h-auto w-[min(80vw,640px)] brightness-[1.45] contrast-110 mix-blend-screen"
            />
          </motion.div>

          {/* lead — the bible quote, promoted to top-level */}
          <motion.figure
            initial={{ opacity: 0, y: 16 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 1, delay: 1.2, ease: EASE_VERSA }}
            className="mt-14 max-w-2xl"
          >
            <blockquote className="font-display font-black leading-[1.04] text-cream text-[clamp(28px,3.8vw,52px)] tracking-[-0.01em] text-shadow-cinematic">
              Takes football seriously.
              <span className="block">Takes himself lightly.</span>
              <span className="block">Speaks rarely, in short sentences.</span>
              <span className="block">Sulks honestly when his player skips a day.</span>
            </blockquote>
            <figcaption className="mt-6 font-display uppercase label-sm text-glyph-gold">
              Versa · Character Bible
            </figcaption>
          </motion.figure>

          <motion.p
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ duration: 1, delay: 1.6 }}
            className="mt-12 max-w-xl font-sans text-[clamp(15px,1.4vw,18px)] leading-snug text-cream/75"
          >
            This is the living brand spec. Color, type, logo, character, voice, components, motion. Every rule on this page is what the site and the app are built from.
          </motion.p>

          {/* pillar index */}
          <motion.div
            initial={{ opacity: 0, y: 12 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 1, delay: 1.9 }}
            className="mt-10 flex flex-wrap gap-x-6 gap-y-2 font-display uppercase label-xs text-cream/70"
          >
            {pillars.map((p) => (
              <span key={p}>{p}</span>
            ))}
          </motion.div>
        </div>

        {/* logo column */}
        <div className="md:col-span-5">
          <motion.div
            initial={{ opacity: 0, scale: 0.92, y: 24 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            transition={{ duration: 1.3, delay: 0.25, ease: EASE_VERSA }}
            className="relative mx-auto w-full max-w-[520px]"
          >
            <div
              aria-hidden
              className="absolute -inset-12 rounded-full blur-3xl"
              style={{
                background:
                  "radial-gradient(closest-side, rgba(255,210,74,0.5), rgba(232,169,60,0.2) 50%, transparent 80%)",
                animation: "wing-flare 5s ease-in-out infinite",
              }}
            />
            <div
              className="relative"
              style={{ animation: "versa-breathe 4.6s ease-in-out infinite" }}
            >
              <Image
                src="/versa-lockup-navy.webp"
                alt="Versa Footy logo"
                width={900}
                height={900}
                sizes="(max-width: 768px) 80vw, 520px"
                className="relative z-10 mx-auto h-auto w-full drop-shadow-[0_50px_70px_rgba(36,23,15,0.55)]"
              />
            </div>
          </motion.div>

          <motion.div
            initial={{ opacity: 0, y: 12 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 1, delay: 1.8 }}
            className="mt-8 text-center font-display uppercase label-xs text-cream/70"
          >
            The primary mark. Logo + wordmark used together is the default
          </motion.div>
        </div>
      </div>

      {/* bottom strip */}
      <div className="absolute bottom-0 left-0 right-0 z-10 border-t border-cream/15 bg-accent-dark/40 backdrop-blur-sm">
        <div className="flex items-center justify-between gap-6 px-6 py-3 font-display uppercase label-xs text-cream/70 md:px-12">
          <div className="flex items-center gap-3">
            <span className="h-1.5 w-1.5 rounded-full bg-glyph-gold animate-pulse" />
            Brand system · 9 pillars + app handoff
          </div>
          <div className="hidden md:flex items-center gap-6">
            <span>Versa Footy · An All Footy company</span>
            <span className="opacity-40">·</span>
            <span>Riyadh 2026</span>
          </div>
          <a href="#logo" className="flex items-center gap-2 hover:text-glyph-gold transition-colors">
            Begin
            <span className="inline-block animate-bounce">↓</span>
          </a>
        </div>
      </div>

      <Annotation
        size="xs"
        position="tr"
        tone="cream"
        n="00"
        title="COVER"
        caption="The living spec. Foundations first, then character, then components."
      />
    </section>
  );
}
