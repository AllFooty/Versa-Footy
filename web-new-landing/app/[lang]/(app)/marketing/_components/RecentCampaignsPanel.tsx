"use client";

import { useEffect, useState } from "react";
import { supabase } from "../../../../_lib/supabase";
import { CampaignDrilldownModal, type CampaignSummary } from "./CampaignDrilldownModal";
import type { ProductDict } from "../../../../_dictionaries/product";

type CampaignRow = CampaignSummary & {
  successful_sends: number | null;
  delivered: number | null;
  opened: number | null;
  clicked: number | null;
  bounced: number;
  complained: number;
  completed_at: string | null;
  created_at: string | null;
  sent_by_email: string | null;
};

function fmt(template: string, vars: Record<string, string | number>): string {
  return template.replace(/\{\{(\w+)\}\}/g, (_, k) => String(vars[k] ?? ""));
}

export function RecentCampaignsPanel({
  refreshKey,
  dict,
}: {
  refreshKey: number;
  dict: ProductDict;
}) {
  const t = dict.marketing.recent;
  const [campaigns, setCampaigns] = useState<CampaignRow[] | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [drilldown, setDrilldown] = useState<CampaignRow | null>(null);

  useEffect(() => {
    let cancelled = false;
    void (async () => {
      const { data, error: rpcError } = await supabase.rpc("marketing_recent_campaigns", {
        p_limit: 20,
      });
      if (cancelled) return;
      if (rpcError) setError(rpcError.message);
      else setCampaigns((data as CampaignRow[]) ?? []);
    })();
    return () => {
      cancelled = true;
    };
  }, [refreshKey]);

  if (error) {
    return (
      <div className="rounded-xl border border-error/40 bg-error/10 px-3 py-2 font-sans text-body-s text-error">
        {fmt(dict.marketing.common.failedToLoad, { error })}
      </div>
    );
  }
  if (!campaigns) {
    return (
      <p className="px-3 py-2 font-sans text-body-s italic text-warm-shadow">{t.loading}</p>
    );
  }
  if (campaigns.length === 0) {
    return (
      <p className="px-3 py-2 font-sans text-body-s italic text-warm-shadow">{t.empty}</p>
    );
  }

  return (
    <div>
      <div className="grid grid-cols-[2fr_repeat(5,1fr)] gap-2 border-b border-accent-dark/10 px-3 py-2 font-display label-xs uppercase text-warm-shadow">
        <span>{t.colSubject}</span>
        <span className="text-center">{t.colSent}</span>
        <span className="text-center">{t.colDelivered}</span>
        <span className="text-center">{t.colOpened}</span>
        <span className="text-center">{t.colClicked}</span>
        <span className="text-center">{t.colBounced}</span>
      </div>
      {campaigns.map((c) => (
        <CampaignRow key={c.id} c={c} t={t} onClick={() => setDrilldown(c)} />
      ))}
      {drilldown && (
        <CampaignDrilldownModal
          campaign={drilldown}
          dict={dict}
          onClose={() => setDrilldown(null)}
        />
      )}
    </div>
  );
}

function CampaignRow({
  c,
  t,
  onClick,
}: {
  c: CampaignRow;
  t: ProductDict["marketing"]["recent"];
  onClick: () => void;
}) {
  const sent = c.successful_sends ?? 0;
  const denom = sent || 1;
  const pct = (n: number | null) => `${Math.round(((n ?? 0) / denom) * 100)}%`;
  const date = c.completed_at || c.created_at;
  const sender = c.sent_by_email ?? t.rowSystemSender;
  const bouncedTotal = (c.bounced ?? 0) + (c.complained ?? 0);
  return (
    <div
      className="grid cursor-pointer grid-cols-[2fr_repeat(5,1fr)] items-center gap-2 border-b border-accent-dark/8 px-3 py-3 last:border-b-0 transition-colors hover:bg-cream/40"
      onClick={onClick}
      title={t.rowTitle}
      role="button"
      tabIndex={0}
      onKeyDown={(e) => {
        if (e.key === "Enter" || e.key === " ") {
          e.preventDefault();
          onClick();
        }
      }}
    >
      <div className="min-w-0">
        <div className="truncate font-sans text-body-s font-semibold text-accent-dark">
          {c.subject}
        </div>
        <div className="mt-1 font-sans text-body-xs text-warm-shadow">
          {fmt(t.rowMeta, {
            audience: c.audience,
            date: date ? new Date(date).toLocaleDateString() : "—",
            status: c.status,
            sender,
          })}
        </div>
      </div>
      <Stat n={sent} pct="" />
      <Stat n={c.delivered ?? 0} pct={sent ? pct(c.delivered) : ""} />
      <Stat n={c.opened ?? 0} pct={sent ? pct(c.opened) : ""} />
      <Stat n={c.clicked ?? 0} pct={sent ? pct(c.clicked) : ""} />
      <Stat n={bouncedTotal} pct={sent ? `${Math.round((bouncedTotal / denom) * 100)}%` : ""} warn={bouncedTotal > 0} />
    </div>
  );
}

function Stat({ n, pct, warn }: { n: number; pct: string; warn?: boolean }) {
  return (
    <div className="text-center">
      <div
        className={`font-sans text-body-s font-semibold ${
          warn ? "text-error" : "text-accent-dark"
        }`}
      >
        {n ?? 0}
      </div>
      {pct && <div className="font-sans text-[10px] text-warm-shadow">{pct}</div>}
    </div>
  );
}
