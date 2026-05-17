"use client";

import { useEffect, useState } from "react";
import { Modal } from "../../../../_components/primitives/Modal";
import { Input } from "../../../../_components/primitives/Input";
import { Field } from "../../../../_components/primitives/Field";
import type { Category } from "../_lib/types";
import type { ProductDict } from "../../../../_dictionaries/product";

function fmt(template: string, vars: Record<string, string | number>): string {
  return template.replace(/\{\{(\w+)\}\}/g, (_, k) => String(vars[k] ?? ""));
}

export function DeleteCategoryModal({
  open,
  category,
  skillCount,
  exerciseCount,
  busy,
  onConfirm,
  onClose,
  dict,
}: {
  open: boolean;
  category: Category | null;
  skillCount: number;
  exerciseCount: number;
  busy: boolean;
  onConfirm: () => void;
  onClose: () => void;
  dict: ProductDict;
}) {
  const t = dict.library.categoryDelete;
  const [typed, setTyped] = useState("");

  useEffect(() => {
    if (open) setTyped("");
  }, [open]);

  if (!category) return null;
  const matches = typed.trim().toLowerCase() === category.name.trim().toLowerCase();

  return (
    <Modal open={open} onClose={busy ? () => undefined : onClose} size="md" ariaLabel={t.title}>
      <h2 className="font-display label-md uppercase text-error">{t.title}</h2>

      <div className="mt-4 rounded-xl border border-error/30 bg-error/8 p-4 font-sans text-body-s text-accent-dark">
        <p className="m-0 leading-relaxed">
          {t.warningPrefix} <strong>&ldquo;{category.name}&rdquo;</strong>.
          {(skillCount > 0 || exerciseCount > 0) && (
            <>
              {" "}
              {t.willAlsoDelete}
            </>
          )}
        </p>
        {(skillCount > 0 || exerciseCount > 0) && (
          <ul className="ml-5 mt-2 list-disc space-y-1">
            {skillCount > 0 && (
              <li>
                <strong>
                  {skillCount === 1
                    ? fmt(t.skillCount, { count: skillCount })
                    : fmt(t.skillCountPlural, { count: skillCount })}
                </strong>
              </li>
            )}
            {exerciseCount > 0 && (
              <li>
                <strong>
                  {exerciseCount === 1
                    ? fmt(t.exerciseCount, { count: exerciseCount })
                    : fmt(t.exerciseCountPlural, { count: exerciseCount })}
                </strong>
              </li>
            )}
          </ul>
        )}
        <p className="mt-3 font-display label-xs uppercase text-error">{t.cannotBeUndone}</p>
      </div>

      <div className="mt-4">
        <Field label={fmt(t.typeToConfirm, { name: category.name })}>
          <Input
            value={typed}
            onChange={(e) => setTyped(e.target.value)}
            disabled={busy}
            autoFocus
          />
        </Field>
      </div>

      <div className="mt-4 flex flex-wrap justify-end gap-3">
        <button
          type="button"
          onClick={onClose}
          disabled={busy}
          className="inline-flex min-h-[44px] items-center rounded-full border border-accent-dark/15 bg-cream px-5 py-2 font-display label-s uppercase tracking-wide text-accent-dark transition-colors hover:bg-accent-dark hover:text-cream disabled:opacity-50"
        >
          {t.cancelButton}
        </button>
        <button
          type="button"
          onClick={onConfirm}
          disabled={busy || !matches}
          className="inline-flex min-h-[44px] items-center rounded-full bg-error px-5 py-2 font-display label-s uppercase tracking-wide text-white transition-colors hover:bg-error/90 disabled:cursor-not-allowed disabled:opacity-40"
        >
          {busy ? t.deleting : t.confirmButton}
        </button>
      </div>
    </Modal>
  );
}
