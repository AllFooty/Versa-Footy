"use client";

import { useMotionValue, animate } from "motion/react";
import { EASE_VERSA } from "../../_data/motion";
import { useEffect, useState } from "react";

/**
 * Animates an integer from 0 to `to` when `trigger` becomes true.
 * Respects prefers-reduced-motion via Motion's animate() (gated by MotionConfig).
 */
export function CountUp({
  to,
  trigger,
  delay = 0,
  duration = 1.6,
  decimals = 0,
  format,
}: {
  to: number;
  trigger: boolean;
  delay?: number;
  duration?: number;
  decimals?: number;
  format?: (n: number) => string;
}) {
  const value = useMotionValue(0);
  const [display, setDisplay] = useState(() =>
    format ? format(0) : (0).toLocaleString(),
  );

  useEffect(() => {
    if (!trigger) return;
    const controls = animate(value, to, {
      duration,
      delay,
      ease: EASE_VERSA,
    });
    return () => controls.stop();
  }, [value, to, trigger, delay, duration]);

  useEffect(() => {
    return value.on("change", (latest) => {
      const factor = 10 ** decimals;
      const snapped = Math.round(latest * factor) / factor;
      setDisplay(format ? format(snapped) : snapped.toLocaleString());
    });
  }, [value, format, decimals]);

  return <>{display}</>;
}
