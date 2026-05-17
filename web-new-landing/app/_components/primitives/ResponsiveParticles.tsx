"use client";

import { ParticleField } from "../ParticleField";
import { useIsMobile } from "./useIsMobile";

export function ResponsiveParticles({
  density,
  speed,
  hueRange,
  intensity,
}: {
  density: number;
  speed: number;
  hueRange: [number, number];
  intensity: number;
}) {
  const isMobile = useIsMobile();

  if (isMobile === null) return null;

  return (
    <ParticleField
      density={isMobile ? Math.round(density * 0.4) : density}
      speed={speed}
      hueRange={hueRange}
      intensity={isMobile ? intensity * 0.7 : intensity}
    />
  );
}
