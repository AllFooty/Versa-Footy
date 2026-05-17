import { notFound } from "next/navigation";
import { Suspense } from "react";
import { CreateOrgView } from "./CreateOrgView";
import { hasLocale } from "../../../../_dictionaries";
import { getProductDictionary } from "../../../../_dictionaries/product";

export default async function CreateOrgPage({
  params,
}: {
  params: Promise<{ lang: string }>;
}) {
  const { lang } = await params;
  if (!hasLocale(lang)) notFound();
  const productDict = getProductDictionary(lang);
  return (
    <Suspense fallback={null}>
      <CreateOrgView dict={productDict} lang={lang} />
    </Suspense>
  );
}
