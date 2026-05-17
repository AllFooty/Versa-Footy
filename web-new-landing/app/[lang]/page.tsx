import { notFound } from "next/navigation";
import { SmoothScrollProvider } from "../_components/SmoothScrollProvider";
import { Navigation } from "../_components/sections/Navigation";
import { HeroSection } from "../_components/sections/HeroSection";
import { ManifestoSection } from "../_components/sections/ManifestoSection";
import { HoursGapSection } from "../_components/sections/HoursGapSection";
import { MeetVersaSection } from "../_components/sections/MeetVersaSection";
import { AppShowcaseSection } from "../_components/sections/AppShowcaseSection";
import { SkillUniverseSection } from "../_components/sections/SkillUniverseSection";
import { VoiceSection } from "../_components/sections/VoiceSection";
import { ForCoachesSection } from "../_components/sections/ForCoachesSection";
import { FAQSection } from "../_components/sections/FAQSection";
import { FinalCTASection } from "../_components/sections/FinalCTASection";
import { AllFootyFamilySection } from "../_components/sections/AllFootyFamilySection";
import { Footer } from "../_components/sections/Footer";
import { getDictionary, hasLocale } from "../_dictionaries";

export default async function Home({
  params,
}: {
  params: Promise<{ lang: string }>;
}) {
  const { lang } = await params;
  if (!hasLocale(lang)) notFound();
  const dict = getDictionary(lang);

  return (
    <SmoothScrollProvider>
      <a href="#main-content" className="skip-link">
        {dict.a11y.skipToContent}
      </a>
      <Navigation dict={dict} lang={lang} />
      <main id="main-content" tabIndex={-1} className="relative flex flex-col">
        <HeroSection dict={dict} />
        <ManifestoSection dict={dict} />
        <HoursGapSection dict={dict} />
        <MeetVersaSection dict={dict} />
        <AppShowcaseSection dict={dict} />
        <SkillUniverseSection dict={dict} lang={lang} />
        <VoiceSection dict={dict} />
        <FAQSection dict={dict} />
        <ForCoachesSection dict={dict} />
        <FinalCTASection dict={dict} />
        <AllFootyFamilySection dict={dict} />
        <Footer dict={dict} lang={lang} />
      </main>
    </SmoothScrollProvider>
  );
}
