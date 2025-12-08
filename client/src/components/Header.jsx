import React, { useState } from 'react';
import { useAuth } from '../lib/AuthContext';
import { Menu, X, LogOut } from 'lucide-react';

/**
 * App header with logo, stats display, and sign out
 * Now with mobile-responsive design
 */
const Header = ({ stats }) => {
  const { totalCategories, totalSkills, totalExercises } = stats;
  const { user, signOut } = useAuth();
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  const handleSignOut = async () => {
    setMobileMenuOpen(false);
    await signOut();
  };

  return (
    <>
      {/* Desktop Header */}
      <header
        className="desktop-header"
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

      {/* Mobile Header */}
      <header
        className="mobile-header"
        style={{
          background: 'rgba(0,0,0,0.3)',
          borderBottom: '1px solid rgba(255,255,255,0.06)',
          padding: '12px 16px',
          position: 'sticky',
          top: 0,
          zIndex: 100,
          backdropFilter: 'blur(20px)',
        }}
      >
        <div
          style={{
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
          }}
        >
          {/* Logo & Title - Compact */}
          <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
            <div
              style={{
                width: 40,
                height: 40,
                background: 'linear-gradient(135deg, #3b82f6 0%, #8b5cf6 100%)',
                borderRadius: 10,
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                fontSize: 20,
              }}
            >
              ⚽
            </div>
            <div>
              <h1
                style={{
                  fontFamily: "'Space Grotesk', sans-serif",
                  fontSize: 16,
                  fontWeight: 700,
                  margin: 0,
                  background: 'linear-gradient(135deg, #fff 0%, #a1a1aa 100%)',
                  WebkitBackgroundClip: 'text',
                  WebkitTextFillColor: 'transparent',
                }}
              >
                Versa Footy
              </h1>
              <p style={{ margin: 0, fontSize: 10, color: '#71717a' }}>
                Library
              </p>
            </div>
          </div>

          {/* Menu Button */}
          <button
            onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
            style={{
              width: 44,
              height: 44,
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              background: 'rgba(255,255,255,0.05)',
              border: '1px solid rgba(255,255,255,0.1)',
              borderRadius: 10,
              color: '#e4e4e7',
              cursor: 'pointer',
            }}
          >
            {mobileMenuOpen ? <X size={22} /> : <Menu size={22} />}
          </button>
        </div>

        {/* Mobile Stats Bar */}
        <div className="mobile-stats-bar" style={{ marginTop: 12 }}>
          <MobileStatItem value={totalCategories} label="Categories" color="#3b82f6" />
          <MobileStatItem value={totalSkills} label="Skills" color="#22c55e" />
          <MobileStatItem value={totalExercises} label="Exercises" color="#f97316" />
        </div>

        {/* Mobile Dropdown Menu */}
        {mobileMenuOpen && (
          <div
            style={{
              position: 'absolute',
              top: '100%',
              left: 0,
              right: 0,
              background: 'rgba(20, 25, 35, 0.98)',
              borderBottom: '1px solid rgba(255,255,255,0.06)',
              padding: '16px',
              backdropFilter: 'blur(20px)',
              animation: 'slideUp 0.2s ease-out',
            }}
          >
            {user && (
              <>
                <div
                  style={{
                    padding: '12px 16px',
                    background: 'rgba(255,255,255,0.03)',
                    borderRadius: 10,
                    marginBottom: 12,
                  }}
                >
                  <p style={{ margin: 0, fontSize: 12, color: '#71717a' }}>Signed in as</p>
                  <p style={{ 
                    margin: '4px 0 0', 
                    fontSize: 14, 
                    color: '#e4e4e7',
                    wordBreak: 'break-all',
                  }}>
                    {user.email}
                  </p>
                </div>
                <button
                  onClick={handleSignOut}
                  style={{
                    width: '100%',
                    padding: '14px 16px',
                    borderRadius: 10,
                    border: '1px solid rgba(239, 68, 68, 0.3)',
                    background: 'rgba(239, 68, 68, 0.1)',
                    color: '#fca5a5',
                    fontSize: 14,
                    fontWeight: 500,
                    cursor: 'pointer',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    gap: 8,
                  }}
                >
                  <LogOut size={16} />
                  Sign out
                </button>
              </>
            )}
          </div>
        )}
      </header>
    </>
  );
};

/**
 * Individual stat display item (Desktop)
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

/**
 * Individual stat display item (Mobile - compact)
 */
const MobileStatItem = ({ value, label, color }) => (
  <div className="mobile-stat-item">
    <div className="mobile-stat-value" style={{ color }}>{value}</div>
    <div className="mobile-stat-label">{label}</div>
  </div>
);

export default Header;
