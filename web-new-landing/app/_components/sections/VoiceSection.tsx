import Image from "next/image";
import { EASE_VERSA } from "../../_data/motion";
import { Chip } from "../primitives/Chip";
import { Reveal } from "../primitives/Reveal";
import type { Dict } from "../../_dictionaries";

type Props = { dict: Dict };

export function VoiceSection({ dict }: Props) {
  const t = dict.voice;

  return (
    <section
      id="voice"
      className="relative isolate w-full overflow-hidden py-32 md:py-48"
      style={{
        background: "linear-gradient(180deg, #FAF6EE 0%, #F8E7B5 50%, #E8A93C 100%)",
      }}
    >
      <div className="pointer-events-none absolute left-[8%] top-[15%] h-32 w-32 opacity-[0.06]" aria-hidden="true">
        <Image src="/pattern-wing-burgundy.webp" alt="" fill sizes="200px" className="object-contain" />
      </div>
      <div className="pointer-events-none absolute right-[5%] bottom-[20%] h-40 w-40 opacity-[0.05] rotate-90" aria-hidden="true">
        <Image src="/pattern-wing-gold.webp" alt="" fill sizes="200px" className="object-contain" />
      </div>

      <div aria-hidden className="bg-noise absolute inset-0 opacity-[0.12] mix-blend-overlay" />

      <div className="relative z-10 mx-auto max-w-[1400px] px-8 md:px-16">
        <Reveal
          initial={{ opacity: 0, y: 40 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 1, ease: EASE_VERSA }}
        >
          <Chip tone="burgundy">{t.chip}</Chip>
          <h2 className="mt-6 font-display text-[clamp(44px,7vw,96px)] font-black uppercase leading-[0.95] tracking-[-0.02em] text-accent-dark">
            {t.headlineA}
            <br />
            <span className="text-burgundy">{t.headlineB}</span>
          </h2>
        </Reveal>

        <div className="mt-16 grid grid-cols-1 gap-12 lg:grid-cols-12">
          <Reveal
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ duration: 1.2, delay: 0.2, ease: EASE_VERSA }}
            className="relative hidden lg:col-span-4 lg:flex lg:items-center lg:justify-center"
          >
            <div aria-hidden className="absolute inset-0 rounded-full versa-glow-subtle" />
            <Image
              src="/versa-wink.webp"
              alt={t.versaAlt}
              width={420}
              height={600}
              sizes="(min-width: 1024px) 380px, 280px"
              className="relative z-10 h-auto w-full max-w-[380px] drop-shadow-[0_30px_50px_rgba(36,23,15,0.35)]"
              style={{ animation: "float-y 6s ease-in-out infinite" }}
            />
          </Reveal>

          <Reveal
            as="ul"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ duration: 1, delay: 0.2, ease: EASE_VERSA }}
            aria-label={t.notificationsAria}
            className="flex flex-col gap-4 lg:col-span-3"
          >
            {t.notifications.map((n, i) => (
              <Reveal
                as="li"
                key={i}
                initial={{ opacity: 0, x: -20 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ duration: 0.8, delay: 0.4 + i * 0.1, ease: EASE_VERSA }}
                className="rounded-2xl border border-accent-dark/25 bg-cream/90 p-5 shadow-card-soft backdrop-blur"
                style={{ transform: `rotate(${(i % 2 === 0 ? 1 : -1) * (0.5 + i * 0.3)}deg)` }}
              >
                <div className="flex items-center gap-3">
                  <div className="flex h-7 w-7 items-center justify-center rounded-lg bg-glyph-gold font-display text-[13px] font-black text-accent-dark" aria-hidden="true">
                    V
                  </div>
                  <span className="font-display uppercase label-sm text-accent-dark/70">
                    {n.time}
                  </span>
                </div>
                <p className="mt-3 font-sans text-body-base text-accent-dark">{n.body}</p>
              </Reveal>
            ))}
          </Reveal>

          <Reveal
            initial={{ opacity: 0, x: 40 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ duration: 1, delay: 0.4, ease: EASE_VERSA }}
            className="flex flex-col gap-6 lg:col-span-5"
          >
            {t.rules.map((rule, i) => (
              <Reveal
                key={rule.n}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.8, delay: 0.2 + i * 0.1, ease: EASE_VERSA }}
                className="rounded-2xl border border-accent-dark/25 bg-cream/70 p-6 backdrop-blur"
              >
                <span className="font-display uppercase label-sm text-burgundy">
                  {rule.n} · {t.ruleLabel}
                </span>
                <h3 className="mt-3 font-display text-heading-s uppercase tracking-[0.02em] text-accent-dark">
                  {rule.title}
                </h3>
                <p className="mt-2 font-sans text-body-m leading-relaxed text-accent-dark/70">
                  {rule.body}
                </p>
              </Reveal>
            ))}
          </Reveal>
        </div>
      </div>
    </section>
  );
}
