"use client";

import Link from "next/link";
import { useCallback, useEffect, useState } from "react";
import { supabase } from "../../../../_lib/supabase";
import { ConfirmDialog } from "../../../../_components/primitives/ConfirmDialog";
import { Input } from "../../../../_components/primitives/Input";
import { Field } from "../../../../_components/primitives/Field";
import { toast } from "../../../../_components/primitives/Toast";
import { SegmentBuilder } from "../_lib/SegmentBuilder";
import {
  emptyFilter,
  type SegmentFilter,
} from "../_lib/segments";
import type { ProductDict } from "../../../../_dictionaries/product";
import type { Locale } from "../../../../_dictionaries";

type SegmentRow = {
  id: string;
  name: string;
  description: string | null;
  filter: SegmentFilter;
  is_builtin: boolean;
};

type Draft = {
  id?: string;
  name: string;
  description: string | null;
  filter: SegmentFilter;
  is_builtin: boolean;
};

function fmt(template: string, vars: Record<string, string | number>): string {
  return template.replace(/\{\{(\w+)\}\}/g, (_, k) => String(vars[k] ?? ""));
}

export function SegmentsView({
  dict,
  lang,
}: {
  dict: ProductDict;
  lang: Locale;
}) {
  const t = dict.marketing.segments;
  const [segments, setSegments] = useState<SegmentRow[] | null>(null);
  const [counts, setCounts] = useState<Record<string, number>>({});
  const [editing, setEditing] = useState<Draft | null>(null);
  const [pendingDelete, setPendingDelete] = useState<SegmentRow | null>(null);
  const [deleting, setDeleting] = useState(false);

  const load = useCallback(async () => {
    const { data, error } = await supabase
      .from("marketing_segments")
      .select("*")
      .order("is_builtin", { ascending: false })
      .order("name");
    if (error) {
      toast.error(error.message);
      return;
    }
    const rows = (data as SegmentRow[]) ?? [];
    setSegments(rows);
    const next: Record<string, number> = {};
    for (const s of rows) {
      const { data: c } = await supabase.rpc("marketing_segment_count", {
        p_filter: s.filter,
      });
      if (typeof c === "number") next[s.id] = c;
      setCounts({ ...next });
    }
  }, []);

  useEffect(() => {
    void load();
  }, [load]);

  const saveSegment = async () => {
    if (!editing) return;
    if (!editing.name.trim()) {
      toast.error(t.nameRequired);
      return;
    }
    const payload = {
      name: editing.name.trim(),
      description: editing.description?.trim() || null,
      filter: editing.filter,
    };
    if (editing.id) {
      const { error } = await supabase
        .from("marketing_segments")
        .update(payload)
        .eq("id", editing.id);
      if (error) {
        toast.error(error.message);
        return;
      }
      toast.success(t.updatedToast);
    } else {
      const { error } = await supabase.from("marketing_segments").insert(payload);
      if (error) {
        toast.error(error.message);
        return;
      }
      toast.success(t.createdToast);
    }
    setEditing(null);
    await load();
  };

  const confirmDelete = async () => {
    if (!pendingDelete) return;
    if (pendingDelete.is_builtin) {
      toast.error(t.builtinDeleteError);
      setPendingDelete(null);
      return;
    }
    setDeleting(true);
    const { error } = await supabase
      .from("marketing_segments")
      .delete()
      .eq("id", pendingDelete.id);
    setDeleting(false);
    if (error) {
      toast.error(error.message);
    } else {
      toast.success(t.deletedToast);
    }
    setPendingDelete(null);
    await load();
  };

  if (editing) {
    return (
      <div className="mx-auto w-full max-w-[900px] px-6 py-12 md:px-10 md:py-16">
        <button
          type="button"
          onClick={() => setEditing(null)}
          className="inline-flex items-center gap-2 font-sans text-body-s text-warm-shadow transition-colors hover:text-accent-dark"
        >
          <span aria-hidden className="rtl:rotate-180">←</span>
          {t.title}
        </button>

        <header className="mt-6">
          <p className="font-display uppercase label-xs text-glyph-gold/80">
            {dict.marketing.common.eyebrow}
          </p>
          <h1 className="mt-1 font-display text-display-s text-accent-dark md:text-display-m">
            {editing.id ? t.editTitle : t.newTitle}
          </h1>
        </header>

        <section className="mt-8 rounded-2xl border border-accent-dark/10 bg-white p-5 shadow-sm md:p-6">
          <Field label={t.nameLabel}>
            <Input
              value={editing.name}
              onChange={(e) => setEditing({ ...editing, name: e.target.value })}
              disabled={editing.is_builtin}
              placeholder={t.namePlaceholder}
            />
          </Field>

          <div className="mt-4">
            <Field label={t.descriptionLabel}>
              <Input
                value={editing.description ?? ""}
                onChange={(e) =>
                  setEditing({ ...editing, description: e.target.value })
                }
                placeholder={t.descriptionPlaceholder}
              />
            </Field>
          </div>

          <div className="mt-6">
            <p className="mb-2 font-display label-sm uppercase text-accent-dark/80">
              {t.rulesLabel}
            </p>
            <SegmentBuilder
              value={editing.filter}
              onChange={(filter) => setEditing({ ...editing, filter })}
              dict={dict}
            />
          </div>

          <div className="mt-6 flex flex-wrap gap-3">
            <button
              type="button"
              onClick={() => void saveSegment()}
              className="inline-flex min-h-[44px] items-center gap-2 rounded-full bg-glyph-gold px-6 py-2 font-display label-s uppercase tracking-wide text-accent-dark transition-colors hover:bg-glyph-gold/90"
            >
              {editing.id ? t.saveButton : t.createButton}
            </button>
            <button
              type="button"
              onClick={() => setEditing(null)}
              className="inline-flex min-h-[44px] items-center gap-2 rounded-full border border-accent-dark/15 bg-cream px-6 py-2 font-display label-s uppercase tracking-wide text-accent-dark transition-colors hover:bg-accent-dark hover:text-cream"
            >
              {dict.common.cancel}
            </button>
          </div>
        </section>
      </div>
    );
  }

  return (
    <div className="mx-auto w-full max-w-[900px] px-6 py-12 md:px-10 md:py-16">
      <Link
        href={`/${lang}/marketing`}
        className="inline-flex items-center gap-2 font-sans text-body-s text-warm-shadow transition-colors hover:text-accent-dark"
      >
        <span aria-hidden className="rtl:rotate-180">←</span>
        {t.backToMarketing}
      </Link>

      <header className="mt-6 flex flex-wrap items-end justify-between gap-4">
        <div>
          <p className="font-display uppercase label-xs text-glyph-gold/80">
            {dict.marketing.common.eyebrow}
          </p>
          <h1 className="mt-1 font-display text-display-s text-accent-dark md:text-display-m">
            {t.title}
          </h1>
          <p className="mt-2 max-w-prose font-sans text-body-s text-warm-shadow">
            {t.subtitle}
          </p>
        </div>
        <button
          type="button"
          onClick={() =>
            setEditing({
              name: "",
              description: "",
              filter: emptyFilter(),
              is_builtin: false,
            })
          }
          className="inline-flex min-h-[44px] items-center gap-2 rounded-full bg-glyph-gold px-5 py-2 font-display label-s uppercase tracking-wide text-accent-dark transition-colors hover:bg-glyph-gold/90"
        >
          {t.newSegment}
        </button>
      </header>

      <section className="mt-8 rounded-2xl border border-accent-dark/10 bg-white p-5 shadow-sm md:p-6">
        {segments == null ? (
          <p className="font-sans text-body-s italic text-warm-shadow">
            {dict.marketing.common.loading}
          </p>
        ) : segments.length === 0 ? (
          <p className="font-sans text-body-s italic text-warm-shadow">
            {t.empty}
          </p>
        ) : (
          <ul className="m-0 list-none p-0">
            {segments.map((s) => (
              <li
                key={s.id}
                className="flex flex-wrap items-center gap-3 border-b border-accent-dark/8 py-3 last:border-b-0"
              >
                <div className="min-w-0 flex-1">
                  <div className="flex flex-wrap items-center gap-2">
                    <strong className="font-sans text-body-m text-accent-dark">
                      {s.name}
                    </strong>
                    {s.is_builtin && (
                      <span className="inline-flex items-center rounded-full bg-glyph-gold/20 px-2 py-0.5 font-display label-xs uppercase text-accent-dark">
                        {t.builtinTag}
                      </span>
                    )}
                  </div>
                  {s.description && (
                    <p className="mt-1 font-sans text-body-xs text-warm-shadow">
                      {s.description}
                    </p>
                  )}
                </div>
                <div className="min-w-[6rem] text-right font-display label-s uppercase text-glyph-gold">
                  {counts[s.id] != null
                    ? fmt(dict.marketing.common.recipients, { count: counts[s.id] })
                    : "…"}
                </div>
                <button
                  type="button"
                  onClick={() =>
                    setEditing({
                      id: s.id,
                      name: s.name,
                      description: s.description,
                      filter: s.filter,
                      is_builtin: s.is_builtin,
                    })
                  }
                  className="inline-flex min-h-[36px] items-center rounded-full border border-accent-dark/15 bg-cream px-3 py-1.5 font-display label-xs uppercase text-accent-dark transition-colors hover:bg-accent-dark hover:text-cream"
                >
                  {t.edit}
                </button>
                <button
                  type="button"
                  onClick={() => setPendingDelete(s)}
                  disabled={s.is_builtin}
                  className="inline-flex min-h-[36px] items-center rounded-full border border-error/40 bg-error/10 px-3 py-1.5 font-display label-xs uppercase text-error transition-colors hover:bg-error hover:text-white disabled:cursor-not-allowed disabled:opacity-30"
                >
                  {t.delete}
                </button>
              </li>
            ))}
          </ul>
        )}
      </section>

      <ConfirmDialog
        open={pendingDelete != null}
        title={t.deleteTitle}
        description={fmt(t.deleteMessage, { name: pendingDelete?.name ?? "" })}
        confirmLabel={deleting ? dict.common.loading : t.delete}
        cancelLabel={dict.common.cancel}
        destructive
        onConfirm={() => void confirmDelete()}
        onCancel={() => !deleting && setPendingDelete(null)}
      />
    </div>
  );
}
