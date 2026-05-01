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

export default function ProtectedRoute({ children }) {
  const { t } = useTranslation();
  const { isAuthenticated, loading } = useAuth();

  if (loading) {
    return (
      <div style={loadingContainerStyle}>
        <div role="status" aria-live="polite" style={{ textAlign: 'center' }}>
          <div style={spinnerStyle} aria-hidden="true" />
          <p style={{ marginTop: 16, color: 'var(--text-dim)' }}>{t('common.loading')}</p>
        </div>
      </div>
    );
  }

  // Redirect to login if not authenticated
  if (!isAuthenticated) {
    return <Redirect to="/login" />;
  }

  // Render protected content immediately - profile loads in background
  return children;
}
