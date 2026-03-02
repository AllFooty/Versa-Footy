import React from 'react';
import { Link, useLocation } from 'wouter';
import { useAuth } from '../../lib/AuthContext';

const containerStyle = {
  minHeight: '100vh',
  display: 'flex',
  alignItems: 'center',
  justifyContent: 'center',
  background: 'radial-gradient(circle at 10% 20%, #0b1020, #050910 60%, #02060f)',
  color: '#e5e7eb',
  fontFamily: "'Inter', system-ui, -apple-system, sans-serif",
  padding: '32px',
};

const contentWrapperStyle = {
  width: '100%',
  maxWidth: 480,
};

const eyebrowStyle = {
  textTransform: 'uppercase',
  letterSpacing: '0.25em',
  fontSize: 11,
  margin: '0 0 8px 0',
  color: '#64748b',
};

const titleStyle = {
  fontSize: 26,
  fontWeight: 700,
  margin: '0 0 6px 0',
  color: '#f1f5f9',
};

const subtitleStyle = {
  fontSize: 15,
  color: '#94a3b8',
  margin: '0 0 28px 0',
};

const cardsContainerStyle = {
  display: 'flex',
  flexDirection: 'column',
  gap: 12,
};

const primaryCardStyle = {
  display: 'flex',
  alignItems: 'center',
  gap: 16,
  padding: '20px',
  background: 'rgba(15, 23, 42, 0.6)',
  border: '1px solid rgba(34, 211, 238, 0.15)',
  borderRadius: 14,
  textDecoration: 'none',
  color: '#e5e7eb',
  boxShadow: '0 12px 40px rgba(0,0,0,0.3)',
  backdropFilter: 'blur(12px)',
};

const iconCircleStyle = {
  width: 48,
  height: 48,
  borderRadius: 12,
  background: 'rgba(34, 211, 238, 0.08)',
  display: 'flex',
  alignItems: 'center',
  justifyContent: 'center',
  flexShrink: 0,
};

const cardTitleStyle = {
  fontSize: 16,
  fontWeight: 600,
  color: '#f1f5f9',
  marginBottom: 2,
};

const cardDescStyle = {
  fontSize: 13,
  color: '#94a3b8',
};

const secondaryCardStyle = {
  display: 'flex',
  alignItems: 'center',
  gap: 12,
  padding: '14px 16px',
  background: 'rgba(255,255,255,0.03)',
  border: '1px solid rgba(255,255,255,0.08)',
  borderRadius: 12,
  textDecoration: 'none',
  color: '#d1d5db',
  fontSize: 14,
  fontWeight: 500,
};

const chevronStyle = {
  marginLeft: 'auto',
  opacity: 0.4,
};

const bottomActionsStyle = {
  display: 'flex',
  alignItems: 'center',
  justifyContent: 'center',
  gap: 16,
  marginTop: 28,
};

const textLinkStyle = {
  color: '#60a5fa',
  textDecoration: 'none',
  fontSize: 14,
};

const signOutButtonStyle = {
  background: 'none',
  border: 'none',
  color: '#ef4444',
  fontSize: 14,
  cursor: 'pointer',
  padding: 0,
  fontFamily: 'inherit',
};

const spinnerStyle = {
  width: 40,
  height: 40,
  border: '3px solid #27272a',
  borderTopColor: '#22d3ee',
  borderRadius: '50%',
  animation: 'spin 1s linear infinite',
};

const Chevron = () => (
  <svg width="16" height="16" viewBox="0 0 24 24" fill="none"
    stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"
    style={chevronStyle}>
    <polyline points="9 18 15 12 9 6" />
  </svg>
);

export default function HomePage() {
  const [, setLocation] = useLocation();
  const { user, profile, organizations, orgsLoading, isCoach, isAdmin, signOut } = useAuth();

  const firstName = profile?.full_name?.split(' ')[0];
  const greeting = firstName ? `Welcome back, ${firstName}` : 'Welcome to Versa Footy';

  const hasOrgs = organizations.length > 0;

  const handleSignOut = async () => {
    await signOut();
    setLocation('/');
  };

  if (orgsLoading) {
    return (
      <div style={containerStyle}>
        <div style={{ textAlign: 'center' }}>
          <div style={spinnerStyle} />
          <p style={{ marginTop: 16, color: '#71717a' }}>Loading...</p>
        </div>
        <style>{`@keyframes spin { from { transform: rotate(0deg); } to { transform: rotate(360deg); } }`}</style>
      </div>
    );
  }

  return (
    <div style={containerStyle}>
      <div style={contentWrapperStyle}>
        <p style={eyebrowStyle}>Home</p>
        <h1 style={titleStyle}>{greeting}</h1>
        <p style={subtitleStyle}>Where would you like to go?</p>

        <div style={cardsContainerStyle}>
          {/* Primary action: Academy Dashboard or Create Academy */}
          {hasOrgs && isCoach ? (
            <Link href="/academy" style={primaryCardStyle}>
              <div style={iconCircleStyle}>
                <svg width="24" height="24" viewBox="0 0 24 24" fill="none"
                  stroke="#22d3ee" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <rect x="3" y="3" width="7" height="7" />
                  <rect x="14" y="3" width="7" height="7" />
                  <rect x="14" y="14" width="7" height="7" />
                  <rect x="3" y="14" width="7" height="7" />
                </svg>
              </div>
              <div>
                <div style={cardTitleStyle}>Academy Dashboard</div>
                <div style={cardDescStyle}>Manage your players, teams, and training</div>
              </div>
              <Chevron />
            </Link>
          ) : (
            <Link href="/org/create" style={primaryCardStyle}>
              <div style={iconCircleStyle}>
                <svg width="24" height="24" viewBox="0 0 24 24" fill="none"
                  stroke="#22d3ee" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <line x1="12" y1="5" x2="12" y2="19" />
                  <line x1="5" y1="12" x2="19" y2="12" />
                </svg>
              </div>
              <div>
                <div style={cardTitleStyle}>Create Your Academy</div>
                <div style={cardDescStyle}>Set up an organization to start tracking players</div>
              </div>
              <Chevron />
            </Link>
          )}

          {/* Admin-only: Library */}
          {isAdmin && (
            <Link href="/library" style={secondaryCardStyle}>
              <svg width="18" height="18" viewBox="0 0 24 24" fill="none"
                stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <path d="M4 19.5A2.5 2.5 0 0 1 6.5 17H20" />
                <path d="M6.5 2H20v20H6.5A2.5 2.5 0 0 1 4 19.5v-15A2.5 2.5 0 0 1 6.5 2z" />
              </svg>
              <span>Exercise Library</span>
              <Chevron />
            </Link>
          )}

          {/* Settings */}
          <Link href="/settings" style={secondaryCardStyle}>
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none"
              stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <circle cx="12" cy="12" r="3" />
              <path d="M19.4 15a1.65 1.65 0 0 0 .33 1.82l.06.06a2 2 0 0 1-2.83 2.83l-.06-.06a1.65 1.65 0 0 0-1.82-.33 1.65 1.65 0 0 0-1 1.51V21a2 2 0 0 1-4 0v-.09A1.65 1.65 0 0 0 9 19.4a1.65 1.65 0 0 0-1.82.33l-.06.06a2 2 0 0 1-2.83-2.83l.06-.06A1.65 1.65 0 0 0 4.6 15a1.65 1.65 0 0 0-1.51-1H3a2 2 0 0 1 0-4h.09A1.65 1.65 0 0 0 4.6 9a1.65 1.65 0 0 0-.33-1.82l-.06-.06a2 2 0 0 1 2.83-2.83l.06.06A1.65 1.65 0 0 0 9 4.6a1.65 1.65 0 0 0 1-1.51V3a2 2 0 0 1 4 0v.09a1.65 1.65 0 0 0 1 1.51 1.65 1.65 0 0 0 1.82-.33l.06-.06a2 2 0 0 1 2.83 2.83l-.06.06A1.65 1.65 0 0 0 19.4 9a1.65 1.65 0 0 0 1.51 1H21a2 2 0 0 1 0 4h-.09a1.65 1.65 0 0 0-1.51 1z" />
            </svg>
            <span>Settings</span>
            <Chevron />
          </Link>
        </div>

        {/* Bottom actions */}
        <div style={bottomActionsStyle}>
          <Link href="/" style={textLinkStyle}>
            Back to landing page
          </Link>
          <span style={{ color: 'rgba(255,255,255,0.15)' }}>|</span>
          <button onClick={handleSignOut} style={signOutButtonStyle}>
            Sign out
          </button>
        </div>
      </div>

      <style>{`@keyframes spin { from { transform: rotate(0deg); } to { transform: rotate(360deg); } }`}</style>
    </div>
  );
}
