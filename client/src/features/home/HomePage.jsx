import React from 'react';
import { Link, useLocation } from 'wouter';
import { useTranslation } from 'react-i18next';
import { useAuth } from '../../lib/AuthContext';

const containerStyle = {
  minHeight: '100vh',
  display: 'flex',
  alignItems: 'center',
  justifyContent: 'center',
  background: 'var(--bg-app-gradient)',
  color: 'var(--text-primary)',
  fontFamily: 'var(--font-sans)',
  padding: 'var(--space-8)',
};

const contentWrapperStyle = {
  width: '100%',
  maxWidth: 480,
};

const eyebrowStyle = {
  textTransform: 'uppercase',
  letterSpacing: '0.25em',
  fontSize: 'var(--text-xs)',
  margin: '0 0 var(--space-2) 0',
  color: 'var(--text-dim)',
};

const titleStyle = {
  fontFamily: 'var(--font-display)',
  fontSize: 'var(--text-3xl)',
  fontWeight: 700,
  margin: '0 0 6px 0',
  color: 'var(--text-primary)',
};

const subtitleStyle = {
  fontSize: 'var(--text-md)',
  color: 'var(--text-muted)',
  margin: '0 0 var(--space-7) 0',
};

const cardsContainerStyle = {
  display: 'flex',
  flexDirection: 'column',
  gap: 'var(--space-3)',
};

const primaryCardStyle = {
  display: 'flex',
  alignItems: 'center',
  gap: 'var(--space-4)',
  padding: 'var(--space-5)',
  background: 'var(--bg-elevated)',
  border: '1px solid var(--border-light)',
  borderRadius: 'var(--radius-xl)',
  textDecoration: 'none',
  color: 'var(--text-primary)',
  boxShadow: 'var(--shadow-md)',
  backdropFilter: 'blur(12px)',
};

const iconCircleStyle = {
  width: 48,
  height: 48,
  borderRadius: 'var(--radius-lg)',
  background: 'var(--color-cyan-soft)',
  display: 'flex',
  alignItems: 'center',
  justifyContent: 'center',
  flexShrink: 0,
};

const cardTitleStyle = {
  fontSize: 'var(--text-lg)',
  fontWeight: 600,
  color: 'var(--text-primary)',
  marginBottom: 2,
};

const cardDescStyle = {
  fontSize: 13,
  color: 'var(--text-muted)',
};

const secondaryCardStyle = {
  display: 'flex',
  alignItems: 'center',
  gap: 'var(--space-3)',
  padding: '14px 16px',
  background: 'var(--bg-soft)',
  border: '1px solid var(--border-light)',
  borderRadius: 'var(--radius-lg)',
  textDecoration: 'none',
  color: 'var(--text-primary)',
  fontSize: 'var(--text-base)',
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
  gap: 'var(--space-4)',
  marginTop: 'var(--space-7)',
};

const textLinkStyle = {
  color: 'var(--color-blue-link)',
  textDecoration: 'none',
  fontSize: 'var(--text-base)',
};

const signOutButtonStyle = {
  background: 'none',
  border: 'none',
  color: 'var(--color-red)',
  fontSize: 'var(--text-base)',
  cursor: 'pointer',
  padding: 0,
  fontFamily: 'inherit',
};

const Chevron = () => (
  <svg width="16" height="16" viewBox="0 0 24 24" fill="none"
    stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"
    style={chevronStyle}>
    <polyline points="9 18 15 12 9 6" />
  </svg>
);

export default function HomePage() {
  const { t } = useTranslation();
  const [, setLocation] = useLocation();
  const { user, profile, organizations, orgsLoading, isCoach, isAdmin, signOut } = useAuth();

  const firstName = profile?.full_name?.split(' ')[0];
  const greeting = firstName ? t('home.welcomeBack', { firstName }) : t('home.welcomeGeneric');

  const hasOrgs = organizations.length > 0;

  const handleSignOut = async () => {
    await signOut();
    setLocation('/');
  };

  if (orgsLoading) {
    return (
      <div style={containerStyle}>
        <div style={{ textAlign: 'center' }}>
          <div className="vf-spinner" style={{ margin: '0 auto' }} />
          <p style={{ marginTop: 16, color: 'var(--text-dim)' }}>{t('common.loading')}</p>
        </div>
      </div>
    );
  }

  return (
    <div style={containerStyle}>
      <div style={contentWrapperStyle}>
        <p style={eyebrowStyle}>{t('home.eyebrow')}</p>
        <h1 style={titleStyle}>{greeting}</h1>
        <p style={subtitleStyle}>{t('home.whereToGo')}</p>

        <div style={cardsContainerStyle}>
          {/* Primary action: Academy Dashboard or Create Academy */}
          {hasOrgs && isCoach ? (
            <Link href="/academy" style={primaryCardStyle}>
              <div style={iconCircleStyle}>
                <svg width="24" height="24" viewBox="0 0 24 24" fill="none"
                  stroke="var(--color-cyan)" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <rect x="3" y="3" width="7" height="7" />
                  <rect x="14" y="3" width="7" height="7" />
                  <rect x="14" y="14" width="7" height="7" />
                  <rect x="3" y="14" width="7" height="7" />
                </svg>
              </div>
              <div>
                <div style={cardTitleStyle}>{t('home.academyDashboard')}</div>
                <div style={cardDescStyle}>{t('home.academyDescription')}</div>
              </div>
              <Chevron />
            </Link>
          ) : (
            <Link href="/org/create" style={primaryCardStyle}>
              <div style={iconCircleStyle}>
                <svg width="24" height="24" viewBox="0 0 24 24" fill="none"
                  stroke="var(--color-cyan)" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <line x1="12" y1="5" x2="12" y2="19" />
                  <line x1="5" y1="12" x2="19" y2="12" />
                </svg>
              </div>
              <div>
                <div style={cardTitleStyle}>{t('home.createAcademy')}</div>
                <div style={cardDescStyle}>{t('home.createAcademyDescription')}</div>
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
              <span>{t('home.exerciseLibrary')}</span>
              <Chevron />
            </Link>
          )}

          {/* Admin-only: Videos Audit */}
          {isAdmin && (
            <Link href="/videos-audit" style={secondaryCardStyle}>
              <svg width="18" height="18" viewBox="0 0 24 24" fill="none"
                stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <polygon points="23 7 16 12 23 17 23 7" />
                <rect x="1" y="5" width="15" height="14" rx="2" ry="2" />
              </svg>
              <span>Videos Audit</span>
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
            <span>{t('home.settings')}</span>
            <Chevron />
          </Link>
        </div>

        {/* Bottom actions */}
        <div style={bottomActionsStyle}>
          <Link href="/" style={textLinkStyle}>
            {t('nav.backToLanding')}
          </Link>
          <span style={{ color: 'var(--border-strong)' }}>|</span>
          <button onClick={handleSignOut} style={signOutButtonStyle}>
            {t('common.signOut')}
          </button>
        </div>
      </div>
    </div>
  );
}
