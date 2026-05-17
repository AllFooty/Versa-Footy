"use client";

import Link from "next/link";
import { useAuth } from "../../../../_lib/auth/AuthProvider";
import {
  usePlayerRoster,
  getPlayerStatus,
  type Player,
  type PlayerStatus,
} from "../../../../_lib/academy/usePlayerRoster";
import { AGE_GROUPS } from "../../../../_lib/academy/constants";
import { Input } from "../../../../_components/primitives/Input";
import { Select } from "../../../../_components/primitives/Select";
import { Skeleton } from "../../../../_components/primitives/Skeleton";
import type { ProductDict } from "../../../../_dictionaries/product";
import type { Locale } from "../../../../_dictionaries";

type T = ProductDict["roster"];

type SortField =
  | "display_name"
  | "age_group"
  | "current_level"
  | "total_xp"
  | "xp_this_week"
  | "skills_mastered"
  | "current_streak"
  | "avg_self_rating"
  | "last_practice_date";

function fmt(template: string, vars: Record<string, string | number>) {
  return template.replace(/\{\{(\w+)\}\}/g, (_, k) => String(vars[k] ?? ""));
}

function formatRelative(dateStr: string | null, t: T, lang: Locale): string {
  if (!dateStr) return t.never;
  const days = Math.floor(
    (Date.now() - new Date(dateStr).getTime()) / 86_400_000,
  );
  if (days <= 0) return t.today;
  if (days === 1) return t.yesterday;
  if (days < 7)
    return days === 1 ? t.daysAgoOne : fmt(t.daysAgoOther, { days });
  return new Date(dateStr).toLocaleDateString(lang);
}

function initial(name: string | null): string {
  if (!name) return "?";
  return name.trim().charAt(0).toUpperCase() || "?";
}

function StatusBadge({ status, t }: { status: PlayerStatus; t: T }) {
  const label =
    status === "active" ? t.active : status === "idle" ? t.idle : t.inactive;
  const tone =
    status === "active"
      ? "bg-success/15 text-success"
      : status === "idle"
        ? "bg-glyph-gold/20 text-accent-dark"
        : "bg-error/15 text-error";
  return (
    <span
      className={`inline-flex items-center rounded-full px-2.5 py-0.5 font-display uppercase label-xs ${tone}`}
    >
      {label}
    </span>
  );
}

const COLUMNS: { key: SortField; labelKey: keyof T }[] = [
  { key: "display_name", labelKey: "columnPlayer" },
  { key: "age_group", labelKey: "columnAge" },
  { key: "current_level", labelKey: "columnLevel" },
  { key: "total_xp", labelKey: "columnXP" },
  { key: "xp_this_week", labelKey: "columnWeekXP" },
  { key: "skills_mastered", labelKey: "columnMastered" },
  { key: "current_streak", labelKey: "columnStreak" },
  { key: "avg_self_rating", labelKey: "columnAvgRating" },
  { key: "last_practice_date", labelKey: "columnLastActive" },
];

export function PlayerRosterView({
  dict,
  lang,
}: {
  dict: ProductDict;
  lang: Locale;
}) {
  const t = dict.roster;
  const { activeOrg } = useAuth();
  const {
    players,
    loading,
    sortField,
    sortDir,
    toggleSort,
    search,
    setSearch,
    filterAgeGroup,
    setFilterAgeGroup,
    filterStatus,
    setFilterStatus,
  } = usePlayerRoster(activeOrg?.id);

  return (
    <div className="mx-auto w-full max-w-[1200px] px-6 py-12 md:px-10 md:py-16">
      <Link
        href={`/${lang}/academy`}
        className="inline-flex items-center gap-2 font-sans text-body-s text-warm-shadow transition-colors hover:text-accent-dark"
      >
        <span aria-hidden className="rtl:rotate-180">
          ←
        </span>
        {t.backToDashboard}
      </Link>

      <header className="mt-6">
        <p className="font-display uppercase label-xs text-glyph-gold/80">
          {t.eyebrow}
        </p>
        <h1 className="mt-2 font-display font-black uppercase leading-[1.02] tracking-[-0.015em] text-[clamp(28px,4.5vw,44px)] text-accent-dark">
          {t.title}
        </h1>
        <p className="mt-2 font-sans text-body-s text-warm-shadow">
          {players.length === 1
            ? t.playerCountOne
            : fmt(t.playerCountOther, { count: players.length })}
        </p>
      </header>

      <div className="mt-6 flex flex-wrap gap-3">
        <div className="min-w-[220px] flex-1">
          <Input
            type="text"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder={t.searchPlaceholder}
            aria-label={t.searchPlaceholder}
          />
        </div>
        <div className="w-[160px]">
          <Select
            value={filterAgeGroup}
            onChange={(e) => setFilterAgeGroup(e.target.value)}
            aria-label={t.allAges}
          >
            <option value="">{t.allAges}</option>
            {AGE_GROUPS.map((ag) => (
              <option key={ag} value={ag}>
                {ag}
              </option>
            ))}
          </Select>
        </div>
        <div className="w-[160px]">
          <Select
            value={filterStatus}
            onChange={(e) =>
              setFilterStatus(e.target.value as PlayerStatus | "")
            }
            aria-label={t.allStatus}
          >
            <option value="">{t.allStatus}</option>
            <option value="active">{t.active}</option>
            <option value="idle">{t.idle}</option>
            <option value="inactive">{t.inactive}</option>
          </Select>
        </div>
      </div>

      <div className="mt-6 rounded-3xl border border-accent-dark/10 bg-white">
        {loading && players.length === 0 ? (
          <div className="flex flex-col gap-2 p-5">
            <Skeleton className="h-10 w-full" />
            <Skeleton className="h-10 w-full" />
            <Skeleton className="h-10 w-full" />
            <Skeleton className="h-10 w-full" />
            <Skeleton className="h-10 w-full" />
          </div>
        ) : players.length === 0 ? (
          <div className="px-6 py-12 text-center">
            <p className="font-sans text-body-m text-accent-dark/70">
              {t.noPlayersFound}
            </p>
            <Link
              href={`/${lang}/academy/invitations`}
              className="mt-3 inline-block font-sans text-body-s text-warm-shadow underline-offset-4 transition-colors hover:text-accent-dark hover:underline"
            >
              {t.invitePlayers}
            </Link>
          </div>
        ) : (
          <>
            <div className="hidden overflow-x-auto md:block">
              <table className="w-full border-collapse font-sans text-body-s">
                <thead>
                  <tr>
                    {COLUMNS.map((col) => {
                      const isSorted = sortField === col.key;
                      return (
                        <th
                          key={col.key}
                          scope="col"
                          aria-sort={
                            isSorted
                              ? sortDir === "asc"
                                ? "ascending"
                                : "descending"
                              : "none"
                          }
                          className="border-b border-accent-dark/10 p-0 text-start"
                        >
                          <button
                            type="button"
                            onClick={() =>
                              toggleSort(col.key as Parameters<typeof toggleSort>[0])
                            }
                            className="flex w-full items-center gap-1 px-3 py-3 text-start font-display uppercase label-xs text-warm-shadow transition-colors hover:text-accent-dark"
                          >
                            {t[col.labelKey] as string}
                            {isSorted ? (
                              <span aria-hidden>
                                {sortDir === "asc" ? "↑" : "↓"}
                              </span>
                            ) : null}
                          </button>
                        </th>
                      );
                    })}
                    <th className="border-b border-accent-dark/10 px-3 py-3 text-start font-display uppercase label-xs text-warm-shadow">
                      {t.columnStatus}
                    </th>
                  </tr>
                </thead>
                <tbody>
                  {players.map((p) => (
                    <PlayerRow
                      key={p.player_id}
                      player={p}
                      t={t}
                      lang={lang}
                    />
                  ))}
                </tbody>
              </table>
            </div>

            <ul className="flex flex-col gap-2 p-3 md:hidden">
              {players.map((p) => (
                <PlayerCard
                  key={p.player_id}
                  player={p}
                  t={t}
                  lang={lang}
                />
              ))}
            </ul>
          </>
        )}
      </div>
    </div>
  );
}

function PlayerRow({
  player,
  t,
  lang,
}: {
  player: Player;
  t: T;
  lang: Locale;
}) {
  const status = getPlayerStatus(player);
  return (
    <tr className="border-b border-accent-dark/5 transition-colors hover:bg-warm-shadow/5">
      <td className="whitespace-nowrap p-3">
        <Link
          href={`/${lang}/academy/players/detail?id=${player.player_id}`}
          className="inline-flex items-center gap-2 font-display uppercase label-sm font-bold text-accent-dark transition-colors hover:text-deep-teal"
        >
          <span className="grid h-7 w-7 shrink-0 place-items-center rounded-full bg-glyph-gold/25 font-display text-[12px] font-bold text-accent-dark">
            {initial(player.display_name)}
          </span>
          {player.display_name || t.unknown}
        </Link>
      </td>
      <td className="whitespace-nowrap p-3 text-accent-dark/80">
        {player.age_group || "—"}
      </td>
      <td className="whitespace-nowrap p-3 text-accent-dark/80">
        {player.current_level}
      </td>
      <td className="whitespace-nowrap p-3 text-accent-dark/80">
        {(player.total_xp ?? 0).toLocaleString(lang)}
      </td>
      <td className="whitespace-nowrap p-3 text-accent-dark/80">
        {(player.xp_this_week ?? 0).toLocaleString(lang)}
      </td>
      <td className="whitespace-nowrap p-3 text-accent-dark/80">
        {player.skills_mastered ?? 0}
      </td>
      <td className="whitespace-nowrap p-3 text-accent-dark/80">
        {player.current_streak > 0 ? `${player.current_streak}d` : "—"}
      </td>
      <td className="whitespace-nowrap p-3 text-accent-dark/80">
        {player.avg_self_rating > 0 ? `${player.avg_self_rating}★` : "—"}
      </td>
      <td className="whitespace-nowrap p-3 text-accent-dark/80">
        {formatRelative(player.last_practice_date, t, lang)}
      </td>
      <td className="whitespace-nowrap p-3">
        <StatusBadge status={status} t={t} />
      </td>
    </tr>
  );
}

function PlayerCard({
  player,
  t,
  lang,
}: {
  player: Player;
  t: T;
  lang: Locale;
}) {
  const status = getPlayerStatus(player);
  return (
    <li>
      <Link
        href={`/${lang}/academy/players/detail?id=${player.player_id}`}
        className="flex flex-col gap-3 rounded-2xl border border-accent-dark/10 bg-white p-4 transition-colors hover:border-accent-dark/25"
      >
        <div className="flex items-center gap-3">
          <span className="grid h-10 w-10 shrink-0 place-items-center rounded-full bg-glyph-gold/25 font-display label-sm font-bold text-accent-dark">
            {initial(player.display_name)}
          </span>
          <div className="min-w-0 flex-1">
            <p className="truncate font-display uppercase label-sm font-bold text-accent-dark">
              {player.display_name || t.unknown}
            </p>
            <p className="truncate font-sans text-body-xs text-warm-shadow">
              {player.age_group || "—"} · L{player.current_level}
            </p>
          </div>
          <StatusBadge status={status} t={t} />
        </div>
        <div className="grid grid-cols-3 gap-2 border-t border-accent-dark/5 pt-3">
          <Stat label={t.columnXP} value={(player.total_xp ?? 0).toLocaleString(lang)} />
          <Stat
            label={t.columnStreak}
            value={player.current_streak > 0 ? `${player.current_streak}d` : "—"}
          />
          <Stat
            label={t.columnMastered}
            value={String(player.skills_mastered ?? 0)}
          />
        </div>
      </Link>
    </li>
  );
}

function Stat({ label, value }: { label: string; value: string }) {
  return (
    <div>
      <p className="font-display uppercase label-xs text-warm-shadow">{label}</p>
      <p className="mt-0.5 font-display label-sm font-bold text-accent-dark">
        {value}
      </p>
    </div>
  );
}
