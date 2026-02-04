import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';

/**
 * Kid-friendly Onboarding Wizard
 * Collects age group and daily goal preferences
 */
export default function OnboardingWizard({ onComplete }) {
  const [step, setStep] = useState(0);
  const [selectedAge, setSelectedAge] = useState(null);
  const [selectedGoal, setSelectedGoal] = useState(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const ages = [7, 8, 9, 10, 11, 12, 13, '14+'];

  const goals = [
    {
      id: 'easy',
      label: 'Easy',
      xp: 30,
      exercises: 1,
      emoji: '🌱',
      description: '1 exercise per day',
      color: '#22c55e',
    },
    {
      id: 'regular',
      label: 'Regular',
      xp: 50,
      exercises: 3,
      emoji: '⭐',
      description: '3 exercises per day',
      color: '#3b82f6',
    },
    {
      id: 'challenge',
      label: 'Challenge',
      xp: 100,
      exercises: 5,
      emoji: '🔥',
      description: '5 exercises per day',
      color: '#f97316',
    },
  ];

  const handleComplete = async () => {
    if (!selectedAge || !selectedGoal) return;

    setIsSubmitting(true);
    try {
      const ageGroup = selectedAge === '14+' ? 'U-15+' : `U-${selectedAge}`;
      const goal = goals.find((g) => g.id === selectedGoal);

      await onComplete({
        ageGroup,
        dailyXPGoal: goal.xp,
      });
    } catch (err) {
      console.error('Error completing onboarding:', err);
      setIsSubmitting(false);
    }
  };

  const slideVariants = {
    enter: (direction) => ({
      x: direction > 0 ? 300 : -300,
      opacity: 0,
    }),
    center: {
      x: 0,
      opacity: 1,
    },
    exit: (direction) => ({
      x: direction < 0 ? 300 : -300,
      opacity: 0,
    }),
  };

  const renderStep = () => {
    switch (step) {
      case 0:
        return (
          <motion.div
            key="welcome"
            custom={1}
            variants={slideVariants}
            initial="enter"
            animate="center"
            exit="exit"
            transition={{ duration: 0.3 }}
            style={styles.stepContainer}
          >
            {/* Animated Football */}
            <motion.div
              animate={{
                y: [0, -15, 0],
                rotate: [0, 10, -10, 0],
              }}
              transition={{
                duration: 2,
                repeat: Infinity,
                ease: 'easeInOut',
              }}
              style={styles.mascot}
            >
              ⚽
            </motion.div>

            <h1 style={styles.title}>Welcome to Versa Footy!</h1>

            <p style={styles.subtitle}>Let's set up your training journey!</p>

            <motion.button
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
              onClick={() => setStep(1)}
              style={styles.primaryButton}
            >
              Let's Go! →
            </motion.button>
          </motion.div>
        );

      case 1:
        return (
          <motion.div
            key="age"
            custom={1}
            variants={slideVariants}
            initial="enter"
            animate="center"
            exit="exit"
            transition={{ duration: 0.3 }}
            style={styles.stepContainer}
          >
            <h1 style={styles.title}>How old are you?</h1>

            <p style={styles.subtitle}>We'll pick the perfect exercises for you!</p>

            <div style={styles.ageGrid}>
              {ages.map((age) => (
                <motion.button
                  key={age}
                  whileHover={{ scale: 1.08 }}
                  whileTap={{ scale: 0.95 }}
                  onClick={() => setSelectedAge(age)}
                  style={{
                    ...styles.ageButton,
                    ...(selectedAge === age ? styles.ageButtonSelected : {}),
                  }}
                >
                  {age}
                </motion.button>
              ))}
            </div>

            <div style={styles.navigationButtons}>
              <button onClick={() => setStep(0)} style={styles.backButton}>
                ← Back
              </button>
              <motion.button
                whileHover={selectedAge ? { scale: 1.05 } : {}}
                whileTap={selectedAge ? { scale: 0.95 } : {}}
                onClick={() => selectedAge && setStep(2)}
                disabled={!selectedAge}
                style={{
                  ...styles.primaryButton,
                  opacity: selectedAge ? 1 : 0.5,
                  cursor: selectedAge ? 'pointer' : 'not-allowed',
                }}
              >
                Next →
              </motion.button>
            </div>
          </motion.div>
        );

      case 2:
        return (
          <motion.div
            key="goal"
            custom={1}
            variants={slideVariants}
            initial="enter"
            animate="center"
            exit="exit"
            transition={{ duration: 0.3 }}
            style={styles.stepContainer}
          >
            <h1 style={styles.title}>How much do you want to practice?</h1>

            <p style={styles.subtitle}>You can change this anytime!</p>

            <div style={styles.goalContainer}>
              {goals.map((goal) => (
                <motion.button
                  key={goal.id}
                  whileHover={{ scale: 1.03, y: -4 }}
                  whileTap={{ scale: 0.98 }}
                  onClick={() => setSelectedGoal(goal.id)}
                  style={{
                    ...styles.goalCard,
                    ...(selectedGoal === goal.id
                      ? {
                          borderColor: goal.color,
                          background: `${goal.color}15`,
                        }
                      : {}),
                  }}
                >
                  <span style={styles.goalEmoji}>{goal.emoji}</span>
                  <span
                    style={{
                      ...styles.goalLabel,
                      color: selectedGoal === goal.id ? goal.color : '#374151',
                    }}
                  >
                    {goal.label}
                  </span>
                  <span style={styles.goalDescription}>{goal.description}</span>
                </motion.button>
              ))}
            </div>

            <div style={styles.navigationButtons}>
              <button onClick={() => setStep(1)} style={styles.backButton}>
                ← Back
              </button>
              <motion.button
                whileHover={selectedGoal ? { scale: 1.05 } : {}}
                whileTap={selectedGoal ? { scale: 0.95 } : {}}
                onClick={() => selectedGoal && setStep(3)}
                disabled={!selectedGoal}
                style={{
                  ...styles.primaryButton,
                  opacity: selectedGoal ? 1 : 0.5,
                  cursor: selectedGoal ? 'pointer' : 'not-allowed',
                }}
              >
                Next →
              </motion.button>
            </div>
          </motion.div>
        );

      case 3:
        return (
          <motion.div
            key="ready"
            custom={1}
            variants={slideVariants}
            initial="enter"
            animate="center"
            exit="exit"
            transition={{ duration: 0.3 }}
            style={styles.stepContainer}
          >
            {/* Celebration Animation */}
            <motion.div
              initial={{ scale: 0 }}
              animate={{ scale: 1 }}
              transition={{ type: 'spring', stiffness: 200, delay: 0.2 }}
              style={styles.celebration}
            >
              🎉
            </motion.div>

            <motion.h1
              initial={{ y: 20, opacity: 0 }}
              animate={{ y: 0, opacity: 1 }}
              transition={{ delay: 0.3 }}
              style={styles.title}
            >
              You're all set!
            </motion.h1>

            <motion.p
              initial={{ y: 20, opacity: 0 }}
              animate={{ y: 0, opacity: 1 }}
              transition={{ delay: 0.4 }}
              style={styles.subtitle}
            >
              Let's start your first training session!
            </motion.p>

            {/* Summary */}
            <motion.div
              initial={{ y: 20, opacity: 0 }}
              animate={{ y: 0, opacity: 1 }}
              transition={{ delay: 0.5 }}
              style={styles.summary}
            >
              <div style={styles.summaryItem}>
                <span style={styles.summaryLabel}>Age Group</span>
                <span style={styles.summaryValue}>
                  {selectedAge === '14+' ? 'U-15+' : `U-${selectedAge}`}
                </span>
              </div>
              <div style={styles.summaryItem}>
                <span style={styles.summaryLabel}>Daily Goal</span>
                <span style={styles.summaryValue}>
                  {goals.find((g) => g.id === selectedGoal)?.emoji}{' '}
                  {goals.find((g) => g.id === selectedGoal)?.label}
                </span>
              </div>
            </motion.div>

            <motion.button
              initial={{ y: 20, opacity: 0 }}
              animate={{ y: 0, opacity: 1 }}
              transition={{ delay: 0.6 }}
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
              onClick={handleComplete}
              disabled={isSubmitting}
              style={{
                ...styles.primaryButton,
                ...styles.startButton,
                opacity: isSubmitting ? 0.7 : 1,
              }}
            >
              {isSubmitting ? 'Setting up...' : 'Start Training! ⚽'}
            </motion.button>
          </motion.div>
        );

      default:
        return null;
    }
  };

  return (
    <div style={styles.container}>
      {/* Progress Dots */}
      <div style={styles.progressDots}>
        {[0, 1, 2, 3].map((i) => (
          <div
            key={i}
            style={{
              ...styles.dot,
              ...(i <= step ? styles.dotActive : {}),
            }}
          />
        ))}
      </div>

      <AnimatePresence mode="wait">{renderStep()}</AnimatePresence>
    </div>
  );
}

const styles = {
  container: {
    minHeight: '100vh',
    background: 'linear-gradient(135deg, #ecfdf5 0%, #f0fdf4 50%, #dcfce7 100%)',
    display: 'flex',
    flexDirection: 'column',
    alignItems: 'center',
    justifyContent: 'center',
    padding: '24px',
    fontFamily: "'Nunito', 'DM Sans', -apple-system, BlinkMacSystemFont, sans-serif",
  },

  progressDots: {
    position: 'absolute',
    top: '32px',
    display: 'flex',
    gap: '12px',
  },

  dot: {
    width: '12px',
    height: '12px',
    borderRadius: '50%',
    background: '#d1d5db',
    transition: 'all 0.3s ease',
  },

  dotActive: {
    background: '#22c55e',
    transform: 'scale(1.1)',
  },

  stepContainer: {
    display: 'flex',
    flexDirection: 'column',
    alignItems: 'center',
    textAlign: 'center',
    maxWidth: '500px',
    width: '100%',
  },

  mascot: {
    fontSize: '80px',
    marginBottom: '24px',
  },

  celebration: {
    fontSize: '80px',
    marginBottom: '24px',
  },

  title: {
    fontSize: '32px',
    fontWeight: '700',
    color: '#166534',
    marginBottom: '12px',
    margin: 0,
  },

  subtitle: {
    fontSize: '18px',
    color: '#4b5563',
    marginBottom: '32px',
    margin: '0 0 32px 0',
  },

  primaryButton: {
    background: 'linear-gradient(135deg, #22c55e 0%, #16a34a 100%)',
    color: 'white',
    border: 'none',
    borderRadius: '16px',
    padding: '18px 40px',
    fontSize: '18px',
    fontWeight: '700',
    cursor: 'pointer',
    boxShadow: '0 4px 14px rgba(34, 197, 94, 0.4)',
    transition: 'all 0.2s ease',
  },

  startButton: {
    padding: '20px 48px',
    fontSize: '20px',
    background: 'linear-gradient(135deg, #3b82f6 0%, #2563eb 100%)',
    boxShadow: '0 4px 14px rgba(59, 130, 246, 0.4)',
  },

  backButton: {
    background: 'transparent',
    border: 'none',
    color: '#6b7280',
    fontSize: '16px',
    cursor: 'pointer',
    padding: '12px 24px',
  },

  navigationButtons: {
    display: 'flex',
    gap: '16px',
    marginTop: '32px',
    alignItems: 'center',
  },

  ageGrid: {
    display: 'grid',
    gridTemplateColumns: 'repeat(4, 1fr)',
    gap: '16px',
    marginBottom: '16px',
    maxWidth: '400px',
    width: '100%',
  },

  ageButton: {
    width: '80px',
    height: '80px',
    borderRadius: '20px',
    border: '3px solid #e5e7eb',
    background: 'white',
    fontSize: '28px',
    fontWeight: '700',
    color: '#374151',
    cursor: 'pointer',
    transition: 'all 0.2s ease',
    boxShadow: '0 2px 8px rgba(0, 0, 0, 0.08)',
  },

  ageButtonSelected: {
    borderColor: '#22c55e',
    background: '#f0fdf4',
    color: '#16a34a',
    boxShadow: '0 4px 14px rgba(34, 197, 94, 0.3)',
  },

  goalContainer: {
    display: 'flex',
    flexDirection: 'column',
    gap: '16px',
    width: '100%',
    maxWidth: '400px',
  },

  goalCard: {
    display: 'flex',
    flexDirection: 'column',
    alignItems: 'center',
    padding: '24px',
    borderRadius: '20px',
    border: '3px solid #e5e7eb',
    background: 'white',
    cursor: 'pointer',
    transition: 'all 0.2s ease',
    boxShadow: '0 2px 8px rgba(0, 0, 0, 0.08)',
  },

  goalEmoji: {
    fontSize: '36px',
    marginBottom: '8px',
  },

  goalLabel: {
    fontSize: '20px',
    fontWeight: '700',
    marginBottom: '4px',
  },

  goalDescription: {
    fontSize: '14px',
    color: '#6b7280',
  },

  summary: {
    background: 'white',
    borderRadius: '16px',
    padding: '24px',
    marginBottom: '24px',
    width: '100%',
    maxWidth: '300px',
    boxShadow: '0 2px 8px rgba(0, 0, 0, 0.08)',
  },

  summaryItem: {
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: '8px 0',
  },

  summaryLabel: {
    color: '#6b7280',
    fontSize: '14px',
  },

  summaryValue: {
    fontWeight: '700',
    color: '#166534',
    fontSize: '16px',
  },
};
