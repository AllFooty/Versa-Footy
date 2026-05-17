"use client";

import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { useEffect, useState } from "react";
import { supabase } from "../../../../../_lib/supabase";
import { Input } from "../../../../../_components/primitives/Input";
import { Select } from "../../../../../_components/primitives/Select";
import { Textarea } from "../../../../../_components/primitives/Textarea";
import { Field } from "../../../../../_components/primitives/Field";
import { Spinner } from "../../../../../_components/primitives/Spinner";
import { toast } from "../../../../../_components/primitives/Toast";
import { AGE_GROUPS, type AgeGroup } from "../../../../../_lib/academy/constants";
import { addSkill, updateSkill, type SkillInput } from "../../_hooks/useSkillMutations";
import type { Category } from "../../_lib/types";
import type { ProductDict } from "../../../../../_dictionaries/product";
import type { Locale } from "../../../../../_dictionaries";

function fmt(template: string, vars: Record<string, string | number>): string {
  return template.replace(/\{\{(\w+)\}\}/g, (_, k) => String(vars[k] ?? ""));
}

export function SkillEditView({
  dict,
  lang,
}: {
  dict: ProductDict;
  lang: Locale;
}) {
  const t = dict.library.skillEdit;
  const router = useRouter();
  const params = useSearchParams();
  const idParam = params.get("id");
  const categoryIdParam = params.get("categoryId");
  const id = idParam ? Number.parseInt(idParam, 10) : null;
  const isEdit = id != null && !Number.isNaN(id);

  const [categories, setCategories] = useState<Category[]>([]);
  const [form, setForm] = useState<SkillInput>({
    name: "",
    categoryId: categoryIdParam ? Number.parseInt(categoryIdParam, 10) || 0 : 0,
    ageGroup: "U-7",
    description: "",
  });
  const [loading, setLoading] = useState(true);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let cancelled = false;
    void (async () => {
      const { data: cats, error: catErr } = await supabase
        .from("categories")
        .select("id, name, icon, color")
        .order("id");
      if (cancelled) return;
      if (catErr) {
        setError(catErr.message);
        setLoading(false);
        return;
      }
      const rows = (cats as Category[]) ?? [];
      setCategories(rows);

      if (isEdit) {
        const { data, error: sErr } = await supabase
          .from("skills")
          .select("id, category_id, name, age_group, description")
          .eq("id", id)
          .single();
        if (cancelled) return;
        if (sErr || !data) {
          setError(t.notFound);
          setLoading(false);
          return;
        }
        setForm({
          name: (data.name as string) ?? "",
          categoryId: data.category_id as number,
          ageGroup: ((data.age_group as AgeGroup | null) ?? "U-7") as AgeGroup,
          description: (data.description as string | null) ?? "",
        });
      } else if (!form.categoryId && rows[0]) {
        setForm((prev) => ({ ...prev, categoryId: rows[0].id }));
      }
      setLoading(false);
    })();
    return () => {
      cancelled = true;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [id, isEdit]);

  const handleSave = async () => {
    if (!form.name.trim()) {
      toast.error(t.nameRequired);
      return;
    }
    if (!form.categoryId) {
      toast.error(t.categoryRequired);
      return;
    }
    setBusy(true);
    try {
      const payload: SkillInput = {
        ...form,
        description: form.description?.trim() ? form.description : null,
      };
      if (isEdit && id != null) {
        await updateSkill(id, payload);
        toast.success(t.updatedToast);
      } else {
        await addSkill(payload);
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
    <div className="mx-auto w-full max-w-[720px] px-6 py-12 md:px-10 md:py-16">
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
            <Field label={t.categoryLabel}>
              <Select
                value={form.categoryId || ""}
                onChange={(e) =>
                  setForm({ ...form, categoryId: Number.parseInt(e.target.value, 10) || 0 })
                }
              >
                <option value="">{t.categoryPlaceholder}</option>
                {categories.map((c) => (
                  <option key={c.id} value={c.id}>
                    {c.icon ? `${c.icon} ` : ""}
                    {c.name}
                  </option>
                ))}
              </Select>
            </Field>
            <Field label={t.ageGroupLabel}>
              <Select
                value={form.ageGroup ?? ""}
                onChange={(e) =>
                  setForm({ ...form, ageGroup: e.target.value as AgeGroup })
                }
              >
                {AGE_GROUPS.map((g) => (
                  <option key={g} value={g}>
                    {g}
                  </option>
                ))}
              </Select>
            </Field>
          </div>

          <div className="mt-4">
            <Field label={t.descriptionLabel}>
              <Textarea
                rows={3}
                value={form.description ?? ""}
                onChange={(e) => setForm({ ...form, description: e.target.value })}
                placeholder={t.descriptionPlaceholder}
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
