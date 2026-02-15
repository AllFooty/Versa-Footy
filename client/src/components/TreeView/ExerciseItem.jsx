import React, { useState, useRef, useEffect } from 'react';
import { Edit3, Trash2, Video, Play, MoreVertical, Wrench } from 'lucide-react';
import { IconButton } from '../ui';
import ActionSheet from '../ui/ActionSheet';
import ConfirmModal from '../modals/ConfirmModal';
import { renderDifficultyStars, getDifficultyStyle } from '../../utils/difficulty';
import { getDurationLabel } from '../../constants';

/**
 * Single exercise item in the tree view
 * Mobile-responsive with touch-friendly interactions
 */
const ExerciseItem = ({ exercise, onPreview, onEdit, onDelete, isMobile = false }) => {
  const [menuOpen, setMenuOpen] = useState(false);
  const [confirmDeleteOpen, setConfirmDeleteOpen] = useState(false);
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

  const handleClick = () => {
    if (!menuOpen) {
      onPreview(exercise);
    }
  };

  const handleMenuToggle = (e) => {
    e.stopPropagation();
    setMenuOpen(!menuOpen);
  };

  const handleEdit = (e) => {
    e.stopPropagation();
    setMenuOpen(false);
    onEdit(exercise);
  };

  const handleDelete = (e) => {
    e.stopPropagation();
    setMenuOpen(false);
    setConfirmDeleteOpen(true);
  };

  const confirmModal = (
    <ConfirmModal
      isOpen={confirmDeleteOpen}
      title="Delete Exercise"
      message={`Are you sure you want to delete "${exercise.name}"? This action cannot be undone.`}
      confirmLabel="Delete"
      confirmDanger
      onConfirm={() => onDelete(exercise.id)}
      onClose={() => setConfirmDeleteOpen(false)}
    />
  );

  // Desktop layout
  if (!isMobile) {
    return (
      <>
        <div
          onClick={handleClick}
          style={{
            display: 'flex',
            alignItems: 'center',
            gap: 12,
            padding: '8px 12px',
            background: 'rgba(255,255,255,0.02)',
            borderRadius: 8,
            marginBottom: 4,
            borderLeft: '2px solid rgba(255,255,255,0.05)',
            cursor: 'pointer',
            transition: 'all 0.2s',
          }}
          onMouseEnter={(e) => {
            e.currentTarget.style.background = 'rgba(59, 130, 246, 0.1)';
            e.currentTarget.style.borderLeftColor = '#3b82f6';
          }}
          onMouseLeave={(e) => {
            e.currentTarget.style.background = 'rgba(255,255,255,0.02)';
            e.currentTarget.style.borderLeftColor = 'rgba(255,255,255,0.05)';
          }}
        >
          {/* Video Icon */}
          {exercise.videoUrl ? (
            <Play size={14} color="#3b82f6" />
          ) : (
            <Video size={14} color="#52525b" />
          )}

          {/* Exercise Name & Description */}
          <div style={{ flex: 1, minWidth: 0 }}>
            <span style={{ fontSize: 13, color: '#a1a1aa', display: 'block' }}>
              {exercise.name}
            </span>
            {exercise.description && (
              <span style={{
                fontSize: 11,
                color: '#71717a',
                display: 'block',
                marginTop: 2,
                overflow: 'hidden',
                textOverflow: 'ellipsis',
                whiteSpace: 'nowrap',
              }}>
                {exercise.description}
              </span>
            )}
          </div>

          {/* Combo badge */}
          {exercise.skillIds && exercise.skillIds.length > 1 && (
            <span
              title={`Combo: ${exercise.skillIds.length} skills`}
              style={{
                display: 'inline-flex',
                alignItems: 'center',
                padding: '3px 8px',
                background: 'rgba(251, 191, 36, 0.15)',
                borderRadius: 4,
                color: '#fbbf24',
                fontSize: 11,
                fontWeight: 600,
              }}
            >
              Combo
            </span>
          )}

          {/* Equipment indicator */}
          {exercise.equipment && exercise.equipment.length > 0 && (
            <span
              title={exercise.equipment.join(', ')}
              style={{
                display: 'inline-flex',
                alignItems: 'center',
                gap: 4,
                padding: '3px 8px',
                background: 'rgba(59, 130, 246, 0.1)',
                borderRadius: 4,
                color: '#60a5fa',
                fontSize: 11,
              }}
            >
              <Wrench size={11} />
              {exercise.equipment.length}
            </span>
          )}

          {/* Duration badge */}
          <span
            title={`Min duration: ${getDurationLabel(exercise.minimumDuration)}`}
            style={{
              display: 'inline-flex',
              alignItems: 'center',
              padding: '3px 8px',
              background: exercise.minimumDuration != null
                ? 'rgba(168, 85, 247, 0.12)'
                : 'rgba(255,255,255,0.04)',
              borderRadius: 4,
              color: exercise.minimumDuration != null ? '#c084fc' : '#52525b',
              fontSize: 11,
            }}
          >
            {getDurationLabel(exercise.minimumDuration)}
          </span>

          {/* Difficulty Stars */}
          <span className="badge" style={getDifficultyStyle(exercise.difficulty)}>
            {renderDifficultyStars(exercise.difficulty)}
          </span>

          {/* Kebab Menu */}
          <div ref={menuRef} style={{ position: 'relative' }}>
            <IconButton onClick={handleMenuToggle} title="Exercise options">
              <MoreVertical size={14} />
            </IconButton>

            {menuOpen && (
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
                    gap: 8,
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
                    gap: 8,
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
        {confirmModal}
      </>
    );
  }

  // Mobile layout
  return (
    <>
      <div
        onClick={handleClick}
        className="touchable"
        style={{
          display: 'flex',
          alignItems: 'center',
          gap: 12,
          padding: '12px',
          background: 'rgba(255,255,255,0.02)',
          borderRadius: 10,
          marginBottom: 6,
          borderLeft: '3px solid rgba(59, 130, 246, 0.3)',
          cursor: 'pointer',
          transition: 'all 0.2s',
        }}
      >
        {/* Video Icon */}
        {exercise.videoUrl ? (
          <div
            style={{
              width: 36,
              height: 36,
              borderRadius: 8,
              background: 'rgba(59, 130, 246, 0.15)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              flexShrink: 0,
            }}
          >
            <Play size={16} color="#3b82f6" />
          </div>
        ) : (
          <div
            style={{
              width: 36,
              height: 36,
              borderRadius: 8,
              background: 'rgba(255,255,255,0.05)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              flexShrink: 0,
            }}
          >
            <Video size={16} color="#52525b" />
          </div>
        )}

        {/* Exercise Info */}
        <div style={{ flex: 1, minWidth: 0 }}>
          <span style={{
            display: 'block',
            fontSize: 14,
            color: '#e4e4e7',
            fontWeight: 500,
            marginBottom: exercise.description ? 2 : 4,
          }}>
            {exercise.name}
          </span>
          {exercise.description && (
            <span style={{
              display: 'block',
              fontSize: 12,
              color: '#71717a',
              marginBottom: 4,
              overflow: 'hidden',
              textOverflow: 'ellipsis',
              whiteSpace: 'nowrap',
            }}>
              {exercise.description}
            </span>
          )}
          <div style={{ display: 'flex', alignItems: 'center', gap: 6, flexWrap: 'wrap' }}>
            {/* Combo badge */}
            {exercise.skillIds && exercise.skillIds.length > 1 && (
              <span
                style={{
                  display: 'inline-flex',
                  alignItems: 'center',
                  padding: '4px 8px',
                  background: 'rgba(251, 191, 36, 0.15)',
                  borderRadius: 4,
                  color: '#fbbf24',
                  fontSize: 11,
                  fontWeight: 600,
                }}
              >
                Combo
              </span>
            )}
            {/* Equipment indicator */}
            {exercise.equipment && exercise.equipment.length > 0 && (
              <span
                style={{
                  display: 'inline-flex',
                  alignItems: 'center',
                  gap: 4,
                  padding: '4px 8px',
                  background: 'rgba(59, 130, 246, 0.1)',
                  borderRadius: 4,
                  color: '#60a5fa',
                  fontSize: 11,
                }}
              >
                <Wrench size={11} />
                {exercise.equipment.length}
              </span>
            )}
            {/* Duration badge */}
            <span
              style={{
                display: 'inline-flex',
                alignItems: 'center',
                padding: '4px 8px',
                background: exercise.minimumDuration != null
                  ? 'rgba(168, 85, 247, 0.12)'
                  : 'rgba(255,255,255,0.04)',
                borderRadius: 4,
                color: exercise.minimumDuration != null ? '#c084fc' : '#52525b',
                fontSize: 11,
              }}
            >
              {getDurationLabel(exercise.minimumDuration)}
            </span>
            {/* Difficulty Stars */}
            <span
              className="badge"
              style={{
                ...getDifficultyStyle(exercise.difficulty),
                padding: '4px 8px',
                fontSize: 11,
                display: 'inline-flex',
              }}
            >
              {renderDifficultyStars(exercise.difficulty)}
            </span>
          </div>
        </div>

        {/* Kebab Menu Button */}
        <div style={{ flexShrink: 0 }}>
          <IconButton
            onClick={handleMenuToggle}
            title="Exercise options"
            style={{ minWidth: 40, minHeight: 40 }}
          >
            <MoreVertical size={18} />
          </IconButton>
        </div>
      </div>

      {/* Mobile Action Sheet */}
      <ActionSheet
        isOpen={menuOpen}
        onClose={() => setMenuOpen(false)}
        title={exercise.name}
        items={[
          {
            icon: <Edit3 size={18} />,
            label: 'Edit Exercise',
            onClick: () => onEdit(exercise),
          },
          {
            icon: <Trash2 size={18} />,
            label: 'Delete Exercise',
            onClick: () => setConfirmDeleteOpen(true),
            danger: true,
          },
        ]}
      />

      {confirmModal}
    </>
  );
};

export default ExerciseItem;
