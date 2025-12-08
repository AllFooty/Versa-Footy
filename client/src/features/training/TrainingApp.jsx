import React from 'react';
import { Link } from 'wouter';
import { useAuth } from '../../lib/AuthContext';

// Landing page components
import HeaderLanding from '../landing/components/HeaderLanding';
import FooterLanding from '../landing/components/FooterLanding';
import All4FootyFamilyBar from '../landing/components/All4FootyFamilyBar';

// Styles
import '../landing/styles/landing-globals.css';

/**
 * Versa Footy Training App - User-facing training experience
 * This will eventually be like Duolingo for football skills/drills
 */
export default function TrainingApp() {
  const { user, profile, isAdmin } = useAuth();

  const skillLevels = [
    { name: 'Ball Mastery', level: 1, progress: 0, icon: '⚽', color: '#22c55e' },
    { name: 'Dribbling', level: 1, progress: 0, icon: '🏃', color: '#3b82f6' },
    { name: 'Passing', level: 1, progress: 0, icon: '🎯', color: '#f59e0b' },
    { name: 'Shooting', level: 1, progress: 0, icon: '🥅', color: '#ef4444' },
    { name: 'First Touch', level: 1, progress: 0, icon: '✋', color: '#8b5cf6' },
  ];

  return (
    <>
      <All4FootyFamilyBar />
      <div
        style={{
          minHeight: '100vh',
          background: 'linear-gradient(135deg, #0a0f1a 0%, #1a1f2e 50%, #0d1117 100%)',
          fontFamily: "'DM Sans', -apple-system, BlinkMacSystemFont, sans-serif",
          color: '#e4e4e7',
        }}
      >
        <HeaderLanding />

        {/* Main Content */}
        <main style={{ maxWidth: 1000, margin: '0 auto', padding: '40px 24px 80px' }}>
          
          {/* Admin Panel - Only visible to admins */}
          {isAdmin && (
            <div style={{
              background: 'linear-gradient(135deg, rgba(234, 179, 8, 0.1) 0%, rgba(245, 158, 11, 0.1) 100%)',
              border: '1px solid rgba(234, 179, 8, 0.3)',
              borderRadius: 12,
              padding: '16px 24px',
              marginBottom: 32,
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between',
              flexWrap: 'wrap',
              gap: 16,
            }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
                <span style={{ fontSize: 24 }}>👑</span>
                <div>
                  <p style={{ 
                    fontSize: 14, 
                    fontWeight: 600, 
                    color: '#fbbf24',
                    margin: 0,
                  }}>
                    Admin Access
                  </p>
                  <p style={{ 
                    fontSize: 13, 
                    color: '#a3a3a3',
                    margin: 0,
                  }}>
                    You have administrator privileges
                  </p>
                </div>
              </div>
              <Link href="/library">
                <a style={{
                  display: 'inline-flex',
                  alignItems: 'center',
                  gap: 8,
                  padding: '10px 20px',
                  background: 'linear-gradient(135deg, #f59e0b, #d97706)',
                  color: '#0b1020',
                  fontWeight: 600,
                  fontSize: 14,
                  textDecoration: 'none',
                  borderRadius: 8,
                  boxShadow: '0 4px 12px rgba(245, 158, 11, 0.3)',
                  transition: 'transform 0.2s, box-shadow 0.2s',
                }}>
                  <span>📚</span>
                  Exercise Library
                </a>
              </Link>
            </div>
          )}

          {/* Welcome Section */}
          <div style={{ textAlign: 'center', marginBottom: 48 }}>
            <h1 style={{ 
              fontSize: 36, 
              fontWeight: 700, 
              marginBottom: 12,
              background: 'linear-gradient(135deg, #fff 0%, #a5b4fc 100%)',
              WebkitBackgroundClip: 'text',
              WebkitTextFillColor: 'transparent',
            }}>
              Welcome back, {profile?.full_name || user?.email?.split('@')[0] || 'Player'}! 👋
            </h1>
            <p style={{ fontSize: 18, color: '#9ca3af' }}>
              Your personalized football training journey
            </p>
          </div>

          {/* Coming Soon Banner */}
          <div style={{
            background: 'linear-gradient(135deg, rgba(37, 99, 235, 0.15) 0%, rgba(139, 92, 246, 0.15) 100%)',
            border: '1px solid rgba(99, 102, 241, 0.3)',
            borderRadius: 16,
            padding: '32px 40px',
            marginBottom: 48,
            textAlign: 'center',
          }}>
            <div style={{ fontSize: 48, marginBottom: 16 }}>🚀</div>
            <h2 style={{ fontSize: 24, fontWeight: 600, marginBottom: 12, color: '#e5e7eb' }}>
              Something Amazing is Coming!
            </h2>
            <p style={{ fontSize: 16, color: '#9ca3af', maxWidth: 600, margin: '0 auto', lineHeight: 1.7 }}>
              We're building an incredible training experience - like <strong style={{ color: '#a5b4fc' }}>Duolingo for Football</strong>. 
              Practice drills, master skills, level up, and track your progress. 
              Stay tuned for personalized training sessions tailored just for you!
            </p>
          </div>

          {/* Preview: Skill Levels */}
          <div style={{ marginBottom: 48 }}>
            <h3 style={{ 
              fontSize: 20, 
              fontWeight: 600, 
              marginBottom: 20, 
              color: '#e5e7eb',
              display: 'flex',
              alignItems: 'center',
              gap: 8,
            }}>
              <span>📊</span> Your Skills (Preview)
            </h3>
            
            <div style={{ 
              display: 'grid', 
              gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))',
              gap: 16,
            }}>
              {skillLevels.map((skill) => (
                <div 
                  key={skill.name}
                  style={{
                    background: 'rgba(15, 23, 42, 0.6)',
                    border: '1px solid rgba(255, 255, 255, 0.08)',
                    borderRadius: 12,
                    padding: '20px',
                    display: 'flex',
                    alignItems: 'center',
                    gap: 16,
                  }}
                >
                  <div style={{
                    width: 50,
                    height: 50,
                    borderRadius: 12,
                    background: `${skill.color}20`,
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    fontSize: 24,
                  }}>
                    {skill.icon}
                  </div>
                  <div style={{ flex: 1 }}>
                    <div style={{ 
                      display: 'flex', 
                      justifyContent: 'space-between', 
                      alignItems: 'center',
                      marginBottom: 8,
                    }}>
                      <span style={{ fontWeight: 600, color: '#e5e7eb' }}>{skill.name}</span>
                      <span style={{ 
                        fontSize: 12, 
                        color: skill.color,
                        background: `${skill.color}20`,
                        padding: '2px 8px',
                        borderRadius: 10,
                        fontWeight: 600,
                      }}>
                        Level {skill.level}
                      </span>
                    </div>
                    <div style={{
                      height: 6,
                      background: 'rgba(255, 255, 255, 0.1)',
                      borderRadius: 3,
                      overflow: 'hidden',
                    }}>
                      <div style={{
                        width: `${skill.progress}%`,
                        height: '100%',
                        background: skill.color,
                        borderRadius: 3,
                        transition: 'width 0.3s ease',
                      }} />
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Features Coming */}
          <div>
            <h3 style={{ 
              fontSize: 20, 
              fontWeight: 600, 
              marginBottom: 20, 
              color: '#e5e7eb',
              display: 'flex',
              alignItems: 'center',
              gap: 8,
            }}>
              <span>✨</span> Features Coming Soon
            </h3>
            
            <div style={{ 
              display: 'grid', 
              gridTemplateColumns: 'repeat(auto-fit, minmax(250px, 1fr))',
              gap: 16,
            }}>
              {[
                { icon: '🎯', title: 'Daily Training', desc: 'Personalized drills based on your skill level' },
                { icon: '📈', title: 'Progress Tracking', desc: 'Watch yourself improve over time' },
                { icon: '🏆', title: 'Achievements', desc: 'Earn badges as you master new skills' },
                { icon: '🔥', title: 'Streaks', desc: 'Build consistency with daily practice' },
                { icon: '📹', title: 'Video Tutorials', desc: 'Learn from pro-level demonstrations' },
                { icon: '🤖', title: 'AI Coaching', desc: 'Get personalized feedback and tips' },
              ].map((feature) => (
                <div
                  key={feature.title}
                  style={{
                    background: 'rgba(15, 23, 42, 0.4)',
                    border: '1px solid rgba(255, 255, 255, 0.06)',
                    borderRadius: 12,
                    padding: '20px',
                    opacity: 0.7,
                  }}
                >
                  <div style={{ fontSize: 28, marginBottom: 12 }}>{feature.icon}</div>
                  <h4 style={{ fontSize: 16, fontWeight: 600, color: '#d1d5db', marginBottom: 6 }}>
                    {feature.title}
                  </h4>
                  <p style={{ fontSize: 14, color: '#6b7280', lineHeight: 1.5 }}>
                    {feature.desc}
                  </p>
                </div>
              ))}
            </div>
          </div>

        </main>
      </div>

      <FooterLanding />
    </>
  );
}
