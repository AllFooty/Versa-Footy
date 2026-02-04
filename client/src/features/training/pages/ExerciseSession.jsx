import React, { useState, useEffect, useCallback } from 'react';
import { useLocation } from 'wouter';
import { motion, AnimatePresence } from 'framer-motion';
import { useAuth } from '../../../lib/AuthContext';
import { usePlayerProgress } from '../hooks/usePlayerProgress';
import { useTrainingSession } from '../hooks/useTrainingSession';
import SelfAssessment from '../components/SelfAssessment';
import SessionComplete from '../components/SessionComplete';

/**
 * Exercise phase enum
 */
const PHASE = {
  LOADING: 'loading',
  PREVIEW: 'preview',
  WATCH: 'watch',
  PRACTICE: 'practice',
  RATE: 'rate',
  COMPLETE: 'complete',
};

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
 * Difficulty star display
 */
function DifficultyStars({ difficulty }) {
  return (
    <div style={styles.difficultyStars}>
      {[1, 2, 3, 4, 5].map((star) => (
        <span
          key={star}
          style={{
            ...styles.star,
            opacity: star <= difficulty ? 1 : 0.3,
          }}
        >
          ⭐
        </span>
      ))}
    </div>
  );
}

/**
 * Progress bar for session
 */
function SessionProgressBar({ current, total }) {
  const progress = (current / total) * 100;

  return (
    <div style={styles.sessionProgressContainer}>
      <div style={styles.sessionProgressTrack}>
        <motion.div
          style={styles.sessionProgressFill}
          initial={{ width: 0 }}
          animate={{ width: `${progress}%` }}
          transition={{ duration: 0.3 }}
        />
      </div>
      <span style={styles.sessionProgressText}>
        {current} / {total}
      </span>
    </div>
  );
}

/**
 * Preview Phase - Shows exercise info before starting
 */
function PreviewPhase({ exercise, onStart, onSkip }) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: -20 }}
      style={styles.phaseContainer}
    >
      {/* Category Badge */}
      <div
        style={{
          ...styles.categoryBadge,
          background: `${exercise.categoryColor}20`,
          color: exercise.categoryColor,
        }}
      >
        <span>{exercise.categoryIcon}</span>
        <span>{exercise.categoryName}</span>
      </div>

      {/* Exercise Name */}
      <h1 style={styles.exerciseName}>{exercise.name}</h1>

      {/* Skill Name */}
      <p style={styles.skillName}>{exercise.skillName}</p>

      {/* Difficulty */}
      <DifficultyStars difficulty={exercise.difficulty} />

      {/* Video Thumbnail */}
      <div style={styles.videoThumbnail}>
        {exercise.videoUrl ? (
          <div style={styles.thumbnailPlaceholder}>
            <span style={styles.playIcon}>▶️</span>
            <span style={styles.videoLabel}>Watch Demo</span>
          </div>
        ) : (
          <div style={styles.noVideoPlaceholder}>
            <span style={styles.noVideoIcon}>📖</span>
            <span style={styles.noVideoLabel}>Read Instructions</span>
          </div>
        )}
      </div>

      {/* Description */}
      {exercise.description && (
        <p style={styles.exerciseDescription}>{exercise.description}</p>
      )}

      {/* Action Buttons */}
      <div style={styles.actionButtons}>
        <motion.button
          whileHover={{ scale: 1.03 }}
          whileTap={{ scale: 0.97 }}
          onClick={onStart}
          style={styles.primaryButton}
        >
          {exercise.videoUrl ? 'Watch Video' : 'Start Practice'} →
        </motion.button>

        <button onClick={onSkip} style={styles.skipButton}>
          Skip this one
        </button>
      </div>
    </motion.div>
  );
}

/**
 * Watch Phase - Shows the video demonstration
 */
function WatchPhase({ exercise, onContinue, onRewatch }) {
  const [videoEnded, setVideoEnded] = useState(false);

  // Extract YouTube video ID
  const getYouTubeId = (url) => {
    if (!url) return null;
    const match = url.match(/(?:youtu\.be\/|youtube\.com\/(?:embed\/|v\/|watch\?v=|watch\?.+&v=))([^&?]+)/);
    return match ? match[1] : null;
  };

  const youtubeId = getYouTubeId(exercise.videoUrl);

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: -20 }}
      style={styles.phaseContainer}
    >
      <h2 style={styles.phaseTitle}>Watch & Learn</h2>

      {/* Video Player */}
      <div style={styles.videoContainer}>
        {youtubeId ? (
          <iframe
            src={`https://www.youtube.com/embed/${youtubeId}?rel=0&modestbranding=1`}
            style={styles.videoIframe}
            frameBorder="0"
            allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
            allowFullScreen
            title={exercise.name}
          />
        ) : exercise.videoUrl ? (
          <video
            src={exercise.videoUrl}
            style={styles.videoPlayer}
            controls
            onEnded={() => setVideoEnded(true)}
          />
        ) : (
          <div style={styles.noVideoMessage}>
            <span style={styles.instructionIcon}>📋</span>
            <h3 style={styles.instructionTitle}>Instructions</h3>
            <p style={styles.instructionText}>
              {exercise.description || 'Practice this skill and do your best!'}
            </p>
          </div>
        )}
      </div>

      {/* Key Points */}
      <div style={styles.keyPoints}>
        <h3 style={styles.keyPointsTitle}>Remember:</h3>
        <ul style={styles.keyPointsList}>
          <li>Watch the movement carefully</li>
          <li>Start slowly, then speed up</li>
          <li>Keep the ball close to you</li>
        </ul>
      </div>

      {/* Action Buttons */}
      <div style={styles.actionButtons}>
        <motion.button
          whileHover={{ scale: 1.03 }}
          whileTap={{ scale: 0.97 }}
          onClick={onContinue}
          style={styles.primaryButton}
        >
          Got it! Start Practice →
        </motion.button>

        {(youtubeId || exercise.videoUrl) && (
          <button onClick={onRewatch} style={styles.secondaryButton}>
            🔄 Watch Again
          </button>
        )}
      </div>
    </motion.div>
  );
}

/**
 * Practice Phase - Timer while they practice
 */
function PracticePhase({ exercise, onComplete }) {
  const [timeElapsed, setTimeElapsed] = useState(0);
  const [canComplete, setCanComplete] = useState(false);
  const MINIMUM_TIME = 30; // 30 seconds minimum

  useEffect(() => {
    const interval = setInterval(() => {
      setTimeElapsed((prev) => {
        const newTime = prev + 1;
        if (newTime >= MINIMUM_TIME) {
          setCanComplete(true);
        }
        return newTime;
      });
    }, 1000);

    return () => clearInterval(interval);
  }, []);

  const formatTime = (seconds) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: -20 }}
      style={styles.practicePhaseContainer}
    >
      {/* Exercise Name */}
      <h2 style={styles.practiceTitle}>{exercise.name}</h2>

      {/* Big "GO PRACTICE" Message */}
      <motion.div
        animate={{ scale: [1, 1.05, 1] }}
        transition={{ repeat: Infinity, duration: 2 }}
        style={styles.goPracticeContainer}
      >
        <span style={styles.goPracticeIcon}>⚽</span>
        <span style={styles.goPracticeText}>GO PRACTICE!</span>
        <span style={styles.goPracticeSubtext}>Put down your phone and practice</span>
      </motion.div>

      {/* Timer */}
      <div style={styles.timerContainer}>
        <span style={styles.timerLabel}>Time</span>
        <span style={styles.timerValue}>{formatTime(timeElapsed)}</span>
      </div>

      {/* Progress to unlock */}
      {!canComplete && (
        <div style={styles.unlockProgress}>
          <div style={styles.unlockProgressTrack}>
            <motion.div
              style={styles.unlockProgressFill}
              initial={{ width: 0 }}
              animate={{ width: `${(timeElapsed / MINIMUM_TIME) * 100}%` }}
            />
          </div>
          <span style={styles.unlockText}>
            Practice for {MINIMUM_TIME - timeElapsed} more seconds
          </span>
        </div>
      )}

      {/* Quick Tips */}
      <div style={styles.quickTips}>
        <p style={styles.tipText}>💡 {exercise.description || 'Focus on your technique!'}</p>
      </div>

      {/* Video Reminder Button */}
      <button style={styles.reminderButton}>
        📺 Quick Video Reminder
      </button>

      {/* Done Button */}
      <motion.button
        whileHover={canComplete ? { scale: 1.03 } : {}}
        whileTap={canComplete ? { scale: 0.97 } : {}}
        onClick={canComplete ? onComplete : undefined}
        disabled={!canComplete}
        style={{
          ...styles.primaryButton,
          ...styles.doneButton,
          opacity: canComplete ? 1 : 0.5,
          cursor: canComplete ? 'pointer' : 'not-allowed',
        }}
      >
        ✅ Done Practicing!
      </motion.button>
    </motion.div>
  );
}

/**
 * Main Exercise Session Page
 */
export default function ExerciseSession() {
  const [, setLocation] = useLocation();
  const { user } = useAuth();

  const {
    playerProfile,
    addXP,
    updateStreak,
    dailyGoalProgress,
  } = usePlayerProgress();

  const {
    session,
    exercises,
    currentExercise,
    currentExerciseIndex,
    completedExercises,
    progress,
    loading,
    error,
    startSession,
    completeExercise,
    skipExercise,
    finishSession,
    abandonSession,
    RATING_CONFIG,
  } = useTrainingSession();

  const [phase, setPhase] = useState(PHASE.LOADING);
  const [lastCompletion, setLastCompletion] = useState(null);
  const [sessionResult, setSessionResult] = useState(null);

  // Start session on mount
  useEffect(() => {
    if (user && playerProfile && !session && phase === PHASE.LOADING) {
      startSession(playerProfile, 'standard')
        .then(() => {
          setPhase(PHASE.PREVIEW);
        })
        .catch((err) => {
          console.error('Failed to start session:', err);
        });
    }
  }, [user, playerProfile, session, phase, startSession]);

  // Handle moving to next exercise
  const handleNextExercise = useCallback(() => {
    setLastCompletion(null);
    if (currentExerciseIndex < exercises.length - 1) {
      setPhase(PHASE.PREVIEW);
    } else {
      // Session complete
      handleFinishSession();
    }
  }, [currentExerciseIndex, exercises.length]);

  // Handle starting video/practice
  const handleStartWatch = useCallback(() => {
    if (currentExercise?.videoUrl) {
      setPhase(PHASE.WATCH);
    } else {
      setPhase(PHASE.PRACTICE);
    }
  }, [currentExercise]);

  // Handle practice complete
  const handlePracticeComplete = useCallback(() => {
    setPhase(PHASE.RATE);
  }, []);

  // Handle rating submission
  const handleRatingSubmit = useCallback(async (rating) => {
    try {
      const completion = await completeExercise(rating, {
        currentStreak: playerProfile?.current_streak || 0,
      });

      // Add XP to player
      await addXP(completion.xpResult.totalXP, { exerciseCompleted: true });

      // Update streak
      await updateStreak();

      setLastCompletion(completion);

      // Check if this was the last exercise
      if (currentExerciseIndex >= exercises.length - 1) {
        setPhase(PHASE.COMPLETE);
      } else {
        // Show brief XP animation then move to next
        setTimeout(() => {
          handleNextExercise();
        }, 1500);
      }
    } catch (err) {
      console.error('Error completing exercise:', err);
    }
  }, [completeExercise, addXP, updateStreak, playerProfile, currentExerciseIndex, exercises.length, handleNextExercise]);

  // Handle skip
  const handleSkip = useCallback(() => {
    skipExercise();
    if (currentExerciseIndex < exercises.length - 1) {
      setPhase(PHASE.PREVIEW);
    } else {
      handleFinishSession();
    }
  }, [skipExercise, currentExerciseIndex, exercises.length]);

  // Handle finish session
  const handleFinishSession = useCallback(async () => {
    try {
      const result = await finishSession();
      setSessionResult(result);
      setPhase(PHASE.COMPLETE);
    } catch (err) {
      console.error('Error finishing session:', err);
    }
  }, [finishSession]);

  // Handle go home
  const handleGoHome = useCallback(() => {
    setLocation('/training');
  }, [setLocation]);

  // Handle continue training
  const handleContinueTraining = useCallback(async () => {
    setPhase(PHASE.LOADING);
    setSessionResult(null);
    setLastCompletion(null);
    try {
      await startSession(playerProfile, 'standard');
      setPhase(PHASE.PREVIEW);
    } catch (err) {
      console.error('Error starting new session:', err);
    }
  }, [startSession, playerProfile]);

  // Handle abandon
  const handleAbandon = useCallback(async () => {
    await abandonSession();
    setLocation('/training');
  }, [abandonSession, setLocation]);

  // Loading state
  if (phase === PHASE.LOADING || loading) {
    return (
      <div style={styles.loadingContainer}>
        <motion.div
          animate={{ rotate: 360 }}
          transition={{ repeat: Infinity, duration: 1, ease: 'linear' }}
          style={styles.loadingSpinner}
        >
          ⚽
        </motion.div>
        <p style={styles.loadingText}>Getting your exercises ready...</p>
      </div>
    );
  }

  // Error state
  if (error) {
    return (
      <div style={styles.errorContainer}>
        <span style={styles.errorIcon}>😕</span>
        <h2 style={styles.errorTitle}>Oops!</h2>
        <p style={styles.errorText}>{error}</p>
        <motion.button
          whileHover={{ scale: 1.03 }}
          whileTap={{ scale: 0.97 }}
          onClick={handleGoHome}
          style={styles.primaryButton}
        >
          Go Back Home
        </motion.button>
      </div>
    );
  }

  // Session complete state
  if (phase === PHASE.COMPLETE) {
    return (
      <SessionComplete
        result={sessionResult}
        completedExercises={completedExercises}
        onGoHome={handleGoHome}
        onContinue={handleContinueTraining}
      />
    );
  }

  // No exercises state
  if (!currentExercise) {
    return (
      <div style={styles.errorContainer}>
        <span style={styles.errorIcon}>📭</span>
        <h2 style={styles.errorTitle}>No Exercises Yet</h2>
        <p style={styles.errorText}>
          We're adding exercises for your age group. Check back soon!
        </p>
        <motion.button
          whileHover={{ scale: 1.03 }}
          whileTap={{ scale: 0.97 }}
          onClick={handleGoHome}
          style={styles.primaryButton}
        >
          Go Back Home
        </motion.button>
      </div>
    );
  }

  return (
    <div style={styles.container}>
      {/* Header */}
      <header style={styles.header}>
        <button onClick={handleAbandon} style={styles.closeButton}>
          ✕
        </button>
        <SessionProgressBar current={progress.completed + 1} total={progress.total} />
        <div style={styles.xpIndicator}>
          +{completedExercises.reduce((sum, c) => sum + c.xpResult.totalXP, 0)} XP
        </div>
      </header>

      {/* Main Content */}
      <main style={styles.main}>
        <AnimatePresence mode="wait">
          {phase === PHASE.PREVIEW && (
            <PreviewPhase
              key="preview"
              exercise={currentExercise}
              onStart={handleStartWatch}
              onSkip={handleSkip}
            />
          )}

          {phase === PHASE.WATCH && (
            <WatchPhase
              key="watch"
              exercise={currentExercise}
              onContinue={() => setPhase(PHASE.PRACTICE)}
              onRewatch={() => {}}
            />
          )}

          {phase === PHASE.PRACTICE && (
            <PracticePhase
              key="practice"
              exercise={currentExercise}
              onComplete={handlePracticeComplete}
            />
          )}

          {phase === PHASE.RATE && (
            <SelfAssessment
              key="rate"
              exercise={currentExercise}
              onSubmit={handleRatingSubmit}
              ratingConfig={RATING_CONFIG}
            />
          )}
        </AnimatePresence>

        {/* XP Popup */}
        <AnimatePresence>
          {lastCompletion && (
            <motion.div
              initial={{ y: 50, opacity: 0, scale: 0.5 }}
              animate={{ y: 0, opacity: 1, scale: 1 }}
              exit={{ y: -50, opacity: 0, scale: 0.5 }}
              style={styles.xpPopup}
            >
              <span style={styles.xpPopupIcon}>⭐</span>
              <span style={styles.xpPopupAmount}>+{lastCompletion.xpResult.totalXP} XP</span>
              {lastCompletion.isFirstTime && (
                <span style={styles.xpPopupBonus}>First Time Bonus!</span>
              )}
            </motion.div>
          )}
        </AnimatePresence>
      </main>
    </div>
  );
}

const styles = {
  container: {
    minHeight: '100vh',
    background: `linear-gradient(135deg, ${colors.bgLight} 0%, #dcfce7 100%)`,
    fontFamily: "'Nunito', 'DM Sans', -apple-system, sans-serif",
    display: 'flex',
    flexDirection: 'column',
  },

  // Header
  header: {
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'space-between',
    padding: '16px 20px',
    background: colors.bgCard,
    borderBottom: '1px solid #e5e7eb',
    position: 'sticky',
    top: 0,
    zIndex: 100,
  },

  closeButton: {
    width: 40,
    height: 40,
    borderRadius: '50%',
    border: 'none',
    background: '#f3f4f6',
    fontSize: 18,
    cursor: 'pointer',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
  },

  sessionProgressContainer: {
    flex: 1,
    maxWidth: 200,
    margin: '0 16px',
  },

  sessionProgressTrack: {
    height: 8,
    background: '#e5e7eb',
    borderRadius: 4,
    overflow: 'hidden',
  },

  sessionProgressFill: {
    height: '100%',
    background: `linear-gradient(90deg, ${colors.green} 0%, ${colors.greenLight} 100%)`,
    borderRadius: 4,
  },

  sessionProgressText: {
    fontSize: 12,
    color: '#6b7280',
    textAlign: 'center',
    display: 'block',
    marginTop: 4,
  },

  xpIndicator: {
    background: `${colors.yellow}30`,
    color: '#92400e',
    padding: '6px 12px',
    borderRadius: 20,
    fontSize: 14,
    fontWeight: 700,
  },

  // Main
  main: {
    flex: 1,
    padding: '24px 20px',
    maxWidth: 500,
    margin: '0 auto',
    width: '100%',
    position: 'relative',
  },

  // Loading
  loadingContainer: {
    minHeight: '100vh',
    display: 'flex',
    flexDirection: 'column',
    alignItems: 'center',
    justifyContent: 'center',
    background: colors.bgLight,
  },

  loadingSpinner: {
    fontSize: 64,
    marginBottom: 16,
  },

  loadingText: {
    color: '#6b7280',
    fontSize: 18,
  },

  // Error
  errorContainer: {
    minHeight: '100vh',
    display: 'flex',
    flexDirection: 'column',
    alignItems: 'center',
    justifyContent: 'center',
    padding: 24,
    background: colors.bgLight,
    textAlign: 'center',
  },

  errorIcon: {
    fontSize: 64,
    marginBottom: 16,
  },

  errorTitle: {
    fontSize: 24,
    fontWeight: 700,
    color: '#374151',
    marginBottom: 8,
  },

  errorText: {
    fontSize: 16,
    color: '#6b7280',
    marginBottom: 24,
    maxWidth: 300,
  },

  // Phase Container
  phaseContainer: {
    display: 'flex',
    flexDirection: 'column',
    alignItems: 'center',
    textAlign: 'center',
  },

  // Category Badge
  categoryBadge: {
    display: 'inline-flex',
    alignItems: 'center',
    gap: 6,
    padding: '6px 14px',
    borderRadius: 20,
    fontSize: 14,
    fontWeight: 600,
    marginBottom: 16,
  },

  // Exercise Name
  exerciseName: {
    fontSize: 28,
    fontWeight: 700,
    color: '#166534',
    margin: '0 0 8px 0',
  },

  skillName: {
    fontSize: 16,
    color: '#6b7280',
    margin: '0 0 16px 0',
  },

  // Difficulty
  difficultyStars: {
    marginBottom: 24,
  },

  star: {
    fontSize: 20,
    marginRight: 2,
  },

  // Video Thumbnail
  videoThumbnail: {
    width: '100%',
    maxWidth: 350,
    aspectRatio: '16/9',
    borderRadius: 16,
    overflow: 'hidden',
    marginBottom: 20,
    background: '#1f2937',
  },

  thumbnailPlaceholder: {
    width: '100%',
    height: '100%',
    display: 'flex',
    flexDirection: 'column',
    alignItems: 'center',
    justifyContent: 'center',
    background: 'linear-gradient(135deg, #1f2937 0%, #374151 100%)',
  },

  playIcon: {
    fontSize: 48,
    marginBottom: 8,
  },

  videoLabel: {
    color: '#fff',
    fontSize: 16,
    fontWeight: 600,
  },

  noVideoPlaceholder: {
    width: '100%',
    height: '100%',
    display: 'flex',
    flexDirection: 'column',
    alignItems: 'center',
    justifyContent: 'center',
    background: `linear-gradient(135deg, ${colors.blue} 0%, #1d4ed8 100%)`,
  },

  noVideoIcon: {
    fontSize: 48,
    marginBottom: 8,
  },

  noVideoLabel: {
    color: '#fff',
    fontSize: 16,
    fontWeight: 600,
  },

  // Description
  exerciseDescription: {
    fontSize: 16,
    color: '#4b5563',
    lineHeight: 1.6,
    marginBottom: 24,
    maxWidth: 350,
  },

  // Action Buttons
  actionButtons: {
    display: 'flex',
    flexDirection: 'column',
    gap: 12,
    width: '100%',
    maxWidth: 350,
  },

  primaryButton: {
    width: '100%',
    padding: '18px 32px',
    fontSize: 18,
    fontWeight: 700,
    color: '#fff',
    background: `linear-gradient(135deg, ${colors.green} 0%, ${colors.greenDark} 100%)`,
    border: 'none',
    borderRadius: 16,
    cursor: 'pointer',
    boxShadow: `0 4px 14px rgba(34, 197, 94, 0.4)`,
  },

  secondaryButton: {
    width: '100%',
    padding: '14px 24px',
    fontSize: 16,
    fontWeight: 600,
    color: '#374151',
    background: '#f3f4f6',
    border: 'none',
    borderRadius: 12,
    cursor: 'pointer',
  },

  skipButton: {
    background: 'transparent',
    border: 'none',
    color: '#9ca3af',
    fontSize: 14,
    cursor: 'pointer',
    padding: '8px 16px',
  },

  // Watch Phase
  phaseTitle: {
    fontSize: 24,
    fontWeight: 700,
    color: '#166534',
    marginBottom: 20,
  },

  videoContainer: {
    width: '100%',
    maxWidth: 400,
    aspectRatio: '16/9',
    borderRadius: 16,
    overflow: 'hidden',
    marginBottom: 20,
    background: '#000',
  },

  videoIframe: {
    width: '100%',
    height: '100%',
    border: 'none',
  },

  videoPlayer: {
    width: '100%',
    height: '100%',
    objectFit: 'cover',
  },

  noVideoMessage: {
    width: '100%',
    height: '100%',
    display: 'flex',
    flexDirection: 'column',
    alignItems: 'center',
    justifyContent: 'center',
    background: colors.bgCard,
    padding: 24,
  },

  instructionIcon: {
    fontSize: 48,
    marginBottom: 12,
  },

  instructionTitle: {
    fontSize: 18,
    fontWeight: 700,
    color: '#374151',
    marginBottom: 8,
  },

  instructionText: {
    fontSize: 14,
    color: '#6b7280',
    textAlign: 'center',
    lineHeight: 1.5,
  },

  keyPoints: {
    background: '#fef3c7',
    borderRadius: 12,
    padding: 16,
    marginBottom: 24,
    width: '100%',
    maxWidth: 350,
    textAlign: 'left',
  },

  keyPointsTitle: {
    fontSize: 14,
    fontWeight: 700,
    color: '#92400e',
    marginBottom: 8,
  },

  keyPointsList: {
    margin: 0,
    paddingLeft: 20,
    color: '#78350f',
    fontSize: 14,
    lineHeight: 1.8,
  },

  // Practice Phase
  practicePhaseContainer: {
    display: 'flex',
    flexDirection: 'column',
    alignItems: 'center',
    textAlign: 'center',
    padding: '20px 0',
  },

  practiceTitle: {
    fontSize: 22,
    fontWeight: 700,
    color: '#166534',
    marginBottom: 24,
  },

  goPracticeContainer: {
    display: 'flex',
    flexDirection: 'column',
    alignItems: 'center',
    padding: '40px',
    background: `linear-gradient(135deg, ${colors.green} 0%, ${colors.greenDark} 100%)`,
    borderRadius: 24,
    marginBottom: 32,
    width: '100%',
    maxWidth: 320,
  },

  goPracticeIcon: {
    fontSize: 64,
    marginBottom: 12,
  },

  goPracticeText: {
    fontSize: 28,
    fontWeight: 800,
    color: '#fff',
    marginBottom: 8,
  },

  goPracticeSubtext: {
    fontSize: 14,
    color: 'rgba(255,255,255,0.8)',
  },

  timerContainer: {
    display: 'flex',
    flexDirection: 'column',
    alignItems: 'center',
    marginBottom: 24,
  },

  timerLabel: {
    fontSize: 14,
    color: '#6b7280',
    marginBottom: 4,
  },

  timerValue: {
    fontSize: 48,
    fontWeight: 700,
    color: '#166534',
    fontVariantNumeric: 'tabular-nums',
  },

  unlockProgress: {
    width: '100%',
    maxWidth: 280,
    marginBottom: 24,
  },

  unlockProgressTrack: {
    height: 8,
    background: '#e5e7eb',
    borderRadius: 4,
    overflow: 'hidden',
    marginBottom: 8,
  },

  unlockProgressFill: {
    height: '100%',
    background: `linear-gradient(90deg, ${colors.yellow} 0%, ${colors.coral} 100%)`,
    borderRadius: 4,
  },

  unlockText: {
    fontSize: 14,
    color: '#6b7280',
  },

  quickTips: {
    background: '#f3f4f6',
    borderRadius: 12,
    padding: 16,
    marginBottom: 20,
    width: '100%',
    maxWidth: 320,
  },

  tipText: {
    fontSize: 14,
    color: '#4b5563',
    margin: 0,
  },

  reminderButton: {
    background: 'transparent',
    border: '2px solid #e5e7eb',
    borderRadius: 12,
    padding: '12px 20px',
    fontSize: 14,
    color: '#6b7280',
    cursor: 'pointer',
    marginBottom: 20,
  },

  doneButton: {
    maxWidth: 320,
  },

  // XP Popup
  xpPopup: {
    position: 'fixed',
    top: '50%',
    left: '50%',
    transform: 'translate(-50%, -50%)',
    background: colors.bgCard,
    borderRadius: 24,
    padding: '32px 48px',
    boxShadow: '0 20px 60px rgba(0, 0, 0, 0.2)',
    display: 'flex',
    flexDirection: 'column',
    alignItems: 'center',
    zIndex: 1000,
  },

  xpPopupIcon: {
    fontSize: 48,
    marginBottom: 8,
  },

  xpPopupAmount: {
    fontSize: 32,
    fontWeight: 800,
    color: colors.yellow,
  },

  xpPopupBonus: {
    fontSize: 14,
    color: colors.coral,
    fontWeight: 600,
    marginTop: 8,
  },
};
