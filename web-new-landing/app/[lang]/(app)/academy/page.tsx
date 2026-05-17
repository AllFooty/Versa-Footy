import { notFound } from "next/navigation";
import { AcademyView } from "./AcademyView";
import { AcademyProtectedRoute } from "../../../_lib/auth/ProtectedRoute";
import { hasLocale } from "../../../_dictionaries";
import { getProductDictionary } from "../../../_dictionaries/product";

export default async function AcademyPage({
  params,
}: {
  params: Promise<{ lang: string }>;
}) {
  const { lang } = await params;
  if (!hasLocale(lang)) notFound();
  const productDict = getProductDictionary(lang);
  return (
    <AcademyProtectedRoute>
      <AcademyView dict={productDict} lang={lang} />
    </AcademyProtectedRoute>
  );
}
