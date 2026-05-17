import { notFound } from "next/navigation";
import { Suspense } from "react";
import { HomeView } from "./HomeView";
import { hasLocale } from "../../../_dictionaries";
import { getProductDictionary } from "../../../_dictionaries/product";

export default async function HomePage({
  params,
}: {
  params: Promise<{ lang: string }>;
}) {
  const { lang } = await params;
  if (!hasLocale(lang)) notFound();
  const productDict = getProductDictionary(lang);
  return (
    <Suspense fallback={null}>
      <HomeView dict={productDict} lang={lang} />
    </Suspense>
  );
}
