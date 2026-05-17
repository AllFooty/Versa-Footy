"use client";

import { useEffect, type ReactNode } from "react";
import { AnimatePresence, motion } from "motion/react";

type Size = "sm" | "md" | "lg" | "xl";

const sizes: Record<Size, string> = {
  sm: "max-w-md",
  md: "max-w-xl",
  lg: "max-w-3xl",
  xl: "max-w-5xl",
};

export function Modal({
  open,
  onClose,
  children,
  size = "md",
  ariaLabel,
}: {
  open: boolean;
  onClose: () => void;
  children: ReactNode;
  size?: Size;
  ariaLabel?: string;
}) {
  useEffect(() => {
    if (!open) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") onClose();
    };
    document.addEventListener("keydown", onKey);
    const prev = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    return () => {
      document.removeEventListener("keydown", onKey);
      document.body.style.overflow = prev;
    };
  }, [open, onClose]);

  return (
    <AnimatePresence>
      {open && (
        <motion.div
          className="fixed inset-0 z-[100] flex items-start justify-center overflow-y-auto px-4 py-8 md:items-center"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          transition={{ duration: 0.18 }}
          aria-modal="true"
          role="dialog"
          aria-label={ariaLabel}
          onClick={onClose}
        >
          <div className="fixed inset-0 bg-accent-dark/60 backdrop-blur-sm" aria-hidden />
          <motion.div
            className={`relative z-10 w-full ${sizes[size]} rounded-2xl border border-accent-dark/10 bg-cream p-6 shadow-2xl md:p-8`}
            initial={{ y: 20, opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
            exit={{ y: 20, opacity: 0 }}
            transition={{ duration: 0.22, ease: "easeOut" }}
            onClick={(e) => e.stopPropagation()}
          >
            {children}
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
