import Image from "next/image";
import { EASE_VERSA } from "../../_data/motion";
import { Chip } from "../primitives/Chip";
import { Reveal } from "../primitives/Reveal";
import type { Dict } from "../../_dictionaries";

type Props = { dict: Dict };

const SCREEN_SRCS = [
  "/app-skill-tree.webp",
  "/app-drill.webp",
  "/app-achievement.webp",
] as const;

export function AppShowcaseSection({ dict }: Props) {
  const t = dict.appShowcase;

  return (
    <section
      id="the-app"
      className="relative isolate w-full overflow-hidden bg-cream py-32 md:py-48"
    >
      <div className="pointer-events-none absolute right-[10%] top-[5%] h-48 w-48 opacity-[0.04]" aria-hidden="true">
        <Image src="/pattern-wing-cream.webp" alt="" fill sizes="200px" className="object-contain" />
      </div>
      <div className="pointer-events-none absolute left-[5%] bottom-[10%] h-36 w-36 opacity-[0.05] -rotate-12" aria-hidden="true">
        <Image src="/pattern-wing-teal.webp" alt="" fill sizes="200px" className="object-contain" />
      </div>

      <div
        aria-hidden
        className="absolute inset-0"
        style={{
          background: "radial-gradient(ellipse 80% 50% at 50% 100%, rgba(20,115,115,0.08) 0%, transparent 60%)",
        }}
      />
      <div aria-hidden className="bg-noise absolute inset-0 opacity-[0.1]" />

      <div className="relative z-10 mx-auto max-w-[1400px] px-8 md:px-16">
        <Reveal
          initial={{ opacity: 0, y: 40 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 1, ease: EASE_VERSA }}
          className="text-center"
        >
          <Chip tone="teal">{t.chip}</Chip>
          <h2 className="mt-6 font-display text-[clamp(44px,7vw,96px)] font-black uppercase leading-[0.95] tracking-[-0.02em] text-accent-dark">
            {t.headlineA}
            <br />
            <span className="text-deep-teal">{t.headlineB}</span>
          </h2>
          <p className="mx-auto mt-8 max-w-2xl font-sans text-[clamp(18px,2vw,24px)] leading-relaxed text-warm-shadow">
            {t.sub}
          </p>
        </Reveal>

        <div className="mt-20 flex flex-col items-center justify-center gap-8 lg:flex-row lg:gap-6">
          {/* Skill Tree */}
          <Reveal
            initial={{ opacity: 0, y: 40, rotate: -3 }}
            animate={{ opacity: 1, y: 0, rotate: -3 }}
            transition={{ duration: 1, delay: 0.2, ease: EASE_VERSA }}
            className="relative"
          >
            <div className="absolute -inset-4 rounded-[3rem] bg-gradient-to-br from-body-gold/30 to-deep-teal/20 blur-2xl" />
            <div className="relative w-[260px] overflow-hidden rounded-[2.5rem] border-[8px] border-accent-dark/90 bg-accent-dark shadow-card-elevated md:w-[280px]">
              <Image
                src={SCREEN_SRCS[0]}
                alt={t.screens[0].alt}
                width={280}
                height={560}
                sizes="280px"
                className="block h-auto w-full"
              />
            </div>
            <div className="mt-6 text-center">
              <p className="font-display uppercase label-sm text-burgundy">{t.screens[0].title}</p>
              <p className="mt-1 font-sans text-body-s text-accent-dark/70">{t.screens[0].caption}</p>
            </div>
          </Reveal>

          {/* Drill - Center */}
          <Reveal
            initial={{ opacity: 0, y: 40 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 1, delay: 0.4, ease: EASE_VERSA }}
            className="relative z-10 lg:-my-8"
          >
            <div className="absolute -inset-6 rounded-[3.5rem] bg-gradient-to-br from-glyph-gold/40 to-burgundy/20 blur-3xl" />
            <div className="relative w-[300px] overflow-hidden rounded-[3rem] border-[10px] border-accent-dark/90 bg-accent-dark shadow-[0_60px_120px_-30px_rgba(36,23,15,0.6)] md:w-[320px]">
              <Image
                src={SCREEN_SRCS[1]}
                alt={t.screens[1].alt}
                width={320}
                height={640}
                sizes="320px"
                className="block h-auto w-full"
              />
            </div>
            <div className="mt-8 text-center">
              <p className="font-display uppercase label-sm text-burgundy">{t.screens[1].title}</p>
              <p className="mt-1 font-sans text-body-s text-accent-dark/70">{t.screens[1].caption}</p>
            </div>
          </Reveal>

          {/* Achievement */}
          <Reveal
            initial={{ opacity: 0, y: 40, rotate: 3 }}
            animate={{ opacity: 1, y: 0, rotate: 3 }}
            transition={{ duration: 1, delay: 0.6, ease: EASE_VERSA }}
            className="relative"
          >
            <div className="absolute -inset-4 rounded-[3rem] bg-gradient-to-br from-glyph-gold/30 to-body-gold/20 blur-2xl" />
            <div className="relative w-[260px] overflow-hidden rounded-[2.5rem] border-[8px] border-accent-dark/90 bg-accent-dark shadow-card-elevated md:w-[280px]">
              <Image
                src={SCREEN_SRCS[2]}
                alt={t.screens[2].alt}
                width={280}
                height={560}
                sizes="280px"
                className="block h-auto w-full"
              />
            </div>
            <div className="mt-6 text-center">
              <p className="font-display uppercase label-sm text-burgundy">{t.screens[2].title}</p>
              <p className="mt-1 font-sans text-body-s text-accent-dark/70">{t.screens[2].caption}</p>
            </div>
          </Reveal>
        </div>

        <Reveal
          initial={{ opacity: 0, x: -60 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ duration: 1.2, delay: 0.4, ease: EASE_VERSA }}
          className="pointer-events-none absolute -left-[5%] bottom-[10%] hidden w-[30%] max-w-[350px] lg:block"
        >
          <Image
            src="/versa-dribbling.webp"
            alt=""
            width={400}
            height={600}
            sizes="(max-width: 1024px) 0px, 350px"
            className="h-auto w-full opacity-90 drop-shadow-[0_30px_60px_rgba(36,23,15,0.4)]"
            style={{ width: "auto", height: "auto", animation: "float-y 5s ease-in-out infinite" }}
          />
        </Reveal>
      </div>
    </section>
  );
}
