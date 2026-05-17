import { forwardRef, type InputHTMLAttributes } from "react";

const base =
  "h-11 w-full rounded-xl border border-accent-dark/15 bg-cream px-4 font-sans text-body-m text-accent-dark placeholder:text-warm-shadow/70 transition-colors focus:border-glyph-gold focus:outline-none focus-visible:ring-2 focus-visible:ring-glyph-gold/40 disabled:opacity-50";

export const Input = forwardRef<HTMLInputElement, InputHTMLAttributes<HTMLInputElement> & { invalid?: boolean }>(
  function Input({ className = "", invalid, ...rest }, ref) {
    return (
      <input
        ref={ref}
        aria-invalid={invalid || undefined}
        className={`${base} ${invalid ? "border-error focus:border-error focus-visible:ring-error/40" : ""} ${className}`}
        {...rest}
      />
    );
  },
);
