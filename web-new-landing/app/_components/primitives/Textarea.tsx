import { forwardRef, type TextareaHTMLAttributes } from "react";

const base =
  "w-full min-h-[96px] rounded-xl border border-accent-dark/15 bg-cream px-4 py-3 font-sans text-body-m text-accent-dark placeholder:text-warm-shadow/70 transition-colors focus:border-glyph-gold focus:outline-none focus-visible:ring-2 focus-visible:ring-glyph-gold/40 disabled:opacity-50";

export const Textarea = forwardRef<HTMLTextAreaElement, TextareaHTMLAttributes<HTMLTextAreaElement>>(
  function Textarea({ className = "", ...rest }, ref) {
    return <textarea ref={ref} className={`${base} ${className}`} {...rest} />;
  },
);
