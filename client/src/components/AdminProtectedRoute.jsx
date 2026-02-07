import React from 'react';
import { Redirect } from 'wouter';
import { useAuth } from '../lib/AuthContext';

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

export default function AdminProtectedRoute({ children }) {
  const { isAuthenticated, isAdmin, loading, profileLoading, profile } = useAuth();

  // Show loading state while checking authentication (session)
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

  // Redirect to login if not authenticated
  if (!isAuthenticated) {
    return <Redirect to="/login" />;
  }

  // Wait for profile to load before checking admin status
  // This prevents incorrect redirects while profile is fetching
  if (profileLoading || profile === null) {
    return (
      <div style={loadingContainerStyle}>
        <div style={{ textAlign: 'center' }}>
          <div style={spinnerStyle} />
          <p style={{ marginTop: 16, color: '#71717a' }}>Loading profile...</p>
        </div>
      </div>
    );
  }

  // Redirect non-admins to the landing page
  if (!isAdmin) {
    return <Redirect to="/" />;
  }

  // Render protected content for admins
  return children;
}
