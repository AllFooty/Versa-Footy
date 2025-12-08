import React from 'react';

/**
 * App header with logo and stats display
 * Now with mobile-responsive design
 */
const Header = ({ stats }) => {
  const { totalCategories, totalSkills, totalExercises } = stats;

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

          {/* Stats */}
          <div style={{ display: 'flex', gap: 24 }}>
            <StatItem value={totalCategories} label="Categories" color="#3b82f6" />
            <StatItem value={totalSkills} label="Skills" color="#22c55e" />
            <StatItem value={totalExercises} label="Exercises" color="#f97316" />
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

        </div>

        {/* Mobile Stats Bar */}
        <div className="mobile-stats-bar" style={{ marginTop: 12 }}>
          <MobileStatItem value={totalCategories} label="Categories" color="#3b82f6" />
          <MobileStatItem value={totalSkills} label="Skills" color="#22c55e" />
          <MobileStatItem value={totalExercises} label="Exercises" color="#f97316" />
        </div>
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
