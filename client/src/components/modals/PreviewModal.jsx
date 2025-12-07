import React from 'react';
import { X, Edit3, Play, ChevronRight, Video } from 'lucide-react';
import { IconButton, Button, SecondaryButton, Badge, AgeBadge } from '../ui';
import { getYouTubeEmbedUrl } from '../../utils/youtube';
import { renderDifficultyStars, getDifficultyStyle } from '../../utils/difficulty';

/**
 * Modal for previewing exercise details with video
 */
const PreviewModal = ({
  exercise,
  skill,
  category,
  onClose,
  onEdit,
}) => {
  if (!exercise) return null;

  const embedUrl = getYouTubeEmbedUrl(exercise.videoUrl);
  const isDirectVideo =
    exercise.videoUrl &&
    !embedUrl &&
    /\.(mp4|mov|webm|ogg|m4v)$/i.test(exercise.videoUrl.split('?')[0]);

  const handleEdit = () => {
    onClose();
    onEdit(exercise);
  };

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div
        className="modal modal-large"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div
          style={{
            display: 'flex',
            alignItems: 'flex-start',
            justifyContent: 'space-between',
            marginBottom: 24,
          }}
        >
          <div>
            <h2
              style={{
                margin: 0,
                fontFamily: "'Space Grotesk', sans-serif",
                fontSize: 24,
                fontWeight: 700,
              }}
            >
              {exercise.name}
            </h2>
            <div
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: 12,
                marginTop: 8,
              }}
            >
              {category && (
                <Badge color={category.color}>
                  {category.icon} {category.name}
                </Badge>
              )}
              {skill && (
                <Badge
                  style={{
                    background: 'rgba(139, 92, 246, 0.15)',
                    color: '#8b5cf6',
                  }}
                >
                  {skill.name}
                </Badge>
              )}
              {skill?.ageGroup && <AgeBadge age={skill.ageGroup} />}
            </div>
          </div>
          <IconButton onClick={onClose}>
            <X size={20} />
          </IconButton>
        </div>

        {/* Difficulty */}
        <div
          style={{
            display: 'flex',
            alignItems: 'center',
            gap: 12,
            padding: '16px 20px',
            background: 'rgba(0,0,0,0.2)',
            borderRadius: 12,
            marginBottom: 20,
          }}
        >
          <span style={{ color: '#71717a', fontSize: 14 }}>Difficulty:</span>
          <span
            style={{
              fontSize: 20,
              letterSpacing: 2,
              ...getDifficultyStyle(exercise.difficulty),
            }}
          >
            {renderDifficultyStars(exercise.difficulty)}
          </span>
          <span style={{ color: '#a1a1aa', fontSize: 13, marginLeft: 8 }}>
            ({exercise.difficulty}/5)
          </span>
        </div>

        {/* Video Section */}
        {embedUrl ? (
          <div
            style={{
              borderRadius: 12,
              overflow: 'hidden',
              marginBottom: 20,
              background: '#000',
              aspectRatio: '16/9',
            }}
          >
            <iframe
              src={embedUrl}
              title={exercise.name}
              style={{ width: '100%', height: '100%', border: 'none' }}
              allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
              allowFullScreen
            />
          </div>
        ) : isDirectVideo ? (
          <div
            style={{
              borderRadius: 12,
              overflow: 'hidden',
              marginBottom: 20,
              background: '#000',
              aspectRatio: '9/16',
              maxWidth: 420,
              marginInline: 'auto',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
            }}
          >
            <video
              controls
              preload="metadata"
              style={{
                width: '100%',
                height: '100%',
                objectFit: 'contain',
                background: '#000',
              }}
              src={exercise.videoUrl}
            >
              Your browser does not support the video tag.
            </video>
          </div>
        ) : exercise.videoUrl ? (
          <a
            href={exercise.videoUrl}
            target="_blank"
            rel="noreferrer"
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: 12,
              padding: '16px 20px',
              background: 'rgba(59, 130, 246, 0.1)',
              border: '1px solid rgba(59, 130, 246, 0.2)',
              borderRadius: 12,
              marginBottom: 20,
              color: '#3b82f6',
              textDecoration: 'none',
              transition: 'all 0.2s',
            }}
          >
            <Play size={20} />
            <span style={{ flex: 1 }}>Watch Video</span>
            <ChevronRight size={16} />
          </a>
        ) : (
          <div
            style={{
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              gap: 12,
              padding: '40px 20px',
              background: 'rgba(255,255,255,0.02)',
              border: '1px dashed rgba(255,255,255,0.1)',
              borderRadius: 12,
              marginBottom: 20,
              color: '#52525b',
            }}
          >
            <Video size={24} />
            <span>No video available</span>
          </div>
        )}

        {/* Description */}
        {exercise.description && (
          <div style={{ marginBottom: 24 }}>
            <h3
              style={{
                fontSize: 14,
                fontWeight: 600,
                color: '#a1a1aa',
                marginBottom: 12,
                textTransform: 'uppercase',
                letterSpacing: 1,
              }}
            >
              Instructions
            </h3>
            <div
              style={{
                padding: '16px 20px',
                background: 'rgba(0,0,0,0.2)',
                borderRadius: 12,
                lineHeight: 1.7,
                color: '#d4d4d8',
                whiteSpace: 'pre-wrap',
              }}
            >
              {exercise.description}
            </div>
          </div>
        )}

        {/* Action Buttons */}
        <div
          style={{
            display: 'flex',
            justifyContent: 'flex-end',
            gap: 12,
            marginTop: 24,
            borderTop: '1px solid rgba(255,255,255,0.06)',
            paddingTop: 24,
          }}
        >
          <SecondaryButton onClick={onClose}>Close</SecondaryButton>
          <Button onClick={handleEdit}>
            <Edit3 size={16} /> Edit Exercise
          </Button>
        </div>
      </div>
    </div>
  );
};

export default PreviewModal;
