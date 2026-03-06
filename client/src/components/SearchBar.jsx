import React, { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { Search, Plus, Filter, X, Video, Zap, FolderOpen, SlidersHorizontal } from 'lucide-react';

/**
 * Search toolbar with filter toggle and action buttons.
 * Mobile-responsive with FAB menu.
 */
const SearchBar = ({
  searchTerm,
  onSearchChange,
  activeFilterCount,
  isFilterPanelOpen,
  onToggleFilters,
  onAddExercise,
  onAddSkill,
  onAddCategory,
}) => {
  const { t } = useTranslation();
  const [fabOpen, setFabOpen] = useState(false);

  const handleFabAction = (action) => {
    setFabOpen(false);
    action();
  };

  return (
    <>
      {/* Desktop Toolbar */}
      <div className="desktop-search-bar">
        <div className="toolbar-row-1">
          {/* Search Input */}
          <div style={{ position: 'relative', flex: 1, minWidth: 280 }}>
            <Search
              size={18}
              style={{
                position: 'absolute',
                insetInlineStart: 14,
                top: '50%',
                transform: 'translateY(-50%)',
                color: '#52525b',
              }}
            />
            <input
              type="text"
              placeholder={t('library.searchPlaceholder')}
              className="input"
              style={{ paddingInlineStart: 44, paddingInlineEnd: searchTerm ? 44 : 16 }}
              value={searchTerm}
              onChange={(e) => onSearchChange(e.target.value)}
            />
            {searchTerm && (
              <button
                onClick={() => onSearchChange('')}
                style={{
                  position: 'absolute',
                  insetInlineEnd: 8,
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
                title={t('library.clearSearch')}
                aria-label={t('library.clearSearch')}
              >
                <X size={14} />
              </button>
            )}
          </div>

          {/* Filter Toggle Button */}
          <button
            className={`btn-filter-toggle ${isFilterPanelOpen ? 'btn-filter-toggle--active' : ''}`}
            onClick={onToggleFilters}
            type="button"
            title={t('filters.title', 'Filters')}
            aria-label={t('filters.title', 'Filters')}
            aria-expanded={isFilterPanelOpen}
          >
            <SlidersHorizontal size={18} />
            {activeFilterCount > 0 && (
              <span className="filter-badge">{activeFilterCount}</span>
            )}
          </button>

          {/* Action Buttons */}
          <div className="toolbar-actions">
            <button className="btn-primary" onClick={onAddExercise}>
              <Plus size={18} /> {t('library.addExercise')}
            </button>
            <button className="btn-secondary" onClick={onAddSkill}>
              <Plus size={16} /> {t('library.addSkill')}
            </button>
            <button className="btn-secondary" onClick={onAddCategory}>
              <Plus size={16} /> {t('library.addCategory')}
            </button>
          </div>
        </div>
      </div>

      {/* Mobile Toolbar */}
      <div className="mobile-search-container">
        <div className="mobile-search-row">
          {/* Search Input */}
          <div style={{ position: 'relative', flex: 1 }}>
            <Search
              size={18}
              style={{
                position: 'absolute',
                insetInlineStart: 14,
                top: '50%',
                transform: 'translateY(-50%)',
                color: '#52525b',
              }}
            />
            <input
              type="search"
              enterKeyHint="search"
              placeholder={t('library.searchPlaceholder')}
              className="input"
              style={{ paddingInlineStart: 44, paddingInlineEnd: searchTerm ? 48 : 16 }}
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
                  insetInlineEnd: 6,
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
                title={t('library.clearSearch')}
                aria-label={t('library.clearSearch')}
              >
                <X size={16} />
              </button>
            )}
          </div>

          {/* Filter Toggle Button (Mobile) */}
          <button
            className={`btn-filter-toggle ${isFilterPanelOpen ? 'btn-filter-toggle--active' : ''}`}
            onClick={onToggleFilters}
            type="button"
            aria-label={t('filters.title', 'Filters')}
            aria-expanded={isFilterPanelOpen}
          >
            <SlidersHorizontal size={18} />
            {activeFilterCount > 0 && (
              <span className="filter-badge">{activeFilterCount}</span>
            )}
          </button>
        </div>
      </div>

      {/* Floating Action Button (Mobile) */}
      <div className="fab-container">
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

        <div className={`fab-menu ${fabOpen ? 'open' : ''}`}>
          <button
            className="fab-menu-item"
            onClick={() => handleFabAction(onAddExercise)}
          >
            <Video size={18} color="#3b82f6" />
            {t('library.addExercise')}
          </button>
          <button
            className="fab-menu-item"
            onClick={() => handleFabAction(onAddSkill)}
          >
            <Zap size={18} color="#22c55e" />
            {t('library.addSkill')}
          </button>
          <button
            className="fab-menu-item"
            onClick={() => handleFabAction(onAddCategory)}
          >
            <FolderOpen size={18} color="#f97316" />
            {t('library.addCategory')}
          </button>
        </div>

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
