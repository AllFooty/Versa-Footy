import Image from "next/image";
import type { Dict } from "../../_dictionaries";

type Props = { dict: Dict };

type Brand = {
  key: "versa" | "fair" | "kaas" | "juggle";
  href: string | null;
  dot: string;
  current?: boolean;
};

const BRANDS: Brand[] = [
  { key: "versa", href: null, dot: "var(--color-glyph-gold)", current: true },
  { key: "fair", href: "https://fairfooty.com/", dot: "var(--color-deep-teal)" },
  { key: "kaas", href: "https://kaasfooty.com/", dot: "var(--color-shadow-plumage)" },
  { key: "juggle", href: "https://jugglefooty.com/", dot: "var(--color-burgundy)" },
];

export function AllFootyFamilySection({ dict }: Props) {
  const t = dict.family;

  return (
    <section
      aria-labelledby="all-footy-family-heading"
      className="relative isolate w-full overflow-hidden bg-cream pt-20 pb-12 md:pt-28 md:pb-16"
    >
      <div
        aria-hidden="true"
        className="pointer-events-none absolute left-1/2 top-8 h-40 w-40 -translate-x-1/2 opacity-[0.05]"
      >
        <Image src="/pattern-wing-cream.webp" alt="" fill sizes="320px" className="object-contain" />
      </div>

      <div className="relative mx-auto max-w-[1400px] px-8 md:px-16">
        <div className="flex flex-col items-center text-center">
          <span className="font-display uppercase label-sm font-bold tracking-[0.18em] text-accent-dark/60">
            {t.eyebrow}
          </span>
          <h2
            id="all-footy-family-heading"
            className="mt-4 font-display text-4xl font-bold leading-[0.95] text-accent-dark md:text-6xl"
          >
            <span>{t.headlineA}</span>{" "}
            <span className="text-burgundy">{t.headlineB}</span>
          </h2>
          <p className="mt-5 max-w-xl text-base text-accent-dark/70 md:text-lg">
            {t.sub}
          </p>
        </div>

        <ul
          role="list"
          className="mt-12 grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4 lg:gap-5"
        >
          {BRANDS.map((brand) => {
            const name = t.brands[brand.key];
            const isCurrent = brand.current === true;
            const dot = (
              <span
                aria-hidden="true"
                className="inline-block h-2.5 w-2.5 shrink-0 rounded-full"
                style={{ background: brand.dot }}
              />
            );
            const inner = (
              <>
                <span className="flex items-center gap-3">
                  {dot}
                  <span className="font-display text-lg font-bold text-accent-dark md:text-xl">
                    {name}
                  </span>
                </span>
                {isCurrent ? (
                  <span className="font-display uppercase label-sm font-bold tracking-[0.14em] text-accent-dark/55">
                    {t.youreHere}
                  </span>
                ) : (
                  <span
                    aria-hidden="true"
                    className="font-display text-xl text-accent-dark/40 transition-transform duration-300 group-hover:translate-x-1 rtl:rotate-180 rtl:group-hover:-translate-x-1"
                  >
                    →
                  </span>
                )}
              </>
            );

            return (
              <li key={brand.key}>
                {isCurrent || !brand.href ? (
                  <div
                    aria-current={isCurrent ? "page" : undefined}
                    className="flex items-center justify-between gap-4 rounded-2xl border border-accent-dark/15 bg-cream px-5 py-5 shadow-[0_1px_0_rgba(36,23,15,0.04)] ring-1 ring-glyph-gold/60"
                  >
                    {inner}
                  </div>
                ) : (
                  <a
                    href={brand.href}
                    target="_blank"
                    rel="noopener noreferrer"
                    aria-label={t.visitAria.replace("{name}", name)}
                    className="group flex items-center justify-between gap-4 rounded-2xl border border-accent-dark/15 bg-cream px-5 py-5 shadow-[0_1px_0_rgba(36,23,15,0.04)] transition-all duration-300 hover:-translate-y-0.5 hover:border-accent-dark/35 hover:shadow-[0_18px_30px_-18px_rgba(36,23,15,0.35)] focus-visible:-translate-y-0.5 focus-visible:border-accent-dark/45 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-burgundy"
                  >
                    {inner}
                  </a>
                )}
              </li>
            );
          })}
        </ul>
      </div>
    </section>
  );
}
