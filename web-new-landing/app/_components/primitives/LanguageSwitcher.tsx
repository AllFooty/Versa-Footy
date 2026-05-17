"use client";

import { usePathname, useRouter } from "next/navigation";
import { useTransition } from "react";
import { LOCALES, type Locale } from "../../_dictionaries";

type Props = {
  current: Locale;
  labels: { en: string; ar: string; label: string };
};

export function LanguageSwitcher({ current, labels }: Props) {
  const router = useRouter();
  const pathname = usePathname();
  const [isPending, startTransition] = useTransition();

  const switchTo = (next: Locale) => {
    if (next === current) return;
    const segments = (pathname ?? "/").split("/");
    // segments[0] is "" because path starts with "/"; segments[1] is the lang.
    if (segments[1] && (LOCALES as readonly string[]).includes(segments[1])) {
      segments[1] = next;
    } else {
      segments.splice(1, 0, next);
    }
    const newPath = segments.join("/") || `/${next}`;
    document.cookie = `NEXT_LOCALE=${next}; path=/; max-age=31536000; samesite=lax`;
    startTransition(() => router.push(newPath));
  };

  return (
    <div
      role="group"
      aria-label={labels.label}
      className="inline-flex items-center gap-1 rounded-full border border-cream/25 bg-cream/5 p-1 backdrop-blur"
    >
      {(["ar", "en"] as const).map((loc) => {
        const isActive = loc === current;
        return (
          <button
            key={loc}
            type="button"
            onClick={() => switchTo(loc)}
            aria-pressed={isActive}
            disabled={isPending}
            className={`inline-flex h-8 min-w-[36px] items-center justify-center rounded-full px-3 font-display label-sm uppercase transition-colors focus:outline-none focus-visible:ring-2 focus-visible:ring-glyph-gold focus-visible:ring-offset-2 focus-visible:ring-offset-transparent ${
              isActive
                ? "bg-glyph-gold text-accent-dark"
                : "text-cream/70 hover:text-glyph-gold"
            }`}
          >
            {loc === "ar" ? labels.ar : labels.en}
          </button>
        );
      })}
    </div>
  );
}
