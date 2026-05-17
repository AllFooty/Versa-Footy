import { notFound } from "next/navigation";
import { Suspense } from "react";
import { JoinView } from "./JoinView";
import { hasLocale } from "../../_dictionaries";
import { getProductDictionary } from "../../_dictionaries/product";
import { Spinner } from "../../_components/primitives/Spinner";

export default async function JoinPage({
  params,
}: {
  params: Promise<{ lang: string }>;
}) {
  const { lang } = await params;
  if (!hasLocale(lang)) notFound();
  const productDict = getProductDictionary(lang);
  return (
    <Suspense
      fallback={
        <div className="flex min-h-[60vh] items-center justify-center">
          <Spinner />
        </div>
      }
    >
      <JoinView dict={productDict} lang={lang} />
    </Suspense>
  );
}
