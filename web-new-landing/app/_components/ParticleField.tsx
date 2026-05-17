"use client";

import { useEffect, useRef } from "react";

type Particle = {
  x: number;
  y: number;
  r: number;
  vx: number;
  vy: number;
  hue: number;
  life: number;
  maxLife: number;
};

export function ParticleField({
  density = 80,
  speed = 0.4,
  hueRange = [38, 50] as [number, number],
  className = "",
  blendMode = "screen",
  intensity = 1,
}: {
  density?: number;
  speed?: number;
  hueRange?: [number, number];
  className?: string;
  blendMode?: "screen" | "normal" | "lighten";
  intensity?: number;
}) {
  const ref = useRef<HTMLCanvasElement | null>(null);

  useEffect(() => {
    const canvas = ref.current;
    if (!canvas) return;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) return;

    const dpr = Math.min(2, window.devicePixelRatio || 1);
    let width = 0;
    let height = 0;
    let particles: Particle[] = [];
    let running = true;
    let raf = 0;

    const resize = () => {
      const rect = canvas.getBoundingClientRect();
      width = rect.width;
      height = rect.height;
      canvas.width = width * dpr;
      canvas.height = height * dpr;
      ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
    };

    const seed = () => {
      particles = Array.from({ length: density }, () => spawn(true));
    };

    function spawn(initial = false): Particle {
      const hue = hueRange[0] + Math.random() * (hueRange[1] - hueRange[0]);
      const maxLife = 320 + Math.random() * 380;
      return {
        x: Math.random() * width,
        y: initial ? Math.random() * height : height + 8,
        r: 0.6 + Math.random() * 2.2,
        vx: (Math.random() - 0.5) * 0.25 * speed,
        vy: -(0.18 + Math.random() * 0.55) * speed,
        hue,
        life: initial ? Math.random() * maxLife : 0,
        maxLife,
      };
    }

    const tick = () => {
      if (!running) return;
      ctx.clearRect(0, 0, width, height);
      for (const p of particles) {
        p.x += p.vx;
        p.y += p.vy;
        p.life += 1;
        const t = p.life / p.maxLife;
        const alpha = Math.sin(Math.PI * Math.min(1, t)) * 0.95 * intensity;
        ctx.globalAlpha = alpha;
        const grad = ctx.createRadialGradient(p.x, p.y, 0, p.x, p.y, p.r * 7);
        grad.addColorStop(0, `hsla(${p.hue}, 90%, 65%, 1)`);
        grad.addColorStop(0.4, `hsla(${p.hue}, 95%, 55%, 0.45)`);
        grad.addColorStop(1, `hsla(${p.hue}, 95%, 55%, 0)`);
        ctx.fillStyle = grad;
        ctx.beginPath();
        ctx.arc(p.x, p.y, p.r * 7, 0, Math.PI * 2);
        ctx.fill();

        ctx.fillStyle = `hsla(${p.hue}, 100%, 78%, ${alpha})`;
        ctx.beginPath();
        ctx.arc(p.x, p.y, p.r, 0, Math.PI * 2);
        ctx.fill();

        if (p.life > p.maxLife || p.y < -20 || p.x < -20 || p.x > width + 20) {
          Object.assign(p, spawn(false));
        }
      }
      ctx.globalAlpha = 1;
      raf = requestAnimationFrame(tick);
    };

    const io = new IntersectionObserver(
      (entries) => {
        for (const e of entries) {
          if (e.isIntersecting) {
            running = true;
            if (!raf) raf = requestAnimationFrame(tick);
          } else {
            running = false;
            cancelAnimationFrame(raf);
            raf = 0;
          }
        }
      },
      { threshold: 0 }
    );

    resize();
    seed();
    raf = requestAnimationFrame(tick);
    io.observe(canvas);

    const onResize = () => {
      resize();
      seed();
    };
    window.addEventListener("resize", onResize);

    return () => {
      window.removeEventListener("resize", onResize);
      io.disconnect();
      cancelAnimationFrame(raf);
    };
  }, [density, speed, hueRange[0], hueRange[1], intensity]);

  return (
    <canvas
      ref={ref}
      aria-hidden
      className={`pointer-events-none absolute inset-0 h-full w-full ${className}`}
      style={{ mixBlendMode: blendMode }}
    />
  );
}
