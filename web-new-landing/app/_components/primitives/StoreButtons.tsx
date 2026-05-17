import type { Dict } from "../../_dictionaries";

type Props = {
  copy: Dict["stores"];
  appStoreUrl?: string;
};

const shell =
  "group relative inline-flex h-16 items-center gap-3.5 rounded-full border px-6 backdrop-blur-md transition-all duration-fast ease-out will-change-transform";

const AppleGlyph = () => (
  <svg viewBox="0 0 24 24" aria-hidden="true" className="h-6 w-6 shrink-0 text-cream">
    <path
      fill="currentColor"
      d="M16.365 1.43c0 1.14-.46 2.24-1.22 3.01-.82.83-2.15 1.46-3.25 1.37-.13-1.1.42-2.25 1.18-3.03.82-.85 2.27-1.47 3.29-1.35zM20.5 17.46c-.55 1.27-.81 1.84-1.52 2.96-.99 1.57-2.39 3.52-4.12 3.54-1.54.01-1.93-1-4.02-.99-2.09.01-2.52 1.01-4.07.99-1.73-.02-3.06-1.78-4.05-3.34-2.77-4.36-3.06-9.48-1.35-12.2 1.21-1.93 3.13-3.07 4.93-3.07 1.83 0 2.98 1 4.49 1 1.47 0 2.36-1 4.48-1 1.59 0 3.28.87 4.49 2.37-3.95 2.16-3.31 7.81.74 9.74z"
    />
  </svg>
);

const PlayGlyph = () => (
  <svg viewBox="0 0 24 24" aria-hidden="true" className="h-6 w-6 shrink-0 text-cream/60">
    <path fill="currentColor" d="M5 3.5c-.55.32-.9.92-.9 1.6v13.8c0 .68.35 1.28.9 1.6L13.4 12 5 3.5z" />
    <path fill="currentColor" d="M16.6 8.4l-2.2 2.2L18 14.2l2.6-1.5c.95-.55.95-1.85 0-2.4L16.6 8.4z" opacity="0.85" />
    <path fill="currentColor" d="M5 3.5l8.4 8.5 3.2-3.2L6.4 2.9c-.5-.3-1-.1-1.4.6z" opacity="0.7" />
    <path fill="currentColor" d="M13.4 12L5 20.5c.4.7.9.9 1.4.6L16.6 15.6 13.4 12z" opacity="0.55" />
  </svg>
);

export function StoreButtons({ copy, appStoreUrl }: Props) {
  const appHref = appStoreUrl ?? "https://apps.apple.com/us/app/versa-footy/id6758730632";

  return (
    <div className="flex w-full flex-col items-stretch justify-center gap-3 sm:flex-row sm:items-center">
      <a
        href={appHref}
        target="_blank"
        rel="noopener noreferrer"
        aria-label={copy.appStore.ariaLabel}
        dir="ltr"
        className={`${shell} cursor-pointer border-cream/55 bg-cream/15 text-cream shadow-[0_14px_36px_-18px_rgba(0,0,0,0.55)] hover:-translate-y-0.5 hover:border-glyph-gold/70 hover:bg-cream/20 hover:shadow-glow-gold active:translate-y-0 focus:outline-none focus-visible:ring-2 focus-visible:ring-glyph-gold focus-visible:ring-offset-2 focus-visible:ring-offset-transparent`}
      >
        <span
          aria-hidden
          className="pointer-events-none absolute inset-0 rounded-full ring-1 ring-inset ring-glyph-gold/0 transition-[box-shadow,ring-color] duration-fast group-hover:ring-glyph-gold/40"
        />
        <AppleGlyph />
        <span className="flex flex-col items-start leading-tight">
          <span className="font-sans text-[10.5px] uppercase tracking-[0.22em] text-cream/70">
            {copy.appStore.caption}
          </span>
          <span className="font-display text-[18px] font-black tracking-[-0.005em] text-cream">
            {copy.appStore.name}
          </span>
        </span>
      </a>

      <div
        role="group"
        aria-label={copy.googlePlay.ariaLabel}
        dir="ltr"
        aria-disabled="true"
        className={`${shell} cursor-not-allowed select-none border-cream/30 bg-cream/[0.06] text-cream/75`}
      >
        <PlayGlyph />
        <span className="flex flex-col items-start leading-tight">
          <span className="font-sans text-[10.5px] uppercase tracking-[0.22em] text-cream/55">
            {copy.googlePlay.caption}
          </span>
          <span className="flex items-center gap-2">
            <span className="font-display text-[18px] font-black tracking-[-0.005em] text-cream/85">
              {copy.googlePlay.name}
            </span>
            <span className="inline-flex items-center rounded-full border border-glyph-gold/55 bg-glyph-gold/15 px-2 py-[2px] font-display text-[9px] font-black uppercase tracking-[0.18em] text-glyph-gold">
              {copy.googlePlay.badge}
            </span>
          </span>
        </span>
      </div>
    </div>
  );
}
