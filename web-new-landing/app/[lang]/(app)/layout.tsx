import { notFound } from "next/navigation";
import type { ReactNode } from "react";
import { AppShell } from "../../_components/app-shell/AppShell";
import { ProtectedRoute } from "../../_lib/auth/ProtectedRoute";
import { getDictionary, hasLocale } from "../../_dictionaries";
import { getProductDictionary } from "../../_dictionaries/product";

export default async function AppGroupLayout({
  children,
  params,
}: {
  children: ReactNode;
  params: Promise<{ lang: string }>;
}) {
  const { lang } = await params;
  if (!hasLocale(lang)) notFound();
  const dict = getDictionary(lang);
  const productDict = getProductDictionary(lang);

  return (
    <ProtectedRoute>
      <AppShell dict={dict} productDict={productDict} lang={lang}>
        {children}
      </AppShell>
    </ProtectedRoute>
  );
}
