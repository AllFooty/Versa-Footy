import { ImageResponse } from "next/og";
import { hasLocale } from "../_dictionaries";

// Required by @cloudflare/next-on-pages — OG image generation runs as an edge function.
export const runtime = "edge";

export const alt = "Versa Footy: AI football coach for kids 7–14";
export const size = { width: 1200, height: 630 };
export const contentType = "image/png";

const SITE_URL = process.env.NEXT_PUBLIC_SITE_URL ?? "https://versafooty.com";

async function asDataUrl(relPath: string, mime = "image/webp") {
  const res = await fetch(`${SITE_URL}/${relPath}`);
  const buf = await res.arrayBuffer();
  // Base64 encode without Buffer (not available on edge runtime).
  const bytes = new Uint8Array(buf);
  let binary = "";
  for (let i = 0; i < bytes.byteLength; i++) binary += String.fromCharCode(bytes[i]);
  return `data:${mime};base64,${btoa(binary)}`;
}

export default async function Image({
  params,
}: {
  params: Promise<{ lang: string }>;
}) {
  const { lang } = await params;
  const isAr = hasLocale(lang) && lang === "ar";

  const [wordmark, pattern] = await Promise.all([
    asDataUrl("VERSA_FOOTY_wordmark_white_transparent.webp"),
    asDataUrl("pattern-wing-gold.webp"),
  ]);

  const headline = isAr ? "التنوع يفوز" : "Versatility wins";
  const tagline = isAr
    ? "مدرب كرة قدم بالذكاء الاصطناعي للأطفال 7–14"
    : "AI football coach for kids ages 7–14";
  const caption = isAr ? "السعودية · الخليج" : "Saudi Arabia · GCC";

  return new ImageResponse(
    (
      <div
        style={{
          width: "100%",
          height: "100%",
          display: "flex",
          flexDirection: "column",
          justifyContent: "space-between",
          padding: "72px 88px",
          background:
            "radial-gradient(1200px 700px at 85% 15%, #3a2418 0%, #24170F 55%, #160C07 100%)",
          color: "#FAF6EE",
          fontFamily: "sans-serif",
          position: "relative",
        }}
      >
        <img
          src={pattern}
          width={780}
          height={780}
          style={{
            position: "absolute",
            top: -160,
            right: -180,
            opacity: 0.18,
          }}
        />
        <div
          style={{
            position: "absolute",
            bottom: -220,
            left: -160,
            width: 520,
            height: 520,
            borderRadius: 9999,
            background:
              "radial-gradient(closest-side, rgba(255,210,74,0.22), rgba(255,210,74,0))",
          }}
        />

        <div style={{ display: "flex", alignItems: "center" }}>
          <img src={wordmark} height={72} style={{ height: 72 }} />
        </div>

        <div style={{ display: "flex", flexDirection: "column", gap: 20 }}>
          <div
            style={{
              fontSize: 116,
              fontWeight: 900,
              lineHeight: 1,
              letterSpacing: "-0.02em",
              color: "#FFD24A",
              display: "flex",
            }}
          >
            {headline}
          </div>
          <div
            style={{
              fontSize: 36,
              fontWeight: 600,
              color: "rgba(250,246,238,0.88)",
              maxWidth: 900,
              display: "flex",
            }}
          >
            {tagline}
          </div>
        </div>

        <div
          style={{
            display: "flex",
            alignItems: "center",
            justifyContent: "space-between",
          }}
        >
          <div
            style={{
              display: "flex",
              alignItems: "center",
              gap: 14,
              fontSize: 22,
              fontWeight: 700,
              letterSpacing: "0.18em",
              textTransform: "uppercase",
              color: "rgba(250,246,238,0.7)",
            }}
          >
            <span
              style={{
                width: 10,
                height: 10,
                borderRadius: 9999,
                background: "#FFD24A",
                display: "flex",
              }}
            />
            {caption}
          </div>
          <div
            style={{
              fontSize: 22,
              fontWeight: 700,
              letterSpacing: "0.22em",
              textTransform: "uppercase",
              color: "rgba(250,246,238,0.55)",
              display: "flex",
            }}
          >
            versafooty.com
          </div>
        </div>
      </div>
    ),
    { ...size },
  );
}
