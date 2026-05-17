import Image from "next/image";
import { EASE_VERSA } from "../../_data/motion";
import { ResponsiveParticles } from "../primitives/ResponsiveParticles";
import { Chip } from "../primitives/Chip";
import { Reveal } from "../primitives/Reveal";
import type { Dict } from "../../_dictionaries";

type Props = { dict: Dict };

export function MeetVersaSection({ dict }: Props) {
  const t = dict.meetVersa;

  return (
    <section
      id="meet-versa"
      className="relative isolate w-full overflow-hidden"
      style={{
        background: "radial-gradient(ellipse 120% 100% at 50% 100%, #E8A93C 0%, #BB5A2B 25%, #147373 50%, #0D5959 75%, #062b2b 100%)",
      }}
    >
      <div className="pointer-events-none absolute left-[5%] top-[10%] h-40 w-40 opacity-[0.08]" aria-hidden="true">
        <Image src="/pattern-wing-burgundy.webp" alt="" fill sizes="200px" className="object-contain" />
      </div>
      <div className="pointer-events-none absolute right-[8%] top-[60%] h-32 w-32 opacity-[0.06] rotate-45" aria-hidden="true">
        <Image src="/pattern-wing-gold.webp" alt="" fill sizes="200px" className="object-contain" />
      </div>

      <div aria-hidden className="bg-noise absolute inset-0 opacity-[0.15] mix-blend-overlay" />
      <ResponsiveParticles density={80} speed={0.35} hueRange={[38, 52]} intensity={0.9} />

      <div className="relative z-10 mx-auto max-w-[1600px] px-8 py-32 md:px-16 md:py-48">
        <div className="grid grid-cols-1 items-center gap-16 lg:grid-cols-2">
          <Reveal
            margin="-15%"
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ duration: 1.4, ease: EASE_VERSA }}
            className="relative mx-auto w-full max-w-[600px]"
          >
            <div aria-hidden className="absolute inset-0 rounded-full versa-glow" />
            <div style={{ animation: "float-y 6s ease-in-out infinite" }}>
              <Image
                src="/versa-hero.webp"
                alt={t.versaAlt}
                width={800}
                height={1300}
                sizes="(max-width: 768px) 80vw, 600px"
                className="relative z-10 mx-auto h-auto w-full drop-shadow-[0_50px_80px_rgba(36,23,15,0.6)]"
                style={{ width: "auto", height: "auto" }}
              />
            </div>
          </Reveal>

          <Reveal
            margin="-15%"
            initial={{ opacity: 0, x: 60 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ duration: 1.2, delay: 0.3, ease: EASE_VERSA }}
          >
            {t.chip ? <Chip tone="gold">{t.chip}</Chip> : null}

            <h2 className="font-display text-[clamp(48px,8vw,104px)] font-black uppercase leading-[0.9] tracking-[-0.025em] text-cream">
              {t.headlineA}
              <br />
              <span className="text-glyph-gold">{t.headlineB}</span>
            </h2>

            <p className="mt-8 font-sans text-[clamp(18px,2vw,24px)] leading-relaxed text-cream/80">
              {t.sub}
            </p>

            <div className="mt-10 grid grid-cols-2 gap-4">
              {t.traits.map(({ label, value }) => (
                <div key={label} className="rounded-2xl border border-cream/15 bg-darker-teal/50 p-5 backdrop-blur">
                  <div className="font-display uppercase label-sm text-cream/70">{label}</div>
                  <div className="mt-2 font-sans text-body-base text-cream">{value}</div>
                </div>
              ))}
            </div>

            <div className="mt-10 rounded-2xl border border-glyph-gold/30 bg-glyph-gold/10 p-6 backdrop-blur">
              <blockquote className="font-display leading-[1.04] text-[clamp(22px,2.6vw,32px)] tracking-[-0.01em] text-cream">
                {t.quote.map((line, i) => (
                  <span key={i} className="block">{line}</span>
                ))}
              </blockquote>
              {t.quoteAttribution ? (
                <p className="mt-4 font-display uppercase label-sm text-glyph-gold">
                  {t.quoteAttribution}
                </p>
              ) : null}
            </div>
          </Reveal>
        </div>
      </div>
    </section>
  );
}
