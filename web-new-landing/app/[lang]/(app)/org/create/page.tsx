import { notFound } from "next/navigation";
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
  return <CreateOrgView dict={productDict} lang={lang} />;
}
