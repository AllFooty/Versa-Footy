import React, { useState, useRef, useEffect } from 'react';
import { Edit3, Trash2, Video, Play, ChevronRight, MoreVertical } from 'lucide-react';
import { IconButton } from '../ui';
import { renderDifficultyStars, getDifficultyStyle } from '../../utils/difficulty';

/**
 * Single exercise item in the tree view
 * Mobile-responsive with touch-friendly interactions
 */
const ExerciseItem = ({ exercise, onPreview, onEdit, onDelete, isMobile = false }) => {
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
    const confirmed = window.confirm(`Delete exercise "${exercise.name}"?`);
    if (!confirmed) return;
    onDelete(exercise.id);
  };

  // Desktop layout
  if (!isMobile) {
    return (
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

        {/* Exercise Name & Instructions */}
        <div style={{ flex: 1, minWidth: 0 }}>
          <span style={{ fontSize: 13, color: '#a1a1aa', display: 'block' }}>
            {exercise.name}
          </span>
          {exercise.instructions && (
            <span style={{
              fontSize: 11,
              color: '#71717a',
              display: 'block',
              marginTop: 2,
              overflow: 'hidden',
              textOverflow: 'ellipsis',
              whiteSpace: 'nowrap',
            }}>
              {exercise.instructions}
            </span>
          )}
        </div>

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
    );
  }

  // Mobile layout - cleaner with kebab menu
  return (
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
          marginBottom: exercise.instructions ? 2 : 4,
        }}>
          {exercise.name}
        </span>
        {exercise.instructions && (
          <span style={{
            display: 'block',
            fontSize: 12,
            color: '#71717a',
            marginBottom: 4,
            overflow: 'hidden',
            textOverflow: 'ellipsis',
            whiteSpace: 'nowrap',
          }}>
            {exercise.instructions}
          </span>
        )}
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

      {/* Kebab Menu */}
      <div ref={menuRef} style={{ position: 'relative', flexShrink: 0 }}>
        <IconButton 
          onClick={handleMenuToggle} 
          title="Exercise options"
          style={{ minWidth: 40, minHeight: 40 }}
        >
          <MoreVertical size={18} />
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
              borderRadius: 12,
              boxShadow: '0 4px 20px rgba(0, 0, 0, 0.4)',
              zIndex: 50,
              minWidth: 160,
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
                padding: '14px 16px',
                backgroundColor: 'transparent',
                border: 'none',
                color: '#e4e4e7',
                fontSize: 15,
                cursor: 'pointer',
                textAlign: 'left',
              }}
            >
              <Edit3 size={16} />
              Edit
            </button>
            <button
              onClick={handleDelete}
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: 10,
                width: '100%',
                padding: '14px 16px',
                backgroundColor: 'transparent',
                border: 'none',
                color: '#ef4444',
                fontSize: 15,
                cursor: 'pointer',
                textAlign: 'left',
              }}
            >
              <Trash2 size={16} />
              Delete
            </button>
          </div>
        )}
      </div>
    </div>
  );
};

export default ExerciseItem;
