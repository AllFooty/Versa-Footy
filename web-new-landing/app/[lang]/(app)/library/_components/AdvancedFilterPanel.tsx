"use client";

import { Modal } from "../../../../_components/primitives/Modal";
import { Button } from "../../../../_components/primitives/Button";
import { Select } from "../../../../_components/primitives/Select";
import type { ProductDict } from "../../../../_dictionaries/product";
import {
  DURATION_OPTIONS,
  EQUIPMENT_OPTIONS,
  getDurationLabel,
  type Category,
  type ComboFilter,
  type LibraryFilters,
} from "../_lib/types";

type Props = {
  open: boolean;
  onClose: () => void;
  filters: LibraryFilters;
  setFilters: (updater: (prev: LibraryFilters) => LibraryFilters) => void;
  clearAll: () => void;
  categories: Category[];
  dict: ProductDict;
};

function fmt(template: string, vars: Record<string, string | number>): string {
  return template.replace(/\{\{(\w+)\}\}/g, (_, k) => String(vars[k] ?? ""));
}

const chipBase =
  "inline-flex min-h-[32px] items-center rounded-full border px-3 py-1 font-display label-xs uppercase tracking-wide transition-colors";
const chipIdle =
  "border-accent-dark/15 bg-cream text-accent-dark hover:bg-accent-dark hover:text-cream";
const chipActive = "border-glyph-gold bg-glyph-gold text-accent-dark";

function Chip({
  label,
  active,
  onClick,
}: {
  label: string;
  active: boolean;
  onClick: () => void;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      aria-pressed={active}
      className={`${chipBase} ${active ? chipActive : chipIdle}`}
    >
      {label}
    </button>
  );
}

function Section({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <div>
      <div className="mb-2 font-display label-xs uppercase tracking-wide text-warm-shadow">
        {title}
      </div>
      {children}
    </div>
  );
}

export function AdvancedFilterPanel({
  open,
  onClose,
  filters,
  setFilters,
  clearAll,
  categories,
  dict,
}: Props) {
  const t = dict.library.filters;

  const toggleEquipment = (eq: string) => {
    setFilters((prev) => {
      if (prev.noEquipment) {
        return { ...prev, noEquipment: false, equipment: [eq] };
      }
      const next = prev.equipment.includes(eq)
        ? prev.equipment.filter((x) => x !== eq)
        : [...prev.equipment, eq];
      return { ...prev, equipment: next };
    });
  };

  const toggleNoEquipment = () => {
    setFilters((prev) => ({
      ...prev,
      noEquipment: !prev.noEquipment,
      equipment: prev.noEquipment ? prev.equipment : [],
    }));
  };

  const toggleCategory = (id: number) => {
    setFilters((prev) => {
      const next = prev.categoryIds.includes(id)
        ? prev.categoryIds.filter((x) => x !== id)
        : [...prev.categoryIds, id];
      return { ...prev, categoryIds: next };
    });
  };

  const setCombo = (v: ComboFilter) =>
    setFilters((prev) => ({ ...prev, comboFilter: v }));
  const setHasVideo = (v: boolean | null) =>
    setFilters((prev) => ({ ...prev, hasVideo: v }));

  return (
    <Modal open={open} onClose={onClose} size="lg" ariaLabel={t.title}>
      <div className="flex items-center justify-between gap-3">
        <h2 className="font-display uppercase font-black tracking-[-0.01em] text-[clamp(20px,2.4vw,26px)] text-accent-dark">
          {t.title}
        </h2>
        <button
          type="button"
          onClick={clearAll}
          className="font-display label-xs uppercase tracking-wide text-warm-shadow hover:text-accent-dark"
        >
          {t.clearAll}
        </button>
      </div>

      <div className="mt-6 grid gap-6 md:grid-cols-2">
        <Section title={t.difficulty}>
          <div className="flex items-center gap-2">
            <Select
              aria-label={`${t.difficulty} ${t.min}`}
              value={filters.difficultyMin ?? ""}
              onChange={(e) =>
                setFilters((prev) => ({
                  ...prev,
                  difficultyMin: e.target.value ? Number(e.target.value) : null,
                }))
              }
              className="h-10 w-auto"
            >
              <option value="">{t.min}</option>
              {[1, 2, 3, 4, 5].map((v) => (
                <option key={v} value={v}>
                  {fmt(t.stars, { value: v })}
                </option>
              ))}
            </Select>
            <span className="text-warm-shadow">–</span>
            <Select
              aria-label={`${t.difficulty} ${t.max}`}
              value={filters.difficultyMax ?? ""}
              onChange={(e) =>
                setFilters((prev) => ({
                  ...prev,
                  difficultyMax: e.target.value ? Number(e.target.value) : null,
                }))
              }
              className="h-10 w-auto"
            >
              <option value="">{t.max}</option>
              {[1, 2, 3, 4, 5].map((v) => (
                <option key={v} value={v}>
                  {fmt(t.stars, { value: v })}
                </option>
              ))}
            </Select>
          </div>
        </Section>

        <Section title={t.duration}>
          <div className="flex items-center gap-2">
            <Select
              aria-label={`${t.duration} ${t.min}`}
              value={filters.durationMin ?? ""}
              onChange={(e) =>
                setFilters((prev) => ({
                  ...prev,
                  durationMin: e.target.value ? Number(e.target.value) : null,
                }))
              }
              className="h-10 w-auto"
            >
              <option value="">{t.min}</option>
              {DURATION_OPTIONS.map((o) => (
                <option key={o.value} value={o.value}>
                  {o.label}
                </option>
              ))}
            </Select>
            <span className="text-warm-shadow">–</span>
            <Select
              aria-label={`${t.duration} ${t.max}`}
              value={filters.durationMax ?? ""}
              onChange={(e) =>
                setFilters((prev) => ({
                  ...prev,
                  durationMax: e.target.value ? Number(e.target.value) : null,
                }))
              }
              className="h-10 w-auto"
            >
              <option value="">{t.max}</option>
              {DURATION_OPTIONS.map((o) => (
                <option key={o.value} value={o.value}>
                  {o.label}
                </option>
              ))}
            </Select>
          </div>
        </Section>

        <Section title={t.video}>
          <div className="flex flex-wrap gap-2">
            <Chip
              label={t.either}
              active={filters.hasVideo === null}
              onClick={() => setHasVideo(null)}
            />
            <Chip
              label={t.hasVideo}
              active={filters.hasVideo === true}
              onClick={() => setHasVideo(true)}
            />
            <Chip
              label={t.noVideo}
              active={filters.hasVideo === false}
              onClick={() => setHasVideo(false)}
            />
          </div>
        </Section>

        <Section title={t.exerciseType}>
          <div className="flex flex-wrap gap-2">
            <Chip
              label={t.either}
              active={filters.comboFilter === "either"}
              onClick={() => setCombo("either")}
            />
            <Chip
              label={t.singleSkill}
              active={filters.comboFilter === "single"}
              onClick={() => setCombo("single")}
            />
            <Chip
              label={t.combo}
              active={filters.comboFilter === "combo"}
              onClick={() => setCombo("combo")}
            />
          </div>
        </Section>

        <Section title={t.equipment}>
          <div className="flex flex-wrap gap-2">
            <Chip
              label={t.noEquipment}
              active={filters.noEquipment}
              onClick={toggleNoEquipment}
            />
            {EQUIPMENT_OPTIONS.map((eq) => (
              <Chip
                key={eq}
                label={eq}
                active={filters.equipment.includes(eq)}
                onClick={() => toggleEquipment(eq)}
              />
            ))}
          </div>
        </Section>

        {categories.length > 1 && (
          <Section title={t.categories}>
            <div className="flex flex-wrap gap-2">
              {categories.map((cat) => (
                <Chip
                  key={cat.id}
                  label={`${cat.icon ?? ""} ${cat.name}`.trim()}
                  active={filters.categoryIds.includes(cat.id)}
                  onClick={() => toggleCategory(cat.id)}
                />
              ))}
            </div>
          </Section>
        )}
      </div>

      <div className="mt-8 flex justify-end">
        <Button variant="primary" size="md" onClick={onClose}>
          {t.done}
        </Button>
      </div>
    </Modal>
  );
}

export { getDurationLabel };
