"use client";

import Link from "next/link";
import { useEffect, useMemo, useState } from "react";
import { useVideosAudit, type Audit } from "./_hooks/useVideosAudit";
import { ConfirmDialog } from "../../../_components/primitives/ConfirmDialog";
import { toast } from "../../../_components/primitives/Toast";
import { Spinner } from "../../../_components/primitives/Spinner";
import type { ProductDict } from "../../../_dictionaries/product";
import type { Locale } from "../../../_dictionaries";

type T = ProductDict["videosAudit"];
type TabKey = keyof Audit extends infer K
  ? K extends "missing" | "broken" | "mismatched" | "external" | "duplicates" | "orphans"
    ? K
    : never
  : never;
type Tone = "danger" | "warn" | "info";

const TAB_ORDER: { key: TabKey; tone: Tone }[] = [
  { key: "missing", tone: "danger" },
  { key: "broken", tone: "danger" },
  { key: "mismatched", tone: "danger" },
  { key: "external", tone: "info" },
  { key: "duplicates", tone: "info" },
  { key: "orphans", tone: "warn" },
];

function fmt(template: string, vars: Record<string, string | number>): string {
  return template.replace(/\{\{(\w+)\}\}/g, (_, k) => String(vars[k] ?? ""));
}

function formatBytes(n: number | null | undefined): string {
  if (!n) return "0 B";
  if (n < 1024) return `${n} B`;
  if (n < 1024 * 1024) return `${(n / 1024).toFixed(1)} KB`;
  if (n < 1024 * 1024 * 1024) return `${(n / (1024 * 1024)).toFixed(1)} MB`;
  return `${(n / (1024 * 1024 * 1024)).toFixed(2)} GB`;
}

const TONE_PILL: Record<"ok" | Tone, string> = {
  ok: "border-success/30 bg-success/10 text-success",
  danger: "border-error/40 bg-error/10 text-error",
  warn: "border-glyph-gold/50 bg-glyph-gold/15 text-accent-dark",
  info: "border-accent-dark/20 bg-accent-dark/5 text-accent-dark",
};

function TabPill({
  active,
  tone,
  count,
  label,
  onClick,
}: {
  active: boolean;
  tone: Tone;
  count: number;
  label: string;
  onClick: () => void;
}) {
  const palette = count === 0 ? TONE_PILL.ok : TONE_PILL[tone];
  return (
    <button
      type="button"
      onClick={onClick}
      className={`inline-flex min-h-[44px] items-center gap-2 rounded-full border px-4 py-2 font-display label-xs uppercase tracking-wide transition-colors ${palette} ${
        active ? "shadow-sm ring-1 ring-accent-dark/20" : "opacity-80 hover:opacity-100"
      }`}
    >
      <span>{label}</span>
      <span
        className={`inline-flex min-w-[1.5rem] items-center justify-center rounded-full px-2 py-0.5 text-[11px] font-bold ${palette}`}
      >
        {count}
      </span>
    </button>
  );
}

function Empty({ text }: { text: string }) {
  return (
    <div className="flex flex-col items-center justify-center gap-2 px-6 py-12 text-center font-sans text-body-s text-success">
      <span aria-hidden className="text-xl">✓</span>
      <span>{text}</span>
    </div>
  );
}

function IdChip({ id }: { id: number }) {
  return (
    <span className="inline-flex shrink-0 items-center rounded-md bg-accent-dark/10 px-2 py-0.5 font-mono text-[11px] font-bold text-accent-dark">
      #{id}
    </span>
  );
}

const ROW = "flex flex-wrap items-center justify-between gap-3 border-b border-accent-dark/8 px-4 py-3 last:border-b-0";
const ROW_MAIN = "flex min-w-0 flex-1 items-center gap-3";
const MUTED = "truncate font-sans text-body-s text-warm-shadow";
const CODE = "flex-1 truncate font-mono text-[12px] text-accent-dark/80";

export function VideosAuditView({
  dict,
  lang,
}: {
  dict: ProductDict;
  lang: Locale;
}) {
  const t = dict.videosAudit;
  const { audit, loading, error, refresh, deleteOrphans } = useVideosAudit();
  const [active, setActive] = useState<TabKey>("missing");
  const [confirmOpen, setConfirmOpen] = useState(false);
  const [busy, setBusy] = useState(false);

  const counts = useMemo(
    () =>
      Object.fromEntries(TAB_ORDER.map(({ key }) => [key, audit[key]?.length ?? 0])) as Record<TabKey, number>,
    [audit],
  );

  useEffect(() => {
    if (error) toast.error(fmt(t.loadError, { error }));
  }, [error, t.loadError]);

  const performDelete = async () => {
    if (!audit.orphans.length) return;
    setConfirmOpen(false);
    setBusy(true);
    const { removed, errors } = await deleteOrphans(audit.orphans.map((o) => o.path));
    setBusy(false);
    if (errors.length) {
      toast.error(fmt(t.orphans.deleteErrors, { errors: errors.join(", ") }));
    } else {
      toast.success(fmt(t.orphans.deleteSuccess, { count: removed }));
    }
  };

  return (
    <div className="mx-auto w-full max-w-[1100px] px-6 py-12 md:px-10 md:py-16">
      <Link
        href={`/${lang}/library`}
        className="inline-flex items-center gap-2 font-sans text-body-s text-warm-shadow transition-colors hover:text-accent-dark"
      >
        <span aria-hidden className="rtl:rotate-180">←</span>
        {t.backToLibrary}
      </Link>

      <header className="mt-6 flex flex-wrap items-end justify-between gap-4">
        <div>
          <p className="font-display uppercase label-xs text-glyph-gold/80">{t.eyebrow}</p>
          <h1 className="mt-1 font-display text-display-s text-accent-dark md:text-display-m">
            {t.title}
          </h1>
          <p className="mt-2 max-w-prose font-sans text-body-s text-warm-shadow">
            {t.subtitle}
          </p>
          {audit.generated_at && (
            <p className="mt-1 font-sans text-body-xs text-warm-shadow/80">
              {fmt(t.generatedAt, {
                when: new Date(audit.generated_at).toLocaleString(lang),
              })}
            </p>
          )}
        </div>
        <button
          type="button"
          onClick={() => void refresh()}
          disabled={loading}
          className="inline-flex min-h-[44px] items-center gap-2 rounded-full border border-accent-dark/15 bg-white px-5 py-2 font-display label-s uppercase tracking-wide text-accent-dark transition-colors hover:bg-accent-dark hover:text-cream disabled:opacity-60"
        >
          {loading ? t.refreshing : t.refresh}
        </button>
      </header>

      <div className="mt-8 flex flex-wrap gap-2">
        {TAB_ORDER.map(({ key, tone }) => (
          <TabPill
            key={key}
            active={active === key}
            tone={tone}
            count={counts[key]}
            label={t.tabs[key]}
            onClick={() => setActive(key)}
          />
        ))}
      </div>

      <section className="mt-6 rounded-2xl border border-accent-dark/10 bg-white shadow-sm">
        {loading && !audit.generated_at ? (
          <div className="flex min-h-[180px] items-center justify-center">
            <Spinner />
          </div>
        ) : active === "missing" ? (
          <MissingList items={audit.missing} t={t} />
        ) : active === "broken" ? (
          <BrokenList items={audit.broken} t={t} />
        ) : active === "mismatched" ? (
          <MismatchedList items={audit.mismatched} t={t} />
        ) : active === "external" ? (
          <ExternalList items={audit.external} t={t} />
        ) : active === "duplicates" ? (
          <DuplicatesList items={audit.duplicates} t={t} />
        ) : (
          <OrphansList
            items={audit.orphans}
            busy={busy}
            onDeleteAll={() => setConfirmOpen(true)}
            t={t}
          />
        )}
      </section>

      <ConfirmDialog
        open={confirmOpen}
        title={t.orphans.deleteConfirmTitle}
        description={fmt(t.orphans.deleteConfirmBody, { count: audit.orphans.length })}
        confirmLabel={busy ? t.orphans.deleting : dict.common.delete}
        cancelLabel={dict.common.cancel}
        destructive
        onConfirm={() => void performDelete()}
        onCancel={() => !busy && setConfirmOpen(false)}
      />
    </div>
  );
}

function MissingList({ items, t }: { items: Audit["missing"]; t: T }) {
  if (!items.length) return <Empty text={t.empty.missing} />;
  return (
    <ul className="m-0 list-none p-0">
      {items.map((e) => (
        <li key={e.id} className={ROW}>
          <div className={ROW_MAIN}>
            <IdChip id={e.id} />
            <span className="truncate font-sans text-body-s text-accent-dark">{e.name}</span>
          </div>
          <span className={MUTED}>{fmt(t.row.skill, { id: e.skill_id })}</span>
        </li>
      ))}
    </ul>
  );
}

function BrokenList({ items, t }: { items: Audit["broken"]; t: T }) {
  if (!items.length) return <Empty text={t.empty.broken} />;
  return (
    <ul className="m-0 list-none p-0">
      {items.map((e) => (
        <li key={e.id} className={ROW}>
          <div className={ROW_MAIN}>
            <IdChip id={e.id} />
            <span className="truncate font-sans text-body-s text-accent-dark">{e.name}</span>
          </div>
          <code className={CODE}>{e.storage_path}</code>
        </li>
      ))}
    </ul>
  );
}

function MismatchedList({ items, t }: { items: Audit["mismatched"]; t: T }) {
  if (!items.length) return <Empty text={t.empty.mismatched} />;
  return (
    <ul className="m-0 list-none p-0">
      {items.map((e) => (
        <li key={e.id} className={ROW}>
          <div className={ROW_MAIN}>
            <IdChip id={e.id} />
            <span className="truncate font-sans text-body-s text-accent-dark">{e.name}</span>
          </div>
          <span className={MUTED}>{fmt(t.row.urlFolder, { id: e.url_exercise_id })}</span>
        </li>
      ))}
    </ul>
  );
}

function ExternalList({ items, t }: { items: Audit["external"]; t: T }) {
  if (!items.length) return <Empty text={t.empty.external} />;
  return (
    <ul className="m-0 list-none p-0">
      {items.map((e) => (
        <li key={e.id} className={ROW}>
          <div className={ROW_MAIN}>
            <IdChip id={e.id} />
            <span className="truncate font-sans text-body-s text-accent-dark">{e.name}</span>
          </div>
          <a
            href={e.video_url}
            target="_blank"
            rel="noreferrer"
            className="font-display label-xs uppercase text-glyph-gold underline-offset-2 hover:underline"
          >
            {t.row.open}
          </a>
        </li>
      ))}
    </ul>
  );
}

function DuplicatesList({ items, t }: { items: Audit["duplicates"]; t: T }) {
  if (!items.length) return <Empty text={t.empty.duplicates} />;
  return (
    <>
      <p className="border-b border-accent-dark/8 px-4 py-3 font-sans text-body-xs text-warm-shadow">
        {t.duplicates.explanation}
      </p>
      <ul className="m-0 list-none p-0">
        {items.map((d) => (
          <li key={d.exercise_id} className={`${ROW} flex-col items-start`}>
            <div className={ROW_MAIN}>
              <IdChip id={d.exercise_id} />
              <span className="font-sans text-body-s text-accent-dark">
                {fmt(t.duplicates.candidateCount, { count: d.objects })}
              </span>
            </div>
            <details className="mt-2 w-full">
              <summary className="cursor-pointer font-sans text-body-xs text-warm-shadow">
                {t.duplicates.showPaths}
              </summary>
              <ul className="m-0 mt-1 list-disc pl-6">
                {d.paths.map((p) => (
                  <li key={p}>
                    <code className="font-mono text-[11px] text-accent-dark/80">{p}</code>
                  </li>
                ))}
              </ul>
            </details>
          </li>
        ))}
      </ul>
    </>
  );
}

function OrphansList({
  items,
  busy,
  onDeleteAll,
  t,
}: {
  items: Audit["orphans"];
  busy: boolean;
  onDeleteAll: () => void;
  t: T;
}) {
  if (!items.length) return <Empty text={t.empty.orphans} />;
  const total = items.reduce((sum, o) => sum + (o.size_bytes ?? 0), 0);
  return (
    <>
      <div className="flex flex-wrap items-center justify-between gap-3 border-b border-accent-dark/8 px-4 py-3">
        <span className="font-display label-s text-accent-dark">
          {fmt(t.orphans.summary, { count: items.length, size: formatBytes(total) })}
        </span>
        <button
          type="button"
          onClick={onDeleteAll}
          disabled={busy}
          className="inline-flex min-h-[44px] items-center gap-2 rounded-full border border-error/40 bg-error/10 px-5 py-2 font-display label-s uppercase tracking-wide text-error transition-colors hover:bg-error hover:text-white disabled:opacity-60"
        >
          {busy ? t.orphans.deleting : t.orphans.deleteAll}
        </button>
      </div>
      <ul className="m-0 list-none p-0">
        {items.map((o) => (
          <li key={o.path} className={ROW}>
            <code className={CODE}>{o.path}</code>
            <span className={MUTED}>{formatBytes(o.size_bytes)}</span>
          </li>
        ))}
      </ul>
    </>
  );
}
