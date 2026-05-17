import Image from "next/image";
import { EASE_VERSA } from "../../_data/motion";
import { Chip } from "../primitives/Chip";
import { Reveal } from "../primitives/Reveal";
import type { Dict } from "../../_dictionaries";

type Props = { dict: Dict };

export function ManifestoSection({ dict }: Props) {
  const t = dict.manifesto;

  return (
    <section
      id="manifesto"
      className="relative isolate w-full overflow-hidden bg-cream"
    >
      <div
        aria-hidden
        className="absolute inset-0"
        style={{
          background: "radial-gradient(ellipse 100% 60% at 50% 0%, rgba(232,169,60,0.12) 0%, transparent 60%)",
        }}
      />
      <div aria-hidden className="bg-noise absolute inset-0 opacity-[0.12]" />

      <div className="relative z-10 mx-auto max-w-[1200px] px-8 pt-32 pb-16 md:px-16 lg:pt-44 lg:pb-20">
        <Reveal
          margin="-20%"
          initial={{ opacity: 0, y: 30 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 1, ease: EASE_VERSA }}
          className="flex justify-center"
        >
          <Chip tone="outline">{t.chip}</Chip>
        </Reveal>

        <div className="mt-14 grid grid-cols-1 gap-10 lg:mt-20 lg:grid-cols-12 lg:gap-12 lg:items-start">
          <Reveal
            as="figure"
            margin="-20%"
            initial={{ opacity: 0, x: -30 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ duration: 1.2, delay: 0.2, ease: EASE_VERSA }}
            className="relative mx-auto w-full max-w-[340px] lg:col-span-4 lg:ml-auto lg:mr-0 lg:max-w-[300px]"
          >
            <div
              aria-hidden
              className="absolute -inset-4 rounded-[2rem] bg-gradient-to-br from-burgundy/15 to-body-gold/15 blur-2xl"
            />
            <div className="relative aspect-[3/4] overflow-hidden rounded-2xl border border-accent-dark/15 bg-warm-shadow/10 shadow-[0_40px_80px_-30px_rgba(36,23,15,0.45)]">
              <Image
                src="/wenger.webp"
                alt={t.photoCaption}
                fill
                sizes="(max-width: 1024px) 90vw, 460px"
                className="object-cover"
              />
            </div>
            <figcaption className="mt-5 flex items-start gap-3 text-start">
              <span
                aria-hidden="true"
                className="mt-[10px] h-px w-8 shrink-0 bg-burgundy/50"
              />
              <div>
                <p className="font-display uppercase label-md font-bold text-accent-dark">
                  {t.photoCaption}
                </p>
                <p className="mt-1.5 font-sans text-body-s leading-snug text-warm-shadow">
                  {t.photoRole}
                </p>
              </div>
            </figcaption>
          </Reveal>

          <Reveal
            margin="-20%"
            initial={{ opacity: 0, y: 30 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 1.2, delay: 0.4, ease: EASE_VERSA }}
            className="lg:col-span-8"
          >
            <span
              aria-hidden="true"
              className="block font-sans text-[clamp(72px,9vw,128px)] leading-none text-burgundy/25"
            >
              &ldquo;
            </span>
            <blockquote className="-mt-4 font-sans text-[clamp(20px,2.4vw,32px)] leading-[1.45] text-accent-dark">
              {t.quotePartA}
              <span className="font-bold text-burgundy">{t.quoteTechnique}</span>
              {t.quotePartB}
              <span className="font-bold text-burgundy">{t.quoteAges}</span>
              {t.quotePartC}
            </blockquote>
          </Reveal>
        </div>

        <Reveal
          margin="-20%"
          initial={{ scaleX: 0 }}
          animate={{ scaleX: 1 }}
          transition={{ duration: 1.2, delay: 0.4, ease: EASE_VERSA }}
          className="mx-auto mt-16 h-px w-40 origin-center bg-gradient-to-r from-transparent via-burgundy to-transparent"
        />

        <Reveal
          margin="-20%"
          initial={{ opacity: 0, y: 30 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 1.1, delay: 0.2, ease: EASE_VERSA }}
          className="mt-16 flex flex-col items-center text-center"
        >
          <h3 className="max-w-3xl font-display font-black uppercase leading-[0.95] tracking-[-0.015em] text-[clamp(34px,5vw,68px)]">
            <span className="block text-accent-dark">{t.closingA}</span>
            <span className="block text-accent-dark">{t.closingB}</span>
            <span className="block text-burgundy">{t.closingC}</span>
          </h3>

          <a
            href="#the-problem"
            className="group mt-10 inline-flex items-center gap-2 font-sans text-body-l text-burgundy/85 transition-colors hover:text-burgundy focus:outline-none focus-visible:ring-2 focus-visible:ring-burgundy focus-visible:ring-offset-2 focus-visible:ring-offset-cream"
          >
            {t.seeMath}
            <span
              aria-hidden="true"
              className="inline-block transition-transform group-hover:translate-x-0.5"
            >
              →
            </span>
          </a>
        </Reveal>
      </div>
    </section>
  );
}
