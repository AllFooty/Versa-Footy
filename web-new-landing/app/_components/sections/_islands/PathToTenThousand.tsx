"use client";

import { motion, useInView } from "motion/react";
import { useRef } from "react";
import { EASE_VERSA } from "../../../_data/motion";
import { CountUp } from "../../primitives/CountUp";
import type { Dict } from "../../../_dictionaries";

const GOLD_GRADIENT =
  "linear-gradient(90deg, #FFD24A 0%, #E8A93C 50%, #7A1F2E 100%)";

const PATH_BASE_HRS = 3000;
const PATH_VERSA_ADDED_HRS = 7000;
const PATH_TARGET_HRS = 10000;
const PATH_BASE_PCT = (PATH_BASE_HRS / PATH_TARGET_HRS) * 100;
const PATH_VERSA_PCT = ((PATH_BASE_HRS + PATH_VERSA_ADDED_HRS) / PATH_TARGET_HRS) * 100;

type Props = { t: Dict["hoursGap"]["path"] };

export function PathToTenThousand({ t }: Props) {
  const ref = useRef<HTMLDivElement>(null);
  const isInView = useInView(ref, { once: true, margin: "-10%" });

  return (
    <motion.div
      ref={ref}
      initial={{ opacity: 0, y: 30 }}
      animate={isInView ? { opacity: 1, y: 0 } : {}}
      transition={{ duration: 1, delay: 0.25, ease: EASE_VERSA }}
      className="mt-14 overflow-hidden rounded-3xl border border-burgundy/30 bg-burgundy/[0.04] p-8 backdrop-blur md:p-12"
    >
      <div className="flex flex-wrap items-baseline justify-between gap-4">
        <div>
          <p className="font-display label-md uppercase font-bold text-burgundy">
            {t.eyebrow}
          </p>
          <p className="mt-2 font-sans text-body-l text-accent-dark/75">
            {t.sub}
          </p>
        </div>
        <div className="flex items-baseline gap-2 rounded-full border border-burgundy/30 bg-burgundy/8 px-5 py-2">
          <span className="font-display text-heading-m font-black text-burgundy">10,000</span>
          <span className="font-sans text-body-base text-burgundy/75">{t.target}</span>
        </div>
      </div>

      <div className="mt-9 space-y-7">
        <div>
          <div className="mb-2 flex items-baseline justify-between gap-4">
            <span className="font-display label-sm uppercase text-accent-dark/75">
              {t.withoutLabel}
            </span>
            <span className="font-display text-heading-s">
              <span className="font-black text-accent-dark">
                <CountUp to={PATH_BASE_HRS} trigger={isInView} delay={0.9} duration={1.6} />
              </span>
              <span className="ml-1.5 font-bold text-accent-dark/55"> {t.hrs}</span>
              <span className="ml-2.5 font-sans text-body-base text-accent-dark/55">
                · {Math.round(PATH_BASE_PCT)}{t.ofGoal}
              </span>
            </span>
          </div>
          <div className="relative h-4 w-full overflow-hidden rounded-full bg-accent-dark/8">
            <motion.div
              initial={{ width: 0 }}
              animate={isInView ? { width: `${PATH_BASE_PCT}%` } : {}}
              transition={{ duration: 1.3, delay: 0.55, ease: EASE_VERSA }}
              className="h-full rounded-full bg-warm-shadow/55"
            />
          </div>
          <p className="mt-2.5 font-sans text-body-s text-accent-dark/65">
            {t.withoutCaption}
          </p>
        </div>

        <div>
          <div className="mb-2 flex items-baseline justify-between gap-4">
            <span className="font-display label-sm uppercase text-burgundy">
              {t.withLabel}
            </span>
            <span className="font-display text-heading-s">
              <span className="font-black text-burgundy">
                <CountUp to={PATH_BASE_HRS + PATH_VERSA_ADDED_HRS} trigger={isInView} delay={1.6} duration={2} />
              </span>
              <span className="ml-1.5 font-bold text-burgundy/60"> {t.hrs}</span>
              <span className="ml-2.5 font-sans text-body-base text-burgundy/65">
                · {Math.round(PATH_VERSA_PCT)}{t.ofGoal}
              </span>
            </span>
          </div>
          <div className="relative h-4 w-full overflow-hidden rounded-full bg-burgundy/10">
            <div className="flex h-full">
              <motion.div
                initial={{ width: 0 }}
                animate={isInView ? { width: `${PATH_BASE_PCT}%` } : {}}
                transition={{ duration: 1.3, delay: 0.75, ease: EASE_VERSA }}
                className="h-full bg-warm-shadow/55"
              />
              <motion.div
                initial={{ width: 0 }}
                animate={isInView ? { width: `${PATH_VERSA_PCT - PATH_BASE_PCT}%` } : {}}
                transition={{ duration: 1.8, delay: 1.7, ease: EASE_VERSA }}
                className="h-full"
                style={{ background: GOLD_GRADIENT }}
              />
            </div>
          </div>
          <p className="mt-2.5 font-sans text-body-s text-burgundy/80">
            {t.withCaption}
          </p>
        </div>
      </div>
    </motion.div>
  );
}
