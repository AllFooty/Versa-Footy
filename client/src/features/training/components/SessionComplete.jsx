import React, { useEffect, useState } from 'react';
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
  purple: '#a78bfa',
  bgLight: '#f0fdf4',
  bgCard: '#ffffff',
};

/**
 * Confetti particle component
 */
function ConfettiParticle({ delay, color }) {
  return (
    <motion.div
      initial={{
        y: -20,
        x: Math.random() * 100 - 50,
        opacity: 1,
        rotate: 0,
      }}
      animate={{
        y: 400,
        x: Math.random() * 200 - 100,
        opacity: 0,
        rotate: Math.random() * 720 - 360,
      }}
      transition={{
        duration: 2 + Math.random(),
        delay: delay,
        ease: 'easeOut',
      }}
      style={{
        position: 'absolute',
        width: 10,
        height: 10,
        background: color,
        borderRadius: Math.random() > 0.5 ? '50%' : 2,
      }}
    />
  );
}

/**
 * Confetti explosion effect
 */
function ConfettiExplosion() {
  const confettiColors = [colors.green, colors.yellow, colors.blue, colors.coral, colors.purple];
  const particles = Array.from({ length: 50 }, (_, i) => ({
    id: i,
    color: confettiColors[i % confettiColors.length],
    delay: Math.random() * 0.5,
  }));

  return (
    <div style={styles.confettiContainer}>
      {particles.map((particle) => (
        <ConfettiParticle
          key={particle.id}
          color={particle.color}
          delay={particle.delay}
        />
      ))}
    </div>
  );
}

/**
 * Stat card component
 */
function StatCard({ icon, value, label, color }) {
  return (
    <motion.div
      initial={{ scale: 0, opacity: 0 }}
      animate={{ scale: 1, opacity: 1 }}
      transition={{ type: 'spring', stiffness: 200, delay: 0.5 }}
      style={styles.statCard}
    >
      <span style={{ ...styles.statIcon, color }}>{icon}</span>
      <span style={{ ...styles.statValue, color }}>{value}</span>
      <span style={styles.statLabel}>{label}</span>
    </motion.div>
  );
}

/**
 * Session Complete Screen
 * Celebrates the completion of a training session
 */
export default function SessionComplete({ result, completedExercises, onGoHome, onContinue }) {
  const [showConfetti, setShowConfetti] = useState(true);

  useEffect(() => {
    // Hide confetti after animation
    const timer = setTimeout(() => setShowConfetti(false), 3000);
    return () => clearTimeout(timer);
  }, []);

  const totalXP = result?.totalXP || completedExercises?.reduce((sum, c) => sum + c.xpResult.totalXP, 0) || 0;
  const exerciseCount = result?.exerciseCount || completedExercises?.length || 0;
  const averageRating = result?.averageRating ||
    (completedExercises?.length > 0
      ? completedExercises.reduce((sum, c) => sum + c.rating, 0) / completedExercises.length
      : 0);

  // Get encouraging message based on performance
  const getMessage = () => {
    if (averageRating >= 4.5) return "You're a superstar! 🌟";
    if (averageRating >= 4) return "Amazing work! 💪";
    if (averageRating >= 3) return "Great job! Keep it up!";
    if (averageRating >= 2) return "Good effort! Practice makes perfect!";
    return "You showed up! That's what counts!";
  };

  return (
    <div style={styles.container}>
      {/* Confetti */}
      {showConfetti && <ConfettiExplosion />}

      {/* Trophy Animation */}
      <motion.div
        initial={{ scale: 0, rotate: -180 }}
        animate={{ scale: 1, rotate: 0 }}
        transition={{ type: 'spring', stiffness: 200, delay: 0.2 }}
        style={styles.trophyContainer}
      >
        <span style={styles.trophy}>🏆</span>
      </motion.div>

      {/* Title */}
      <motion.h1
        initial={{ y: 30, opacity: 0 }}
        animate={{ y: 0, opacity: 1 }}
        transition={{ delay: 0.4 }}
        style={styles.title}
      >
        Session Complete!
      </motion.h1>

      {/* Message */}
      <motion.p
        initial={{ y: 30, opacity: 0 }}
        animate={{ y: 0, opacity: 1 }}
        transition={{ delay: 0.5 }}
        style={styles.message}
      >
        {getMessage()}
      </motion.p>

      {/* Stats */}
      <motion.div
        initial={{ y: 30, opacity: 0 }}
        animate={{ y: 0, opacity: 1 }}
        transition={{ delay: 0.6 }}
        style={styles.statsContainer}
      >
        <StatCard
          icon="⚡"
          value={`+${totalXP}`}
          label="XP Earned"
          color={colors.yellow}
        />
        <StatCard
          icon="🎯"
          value={exerciseCount}
          label="Exercises"
          color={colors.green}
        />
        <StatCard
          icon="⭐"
          value={averageRating.toFixed(1)}
          label="Avg Rating"
          color={colors.coral}
        />
      </motion.div>

      {/* Completed Exercises Summary */}
      {completedExercises && completedExercises.length > 0 && (
        <motion.div
          initial={{ y: 30, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          transition={{ delay: 0.7 }}
          style={styles.exercisesSummary}
        >
          <h3 style={styles.summaryTitle}>Exercises Completed</h3>
          <div style={styles.exercisesList}>
            {completedExercises.map((completion, index) => (
              <div key={index} style={styles.exerciseItem}>
                <span style={styles.exerciseItemIcon}>
                  {completion.exercise.categoryIcon}
                </span>
                <span style={styles.exerciseItemName}>
                  {completion.exercise.name}
                </span>
                <span style={styles.exerciseItemRating}>
                  {['😣', '😕', '😐', '😊', '🌟'][completion.rating - 1]}
                </span>
                <span style={styles.exerciseItemXP}>
                  +{completion.xpResult.totalXP}
                </span>
              </div>
            ))}
          </div>
        </motion.div>
      )}

      {/* Action Buttons */}
      <motion.div
        initial={{ y: 30, opacity: 0 }}
        animate={{ y: 0, opacity: 1 }}
        transition={{ delay: 0.8 }}
        style={styles.actionsContainer}
      >
        <motion.button
          whileHover={{ scale: 1.03 }}
          whileTap={{ scale: 0.97 }}
          onClick={onContinue}
          style={styles.continueButton}
        >
          Keep Training! 💪
        </motion.button>

        <button onClick={onGoHome} style={styles.homeButton}>
          Done for Today
        </button>
      </motion.div>

      {/* Mascot */}
      <motion.div
        initial={{ scale: 0 }}
        animate={{ scale: 1 }}
        transition={{ delay: 1, type: 'spring' }}
        style={styles.mascotContainer}
      >
        <motion.span
          animate={{ rotate: [0, 10, -10, 0] }}
          transition={{ repeat: Infinity, duration: 2 }}
          style={styles.mascot}
        >
          ⚽
        </motion.span>
      </motion.div>
    </div>
  );
}

const styles = {
  container: {
    minHeight: '100vh',
    background: `linear-gradient(135deg, ${colors.bgLight} 0%, #dcfce7 50%, #ecfdf5 100%)`,
    display: 'flex',
    flexDirection: 'column',
    alignItems: 'center',
    justifyContent: 'center',
    padding: '40px 24px',
    position: 'relative',
    overflow: 'hidden',
    fontFamily: "'Nunito', 'DM Sans', -apple-system, sans-serif",
  },

  confettiContainer: {
    position: 'fixed',
    top: 0,
    left: '50%',
    transform: 'translateX(-50%)',
    width: '100%',
    height: '100%',
    pointerEvents: 'none',
    display: 'flex',
    justifyContent: 'center',
    zIndex: 100,
  },

  trophyContainer: {
    marginBottom: 20,
  },

  trophy: {
    fontSize: 80,
    display: 'block',
  },

  title: {
    fontSize: 32,
    fontWeight: 800,
    color: '#166534',
    margin: '0 0 8px 0',
    textAlign: 'center',
  },

  message: {
    fontSize: 20,
    color: '#4b5563',
    margin: '0 0 32px 0',
    textAlign: 'center',
  },

  statsContainer: {
    display: 'flex',
    gap: 16,
    marginBottom: 32,
    flexWrap: 'wrap',
    justifyContent: 'center',
  },

  statCard: {
    background: colors.bgCard,
    borderRadius: 20,
    padding: '20px 28px',
    display: 'flex',
    flexDirection: 'column',
    alignItems: 'center',
    boxShadow: '0 4px 20px rgba(0, 0, 0, 0.08)',
    minWidth: 100,
  },

  statIcon: {
    fontSize: 28,
    marginBottom: 4,
  },

  statValue: {
    fontSize: 28,
    fontWeight: 800,
  },

  statLabel: {
    fontSize: 12,
    color: '#6b7280',
    marginTop: 2,
  },

  exercisesSummary: {
    background: colors.bgCard,
    borderRadius: 20,
    padding: 20,
    marginBottom: 32,
    width: '100%',
    maxWidth: 400,
    boxShadow: '0 4px 20px rgba(0, 0, 0, 0.08)',
  },

  summaryTitle: {
    fontSize: 16,
    fontWeight: 700,
    color: '#374151',
    marginBottom: 16,
    textAlign: 'center',
  },

  exercisesList: {
    display: 'flex',
    flexDirection: 'column',
    gap: 12,
  },

  exerciseItem: {
    display: 'flex',
    alignItems: 'center',
    gap: 10,
    padding: '8px 12px',
    background: '#f9fafb',
    borderRadius: 12,
  },

  exerciseItemIcon: {
    fontSize: 18,
  },

  exerciseItemName: {
    flex: 1,
    fontSize: 14,
    color: '#374151',
    fontWeight: 500,
  },

  exerciseItemRating: {
    fontSize: 18,
  },

  exerciseItemXP: {
    fontSize: 14,
    fontWeight: 700,
    color: colors.yellow,
  },

  actionsContainer: {
    display: 'flex',
    flexDirection: 'column',
    gap: 12,
    width: '100%',
    maxWidth: 300,
    marginBottom: 40,
  },

  continueButton: {
    width: '100%',
    padding: '18px 32px',
    fontSize: 18,
    fontWeight: 700,
    color: '#fff',
    background: `linear-gradient(135deg, ${colors.blue} 0%, #1d4ed8 100%)`,
    border: 'none',
    borderRadius: 16,
    cursor: 'pointer',
    boxShadow: '0 4px 14px rgba(59, 130, 246, 0.4)',
  },

  homeButton: {
    width: '100%',
    padding: '14px 24px',
    fontSize: 16,
    fontWeight: 600,
    color: '#6b7280',
    background: 'transparent',
    border: '2px solid #e5e7eb',
    borderRadius: 12,
    cursor: 'pointer',
  },

  mascotContainer: {
    position: 'absolute',
    bottom: 20,
    right: 20,
  },

  mascot: {
    fontSize: 40,
    display: 'block',
  },
};
