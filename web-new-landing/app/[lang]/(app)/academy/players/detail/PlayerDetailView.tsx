"use client";

import Link from "next/link";
import { useSearchParams } from "next/navigation";
import { useRef, useState } from "react";
import {
  usePlayerDetail,
  type CategoryRadarPoint,
  type DailyActivity,
  type LevelProgress,
  type PlayerProfile,
  type Roadmap,
  type RoadmapSkill,
  type TrainingSession,
  type WeeklyTrendPoint,
} from "../../../../../_lib/academy/usePlayerDetail";
import { Skeleton } from "../../../../../_components/primitives/Skeleton";
import type { ProductDict } from "../../../../../_dictionaries/product";
import type { Locale } from "../../../../../_dictionaries";
import { PlayerCharts } from "./PlayerCharts";

type T = ProductDict["playerDetail"];

function fmt(template: string, vars: Record<string, string | number>) {
  return template.replace(/\{\{(\w+)\}\}/g, (_, k) => String(vars[k] ?? ""));
}

function initial(name: string | null): string {
  if (!name) return "?";
  return name.trim().charAt(0).toUpperCase() || "?";
}

function roadmapColor(percent: number): string {
  if (percent >= 80) return "var(--color-success)";
  if (percent >= 50) return "var(--color-deep-teal)";
  if (percent >= 25) return "var(--color-glyph-gold)";
  return "var(--color-error)";
}

export function PlayerDetailView({
  dict,
  lang,
}: {
  dict: ProductDict;
  lang: Locale;
}) {
  const t = dict.playerDetail;
  const search = useSearchParams();
  const playerId = (search?.get("id") ?? "").trim();
  const {
    profile,
    skillProgress,
    dailyActivity,
    recentSessions,
    levelProgress,
    categoryRadar,
    weeklyTrends,
    roadmap,
    loading,
    error,
    sectionErrors,
  } = usePlayerDetail(playerId || undefined);

  const [activeTab, setActiveTab] = useState(0);
  const [roadmapFilter, setRoadmapFilter] = useState("all");

  const backLink = (
    <Link
      href={`/${lang}/academy/players`}
      className="inline-flex items-center gap-2 font-sans text-body-s text-warm-shadow transition-colors hover:text-accent-dark"
    >
      <span aria-hidden className="rtl:rotate-180">
        ←
      </span>
      {t.backToRoster}
    </Link>
  );

  if (loading) {
    return (
      <div className="mx-auto w-full max-w-[1100px] px-6 py-12 md:px-10 md:py-16">
        {backLink}
        <div className="mt-6 flex items-center gap-4">
          <Skeleton className="h-14 w-14 rounded-full" />
          <div className="flex-1">
            <Skeleton className="h-8 w-64" />
            <Skeleton className="mt-2 h-4 w-48" />
          </div>
        </div>
        <div className="mt-6 grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-6">
          {Array.from({ length: 6 }).map((_, i) => (
            <Skeleton key={i} className="h-20 w-full" />
          ))}
        </div>
      </div>
    );
  }

  if (error || !profile) {
    return (
      <div className="mx-auto w-full max-w-[640px] px-6 py-16 text-center">
        {backLink}
        <p className="mt-8 font-sans text-body-m text-error">
          {error || t.notFound}
        </p>
      </div>
    );
  }

  const displayName =
    profile.display_name ||
    profile.profiles?.full_name ||
    dict.roster.unknown;
  const skillsMastered = skillProgress.filter(
    (s) => s.status === "mastered",
  ).length;
  const skillsPracticed = skillProgress.filter(
    (s) => (s.times_practiced ?? 0) > 0,
  ).length;

  const tabs = [t.tabOverview, t.tabRoadmap, t.tabHistory, t.tabTrends];

  return (
    <div className="mx-auto w-full max-w-[1100px] px-6 py-12 md:px-10 md:py-16">
      {backLink}

      <header className="mt-6 flex items-center gap-4">
        <div className="grid h-14 w-14 shrink-0 place-items-center rounded-full bg-glyph-gold/25 font-display text-[22px] font-black text-accent-dark">
          {initial(displayName)}
        </div>
        <div className="min-w-0">
          <h1 className="truncate font-display font-black uppercase leading-[1.05] tracking-[-0.015em] text-[clamp(24px,3.5vw,36px)] text-accent-dark">
            {displayName}
          </h1>
          <p className="mt-1 font-sans text-body-s text-warm-shadow">
            {profile.age_group || t.noAgeGroup} · {t.levelLabel}{" "}
            {profile.current_level} ·{" "}
            {(profile.total_xp ?? 0).toLocaleString(lang)} {t.xpSuffix}
          </p>
        </div>
      </header>

      <section className="mt-6 grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-6">
        <MiniKpi label={t.kpiLevel} value={profile.current_level} />
        <MiniKpi
          label={t.kpiTotalXP}
          value={(profile.total_xp ?? 0).toLocaleString(lang)}
        />
        <MiniKpi
          label={t.kpiStreak}
          value={profile.current_streak > 0 ? `${profile.current_streak}d` : "—"}
        />
        <MiniKpi
          label={t.kpiBestStreak}
          value={profile.longest_streak > 0 ? `${profile.longest_streak}d` : "—"}
        />
        <MiniKpi label={t.kpiMastered} value={skillsMastered} />
        <MiniKpi label={t.kpiPracticed} value={skillsPracticed} />
      </section>

      <LevelProgressBar level={levelProgress} t={t} lang={lang} />

      <Tabs
        tabs={tabs}
        active={activeTab}
        onSelect={setActiveTab}
        label={t.tabsLabel}
      />

      <div
        id={`player-tabpanel-${activeTab}`}
        role="tabpanel"
        aria-labelledby={`player-tab-${activeTab}`}
        className="mt-6"
      >
        {activeTab === 0 ? (
          <OverviewTab
            categoryRadar={categoryRadar}
            dailyActivity={dailyActivity}
            t={t}
            skillsError={sectionErrors.skillProgress}
            activityError={sectionErrors.dailyActivity}
          />
        ) : activeTab === 1 ? (
          <RoadmapTab
            roadmap={roadmap}
            filter={roadmapFilter}
            setFilter={setRoadmapFilter}
            t={t}
            errorMessage={sectionErrors.allSkills || sectionErrors.skillProgress}
          />
        ) : activeTab === 2 ? (
          <HistoryTab
            sessions={recentSessions}
            t={t}
            lang={lang}
            errorMessage={sectionErrors.recentSessions}
          />
        ) : (
          <TrendsTab
            weeklyTrends={weeklyTrends}
            t={t}
            errorMessage={sectionErrors.dailyActivity}
          />
        )}
      </div>
    </div>
  );
}

function MiniKpi({ label, value }: { label: string; value: string | number }) {
  return (
    <div className="rounded-2xl border border-accent-dark/10 bg-white p-4 text-center">
      <p className="font-display label-md font-black text-accent-dark">
        {value}
      </p>
      <p className="mt-1 font-display uppercase label-xs text-warm-shadow">
        {label}
      </p>
    </div>
  );
}

function LevelProgressBar({
  level,
  t,
  lang,
}: {
  level: LevelProgress;
  t: T;
  lang: Locale;
}) {
  if (!level) return null;
  const inLevel = Math.max(0, level.xp_in_current_level ?? 0);
  const required = Math.max(1, level.xp_required_for_next_level ?? 1);
  const pct = Math.min(100, Math.round((inLevel / required) * 100));
  const nextLevel = (level.current_level ?? 0) + 1;
  return (
    <div className="mt-4 rounded-2xl border border-accent-dark/10 bg-white p-4">
      <div className="flex items-center justify-between font-sans text-body-xs text-warm-shadow">
        <span>
          {fmt(t.levelProgressLabel, {
            inLevel: inLevel.toLocaleString(lang),
            required: required.toLocaleString(lang),
            nextLevel,
          })}
        </span>
        <span className="font-display label-xs font-bold text-accent-dark">
          {pct}%
        </span>
      </div>
      <div className="mt-2 h-1.5 overflow-hidden rounded-full bg-accent-dark/10">
        <div
          className="h-full rounded-full bg-gradient-to-r from-deep-teal to-glyph-gold transition-all duration-500"
          style={{ width: `${pct}%` }}
        />
      </div>
    </div>
  );
}

function Tabs({
  tabs,
  active,
  onSelect,
  label,
}: {
  tabs: string[];
  active: number;
  onSelect: (i: number) => void;
  label: string;
}) {
  const refs = useRef<(HTMLButtonElement | null)[]>([]);

  const focusTab = (i: number) => {
    onSelect(i);
    refs.current[i]?.focus();
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    const last = tabs.length - 1;
    switch (e.key) {
      case "ArrowRight":
      case "ArrowDown":
        e.preventDefault();
        focusTab(active === last ? 0 : active + 1);
        break;
      case "ArrowLeft":
      case "ArrowUp":
        e.preventDefault();
        focusTab(active === 0 ? last : active - 1);
        break;
      case "Home":
        e.preventDefault();
        focusTab(0);
        break;
      case "End":
        e.preventDefault();
        focusTab(last);
        break;
      default:
    }
  };

  return (
    <div
      role="tablist"
      aria-label={label}
      onKeyDown={handleKeyDown}
      className="mt-8 inline-flex gap-1 rounded-full bg-warm-shadow/10 p-1"
    >
      {tabs.map((tab, i) => {
        const selected = active === i;
        return (
          <button
            key={tab}
            ref={(el) => {
              refs.current[i] = el;
            }}
            id={`player-tab-${i}`}
            role="tab"
            aria-selected={selected}
            aria-controls={`player-tabpanel-${i}`}
            tabIndex={selected ? 0 : -1}
            onClick={() => onSelect(i)}
            className={`inline-flex items-center rounded-full px-4 py-1.5 font-display uppercase label-xs transition-colors ${
              selected
                ? "bg-white text-accent-dark shadow-[0_4px_18px_-10px_rgba(36,23,15,0.5)]"
                : "text-warm-shadow hover:text-accent-dark"
            }`}
          >
            {tab}
          </button>
        );
      })}
    </div>
  );
}

function SectionError({ t }: { t: T }) {
  return (
    <div className="rounded-2xl border border-error/30 bg-error/5 p-5 text-center font-sans text-body-s text-error">
      {t.sectionLoadError}
    </div>
  );
}

function EmptyState({ children }: { children: React.ReactNode }) {
  return (
    <p className="rounded-2xl border border-accent-dark/10 bg-white p-8 text-center font-sans text-body-m text-accent-dark/70">
      {children}
    </p>
  );
}

function OverviewTab({
  categoryRadar,
  dailyActivity,
  t,
  skillsError,
  activityError,
}: {
  categoryRadar: CategoryRadarPoint[];
  dailyActivity: DailyActivity[];
  t: T;
  skillsError: string | null;
  activityError: string | null;
}) {
  return (
    <div className="grid grid-cols-1 gap-4 lg:grid-cols-2">
      <div className="rounded-2xl border border-accent-dark/10 bg-white p-5">
        <h3 className="font-display uppercase label-sm text-warm-shadow">
          {t.chartSkillMastery}
        </h3>
        {skillsError ? (
          <div className="mt-4">
            <SectionError t={t} />
          </div>
        ) : (
          <PlayerCharts.RadarChart data={categoryRadar} emptyLabel={t.noSkillMasteryYet} />
        )}
      </div>
      <div className="rounded-2xl border border-accent-dark/10 bg-white p-5">
        <h3 className="font-display uppercase label-sm text-warm-shadow">
          {t.chartRecentActivity}
        </h3>
        {activityError ? (
          <div className="mt-4">
            <SectionError t={t} />
          </div>
        ) : (
          <PlayerCharts.ActivityBars data={dailyActivity.slice(-90)} xpLabel={t.xpSuffix} emptyLabel={t.noActivityData} />
        )}
      </div>
    </div>
  );
}

function RoadmapTab({
  roadmap,
  filter,
  setFilter,
  t,
  errorMessage,
}: {
  roadmap: Roadmap;
  filter: string;
  setFilter: (s: string) => void;
  t: T;
  errorMessage: string | null;
}) {
  if (errorMessage) return <SectionError t={t} />;
  if (roadmap.missingAgeGroup)
    return <EmptyState>{t.roadmapNoAgeGroup}</EmptyState>;
  if (roadmap.totalSkillsToMaster === 0)
    return <EmptyState>{t.noSkillData}</EmptyState>;

  const accent = roadmapColor(roadmap.progressPercent);

  return (
    <div>
      <div className="rounded-3xl border border-accent-dark/10 bg-white p-6">
        <div className="flex flex-wrap items-start justify-between gap-3">
          <div>
            <h3 className="font-display uppercase label-md font-bold text-accent-dark">
              {fmt(t.roadmapTitle, {
                ageGroup: roadmap.playerAgeGroup ?? "",
              })}
            </h3>
            <p className="mt-1 font-sans text-body-s text-warm-shadow">
              {fmt(t.roadmapProgress, {
                mastered: roadmap.masteredCount,
                total: roadmap.totalSkillsToMaster,
              })}
            </p>
          </div>
          <span
            className="font-display text-[32px] font-black leading-none"
            style={{ color: accent }}
          >
            {roadmap.progressPercent}%
          </span>
        </div>
        <div className="mt-3 h-2 overflow-hidden rounded-full bg-accent-dark/10">
          <div
            className="h-full rounded-full transition-all duration-500"
            style={{
              width: `${roadmap.progressPercent}%`,
              background: accent,
            }}
          />
        </div>
        <div className="mt-4 flex flex-wrap gap-2">
          {roadmap.categorySummary.map((cat) => (
            <span
              key={cat.name}
              className="inline-flex items-center gap-1.5 rounded-full bg-warm-shadow/5 px-3 py-1 font-sans text-body-xs text-accent-dark/80"
            >
              {cat.icon ? <span aria-hidden>{cat.icon}</span> : null}
              <span>{cat.name}</span>
              <span
                className={`font-display label-xs font-bold ${cat.mastered === cat.total ? "text-success" : "text-accent-dark"}`}
              >
                {cat.mastered}/{cat.total}
              </span>
            </span>
          ))}
        </div>
      </div>

      <div className="mt-5 flex flex-wrap gap-2">
        <FilterChip active={filter === "all"} onClick={() => setFilter("all")}>
          {t.roadmapAll}
        </FilterChip>
        {roadmap.categorySummary.map((cat) => (
          <FilterChip
            key={cat.name}
            active={filter === cat.name}
            onClick={() => setFilter(cat.name)}
          >
            {cat.icon ? <span aria-hidden>{cat.icon} </span> : null}
            {cat.name}
          </FilterChip>
        ))}
      </div>

      <div className="mt-6 flex flex-col gap-6">
        {roadmap.skillsByAge.map((group) => {
          const visible =
            filter === "all"
              ? group.skills
              : group.skills.filter((s) => s.category === filter);
          if (visible.length === 0) return null;
          const mastered = visible.filter((s) => s.isMastered).length;
          const total = visible.length;
          const allMastered = mastered === total;
          return (
            <div key={group.ageGroup}>
              <div className="mb-3 flex flex-wrap items-center justify-between gap-2">
                <div className="flex items-center gap-2">
                  <span
                    className={`rounded-full px-3 py-0.5 font-display uppercase label-xs font-bold ${
                      group.isRelevant
                        ? allMastered
                          ? "bg-success/15 text-success"
                          : "bg-deep-teal/15 text-deep-teal"
                        : "bg-warm-shadow/10 text-warm-shadow"
                    }`}
                  >
                    {group.ageGroup}
                  </span>
                  <span className="font-sans text-body-s text-accent-dark/70">
                    {fmt(t.roadmapMasteredOfTotal, { mastered, total })}
                  </span>
                  {allMastered ? (
                    <span aria-hidden className="font-display text-success">
                      ✓
                    </span>
                  ) : null}
                </div>
                {group.isRelevant && !allMastered ? (
                  <span className="font-display uppercase label-xs text-glyph-gold">
                    {t.roadmapShouldMaster}
                  </span>
                ) : null}
              </div>
              <div className="grid grid-cols-1 gap-2 sm:grid-cols-2 lg:grid-cols-3">
                {visible.map((skill) => (
                  <RoadmapSkillCard key={skill.id} skill={skill} t={t} />
                ))}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}

function FilterChip({
  active,
  onClick,
  children,
}: {
  active: boolean;
  onClick: () => void;
  children: React.ReactNode;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={`rounded-full border px-3 py-1 font-display uppercase label-xs transition-colors ${
        active
          ? "border-glyph-gold/40 bg-glyph-gold/20 text-accent-dark"
          : "border-accent-dark/15 bg-white text-warm-shadow hover:border-accent-dark/25"
      }`}
    >
      {children}
    </button>
  );
}

function RoadmapSkillCard({ skill, t }: { skill: RoadmapSkill; t: T }) {
  const pct = Math.round(skill.masteryProgress * 100);
  const accent = skill.isMastered
    ? "var(--color-success)"
    : skill.isCloseToMastering
      ? "var(--color-glyph-gold)"
      : skill.timesPracticed > 0
        ? skill.categoryColor
        : "rgba(36,23,15,0.1)";
  return (
    <div
      className="rounded-2xl border border-accent-dark/10 bg-white p-3"
      style={{ borderInlineStartColor: accent, borderInlineStartWidth: 3 }}
    >
      <div className="flex items-center justify-between gap-2">
        <div className="flex min-w-0 items-center gap-1.5">
          {skill.categoryIcon ? (
            <span aria-hidden className="shrink-0 text-[12px]">
              {skill.categoryIcon}
            </span>
          ) : null}
          <span className="truncate font-display label-sm font-bold text-accent-dark">
            {skill.name}
          </span>
        </div>
        {skill.isMastered ? (
          <span className="rounded-full bg-success/15 px-2 py-0.5 font-display uppercase label-xs text-success">
            {t.skillMastered}
          </span>
        ) : skill.isCloseToMastering ? (
          <span className="rounded-full bg-glyph-gold/20 px-2 py-0.5 font-display uppercase label-xs text-accent-dark">
            {t.skillAlmost}
          </span>
        ) : null}
      </div>
      <div className="mt-2 flex items-center gap-2">
        <div className="h-1 flex-1 overflow-hidden rounded-full bg-accent-dark/10">
          <div
            className="h-full rounded-full transition-all duration-300"
            style={{ width: `${pct}%`, background: accent }}
          />
        </div>
        {!skill.isMastered ? (
          <span className="w-8 text-end font-sans text-body-xs text-warm-shadow">
            {pct}%
          </span>
        ) : null}
      </div>
      {skill.needsRatingBoost ? (
        <p className="mt-1.5 font-sans text-body-xs text-glyph-gold">
          {t.skillNeedsHigherRatings}
        </p>
      ) : null}
      <div className="mt-1.5 flex items-center justify-between font-sans text-body-xs text-warm-shadow">
        <span>
          {skill.timesPracticed > 0
            ? skill.timesPracticed === 1
              ? t.skillCompletionsOne
              : fmt(t.skillCompletionsOther, { count: skill.timesPracticed })
            : t.skillNotStarted}
        </span>
        {skill.timesPracticed > 0 ? (
          <span
            className={
              skill.avgRating >= 4.5 ? "text-success" : "text-warm-shadow"
            }
          >
            {skill.avgRating.toFixed(1)}★
          </span>
        ) : null}
      </div>
    </div>
  );
}

function HistoryTab({
  sessions,
  t,
  lang,
  errorMessage,
}: {
  sessions: TrainingSession[];
  t: T;
  lang: Locale;
  errorMessage: string | null;
}) {
  if (errorMessage) return <SectionError t={t} />;
  if (sessions.length === 0)
    return <EmptyState>{t.noRecentTraining}</EmptyState>;

  const statusLabel = (status: string): string => {
    if (status === "completed") return t.statusCompleted;
    if (status === "abandoned") return t.statusAbandoned;
    if (status === "in_progress") return t.statusInProgress;
    return t.statusUnknown;
  };
  const statusTone = (status: string): string => {
    if (status === "completed") return "bg-success/15 text-success";
    if (status === "abandoned") return "bg-error/15 text-error";
    if (status === "in_progress")
      return "bg-glyph-gold/20 text-accent-dark";
    return "bg-warm-shadow/10 text-warm-shadow";
  };
  const fmtDate = (iso: string) => {
    if (!iso) return "—";
    const d = new Date(iso);
    return Number.isNaN(d.getTime()) ? "—" : d.toLocaleDateString(lang);
  };

  return (
    <div className="rounded-3xl border border-accent-dark/10 bg-white">
      <div className="hidden overflow-x-auto md:block">
        <table className="w-full border-collapse font-sans text-body-s">
          <thead>
            <tr>
              <Th>{t.historyDate}</Th>
              <Th>{t.historyType}</Th>
              <Th>{t.historyExercises}</Th>
              <Th>{t.historyXPEarned}</Th>
              <Th>{t.historyAvgRating}</Th>
              <Th>{t.historyStatus}</Th>
            </tr>
          </thead>
          <tbody>
            {sessions.map((s) => (
              <tr
                key={s.id}
                className="border-t border-accent-dark/5"
              >
                <Td>{fmtDate(s.started_at)}</Td>
                <Td>
                  <span className="capitalize">{s.session_type}</span>
                </Td>
                <Td>{s.exercises_completed}</Td>
                <Td>{s.total_xp_earned}</Td>
                <Td>
                  {s.average_rating
                    ? `${Number(s.average_rating).toFixed(1)}★`
                    : "—"}
                </Td>
                <Td>
                  <span
                    className={`inline-flex items-center rounded-full px-2.5 py-0.5 font-display uppercase label-xs ${statusTone(s.status)}`}
                  >
                    {statusLabel(s.status)}
                  </span>
                </Td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
      <ul className="flex flex-col gap-3 p-4 md:hidden">
        {sessions.map((s) => (
          <li
            key={s.id}
            className="rounded-2xl border border-accent-dark/10 p-4"
          >
            <div className="flex items-center justify-between">
              <span className="font-display label-sm font-bold text-accent-dark">
                {fmtDate(s.started_at)}
              </span>
              <span
                className={`inline-flex items-center rounded-full px-2.5 py-0.5 font-display uppercase label-xs ${statusTone(s.status)}`}
              >
                {statusLabel(s.status)}
              </span>
            </div>
            <p className="mt-2 font-sans text-body-xs text-warm-shadow">
              <span className="capitalize">{s.session_type}</span> ·{" "}
              {t.historyExercises}:{" "}
              <strong className="text-accent-dark">
                {s.exercises_completed}
              </strong>{" "}
              · {t.xpSuffix}:{" "}
              <strong className="text-accent-dark">
                {s.total_xp_earned}
              </strong>
              {s.average_rating
                ? ` · ${Number(s.average_rating).toFixed(1)}★`
                : ""}
            </p>
          </li>
        ))}
      </ul>
    </div>
  );
}

function Th({ children }: { children: React.ReactNode }) {
  return (
    <th className="whitespace-nowrap px-4 py-3 text-start font-display uppercase label-xs text-warm-shadow">
      {children}
    </th>
  );
}
function Td({ children }: { children: React.ReactNode }) {
  return (
    <td className="whitespace-nowrap px-4 py-3 text-accent-dark/80">
      {children}
    </td>
  );
}

function TrendsTab({
  weeklyTrends,
  t,
  errorMessage,
}: {
  weeklyTrends: WeeklyTrendPoint[];
  t: T;
  errorMessage: string | null;
}) {
  if (errorMessage) return <SectionError t={t} />;
  const hasData = weeklyTrends.some(
    (w) => (w.xp ?? 0) > 0 || (w.minutes ?? 0) > 0,
  );
  if (!hasData) return <EmptyState>{t.noTrendActivityYet}</EmptyState>;

  return (
    <div className="grid grid-cols-1 gap-4 lg:grid-cols-2">
      <div className="rounded-2xl border border-accent-dark/10 bg-white p-5">
        <h3 className="font-display uppercase label-sm text-warm-shadow">
          {t.chartXPPerWeek}
        </h3>
        <PlayerCharts.WeeklyLine data={weeklyTrends} xpLabel={t.xpSuffix} />
      </div>
      <div className="rounded-2xl border border-accent-dark/10 bg-white p-5">
        <h3 className="font-display uppercase label-sm text-warm-shadow">
          {t.chartPracticeMinutes}
        </h3>
        <PlayerCharts.WeeklyBars data={weeklyTrends} minutesLabel={t.minutesLabel} />
      </div>
    </div>
  );
}
