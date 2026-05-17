import type { ReactNode } from "react";

type Tone =
  | "teal"
  | "gold"
  | "burgundy"
  | "cream"
  | "dark"
  | "outline";

const tones: Record<Tone, string> = {
  teal: "bg-deep-teal text-cream",
  gold: "bg-glyph-gold text-accent-dark",
  burgundy: "bg-burgundy text-cream",
  cream: "bg-cream text-accent-dark border border-accent-dark/15",
  dark: "bg-accent-dark text-cream",
  outline: "border border-accent-dark/25 text-accent-dark",
};

// Default size is `sm` (label-sm, 13px) so this primitive is consumer-safe.
// The `xs` size emits label-xs (12px) and is reserved for /branding spec
// callsites — per the two-tier readability policy in globals.css, label-xs
// is spec-only.
export function Chip({
  children,
  tone = "cream",
  size = "sm",
  arabic = false,
  className = "",
}: {
  children: ReactNode;
  tone?: Tone;
  size?: "xs" | "sm" | "md";
  arabic?: boolean;
  className?: string;
}) {
  const sizeCls =
    size === "xs"
      ? "h-7 px-3 label-xs"
      : size === "md"
      ? "h-10 px-4 label-md"
      : "h-8 px-3.5 label-sm";
  const fontCls = arabic ? "font-arabic" : "font-display uppercase";
  const dir = arabic ? "rtl" : undefined;

  return (
    <span
      dir={dir}
      lang={arabic ? "ar" : undefined}
      className={`inline-flex items-center rounded-full ${sizeCls} ${fontCls} ${tones[tone]} ${className}`.trim()}
    >
      {children}
    </span>
  );
}
