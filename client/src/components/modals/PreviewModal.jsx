import React, { useEffect, useState } from 'react';
import { X, Edit3, Play, ChevronRight, Video } from 'lucide-react';
import { IconButton, Button, SecondaryButton, Badge, AgeBadge } from '../ui';
import { getYouTubeEmbedUrl } from '../../utils/youtube';
import { renderDifficultyStars, getDifficultyStyle } from '../../utils/difficulty';

/**
 * Modal for previewing exercise details with video
 * Mobile-responsive with optimized layout
 */
const PreviewModal = ({
  exercise,
  skill,
  category,
  previewSkills = [],
  getCategoryById,
  onClose,
  onEdit,
}) => {
  const [isMobile, setIsMobile] = useState(false);

  // Detect mobile viewport
  useEffect(() => {
    const checkMobile = () => {
      setIsMobile(window.innerWidth <= 768);
    };
    checkMobile();
    window.addEventListener('resize', checkMobile);
    return () => window.removeEventListener('resize', checkMobile);
  }, []);

  // Prevent body scroll when modal is open
  useEffect(() => {
    if (exercise) {
      document.body.style.overflow = 'hidden';
    } else {
      document.body.style.overflow = '';
    }
    return () => {
      document.body.style.overflow = '';
    };
  }, [exercise]);

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
        style={isMobile ? { padding: '20px 16px' } : {}}
      >
        {/* Mobile drag handle */}
        {isMobile && (
          <div
            style={{
              width: 40,
              height: 4,
              background: 'rgba(255,255,255,0.2)',
              borderRadius: 2,
              margin: '0 auto 16px',
            }}
          />
        )}

        {/* Header */}
        <div
          style={{
            display: 'flex',
            alignItems: 'flex-start',
            justifyContent: 'space-between',
            marginBottom: isMobile ? 16 : 24,
          }}
        >
          <div style={{ flex: 1, marginRight: 12 }}>
            <h2
              style={{
                margin: 0,
                fontFamily: "'Space Grotesk', sans-serif",
                fontSize: isMobile ? 18 : 24,
                fontWeight: 700,
                lineHeight: 1.3,
              }}
            >
              {exercise.name}
            </h2>
            <div
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: 8,
                marginTop: 8,
                flexWrap: 'wrap',
              }}
            >
              {previewSkills.length > 1 && (
                <span style={{
                  padding: '3px 8px',
                  background: 'rgba(251, 191, 36, 0.15)',
                  borderRadius: 4,
                  color: '#fbbf24',
                  fontSize: 11,
                  fontWeight: 600,
                }}>
                  Combo
                </span>
              )}
              {previewSkills.length > 0
                ? previewSkills.map((s) => {
                    const cat = getCategoryById?.(s.categoryId);
                    return (
                      <Badge
                        key={s.id}
                        color={cat?.color}
                        style={!cat?.color ? {
                          background: 'rgba(139, 92, 246, 0.15)',
                          color: '#8b5cf6',
                        } : undefined}
                      >
                        {cat?.icon} {s.name}
                      </Badge>
                    );
                  })
                : (
                  <>
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
                  </>
                )}
              {previewSkills.length > 0 && (
                <AgeBadge age={[...new Set(previewSkills.map((s) => s.ageGroup).filter(Boolean))].join(', ')} />
              )}
              {previewSkills.length === 0 && skill?.ageGroup && <AgeBadge age={skill.ageGroup} />}
            </div>
          </div>
          <IconButton 
            onClick={onClose}
            style={isMobile ? { minWidth: 44, minHeight: 44 } : {}}
          >
            <X size={isMobile ? 22 : 20} />
          </IconButton>
        </div>

        {/* Scrollable content for mobile */}
        <div style={isMobile ? { 
          maxHeight: '60vh', 
          overflowY: 'auto',
          WebkitOverflowScrolling: 'touch',
        } : {}}>
          {/* Difficulty */}
          <div
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: isMobile ? 8 : 12,
              padding: isMobile ? '12px 14px' : '16px 20px',
              background: 'rgba(0,0,0,0.2)',
              borderRadius: 12,
              marginBottom: isMobile ? 16 : 20,
              flexWrap: 'wrap',
            }}
          >
            <span style={{ color: '#71717a', fontSize: isMobile ? 13 : 14 }}>Difficulty:</span>
            <span
              style={{
                fontSize: isMobile ? 16 : 20,
                letterSpacing: 2,
                ...getDifficultyStyle(exercise.difficulty),
              }}
            >
              {renderDifficultyStars(exercise.difficulty)}
            </span>
            <span style={{ color: '#a1a1aa', fontSize: isMobile ? 12 : 13 }}>
              ({exercise.difficulty}/5)
            </span>
          </div>

          {/* Equipment */}
          {exercise.equipment && exercise.equipment.length > 0 && (
            <div
              style={{
                display: 'flex',
                alignItems: 'flex-start',
                gap: isMobile ? 8 : 12,
                padding: isMobile ? '12px 14px' : '16px 20px',
                background: 'rgba(0,0,0,0.2)',
                borderRadius: 12,
                marginBottom: isMobile ? 16 : 20,
                flexWrap: 'wrap',
              }}
            >
              <span style={{ color: '#71717a', fontSize: isMobile ? 13 : 14 }}>Equipment:</span>
              <div style={{ display: 'flex', flexWrap: 'wrap', gap: 6 }}>
                {exercise.equipment.map((item) => (
                  <span
                    key={item}
                    style={{
                      padding: '4px 10px',
                      background: 'rgba(59, 130, 246, 0.15)',
                      border: '1px solid rgba(59, 130, 246, 0.25)',
                      borderRadius: 6,
                      color: '#93c5fd',
                      fontSize: isMobile ? 12 : 13,
                    }}
                  >
                    {item}
                  </span>
                ))}
              </div>
            </div>
          )}

          {/* Video Section */}
          {embedUrl ? (
            <div
              style={{
                borderRadius: 12,
                overflow: 'hidden',
                marginBottom: isMobile ? 16 : 20,
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
                marginBottom: isMobile ? 16 : 20,
                background: '#000',
                aspectRatio: isMobile ? '16/9' : '9/16',
                maxWidth: isMobile ? '100%' : 420,
                marginInline: 'auto',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
              }}
            >
              <video
                controls
                preload="metadata"
                playsInline
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
                padding: isMobile ? '14px 16px' : '16px 20px',
                background: 'rgba(59, 130, 246, 0.1)',
                border: '1px solid rgba(59, 130, 246, 0.2)',
                borderRadius: 12,
                marginBottom: isMobile ? 16 : 20,
                color: '#3b82f6',
                textDecoration: 'none',
                transition: 'all 0.2s',
                minHeight: isMobile ? 52 : 'auto',
              }}
            >
              <Play size={isMobile ? 22 : 20} />
              <span style={{ flex: 1, fontSize: isMobile ? 15 : 14 }}>Watch Video</span>
              <ChevronRight size={isMobile ? 18 : 16} />
            </a>
          ) : (
            <div
              style={{
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                gap: 12,
                padding: isMobile ? '30px 20px' : '40px 20px',
                background: 'rgba(255,255,255,0.02)',
                border: '1px dashed rgba(255,255,255,0.1)',
                borderRadius: 12,
                marginBottom: isMobile ? 16 : 20,
                color: '#52525b',
              }}
            >
              <Video size={isMobile ? 20 : 24} />
              <span style={{ fontSize: isMobile ? 13 : 14 }}>No video available</span>
            </div>
          )}

          {/* Description */}
          {exercise.description && (
            <div style={{ marginBottom: isMobile ? 16 : 24 }}>
              <h3
                style={{
                  fontSize: isMobile ? 12 : 14,
                  fontWeight: 600,
                  color: '#a1a1aa',
                  marginBottom: isMobile ? 8 : 12,
                  textTransform: 'uppercase',
                  letterSpacing: 1,
                }}
              >
                Description
              </h3>
              <div
                style={{
                  padding: isMobile ? '14px 16px' : '16px 20px',
                  background: 'rgba(0,0,0,0.2)',
                  borderRadius: 12,
                  lineHeight: 1.7,
                  color: '#d4d4d8',
                  whiteSpace: 'pre-wrap',
                  fontSize: isMobile ? 14 : 15,
                }}
              >
                {exercise.description}
              </div>
            </div>
          )}
        </div>

        {/* Action Buttons */}
        <div
          style={{
            display: 'flex',
            flexDirection: isMobile ? 'column-reverse' : 'row',
            justifyContent: 'flex-end',
            gap: isMobile ? 10 : 12,
            marginTop: isMobile ? 16 : 24,
            borderTop: '1px solid rgba(255,255,255,0.06)',
            paddingTop: isMobile ? 16 : 24,
          }}
        >
          <SecondaryButton 
            onClick={onClose}
            style={isMobile ? { width: '100%', justifyContent: 'center', minHeight: 48 } : {}}
          >
            Close
          </SecondaryButton>
          <Button 
            onClick={handleEdit}
            style={isMobile ? { width: '100%', justifyContent: 'center', minHeight: 48 } : {}}
          >
            <Edit3 size={16} /> Edit Exercise
          </Button>
        </div>
      </div>
    </div>
  );
};

export default PreviewModal;
