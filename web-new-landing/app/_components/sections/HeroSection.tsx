"use client";

import Image from "next/image";
import { motion } from "motion/react";
import { EASE_VERSA } from "../../_data/motion";
import { CountUp } from "../primitives/CountUp";
import { ResponsiveParticles } from "../primitives/ResponsiveParticles";
import { StoreButtons } from "../primitives/StoreButtons";
import { CursorParallax } from "../CursorParallax";
import type { Dict } from "../../_dictionaries";

type Props = { dict: Dict };

export function HeroSection({ dict }: Props) {
  const t = dict.hero;
  return (
    <section
      className="relative isolate flex min-h-[100svh] w-full items-center overflow-hidden"
      style={{
        background:
          "radial-gradient(ellipse 140% 100% at 50% 100%, #E8A93C 0%, #BB5A2B 18%, #7A1F2E 35%, #147373 55%, #0D5959 75%, #062b2b 100%)",
      }}
    >
      <div
        aria-hidden
        className="absolute -top-1/3 left-1/2 h-[180%] w-[180%] -translate-x-1/2 opacity-40 mix-blend-screen"
        style={{
          background:
            "conic-gradient(from 180deg at 50% 0%, transparent 0deg, rgba(255,210,74,0.5) 8deg, transparent 20deg, transparent 45deg, rgba(255,210,74,0.3) 52deg, transparent 64deg, transparent 90deg, rgba(255,210,74,0.4) 98deg, transparent 110deg, transparent 135deg, rgba(255,210,74,0.35) 142deg, transparent 154deg, transparent 180deg)",
        }}
      />
      <div
        aria-hidden
        className="absolute inset-x-0 bottom-0 h-[70%]"
        style={{
          background:
            "radial-gradient(ellipse 100% 100% at 50% 100%, rgba(255,210,74,0.7) 0%, rgba(232,169,60,0.45) 25%, rgba(187,90,43,0.25) 45%, transparent 70%)",
          animation: "horizon-pulse 5s ease-in-out infinite",
        }}
      />
      <div aria-hidden className="bg-noise absolute inset-0 opacity-[0.18] mix-blend-overlay" />
      <ResponsiveParticles density={100} speed={0.4} hueRange={[36, 48]} intensity={1.1} />

      <div className="relative z-10 mx-auto flex w-full max-w-[1600px] flex-col items-center px-8 py-20 md:px-16 md:py-24 lg:px-24">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 1.2, delay: 0.2, ease: EASE_VERSA }}
          className="flex items-center gap-4"
        >
          <span aria-hidden="true" className="h-px w-12 bg-glyph-gold/60" />
          <p className="font-display uppercase label-md font-bold text-glyph-gold">
            {t.eyebrow}
          </p>
          <span aria-hidden="true" className="h-px w-12 bg-glyph-gold/60" />
        </motion.div>

        <motion.h1
          initial={{ opacity: 0, y: 40 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 1.4, delay: 0.4, ease: EASE_VERSA }}
          className="mt-10 max-w-5xl text-center font-display font-black uppercase leading-[0.9] tracking-[-0.025em] text-cream"
          style={{
            fontSize: "clamp(48px, 9vw, 112px)",
            textShadow: "0 4px 60px rgba(0,0,0,0.4), 0 2px 20px rgba(0,0,0,0.3)",
          }}
        >
          {t.headlineA}
          <br />
          <span className="text-glyph-gold">{t.headlineB}</span>
        </motion.h1>

        <motion.p
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 1.2, delay: 0.9, ease: EASE_VERSA }}
          className="mt-6 text-center font-sans text-[clamp(18px,1.8vw,24px)] leading-snug text-body-gold"
        >
          {(() => {
            const name = t.nameplate.name;
            const parts = t.sub.split(name);
            return parts.flatMap((part, i) =>
              i < parts.length - 1
                ? [part, <strong key={i} className="font-semibold text-glyph-gold">{name}</strong>]
                : [part],
            );
          })()}
        </motion.p>

        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 1.2, delay: 1.2, ease: EASE_VERSA }}
          className="mt-10 w-full max-w-xl"
        >
          <StoreButtons copy={dict.stores} />
        </motion.div>

        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ duration: 1, delay: 1.6 }}
          className="mt-10 flex flex-wrap items-center justify-center gap-8 text-cream/70"
        >
          {t.stats.map((s) => (
            <div key={s.label} className="text-center">
              <div
                className="font-display text-[clamp(28px,4vw,48px)] font-black text-cream"
                style={{ textShadow: "0 2px 12px rgba(36,23,15,0.55), 0 1px 0 rgba(36,23,15,0.3)" }}
              >
                <CountUp to={s.to} trigger={true} delay={1.6} />
                {s.suffix}
              </div>
              <div
                className="font-display uppercase label-sm font-bold text-cream"
                style={{ textShadow: "0 1px 8px rgba(36,23,15,0.55)" }}
              >
                {s.label}
              </div>
            </div>
          ))}
        </motion.div>
      </div>

      <div className="pointer-events-none absolute right-4 bottom-10 z-10 hidden w-[30%] max-w-[420px] lg:block xl:right-8 xl:bottom-12">
        <CursorParallax intensity={20} rotate={4}>
          <div
            className="relative"
            style={{ animation: "versa-breathe 5s ease-in-out infinite" }}
          >
            <div
              aria-hidden
              className="absolute -inset-16 rounded-full blur-3xl versa-glow-intense"
            />
            <Image
              src="/versa-hero.webp"
              alt={t.versaAlt}
              width={900}
              height={1400}
              priority
              sizes="(max-width: 768px) 90vw, (max-width: 1280px) 50vw, 600px"
              className="relative z-10 h-auto w-full drop-shadow-image-cinematic"
            />
          </div>
        </CursorParallax>

        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.9, delay: 1.4, ease: EASE_VERSA }}
          className="relative -mt-2 flex justify-center"
        >
          <div className="inline-flex flex-col items-center gap-0.5 rounded-2xl border border-glyph-gold/45 bg-accent-dark/80 px-5 py-2 shadow-[0_14px_40px_-14px_rgba(0,0,0,0.55)] backdrop-blur-sm">
            <span className="font-display text-body-s font-black uppercase tracking-[0.14em] text-glyph-gold">
              {t.nameplate.name}
            </span>
            <span className="font-display uppercase label-sm text-cream/70">
              {t.nameplate.role}
            </span>
          </div>
        </motion.div>
      </div>
    </section>
  );
}
