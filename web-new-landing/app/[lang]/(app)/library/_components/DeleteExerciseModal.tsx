"use client";

import { ConfirmDialog } from "../../../../_components/primitives/ConfirmDialog";
import type { Exercise } from "../_lib/types";
import type { ProductDict } from "../../../../_dictionaries/product";

function fmt(template: string, vars: Record<string, string | number>): string {
  return template.replace(/\{\{(\w+)\}\}/g, (_, k) => String(vars[k] ?? ""));
}

export function DeleteExerciseModal({
  open,
  exercise,
  busy,
  onConfirm,
  onClose,
  dict,
}: {
  open: boolean;
  exercise: Exercise | null;
  busy: boolean;
  onConfirm: () => void;
  onClose: () => void;
  dict: ProductDict;
}) {
  const t = dict.library.exerciseDelete;
  return (
    <ConfirmDialog
      open={open}
      title={t.title}
      description={fmt(t.description, { name: exercise?.name ?? "" })}
      confirmLabel={busy ? t.deleting : t.confirmButton}
      cancelLabel={t.cancelButton}
      destructive
      onConfirm={onConfirm}
      onCancel={busy ? () => undefined : onClose}
    />
  );
}
