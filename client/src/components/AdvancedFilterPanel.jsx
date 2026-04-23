import React, { useState, useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import { X, SlidersHorizontal } from 'lucide-react';
import { AGE_GROUPS, EQUIPMENT_OPTIONS, getDifficultyOptions, DURATION_OPTIONS } from '../constants';

const FilterChip = ({ label, active, onClick }) => (
  <button
    className={`filter-chip ${active ? 'filter-chip--active' : ''}`}
    onClick={onClick}
    type="button"
    aria-pressed={active}
  >
    {label}
  </button>
);

const FilterSection = ({ title, children }) => (
  <div className="filter-section">
    <div className="filter-section-label">{title}</div>
    {children}
  </div>
);

const AdvancedFilterPanel = ({
  filters,
  updateFilter,
  clearAllFilters,
  categories,
  isOpen,
  onClose,
}) => {
  const { t } = useTranslation();
  const [isMobile, setIsMobile] = useState(false);

  useEffect(() => {
    const checkMobile = () => setIsMobile(window.innerWidth <= 768);
    checkMobile();
    window.addEventListener('resize', checkMobile);
    return () => window.removeEventListener('resize', checkMobile);
  }, []);

  const content = (
    <div className="filter-panel-grid">
      {/* Difficulty */}
      <FilterSection title={t('filters.difficulty', 'Difficulty')}>
        <div style={{ display: 'flex', gap: 8, alignItems: 'center' }}>
          <select
            className="select filter-select"
            value={filters.difficultyMin ?? ''}
            onChange={(e) => updateFilter('difficultyMin', e.target.value ? Number(e.target.value) : null)}
          >
            <option value="">{t('filters.min', 'Min')}</option>
            {getDifficultyOptions(t).map((opt) => (
              <option key={opt.value} value={opt.value}>{opt.value}★</option>
            ))}
          </select>
          <span style={{ color: 'var(--color-text-muted)', fontSize: 13 }}>–</span>
          <select
            className="select filter-select"
            value={filters.difficultyMax ?? ''}
            onChange={(e) => updateFilter('difficultyMax', e.target.value ? Number(e.target.value) : null)}
          >
            <option value="">{t('filters.max', 'Max')}</option>
            {getDifficultyOptions(t).map((opt) => (
              <option key={opt.value} value={opt.value}>{opt.value}★</option>
            ))}
          </select>
        </div>
      </FilterSection>

      {/* Age Group */}
      <FilterSection title={t('filters.ageGroup', 'Age Group')}>
        <select
          className="select filter-select"
          value={filters.ageGroup}
          onChange={(e) => updateFilter('ageGroup', e.target.value)}
        >
          <option value="">{t('library.allAges')}</option>
          {AGE_GROUPS.map((age) => (
            <option key={age} value={age}>
              {age} {!filters.exactAgeMatch && t('library.andBelow')}
            </option>
          ))}
        </select>
        {filters.ageGroup && (
          <div style={{ marginTop: 6 }}>
            <FilterChip
              label={t('library.exactAgeOnly')}
              active={filters.exactAgeMatch}
              onClick={() => updateFilter('exactAgeMatch', !filters.exactAgeMatch)}
            />
          </div>
        )}
      </FilterSection>

      {/* Exercise Status */}
      <FilterSection title={t('filters.exerciseStatus', 'Exercise Status')}>
        <div className="filter-chip-group">
          <FilterChip
            label={t('library.filterAll')}
            active={filters.exerciseFilter === 'all'}
            onClick={() => updateFilter('exerciseFilter', 'all')}
          />
          <FilterChip
            label={t('library.filterHasExercises')}
            active={filters.exerciseFilter === 'has'}
            onClick={() => updateFilter('exerciseFilter', 'has')}
          />
          <FilterChip
            label={t('library.filterNoExercises')}
            active={filters.exerciseFilter === 'none'}
            onClick={() => updateFilter('exerciseFilter', 'none')}
          />
        </div>
      </FilterSection>

      {/* Equipment */}
      <FilterSection title={t('filters.equipment', 'Equipment')}>
        <div style={{ display: 'flex', flexWrap: 'wrap', gap: 6 }}>
          <FilterChip
            label={t('filters.noEquipment', 'No Equipment')}
            active={filters.noEquipment}
            onClick={() => {
              if (!filters.noEquipment) {
                updateFilter('equipment', []);
              }
              updateFilter('noEquipment', !filters.noEquipment);
            }}
          />
          {EQUIPMENT_OPTIONS.map((eq) => (
            <FilterChip
              key={eq}
              label={t(`constants.equipment.${eq}`, eq)}
              active={filters.equipment.includes(eq)}
              onClick={() => {
                if (filters.noEquipment) updateFilter('noEquipment', false);
                const newEquipment = filters.equipment.includes(eq)
                  ? filters.equipment.filter((e) => e !== eq)
                  : [...filters.equipment, eq];
                updateFilter('equipment', newEquipment);
              }}
            />
          ))}
        </div>
      </FilterSection>

      {/* Duration */}
      <FilterSection title={t('filters.duration', 'Duration')}>
        <div style={{ display: 'flex', gap: 8, alignItems: 'center' }}>
          <select
            className="select filter-select"
            value={filters.durationMin ?? ''}
            onChange={(e) => updateFilter('durationMin', e.target.value ? Number(e.target.value) : null)}
          >
            <option value="">{t('filters.min', 'Min')}</option>
            {DURATION_OPTIONS.filter((o) => o.value !== null).map((opt) => (
              <option key={opt.value} value={opt.value}>{opt.label}</option>
            ))}
          </select>
          <span style={{ color: 'var(--color-text-muted)', fontSize: 13 }}>–</span>
          <select
            className="select filter-select"
            value={filters.durationMax ?? ''}
            onChange={(e) => updateFilter('durationMax', e.target.value ? Number(e.target.value) : null)}
          >
            <option value="">{t('filters.max', 'Max')}</option>
            {DURATION_OPTIONS.filter((o) => o.value !== null).map((opt) => (
              <option key={opt.value} value={opt.value}>{opt.label}</option>
            ))}
          </select>
        </div>
      </FilterSection>

      {/* Has Video */}
      <FilterSection title={t('filters.video', 'Video')}>
        <div className="filter-chip-group">
          <FilterChip
            label={t('filters.either', 'Either')}
            active={filters.hasVideo === null}
            onClick={() => updateFilter('hasVideo', null)}
          />
          <FilterChip
            label={t('filters.hasVideo', 'Has Video')}
            active={filters.hasVideo === true}
            onClick={() => updateFilter('hasVideo', true)}
          />
          <FilterChip
            label={t('filters.noVideo', 'No Video')}
            active={filters.hasVideo === false}
            onClick={() => updateFilter('hasVideo', false)}
          />
        </div>
      </FilterSection>

      {/* Exercise Type (Single/Combo) */}
      <FilterSection title={t('filters.exerciseType', 'Exercise Type')}>
        <div className="filter-chip-group">
          <FilterChip
            label={t('filters.either', 'Either')}
            active={filters.comboFilter === 'either'}
            onClick={() => updateFilter('comboFilter', 'either')}
          />
          <FilterChip
            label={t('filters.singleSkill', 'Single Skill')}
            active={filters.comboFilter === 'single'}
            onClick={() => updateFilter('comboFilter', 'single')}
          />
          <FilterChip
            label={t('filters.combo', 'Combo')}
            active={filters.comboFilter === 'combo'}
            onClick={() => updateFilter('comboFilter', 'combo')}
          />
        </div>
      </FilterSection>

      {/* Categories */}
      {categories.length > 1 && (
        <FilterSection title={t('filters.categories', 'Categories')}>
          <div style={{ display: 'flex', flexWrap: 'wrap', gap: 6 }}>
            {categories.map((cat) => (
              <FilterChip
                key={cat.id}
                label={`${cat.icon || ''} ${cat.name}`.trim()}
                active={filters.categoryIds.includes(cat.id)}
                onClick={() => {
                  const newIds = filters.categoryIds.includes(cat.id)
                    ? filters.categoryIds.filter((id) => id !== cat.id)
                    : [...filters.categoryIds, cat.id];
                  updateFilter('categoryIds', newIds);
                }}
              />
            ))}
          </div>
        </FilterSection>
      )}
    </div>
  );

  // Mobile: bottom sheet
  if (isMobile) {
    if (!isOpen) return null;
    return (
      <div className="modal-overlay" onClick={onClose}>
        <div className="filter-bottom-sheet" onClick={(e) => e.stopPropagation()}>
          <div className="modal-drag-handle" />
          <div className="filter-bottom-sheet-header">
            <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
              <SlidersHorizontal size={18} />
              <h3 style={{ margin: 0, fontSize: 17, fontWeight: 600 }}>
                {t('filters.title', 'Filters')}
              </h3>
            </div>
            <button
              className="filter-clear-btn"
              onClick={clearAllFilters}
              type="button"
            >
              {t('filters.clearAll', 'Clear All')}
            </button>
          </div>
          <div className="filter-bottom-sheet-content">
            {content}
          </div>
          <div className="filter-bottom-sheet-footer">
            <button className="btn-primary" onClick={onClose} style={{ width: '100%' }}>
              {t('filters.showResults', 'Show Results')}
            </button>
          </div>
        </div>
      </div>
    );
  }

  // Desktop: collapsible panel
  return (
    <div className={`filter-panel-desktop ${isOpen ? 'filter-panel-desktop--open' : ''}`}>
      <div className="filter-panel-inner">
        <div className="filter-panel-header">
          <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
            <SlidersHorizontal size={16} color="var(--color-text-muted)" />
            <span className="filter-section-label" style={{ margin: 0 }}>
              {t('filters.title', 'Filters')}
            </span>
          </div>
          <button
            className="filter-clear-btn"
            onClick={clearAllFilters}
            type="button"
          >
            {t('filters.clearAll', 'Clear All')}
          </button>
        </div>
        {content}
      </div>
    </div>
  );
};

export default AdvancedFilterPanel;
