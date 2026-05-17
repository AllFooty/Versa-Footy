import { notFound } from "next/navigation";
import { Suspense } from "react";
import { TeamsView } from "./TeamsView";
import { AcademyProtectedRoute } from "../../../../_lib/auth/ProtectedRoute";
import { hasLocale } from "../../../../_dictionaries";
import { getProductDictionary } from "../../../../_dictionaries/product";

export default async function TeamsPage({
  params,
}: {
  params: Promise<{ lang: string }>;
}) {
  const { lang } = await params;
  if (!hasLocale(lang)) notFound();
  const productDict = getProductDictionary(lang);
  return (
    <AcademyProtectedRoute>
      <Suspense fallback={null}>
        <TeamsView dict={productDict} lang={lang} />
      </Suspense>
    </AcademyProtectedRoute>
  );
}
