import React from 'react';
import { useTranslation } from 'react-i18next';
import { X } from 'lucide-react';
import { getDurationLabel } from '../constants';

const ActiveFilterChips = ({ filters, updateFilter, clearAllFilters, categories, activeFilterCount }) => {
  const { t } = useTranslation();

  if (activeFilterCount === 0) return null;

  const chips = [];

  // Age group
  if (filters.ageGroup) {
    const suffix = filters.exactAgeMatch ? ` (${t('filters.exact', 'exact')})` : ` ${t('library.andBelow')}`;
    chips.push({
      label: `${filters.ageGroup}${suffix}`,
      onRemove: () => { updateFilter('ageGroup', ''); updateFilter('exactAgeMatch', false); },
    });
  }

  // Difficulty range
  if (filters.difficultyMin != null || filters.difficultyMax != null) {
    const min = filters.difficultyMin ?? 1;
    const max = filters.difficultyMax ?? 5;
    const label = min === max
      ? `${min}★`
      : `${min}–${max}★`;
    chips.push({
      label: `${t('filters.difficulty', 'Difficulty')}: ${label}`,
      onRemove: () => { updateFilter('difficultyMin', null); updateFilter('difficultyMax', null); },
    });
  }

  // Equipment
  if (filters.noEquipment) {
    chips.push({
      label: t('filters.noEquipment', 'No Equipment'),
      onRemove: () => updateFilter('noEquipment', false),
    });
  } else if (filters.equipment.length > 0) {
    const names = filters.equipment.map((eq) => t(`constants.equipment.${eq}`, eq));
    chips.push({
      label: names.length <= 2 ? names.join(', ') : `${names.length} ${t('filters.equipment', 'Equipment')}`,
      onRemove: () => updateFilter('equipment', []),
    });
  }

  // Duration
  if (filters.durationMin != null || filters.durationMax != null) {
    const parts = [];
    if (filters.durationMin != null) parts.push(`≥ ${getDurationLabel(filters.durationMin, true)}`);
    if (filters.durationMax != null) parts.push(`≤ ${getDurationLabel(filters.durationMax, true)}`);
    chips.push({
      label: `${t('filters.duration', 'Duration')}: ${parts.join(', ')}`,
      onRemove: () => { updateFilter('durationMin', null); updateFilter('durationMax', null); },
    });
  }

  // Exercise status
  if (filters.exerciseFilter !== 'all') {
    chips.push({
      label: filters.exerciseFilter === 'has'
        ? t('library.filterHasExercises')
        : t('library.filterNoExercises'),
      onRemove: () => updateFilter('exerciseFilter', 'all'),
    });
  }

  // Has video
  if (filters.hasVideo != null) {
    chips.push({
      label: filters.hasVideo
        ? t('filters.hasVideo', 'Has Video')
        : t('filters.noVideo', 'No Video'),
      onRemove: () => updateFilter('hasVideo', null),
    });
  }

  // Combo filter
  if (filters.comboFilter !== 'either') {
    chips.push({
      label: filters.comboFilter === 'combo'
        ? t('filters.combo', 'Combo')
        : t('filters.singleSkill', 'Single Skill'),
      onRemove: () => updateFilter('comboFilter', 'either'),
    });
  }

  // Category filter
  if (filters.categoryIds.length > 0) {
    const names = filters.categoryIds
      .map((id) => categories.find((c) => c.id === id))
      .filter(Boolean)
      .map((c) => c.name);
    chips.push({
      label: names.length <= 2
        ? names.join(', ')
        : `${names.length} ${t('filters.categories', 'Categories')}`,
      onRemove: () => updateFilter('categoryIds', []),
    });
  }

  return (
    <div className="active-filter-chips">
      {chips.map((chip, i) => (
        <span key={i} className="active-chip">
          {chip.label}
          <button
            onClick={chip.onRemove}
            className="active-chip-remove"
            type="button"
            aria-label={`Remove ${chip.label} filter`}
          >
            <X size={12} />
          </button>
        </span>
      ))}
      {chips.length > 1 && (
        <button
          className="active-chip active-chip--clear"
          onClick={clearAllFilters}
          type="button"
        >
          {t('filters.clearAll', 'Clear All')}
        </button>
      )}
    </div>
  );
};

export default ActiveFilterChips;
