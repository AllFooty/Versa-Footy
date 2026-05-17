"use client";

import { useEffect } from "react";
import { AnimatePresence, motion } from "motion/react";
import type { Dict } from "../../_dictionaries";
import { LOGIN_HREF } from "../links";

type Props = {
  open: boolean;
  onClose: () => void;
  dict: Dict;
};

const APP_STORE_URL = "https://apps.apple.com/us/app/versa-footy/id6758730632";

export function GetStartedModal({ open, onClose, dict }: Props) {
  const t = dict.getStartedModal;

  useEffect(() => {
    if (!open) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") onClose();
    };
    document.addEventListener("keydown", onKey);
    const prevOverflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    return () => {
      document.removeEventListener("keydown", onKey);
      document.body.style.overflow = prevOverflow;
    };
  }, [open, onClose]);

  return (
    <AnimatePresence>
      {open && (
        <motion.div
          className="fixed inset-0 z-[100] flex items-center justify-center px-6"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          transition={{ duration: 0.2 }}
          role="dialog"
          aria-modal="true"
          aria-labelledby="get-started-modal-title"
        >
          <button
            type="button"
            aria-label={t.closeAria}
            className="absolute inset-0 bg-accent-dark/80 backdrop-blur-md"
            onClick={onClose}
          />

          <motion.div
            className="relative z-10 w-full max-w-lg overflow-hidden rounded-3xl border border-cream/15 bg-accent-dark p-8 shadow-[0_30px_80px_-20px_rgba(0,0,0,0.7)] md:p-10"
            initial={{ opacity: 0, y: 20, scale: 0.97 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 10, scale: 0.98 }}
            transition={{ duration: 0.25, ease: [0.22, 1, 0.36, 1] }}
          >
            <button
              type="button"
              onClick={onClose}
              aria-label={t.closeAria}
              className="absolute end-4 top-4 inline-flex h-9 w-9 items-center justify-center rounded-full text-cream/70 transition-colors hover:bg-cream/10 hover:text-cream focus:outline-none focus-visible:ring-2 focus-visible:ring-glyph-gold"
            >
              <svg width="16" height="16" viewBox="0 0 16 16" fill="none" aria-hidden="true">
                <path d="M3 3l10 10M13 3L3 13" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" />
              </svg>
            </button>

            <h2
              id="get-started-modal-title"
              className="font-display text-[clamp(26px,4vw,34px)] font-black uppercase leading-[1.05] tracking-[-0.01em] text-cream"
            >
              {t.title}
            </h2>
            <p className="mt-3 font-sans text-body-m text-cream/75">{t.subtitle}</p>

            <div className="mt-7 flex flex-col gap-3">
              <a
                href={APP_STORE_URL}
                target="_blank"
                rel="noopener noreferrer"
                onClick={onClose}
                className="group flex items-center justify-between gap-4 rounded-2xl border border-cream/20 bg-cream/[0.05] p-5 transition-all duration-fast hover:-translate-y-0.5 hover:border-glyph-gold/70 hover:bg-cream/10 focus:outline-none focus-visible:ring-2 focus-visible:ring-glyph-gold"
              >
                <div className="flex items-center gap-4">
                  <span className="inline-flex h-12 w-12 shrink-0 items-center justify-center rounded-xl bg-glyph-gold/15 text-glyph-gold">
                    <svg viewBox="0 0 24 24" className="h-6 w-6" aria-hidden="true">
                      <path
                        fill="currentColor"
                        d="M16.365 1.43c0 1.14-.46 2.24-1.22 3.01-.82.83-2.15 1.46-3.25 1.37-.13-1.1.42-2.25 1.18-3.03.82-.85 2.27-1.47 3.29-1.35zM20.5 17.46c-.55 1.27-.81 1.84-1.52 2.96-.99 1.57-2.39 3.52-4.12 3.54-1.54.01-1.93-1-4.02-.99-2.09.01-2.52 1.01-4.07.99-1.73-.02-3.06-1.78-4.05-3.34-2.77-4.36-3.06-9.48-1.35-12.2 1.21-1.93 3.13-3.07 4.93-3.07 1.83 0 2.98 1 4.49 1 1.47 0 2.36-1 4.48-1 1.59 0 3.28.87 4.49 2.37-3.95 2.16-3.31 7.81.74 9.74z"
                      />
                    </svg>
                  </span>
                  <span className="flex flex-col items-start text-start">
                    <span className="font-display text-[17px] font-black uppercase tracking-[0.04em] text-cream">
                      {t.download.label}
                    </span>
                    <span className="mt-1 font-sans text-body-s text-cream/65">
                      {t.download.description}
                    </span>
                  </span>
                </div>
                <svg width="18" height="18" viewBox="0 0 16 16" fill="none" aria-hidden="true" className="shrink-0 text-cream/50 transition-colors group-hover:text-glyph-gold rtl:rotate-180">
                  <path d="M3 8h10M9 4l4 4-4 4" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round" />
                </svg>
              </a>

              <a
                href={LOGIN_HREF}
                onClick={onClose}
                className="group flex items-center justify-between gap-4 rounded-2xl border border-cream/20 bg-cream/[0.05] p-5 transition-all duration-fast hover:-translate-y-0.5 hover:border-glyph-gold/70 hover:bg-cream/10 focus:outline-none focus-visible:ring-2 focus-visible:ring-glyph-gold"
              >
                <div className="flex items-center gap-4">
                  <span className="inline-flex h-12 w-12 shrink-0 items-center justify-center rounded-xl bg-cream/10 text-cream">
                    <svg viewBox="0 0 24 24" className="h-6 w-6" fill="none" aria-hidden="true">
                      <path
                        d="M10 17l5-5-5-5M15 12H4M9 3h7a2 2 0 012 2v14a2 2 0 01-2 2H9"
                        stroke="currentColor"
                        strokeWidth="1.7"
                        strokeLinecap="round"
                        strokeLinejoin="round"
                      />
                    </svg>
                  </span>
                  <span className="flex flex-col items-start text-start">
                    <span className="font-display text-[17px] font-black uppercase tracking-[0.04em] text-cream">
                      {t.login.label}
                    </span>
                    <span className="mt-1 font-sans text-body-s text-cream/65">
                      {t.login.description}
                    </span>
                  </span>
                </div>
                <svg width="18" height="18" viewBox="0 0 16 16" fill="none" aria-hidden="true" className="shrink-0 text-cream/50 transition-colors group-hover:text-glyph-gold rtl:rotate-180">
                  <path d="M3 8h10M9 4l4 4-4 4" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round" />
                </svg>
              </a>
            </div>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
