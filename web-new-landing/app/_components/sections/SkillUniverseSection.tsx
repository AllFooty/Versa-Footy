"use client";

import { motion, useInView } from "motion/react";
import { EASE_VERSA } from "../../_data/motion";
import { useRef, useState, useMemo } from "react";
import {
  SKILL_CLUSTERS,
  TOTAL_SKILLS,
  DRILL_COUNT_LABEL,
  buildSkillDots,
  type SkillCluster,
} from "../../_data/skills";
import { Chip } from "../primitives/Chip";
import { CountUp } from "../primitives/CountUp";
import type { Dict, Locale } from "../../_dictionaries";

type Props = { dict: Dict; lang: Locale };

export function SkillUniverseSection({ dict, lang }: Props) {
  const t = dict.skillUniverse;
  const ref = useRef<HTMLElement>(null);
  const isInView = useInView(ref, { once: true, margin: "-10%" });
  const [hover, setHover] = useState<SkillCluster | null>(null);
  const dots = useMemo(buildSkillDots, []);
  const clusterById = useMemo(
    () => new Map(SKILL_CLUSTERS.map((c) => [c.id, c])),
    [],
  );
  const clusterLabel = (c: SkillCluster) => (lang === "ar" ? c.ar : c.label);

  return (
    <section
      id="skills"
      ref={ref}
      className="relative isolate w-full overflow-hidden bg-cream py-32 md:py-48"
    >
      <div
        aria-hidden
        className="absolute inset-0"
        style={{
          background: "radial-gradient(ellipse 80% 50% at 50% 100%, rgba(232,169,60,0.15) 0%, transparent 60%)",
        }}
      />
      <div aria-hidden className="bg-noise absolute inset-0 opacity-[0.1]" />

      <div className="relative z-10 mx-auto max-w-[1400px] px-8 md:px-16">
        <motion.div
          initial={{ opacity: 0, y: 40 }}
          animate={isInView ? { opacity: 1, y: 0 } : {}}
          transition={{ duration: 1, ease: EASE_VERSA }}
          className="text-center"
        >
          <Chip tone="teal">{t.chip}</Chip>
          <h2 className="mt-6 font-display text-[clamp(44px,7vw,96px)] font-black uppercase leading-[0.95] tracking-[-0.02em] text-accent-dark">
            <CountUp to={TOTAL_SKILLS} trigger={isInView} duration={1.8} /> {t.headlineA}
            <br />
            <span className="text-deep-teal">{t.headlineB}</span>
          </h2>
          <p className="mx-auto mt-8 max-w-2xl font-sans text-[clamp(18px,2vw,24px)] leading-relaxed text-warm-shadow">
            {t.sub}
          </p>
        </motion.div>

        <div className="mt-20 hidden md:block">
          <motion.div
            initial={{ opacity: 0 }}
            animate={isInView ? { opacity: 1 } : {}}
            transition={{ duration: 1.2 }}
            className="relative aspect-[1600/900] w-full overflow-hidden rounded-3xl border border-accent-dark/25"
            style={{
              background:
                "radial-gradient(ellipse 80% 60% at 50% 50%, rgba(232,169,60,0.07) 0%, rgba(255,210,74,0.04) 50%, transparent 100%)",
            }}
          >
            <svg
              aria-hidden
              viewBox="0 0 100 100"
              preserveAspectRatio="none"
              className="absolute inset-0 h-full w-full"
            >
              {dots.map((d, i) => {
                const c = clusterById.get(d.cluster);
                if (!c) return null;
                const isActive = hover?.id === d.cluster;
                return (
                  <line
                    key={`l-${i}`}
                    x1={c.cx}
                    y1={c.cy}
                    x2={d.x}
                    y2={d.y}
                    stroke={c.color}
                    strokeWidth={isActive ? 0.14 : 0.08}
                    opacity={isActive ? 0.7 : 0.28}
                    style={{ transition: "opacity 0.4s, stroke-width 0.4s" }}
                  />
                );
              })}
            </svg>

            {dots.map((d, i) => {
              const c = clusterById.get(d.cluster);
              const isActive = hover?.id === d.cluster;
              return (
                <span
                  key={`d-${i}`}
                  aria-hidden
                  className="absolute -translate-x-1/2 -translate-y-1/2 rounded-full transition-all duration-medium"
                  style={{
                    left: `${d.x}%`,
                    top: `${d.y}%`,
                    width: `${d.r * (isActive ? 2.6 : 1.8)}px`,
                    height: `${d.r * (isActive ? 2.6 : 1.8)}px`,
                    background: c?.color ?? "#FFD24A",
                    boxShadow: `0 0 ${d.r * (isActive ? 10 : 4)}px ${c?.color ?? "#FFD24A"}${isActive ? "aa" : "44"}`,
                    animation: `twinkle ${3 + d.delay * 0.6}s ease-in-out ${d.delay}s infinite`,
                    opacity: isActive ? 1 : 0.9,
                  }}
                />
              );
            })}

            {SKILL_CLUSTERS.map((c, i) => {
              const isActive = hover?.id === c.id;
              const label = clusterLabel(c);
              return (
                <button
                  key={c.id}
                  type="button"
                  onMouseEnter={() => setHover(c)}
                  onMouseLeave={() => setHover(null)}
                  onFocus={() => setHover(c)}
                  onBlur={() => setHover(null)}
                  onTouchStart={() => setHover((prev) => (prev?.id === c.id ? null : c))}
                  aria-label={`${label}, ${c.skills} ${t.skillsLabel}`}
                  className="absolute -translate-x-1/2 -translate-y-1/2 cursor-pointer rounded-full focus:outline-none focus-visible:ring-2 focus-visible:ring-burgundy focus-visible:ring-offset-2 focus-visible:ring-offset-cream"
                  style={{
                    left: `${c.cx}%`,
                    top: `${c.cy}%`,
                    width: `${c.radius * 2.4}%`,
                    height: `${c.radius * 2.4}%`,
                  }}
                >
                  <motion.span
                    initial={{ opacity: 0, scale: 0.8 }}
                    whileInView={{ opacity: 1, scale: 1 }}
                    viewport={{ once: true, margin: "-10% 0px" }}
                    transition={{ duration: 0.6, delay: 0.5 + i * 0.05 }}
                    className="absolute left-1/2 top-full mt-1 -translate-x-1/2 whitespace-nowrap"
                  >
                    <span
                      aria-hidden="true"
                      className={`inline-flex items-center gap-2 rounded-full border px-3 py-1.5 font-display uppercase label-sm transition-all duration-fast ${
                        isActive
                          ? "border-glyph-gold/60 bg-glyph-gold text-accent-dark"
                          : "border-accent-dark/25 bg-cream/90 text-accent-dark/70"
                      }`}
                    >
                      <span
                        className="h-1.5 w-1.5 rounded-full"
                        style={{ background: c.color, boxShadow: `0 0 8px ${c.color}` }}
                      />
                      {label}
                    </span>
                  </motion.span>
                </button>
              );
            })}

            <motion.div
              key={hover?.id ?? "static"}
              initial={{ opacity: 0, y: 8 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.4, ease: EASE_VERSA }}
              className="pointer-events-none absolute right-4 top-4 hidden w-[260px] rounded-2xl border border-accent-dark/25 bg-cream/95 p-5 shadow-[0_30px_60px_-20px_rgba(36,23,15,0.18)] backdrop-blur md:block"
            >
              {hover ? (
                <>
                  <div className="flex items-center justify-between">
                    <span className="font-display uppercase label-sm text-burgundy">
                      {clusterLabel(hover)}
                    </span>
                    <span
                      className="h-2 w-2 rounded-full"
                      style={{ background: hover.color, boxShadow: `0 0 10px ${hover.color}` }}
                    />
                  </div>
                  <div className="mt-4 flex items-baseline gap-2">
                    <span className="font-display text-[40px] font-black leading-none text-accent-dark [font-variant-numeric:tabular-nums]">
                      {hover.skills}
                    </span>
                    <span className="font-display uppercase label-sm text-accent-dark/70">
                      {t.skillsLabel}
                    </span>
                  </div>
                  <p className="mt-3 font-sans text-body-s leading-snug text-accent-dark/70">
                    {t.skillsBody}
                  </p>
                </>
              ) : (
                <>
                  <span className="font-display uppercase label-sm text-accent-dark/70">
                    {t.pickCluster}
                  </span>
                  <p className="mt-3 font-sans text-body-s leading-snug text-accent-dark/70">
                    {t.pickClusterBody}
                  </p>
                </>
              )}
            </motion.div>

            <div className="pointer-events-none absolute bottom-4 left-4 flex flex-col gap-1 font-display uppercase label-sm text-accent-dark/70">
              <span>{TOTAL_SKILLS} {t.legendSkills}</span>
              <span>{DRILL_COUNT_LABEL} {t.legendDrills}</span>
              <span>{t.legendCategories}</span>
            </div>
            <div
              aria-hidden="true"
              className="pointer-events-none absolute bottom-4 right-4 font-display uppercase label-sm text-accent-dark/70"
            >
              {t.adapted}
            </div>
          </motion.div>

          <div className="mt-6 flex flex-wrap gap-2">
            {SKILL_CLUSTERS.map((c) => {
              const label = clusterLabel(c);
              return (
                <button
                  key={`leg-${c.id}`}
                  type="button"
                  onMouseEnter={() => setHover(c)}
                  onMouseLeave={() => setHover(null)}
                  onFocus={() => setHover(c)}
                  onBlur={() => setHover(null)}
                  aria-label={`${label}, ${c.skills} ${t.skillsLabel}`}
                  className={`inline-flex h-11 cursor-pointer items-center gap-2 rounded-full border px-4 font-display uppercase label-sm transition-all focus:outline-none focus-visible:ring-2 focus-visible:ring-burgundy focus-visible:ring-offset-2 focus-visible:ring-offset-cream ${
                    hover?.id === c.id
                      ? "border-glyph-gold/60 bg-glyph-gold text-accent-dark"
                      : "border-accent-dark/25 text-accent-dark/70 hover:border-accent-dark/50 hover:text-accent-dark"
                  }`}
                >
                  <span aria-hidden="true" className="h-1.5 w-1.5 rounded-full" style={{ background: c.color }} />
                  <span aria-hidden="true">
                    {label}
                    <span className="opacity-50"> · {c.skills}</span>
                  </span>
                </button>
              );
            })}
          </div>
        </div>

        <div className="mt-16 grid grid-cols-2 gap-4 md:hidden">
          {SKILL_CLUSTERS.map((c, i) => (
            <motion.div
              key={c.id}
              initial={{ opacity: 0, y: 30 }}
              animate={isInView ? { opacity: 1, y: 0 } : {}}
              transition={{ duration: 0.8, delay: 0.1 + i * 0.05, ease: EASE_VERSA }}
              className="group relative overflow-hidden rounded-3xl border border-accent-dark/25 bg-cream p-6 transition-all duration-medium"
            >
              <div
                className="absolute -right-6 -top-6 h-24 w-24 rounded-full opacity-20 blur-2xl"
                style={{ background: c.color }}
              />
              <div
                className="relative h-3 w-3 rounded-full"
                style={{ background: c.color, boxShadow: `0 0 20px ${c.color}` }}
              />
              <div className="relative mt-4 font-display uppercase label-md text-accent-dark">
                {clusterLabel(c)}
              </div>
              <div className="relative mt-4 font-display text-[32px] font-black text-deep-teal">
                {c.skills}
              </div>
              <div className="font-display uppercase label-sm text-accent-dark/70">
                {t.skillsLabel}
              </div>
            </motion.div>
          ))}
        </div>

        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={isInView ? { opacity: 1, y: 0 } : {}}
          transition={{ duration: 1, delay: 0.8, ease: EASE_VERSA }}
          className="mt-16 flex flex-wrap items-center justify-center gap-8 rounded-2xl border border-deep-teal/20 bg-deep-teal/5 p-6"
        >
          {t.bottomStats.map((tmpl, i) => {
            const text = tmpl
              .replace("{total}", String(TOTAL_SKILLS))
              .replace("{drills}", DRILL_COUNT_LABEL);
            return (
              <div key={text} className="flex items-center gap-4">
                {i > 0 && <span className="h-1 w-1 rounded-full bg-deep-teal/40" />}
                <span className="font-display uppercase label-sm text-deep-teal">
                  {text}
                </span>
              </div>
            );
          })}
        </motion.div>
      </div>
    </section>
  );
}
