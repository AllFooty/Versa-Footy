import React, { useState } from 'react';
import { Search, Plus, Filter, X, Video, Zap, FolderOpen } from 'lucide-react';
import { AGE_GROUPS } from '../constants';

/**
 * Search and filter toolbar with action buttons
 * Mobile-responsive with FAB menu
 */
const SearchBar = ({
  searchTerm,
  onSearchChange,
  filterAgeGroup,
  onFilterChange,
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
      {/* Desktop Search Bar */}
      <div
        className="desktop-search-bar"
        style={{
          display: 'flex',
          alignItems: 'center',
          gap: 16,
          marginBottom: 32,
          flexWrap: 'wrap',
        }}
      >
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
            style={{ paddingLeft: 44 }}
            value={searchTerm}
            onChange={(e) => onSearchChange(e.target.value)}
          />
        </div>

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
                {age}
              </option>
            ))}
          </select>
        </div>

        {/* Action Buttons */}
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

      {/* Mobile Search Bar */}
      <div className="mobile-search-container">
        {/* Search Row */}
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
            type="text"
            placeholder="Search skills, exercises..."
            className="input"
            style={{ paddingLeft: 44 }}
            value={searchTerm}
            onChange={(e) => onSearchChange(e.target.value)}
          />
        </div>
        
        {/* Filter Row - Full Width */}
        <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
          <Filter size={16} color="#71717a" style={{ flexShrink: 0 }} />
          <select
            className="select"
            style={{ 
              flex: 1, 
              minWidth: 0,
              fontSize: '16px', /* Ensures readable dropdown options on mobile */
            }}
            value={filterAgeGroup}
            onChange={(e) => onFilterChange(e.target.value)}
          >
            <option value="">All Age Groups</option>
            {AGE_GROUPS.map((age) => (
              <option key={age} value={age}>
                {age}
              </option>
            ))}
          </select>
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
