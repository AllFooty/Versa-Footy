"use client";

import type { ProductDict } from "../../../../_dictionaries/product";
import { getDurationLabel, type Category, type LibraryFilters } from "../_lib/types";

function fmt(template: string, vars: Record<string, string | number>): string {
  return template.replace(/\{\{(\w+)\}\}/g, (_, k) => String(vars[k] ?? ""));
}

type Chip = { label: string; onRemove: () => void };

export function ActiveFilterChips({
  filters,
  setFilters,
  clearAll,
  categories,
  dict,
}: {
  filters: LibraryFilters;
  setFilters: (updater: (prev: LibraryFilters) => LibraryFilters) => void;
  clearAll: () => void;
  categories: Category[];
  dict: ProductDict;
}) {
  const t = dict.library.filters;
  const lib = dict.library;
  const chips: Chip[] = [];

  if (filters.ageGroup) {
    chips.push({
      label: `${filters.ageGroup}${filters.exactAgeMatch ? "" : ` ${lib.andBelow}`}`,
      onRemove: () =>
        setFilters((p) => ({ ...p, ageGroup: "", exactAgeMatch: false })),
    });
  }

  if (filters.difficultyMin != null || filters.difficultyMax != null) {
    const min = filters.difficultyMin ?? 1;
    const max = filters.difficultyMax ?? 5;
    const range = min === max ? fmt(t.stars, { value: min }) : fmt(t.starsRange, { min, max });
    chips.push({
      label: `${t.difficulty}: ${range}`,
      onRemove: () =>
        setFilters((p) => ({ ...p, difficultyMin: null, difficultyMax: null })),
    });
  }

  if (filters.noEquipment) {
    chips.push({
      label: t.noEquipment,
      onRemove: () => setFilters((p) => ({ ...p, noEquipment: false })),
    });
  } else if (filters.equipment.length > 0) {
    const label =
      filters.equipment.length <= 2
        ? filters.equipment.join(", ")
        : fmt(t.countEquipment, { count: filters.equipment.length });
    chips.push({
      label: `${t.equipment}: ${label}`,
      onRemove: () => setFilters((p) => ({ ...p, equipment: [] })),
    });
  }

  if (filters.durationMin != null || filters.durationMax != null) {
    const parts: string[] = [];
    if (filters.durationMin != null)
      parts.push(fmt(t.durationMin, { value: getDurationLabel(filters.durationMin) }));
    if (filters.durationMax != null)
      parts.push(fmt(t.durationMax, { value: getDurationLabel(filters.durationMax) }));
    chips.push({
      label: `${t.duration}: ${parts.join(", ")}`,
      onRemove: () => setFilters((p) => ({ ...p, durationMin: null, durationMax: null })),
    });
  }

  if (filters.exerciseFilter !== "all") {
    chips.push({
      label:
        filters.exerciseFilter === "has" ? lib.exerciseFilterHas : lib.exerciseFilterNone,
      onRemove: () => setFilters((p) => ({ ...p, exerciseFilter: "all" })),
    });
  }

  if (filters.hasVideo != null) {
    chips.push({
      label: filters.hasVideo ? t.hasVideo : t.noVideo,
      onRemove: () => setFilters((p) => ({ ...p, hasVideo: null })),
    });
  }

  if (filters.comboFilter !== "either") {
    chips.push({
      label: filters.comboFilter === "combo" ? t.combo : t.singleSkill,
      onRemove: () => setFilters((p) => ({ ...p, comboFilter: "either" })),
    });
  }

  if (filters.categoryIds.length > 0) {
    const names = filters.categoryIds
      .map((id) => categories.find((c) => c.id === id)?.name)
      .filter((x): x is string => Boolean(x));
    const label =
      names.length <= 2
        ? names.join(", ")
        : fmt(t.countCategories, { count: names.length });
    chips.push({
      label: `${t.categories}: ${label}`,
      onRemove: () => setFilters((p) => ({ ...p, categoryIds: [] })),
    });
  }

  if (chips.length === 0) return null;

  return (
    <div className="mt-4 flex flex-wrap items-center gap-2">
      {chips.map((c, i) => (
        <span
          key={i}
          className="inline-flex items-center gap-1.5 rounded-full border border-glyph-gold/40 bg-glyph-gold/15 px-3 py-1 font-sans text-body-xs text-accent-dark"
        >
          {c.label}
          <button
            type="button"
            aria-label={fmt(t.removeFilter, { label: c.label })}
            onClick={c.onRemove}
            className="font-mono text-accent-dark/70 hover:text-accent-dark"
          >
            ✕
          </button>
        </span>
      ))}
      {chips.length > 1 && (
        <button
          type="button"
          onClick={clearAll}
          className="inline-flex items-center rounded-full border border-accent-dark/15 bg-cream px-3 py-1 font-display label-xs uppercase tracking-wide text-warm-shadow hover:text-accent-dark"
        >
          {t.clearAll}
        </button>
      )}
    </div>
  );
}
