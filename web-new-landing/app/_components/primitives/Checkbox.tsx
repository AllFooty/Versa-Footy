import { forwardRef, type InputHTMLAttributes } from "react";

export const Checkbox = forwardRef<HTMLInputElement, Omit<InputHTMLAttributes<HTMLInputElement>, "type">>(
  function Checkbox({ className = "", ...rest }, ref) {
    return (
      <input
        ref={ref}
        type="checkbox"
        className={`h-5 w-5 cursor-pointer rounded-md border-accent-dark/30 text-glyph-gold accent-glyph-gold focus-visible:ring-2 focus-visible:ring-glyph-gold/40 ${className}`}
        {...rest}
      />
    );
  },
);
