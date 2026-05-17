"use client";

import { forwardRef, type InputHTMLAttributes } from "react";

const base =
  "h-11 w-full rounded-xl border border-accent-dark/15 bg-cream px-4 font-sans text-body-m text-accent-dark transition-colors focus:border-glyph-gold focus:outline-none focus-visible:ring-2 focus-visible:ring-glyph-gold/40 disabled:opacity-50";

type Props = Omit<InputHTMLAttributes<HTMLInputElement>, "type"> & {
  invalid?: boolean;
};

export const DateTimeInput = forwardRef<HTMLInputElement, Props>(
  function DateTimeInput({ className = "", invalid, ...rest }, ref) {
    return (
      <input
        ref={ref}
        type="datetime-local"
        aria-invalid={invalid || undefined}
        className={`${base} ${invalid ? "border-error focus:border-error focus-visible:ring-error/40" : ""} ${className}`}
        {...rest}
      />
    );
  },
);
