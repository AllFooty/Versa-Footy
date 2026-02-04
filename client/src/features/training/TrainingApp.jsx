import React, { useState, useEffect } from 'react';
import { Link, useLocation } from 'wouter';
import { motion, AnimatePresence } from 'framer-motion';
import { useAuth } from '../../lib/AuthContext';
import { usePlayerProgress } from './hooks/usePlayerProgress';
import { useTrainingSession } from './hooks/useTrainingSession';
import OnboardingWizard from './components/OnboardingWizard';

// Landing page components (keep for admin panel)
import HeaderLanding from '../landing/components/HeaderLanding';
import FooterLanding from '../landing/components/FooterLanding';
import All4FootyFamilyBar from '../landing/components/All4FootyFamilyBar';

// Styles
import '../landing/styles/landing-globals.css';

/**
 * Kid-friendly color palette
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
 * Daily Goal Card Component
 */
function DailyGoalCard({ dailyGoalProgress, onStartTraining, loading }) {
  const { current, goal, progress, met, exercisesCompleted } = dailyGoalProgress;

  return (
    <motion.div
      initial={{ y: 20, opacity: 0 }}
      animate={{ y: 0, opacity: 1 }}
      style={styles.dailyGoalCard}
    >
      <div style={styles.dailyGoalHeader}>
        <span style={styles.dailyGoalTitle}>Today's Goal</span>
        {met && <span style={styles.goalMetBadge}>Complete!</span>}
      </div>

      {/* Progress Bar */}
      <div style={styles.progressBarContainer}>
        <div style={styles.progressBarTrack}>
          <motion.div
            initial={{ width: 0 }}
            animate={{ width: `${progress}%` }}
            transition={{ duration: 0.5, ease: 'easeOut' }}
            style={{
              ...styles.progressBarFill,
              background: met ? colors.green : `linear-gradient(90deg, ${colors.green} 0%, ${colors.greenLight} 100%)`,
            }}
          />
        </div>
        <span style={styles.progressText}>{current} / {goal} XP</span>
      </div>

      {/* Exercises completed */}
      <p style={styles.exercisesText}>
        {exercisesCompleted || 0} exercises completed today
      </p>

      {/* Start Training Button */}
      <motion.button
        whileHover={{ scale: 1.03, y: -2 }}
        whileTap={{ scale: 0.98 }}
        onClick={onStartTraining}
        disabled={loading}
        style={styles.startButton}
      >
        {loading ? 'Loading...' : met ? 'Keep Training!' : 'Start Training!'}
        <span style={{ marginLeft: 8 }}>⚽</span>
      </motion.button>
    </motion.div>
  );
}

/**
 * Streak Display Component
 */
function StreakDisplay({ streak, shields, longestStreak }) {
  return (
    <motion.div
      initial={{ scale: 0.9, opacity: 0 }}
      animate={{ scale: 1, opacity: 1 }}
      style={styles.streakCard}
    >
      <div style={styles.streakMain}>
        <motion.span
          animate={streak > 0 ? { scale: [1, 1.1, 1] } : {}}
          transition={{ repeat: Infinity, duration: 2 }}
          style={styles.streakIcon}
        >
          🔥
        </motion.span>
        <div style={styles.streakInfo}>
          <span style={styles.streakCount}>{streak}</span>
          <span style={styles.streakLabel}>Day Streak</span>
        </div>
      </div>

      {/* Shields */}
      <div style={styles.shieldsContainer}>
        <span style={styles.shieldIcon}>🛡️</span>
        <span style={styles.shieldCount}>{shields}</span>
      </div>
    </motion.div>
  );
}

/**
 * XP & Level Display Component
 */
function XPDisplay({ levelProgress, totalXP }) {
  if (!levelProgress) return null;

  return (
    <motion.div
      initial={{ scale: 0.9, opacity: 0 }}
      animate={{ scale: 1, opacity: 1 }}
      transition={{ delay: 0.1 }}
      style={styles.xpCard}
    >
      <div style={styles.levelBadge}>
        <span style={styles.levelNumber}>{levelProgress.level}</span>
        <span style={styles.levelLabel}>Level</span>
      </div>

      <div style={styles.xpInfo}>
        <span style={styles.xpTitle}>{levelProgress.title}</span>
        <div style={styles.xpProgressBar}>
          <motion.div
            initial={{ width: 0 }}
            animate={{ width: `${levelProgress.progress}%` }}
            transition={{ duration: 0.5, delay: 0.2 }}
            style={styles.xpProgressFill}
          />
        </div>
        <span style={styles.xpText}>{totalXP} XP total</span>
      </div>
    </motion.div>
  );
}

/**
 * Skill Preview Card Component
 */
function SkillPreviewCard({ skill }) {
  return (
    <motion.div
      whileHover={{ scale: 1.02, y: -4 }}
      style={styles.skillCard}
    >
      <div style={{
        ...styles.skillIcon,
        background: `${skill.color}20`,
      }}>
        {skill.icon}
      </div>
      <div style={styles.skillInfo}>
        <span style={styles.skillName}>{skill.name}</span>
        <span style={{ ...styles.skillLevel, color: skill.color }}>
          Level {skill.level}
        </span>
      </div>
    </motion.div>
  );
}

/**
 * Versa Footy Training App - Main Component
 */
export default function TrainingApp() {
  const { user, profile, isAdmin } = useAuth();
  const [, setLocation] = useLocation();

  const {
    playerProfile,
    loading: progressLoading,
    needsOnboarding,
    levelProgress,
    dailyGoalProgress,
    createPlayerProfile,
  } = usePlayerProgress();

  const {
    startSession,
    loading: sessionLoading,
  } = useTrainingSession();

  const [showOnboarding, setShowOnboarding] = useState(false);

  // Check if onboarding is needed
  useEffect(() => {
    if (!progressLoading && needsOnboarding) {
      setShowOnboarding(true);
    }
  }, [progressLoading, needsOnboarding]);

  // Handle onboarding completion
  const handleOnboardingComplete = async (data) => {
    try {
      await createPlayerProfile(data);
      setShowOnboarding(false);
    } catch (err) {
      console.error('Error completing onboarding:', err);
    }
  };

  // Handle start training
  const handleStartTraining = async () => {
    try {
      // For now, navigate to a session page (we'll build this next)
      // await startSession(playerProfile, 'standard');
      setLocation('/training/session');
    } catch (err) {
      console.error('Error starting session:', err);
    }
  };

  // Preview skill data (will be connected to real progress later)
  const skillPreviews = [
    { name: 'Ball Mastery', level: playerProfile?.current_level || 1, icon: '⚽', color: '#E63946' },
    { name: 'Dribbling', level: 1, icon: '🏃', color: '#F4A261' },
    { name: 'Passing', level: 1, icon: '🎯', color: '#2A9D8F' },
    { name: 'Shooting', level: 1, icon: '🥅', color: '#E76F51' },
    { name: 'First Touch', level: 1, icon: '✋', color: '#8b5cf6' },
  ];

  // Show onboarding wizard if needed
  if (showOnboarding) {
    return <OnboardingWizard onComplete={handleOnboardingComplete} />;
  }

  // Show loading state
  if (progressLoading) {
    return (
      <div style={styles.loadingContainer}>
        <motion.div
          animate={{ rotate: 360 }}
          transition={{ repeat: Infinity, duration: 1, ease: 'linear' }}
          style={styles.loadingSpinner}
        >
          ⚽
        </motion.div>
        <p style={styles.loadingText}>Loading your training...</p>
      </div>
    );
  }

  return (
    <>
      <All4FootyFamilyBar />
      <div style={styles.container}>
        <HeaderLanding />

        <main style={styles.main}>
          {/* Admin Panel - Only visible to admins */}
          {isAdmin && (
            <motion.div
              initial={{ y: -10, opacity: 0 }}
              animate={{ y: 0, opacity: 1 }}
              style={styles.adminPanel}
            >
              <div style={styles.adminInfo}>
                <span style={styles.adminIcon}>👑</span>
                <div>
                  <p style={styles.adminTitle}>Admin Access</p>
                  <p style={styles.adminSubtitle}>You have administrator privileges</p>
                </div>
              </div>
              <Link href="/library">
                <a style={styles.adminButton}>
                  <span>📚</span> Exercise Library
                </a>
              </Link>
            </motion.div>
          )}

          {/* Welcome Section */}
          <motion.div
            initial={{ y: 20, opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
            style={styles.welcomeSection}
          >
            <h1 style={styles.welcomeTitle}>
              Hey {profile?.full_name || user?.email?.split('@')[0] || 'Player'}! 👋
            </h1>
            <p style={styles.welcomeSubtitle}>Ready to train today?</p>
          </motion.div>

          {/* Stats Row */}
          <div style={styles.statsRow}>
            <StreakDisplay
              streak={playerProfile?.current_streak || 0}
              shields={playerProfile?.streak_shields || 3}
              longestStreak={playerProfile?.longest_streak || 0}
            />
            <XPDisplay
              levelProgress={levelProgress}
              totalXP={playerProfile?.total_xp || 0}
            />
          </div>

          {/* Daily Goal Card */}
          <DailyGoalCard
            dailyGoalProgress={dailyGoalProgress}
            onStartTraining={handleStartTraining}
            loading={sessionLoading}
          />

          {/* Skills Preview */}
          <motion.div
            initial={{ y: 20, opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
            transition={{ delay: 0.2 }}
            style={styles.skillsSection}
          >
            <h2 style={styles.sectionTitle}>
              <span>📊</span> Your Skills
            </h2>
            <div style={styles.skillsGrid}>
              {skillPreviews.map((skill) => (
                <SkillPreviewCard key={skill.name} skill={skill} />
              ))}
            </div>
          </motion.div>

          {/* Coming Soon Features */}
          <motion.div
            initial={{ y: 20, opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
            transition={{ delay: 0.3 }}
            style={styles.featuresSection}
          >
            <h2 style={styles.sectionTitle}>
              <span>✨</span> Coming Soon
            </h2>
            <div style={styles.featuresGrid}>
              {[
                { icon: '🗺️', title: 'Skill Path', desc: 'Journey through skills' },
                { icon: '🏆', title: 'Achievements', desc: 'Earn badges' },
                { icon: '📹', title: 'Video Tutorials', desc: 'Pro demonstrations' },
              ].map((feature) => (
                <div key={feature.title} style={styles.featureCard}>
                  <span style={styles.featureIcon}>{feature.icon}</span>
                  <span style={styles.featureTitle}>{feature.title}</span>
                  <span style={styles.featureDesc}>{feature.desc}</span>
                </div>
              ))}
            </div>
          </motion.div>
        </main>
      </div>

      <FooterLanding />
    </>
  );
}

const styles = {
  container: {
    minHeight: '100vh',
    background: `linear-gradient(135deg, ${colors.bgLight} 0%, #dcfce7 50%, #ecfdf5 100%)`,
    fontFamily: "'Nunito', 'DM Sans', -apple-system, BlinkMacSystemFont, sans-serif",
  },

  main: {
    maxWidth: 800,
    margin: '0 auto',
    padding: '24px 20px 80px',
  },

  loadingContainer: {
    minHeight: '100vh',
    display: 'flex',
    flexDirection: 'column',
    alignItems: 'center',
    justifyContent: 'center',
    background: colors.bgLight,
  },

  loadingSpinner: {
    fontSize: 48,
    marginBottom: 16,
  },

  loadingText: {
    color: '#6b7280',
    fontSize: 16,
  },

  // Admin Panel
  adminPanel: {
    background: 'linear-gradient(135deg, rgba(234, 179, 8, 0.15) 0%, rgba(245, 158, 11, 0.15) 100%)',
    border: '2px solid rgba(234, 179, 8, 0.4)',
    borderRadius: 16,
    padding: '16px 20px',
    marginBottom: 24,
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'space-between',
    flexWrap: 'wrap',
    gap: 16,
  },

  adminInfo: {
    display: 'flex',
    alignItems: 'center',
    gap: 12,
  },

  adminIcon: {
    fontSize: 24,
  },

  adminTitle: {
    fontSize: 14,
    fontWeight: 700,
    color: '#92400e',
    margin: 0,
  },

  adminSubtitle: {
    fontSize: 13,
    color: '#a3a3a3',
    margin: 0,
  },

  adminButton: {
    display: 'inline-flex',
    alignItems: 'center',
    gap: 8,
    padding: '10px 20px',
    background: 'linear-gradient(135deg, #f59e0b, #d97706)',
    color: '#fff',
    fontWeight: 600,
    fontSize: 14,
    textDecoration: 'none',
    borderRadius: 12,
    boxShadow: '0 4px 12px rgba(245, 158, 11, 0.3)',
  },

  // Welcome Section
  welcomeSection: {
    textAlign: 'center',
    marginBottom: 24,
  },

  welcomeTitle: {
    fontSize: 28,
    fontWeight: 700,
    color: '#166534',
    margin: '0 0 8px 0',
  },

  welcomeSubtitle: {
    fontSize: 18,
    color: '#4b5563',
    margin: 0,
  },

  // Stats Row
  statsRow: {
    display: 'grid',
    gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))',
    gap: 16,
    marginBottom: 24,
  },

  // Streak Card
  streakCard: {
    background: colors.bgCard,
    borderRadius: 20,
    padding: '20px 24px',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'space-between',
    boxShadow: '0 4px 20px rgba(0, 0, 0, 0.08)',
    border: '2px solid #fef3c7',
  },

  streakMain: {
    display: 'flex',
    alignItems: 'center',
    gap: 12,
  },

  streakIcon: {
    fontSize: 36,
  },

  streakInfo: {
    display: 'flex',
    flexDirection: 'column',
  },

  streakCount: {
    fontSize: 28,
    fontWeight: 700,
    color: colors.coral,
    lineHeight: 1,
  },

  streakLabel: {
    fontSize: 14,
    color: '#6b7280',
  },

  shieldsContainer: {
    display: 'flex',
    alignItems: 'center',
    gap: 4,
    background: '#e0f2fe',
    padding: '8px 12px',
    borderRadius: 12,
  },

  shieldIcon: {
    fontSize: 18,
  },

  shieldCount: {
    fontSize: 16,
    fontWeight: 700,
    color: colors.blue,
  },

  // XP Card
  xpCard: {
    background: colors.bgCard,
    borderRadius: 20,
    padding: '20px 24px',
    display: 'flex',
    alignItems: 'center',
    gap: 16,
    boxShadow: '0 4px 20px rgba(0, 0, 0, 0.08)',
    border: '2px solid #dbeafe',
  },

  levelBadge: {
    width: 60,
    height: 60,
    borderRadius: '50%',
    background: `linear-gradient(135deg, ${colors.blue} 0%, #1d4ed8 100%)`,
    display: 'flex',
    flexDirection: 'column',
    alignItems: 'center',
    justifyContent: 'center',
    flexShrink: 0,
  },

  levelNumber: {
    fontSize: 24,
    fontWeight: 700,
    color: '#fff',
    lineHeight: 1,
  },

  levelLabel: {
    fontSize: 10,
    color: 'rgba(255,255,255,0.8)',
    textTransform: 'uppercase',
  },

  xpInfo: {
    flex: 1,
  },

  xpTitle: {
    fontSize: 16,
    fontWeight: 700,
    color: '#1e3a5f',
    display: 'block',
    marginBottom: 8,
  },

  xpProgressBar: {
    height: 8,
    background: '#e5e7eb',
    borderRadius: 4,
    overflow: 'hidden',
    marginBottom: 4,
  },

  xpProgressFill: {
    height: '100%',
    background: `linear-gradient(90deg, ${colors.blue} 0%, #60a5fa 100%)`,
    borderRadius: 4,
  },

  xpText: {
    fontSize: 12,
    color: '#6b7280',
  },

  // Daily Goal Card
  dailyGoalCard: {
    background: colors.bgCard,
    borderRadius: 24,
    padding: '28px',
    marginBottom: 32,
    boxShadow: '0 8px 30px rgba(0, 0, 0, 0.1)',
    border: `3px solid ${colors.greenLight}`,
  },

  dailyGoalHeader: {
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 16,
  },

  dailyGoalTitle: {
    fontSize: 20,
    fontWeight: 700,
    color: '#166534',
  },

  goalMetBadge: {
    background: colors.green,
    color: '#fff',
    fontSize: 12,
    fontWeight: 700,
    padding: '4px 12px',
    borderRadius: 20,
  },

  progressBarContainer: {
    marginBottom: 12,
  },

  progressBarTrack: {
    height: 16,
    background: '#e5e7eb',
    borderRadius: 8,
    overflow: 'hidden',
    marginBottom: 8,
  },

  progressBarFill: {
    height: '100%',
    borderRadius: 8,
  },

  progressText: {
    fontSize: 14,
    color: '#6b7280',
    textAlign: 'right',
    display: 'block',
  },

  exercisesText: {
    fontSize: 14,
    color: '#6b7280',
    marginBottom: 20,
  },

  startButton: {
    width: '100%',
    padding: '18px 32px',
    fontSize: 20,
    fontWeight: 700,
    color: '#fff',
    background: `linear-gradient(135deg, ${colors.green} 0%, ${colors.greenDark} 100%)`,
    border: 'none',
    borderRadius: 16,
    cursor: 'pointer',
    boxShadow: `0 6px 20px rgba(34, 197, 94, 0.4)`,
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
  },

  // Skills Section
  skillsSection: {
    marginBottom: 32,
  },

  sectionTitle: {
    fontSize: 20,
    fontWeight: 700,
    color: '#166534',
    marginBottom: 16,
    display: 'flex',
    alignItems: 'center',
    gap: 8,
  },

  skillsGrid: {
    display: 'grid',
    gridTemplateColumns: 'repeat(auto-fit, minmax(150px, 1fr))',
    gap: 12,
  },

  skillCard: {
    background: colors.bgCard,
    borderRadius: 16,
    padding: '16px',
    display: 'flex',
    alignItems: 'center',
    gap: 12,
    boxShadow: '0 2px 10px rgba(0, 0, 0, 0.06)',
    cursor: 'pointer',
  },

  skillIcon: {
    width: 44,
    height: 44,
    borderRadius: 12,
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    fontSize: 22,
    flexShrink: 0,
  },

  skillInfo: {
    display: 'flex',
    flexDirection: 'column',
  },

  skillName: {
    fontSize: 14,
    fontWeight: 600,
    color: '#374151',
  },

  skillLevel: {
    fontSize: 12,
    fontWeight: 700,
  },

  // Features Section
  featuresSection: {
    marginBottom: 32,
  },

  featuresGrid: {
    display: 'grid',
    gridTemplateColumns: 'repeat(auto-fit, minmax(140px, 1fr))',
    gap: 12,
  },

  featureCard: {
    background: 'rgba(255, 255, 255, 0.7)',
    borderRadius: 16,
    padding: '20px 16px',
    display: 'flex',
    flexDirection: 'column',
    alignItems: 'center',
    textAlign: 'center',
    opacity: 0.8,
  },

  featureIcon: {
    fontSize: 32,
    marginBottom: 8,
  },

  featureTitle: {
    fontSize: 14,
    fontWeight: 700,
    color: '#374151',
    marginBottom: 4,
  },

  featureDesc: {
    fontSize: 12,
    color: '#6b7280',
  },
};
