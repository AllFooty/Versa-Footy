type Position = "tl" | "tr" | "bl" | "br";

const positionClasses: Record<Position, string> = {
  tl: "top-6 left-6 md:top-10 md:left-10",
  tr: "top-6 right-6 md:top-10 md:right-10",
  bl: "bottom-6 left-6 md:bottom-10 md:left-10",
  br: "bottom-6 right-6 md:bottom-10 md:right-10",
};

type Tone = "cream" | "dark";
type Size = "xs" | "sm";

// Default size is `sm` (label-sm, 13px) so this primitive is consumer-safe.
// /branding spec callsites pass size="xs" explicitly — per the two-tier
// readability policy in globals.css, label-xs is spec-only.
export function Annotation({
  n,
  title,
  caption,
  position = "tr",
  tone = "dark",
  size = "sm",
}: {
  n: string;
  title: string;
  caption: string;
  position?: Position;
  tone?: Tone;
  size?: Size;
}) {
  const toneClasses =
    tone === "cream"
      ? "text-cream/85"
      : "text-accent-dark/75";
  const ruleClasses = tone === "cream" ? "bg-cream/30" : "bg-accent-dark/20";
  const labelClass = size === "xs" ? "label-xs" : "label-sm";

  return (
    <div
      className={`pointer-events-none absolute z-30 ${positionClasses[position]} max-w-[260px]`}
    >
      <div
        className={`font-display ${labelClass} uppercase ${toneClasses}`}
      >
        {n} · {title}
      </div>
      <div className={`mt-2 h-px w-10 ${ruleClasses}`} />
      <p className={`mt-2 font-sans text-body-s leading-snug ${toneClasses}`}>
        {caption}
      </p>
    </div>
  );
}
