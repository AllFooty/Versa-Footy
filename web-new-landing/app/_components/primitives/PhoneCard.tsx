"use client";

import Image from "next/image";
import { motion } from "motion/react";
import { EASE_VERSA } from "../../_data/motion";

export type PhoneCardData = {
  time: string;
  body: string;
  ar?: string;
};

export function PhoneCard({
  data,
  rotate = 0,
  delay = 0,
  className = "",
}: {
  data: PhoneCardData;
  rotate?: number;
  delay?: number;
  className?: string;
}) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 40, rotate: rotate * 0.4, scale: 0.9 }}
      whileInView={{ opacity: 1, y: 0, rotate, scale: 1 }}
      viewport={{ once: true, margin: "-10% 0px" }}
      transition={{
        duration: 0.95,
        delay,
        ease: EASE_VERSA,
      }}
      whileHover={{
        rotate: 0,
        y: -12,
        scale: 1.06,
        zIndex: 30,
        transition: { duration: 0.45, ease: EASE_VERSA },
      }}
      className={`relative w-[280px] shrink-0 will-change-transform ${className}`}
    >
      <div
        className="relative rounded-[30px] p-[2px]"
        style={{
          background:
            "linear-gradient(140deg, rgba(255,210,74,0.65), rgba(20,115,115,0.25) 50%, rgba(122,31,46,0.45))",
        }}
      >
        <div className="relative overflow-hidden rounded-[28px] bg-cream/82 backdrop-blur-xl ring-1 ring-accent-dark/10 shadow-floating">
          {/* status bar */}
          <div className="flex items-center justify-between px-5 pt-4 font-display label-sm uppercase text-accent-dark/70">
            <span>{data.time}</span>
            <span>VERSA</span>
          </div>

          {/* notification */}
          <div className="flex gap-3 px-5 py-4">
            <div className="relative h-11 w-11 shrink-0 overflow-hidden rounded-2xl ring-1 ring-accent-dark/10">
              <div className="absolute inset-0 bg-deep-teal" />
              <Image
                src="/versa-hero.webp"
                alt="Versa avatar"
                width={140}
                height={140}
                sizes="64px"
                className="absolute -top-2 left-1/2 h-[150%] w-auto -translate-x-1/2 object-cover"
              />
              <div className="absolute -right-1 -top-1 h-3 w-3 rounded-full bg-burgundy ring-2 ring-cream" />
            </div>
            <div className="flex-1">
              <div className="flex items-center justify-between">
                <span className="font-display label-sm uppercase text-burgundy">
                  Versa
                </span>
                <span className="font-display label-sm uppercase text-accent-dark/70">
                  now
                </span>
              </div>
              <p className="mt-1.5 font-sans text-body-s leading-snug text-accent-dark">
                {data.body}
              </p>
              {data.ar && (
                <p
                  dir="rtl"
                  lang="ar"
                  className="mt-2 inline-flex rounded-full bg-deep-teal/10 px-2 py-0.5 font-arabic text-[13px] text-deep-teal"
                >
                  {data.ar}
                </p>
              )}
            </div>
          </div>

          {/* shimmer line */}
          <div className="h-px w-full bg-gradient-to-r from-transparent via-glyph-gold/40 to-transparent" />
          <div className="flex items-center justify-between px-5 py-3 font-display label-sm uppercase text-accent-dark/70">
            <span>tap to open</span>
            <span className="flex items-center gap-1">
              <span className="h-1 w-1 rounded-full bg-glyph-gold" />
              <span className="h-1 w-1 rounded-full bg-glyph-gold/60" />
              <span className="h-1 w-1 rounded-full bg-glyph-gold/30" />
            </span>
          </div>
        </div>
      </div>
    </motion.div>
  );
}
