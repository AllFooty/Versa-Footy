"use client";

import { useCallback, useEffect, useState } from "react";
import { useParams } from "next/navigation";
import { supabase } from "../../../../_lib/supabase";
import { ConfirmDialog } from "../../../../_components/primitives/ConfirmDialog";
import { toast } from "../../../../_components/primitives/Toast";
import type { Block } from "../_lib/blocks";
import type { ProductDict } from "../../../../_dictionaries/product";

export type EditorMode = "blocks" | "html";

export type Template = {
  id: string;
  name: string;
  subject: string | null;
  mode: EditorMode;
  blocks_json: Block[] | null;
  html: string | null;
  is_builtin: boolean;
  updated_at: string;
};

export type TemplateLoadPayload = {
  subject: string;
  mode: EditorMode;
  blocks: Block[] | null;
  html: string | null;
};

function fmt(template: string, vars: Record<string, string | number>): string {
  return template.replace(/\{\{(\w+)\}\}/g, (_, k) => String(vars[k] ?? ""));
}

export function TemplatesPanel({
  currentSubject,
  currentMode,
  currentBlocks,
  currentHtml,
  onLoad,
  dict,
}: {
  currentSubject: string;
  currentMode: EditorMode;
  currentBlocks: Block[];
  currentHtml: string;
  onLoad: (p: TemplateLoadPayload) => void;
  dict: ProductDict;
}) {
  const t = dict.marketing.templates;
  const params = useParams();
  const lang = String(params?.lang ?? "");
  const [templates, setTemplates] = useState<Template[] | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [selectedId, setSelectedId] = useState("");
  const [busy, setBusy] = useState(false);
  const [confirmDelete, setConfirmDelete] = useState(false);

  const reload = useCallback(async () => {
    const { data, error: dbError } = await supabase
      .from("marketing_templates")
      .select("id, name, subject, mode, blocks_json, html, is_builtin, updated_at")
      .order("is_builtin", { ascending: false })
      .order("name", { ascending: true });
    if (dbError) setError(dbError.message);
    else {
      setError(null);
      setTemplates((data as Template[]) ?? []);
    }
  }, []);

  useEffect(() => {
    void reload();
  }, [reload]);

  const selected = templates?.find((tpl) => tpl.id === selectedId) ?? null;

  const loadSelected = () => {
    if (!selected) return;
    onLoad({
      subject: selected.subject ?? "",
      mode: selected.mode,
      blocks: selected.mode === "blocks" ? selected.blocks_json ?? [] : null,
      html: selected.mode === "html" ? selected.html ?? "" : null,
    });
  };

  const saveAsNew = async () => {
    const name = window.prompt(t.namePrompt);
    if (!name) return;
    setBusy(true);
    const { error: dbError } = await supabase.from("marketing_templates").insert({
      name: name.trim(),
      subject: currentSubject || "",
      mode: currentMode,
      blocks_json: currentMode === "blocks" ? currentBlocks : null,
      html: currentMode === "html" ? currentHtml : null,
      is_builtin: false,
    });
    setBusy(false);
    if (dbError) {
      toast.error(fmt(t.saveFailed, { error: dbError.message }));
      return;
    }
    toast.success(t.savedToast);
    void reload();
  };

  const duplicateSelected = async () => {
    if (!selected) return;
    const name = window.prompt(t.newNamePrompt, fmt(t.copyName, { name: selected.name }));
    if (!name) return;
    setBusy(true);
    const { error: dbError } = await supabase.from("marketing_templates").insert({
      name: name.trim(),
      subject: selected.subject ?? "",
      mode: selected.mode,
      blocks_json: selected.blocks_json,
      html: selected.html,
      is_builtin: false,
    });
    setBusy(false);
    if (dbError) {
      toast.error(fmt(t.duplicateFailed, { error: dbError.message }));
      return;
    }
    toast.success(t.duplicatedToast);
    void reload();
  };

  const performDelete = async () => {
    if (!selected || selected.is_builtin) return;
    setConfirmDelete(false);
    setBusy(true);
    const { error: dbError } = await supabase
      .from("marketing_templates")
      .delete()
      .eq("id", selected.id);
    setBusy(false);
    if (dbError) {
      toast.error(fmt(t.deleteFailed, { error: dbError.message }));
      return;
    }
    toast.success(t.deletedToast);
    setSelectedId("");
    void reload();
  };

  if (error) {
    return (
      <div className="rounded-xl border border-error/40 bg-error/10 px-3 py-2 font-sans text-body-s text-error">
        {fmt(dict.marketing.common.failedToLoad, { error })}
      </div>
    );
  }

  const btnGhost =
    "inline-flex min-h-[40px] items-center rounded-full border border-accent-dark/15 bg-cream px-4 py-2 font-display label-xs uppercase text-accent-dark transition-colors hover:bg-accent-dark hover:text-cream disabled:opacity-40 disabled:cursor-not-allowed";
  const btnPrimary =
    "inline-flex min-h-[40px] items-center rounded-full bg-glyph-gold px-4 py-2 font-display label-xs uppercase text-accent-dark transition-colors hover:bg-glyph-gold/90 disabled:opacity-40 disabled:cursor-not-allowed";
  const btnDanger =
    "inline-flex min-h-[40px] items-center rounded-full border border-error/40 bg-error/10 px-4 py-2 font-display label-xs uppercase text-error transition-colors hover:bg-error hover:text-white disabled:opacity-40 disabled:cursor-not-allowed";

  return (
    <div>
      <div className="flex flex-wrap items-center gap-2">
        <select
          value={selectedId}
          onChange={(e) => setSelectedId(e.target.value)}
          disabled={!templates}
          className="h-10 min-w-[200px] flex-1 rounded-xl border border-accent-dark/15 bg-cream px-3 font-sans text-body-s text-accent-dark"
        >
          <option value="">{t.pickPlaceholder}</option>
          {templates?.map((tpl) => (
            <option key={tpl.id} value={tpl.id}>
              {tpl.is_builtin ? "★ " : ""}
              {tpl.name}
            </option>
          ))}
        </select>
        <button type="button" onClick={loadSelected} disabled={!selected || busy} className={btnPrimary}>
          {t.load}
        </button>
        <button
          type="button"
          onClick={() => void duplicateSelected()}
          disabled={!selected || busy}
          className={btnGhost}
        >
          {t.duplicate}
        </button>
        <button
          type="button"
          onClick={() => setConfirmDelete(true)}
          disabled={!selected || selected.is_builtin || busy}
          title={selected?.is_builtin ? t.builtinDeleteTitle : undefined}
          className={btnDanger}
        >
          {t.delete}
        </button>
        <span className="flex-1" />
        <button
          type="button"
          onClick={() => void saveAsNew()}
          disabled={busy || !currentSubject}
          className={btnGhost}
        >
          {t.saveCurrent}
        </button>
      </div>

      {selected && (
        <p className="mt-2 font-sans text-body-xs text-warm-shadow">
          {selected.is_builtin
            ? t.builtinNote
            : fmt(t.customNote, { when: new Date(selected.updated_at).toLocaleString(lang) })}
          {" · "}
          {t.subjectPrefix}{" "}
          <em className="text-accent-dark/80">
            {selected.subject || t.emptySubject}
          </em>
        </p>
      )}

      <ConfirmDialog
        open={confirmDelete}
        title={t.deleteTitle}
        description={fmt(t.deleteMessage, { name: selected?.name ?? "" })}
        confirmLabel={t.delete}
        cancelLabel={dict.common.cancel}
        destructive
        onConfirm={() => void performDelete()}
        onCancel={() => setConfirmDelete(false)}
      />
    </div>
  );
}
