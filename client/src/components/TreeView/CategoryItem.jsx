import React from 'react';
import { ChevronRight, Edit3, Trash2, Plus } from 'lucide-react';
import { IconButton, Badge } from '../ui';
import SkillItem from './SkillItem';

/**
 * Single category item with expandable skills
 */
const CategoryItem = ({
  category,
  skills,
  isExpanded,
  onToggle,
  onEditCategory,
  onDeleteCategory,
  onAddSkill,
  onEditSkill,
  onDeleteSkill,
  onAddExercise,
  onPreviewExercise,
  onEditExercise,
  onDeleteExercise,
  getExercisesForSkill,
}) => {
  const handleToggle = () => {
    onToggle(category.id);
  };

  const handleEdit = (e) => {
    e.stopPropagation();
    onEditCategory(category);
  };

  const handleDelete = (e) => {
    e.stopPropagation();
    onDeleteCategory(category.id);
  };

  return (
    <div className="tree-category">
      {/* Category Header */}
      <div
        className="tree-category-header"
        onClick={handleToggle}
        style={{ borderLeft: `3px solid ${category.color}` }}
      >
        {/* Expand/Collapse Arrow */}
        <span
          style={{
            transition: 'transform 0.2s',
            transform: isExpanded ? 'rotate(90deg)' : 'rotate(0deg)',
          }}
        >
          <ChevronRight size={18} color="#71717a" />
        </span>

        {/* Category Icon & Name */}
        <span style={{ fontSize: 20 }}>{category.icon}</span>
        <span style={{ fontWeight: 600, flex: 1 }}>{category.name}</span>

        {/* Skills Count Badge */}
        <Badge color={category.color}>
          {skills.length} {skills.length === 1 ? 'skill' : 'skills'}
        </Badge>

        {/* Actions */}
        <div style={{ display: 'flex', gap: 4 }}>
          <IconButton onClick={handleEdit} title="Edit category">
            <Edit3 size={14} />
          </IconButton>
          <IconButton danger onClick={handleDelete} title="Delete category">
            <Trash2 size={14} />
          </IconButton>
        </div>
      </div>

      {/* Expanded Content */}
      {isExpanded && (
        <div style={{ marginTop: 4 }}>
          {skills.length === 0 ? (
            <div
              className="tree-skill"
              style={{ color: '#52525b', fontStyle: 'italic' }}
            >
              No skills yet. Add one!
            </div>
          ) : (
            skills.map((skill) => (
              <SkillItem
                key={skill.id}
                skill={skill}
                exercises={getExercisesForSkill(skill.id)}
                onAddExercise={onAddExercise}
                onEditSkill={onEditSkill}
                onDeleteSkill={onDeleteSkill}
                onPreviewExercise={onPreviewExercise}
                onEditExercise={onEditExercise}
                onDeleteExercise={onDeleteExercise}
              />
            ))
          )}

          {/* Add Skill Button */}
          <button
            className="btn-secondary"
            style={{ marginLeft: 32, marginTop: 8 }}
            onClick={() => onAddSkill(category)}
          >
            <Plus size={14} /> Add Skill to {category.name}
          </button>
        </div>
      )}
    </div>
  );
};

export default CategoryItem;
