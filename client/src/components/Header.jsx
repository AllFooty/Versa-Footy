import React from 'react';
import { useAuth } from '../lib/AuthContext';

/**
 * App header with logo, stats display, and sign out
 */
const Header = ({ stats }) => {
  const { totalCategories, totalSkills, totalExercises } = stats;
  const { user, signOut } = useAuth();

  const handleSignOut = async () => {
    await signOut();
  };

  return (
    <header
      style={{
        background: 'rgba(0,0,0,0.3)',
        borderBottom: '1px solid rgba(255,255,255,0.06)',
        padding: '20px 40px',
        position: 'sticky',
        top: 0,
        zIndex: 100,
        backdropFilter: 'blur(20px)',
      }}
    >
      <div
        style={{
          maxWidth: 1400,
          margin: '0 auto',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
        }}
      >
        {/* Logo & Title */}
        <div style={{ display: 'flex', alignItems: 'center', gap: 16 }}>
          <div
            style={{
              width: 48,
              height: 48,
              background: 'linear-gradient(135deg, #3b82f6 0%, #8b5cf6 100%)',
              borderRadius: 12,
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              fontSize: 24,
            }}
          >
            ⚽
          </div>
          <div>
            <h1
              style={{
                fontFamily: "'Space Grotesk', sans-serif",
                fontSize: 22,
                fontWeight: 700,
                margin: 0,
                background: 'linear-gradient(135deg, #fff 0%, #a1a1aa 100%)',
                WebkitBackgroundClip: 'text',
                WebkitTextFillColor: 'transparent',
              }}
            >
              Versa Footy Library
            </h1>
            <p style={{ margin: 0, fontSize: 13, color: '#71717a' }}>
              Football Skills & Drills Management
            </p>
          </div>
        </div>

        {/* Stats & User */}
        <div style={{ display: 'flex', alignItems: 'center', gap: 32 }}>
          {/* Stats */}
          <div style={{ display: 'flex', gap: 24 }}>
            <StatItem value={totalCategories} label="Categories" color="#3b82f6" />
            <StatItem value={totalSkills} label="Skills" color="#22c55e" />
            <StatItem value={totalExercises} label="Exercises" color="#f97316" />
          </div>

          {/* User & Sign Out */}
          {user && (
            <div 
              style={{ 
                display: 'flex', 
                alignItems: 'center', 
                gap: 12,
                paddingLeft: 24,
                borderLeft: '1px solid rgba(255,255,255,0.1)',
              }}
            >
              <div style={{ textAlign: 'right' }}>
                <p style={{ 
                  margin: 0, 
                  fontSize: 13, 
                  color: '#a1a1aa',
                  maxWidth: 160,
                  overflow: 'hidden',
                  textOverflow: 'ellipsis',
                  whiteSpace: 'nowrap',
                }}>
                  {user.email}
                </p>
              </div>
              <button
                onClick={handleSignOut}
                style={{
                  padding: '8px 14px',
                  borderRadius: 8,
                  border: '1px solid rgba(255,255,255,0.1)',
                  background: 'rgba(255,255,255,0.05)',
                  color: '#a1a1aa',
                  fontSize: 13,
                  fontWeight: 500,
                  cursor: 'pointer',
                  transition: 'all 0.2s',
                }}
                onMouseEnter={(e) => {
                  e.target.style.background = 'rgba(239, 68, 68, 0.1)';
                  e.target.style.borderColor = 'rgba(239, 68, 68, 0.3)';
                  e.target.style.color = '#fca5a5';
                }}
                onMouseLeave={(e) => {
                  e.target.style.background = 'rgba(255,255,255,0.05)';
                  e.target.style.borderColor = 'rgba(255,255,255,0.1)';
                  e.target.style.color = '#a1a1aa';
                }}
              >
                Sign out
              </button>
            </div>
          )}
        </div>
      </div>
    </header>
  );
};

/**
 * Individual stat display item
 */
const StatItem = ({ value, label, color }) => (
  <div style={{ textAlign: 'center' }}>
    <div style={{ fontSize: 24, fontWeight: 700, color }}>{value}</div>
    <div
      style={{
        fontSize: 11,
        color: '#71717a',
        textTransform: 'uppercase',
        letterSpacing: 1,
      }}
    >
      {label}
    </div>
  </div>
);

export default Header;
