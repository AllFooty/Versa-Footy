import Image from "next/image";
import { EASE_VERSA } from "../../_data/motion";
import { Chip } from "../primitives/Chip";
import { Reveal } from "../primitives/Reveal";
import { PathToTenThousand } from "./_islands/PathToTenThousand";
import type { Dict } from "../../_dictionaries";

type Props = { dict: Dict };

export function HoursGapSection({ dict }: Props) {
  const t = dict.hoursGap;

  return (
    <section
      id="the-problem"
      className="relative isolate w-full overflow-hidden pt-16 pb-32 md:pt-20 md:pb-48"
      style={{
        background: "linear-gradient(180deg, #F5EBD5 0%, #E8DCC0 50%, #DDD0AA 100%)",
      }}
    >
      <div className="pointer-events-none absolute right-[3%] top-[8%] h-48 w-48 opacity-[0.04]" aria-hidden="true">
        <Image src="/pattern-wing-teal.webp" alt="" fill sizes="200px" className="object-contain" />
      </div>
      <div className="pointer-events-none absolute left-[5%] bottom-[15%] h-32 w-32 opacity-[0.05] rotate-180" aria-hidden="true">
        <Image src="/pattern-wing-burgundy.webp" alt="" fill sizes="200px" className="object-contain" />
      </div>

      <Reveal
        initial={{ opacity: 0, x: 60 }}
        animate={{ opacity: 0.15, x: 0 }}
        transition={{ duration: 1.5, ease: EASE_VERSA }}
        className="pointer-events-none absolute -right-[10%] top-1/2 hidden w-[40%] max-w-[500px] -translate-y-1/2 lg:block"
      >
        <Image
          src="/versa-focused.webp"
          alt=""
          width={500}
          height={750}
          sizes="(max-width: 1024px) 0px, 500px"
          className="h-auto w-full"
          style={{ width: "auto", height: "auto" }}
        />
      </Reveal>

      <div aria-hidden className="bg-noise absolute inset-0 opacity-[0.15]" />

      <div className="relative z-10 mx-auto max-w-[1100px] px-8 md:px-16">
        <Reveal
          initial={{ opacity: 0, y: 40 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 1, ease: EASE_VERSA }}
        >
          <Chip tone="burgundy">{t.chip}</Chip>
          <h2 className="mt-6 font-display text-[clamp(44px,7vw,96px)] font-black uppercase leading-[0.95] tracking-[-0.02em] text-accent-dark">
            {t.headlineA}
            <br />
            {t.headlineB}
            <br />
            <span className="text-burgundy">{t.headlineC}</span>
          </h2>
          <p className="mt-8 max-w-[720px] font-sans text-[clamp(20px,2.2vw,26px)] leading-[1.5] text-accent-dark/85">
            {t.intro}
          </p>
        </Reveal>

        <PathToTenThousand t={t.path} />

        <Reveal
          initial={{ opacity: 0, y: 30 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 1, delay: 0.1, ease: EASE_VERSA }}
          className="mt-12 rounded-3xl border border-accent-dark/25 bg-cream/80 p-8 backdrop-blur md:p-12"
        >
          <p className="font-display label-md uppercase text-accent-dark/70">
            {t.skills.eyebrow}
          </p>
          <div className="mt-5 grid items-center gap-6 md:grid-cols-[auto_1fr] md:gap-12">
            <div>
              <div className="flex items-baseline gap-3">
                <span className="font-display text-[clamp(56px,9vw,88px)] font-black leading-none text-burgundy">
                  {t.skills.number}
                </span>
                <span className="font-display text-heading-m font-bold text-burgundy/70">{t.skills.unit}</span>
              </div>
              <p className="mt-2 font-sans text-body-l text-accent-dark/75">
                {t.skills.caption}
              </p>
            </div>
            <p className="font-sans text-[clamp(17px,1.6vw,20px)] leading-relaxed text-accent-dark/85 md:border-s md:border-accent-dark/15 md:ps-12">
              {t.skills.body}
            </p>
          </div>
        </Reveal>

        <Reveal
          initial={{ opacity: 0, y: 30 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 1, delay: 0.2, ease: EASE_VERSA }}
          className="mt-12 rounded-3xl border border-accent-dark/25 bg-cream/80 p-8 backdrop-blur md:p-12"
        >
          <p className="font-display label-md uppercase text-accent-dark/70">
            {t.cost.eyebrow}
          </p>
          <div className="mt-5 grid items-center gap-6 md:grid-cols-[auto_1fr] md:gap-12">
            <div>
              <div className="flex items-baseline gap-3">
                <span className="font-display text-[clamp(56px,9vw,88px)] font-black leading-none text-burgundy">
                  {t.cost.number}
                </span>
                <span className="font-display text-heading-m font-bold text-burgundy/70">{t.cost.unit}</span>
              </div>
              <p className="mt-2 font-sans text-body-l text-accent-dark/75">
                {t.cost.caption}
              </p>
            </div>
            <p className="font-sans text-[clamp(17px,1.6vw,20px)] leading-relaxed text-accent-dark/85 md:border-s md:border-accent-dark/15 md:ps-12">
              {t.cost.body}
            </p>
          </div>
        </Reveal>

        <Reveal
          as="p"
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 1, delay: 0.2, ease: EASE_VERSA }}
          className="mt-24 text-center font-display text-[clamp(28px,4.5vw,48px)] font-black uppercase tracking-[-0.01em] text-burgundy"
        >
          {t.closer}
        </Reveal>
      </div>
    </section>
  );
}
