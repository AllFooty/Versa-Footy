"use client";

import Link from "next/link";
import { useEffect, useMemo, useRef, useState } from "react";
import type { Category, Exercise, LibraryFilters, Skill } from "../_lib/types";
import { isAnyFilterActive } from "../_lib/search";
import type { ProductDict } from "../../../../_dictionaries/product";
import type { Locale } from "../../../../_dictionaries";

type LibT = ProductDict["library"];

function fmt(template: string, vars: Record<string, string | number>): string {
  return template.replace(/\{\{(\w+)\}\}/g, (_, k) => String(vars[k] ?? ""));
}

export function TreeView({
  categories,
  filters,
  getSkillsForCategory,
  getExercisesForSkill,
  getCategoriesMatchingSearch,
  dict,
  lang,
  onRequestDeleteCategory,
  onRequestDeleteSkill,
  onRequestDeleteExercise,
}: {
  categories: Category[];
  filters: LibraryFilters;
  getSkillsForCategory: (categoryId: number, filters: LibraryFilters) => Skill[];
  getExercisesForSkill: (skillId: number, filters: LibraryFilters) => Exercise[];
  getCategoriesMatchingSearch: (searchTerm: string) => Set<number>;
  dict: ProductDict;
  lang: Locale;
  onRequestDeleteCategory: (category: Category) => void;
  onRequestDeleteSkill: (skill: Skill) => void;
  onRequestDeleteExercise: (exercise: Exercise) => void;
}) {
  const t = dict.library;
  const [expandedCats, setExpandedCats] = useState<Record<number, boolean>>({});
  const [expandedSkills, setExpandedSkills] = useState<Record<number, boolean>>({});

  const isSearching = isAnyFilterActive(filters);

  const categoriesWithResults = useMemo(
    () =>
      categories.map((category) => ({
        category,
        filteredSkills: getSkillsForCategory(category.id, filters),
      })),
    [categories, getSkillsForCategory, filters],
  );

  const categoryNameMatches = useMemo(
    () => getCategoriesMatchingSearch(filters.searchTerm),
    [getCategoriesMatchingSearch, filters.searchTerm],
  );

  const visible = isSearching
    ? categoriesWithResults.filter(
        ({ category, filteredSkills }) =>
          filteredSkills.length > 0 || categoryNameMatches.has(category.id),
      )
    : categoriesWithResults;

  const resultCounts = useMemo(() => {
    if (!isSearching) return null;
    let totalSkills = 0;
    let totalExercises = 0;
    for (const { filteredSkills } of visible) {
      totalSkills += filteredSkills.length;
      for (const skill of filteredSkills) {
        totalExercises += getExercisesForSkill(skill.id, filters).length;
      }
    }
    return { totalSkills, totalExercises, totalCategories: visible.length };
  }, [isSearching, visible, getExercisesForSkill, filters]);

  if (categories.length === 0) {
    return (
      <EmptyState icon="⚽" text={t.noCategoriesYet} />
    );
  }

  if (isSearching && visible.length === 0) {
    return (
      <EmptyState
        icon="🔍"
        text={t.noResultsFound}
        hint={t.noResultsHint}
      />
    );
  }

  return (
    <div>
      {isSearching && resultCounts && visible.length > 0 && (
        <p className="mb-3 px-1 font-sans text-body-xs text-warm-shadow">
          {fmt(t.searchResultsSummary, {
            skills: resultCounts.totalSkills,
            exercises: resultCounts.totalExercises,
            categories: resultCounts.totalCategories,
          })}
        </p>
      )}

      <ul className="m-0 list-none p-0">
        {visible.map(({ category, filteredSkills }) => {
          const isExpanded = isSearching || !!expandedCats[category.id];
          return (
            <CategoryNode
              key={category.id}
              category={category}
              skills={filteredSkills}
              expanded={isExpanded}
              expandedSkills={expandedSkills}
              isSearching={isSearching}
              onToggle={() =>
                setExpandedCats((prev) => ({ ...prev, [category.id]: !prev[category.id] }))
              }
              onToggleSkill={(sid) =>
                setExpandedSkills((prev) => ({ ...prev, [sid]: !prev[sid] }))
              }
              getExercisesForSkill={(sid) => getExercisesForSkill(sid, filters)}
              t={t}
              lang={lang}
              onRequestDeleteCategory={onRequestDeleteCategory}
              onRequestDeleteSkill={onRequestDeleteSkill}
              onRequestDeleteExercise={onRequestDeleteExercise}
            />
          );
        })}
      </ul>
    </div>
  );
}

function EmptyState({
  icon,
  text,
  hint,
}: {
  icon: string;
  text: string;
  hint?: string;
}) {
  return (
    <div className="flex flex-col items-center justify-center px-6 py-12 text-center">
      <div className="mb-3 text-4xl" aria-hidden>
        {icon}
      </div>
      <p className="font-sans text-body-m text-accent-dark">{text}</p>
      {hint && <p className="mt-1 font-sans text-body-s text-warm-shadow">{hint}</p>}
    </div>
  );
}

function CategoryNode({
  category,
  skills,
  expanded,
  expandedSkills,
  isSearching,
  onToggle,
  onToggleSkill,
  getExercisesForSkill,
  t,
  lang,
  onRequestDeleteCategory,
  onRequestDeleteSkill,
  onRequestDeleteExercise,
}: {
  category: Category;
  skills: Skill[];
  expanded: boolean;
  expandedSkills: Record<number, boolean>;
  isSearching: boolean;
  onToggle: () => void;
  onToggleSkill: (sid: number) => void;
  getExercisesForSkill: (skillId: number) => Exercise[];
  t: LibT;
  lang: Locale;
  onRequestDeleteCategory: (category: Category) => void;
  onRequestDeleteSkill: (skill: Skill) => void;
  onRequestDeleteExercise: (exercise: Exercise) => void;
}) {
  const swatch = category.color ?? "#FFD24A";
  return (
    <li className="mb-3 overflow-hidden rounded-2xl border border-accent-dark/10 bg-white shadow-sm">
      <div className="flex items-center gap-2 px-4 py-2">
        <button
          type="button"
          onClick={onToggle}
          className="flex flex-1 items-center gap-3 py-1 text-left transition-colors"
          aria-expanded={expanded}
        >
          <span
            className="inline-flex h-9 w-9 shrink-0 items-center justify-center rounded-full text-lg"
            style={{ backgroundColor: `${swatch}26`, color: swatch }}
            aria-hidden
          >
            {category.icon ?? "•"}
          </span>
          <span className="flex-1 truncate font-display label-md uppercase text-accent-dark">
            {category.name}
          </span>
          <span className="inline-flex items-center rounded-full bg-accent-dark/8 px-2.5 py-0.5 font-display label-xs uppercase text-warm-shadow">
            {skills.length} {t.stats.skills}
          </span>
          <span
            aria-hidden
            className={`text-warm-shadow transition-transform rtl:rotate-180 ${expanded ? "rotate-90 rtl:rotate-90" : ""}`}
          >
            ›
          </span>
        </button>
        <Link
          href={`/${lang}/library/category/edit?id=${category.id}`}
          className="inline-flex h-8 items-center rounded-full border border-accent-dark/15 bg-cream px-3 font-display label-xs uppercase text-accent-dark transition-colors hover:bg-accent-dark hover:text-cream"
        >
          {t.categoryActions.edit}
        </Link>
        <RowMoreMenu
          label={t.categoryActions.more}
          deleteLabel={t.categoryActions.delete}
          onDelete={() => onRequestDeleteCategory(category)}
        />
      </div>

      {expanded && (
        <div className="border-t border-accent-dark/8 bg-cream/30 px-3 py-2">
          {skills.length === 0 ? (
            <p className="px-2 py-3 font-sans text-body-s italic text-warm-shadow">
              {isSearching ? t.noMatchingSkills : t.noSkillsInCategory}
            </p>
          ) : (
            <ul className="m-0 list-none p-0">
              {skills.map((skill) => {
                const exercises = getExercisesForSkill(skill.id);
                const sExpanded = isSearching || !!expandedSkills[skill.id];
                return (
                  <SkillNode
                    key={skill.id}
                    skill={skill}
                    exercises={exercises}
                    expanded={sExpanded}
                    onToggle={() => onToggleSkill(skill.id)}
                    t={t}
                    lang={lang}
                    onRequestDeleteSkill={onRequestDeleteSkill}
                    onRequestDeleteExercise={onRequestDeleteExercise}
                  />
                );
              })}
            </ul>
          )}
          <Link
            href={`/${lang}/library/skill/edit?categoryId=${category.id}`}
            className="mt-1 inline-flex h-9 items-center rounded-full border border-dashed border-glyph-gold/50 bg-glyph-gold/8 px-3 font-display label-xs uppercase text-accent-dark transition-colors hover:bg-glyph-gold/15"
          >
            + {t.categoryActions.addSkill}
          </Link>
        </div>
      )}
    </li>
  );
}

function SkillNode({
  skill,
  exercises,
  expanded,
  onToggle,
  t,
  lang,
  onRequestDeleteSkill,
  onRequestDeleteExercise,
}: {
  skill: Skill;
  exercises: Exercise[];
  expanded: boolean;
  onToggle: () => void;
  t: LibT;
  lang: Locale;
  onRequestDeleteSkill: (skill: Skill) => void;
  onRequestDeleteExercise: (exercise: Exercise) => void;
}) {
  return (
    <li className="mb-2 overflow-hidden rounded-xl border border-accent-dark/8 bg-white last:mb-0">
      <div className="flex items-center gap-2 px-3 py-2">
        <button
          type="button"
          onClick={onToggle}
          className="flex flex-1 items-center gap-2 text-left transition-colors"
          aria-expanded={expanded}
        >
          <span
            aria-hidden
            className={`text-warm-shadow transition-transform rtl:rotate-180 ${expanded ? "rotate-90 rtl:rotate-90" : ""}`}
          >
            ›
          </span>
          <span className="flex-1 truncate font-sans text-body-s font-semibold text-accent-dark">
            {skill.name}
          </span>
          {skill.ageGroup && (
            <span className="font-display label-xs uppercase text-warm-shadow">
              {t.skillAgePrefix} {skill.ageGroup}
            </span>
          )}
          <span className="inline-flex items-center rounded-full bg-accent-dark/8 px-2.5 py-0.5 font-display label-xs uppercase text-warm-shadow">
            {exercises.length} {t.stats.exercises}
          </span>
        </button>
        <Link
          href={`/${lang}/library/skill/edit?id=${skill.id}`}
          className="inline-flex h-8 items-center rounded-full border border-accent-dark/15 bg-cream px-3 font-display label-xs uppercase text-accent-dark transition-colors hover:bg-accent-dark hover:text-cream"
        >
          {t.skillActions.edit}
        </Link>
        <RowMoreMenu
          label={t.skillActions.more}
          deleteLabel={t.skillActions.delete}
          onDelete={() => onRequestDeleteSkill(skill)}
        />
      </div>

      {expanded && (
        <div className="border-t border-accent-dark/8 bg-cream/40 px-3 py-2">
          {exercises.length === 0 ? (
            <p className="px-2 py-2 font-sans text-body-xs italic text-warm-shadow">
              {t.noExercisesInSkill}
            </p>
          ) : (
            <ul className="m-0 list-none p-0">
              {exercises.map((ex) => (
                <ExerciseRow
                  key={ex.id}
                  exercise={ex}
                  t={t}
                  lang={lang}
                  onRequestDeleteExercise={onRequestDeleteExercise}
                />
              ))}
            </ul>
          )}
          <Link
            href={`/${lang}/library/exercise/edit?skillId=${skill.id}`}
            className="mt-2 inline-flex h-9 items-center rounded-full border border-dashed border-glyph-gold/50 bg-glyph-gold/8 px-3 font-display label-xs uppercase text-accent-dark transition-colors hover:bg-glyph-gold/15"
          >
            + {t.skillActions.addExercise}
          </Link>
        </div>
      )}
    </li>
  );
}

function RowMoreMenu({
  label,
  deleteLabel,
  onDelete,
}: {
  label: string;
  deleteLabel: string;
  onDelete: () => void;
}) {
  const [open, setOpen] = useState(false);
  const rootRef = useRef<HTMLDivElement | null>(null);
  const buttonRef = useRef<HTMLButtonElement | null>(null);
  const deleteItemRef = useRef<HTMLButtonElement | null>(null);

  useEffect(() => {
    if (!open) return;
    const onDocPointer = (e: MouseEvent) => {
      if (rootRef.current && !rootRef.current.contains(e.target as Node)) {
        setOpen(false);
      }
    };
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") {
        setOpen(false);
        buttonRef.current?.focus();
      }
    };
    document.addEventListener("mousedown", onDocPointer);
    document.addEventListener("keydown", onKey);
    deleteItemRef.current?.focus();
    return () => {
      document.removeEventListener("mousedown", onDocPointer);
      document.removeEventListener("keydown", onKey);
    };
  }, [open]);

  return (
    <div ref={rootRef} className="relative">
      <button
        ref={buttonRef}
        type="button"
        aria-label={label}
        aria-haspopup="menu"
        aria-expanded={open}
        onClick={(e) => {
          e.stopPropagation();
          setOpen((v) => !v);
        }}
        className="inline-flex h-8 w-8 items-center justify-center rounded-full border border-accent-dark/15 bg-cream text-accent-dark transition-colors hover:bg-accent-dark hover:text-cream"
      >
        <span aria-hidden className="text-base leading-none">⋯</span>
      </button>
      {open && (
        <div
          role="menu"
          className="absolute end-0 top-9 z-20 min-w-[10rem] overflow-hidden rounded-xl border border-accent-dark/10 bg-white shadow-lg"
        >
          <button
            ref={deleteItemRef}
            type="button"
            role="menuitem"
            onClick={() => {
              setOpen(false);
              onDelete();
            }}
            className="flex w-full items-center gap-2 px-3 py-2 text-start font-sans text-body-s text-error transition-colors hover:bg-error/10 focus:bg-error/10 focus:outline-none"
          >
            <span aria-hidden>🗑</span>
            <span>{deleteLabel}</span>
          </button>
        </div>
      )}
    </div>
  );
}

function ExerciseRow({
  exercise,
  t,
  lang,
  onRequestDeleteExercise,
}: {
  exercise: Exercise;
  t: LibT;
  lang: Locale;
  onRequestDeleteExercise: (exercise: Exercise) => void;
}) {
  return (
    <li className="flex flex-wrap items-center gap-3 border-b border-accent-dark/8 py-2 last:border-b-0">
      <div className="min-w-0 flex-1">
        <p className="truncate font-sans text-body-s text-accent-dark">{exercise.name}</p>
        <p className="mt-0.5 font-sans text-body-xs text-warm-shadow">
          {exercise.difficulty != null && (
            <span>{fmt(t.difficultyLabel, { value: exercise.difficulty })}</span>
          )}
          {exercise.difficulty != null && exercise.minimumDuration != null && " · "}
          {exercise.minimumDuration != null && (
            <span>{fmt(t.exerciseDuration, { min: exercise.minimumDuration })}</span>
          )}
          {(exercise.difficulty != null || exercise.minimumDuration != null) && " · "}
          <span>
            {exercise.equipment.length === 0 ? t.equipmentNone : exercise.equipment.join(", ")}
          </span>
        </p>
      </div>
      <div className="flex gap-1.5">
        <Link
          href={`/${lang}/library/exercise/preview?id=${exercise.id}`}
          className="inline-flex h-8 items-center rounded-full border border-accent-dark/15 bg-cream px-3 font-display label-xs uppercase text-accent-dark transition-colors hover:bg-accent-dark hover:text-cream"
        >
          {t.exerciseActions.preview}
        </Link>
        <Link
          href={`/${lang}/library/exercise/edit?id=${exercise.id}`}
          className="inline-flex h-8 items-center rounded-full border border-accent-dark/15 bg-cream px-3 font-display label-xs uppercase text-accent-dark transition-colors hover:bg-accent-dark hover:text-cream"
        >
          {t.exerciseActions.edit}
        </Link>
        <RowMoreMenu
          label={t.exerciseActions.more}
          deleteLabel={t.exerciseActions.delete}
          onDelete={() => onRequestDeleteExercise(exercise)}
        />
      </div>
    </li>
  );
}
