import React from 'react';
import { Redirect } from 'wouter';
import { useAuth } from '../lib/AuthContext';
import AcademyLayout from '../features/academy/AcademyLayout';

const loadingContainerStyle = {
  minHeight: '100vh',
  display: 'flex',
  alignItems: 'center',
  justifyContent: 'center',
  background: 'radial-gradient(circle at 10% 20%, #0b1020, #050910 60%, #02060f)',
  color: '#e5e7eb',
  fontFamily: "'Inter', system-ui, -apple-system, sans-serif",
};

const spinnerStyle = {
  width: 40,
  height: 40,
  border: '3px solid #27272a',
  borderTopColor: '#E63946',
  borderRadius: '50%',
  animation: 'spin 1s linear infinite',
};

export default function AcademyProtectedRoute({ children }) {
  const { isAuthenticated, isCoach, loading, orgsLoading, organizations } = useAuth();

  if (loading) {
    return (
      <div style={loadingContainerStyle}>
        <div style={{ textAlign: 'center' }}>
          <div style={spinnerStyle} />
          <p style={{ marginTop: 16, color: '#71717a' }}>Loading...</p>
        </div>
      </div>
    );
  }

  if (!isAuthenticated) {
    return <Redirect to="/login" />;
  }

  // Wait for organizations to load before deciding access
  if (orgsLoading || (organizations.length === 0 && orgsLoading !== false)) {
    return (
      <div style={loadingContainerStyle}>
        <div style={{ textAlign: 'center' }}>
          <div style={spinnerStyle} />
          <p style={{ marginTop: 16, color: '#71717a' }}>Loading academy...</p>
        </div>
      </div>
    );
  }

  // User has no org membership with coach/admin/owner role — redirect to create/join
  if (!isCoach) {
    return <Redirect to="/org/create" />;
  }

  return <AcademyLayout>{children}</AcademyLayout>;
}
