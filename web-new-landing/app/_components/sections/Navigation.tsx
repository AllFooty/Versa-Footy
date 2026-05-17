"use client";

import Image from "next/image";
import Link from "next/link";
import { useEffect, useState } from "react";
import { Button } from "../primitives/Button";
import { LanguageSwitcher } from "../primitives/LanguageSwitcher";
import type { Dict, Locale } from "../../_dictionaries";

type Props = { dict: Dict; lang: Locale };

export function Navigation({ dict, lang }: Props) {
  const [scrolled, setScrolled] = useState(false);

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > window.innerHeight * 0.85);
    onScroll();
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  return (
    <header
      data-scrolled={scrolled}
      className="fixed left-0 right-0 top-0 z-50 border-b transition-[background-color,border-color,backdrop-filter] duration-300 ease-out data-[scrolled=false]:border-transparent data-[scrolled=false]:bg-transparent data-[scrolled=true]:border-cream/10 data-[scrolled=true]:bg-accent-dark/85 data-[scrolled=true]:backdrop-blur-md"
    >
      <nav
        aria-label={dict.nav.mainAria}
        data-scrolled={scrolled}
        className="mx-auto flex max-w-[1600px] items-center justify-between px-8 transition-[padding] duration-300 ease-out data-[scrolled=false]:py-5 data-[scrolled=true]:py-3 md:px-16"
      >
        <a href={`/${lang}`} className="flex items-center" aria-label={dict.nav.homeAria}>
          <Image
            src="/versa-lockup-white.webp"
            alt={dict.footer.logoAlt}
            width={40}
            height={40}
            className="block h-10 w-10"
            priority
          />
        </a>

        <div className="hidden items-center gap-6 md:flex">
          {dict.nav.items.map((item) => (
            <Link
              key={item.id}
              href={`/${lang}#${item.id}`}
              className="inline-flex h-11 items-center rounded-sm px-2 font-display uppercase label-sm text-cream/75 transition-colors hover:text-glyph-gold focus:outline-none focus-visible:ring-2 focus-visible:ring-glyph-gold focus-visible:ring-offset-2 focus-visible:ring-offset-transparent"
            >
              {item.label}
            </Link>
          ))}
          <Link
            href={`/${lang}/about`}
            className="inline-flex h-11 items-center rounded-sm px-2 font-display uppercase label-sm text-cream/75 transition-colors hover:text-glyph-gold focus:outline-none focus-visible:ring-2 focus-visible:ring-glyph-gold focus-visible:ring-offset-2 focus-visible:ring-offset-transparent"
          >
            {dict.about.nav.label}
          </Link>
        </div>

        <div className="flex items-center gap-3">
          <LanguageSwitcher current={lang} labels={dict.switcher} />
          <Button variant="primary" size="md" asLink href={`/${lang}#get-started`}>
            {dict.nav.cta}
          </Button>
        </div>
      </nav>
    </header>
  );
}
