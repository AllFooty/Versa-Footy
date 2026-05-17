"use client";

import { useEffect, useId, useRef, useState } from "react";
import { AnimatePresence, motion } from "motion/react";
import { Button } from "./Button";
import { Input } from "./Input";

type Props = {
  open: boolean;
  title: string;
  description?: string;
  confirmLabel?: string;
  cancelLabel?: string;
  destructive?: boolean;
  requireConfirmText?: string;
  confirmTextLabel?: string;
  onConfirm: () => void;
  onCancel: () => void;
};

const FOCUSABLE =
  'button, [href], input, select, textarea, [tabindex]:not([tabindex="-1"])';

export function ConfirmDialog({
  open,
  title,
  description,
  confirmLabel = "Confirm",
  cancelLabel = "Cancel",
  destructive = false,
  requireConfirmText,
  confirmTextLabel,
  onConfirm,
  onCancel,
}: Props) {
  const [typed, setTyped] = useState("");
  const titleId = useId();
  const descId = useId();
  const textInputId = useId();
  const dialogRef = useRef<HTMLDivElement | null>(null);
  const confirmBtnWrapRef = useRef<HTMLSpanElement | null>(null);
  const cancelBtnWrapRef = useRef<HTMLSpanElement | null>(null);

  const matches = requireConfirmText == null || typed === requireConfirmText;
  const matchesRef = useRef(matches);
  matchesRef.current = matches;

  const onConfirmRef = useRef(onConfirm);
  onConfirmRef.current = onConfirm;
  const onCancelRef = useRef(onCancel);
  onCancelRef.current = onCancel;

  useEffect(() => {
    if (!open) return;
    setTyped("");
    const previouslyFocused = document.activeElement as HTMLElement | null;

    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") {
        e.preventDefault();
        onCancelRef.current();
        return;
      }
      if (e.key === "Tab") {
        const root = dialogRef.current;
        if (!root) return;
        const focusables = Array.from(
          root.querySelectorAll<HTMLElement>(FOCUSABLE),
        ).filter(
          (el) => !el.hasAttribute("disabled") && el.tabIndex !== -1,
        );
        if (focusables.length === 0) return;
        const first = focusables[0];
        const last = focusables[focusables.length - 1];
        const active = document.activeElement as HTMLElement | null;
        if (e.shiftKey) {
          if (active === first || !root.contains(active)) {
            e.preventDefault();
            last.focus();
          }
        } else {
          if (active === last) {
            e.preventDefault();
            first.focus();
          }
        }
        return;
      }
      if (e.key === "Enter") {
        const cancelBtn = cancelBtnWrapRef.current?.querySelector("button");
        if (document.activeElement === cancelBtn) return;
        if (!matchesRef.current) return;
        e.preventDefault();
        onConfirmRef.current();
      }
    };
    document.addEventListener("keydown", onKey);
    const prev = document.body.style.overflow;
    document.body.style.overflow = "hidden";

    // AutoFocus default action when no requireConfirmText
    if (requireConfirmText == null) {
      // Defer to allow render
      queueMicrotask(() =>
        confirmBtnWrapRef.current?.querySelector("button")?.focus(),
      );
    }

    return () => {
      document.removeEventListener("keydown", onKey);
      document.body.style.overflow = prev;
      previouslyFocused?.focus?.();
    };
  }, [open, requireConfirmText]);

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
          aria-labelledby={titleId}
          aria-describedby={description ? descId : undefined}
          ref={dialogRef}
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
              id={titleId}
              className="font-display uppercase font-black tracking-[-0.01em] text-[clamp(20px,2.4vw,26px)] text-accent-dark"
            >
              {title}
            </h2>
            {description && (
              <p
                id={descId}
                className="mt-3 font-sans text-body-m text-accent-dark/75"
              >
                {description}
              </p>
            )}
            {requireConfirmText != null && (
              <div className="mt-5">
                {confirmTextLabel && (
                  <label
                    htmlFor={textInputId}
                    className="mb-2 block font-sans text-body-s text-accent-dark/75"
                  >
                    {confirmTextLabel}
                  </label>
                )}
                <Input
                  id={textInputId}
                  autoFocus
                  value={typed}
                  onChange={(e) => setTyped(e.currentTarget.value)}
                  placeholder={requireConfirmText}
                  aria-label={confirmTextLabel ?? requireConfirmText}
                />
              </div>
            )}
            <div className="mt-7 flex flex-col-reverse gap-3 sm:flex-row sm:justify-end">
              <span ref={cancelBtnWrapRef} className="contents">
                <Button variant="secondary" size="md" onClick={onCancel}>
                  {cancelLabel}
                </Button>
              </span>
              <span ref={confirmBtnWrapRef} className="contents">
                <Button
                  variant={destructive ? "danger" : "primary"}
                  size="md"
                  onClick={onConfirm}
                  disabled={!matches}
                >
                  {confirmLabel}
                </Button>
              </span>
            </div>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
