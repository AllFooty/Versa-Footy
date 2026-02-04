import React, { useState } from 'react';
import { motion } from 'framer-motion';

/**
 * Kid-friendly colors
 */
const colors = {
  green: '#22c55e',
  greenDark: '#16a34a',
  greenLight: '#86efac',
  blue: '#3b82f6',
  yellow: '#fbbf24',
  coral: '#fb923c',
  red: '#ef4444',
  bgCard: '#ffffff',
};

/**
 * Rating options with kid-friendly labels
 */
const RATING_OPTIONS = [
  {
    value: 1,
    emoji: '😣',
    label: 'Tough!',
    color: colors.red,
    description: "That was really hard",
  },
  {
    value: 2,
    emoji: '😕',
    label: 'Tricky',
    color: colors.coral,
    description: "I struggled a bit",
  },
  {
    value: 3,
    emoji: '😐',
    label: 'OK',
    color: colors.yellow,
    description: "Not bad, not great",
  },
  {
    value: 4,
    emoji: '😊',
    label: 'Good!',
    color: colors.greenLight,
    description: "I did well",
  },
  {
    value: 5,
    emoji: '🌟',
    label: 'Nailed it!',
    color: colors.green,
    description: "I crushed it!",
  },
];

/**
 * Self Assessment Component
 * Kid-friendly emoji rating after practicing an exercise
 */
export default function SelfAssessment({ exercise, onSubmit, ratingConfig }) {
  const [selectedRating, setSelectedRating] = useState(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleSubmit = async () => {
    if (!selectedRating) return;

    setIsSubmitting(true);
    try {
      await onSubmit(selectedRating);
    } catch (err) {
      console.error('Error submitting rating:', err);
      setIsSubmitting(false);
    }
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: -20 }}
      style={styles.container}
    >
      {/* Header */}
      <div style={styles.header}>
        <span style={styles.headerEmoji}>🎯</span>
        <h2 style={styles.title}>How did that feel?</h2>
        <p style={styles.subtitle}>Help us pick better exercises for you!</p>
      </div>

      {/* Exercise Info */}
      <div style={styles.exerciseInfo}>
        <span style={styles.exerciseIcon}>{exercise.categoryIcon}</span>
        <span style={styles.exerciseName}>{exercise.name}</span>
      </div>

      {/* Rating Options */}
      <div style={styles.ratingsGrid}>
        {RATING_OPTIONS.map((option) => (
          <motion.button
            key={option.value}
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
            onClick={() => setSelectedRating(option.value)}
            style={{
              ...styles.ratingButton,
              borderColor: selectedRating === option.value ? option.color : '#e5e7eb',
              background: selectedRating === option.value ? `${option.color}15` : colors.bgCard,
            }}
          >
            <motion.span
              animate={selectedRating === option.value ? { scale: [1, 1.2, 1] } : {}}
              transition={{ duration: 0.3 }}
              style={styles.ratingEmoji}
            >
              {option.emoji}
            </motion.span>
            <span
              style={{
                ...styles.ratingLabel,
                color: selectedRating === option.value ? option.color : '#374151',
              }}
            >
              {option.label}
            </span>
          </motion.button>
        ))}
      </div>

      {/* Selected Rating Description */}
      {selectedRating && (
        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          style={styles.selectionFeedback}
        >
          <span style={styles.feedbackText}>
            {RATING_OPTIONS.find((r) => r.value === selectedRating)?.description}
          </span>
        </motion.div>
      )}

      {/* Submit Button */}
      <motion.button
        whileHover={selectedRating ? { scale: 1.03 } : {}}
        whileTap={selectedRating ? { scale: 0.97 } : {}}
        onClick={handleSubmit}
        disabled={!selectedRating || isSubmitting}
        style={{
          ...styles.submitButton,
          opacity: selectedRating ? 1 : 0.5,
          cursor: selectedRating ? 'pointer' : 'not-allowed',
        }}
      >
        {isSubmitting ? 'Saving...' : 'Continue →'}
      </motion.button>

      {/* Encouragement */}
      <p style={styles.encouragement}>
        Every practice makes you better! 💪
      </p>
    </motion.div>
  );
}

const styles = {
  container: {
    display: 'flex',
    flexDirection: 'column',
    alignItems: 'center',
    textAlign: 'center',
    padding: '20px 0',
  },

  header: {
    marginBottom: 24,
  },

  headerEmoji: {
    fontSize: 48,
    display: 'block',
    marginBottom: 12,
  },

  title: {
    fontSize: 26,
    fontWeight: 700,
    color: '#166534',
    margin: '0 0 8px 0',
  },

  subtitle: {
    fontSize: 16,
    color: '#6b7280',
    margin: 0,
  },

  exerciseInfo: {
    display: 'flex',
    alignItems: 'center',
    gap: 8,
    background: '#f3f4f6',
    padding: '10px 20px',
    borderRadius: 20,
    marginBottom: 32,
  },

  exerciseIcon: {
    fontSize: 20,
  },

  exerciseName: {
    fontSize: 14,
    fontWeight: 600,
    color: '#374151',
  },

  ratingsGrid: {
    display: 'grid',
    gridTemplateColumns: 'repeat(5, 1fr)',
    gap: 8,
    width: '100%',
    maxWidth: 400,
    marginBottom: 24,
  },

  ratingButton: {
    display: 'flex',
    flexDirection: 'column',
    alignItems: 'center',
    justifyContent: 'center',
    padding: '16px 8px',
    borderRadius: 16,
    border: '3px solid',
    cursor: 'pointer',
    transition: 'all 0.2s ease',
    minHeight: 100,
  },

  ratingEmoji: {
    fontSize: 36,
    marginBottom: 8,
    display: 'block',
  },

  ratingLabel: {
    fontSize: 12,
    fontWeight: 700,
    whiteSpace: 'nowrap',
  },

  selectionFeedback: {
    marginBottom: 24,
  },

  feedbackText: {
    fontSize: 16,
    color: '#4b5563',
    fontStyle: 'italic',
  },

  submitButton: {
    width: '100%',
    maxWidth: 300,
    padding: '18px 32px',
    fontSize: 18,
    fontWeight: 700,
    color: '#fff',
    background: `linear-gradient(135deg, ${colors.green} 0%, ${colors.greenDark} 100%)`,
    border: 'none',
    borderRadius: 16,
    boxShadow: `0 4px 14px rgba(34, 197, 94, 0.4)`,
    marginBottom: 20,
  },

  encouragement: {
    fontSize: 14,
    color: '#9ca3af',
  },
};
