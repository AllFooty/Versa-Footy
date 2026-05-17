"use client";

import Link from "next/link";
import Image from "next/image";
import { usePathname } from "next/navigation";
import type { ReactNode } from "react";
import { useAuth } from "../../_lib/auth/AuthProvider";
import { LanguageSwitcher } from "../primitives/LanguageSwitcher";
import { OrgSwitcher } from "./OrgSwitcher";
import type { ProductDict } from "../../_dictionaries/product";
import type { Dict, Locale } from "../../_dictionaries";

type NavItem = { id: string; href: string; label: string; visible: boolean };

export function AppShell({
  children,
  dict,
  productDict,
  lang,
}: {
  children: ReactNode;
  dict: Dict;
  productDict: ProductDict;
  lang: Locale;
}) {
  const pathname = usePathname();
  const { signOut, isAdmin, isCoach, profile } = useAuth();

  const items: NavItem[] = [
    { id: "home", href: `/${lang}/home`, label: productDict.shell.nav.home, visible: true },
    {
      id: "academy",
      href: `/${lang}/academy`,
      label: productDict.shell.nav.academy,
      visible: isCoach,
    },
    {
      id: "library",
      href: `/${lang}/library`,
      label: productDict.shell.nav.library,
      visible: isAdmin,
    },
    {
      id: "settings",
      href: `/${lang}/settings`,
      label: productDict.shell.nav.settings,
      visible: true,
    },
  ];

  return (
    <div className="flex min-h-screen flex-col bg-cream text-accent-dark">
      <header className="sticky top-0 z-40 border-b border-cream/10 bg-accent-dark/95 text-cream backdrop-blur-md">
        <div className="mx-auto flex max-w-[1600px] items-center justify-between gap-4 px-6 py-3 md:px-10">
          <div className="flex items-center gap-6">
            <Link href={`/${lang}/home`} className="flex items-center" aria-label={dict.nav.homeAria}>
              <Image
                src="/versa-lockup-white.webp"
                alt={dict.footer.logoAlt}
                width={36}
                height={36}
                className="block h-9 w-9"
                priority
              />
            </Link>
            <nav aria-label={dict.nav.mainAria} className="hidden items-center gap-1 md:flex">
              {items
                .filter((i) => i.visible)
                .map((item) => {
                  const active = pathname === item.href || pathname.startsWith(`${item.href}/`);
                  return (
                    <Link
                      key={item.id}
                      href={item.href}
                      aria-current={active ? "page" : undefined}
                      className={`inline-flex h-10 items-center rounded-full px-4 font-display uppercase label-sm transition-colors ${
                        active
                          ? "bg-cream/10 text-glyph-gold"
                          : "text-cream/75 hover:text-glyph-gold"
                      }`}
                    >
                      {item.label}
                    </Link>
                  );
                })}
            </nav>
          </div>

          <div className="flex items-center gap-3">
            <OrgSwitcher dict={productDict} />
            <LanguageSwitcher current={lang} labels={dict.switcher} />
            <button
              type="button"
              onClick={() => void signOut()}
              className="inline-flex h-9 items-center rounded-full border border-cream/20 px-4 font-display uppercase label-sm text-cream/85 transition-colors hover:border-glyph-gold hover:text-glyph-gold focus:outline-none focus-visible:ring-2 focus-visible:ring-glyph-gold"
              aria-label={productDict.common.signOut}
              title={profile?.email ?? undefined}
            >
              {productDict.common.signOut}
            </button>
          </div>
        </div>
      </header>

      <main className="flex flex-1 flex-col">{children}</main>
    </div>
  );
}
