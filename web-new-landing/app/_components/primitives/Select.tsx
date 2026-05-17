import { forwardRef, type SelectHTMLAttributes } from "react";

const base =
  "h-11 w-full rounded-xl border border-accent-dark/15 bg-cream px-4 font-sans text-body-m text-accent-dark transition-colors focus:border-glyph-gold focus:outline-none focus-visible:ring-2 focus-visible:ring-glyph-gold/40 disabled:opacity-50";

export const Select = forwardRef<HTMLSelectElement, SelectHTMLAttributes<HTMLSelectElement>>(
  function Select({ className = "", children, ...rest }, ref) {
    return (
      <select ref={ref} className={`${base} ${className}`} {...rest}>
        {children}
      </select>
    );
  },
);
