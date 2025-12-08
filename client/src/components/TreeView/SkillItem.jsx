import React, { useState, useRef, useEffect } from 'react';
import { FileText, Plus, Edit3, Trash2, MoreVertical, ChevronRight } from 'lucide-react';
import { IconButton, AgeBadge, SkillCountBadge } from '../ui';
import ExerciseItem from './ExerciseItem';

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
  const menuRef = useRef(null);

  // Close menu when clicking outside
  useEffect(() => {
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
  }, [menuOpen]);

  const handleDeleteSkill = () => {
    setMenuOpen(false);
    const exerciseCount = exercises.length;
    const confirmed = window.confirm(
      exerciseCount > 0
        ? `Delete skill "${skill.name}" and its ${exerciseCount} exercise${exerciseCount === 1 ? '' : 's'}?`
        : `Delete skill "${skill.name}"?`
    );

    if (!confirmed) return;
    onDeleteSkill(skill.id);
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

          {menuOpen && (
            <div
              onClick={(e) => e.stopPropagation()}
              style={{
                position: 'absolute',
                top: '100%',
                right: 0,
                marginTop: 4,
                backgroundColor: '#1e1e24',
                border: '1px solid #2e2e38',
                borderRadius: isMobile ? 12 : 8,
                boxShadow: '0 4px 20px rgba(0, 0, 0, 0.4)',
                zIndex: 50,
                minWidth: isMobile ? 180 : 160,
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
                  padding: isMobile ? '14px 16px' : '10px 12px',
                  backgroundColor: 'transparent',
                  border: 'none',
                  color: '#22c55e',
                  fontSize: isMobile ? 15 : 14,
                  cursor: 'pointer',
                  textAlign: 'left',
                }}
              >
                <Plus size={isMobile ? 16 : 14} />
                Add Exercise
              </button>
              <button
                onClick={handleEdit}
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: 10,
                  width: '100%',
                  padding: isMobile ? '14px 16px' : '10px 12px',
                  backgroundColor: 'transparent',
                  border: 'none',
                  color: '#e4e4e7',
                  fontSize: isMobile ? 15 : 14,
                  cursor: 'pointer',
                  textAlign: 'left',
                }}
              >
                <Edit3 size={isMobile ? 16 : 14} />
                Edit Skill
              </button>
              <button
                onClick={handleDeleteSkill}
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: 10,
                  width: '100%',
                  padding: isMobile ? '14px 16px' : '10px 12px',
                  backgroundColor: 'transparent',
                  border: 'none',
                  color: '#ef4444',
                  fontSize: isMobile ? 15 : 14,
                  cursor: 'pointer',
                  textAlign: 'left',
                }}
              >
                <Trash2 size={isMobile ? 16 : 14} />
                Delete Skill
              </button>
            </div>
          )}
        </div>
      </div>

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
