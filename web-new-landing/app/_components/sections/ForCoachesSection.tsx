import { EASE_VERSA } from "../../_data/motion";
import { Chip } from "../primitives/Chip";
import { Button } from "../primitives/Button";
import { Reveal } from "../primitives/Reveal";
import type { Dict } from "../../_dictionaries";

type Props = { dict: Dict };

export function ForCoachesSection({ dict }: Props) {
  const t = dict.forCoaches;

  return (
    <section
      id="for-coaches"
      className="relative isolate w-full overflow-hidden bg-accent-dark py-32 md:py-48"
    >
      <div
        aria-hidden
        className="absolute inset-0"
        style={{
          background: "radial-gradient(ellipse 80% 60% at 50% 100%, rgba(20,115,115,0.4) 0%, transparent 60%)",
        }}
      />
      <div aria-hidden className="bg-noise absolute inset-0 opacity-[0.2] mix-blend-overlay" />

      <div className="relative z-10 mx-auto max-w-[1400px] px-8 md:px-16">
        <div className="grid grid-cols-1 gap-16 lg:grid-cols-2">
          <Reveal
            initial={{ opacity: 0, y: 40 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 1, ease: EASE_VERSA }}
          >
            <Chip tone="teal">{t.chip}</Chip>
            <h2 className="mt-6 font-display text-[clamp(48px,7vw,100px)] font-black uppercase leading-[0.9] tracking-[-0.02em] text-cream">
              {t.headlineA}
              <br />
              <span className="text-glyph-gold">{t.headlineB}</span>
            </h2>
            <p className="mt-8 font-sans text-[clamp(18px,2vw,22px)] leading-relaxed text-cream/70">
              {t.sub}
            </p>

            <div className="mt-10 flex flex-col gap-4">
              {t.bullets.map((item) => (
                <div key={item} className="flex items-start gap-4">
                  <div className="mt-2 h-2 w-2 shrink-0 rounded-full bg-glyph-gold" />
                  <span className="font-sans text-heading-s text-cream/80">{item}</span>
                </div>
              ))}
            </div>

            <div className="mt-10 flex flex-col items-start gap-3">
              <Button variant="primary" size="lg" asLink href="#get-started">
                {t.cta}
                <svg width="16" height="16" viewBox="0 0 16 16" fill="none" aria-hidden="true">
                  <path d="M3 8h10M9 4l4 4-4 4" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round"/>
                </svg>
              </Button>
              <p className="font-sans text-body-s text-cream/80">
                {t.ctaNote}
              </p>
            </div>
          </Reveal>

          <Reveal
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ duration: 1, delay: 0.3, ease: EASE_VERSA }}
            className="flex items-center justify-center"
          >
            <div className="w-full max-w-[420px] rounded-3xl border border-cream/10 bg-darker-teal/80 p-8 backdrop-blur">
              <div className="font-display uppercase label-sm text-cream/70">
                {t.dashboard.label}
              </div>
              <div className="mt-8 space-y-6">
                <div>
                  <div className="flex items-baseline justify-between font-display uppercase label-sm">
                    <span className="text-cream/75">{t.dashboard.sessions}</span>
                    <span className="text-glyph-gold">{t.dashboard.sessionsValue}</span>
                  </div>
                  <div className="mt-3 h-2 w-full overflow-hidden rounded-full bg-cream/10">
                    <Reveal
                      initial={{ width: 0 }}
                      animate={{ width: "76%" }}
                      transition={{ duration: 1.5, delay: 0.6, ease: EASE_VERSA }}
                      className="h-full rounded-full bg-gradient-to-r from-glyph-gold to-body-gold"
                    />
                  </div>
                </div>
                <div>
                  <div className="flex items-baseline justify-between font-display uppercase label-sm">
                    <span className="text-cream/75">{t.dashboard.active}</span>
                    <span className="text-glyph-gold">{t.dashboard.activeValue}</span>
                  </div>
                  <div className="mt-3 h-2 w-full overflow-hidden rounded-full bg-cream/10">
                    <Reveal
                      initial={{ width: 0 }}
                      animate={{ width: "82%" }}
                      transition={{ duration: 1.5, delay: 0.8, ease: EASE_VERSA }}
                      className="h-full rounded-full bg-gradient-to-r from-deep-teal to-glyph-gold"
                    />
                  </div>
                </div>
                <div className="rounded-2xl border border-glyph-gold/30 bg-glyph-gold/10 p-4">
                  <div className="font-display uppercase label-sm text-glyph-gold">
                    {t.dashboard.highlightLabel}
                  </div>
                  <div className="mt-2 font-sans text-body-m text-cream">
                    {t.dashboard.highlightBody}
                  </div>
                </div>
              </div>
            </div>
          </Reveal>
        </div>
      </div>
    </section>
  );
}
