import { notFound } from "next/navigation";
import { Suspense } from "react";
import { LibraryBrowseView } from "./LibraryBrowseView";
import { AcademyProtectedRoute } from "../../../_lib/auth/ProtectedRoute";
import { hasLocale } from "../../../_dictionaries";
import { getProductDictionary } from "../../../_dictionaries/product";
import { Spinner } from "../../../_components/primitives/Spinner";

export default async function LibraryPage({
  params,
}: {
  params: Promise<{ lang: string }>;
}) {
  const { lang } = await params;
  if (!hasLocale(lang)) notFound();
  const productDict = getProductDictionary(lang);
  return (
    <AcademyProtectedRoute>
      <Suspense
        fallback={
          <div className="flex min-h-[60vh] items-center justify-center">
            <Spinner />
          </div>
        }
      >
        <LibraryBrowseView dict={productDict} lang={lang} />
      </Suspense>
    </AcademyProtectedRoute>
  );
}
