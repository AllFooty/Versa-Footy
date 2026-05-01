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

export default function AcademyProtectedRoute({ children }) {
  const { t } = useTranslation();
  const { isAuthenticated, isCoach, loading, orgsLoading } = useAuth();

  if (loading) {
    return <LoadingScreen label={t('common.loading')} />;
  }

  if (!isAuthenticated) {
    return <Redirect to="/login" />;
  }

  // Wait for organizations to load before deciding access
  if (orgsLoading) {
    return <LoadingScreen label={t('common.loadingAcademy')} />;
  }

  // User has no org membership with coach/admin/owner role — redirect to create/join
  if (!isCoach) {
    return <Redirect to="/org/create" />;
  }

  return <>{children}</>;
}
