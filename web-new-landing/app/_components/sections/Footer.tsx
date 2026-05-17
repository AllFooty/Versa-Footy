import Image from "next/image";
import Link from "next/link";
import type { Dict, Locale } from "../../_dictionaries";

type Props = { dict: Dict; lang?: Locale };

export function Footer({ dict, lang }: Props) {
  const t = dict.footer;
  return (
    <footer className="relative w-full bg-cream py-16">
      <div className="pointer-events-none absolute left-1/2 top-0 h-24 w-24 -translate-x-1/2 -translate-y-1/2 opacity-[0.06]" aria-hidden="true">
        <Image src="/pattern-wing-cream.webp" alt="" fill sizes="200px" className="object-contain" />
      </div>

      <div className="mx-auto max-w-[1400px] px-8 md:px-16">
        <div className="flex flex-col items-center justify-between gap-8 border-t border-accent-dark/25 pt-10 md:flex-row">
          <div className="flex items-center">
            <Image
              src="/versa-lockup-navy.webp"
              alt={t.logoAlt}
              width={36}
              height={36}
              className="h-9 w-9"
              style={{ width: "auto", height: "auto" }}
            />
          </div>

          <div className="flex flex-wrap items-center justify-center gap-6 font-display uppercase label-sm text-accent-dark/70">
            {lang && (
              <>
                <Link
                  href={`/${lang}/about`}
                  className="transition-colors hover:text-accent-dark focus:outline-none focus-visible:ring-2 focus-visible:ring-burgundy focus-visible:ring-offset-2 focus-visible:ring-offset-cream"
                >
                  {dict.about.nav.label}
                </Link>
                <span aria-hidden="true" className="hidden md:inline">·</span>
              </>
            )}
            <span>{t.subBrand}</span>
            <span aria-hidden="true" className="hidden md:inline">·</span>
            <span>{t.location}</span>
            <span aria-hidden="true" className="hidden md:inline">·</span>
            <span>{t.year}</span>
          </div>

        </div>
      </div>
    </footer>
  );
}
