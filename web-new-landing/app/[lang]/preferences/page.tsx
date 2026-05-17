import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { Suspense } from "react";
import { PreferencesView } from "./PreferencesView";
import { hasLocale } from "../../_dictionaries";
import { getProductDictionary } from "../../_dictionaries/product";

export async function generateMetadata({
  params,
}: {
  params: Promise<{ lang: string }>;
}): Promise<Metadata> {
  const { lang } = await params;
  if (!hasLocale(lang)) return {};
  const productDict = getProductDictionary(lang);
  return {
    title: productDict.preferences.title,
    robots: { index: false, follow: false },
  };
}

export default async function PreferencesPage({
  params,
}: {
  params: Promise<{ lang: string }>;
}) {
  const { lang } = await params;
  if (!hasLocale(lang)) notFound();
  const productDict = getProductDictionary(lang);
  return (
    <main className="relative isolate flex min-h-screen items-center justify-center overflow-hidden bg-accent-dark px-6 py-16 text-cream">
      <div
        aria-hidden
        className="absolute inset-0"
        style={{
          background:
            "radial-gradient(ellipse 70% 50% at 50% 0%, rgba(232,169,60,0.16) 0%, transparent 65%)",
        }}
      />
      <div aria-hidden className="bg-noise absolute inset-0 opacity-[0.08]" />
      <Suspense fallback={<div className="w-full max-w-xl" />}>
        <PreferencesView dict={productDict} lang={lang} />
      </Suspense>
    </main>
  );
}
