import type { ReactNode } from "react";

type Variant = "primary" | "secondary" | "ghost" | "danger";
type Size = "md" | "lg";

const base =
  "inline-flex items-center justify-center gap-2 font-display uppercase tracking-[0.16em] rounded-full transition-all duration-fast ease-out will-change-transform focus:outline-none focus-visible:ring-2 focus-visible:ring-offset-2 focus-visible:ring-glyph-gold focus-visible:ring-offset-cream cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed disabled:transform-none disabled:shadow-none";

const variants: Record<Variant, string> = {
  primary:
    "bg-glyph-gold text-accent-dark hover:-translate-y-0.5 hover:shadow-glow-gold active:translate-y-0",
  secondary:
    "border border-deep-teal/70 text-deep-teal hover:bg-deep-teal hover:text-cream hover:-translate-y-0.5",
  ghost:
    "text-accent-dark hover:text-burgundy",
  danger:
    "bg-error text-cream hover:-translate-y-0.5 hover:shadow-glow-error active:translate-y-0",
};

const sizes: Record<Size, string> = {
  md: "h-11 px-6 text-[14px]",
  lg: "h-14 px-9 text-[14.5px]",
};

export function Button({
  children,
  variant = "primary",
  size = "md",
  pulse = false,
  className = "",
  asLink = false,
  href,
  disabled = false,
  type = "button",
  onClick,
}: {
  children: ReactNode;
  variant?: Variant;
  size?: Size;
  pulse?: boolean;
  className?: string;
  asLink?: boolean;
  href?: string;
  disabled?: boolean;
  type?: "submit" | "button" | "reset";
  onClick?: () => void;
}) {
  const pulseCls = pulse && !disabled ? "animate-[pulse-cta_2.8s_ease-in-out_infinite]" : "";
  const cls = `${base} ${variants[variant]} ${sizes[size]} ${pulseCls} ${className}`.trim();

  if (asLink && href) {
    return (
      <a href={href} className={cls} onClick={onClick}>
        {children}
      </a>
    );
  }
  return (
    <button type={type} disabled={disabled} className={cls} onClick={onClick}>
      {children}
    </button>
  );
}
