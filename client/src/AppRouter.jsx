import React from 'react';
import { Link, Route, Switch } from 'wouter';

import { AuthProvider } from './lib/AuthContext';
import ProtectedRoute from './components/ProtectedRoute';

import Landing from './features/landing/LandingPage';
import AboutPage from './features/landing/AboutPage';
import FaqPage from './features/landing/FaqPage';
import LibraryApp from './features/library/LibraryApp';
import Login from './features/auth/Login';

const NotFound = () => (
  <div style={containerStyle}>
    <div style={cardStyle}>
      <p style={eyebrowStyle}>404</p>
      <h1 style={titleStyle}>Page not found</h1>
      <p style={bodyStyle}>Try heading back to the landing page.</p>
      <div style={actionsStyle}>
        <Link href="/">
          <a style={primaryButtonStyle}>Go home</a>
        </Link>
        <Link href="/library">
          <a style={ghostButtonStyle}>Library</a>
        </Link>
      </div>
    </div>
  </div>
);

const containerStyle = {
  minHeight: '100vh',
  display: 'flex',
  alignItems: 'center',
  justifyContent: 'center',
  background: 'radial-gradient(circle at 20% 20%, #111827, #0b1020 45%, #050910)',
  color: '#e4e4e7',
  padding: '32px',
  fontFamily: "'Inter', system-ui, -apple-system, sans-serif",
};

const cardStyle = {
  background: 'rgba(15, 23, 42, 0.6)',
  border: '1px solid rgba(255, 255, 255, 0.08)',
  borderRadius: 16,
  padding: '32px',
  maxWidth: 480,
  width: '100%',
  boxShadow: '0 20px 60px rgba(0,0,0,0.35)',
  backdropFilter: 'blur(12px)',
};

const eyebrowStyle = {
  textTransform: 'uppercase',
  letterSpacing: '0.2em',
  fontSize: 12,
  color: '#9ca3af',
  marginBottom: 8,
};

const titleStyle = {
  fontSize: 28,
  margin: '0 0 12px 0',
  color: '#e5e7eb',
};

const bodyStyle = {
  fontSize: 16,
  lineHeight: 1.6,
  color: '#d1d5db',
  marginBottom: 20,
};

const actionsStyle = { display: 'flex', gap: 12 };
const primaryButtonStyle = {
  display: 'inline-flex',
  alignItems: 'center',
  gap: 8,
  padding: '10px 16px',
  background: 'linear-gradient(135deg, #2563eb, #22d3ee)',
  color: '#0b1020',
  fontWeight: 600,
  textDecoration: 'none',
  borderRadius: 10,
  boxShadow: '0 10px 30px rgba(37,99,235,0.35)',
};
const ghostButtonStyle = {
  display: 'inline-flex',
  alignItems: 'center',
  gap: 8,
  padding: '10px 16px',
  background: 'rgba(255,255,255,0.04)',
  color: '#e5e7eb',
  fontWeight: 600,
  textDecoration: 'none',
  borderRadius: 10,
  border: '1px solid rgba(255,255,255,0.08)',
};

export default function AppRouter() {
  return (
    <AuthProvider>
      <Switch>
        <Route path="/">
          <Landing />
        </Route>

        <Route path="/login">
          <Login />
        </Route>

        <Route path="/about-us">
          <AboutPage />
        </Route>

        <Route path="/faq">
          <FaqPage />
        </Route>

        <Route path="/library">
          <ProtectedRoute>
            <LibraryApp />
          </ProtectedRoute>
        </Route>

        <Route path="/library/:rest*">
          <ProtectedRoute>
            <LibraryApp />
          </ProtectedRoute>
        </Route>

        <Route>
          <NotFound />
        </Route>
      </Switch>
    </AuthProvider>
  );
}
