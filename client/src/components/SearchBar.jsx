import React from 'react';
import { Search, Plus, Filter } from 'lucide-react';
import { AGE_GROUPS } from '../constants';

/**
 * Search and filter toolbar with action buttons
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
  return (
    <div
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
  );
};

export default SearchBar;
