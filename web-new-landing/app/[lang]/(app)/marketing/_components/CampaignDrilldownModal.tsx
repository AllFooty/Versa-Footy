"use client";

import { useEffect, useState } from "react";
import { useParams } from "next/navigation";
import { supabase } from "../../../../_lib/supabase";
import { ConfirmDialog } from "../../../../_components/primitives/ConfirmDialog";
import { Modal } from "../../../../_components/primitives/Modal";
import type { ProductDict } from "../../../../_dictionaries/product";

const FUNCTION_URL = `${process.env.NEXT_PUBLIC_SUPABASE_URL}/functions/v1/resend-campaign-failures`;

type FilterKey = "all" | "sent" | "failed" | "opened" | "clicked" | "bounced";
const FILTERS: FilterKey[] = ["all", "sent", "failed", "opened", "clicked", "bounced"];

export type CampaignSummary = {
  id: string;
  subject: string;
  audience: string;
  status: string;
};

type RecipientRow = {
  email: string;
  status: string;
  opened_at: string | null;
  clicked_at: string | null;
  bounced_at: string | null;
  complained_at: string | null;
  error_message: string | null;
};

type ResendResult =
  | { error: string }
  | { ok: true; sent: number; failed: number; skipped: number };

function fmt(template: string, vars: Record<string, string | number>): string {
  return template.replace(/\{\{(\w+)\}\}/g, (_, k) => String(vars[k] ?? ""));
}

export function CampaignDrilldownModal({
  campaign,
  dict,
  onClose,
}: {
  campaign: CampaignSummary;
  dict: ProductDict;
  onClose: () => void;
}) {
  const t = dict.marketing.drilldown;
  const params = useParams();
  const lang = String(params?.lang ?? "");
  const [rows, setRows] = useState<RecipientRow[] | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [filter, setFilter] = useState<FilterKey>("all");
  const [resending, setResending] = useState(false);
  const [resendResult, setResendResult] = useState<ResendResult | null>(null);
  const [confirmOpen, setConfirmOpen] = useState(false);

  const load = async () => {
    const { data, error: rpcError } = await supabase.rpc(
      "marketing_campaign_recipients",
      { p_campaign_id: campaign.id, p_limit: 500, p_offset: 0 },
    );
    if (rpcError) setError(rpcError.message);
    else {
      setError(null);
      setRows((data as RecipientRow[]) ?? []);
    }
  };

  useEffect(() => {
    void load();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [campaign.id]);

  const counts = (rows ?? []).reduce(
    (acc, r) => {
      if (r.status === "sent") acc.sent++;
      if (r.status === "failed") acc.failed++;
      if (r.opened_at) acc.opened++;
      if (r.clicked_at) acc.clicked++;
      if (r.bounced_at || r.complained_at) acc.bounced++;
      return acc;
    },
    { sent: 0, failed: 0, opened: 0, clicked: 0, bounced: 0 },
  );

  const filtered = (rows ?? []).filter((r) => {
    if (filter === "all") return true;
    if (filter === "sent") return r.status === "sent";
    if (filter === "failed") return r.status === "failed";
    if (filter === "bounced") return !!r.bounced_at || !!r.complained_at;
    if (filter === "opened") return !!r.opened_at;
    if (filter === "clicked") return !!r.clicked_at;
    return true;
  });

  const performResend = async () => {
    setConfirmOpen(false);
    setResending(true);
    setResendResult(null);
    try {
      const {
        data: { session },
      } = await supabase.auth.getSession();
      if (!session) {
        setResendResult({ error: "Not authenticated" });
        return;
      }
      const res = await fetch(FUNCTION_URL, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${session.access_token}`,
        },
        body: JSON.stringify({ campaign_id: campaign.id }),
      });
      const body = (await res.json()) as { ok?: boolean; error?: string; sent?: number; failed?: number; skipped?: number };
      if (!res.ok || !body.ok) {
        setResendResult({ error: body.error ?? `HTTP ${res.status}` });
      } else {
        setResendResult({
          ok: true,
          sent: body.sent ?? 0,
          failed: body.failed ?? 0,
          skipped: body.skipped ?? 0,
        });
      }
      await load();
    } catch (e) {
      setResendResult({ error: e instanceof Error ? e.message : String(e) });
    } finally {
      setResending(false);
    }
  };

  const labelFor = (f: FilterKey): string => {
    const k = `filter${f.charAt(0).toUpperCase() + f.slice(1)}` as keyof typeof t;
    return t[k] as string;
  };

  return (
    <>
      <Modal open onClose={onClose} size="xl" ariaLabel={campaign.subject}>
        <div className="mb-3 flex items-start justify-between gap-3">
          <div className="min-w-0">
            <h2 className="m-0 font-display label-md uppercase text-accent-dark">
              {campaign.subject}
            </h2>
            <p className="mt-1 font-sans text-body-xs text-warm-shadow">
              {fmt(t.metadata, {
                audience: campaign.audience,
                status: campaign.status,
                id: campaign.id,
              })}
            </p>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="inline-flex h-9 items-center rounded-full border border-accent-dark/15 bg-cream px-3 font-display label-xs uppercase text-accent-dark transition-colors hover:bg-accent-dark hover:text-cream"
          >
            {t.close}
          </button>
        </div>

        <div className="mb-3 flex flex-wrap items-center gap-2">
          {FILTERS.map((f) => {
            const n = f === "all" ? rows?.length ?? 0 : counts[f as keyof typeof counts] ?? 0;
            const active = filter === f;
            return (
              <button
                key={f}
                type="button"
                onClick={() => setFilter(f)}
                className={`inline-flex items-center gap-1 rounded-full border px-3 py-1 font-display label-xs uppercase transition-colors ${
                  active
                    ? "border-glyph-gold/60 bg-glyph-gold/15 text-accent-dark"
                    : "border-accent-dark/15 bg-cream text-accent-dark/70 hover:text-accent-dark"
                }`}
              >
                {labelFor(f)} ({n})
              </button>
            );
          })}
          <span className="flex-1" />
          <button
            type="button"
            onClick={() => setConfirmOpen(true)}
            disabled={resending || counts.failed === 0}
            className="inline-flex min-h-[36px] items-center gap-2 rounded-full bg-glyph-gold px-4 py-1.5 font-display label-xs uppercase tracking-wide text-accent-dark transition-colors hover:bg-glyph-gold/90 disabled:cursor-not-allowed disabled:opacity-40"
          >
            {resending ? t.resending : fmt(t.resendButton, { count: counts.failed })}
          </button>
        </div>

        {resendResult && (
          <div
            className={`mb-3 rounded-xl border px-3 py-2 font-sans text-body-xs ${
              "error" in resendResult
                ? "border-error/40 bg-error/10 text-error"
                : "border-success/40 bg-success/10 text-success"
            }`}
          >
            {"error" in resendResult
              ? fmt(t.errorPrefix, { error: resendResult.error })
              : fmt(t.resendComplete, {
                  sent: resendResult.sent,
                  failed: resendResult.failed,
                  skipped: resendResult.skipped,
                })}
          </div>
        )}

        {error && (
          <div className="mb-3 rounded-xl border border-error/40 bg-error/10 px-3 py-2 font-sans text-body-xs text-error">
            {fmt(t.loadFailed, { error })}
          </div>
        )}

        {!rows && !error && (
          <p className="px-3 py-3 font-sans text-body-s italic text-warm-shadow">{t.loading}</p>
        )}
        {rows && rows.length === 0 && (
          <p className="px-3 py-3 font-sans text-body-s italic text-warm-shadow">{t.empty}</p>
        )}

        {filtered.length > 0 && (
          <div className="max-h-[480px] overflow-auto rounded-xl border border-accent-dark/10">
            <div className="sticky top-0 grid grid-cols-[2fr_0.7fr_0.8fr_0.8fr_0.8fr_1.5fr] gap-2 border-b border-accent-dark/10 bg-cream px-3 py-2 font-display label-xs uppercase text-warm-shadow">
              <span>{t.colEmail}</span>
              <span>{t.colStatus}</span>
              <span>{t.colOpened}</span>
              <span>{t.colClicked}</span>
              <span>{t.colBounce}</span>
              <span>{t.colError}</span>
            </div>
            {filtered.map((r, i) => (
              <div
                key={`${r.email}-${i}`}
                className="grid grid-cols-[2fr_0.7fr_0.8fr_0.8fr_0.8fr_1.5fr] items-center gap-2 border-b border-accent-dark/8 px-3 py-2 last:border-b-0"
              >
                <span className="truncate font-sans text-body-xs text-accent-dark">{r.email}</span>
                <span
                  className={`font-display label-xs uppercase ${
                    r.status === "sent" ? "text-success" : "text-error"
                  }`}
                >
                  {r.status}
                </span>
                <span className={`font-sans text-body-xs ${r.opened_at ? "text-glyph-gold" : "text-warm-shadow/60"}`}>
                  {r.opened_at ? new Date(r.opened_at).toLocaleDateString(lang) : "—"}
                </span>
                <span className={`font-sans text-body-xs ${r.clicked_at ? "text-glyph-gold" : "text-warm-shadow/60"}`}>
                  {r.clicked_at ? new Date(r.clicked_at).toLocaleDateString(lang) : "—"}
                </span>
                <span className="font-sans text-body-xs text-warm-shadow">
                  {r.bounced_at ? t.bounced : r.complained_at ? t.complained : "—"}
                </span>
                <span
                  className="truncate font-sans text-body-xs text-warm-shadow"
                  title={r.error_message ?? ""}
                >
                  {r.error_message ?? "—"}
                </span>
              </div>
            ))}
          </div>
        )}
      </Modal>

      <ConfirmDialog
        open={confirmOpen}
        title={t.resendTitle}
        description={fmt(t.resendMessage, { count: counts.failed })}
        confirmLabel={t.resendConfirm}
        cancelLabel={dict.common.cancel}
        onConfirm={() => void performResend()}
        onCancel={() => setConfirmOpen(false)}
      />
    </>
  );
}
