import { notFound } from "next/navigation";
import { SettingsView } from "./SettingsView";
import { hasLocale } from "../../../_dictionaries";
import { getProductDictionary } from "../../../_dictionaries/product";

export default async function SettingsPage({
  params,
}: {
  params: Promise<{ lang: string }>;
}) {
  const { lang } = await params;
  if (!hasLocale(lang)) notFound();
  const productDict = getProductDictionary(lang);
  return <SettingsView dict={productDict} lang={lang} />;
}
