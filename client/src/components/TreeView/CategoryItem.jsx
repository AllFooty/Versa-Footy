import React, { useState, useRef, useEffect } from 'react';
import { ChevronRight, Edit3, Trash2, Plus, MoreVertical } from 'lucide-react';
import { IconButton, Badge } from '../ui';
import SkillItem from './SkillItem';
import DeleteCategoryModal from '../modals/DeleteCategoryModal';
import ActionSheet from '../ui/ActionSheet';

/**
 * Single category item with expandable skills
 * Mobile-responsive with touch-friendly interactions
 */
const CategoryItem = ({
  category,
  skills,
  isExpanded,
  onToggle,
  expandedSkills,
  onToggleSkill,
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
  isMobile = false,
}) => {
  const [menuOpen, setMenuOpen] = useState(false);
  const [deleteModalOpen, setDeleteModalOpen] = useState(false);
  const menuRef = useRef(null);

  // Close menu when clicking outside (desktop only)
  useEffect(() => {
    if (isMobile) return;

    const handleClickOutside = (e) => {
      if (menuRef.current && !menuRef.current.contains(e.target)) {
        setMenuOpen(false);
      }
    };

    if (menuOpen) {
      document.addEventListener('mousedown', handleClickOutside);
      document.addEventListener('touchstart', handleClickOutside);
    }
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
      document.removeEventListener('touchstart', handleClickOutside);
    };
  }, [menuOpen, isMobile]);

  const handleToggle = () => {
    onToggle(category.id);
  };

  const handleMenuToggle = (e) => {
    e.stopPropagation();
    setMenuOpen((prev) => !prev);
  };

  const handleEdit = (e) => {
    e.stopPropagation();
    setMenuOpen(false);
    onEditCategory(category);
  };

  const handleDelete = (e) => {
    e.stopPropagation();
    setMenuOpen(false);
    setDeleteModalOpen(true);
  };

  // Count total exercises across all skills in this category
  const totalExercises = skills.reduce(
    (count, skill) => count + getExercisesForSkill(skill.id).length,
    0
  );

  return (
    <div className="tree-category">
      {/* Category Header */}
      <div
        className="tree-category-header touchable"
        onClick={handleToggle}
        style={{
          borderLeft: `3px solid ${category.color}`,
          minHeight: isMobile ? 56 : 'auto',
        }}
      >
        {/* Expand/Collapse Arrow */}
        <span
          style={{
            transition: 'transform 0.2s',
            transform: isExpanded ? 'rotate(90deg)' : 'rotate(0deg)',
            display: 'flex',
            alignItems: 'center',
          }}
        >
          <ChevronRight size={isMobile ? 20 : 18} color="#71717a" />
        </span>

        {/* Category Icon & Name */}
        <span style={{ fontSize: isMobile ? 22 : 20 }}>{category.icon}</span>
        <span style={{
          fontWeight: 600,
          flex: 1,
          fontSize: isMobile ? 15 : 14,
        }}>
          {category.name}
        </span>

        {/* Skills Count Badge */}
        <Badge color={category.color}>
          {skills.length} {skills.length === 1 ? 'skill' : 'skills'}
        </Badge>

        {/* Kebab Menu */}
        <div ref={menuRef} style={{ position: 'relative' }}>
          <IconButton
            onClick={handleMenuToggle}
            title="Category options"
            style={{
              minWidth: isMobile ? 44 : 32,
              minHeight: isMobile ? 44 : 32,
            }}
          >
            <MoreVertical size={isMobile ? 18 : 16} />
          </IconButton>

          {!isMobile && menuOpen && (
            <div
              style={{
                position: 'absolute',
                top: '100%',
                right: 0,
                marginTop: 4,
                backgroundColor: '#1e1e24',
                border: '1px solid #2e2e38',
                borderRadius: 8,
                boxShadow: '0 4px 20px rgba(0, 0, 0, 0.4)',
                zIndex: 50,
                minWidth: 140,
                overflow: 'hidden',
              }}
            >
              <button
                onClick={handleEdit}
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: 10,
                  width: '100%',
                  padding: '10px 12px',
                  backgroundColor: 'transparent',
                  border: 'none',
                  color: '#e4e4e7',
                  fontSize: 14,
                  cursor: 'pointer',
                  textAlign: 'left',
                }}
              >
                <Edit3 size={14} />
                Edit
              </button>
              <button
                onClick={handleDelete}
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: 10,
                  width: '100%',
                  padding: '10px 12px',
                  backgroundColor: 'transparent',
                  border: 'none',
                  color: '#ef4444',
                  fontSize: 14,
                  cursor: 'pointer',
                  textAlign: 'left',
                }}
              >
                <Trash2 size={14} />
                Delete
              </button>
            </div>
          )}
        </div>
      </div>

      {/* Mobile Action Sheet */}
      {isMobile && (
        <ActionSheet
          isOpen={menuOpen}
          onClose={() => setMenuOpen(false)}
          title={`${category.icon} ${category.name}`}
          items={[
            {
              icon: <Edit3 size={18} />,
              label: 'Edit Category',
              onClick: () => onEditCategory(category),
            },
            {
              icon: <Trash2 size={18} />,
              label: 'Delete Category',
              onClick: () => setDeleteModalOpen(true),
              danger: true,
            },
          ]}
        />
      )}

      {/* Delete Confirmation Modal */}
      <DeleteCategoryModal
        isOpen={deleteModalOpen}
        category={category}
        skillCount={skills.length}
        exerciseCount={totalExercises}
        onConfirm={onDeleteCategory}
        onClose={() => setDeleteModalOpen(false)}
      />

      {/* Expanded Content */}
      {isExpanded && (
        <div style={{ marginTop: 4 }}>
          {skills.length === 0 ? (
            <div
              className="tree-skill"
              style={{
                color: '#52525b',
                fontStyle: 'italic',
                padding: isMobile ? '16px' : '10px 16px',
              }}
            >
              No skills yet. Add one!
            </div>
          ) : (
            skills.map((skill) => (
              <SkillItem
                key={skill.id}
                skill={skill}
                exercises={getExercisesForSkill(skill.id)}
                isExpanded={expandedSkills[skill.id] || false}
                onToggle={() => onToggleSkill(skill.id)}
                onAddExercise={onAddExercise}
                onEditSkill={onEditSkill}
                onDeleteSkill={onDeleteSkill}
                onPreviewExercise={onPreviewExercise}
                onEditExercise={onEditExercise}
                onDeleteExercise={onDeleteExercise}
                isMobile={isMobile}
              />
            ))
          )}

          {/* Add Skill Button */}
          <button
            className="btn-secondary"
            style={{
              marginLeft: isMobile ? 16 : 32,
              marginTop: 8,
              minHeight: isMobile ? 44 : 'auto',
              fontSize: isMobile ? 14 : 13,
            }}
            onClick={() => onAddSkill(category)}
          >
            <Plus size={isMobile ? 16 : 14} />
            {isMobile ? 'Add Skill' : `Add Skill to ${category.name}`}
          </button>
        </div>
      )}
    </div>
  );
};

export default CategoryItem;
