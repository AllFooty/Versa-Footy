"use client";

import { useCallback, useEffect, useState } from "react";
import { supabase } from "../../../../_lib/supabase";
import { ConfirmDialog } from "../../../../_components/primitives/ConfirmDialog";
import { toast } from "../../../../_components/primitives/Toast";
import type { ProductDict } from "../../../../_dictionaries/product";

type SuppressionRow = {
  email: string;
  reason: string | null;
  notes: string | null;
  created_at: string;
};

function fmt(template: string, vars: Record<string, string | number>): string {
  return template.replace(/\{\{(\w+)\}\}/g, (_, k) => String(vars[k] ?? ""));
}

export function SuppressionsPanel({ dict }: { dict: ProductDict }) {
  const t = dict.marketing.suppressions;
  const [rows, setRows] = useState<SuppressionRow[] | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [filter, setFilter] = useState("");
  const [pendingRemove, setPendingRemove] = useState<string | null>(null);

  const reload = useCallback(async () => {
    const { data, error: dbError } = await supabase
      .from("marketing_suppressions")
      .select("email, reason, notes, created_at")
      .order("created_at", { ascending: false })
      .limit(500);
    if (dbError) setError(dbError.message);
    else {
      setError(null);
      setRows((data as SuppressionRow[]) ?? []);
    }
  }, []);

  useEffect(() => {
    void reload();
  }, [reload]);

  const performRemove = async () => {
    const email = pendingRemove;
    if (!email) return;
    setPendingRemove(null);
    const { error: dbError } = await supabase
      .from("marketing_suppressions")
      .delete()
      .eq("email", email);
    if (dbError) {
      toast.error(fmt(t.removeFailed, { error: dbError.message }));
      return;
    }
    toast.success(t.removedToast);
    void reload();
  };

  if (error) {
    return (
      <div className="rounded-xl border border-error/40 bg-error/10 px-3 py-2 font-sans text-body-s text-error">
        {fmt(dict.marketing.common.failedToLoad, { error })}
      </div>
    );
  }
  if (!rows) {
    return (
      <p className="px-3 py-2 font-sans text-body-s italic text-warm-shadow">{t.loading}</p>
    );
  }

  const filtered = filter
    ? rows.filter((r) => r.email.toLowerCase().includes(filter.toLowerCase()))
    : rows;

  return (
    <div>
      <div className="mb-3 flex flex-wrap items-center gap-3">
        <input
          type="search"
          placeholder={t.filterPlaceholder}
          value={filter}
          onChange={(e) => setFilter(e.target.value)}
          className="h-10 min-w-[200px] max-w-md flex-1 rounded-xl border border-accent-dark/15 bg-cream px-3 font-sans text-body-s text-accent-dark placeholder:text-warm-shadow/70"
        />
        <span className="font-sans text-body-xs text-warm-shadow">
          {fmt(t.filterCount, { filtered: filtered.length, total: rows.length })}
        </span>
      </div>

      {filtered.length === 0 ? (
        <p className="px-3 py-2 font-sans text-body-s italic text-warm-shadow">
          {rows.length === 0 ? t.empty : t.noMatches}
        </p>
      ) : (
        <div className="overflow-hidden rounded-xl border border-accent-dark/10">
          <div className="grid grid-cols-[2fr_1fr_1fr_1fr_80px] gap-2 border-b border-accent-dark/10 bg-cream/60 px-3 py-2 font-display label-xs uppercase text-warm-shadow">
            <span>{t.colEmail}</span>
            <span>{t.colReason}</span>
            <span>{t.colNotes}</span>
            <span>{t.colAdded}</span>
            <span />
          </div>
          {filtered.map((r) => (
            <div
              key={r.email}
              className="grid grid-cols-[2fr_1fr_1fr_1fr_80px] items-center gap-2 border-b border-accent-dark/8 px-3 py-2 last:border-b-0"
            >
              <span className="truncate font-sans text-body-xs text-accent-dark">{r.email}</span>
              <span
                className={`font-sans text-body-xs ${
                  r.reason === "complained" ? "text-error" : "text-warning"
                }`}
              >
                {r.reason ?? "—"}
              </span>
              <span
                className="truncate font-sans text-body-xs text-warm-shadow"
                title={r.notes ?? ""}
              >
                {r.notes ?? "—"}
              </span>
              <span className="font-sans text-body-xs text-warm-shadow">
                {new Date(r.created_at).toLocaleDateString()}
              </span>
              <button
                type="button"
                onClick={() => setPendingRemove(r.email)}
                className="inline-flex h-8 items-center rounded-full border border-error/40 bg-error/10 px-2 font-display label-xs uppercase text-error transition-colors hover:bg-error hover:text-white"
              >
                {t.remove}
              </button>
            </div>
          ))}
        </div>
      )}

      <ConfirmDialog
        open={pendingRemove != null}
        title={t.removeTitle}
        description={fmt(t.removeMessage, { email: pendingRemove ?? "" })}
        confirmLabel={t.remove}
        cancelLabel={dict.common.cancel}
        destructive
        onConfirm={() => void performRemove()}
        onCancel={() => setPendingRemove(null)}
      />
    </div>
  );
}
