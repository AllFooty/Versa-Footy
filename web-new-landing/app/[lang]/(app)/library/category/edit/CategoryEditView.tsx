"use client";

import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { useEffect, useState } from "react";
import { supabase } from "../../../../../_lib/supabase";
import { Input } from "../../../../../_components/primitives/Input";
import { Field } from "../../../../../_components/primitives/Field";
import { Spinner } from "../../../../../_components/primitives/Spinner";
import { toast } from "../../../../../_components/primitives/Toast";
import {
  addCategory,
  updateCategory,
  type CategoryInput,
} from "../../_hooks/useCategoryMutations";
import type { Category } from "../../_lib/types";
import type { ProductDict } from "../../../../../_dictionaries/product";
import type { Locale } from "../../../../../_dictionaries";

function fmt(template: string, vars: Record<string, string | number>): string {
  return template.replace(/\{\{(\w+)\}\}/g, (_, k) => String(vars[k] ?? ""));
}

export function CategoryEditView({
  dict,
  lang,
}: {
  dict: ProductDict;
  lang: Locale;
}) {
  const t = dict.library.categoryEdit;
  const router = useRouter();
  const params = useSearchParams();
  const idParam = params.get("id");
  const id = idParam ? Number.parseInt(idParam, 10) : null;
  const isEdit = id != null && !Number.isNaN(id);

  const [form, setForm] = useState<CategoryInput>({ name: "", icon: "⚽", color: "#E63946" });
  const [loading, setLoading] = useState(isEdit);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!isEdit) return;
    let cancelled = false;
    void (async () => {
      const { data, error: dbError } = await supabase
        .from("categories")
        .select("id, name, icon, color")
        .eq("id", id)
        .single();
      if (cancelled) return;
      if (dbError || !data) {
        setError(t.notFound);
        setLoading(false);
        return;
      }
      const c = data as Category;
      setForm({
        name: c.name,
        icon: c.icon ?? "⚽",
        color: c.color ?? "#E63946",
      });
      setLoading(false);
    })();
    return () => {
      cancelled = true;
    };
  }, [id, isEdit, t.notFound]);

  const handleSave = async () => {
    if (!form.name.trim()) {
      toast.error(t.nameRequired);
      return;
    }
    setBusy(true);
    try {
      if (isEdit && id != null) {
        await updateCategory(id, form);
        toast.success(t.updatedToast);
      } else {
        await addCategory(form);
        toast.success(t.createdToast);
      }
      router.push(`/${lang}/library`);
    } catch (e) {
      toast.error(fmt(t.saveError, { error: e instanceof Error ? e.message : String(e) }));
    } finally {
      setBusy(false);
    }
  };

  if (loading) {
    return (
      <div className="flex min-h-[60vh] items-center justify-center">
        <Spinner />
      </div>
    );
  }

  return (
    <div className="mx-auto w-full max-w-[640px] px-6 py-12 md:px-10 md:py-16">
      <Link
        href={`/${lang}/library`}
        className="inline-flex items-center gap-2 font-sans text-body-s text-warm-shadow transition-colors hover:text-accent-dark"
      >
        <span aria-hidden className="rtl:rotate-180">←</span>
        {t.backToLibrary}
      </Link>

      <header className="mt-6">
        <p className="font-display uppercase label-xs text-glyph-gold/80">{t.eyebrow}</p>
        <h1 className="mt-1 font-display text-display-s text-accent-dark md:text-display-m">
          {isEdit ? t.editTitle : t.newTitle}
        </h1>
      </header>

      {error ? (
        <p className="mt-6 rounded-2xl border border-error/40 bg-error/10 px-4 py-3 font-sans text-body-s text-error">
          {error}
        </p>
      ) : (
        <section className="mt-8 rounded-2xl border border-accent-dark/10 bg-white p-5 shadow-sm md:p-6">
          <Field label={t.nameLabel}>
            <Input
              value={form.name}
              onChange={(e) => setForm({ ...form, name: e.target.value })}
              placeholder={t.namePlaceholder}
              autoFocus
            />
          </Field>

          <div className="mt-4 grid gap-4 md:grid-cols-2">
            <Field label={t.iconLabel}>
              <Input
                value={form.icon ?? ""}
                onChange={(e) => setForm({ ...form, icon: e.target.value })}
                placeholder="⚽"
                maxLength={4}
              />
            </Field>
            <Field label={t.colorLabel}>
              <input
                type="color"
                value={form.color ?? "#E63946"}
                onChange={(e) => setForm({ ...form, color: e.target.value })}
                className="h-11 w-full rounded-xl border border-accent-dark/15 bg-cream p-1"
              />
            </Field>
          </div>

          <div className="mt-6 flex flex-wrap gap-3">
            <button
              type="button"
              onClick={() => void handleSave()}
              disabled={busy}
              className="inline-flex min-h-[44px] items-center gap-2 rounded-full bg-glyph-gold px-6 py-2 font-display label-s uppercase tracking-wide text-accent-dark transition-colors hover:bg-glyph-gold/90 disabled:opacity-60"
            >
              {busy ? t.saving : t.save}
            </button>
            <Link
              href={`/${lang}/library`}
              className="inline-flex min-h-[44px] items-center gap-2 rounded-full border border-accent-dark/15 bg-cream px-6 py-2 font-display label-s uppercase tracking-wide text-accent-dark transition-colors hover:bg-accent-dark hover:text-cream"
            >
              {dict.common.cancel}
            </Link>
          </div>
        </section>
      )}
    </div>
  );
}
