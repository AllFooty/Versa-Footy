import { notFound } from "next/navigation";
import { InvitationsView } from "./InvitationsView";
import { AcademyProtectedRoute } from "../../../../_lib/auth/ProtectedRoute";
import { hasLocale } from "../../../../_dictionaries";
import { getProductDictionary } from "../../../../_dictionaries/product";

export default async function InvitationsPage({
  params,
}: {
  params: Promise<{ lang: string }>;
}) {
  const { lang } = await params;
  if (!hasLocale(lang)) notFound();
  const productDict = getProductDictionary(lang);
  return (
    <AcademyProtectedRoute>
      <InvitationsView dict={productDict} lang={lang} />
    </AcademyProtectedRoute>
  );
}
