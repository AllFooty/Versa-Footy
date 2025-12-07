import React from 'react';
import { Edit3, Trash2, Video, Play } from 'lucide-react';
import { IconButton } from '../ui';
import { renderDifficultyStars, getDifficultyStyle } from '../../utils/difficulty';

/**
 * Single exercise item in the tree view
 */
const ExerciseItem = ({ exercise, onPreview, onEdit, onDelete }) => {
  const handleClick = () => {
    onPreview(exercise);
  };

  const handleEdit = (e) => {
    e.stopPropagation();
    onEdit(exercise);
  };

  const handleDelete = (e) => {
    e.stopPropagation();
    const confirmed = window.confirm(`Delete exercise "${exercise.name}"?`);
    if (!confirmed) return;
    onDelete(exercise.id);
  };

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

      {/* Exercise Name */}
      <span style={{ flex: 1, fontSize: 13, color: '#a1a1aa' }}>
        {exercise.name}
      </span>

      {/* Difficulty Stars */}
      <span className="badge" style={getDifficultyStyle(exercise.difficulty)}>
        {renderDifficultyStars(exercise.difficulty)}
      </span>

      {/* Actions */}
      <div style={{ display: 'flex', gap: 4 }}>
        <IconButton onClick={handleEdit} title="Edit exercise">
          <Edit3 size={12} />
        </IconButton>
        <IconButton danger onClick={handleDelete} title="Delete exercise">
          <Trash2 size={12} />
        </IconButton>
      </div>
    </div>
  );
};

export default ExerciseItem;
