"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { useAuth } from "../../../_lib/auth/AuthProvider";
import { supabase } from "../../../_lib/supabase";
import { useAcademyDashboard } from "../../../_lib/academy/useAcademyDashboard";
import { Skeleton } from "../../../_components/primitives/Skeleton";
import type { ProductDict } from "../../../_dictionaries/product";
import type { Locale } from "../../../_dictionaries";

function fmt(template: string, vars: Record<string, string | number>) {
  return template.replace(/\{\{(\w+)\}\}/g, (_, k) => String(vars[k] ?? ""));
}

function usePendingInvitations(email: string | undefined) {
  const [count, setCount] = useState<number | null>(null);
  useEffect(() => {
    if (!email) {
      setCount(0);
      return;
    }
    let cancelled = false;
    (async () => {
      const { count: c, error } = await supabase
        .from("invitations")
        .select("id", { count: "exact", head: true })
        .eq("email", email)
        .eq("status", "pending");
      if (cancelled) return;
      setCount(error ? 0 : c ?? 0);
    })();
    return () => {
      cancelled = true;
    };
  }, [email]);
  return count;
}

type StatProps = {
  label: string;
  value: string | number;
  accent: string;
  loading?: boolean;
};

function Stat({ label, value, accent, loading }: StatProps) {
  return (
    <div className="rounded-2xl border border-accent-dark/10 bg-white p-5 shadow-[0_20px_50px_-35px_rgba(36,23,15,0.5)]">
      <div className="flex items-start justify-between">
        <p className="font-display uppercase label-xs text-warm-shadow">{label}</p>
        <span
          aria-hidden
          className="block h-2 w-2 rounded-full"
          style={{ background: accent }}
        />
      </div>
      <div className="mt-3 min-h-[36px] font-display text-[clamp(24px,3vw,32px)] font-black leading-none tracking-[-0.01em] text-accent-dark">
        {loading ? <Skeleton className="h-7 w-24" /> : value}
      </div>
    </div>
  );
}

type ActionProps = {
  href: string;
  title: string;
  description: string;
  accent: string;
  primary?: boolean;
};

function ActionCard({ href, title, description, accent, primary }: ActionProps) {
  return (
    <Link
      href={href}
      className={`group flex flex-col gap-2 rounded-2xl border p-5 transition-all duration-fast hover:-translate-y-0.5 focus:outline-none focus-visible:ring-2 focus-visible:ring-glyph-gold ${
        primary
          ? "border-glyph-gold/40 bg-glyph-gold/10 hover:border-glyph-gold/80"
          : "border-accent-dark/10 bg-white hover:border-accent-dark/25"
      }`}
    >
      <div className="flex items-center justify-between">
        <span
          aria-hidden
          className="inline-block h-2 w-2 rounded-full"
          style={{ background: accent }}
        />
        <span
          aria-hidden
          className="font-display text-cream/30 transition-transform group-hover:translate-x-0.5 rtl:group-hover:-translate-x-0.5"
        >
          →
        </span>
      </div>
      <h3 className="font-display uppercase label-md font-bold text-accent-dark">
        {title}
      </h3>
      <p className="font-sans text-body-s leading-relaxed text-accent-dark/70">
        {description}
      </p>
    </Link>
  );
}

export function HomeView({ dict, lang }: { dict: ProductDict; lang: Locale }) {
  const t = dict.home;
  const { user, profile, organizations, activeOrg, orgsLoading, isAdmin, isCoach } =
    useAuth();
  const pending = usePendingInvitations(user?.email);
  const { stats: academyStats, loading: academyLoading } = useAcademyDashboard(
    activeOrg?.id,
  );

  const firstName = profile?.full_name?.split(" ")[0];
  const greeting = firstName
    ? fmt(t.welcomeBack, { firstName })
    : t.welcomeGeneric;
  const hasOrgs = !orgsLoading && organizations.length > 0;
  const noOrgs = !orgsLoading && organizations.length === 0;

  return (
    <div className="mx-auto w-full max-w-[1200px] px-6 py-12 md:px-10 md:py-16">
      <header>
        <p className="font-display uppercase label-xs text-glyph-gold/80">
          {t.eyebrow}
        </p>
        <h1 className="mt-2 font-display font-black uppercase leading-[1.02] tracking-[-0.015em] text-[clamp(32px,5vw,52px)] text-accent-dark">
          {greeting}
        </h1>
        <p className="mt-3 max-w-2xl font-sans text-body-m text-accent-dark/70">
          {hasOrgs ? t.subtitle : t.whereToGo}
        </p>
      </header>

      {noOrgs && (
        <section className="mt-8 flex flex-col gap-4 rounded-2xl border border-glyph-gold/30 bg-glyph-gold/10 p-6 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <h2 className="font-display uppercase label-md font-bold text-accent-dark">
              {t.noOrgsTitle}
            </h2>
            <p className="mt-1 font-sans text-body-s text-accent-dark/70">
              {t.noOrgsDescription}
            </p>
          </div>
          <div className="flex flex-wrap items-center gap-3">
            <Link
              href={`/${lang}/org/create`}
              className="inline-flex h-10 items-center rounded-full bg-glyph-gold px-5 font-display uppercase label-sm text-accent-dark transition-transform hover:-translate-y-0.5 focus:outline-none focus-visible:ring-2 focus-visible:ring-glyph-gold focus-visible:ring-offset-2 focus-visible:ring-offset-cream"
            >
              {t.createCta}
            </Link>
            <Link
              href={`/${lang}/join`}
              className="font-sans text-body-s text-accent-dark/70 underline-offset-4 transition-colors hover:text-accent-dark hover:underline"
            >
              {t.haveInviteCode}
            </Link>
          </div>
        </section>
      )}

      <section className="mt-10 grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
        <Stat
          label={t.stats.myAcademies}
          value={organizations.length}
          accent="var(--color-deep-teal)"
          loading={orgsLoading}
        />
        {activeOrg && (
          <Stat
            label={t.stats.activeAcademy}
            value={activeOrg.name}
            accent="var(--color-glyph-gold)"
            loading={orgsLoading}
          />
        )}
        {activeOrg && isCoach && (
          <Stat
            label={t.stats.players}
            value={academyStats?.total_players ?? 0}
            accent="var(--color-deep-teal)"
            loading={academyLoading && !academyStats}
          />
        )}
        {(pending === null || pending > 0) && (
          <Stat
            label={t.stats.pendingInvitations}
            value={pending ?? 0}
            accent="var(--color-burgundy)"
            loading={pending === null}
          />
        )}
      </section>

      <section className="mt-12">
        <h2 className="font-display uppercase label-sm text-warm-shadow">
          {t.quickActions}
        </h2>
        <div className="mt-4 grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {hasOrgs && isCoach && (
            <ActionCard
              href={`/${lang}/academy`}
              title={t.actions.academy.title}
              description={t.actions.academy.description}
              accent="var(--color-deep-teal)"
              primary
            />
          )}
          {!hasOrgs && (
            <ActionCard
              href={`/${lang}/org/create`}
              title={t.actions.createAcademy.title}
              description={t.actions.createAcademy.description}
              accent="var(--color-deep-teal)"
              primary
            />
          )}
          {isAdmin && (
            <ActionCard
              href={`/${lang}/library`}
              title={t.actions.library.title}
              description={t.actions.library.description}
              accent="var(--color-glyph-gold)"
            />
          )}
          {isAdmin && (
            <ActionCard
              href={`/${lang}/videos-audit`}
              title={t.actions.videosAudit.title}
              description={t.actions.videosAudit.description}
              accent="var(--color-shadow-plumage)"
            />
          )}
          <ActionCard
            href={`/${lang}/settings`}
            title={t.actions.account.title}
            description={t.actions.account.description}
            accent="var(--color-burgundy)"
          />
        </div>
      </section>
    </div>
  );
}
