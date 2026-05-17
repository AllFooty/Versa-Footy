"use client";

import Link from "next/link";
import { useAuth } from "../../../_lib/auth/AuthProvider";
import { useAcademyDashboard } from "../../../_lib/academy/useAcademyDashboard";
import { Skeleton } from "../../../_components/primitives/Skeleton";
import type { ProductDict } from "../../../_dictionaries/product";
import type { Locale } from "../../../_dictionaries";
import { AcademyCharts } from "./AcademyCharts";

function formatNumber(n: number): string {
  if (n >= 1000) return `${(n / 1000).toFixed(1)}k`;
  return String(n);
}

type KpiProps = {
  label: string;
  value: string | number;
  accent: string;
  suffix?: string;
  loading?: boolean;
};

function KpiCard({ label, value, accent, suffix, loading }: KpiProps) {
  return (
    <div className="relative overflow-hidden rounded-2xl border border-accent-dark/10 bg-white p-5 shadow-[0_20px_50px_-35px_rgba(36,23,15,0.5)]">
      <span
        aria-hidden
        className="absolute inset-y-0 start-0 w-1.5 rounded-s-2xl"
        style={{ background: accent }}
      />
      <p className="font-display uppercase label-xs text-warm-shadow">{label}</p>
      <div className="mt-2 min-h-[36px] font-display text-[clamp(22px,2.5vw,30px)] font-black leading-none tracking-[-0.01em] text-accent-dark">
        {loading ? (
          <Skeleton className="h-7 w-20" />
        ) : (
          <>
            {value}
            {suffix ? (
              <span className="ms-1 align-baseline font-sans text-body-s font-normal text-accent-dark/60">
                {suffix}
              </span>
            ) : null}
          </>
        )}
      </div>
    </div>
  );
}

export function AcademyView({
  dict,
  lang,
}: {
  dict: ProductDict;
  lang: Locale;
}) {
  const t = dict.academy;
  const { activeOrg, organizations, setActiveOrg, orgsLoading } = useAuth();
  const { stats, weeklyActivity, loading, error, refresh } =
    useAcademyDashboard(activeOrg?.id);

  if (!orgsLoading && organizations.length === 0) {
    return (
      <div className="mx-auto w-full max-w-[640px] px-6 py-16 md:py-24 text-center">
        <p className="font-display uppercase label-xs text-glyph-gold/80">
          {t.eyebrow}
        </p>
        <h1 className="mt-3 font-display font-black uppercase leading-[1.05] tracking-[-0.015em] text-[clamp(28px,4vw,40px)] text-accent-dark">
          {t.noOrgTitle}
        </h1>
        <p className="mt-4 font-sans text-body-m text-accent-dark/70">
          {t.noOrgBody}
        </p>
        <div className="mt-8 flex flex-col items-center gap-3 sm:flex-row sm:justify-center">
          <Link
            href={`/${lang}/org/create`}
            className="inline-flex h-11 items-center rounded-full bg-glyph-gold px-6 font-display uppercase label-sm text-accent-dark transition-transform hover:-translate-y-0.5 focus:outline-none focus-visible:ring-2 focus-visible:ring-glyph-gold focus-visible:ring-offset-2 focus-visible:ring-offset-cream"
          >
            {t.createOrg}
          </Link>
          <Link
            href={`/${lang}/join`}
            className="font-sans text-body-s text-warm-shadow underline-offset-4 transition-colors hover:text-accent-dark hover:underline"
          >
            {t.joinOrg}
          </Link>
        </div>
      </div>
    );
  }

  const isLoading = loading && !stats;

  return (
    <div className="mx-auto w-full max-w-[1200px] px-6 py-12 md:px-10 md:py-16">
      <header className="flex flex-wrap items-end justify-between gap-4">
        <div className="min-w-0">
          <p className="font-display uppercase label-xs text-glyph-gold/80">
            {t.eyebrow}
          </p>
          <h1 className="mt-2 truncate font-display font-black uppercase leading-[1.02] tracking-[-0.015em] text-[clamp(28px,4.5vw,44px)] text-accent-dark">
            {activeOrg?.name || t.fallbackName}
          </h1>
          {activeOrg?.type ? (
            <p className="mt-1 font-sans text-body-s capitalize text-warm-shadow">
              {String(activeOrg.type)} {t.dashboardSuffix}
            </p>
          ) : null}
        </div>

        {organizations.length > 1 ? (
          <select
            aria-label={dict.shell.orgSwitcher.ariaLabel}
            value={activeOrg?.id ?? ""}
            onChange={(e) => {
              const next = organizations.find((o) => o.id === e.target.value);
              if (next) setActiveOrg(next);
            }}
            className="h-10 rounded-xl border border-accent-dark/15 bg-cream px-3 font-sans text-body-s text-accent-dark focus:border-glyph-gold focus:outline-none focus-visible:ring-2 focus-visible:ring-glyph-gold/40"
          >
            {organizations.map((o) => (
              <option key={o.id} value={o.id}>
                {o.name}
              </option>
            ))}
          </select>
        ) : null}
      </header>

      <div className="mt-6 flex flex-wrap gap-2">
        <Link
          href={`/${lang}/academy/invitations`}
          className="rounded-full border border-accent-dark/15 bg-white px-4 py-2 font-display uppercase label-xs text-accent-dark transition-colors hover:border-accent-dark/30"
        >
          {t.invitePlayers}
        </Link>
        <Link
          href={`/${lang}/academy/players`}
          className="rounded-full border border-accent-dark/15 bg-white px-4 py-2 font-display uppercase label-xs text-accent-dark transition-colors hover:border-accent-dark/30"
        >
          {t.viewAllPlayers}
        </Link>
        <Link
          href={`/${lang}/academy/teams`}
          className="rounded-full border border-accent-dark/15 bg-white px-4 py-2 font-display uppercase label-xs text-accent-dark transition-colors hover:border-accent-dark/30"
        >
          {t.manageTeams}
        </Link>
        <Link
          href={`/${lang}/academy/settings`}
          className="rounded-full border border-accent-dark/15 bg-white px-4 py-2 font-display uppercase label-xs text-accent-dark transition-colors hover:border-accent-dark/30"
        >
          {t.academySettings}
        </Link>
      </div>

      {error ? (
        <div className="mt-10 rounded-2xl border border-error/30 bg-error/5 p-6">
          <p className="font-sans text-body-m text-error">{t.loadError}</p>
          <p className="mt-1 font-sans text-body-s text-error/80">{error}</p>
          <button
            type="button"
            onClick={refresh}
            className="mt-4 inline-flex h-9 items-center rounded-full bg-error px-4 font-display uppercase label-xs text-cream transition-transform hover:-translate-y-0.5"
          >
            {t.retry}
          </button>
        </div>
      ) : (
        <>
          <section className="mt-10 grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-6">
            <KpiCard
              label={t.kpis.totalPlayers}
              value={stats?.total_players ?? 0}
              accent="var(--color-deep-teal)"
              loading={isLoading}
            />
            <KpiCard
              label={t.kpis.activeThisWeek}
              value={stats?.active_this_week ?? 0}
              suffix={stats?.total_players ? `/ ${stats.total_players}` : undefined}
              accent="var(--color-success)"
              loading={isLoading}
            />
            <KpiCard
              label={t.kpis.skillsMastered}
              value={stats?.total_skills_mastered ?? 0}
              accent="var(--color-shadow-plumage)"
              loading={isLoading}
            />
            <KpiCard
              label={t.kpis.avgLevel}
              value={stats?.avg_player_level ?? 0}
              accent="var(--color-glyph-gold)"
              loading={isLoading}
            />
            <KpiCard
              label={t.kpis.weeklyXp}
              value={formatNumber(stats?.total_xp_this_week ?? 0)}
              accent="var(--color-deep-teal)"
              loading={isLoading}
            />
            <KpiCard
              label={t.kpis.avgStreak}
              value={`${stats?.avg_streak ?? 0}d`}
              accent="var(--color-burgundy)"
              loading={isLoading}
            />
          </section>

          <AcademyCharts
            data={weeklyActivity}
            loading={isLoading}
            labels={{
              weeklyActivePlayers: t.charts.weeklyActivePlayers,
              weeklyXpEarned: t.charts.weeklyXpEarned,
              activePlayers: t.charts.activePlayers,
              xp: t.charts.xp,
            }}
          />
        </>
      )}
    </div>
  );
}
