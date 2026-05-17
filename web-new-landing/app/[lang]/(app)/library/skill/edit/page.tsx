import { notFound } from "next/navigation";
import { Suspense } from "react";
import { SkillEditView } from "./SkillEditView";
import { AdminProtectedRoute } from "../../../../../_lib/auth/ProtectedRoute";
import { hasLocale } from "../../../../../_dictionaries";
import { getProductDictionary } from "../../../../../_dictionaries/product";
import { Spinner } from "../../../../../_components/primitives/Spinner";

export default async function SkillEditPage({
  params,
}: {
  params: Promise<{ lang: string }>;
}) {
  const { lang } = await params;
  if (!hasLocale(lang)) notFound();
  const productDict = getProductDictionary(lang);
  return (
    <AdminProtectedRoute>
      <Suspense
        fallback={
          <div className="flex min-h-[60vh] items-center justify-center">
            <Spinner />
          </div>
        }
      >
        <SkillEditView dict={productDict} lang={lang} />
      </Suspense>
    </AdminProtectedRoute>
  );
}
