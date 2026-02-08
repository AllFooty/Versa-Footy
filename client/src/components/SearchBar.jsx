import React, { useState } from 'react';
import { Search, Plus, Filter, X, Video, Zap, FolderOpen } from 'lucide-react';
import { AGE_GROUPS } from '../constants';

/**
 * Pill-shaped filter toggle chip
 */
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

/**
 * Search and filter toolbar with action buttons
 * Mobile-responsive with FAB menu
 */
const SearchBar = ({
  searchTerm,
  onSearchChange,
  filterAgeGroup,
  onFilterChange,
  exerciseFilter,
  onExerciseFilterChange,
  exactAgeMatch,
  onExactAgeMatchChange,
  onAddExercise,
  onAddSkill,
  onAddCategory,
}) => {
  const [fabOpen, setFabOpen] = useState(false);

  const handleFabAction = (action) => {
    setFabOpen(false);
    action();
  };

  return (
    <>
      {/* Desktop Toolbar */}
      <div className="desktop-search-bar">
        {/* Row 1: Search + Action Buttons */}
        <div className="toolbar-row-1">
          {/* Search Input */}
          <div style={{ position: 'relative', flex: 1, minWidth: 280 }}>
            <Search
              size={18}
              style={{
                position: 'absolute',
                left: 14,
                top: '50%',
                transform: 'translateY(-50%)',
                color: '#52525b',
              }}
            />
            <input
              type="text"
              placeholder="Search skills, exercises..."
              className="input"
              style={{ paddingLeft: 44, paddingRight: searchTerm ? 44 : 16 }}
              value={searchTerm}
              onChange={(e) => onSearchChange(e.target.value)}
            />
            {searchTerm && (
              <button
                onClick={() => onSearchChange('')}
                style={{
                  position: 'absolute',
                  right: 8,
                  top: '50%',
                  transform: 'translateY(-50%)',
                  background: 'rgba(255, 255, 255, 0.1)',
                  border: 'none',
                  borderRadius: '50%',
                  width: 28,
                  height: 28,
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  cursor: 'pointer',
                  color: '#a1a1aa',
                  padding: 0,
                }}
                title="Clear search"
                aria-label="Clear search"
              >
                <X size={14} />
              </button>
            )}
          </div>

          {/* Action Buttons */}
          <div className="toolbar-actions">
            <button className="btn-primary" onClick={onAddExercise}>
              <Plus size={18} /> Add Exercise
            </button>
            <button className="btn-secondary" onClick={onAddSkill}>
              <Plus size={16} /> Add Skill
            </button>
            <button className="btn-secondary" onClick={onAddCategory}>
              <Plus size={16} /> Add Category
            </button>
          </div>
        </div>

        {/* Row 2: Filters */}
        <div className="toolbar-row-2">
          {/* Age Filter */}
          <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
            <Filter size={16} color="#71717a" />
            <select
              className="select"
              style={{ width: 140 }}
              value={filterAgeGroup}
              onChange={(e) => onFilterChange(e.target.value)}
            >
              <option value="">All Ages</option>
              {AGE_GROUPS.map((age) => (
                <option key={age} value={age}>
                  {age} {!exactAgeMatch && '& below'}
                </option>
              ))}
            </select>
          </div>

          {/* Exact Age Chip */}
          {filterAgeGroup && (
            <FilterChip
              label="Exact age only"
              active={exactAgeMatch}
              onClick={() => onExactAgeMatchChange(!exactAgeMatch)}
            />
          )}

          {/* Exercise Filter Chips */}
          <div className="filter-chip-group">
            <FilterChip
              label="All"
              active={exerciseFilter === 'all'}
              onClick={() => onExerciseFilterChange('all')}
            />
            <FilterChip
              label="Has Exercises"
              active={exerciseFilter === 'has'}
              onClick={() => onExerciseFilterChange('has')}
            />
            <FilterChip
              label="No Exercises"
              active={exerciseFilter === 'none'}
              onClick={() => onExerciseFilterChange('none')}
            />
          </div>
        </div>
      </div>

      {/* Mobile Toolbar */}
      <div className="mobile-search-container">
        {/* Row 1: Search Input */}
        <div style={{ position: 'relative', width: '100%' }}>
          <Search
            size={18}
            style={{
              position: 'absolute',
              left: 14,
              top: '50%',
              transform: 'translateY(-50%)',
              color: '#52525b',
            }}
          />
          <input
            type="search"
            enterKeyHint="search"
            placeholder="Search skills, exercises..."
            className="input"
            style={{ paddingLeft: 44, paddingRight: searchTerm ? 48 : 16 }}
            value={searchTerm}
            onChange={(e) => onSearchChange(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === 'Enter') e.target.blur();
            }}
          />
          {searchTerm && (
            <button
              onClick={() => onSearchChange('')}
              style={{
                position: 'absolute',
                right: 6,
                top: '50%',
                transform: 'translateY(-50%)',
                background: 'rgba(255, 255, 255, 0.1)',
                border: 'none',
                borderRadius: '50%',
                width: 36,
                height: 36,
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                cursor: 'pointer',
                color: '#a1a1aa',
                padding: 0,
              }}
              title="Clear search"
              aria-label="Clear search"
            >
              <X size={16} />
            </button>
          )}
        </div>

        {/* Row 2: Age Filter Dropdown */}
        <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
          <Filter size={16} color="#71717a" style={{ flexShrink: 0 }} />
          <select
            className="select"
            style={{
              flex: 1,
              minWidth: 0,
              fontSize: '16px',
            }}
            value={filterAgeGroup}
            onChange={(e) => onFilterChange(e.target.value)}
          >
            <option value="">All Age Groups</option>
            {AGE_GROUPS.map((age) => (
              <option key={age} value={age}>
                {age} {!exactAgeMatch && '& below'}
              </option>
            ))}
          </select>
        </div>

        {/* Row 3: Filter Chips */}
        <div className="filter-chips-row">
          {/* Exercise Filter Chips */}
          <div className="filter-chip-group">
            <FilterChip
              label="All"
              active={exerciseFilter === 'all'}
              onClick={() => onExerciseFilterChange('all')}
            />
            <FilterChip
              label="Has Exercises"
              active={exerciseFilter === 'has'}
              onClick={() => onExerciseFilterChange('has')}
            />
            <FilterChip
              label="No Exercises"
              active={exerciseFilter === 'none'}
              onClick={() => onExerciseFilterChange('none')}
            />
          </div>

          {/* Exact Age Chip */}
          {filterAgeGroup && (
            <FilterChip
              label="Exact age only"
              active={exactAgeMatch}
              onClick={() => onExactAgeMatchChange(!exactAgeMatch)}
            />
          )}
        </div>
      </div>

      {/* Floating Action Button (Mobile) */}
      <div className="fab-container">
        {/* Backdrop for FAB menu */}
        {fabOpen && (
          <div
            style={{
              position: 'fixed',
              top: 0,
              left: 0,
              right: 0,
              bottom: 0,
              background: 'rgba(0,0,0,0.5)',
              zIndex: -1,
            }}
            onClick={() => setFabOpen(false)}
          />
        )}

        {/* FAB Menu Items */}
        <div className={`fab-menu ${fabOpen ? 'open' : ''}`}>
          <button
            className="fab-menu-item"
            onClick={() => handleFabAction(onAddExercise)}
          >
            <Video size={18} color="#3b82f6" />
            Add Exercise
          </button>
          <button
            className="fab-menu-item"
            onClick={() => handleFabAction(onAddSkill)}
          >
            <Zap size={18} color="#22c55e" />
            Add Skill
          </button>
          <button
            className="fab-menu-item"
            onClick={() => handleFabAction(onAddCategory)}
          >
            <FolderOpen size={18} color="#f97316" />
            Add Category
          </button>
        </div>

        {/* FAB Button */}
        <button
          className="fab-button"
          onClick={() => setFabOpen(!fabOpen)}
          style={{
            transform: fabOpen ? 'rotate(45deg)' : 'rotate(0deg)',
          }}
        >
          {fabOpen ? <X size={24} /> : <Plus size={24} />}
        </button>
      </div>

      {/* Inline style for desktop-only display */}
      <style>{`
        @media (max-width: 768px) {
          .desktop-search-bar {
            display: none !important;
          }
        }
        @media (min-width: 769px) {
          .mobile-search-container {
            display: none !important;
          }
          .fab-container {
            display: none !important;
          }
        }
      `}</style>
    </>
  );
};

export default SearchBar;
