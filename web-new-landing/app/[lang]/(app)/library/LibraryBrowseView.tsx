"use client";

import Link from "next/link";
import { useState } from "react";
import { useLibraryData } from "./_hooks/useLibraryData";
import { deleteCategory } from "./_hooks/useCategoryMutations";
import {
  countOrphanExercisesForSkill,
  deleteSkill,
} from "./_hooks/useSkillMutations";
import { deleteExercise } from "./_hooks/useExerciseMutations";
import { TreeView } from "./_components/TreeView";
import { DeleteCategoryModal } from "./_components/DeleteCategoryModal";
import { DeleteSkillModal } from "./_components/DeleteSkillModal";
import { DeleteExerciseModal } from "./_components/DeleteExerciseModal";
import { AdvancedFilterPanel } from "./_components/AdvancedFilterPanel";
import { ActiveFilterChips } from "./_components/ActiveFilterChips";
import { Select } from "../../../_components/primitives/Select";
import { Spinner } from "../../../_components/primitives/Spinner";
import { toast } from "../../../_components/primitives/Toast";
import { AGE_GROUPS } from "../../../_lib/academy/constants";
import {
  DEFAULT_FILTERS,
  type Category,
  type Exercise,
  type LibraryFilters,
  type Skill,
} from "./_lib/types";
import type { ProductDict } from "../../../_dictionaries/product";
import type { Locale } from "../../../_dictionaries";

function fmt(template: string, vars: Record<string, string | number>): string {
  return template.replace(/\{\{(\w+)\}\}/g, (_, k) => String(vars[k] ?? ""));
}

export function LibraryBrowseView({
  dict,
  lang,
}: {
  dict: ProductDict;
  lang: Locale;
}) {
  const t = dict.library;
  const {
    categories,
    skills,
    exercises,
    stats,
    loading,
    error,
    refresh,
    getSkillsForCategory,
    getExercisesForSkill,
    getCategoriesMatchingSearch,
  } = useLibraryData();
  const [filters, setFilters] = useState<LibraryFilters>(DEFAULT_FILTERS);
  const [filterPanelOpen, setFilterPanelOpen] = useState(false);
  const clearAllFilters = () => setFilters(DEFAULT_FILTERS);
  const visibleCategories =
    filters.categoryIds.length > 0
      ? categories.filter((c) => filters.categoryIds.includes(c.id))
      : categories;
  const [pendingDelete, setPendingDelete] = useState<Category | null>(null);
  const [deleteBusy, setDeleteBusy] = useState(false);
  const [pendingDeleteSkill, setPendingDeleteSkill] = useState<Skill | null>(null);
  const [deleteSkillBusy, setDeleteSkillBusy] = useState(false);
  const [pendingDeleteExercise, setPendingDeleteExercise] = useState<Exercise | null>(null);
  const [deleteExerciseBusy, setDeleteExerciseBusy] = useState(false);

  const performDeleteExercise = async () => {
    if (!pendingDeleteExercise) return;
    setDeleteExerciseBusy(true);
    try {
      await deleteExercise(pendingDeleteExercise.id, { exercises });
      toast.success(dict.library.exerciseDelete.deleted);
      setPendingDeleteExercise(null);
      refresh();
    } catch (e) {
      toast.error(
        fmt(dict.library.exerciseDelete.deleteError, {
          error: e instanceof Error ? e.message : String(e),
        }),
      );
    } finally {
      setDeleteExerciseBusy(false);
    }
  };

  const pendingDeleteSkillOrphans = pendingDeleteSkill
    ? countOrphanExercisesForSkill(pendingDeleteSkill.id, exercises)
    : 0;

  const performDeleteSkill = async () => {
    if (!pendingDeleteSkill) return;
    setDeleteSkillBusy(true);
    try {
      await deleteSkill(pendingDeleteSkill.id, { exercises });
      toast.success(dict.library.skillDelete.deleted);
      setPendingDeleteSkill(null);
      refresh();
    } catch (e) {
      toast.error(
        fmt(dict.library.skillDelete.deleteError, {
          error: e instanceof Error ? e.message : String(e),
        }),
      );
    } finally {
      setDeleteSkillBusy(false);
    }
  };

  const pendingDeleteCounts = pendingDelete
    ? (() => {
        const skillIds = skills.filter((s) => s.categoryId === pendingDelete.id).map((s) => s.id);
        const orphans = exercises.filter((e) =>
          e.skillIds.every((sid) => skillIds.includes(sid)),
        );
        return { skillCount: skillIds.length, exerciseCount: orphans.length };
      })()
    : { skillCount: 0, exerciseCount: 0 };

  const performDelete = async () => {
    if (!pendingDelete) return;
    setDeleteBusy(true);
    try {
      await deleteCategory(pendingDelete.id, { skills, exercises });
      toast.success(dict.library.categoryDelete.deleted);
      setPendingDelete(null);
      refresh();
    } catch (e) {
      toast.error(
        fmt(dict.library.categoryDelete.deleteError, {
          error: e instanceof Error ? e.message : String(e),
        }),
      );
    } finally {
      setDeleteBusy(false);
    }
  };

  return (
    <div className="mx-auto w-full max-w-[1100px] px-6 py-12 md:px-10 md:py-16">
      <Link
        href={`/${lang}/home`}
        className="inline-flex items-center gap-2 font-sans text-body-s text-warm-shadow transition-colors hover:text-accent-dark"
      >
        <span aria-hidden className="rtl:rotate-180">
          ←
        </span>
        {t.backToHome}
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
        </div>
        <div className="flex flex-wrap items-end gap-4 font-sans text-body-s text-accent-dark">
          <Stat label={t.stats.categories} value={stats.totalCategories} />
          <Stat label={t.stats.skills} value={stats.totalSkills} />
          <Stat label={t.stats.exercises} value={stats.totalExercises} />
          <Link
            href={`/${lang}/library/category/edit`}
            className="inline-flex min-h-[44px] items-center gap-2 rounded-full bg-glyph-gold px-5 py-2 font-display label-s uppercase tracking-wide text-accent-dark transition-colors hover:bg-glyph-gold/90"
          >
            {t.addCategory}
          </Link>
        </div>
      </header>

      <section className="mt-8 rounded-2xl border border-accent-dark/10 bg-white p-4 shadow-sm md:p-5">
        <div className="flex flex-wrap items-center gap-3">
          <div className="relative min-w-[220px] flex-1">
            <input
              type="search"
              value={filters.searchTerm}
              onChange={(e) =>
                setFilters((prev) => ({ ...prev, searchTerm: e.target.value }))
              }
              placeholder={t.searchPlaceholder}
              className="h-11 w-full rounded-xl border border-accent-dark/15 bg-cream px-4 font-sans text-body-m text-accent-dark placeholder:text-warm-shadow/70 focus:border-glyph-gold focus:outline-none"
            />
            {filters.searchTerm && (
              <button
                type="button"
                onClick={() => setFilters((prev) => ({ ...prev, searchTerm: "" }))}
                aria-label={t.clearSearch}
                className="absolute inset-y-0 end-2 inline-flex items-center px-2 font-mono text-warm-shadow hover:text-accent-dark"
              >
                ✕
              </button>
            )}
          </div>

          <label className="flex items-center gap-2 font-sans text-body-xs text-warm-shadow">
            <span>{t.ageGroupLabel}</span>
            <Select
              value={filters.ageGroup}
              onChange={(e) =>
                setFilters((prev) => ({
                  ...prev,
                  ageGroup: e.target.value as LibraryFilters["ageGroup"],
                }))
              }
              className="h-10 w-auto"
            >
              <option value="">{t.allAgeGroups}</option>
              {AGE_GROUPS.map((g) => (
                <option key={g} value={g}>
                  {g} {filters.exactAgeMatch ? "" : t.andBelow}
                </option>
              ))}
            </Select>
          </label>

          {filters.ageGroup && (
            <label className="inline-flex items-center gap-2 font-sans text-body-xs text-accent-dark">
              <input
                type="checkbox"
                checked={filters.exactAgeMatch}
                onChange={(e) =>
                  setFilters((prev) => ({ ...prev, exactAgeMatch: e.target.checked }))
                }
                className="h-4 w-4 accent-glyph-gold"
              />
              {t.exactAgeOnly}
            </label>
          )}

          <Select
            value={filters.exerciseFilter}
            onChange={(e) =>
              setFilters((prev) => ({
                ...prev,
                exerciseFilter: e.target.value as LibraryFilters["exerciseFilter"],
              }))
            }
            className="h-10 w-auto"
            aria-label={t.exerciseFilterLabel}
          >
            <option value="all">{t.exerciseFilterAll}</option>
            <option value="has">{t.exerciseFilterHas}</option>
            <option value="none">{t.exerciseFilterNone}</option>
          </Select>

          <button
            type="button"
            onClick={() => setFilterPanelOpen(true)}
            className="inline-flex h-10 items-center gap-2 rounded-xl border border-accent-dark/15 bg-cream px-4 font-display label-xs uppercase tracking-wide text-accent-dark transition-colors hover:bg-accent-dark hover:text-cream"
          >
            {t.filters.openButton}
          </button>
        </div>

        <ActiveFilterChips
          filters={filters}
          setFilters={setFilters}
          clearAll={clearAllFilters}
          categories={categories}
          dict={dict}
        />
      </section>

      <section className="mt-6">
        {loading ? (
          <div className="flex min-h-[200px] items-center justify-center">
            <Spinner />
          </div>
        ) : error ? (
          <div className="rounded-2xl border border-error/40 bg-error/10 px-4 py-3 font-sans text-body-s text-error">
            {fmt(t.errorLoading, { error })}
          </div>
        ) : (
          <TreeView
            categories={visibleCategories}
            filters={filters}
            getSkillsForCategory={getSkillsForCategory}
            getExercisesForSkill={getExercisesForSkill}
            getCategoriesMatchingSearch={getCategoriesMatchingSearch}
            dict={dict}
            lang={lang}
            onRequestDeleteCategory={(c) => setPendingDelete(c)}
            onRequestDeleteSkill={(s) => setPendingDeleteSkill(s)}
            onRequestDeleteExercise={(e) => setPendingDeleteExercise(e)}
          />
        )}
      </section>

      <DeleteCategoryModal
        open={pendingDelete != null}
        category={pendingDelete}
        skillCount={pendingDeleteCounts.skillCount}
        exerciseCount={pendingDeleteCounts.exerciseCount}
        busy={deleteBusy}
        onConfirm={() => void performDelete()}
        onClose={() => setPendingDelete(null)}
        dict={dict}
      />

      <DeleteSkillModal
        open={pendingDeleteSkill != null}
        skill={pendingDeleteSkill}
        exerciseCount={pendingDeleteSkillOrphans}
        busy={deleteSkillBusy}
        onConfirm={() => void performDeleteSkill()}
        onClose={() => setPendingDeleteSkill(null)}
        dict={dict}
      />

      <DeleteExerciseModal
        open={pendingDeleteExercise != null}
        exercise={pendingDeleteExercise}
        busy={deleteExerciseBusy}
        onConfirm={() => void performDeleteExercise()}
        onClose={() => setPendingDeleteExercise(null)}
        dict={dict}
      />

      <AdvancedFilterPanel
        open={filterPanelOpen}
        onClose={() => setFilterPanelOpen(false)}
        filters={filters}
        setFilters={setFilters}
        clearAll={clearAllFilters}
        categories={categories}
        dict={dict}
      />
    </div>
  );
}

function Stat({ label, value }: { label: string; value: number }) {
  return (
    <div className="flex flex-col items-end">
      <span className="font-display text-2xl text-accent-dark">{value}</span>
      <span className="font-display label-xs uppercase text-warm-shadow">{label}</span>
    </div>
  );
}
