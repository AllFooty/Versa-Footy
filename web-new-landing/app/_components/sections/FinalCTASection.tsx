"use client";

import Image from "next/image";
import { motion, useScroll, useTransform } from "motion/react";
import { EASE_VERSA } from "../../_data/motion";
import { useRef } from "react";
import { ResponsiveParticles } from "../primitives/ResponsiveParticles";
import { StoreButtons } from "../primitives/StoreButtons";
import type { Dict } from "../../_dictionaries";

type Props = { dict: Dict };

export function FinalCTASection({ dict }: Props) {
  const t = dict.finalCta;
  const ref = useRef<HTMLElement>(null);
  const { scrollYProgress } = useScroll({
    target: ref,
    offset: ["start end", "end start"],
  });
  const versaScale = useTransform(scrollYProgress, [0, 1], [0.94, 1.04]);
  const versaY = useTransform(scrollYProgress, [0, 1], [40, -30]);

  return (
    <section
      ref={ref}
      className="relative isolate w-full overflow-hidden"
      style={{
        background: "linear-gradient(180deg, #0D5959 0%, #147373 22%, #BB5A2B 52%, #E8A93C 72%, #FFD24A 88%, #FAF6EE 100%)",
      }}
    >
      <div
        aria-hidden
        className="absolute -top-1/4 left-1/2 h-[180%] w-[180%] -translate-x-1/2 opacity-35 mix-blend-screen"
        style={{
          background: "conic-gradient(from 180deg at 50% 0%, transparent 0deg, rgba(255,210,74,0.5) 10deg, transparent 25deg, transparent 50deg, rgba(255,210,74,0.35) 58deg, transparent 75deg, transparent 100deg, rgba(255,210,74,0.4) 108deg, transparent 125deg, transparent 155deg, rgba(255,210,74,0.45) 162deg, transparent 180deg)",
        }}
      />
      <div aria-hidden className="bg-noise absolute inset-0 opacity-[0.15] mix-blend-overlay" />
      <ResponsiveParticles density={120} speed={0.5} hueRange={[36, 50]} intensity={1.2} />

      <div className="relative z-10 mx-auto flex max-w-[1200px] flex-col items-center px-8 pt-28 text-center md:px-16 md:pt-40">
        <motion.div
          initial={{ opacity: 0, y: 30 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 1.2, ease: EASE_VERSA }}
        >
          <Image
            src="/VERSA_FOOTY_wordmark_white_transparent.webp"
            alt={t.wordmarkAlt}
            width={900}
            height={350}
            sizes="(max-width: 768px) 80vw, 600px"
            priority
            className="mx-auto h-auto w-[min(80vw,600px)] drop-shadow-[0_30px_60px_rgba(36,23,15,0.5)]"
          />
        </motion.div>

        <motion.h2
          initial={{ opacity: 0, y: 30 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 1.2, delay: 0.2, ease: EASE_VERSA }}
          className="mt-10 max-w-5xl font-display text-[clamp(48px,9vw,112px)] font-black uppercase leading-[0.9] tracking-[-0.025em] text-cream"
          style={{ textShadow: "0 6px 80px rgba(0,0,0,0.5)" }}
        >
          {t.headlineA}
          <br />
          <span className="text-glyph-gold">{t.headlineB}</span>
        </motion.h2>

        <motion.p
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 1, delay: 0.5, ease: EASE_VERSA }}
          className="mx-auto mt-8 max-w-xl font-sans text-[clamp(18px,2vw,24px)] leading-relaxed text-cream/90"
        >
          {t.sub}
        </motion.p>

        <motion.div
          id="get-started"
          initial={{ opacity: 0, y: 30 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 1, delay: 0.7, ease: EASE_VERSA }}
          className="mt-10 w-full max-w-xl scroll-mt-32"
        >
          <StoreButtons copy={dict.stores} />
        </motion.div>
      </div>

      <motion.div
        style={{ scale: versaScale, y: versaY }}
        className="pointer-events-none relative z-10 mx-auto mt-12 w-[min(85vw,620px)] md:mt-16"
      >
        <div aria-hidden className="absolute -inset-20 rounded-full blur-3xl versa-glow-strong" />
        <div style={{ animation: "versa-breathe 5s ease-in-out infinite" }}>
          <Image
            src="/versa-celebrating.webp"
            alt={t.versaAlt}
            width={900}
            height={1400}
            sizes="(max-width: 768px) 85vw, 620px"
            className="relative z-10 mx-auto h-auto w-full drop-shadow-image-cinematic"
          />
        </div>
      </motion.div>
    </section>
  );
}
