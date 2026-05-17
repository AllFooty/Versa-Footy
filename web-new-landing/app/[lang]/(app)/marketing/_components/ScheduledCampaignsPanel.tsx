"use client";

import { useCallback, useEffect, useState } from "react";
import { supabase } from "../../../../_lib/supabase";
import { ConfirmDialog } from "../../../../_components/primitives/ConfirmDialog";
import { Modal } from "../../../../_components/primitives/Modal";
import { Button } from "../../../../_components/primitives/Button";
import { DateTimeInput } from "../../../../_components/primitives/DateTimeInput";
import { toast } from "../../../../_components/primitives/Toast";
import type { ProductDict } from "../../../../_dictionaries/product";

type ScheduledRow = {
  id: string;
  subject: string;
  audience: string;
  category: string | null;
  status: "scheduled" | "sending" | "sent" | "cancelled" | string;
  scheduled_for: string | null;
};

function fmt(template: string, vars: Record<string, string | number>): string {
  return template.replace(/\{\{(\w+)\}\}/g, (_, k) => String(vars[k] ?? ""));
}

export function ScheduledCampaignsPanel({
  refreshKey,
  dict,
}: {
  refreshKey: number;
  dict: ProductDict;
}) {
  const t = dict.marketing.scheduled;
  const [rows, setRows] = useState<ScheduledRow[] | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [busyId, setBusyId] = useState<string | null>(null);
  const [pendingCancel, setPendingCancel] = useState<string | null>(null);
  const [reschedTarget, setReschedTarget] = useState<string | null>(null);
  const [reschedValue, setReschedValue] = useState("");

  const reload = useCallback(async () => {
    const { data, error: rpcError } = await supabase.rpc("marketing_list_scheduled");
    if (rpcError) setError(rpcError.message);
    else {
      setError(null);
      setRows((data as ScheduledRow[]) ?? []);
    }
  }, []);

  useEffect(() => {
    void reload();
  }, [reload, refreshKey]);

  const confirmCancel = async () => {
    const id = pendingCancel;
    if (!id) return;
    setPendingCancel(null);
    setBusyId(id);
    const { data, error: rpcError } = await supabase.rpc("marketing_cancel_scheduled", {
      p_id: id,
    });
    setBusyId(null);
    if (rpcError) {
      toast.error(fmt(t.cancelFailed, { error: rpcError.message }));
      return;
    }
    if (!data) toast.warning(t.cancelTooLate);
    else toast.success(t.canceledToast);
    void reload();
  };

  const openReschedule = (id: string) => {
    setReschedValue("");
    setReschedTarget(id);
  };

  const confirmReschedule = async () => {
    const id = reschedTarget;
    if (!id || !reschedValue) return;
    const dt = new Date(reschedValue);
    if (Number.isNaN(dt.getTime())) {
      toast.error(t.invalidDate);
      return;
    }
    if (dt <= new Date()) {
      toast.error(t.futureRequired);
      return;
    }
    setReschedTarget(null);
    setBusyId(id);
    const { data, error: rpcError } = await supabase.rpc(
      "marketing_reschedule_campaign",
      { p_id: id, p_new_time: dt.toISOString() },
    );
    setBusyId(null);
    if (rpcError) {
      toast.error(fmt(t.rescheduleFailed, { error: rpcError.message }));
      return;
    }
    if (!data) toast.warning(t.rescheduleTooLate);
    else toast.success(t.rescheduledToast);
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
  if (rows.length === 0) {
    return (
      <p className="px-3 py-2 font-sans text-body-s italic text-warm-shadow">{t.empty}</p>
    );
  }

  return (
    <div>
      {rows.map((c) => {
        const when = c.scheduled_for ? new Date(c.scheduled_for) : null;
        const isPast = when && when < new Date();
        const statusColor =
          c.status === "scheduled"
            ? "text-glyph-gold"
            : c.status === "sending"
              ? "text-warning"
              : "text-warm-shadow";
        return (
          <div
            key={c.id}
            className="flex flex-wrap items-center gap-3 border-b border-accent-dark/8 px-3 py-3 last:border-b-0"
          >
            <div className="min-w-0 flex-1">
              <div className="truncate font-sans text-body-s font-semibold text-accent-dark">
                {c.subject}
              </div>
              <div className="mt-1 font-sans text-body-xs text-warm-shadow">
                {c.audience}
                {c.category ? ` · ${c.category}` : ""} ·{" "}
                <span className={statusColor}>{c.status}</span>
                {when && (
                  <>
                    {" "}
                    · {when.toLocaleString()}
                    {isPast && c.status === "scheduled" ? t.overdue : ""}
                  </>
                )}
              </div>
            </div>
            {c.status === "scheduled" && (
              <div className="flex gap-2">
                <button
                  type="button"
                  onClick={() => openReschedule(c.id)}
                  disabled={busyId === c.id}
                  className="inline-flex min-h-[36px] items-center rounded-full border border-accent-dark/15 bg-cream px-3 py-1.5 font-display label-xs uppercase text-accent-dark transition-colors hover:bg-accent-dark hover:text-cream disabled:opacity-50"
                >
                  {t.reschedule}
                </button>
                <button
                  type="button"
                  onClick={() => setPendingCancel(c.id)}
                  disabled={busyId === c.id}
                  className="inline-flex min-h-[36px] items-center rounded-full border border-error/40 bg-error/10 px-3 py-1.5 font-display label-xs uppercase text-error transition-colors hover:bg-error hover:text-white disabled:opacity-50"
                >
                  {t.cancel}
                </button>
              </div>
            )}
          </div>
        );
      })}

      <Modal
        open={reschedTarget != null}
        onClose={() => setReschedTarget(null)}
        size="sm"
        ariaLabel={t.rescheduleTitle}
      >
        <h2 className="font-display uppercase font-black tracking-[-0.01em] text-[clamp(20px,2.4vw,26px)] text-accent-dark">
          {t.rescheduleTitle}
        </h2>
        <p className="mt-3 font-sans text-body-s text-accent-dark/75">
          {t.reschedulePrompt}
        </p>
        <div className="mt-5">
          <DateTimeInput
            autoFocus
            aria-label={t.reschedulePrompt}
            value={reschedValue}
            onChange={(e) => setReschedValue(e.currentTarget.value)}
          />
        </div>
        <div className="mt-6 flex flex-col-reverse gap-3 sm:flex-row sm:justify-end">
          <Button variant="secondary" size="md" onClick={() => setReschedTarget(null)}>
            {dict.common.cancel}
          </Button>
          <Button
            variant="primary"
            size="md"
            onClick={() => void confirmReschedule()}
            disabled={!reschedValue}
          >
            {t.rescheduleConfirm}
          </Button>
        </div>
      </Modal>

      <ConfirmDialog
        open={pendingCancel != null}
        title={t.cancelTitle}
        description={t.cancelMessage}
        confirmLabel={t.cancelButton}
        cancelLabel={dict.common.cancel}
        destructive
        onConfirm={() => void confirmCancel()}
        onCancel={() => setPendingCancel(null)}
      />
    </div>
  );
}
