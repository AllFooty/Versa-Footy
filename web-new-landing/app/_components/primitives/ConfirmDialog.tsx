"use client";

import { useEffect } from "react";
import { AnimatePresence, motion } from "motion/react";
import { Button } from "./Button";

type Props = {
  open: boolean;
  title: string;
  description?: string;
  confirmLabel?: string;
  cancelLabel?: string;
  destructive?: boolean;
  onConfirm: () => void;
  onCancel: () => void;
};

export function ConfirmDialog({
  open,
  title,
  description,
  confirmLabel = "Confirm",
  cancelLabel = "Cancel",
  destructive = false,
  onConfirm,
  onCancel,
}: Props) {
  useEffect(() => {
    if (!open) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") onCancel();
    };
    document.addEventListener("keydown", onKey);
    const prev = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    return () => {
      document.removeEventListener("keydown", onKey);
      document.body.style.overflow = prev;
    };
  }, [open, onCancel]);

  return (
    <AnimatePresence>
      {open && (
        <motion.div
          className="fixed inset-0 z-[100] flex items-center justify-center px-6"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          transition={{ duration: 0.18 }}
          role="dialog"
          aria-modal="true"
          aria-labelledby="confirm-title"
        >
          <button
            type="button"
            aria-label={cancelLabel}
            className="absolute inset-0 bg-accent-dark/70 backdrop-blur-sm"
            onClick={onCancel}
          />
          <motion.div
            className="relative z-10 w-full max-w-md overflow-hidden rounded-2xl border border-accent-dark/10 bg-cream p-7 shadow-[0_30px_60px_-20px_rgba(0,0,0,0.5)]"
            initial={{ opacity: 0, y: 16, scale: 0.98 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 10, scale: 0.98 }}
            transition={{ duration: 0.2, ease: [0.22, 1, 0.36, 1] }}
          >
            <h2
              id="confirm-title"
              className="font-display uppercase font-black tracking-[-0.01em] text-[clamp(20px,2.4vw,26px)] text-accent-dark"
            >
              {title}
            </h2>
            {description && (
              <p className="mt-3 font-sans text-body-m text-accent-dark/75">
                {description}
              </p>
            )}
            <div className="mt-7 flex flex-col-reverse gap-3 sm:flex-row sm:justify-end">
              <Button variant="secondary" size="md" onClick={onCancel}>
                {cancelLabel}
              </Button>
              <Button
                variant={destructive ? "danger" : "primary"}
                size="md"
                onClick={onConfirm}
              >
                {confirmLabel}
              </Button>
            </div>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
