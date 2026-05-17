import type { Metadata } from "next";
import { SmoothScrollProvider } from "../../_components/SmoothScrollProvider";
import { CoverSection } from "./_components/sections/Cover";
import { LogoSection } from "./_components/sections/Logo";
import { FoundationsSection } from "./_components/sections/Foundations";
import { ColorSection } from "./_components/sections/Color";
import { TypographySection } from "./_components/sections/Typography";
import { VersaSection } from "./_components/sections/Versa";
import { VoiceSection } from "./_components/sections/Voice";
import { ComponentsSection } from "./_components/sections/Components";
import { PatternsSection } from "./_components/sections/Patterns";
import { MotionSection } from "./_components/sections/Motion";
import { AppHandoffSection } from "./_components/sections/AppHandoff";

const ogImage = "/versa-lockup-navy.webp";

export const metadata: Metadata = {
  title: "Brand System",
  description:
    "Versa Footy brand system: color, typography, logo, character, voice, components, motion. The living spec.",
  alternates: { canonical: "/en/branding" },
  robots: {
    index: false,
    follow: false,
    googleBot: { index: false, follow: false },
  },
  openGraph: {
    title: "Versa Footy · Brand System",
    description:
      "The Versa Footy brand system: the canonical spec for color, typography, logo, character, voice, components, patterns, and motion.",
    type: "article",
    url: "/branding",
    images: [{ url: ogImage, width: 900, height: 900, alt: "Versa Footy" }],
  },
  twitter: {
    card: "summary_large_image",
    title: "Versa Footy · Brand System",
    description:
      "The living spec for the Versa Footy brand: foundations, character, components, patterns, motion.",
    images: [ogImage],
  },
};

export default function BrandingPage() {
  return (
    <SmoothScrollProvider>
      <a href="#main-content" className="skip-link">
        Skip to main content
      </a>
      <main id="main-content" tabIndex={-1} className="relative flex flex-col bg-cream">
        <CoverSection />
        <LogoSection />
        <FoundationsSection />
        <ColorSection />
        <TypographySection />
        <VersaSection />
        <VoiceSection />
        <ComponentsSection />
        <PatternsSection />
        <MotionSection />
        <AppHandoffSection />
      </main>
    </SmoothScrollProvider>
  );
}
