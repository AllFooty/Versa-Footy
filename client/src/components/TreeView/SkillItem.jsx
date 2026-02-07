import React, { useState, useRef, useEffect } from 'react';
import { FileText, Plus, Edit3, Trash2, MoreVertical, ChevronRight } from 'lucide-react';
import { IconButton, AgeBadge, SkillCountBadge } from '../ui';
import ExerciseItem from './ExerciseItem';
import DeleteSkillModal from '../modals/DeleteSkillModal';
import ActionSheet from '../ui/ActionSheet';

/**
 * Single skill item with its exercises
 * Mobile-responsive with touch-friendly interactions
 * Collapsible to show/hide exercises
 */
const SkillItem = ({
  skill,
  exercises,
  isExpanded = false,
  onToggle,
  onAddExercise,
  onEditSkill,
  onDeleteSkill,
  onPreviewExercise,
  onEditExercise,
  onDeleteExercise,
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

  const handleDeleteSkill = () => {
    setMenuOpen(false);
    setDeleteModalOpen(true);
  };

  const handleEdit = () => {
    setMenuOpen(false);
    onEditSkill(skill);
  };

  const handleAddExercise = () => {
    setMenuOpen(false);
    onAddExercise(skill);
  };

  return (
    <div>
      {/* Skill Header */}
      <div
        className="tree-skill touchable"
        onClick={onToggle}
        style={{
          display: 'flex',
          alignItems: 'center',
          gap: isMobile ? 10 : 12,
          padding: isMobile ? '12px' : '10px 16px',
          marginLeft: isMobile ? 8 : 32,
          cursor: 'pointer',
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
          <ChevronRight size={isMobile ? 16 : 14} color="#71717a" />
        </span>

        <FileText size={isMobile ? 18 : 16} color="#71717a" />

        <span style={{ flex: 1, fontWeight: 500, fontSize: isMobile ? 14 : 14 }}>
          {skill.name}
        </span>

        <AgeBadge age={skill.ageGroup} />
        <SkillCountBadge count={exercises.length} />

        {/* Kebab Menu */}
        <div ref={menuRef} style={{ position: 'relative' }}>
          <IconButton
            onClick={(e) => {
              e.stopPropagation();
              setMenuOpen(!menuOpen);
            }}
            title="Skill options"
            style={isMobile ? { minWidth: 40, minHeight: 40 } : {}}
          >
            <MoreVertical size={isMobile ? 18 : 16} />
          </IconButton>

          {!isMobile && menuOpen && (
            <div
              onClick={(e) => e.stopPropagation()}
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
                minWidth: 160,
                overflow: 'hidden',
              }}
            >
              <button
                onClick={handleAddExercise}
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: 10,
                  width: '100%',
                  padding: '10px 12px',
                  backgroundColor: 'transparent',
                  border: 'none',
                  color: '#22c55e',
                  fontSize: 14,
                  cursor: 'pointer',
                  textAlign: 'left',
                }}
              >
                <Plus size={14} />
                Add Exercise
              </button>
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
                Edit Skill
              </button>
              <button
                onClick={handleDeleteSkill}
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
                Delete Skill
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
          title={skill.name}
          items={[
            {
              icon: <Plus size={18} color="#22c55e" />,
              label: 'Add Exercise',
              onClick: () => onAddExercise(skill),
            },
            {
              icon: <Edit3 size={18} />,
              label: 'Edit Skill',
              onClick: () => onEditSkill(skill),
            },
            {
              icon: <Trash2 size={18} />,
              label: 'Delete Skill',
              onClick: () => setDeleteModalOpen(true),
              danger: true,
            },
          ]}
        />
      )}

      {/* Delete Confirmation Modal */}
      <DeleteSkillModal
        isOpen={deleteModalOpen}
        skill={skill}
        exerciseCount={exercises.length}
        onConfirm={onDeleteSkill}
        onClose={() => setDeleteModalOpen(false)}
      />

      {/* Exercises List - Only show when expanded */}
      {isExpanded && exercises.length > 0 && (
        <div style={{
          marginLeft: isMobile ? 20 : 64,
          marginTop: 4,
        }}>
          {exercises.map((exercise) => (
            <ExerciseItem
              key={exercise.id}
              exercise={exercise}
              onPreview={onPreviewExercise}
              onEdit={onEditExercise}
              onDelete={onDeleteExercise}
              isMobile={isMobile}
            />
          ))}
        </div>
      )}
    </div>
  );
};

export default SkillItem;
