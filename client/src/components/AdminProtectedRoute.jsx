import React from 'react';
import { Redirect } from 'wouter';
import { useTranslation } from 'react-i18next';
import { useAuth } from '../lib/AuthContext';

const loadingContainerStyle = {
  minHeight: '100vh',
  display: 'flex',
  alignItems: 'center',
  justifyContent: 'center',
  background: 'var(--bg-app-gradient)',
  color: 'var(--text-primary)',
  fontFamily: 'var(--font-sans)',
};

const spinnerStyle = {
  width: 40,
  height: 40,
  border: '3px solid #27272a',
  borderTopColor: 'var(--color-cyan)',
  borderRadius: '50%',
  animation: 'spin 1s linear infinite',
};

function LoadingScreen({ label }) {
  return (
    <div style={loadingContainerStyle}>
      <div role="status" aria-live="polite" style={{ textAlign: 'center' }}>
        <div style={spinnerStyle} aria-hidden="true" />
        <p style={{ marginTop: 16, color: 'var(--text-dim)' }}>{label}</p>
      </div>
    </div>
  );
}

export default function AdminProtectedRoute({ children }) {
  const { t } = useTranslation();
  const { isAuthenticated, isAdmin, loading, profileLoading, profile } = useAuth();

  if (loading) {
    return <LoadingScreen label={t('common.loading')} />;
  }

  if (!isAuthenticated) {
    return <Redirect to="/login" />;
  }

  // Wait for profile to load before checking admin status
  // (prevents incorrect redirects while profile is fetching)
  if (profileLoading || profile === null) {
    return <LoadingScreen label={t('common.loadingProfile')} />;
  }

  if (!isAdmin) {
    return <Redirect to="/" />;
  }

  return children;
}
