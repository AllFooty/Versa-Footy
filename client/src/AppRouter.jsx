import React, { Suspense } from 'react';
import { Link, Route, Switch } from 'wouter';
import { useTranslation } from 'react-i18next';

import { AuthProvider } from './lib/AuthContext';
import { LanguageProvider } from './lib/LanguageContext';
import ProtectedRoute from './components/ProtectedRoute';
import AdminProtectedRoute from './components/AdminProtectedRoute';
import AcademyProtectedRoute from './components/AcademyProtectedRoute';

const Landing = React.lazy(() => import('./features/landing/LandingPage'));
const HomePage = React.lazy(() => import('./features/home/HomePage'));
const AboutPage = React.lazy(() => import('./features/landing/AboutPage'));
const FaqPage = React.lazy(() => import('./features/landing/FaqPage'));
const TermsOfServicePage = React.lazy(() => import('./features/landing/TermsOfServicePage'));
const PrivacyPolicyPage = React.lazy(() => import('./features/landing/PrivacyPolicyPage'));
const LibraryApp = React.lazy(() => import('./features/library/LibraryApp'));
const VideosAuditPage = React.lazy(() => import('./features/admin/VideosAuditPage'));
const SettingsPage = React.lazy(() => import('./features/settings/SettingsPage'));
const Login = React.lazy(() => import('./features/auth/Login'));
const AcademyDashboard = React.lazy(() => import('./features/academy/AcademyDashboard'));
const CreateOrganization = React.lazy(() => import('./features/academy/CreateOrganization'));
const InvitationManager = React.lazy(() => import('./features/academy/InvitationManager'));
const JoinOrganization = React.lazy(() => import('./features/academy/JoinOrganization'));
const PlayerRoster = React.lazy(() => import('./features/academy/PlayerRoster'));
const PlayerDetail = React.lazy(() => import('./features/academy/PlayerDetail'));
const TeamManagement = React.lazy(() => import('./features/academy/TeamManagement'));
const AcademySettings = React.lazy(() => import('./features/academy/AcademySettings'));

const NotFound = () => {
  const { t } = useTranslation();
  return (
    <div style={containerStyle}>
      <div style={cardStyle}>
        <p style={eyebrowStyle}>{t('errors.notFound.code')}</p>
        <h1 style={titleStyle}>{t('errors.notFound.title')}</h1>
        <p style={bodyStyle}>{t('errors.notFound.description')}</p>
        <div style={actionsStyle}>
          <Link href="/">
            <a style={primaryButtonStyle}>{t('errors.notFound.goHome')}</a>
          </Link>
          <Link href="/library">
            <a style={ghostButtonStyle}>{t('errors.notFound.library')}</a>
          </Link>
        </div>
      </div>
    </div>
  );
};

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

const LoadingFallback = () => (
  <div style={{
    minHeight: '100vh',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    background: 'radial-gradient(circle at 20% 20%, #111827, #0b1020 45%, #050910)',
  }} />
);

function DevBanner() {
  const { t } = useTranslation();
  if (import.meta.env.PROD) return null;
  return (
    <div style={{
      position: 'fixed', top: 0, left: '50%', transform: 'translateX(-50%)',
      zIndex: 9999, background: '#f97316', color: '#fff',
      fontSize: 11, fontWeight: 700, letterSpacing: '0.05em',
      padding: '2px 12px', borderRadius: '0 0 6px 6px',
      fontFamily: "'Inter', system-ui, sans-serif",
    }}>
      {t('common.devEnvironment')}
    </div>
  );
}

export default function AppRouter() {
  return (
    <LanguageProvider>
    <AuthProvider>
      <DevBanner />
      <Suspense fallback={<LoadingFallback />}>
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

        <Route path="/terms-of-service">
          <TermsOfServicePage />
        </Route>

        <Route path="/privacy-policy">
          <PrivacyPolicyPage />
        </Route>

        {/* Home Hub - Post-login landing for authenticated users */}
        <Route path="/home">
          <ProtectedRoute>
            <HomePage />
          </ProtectedRoute>
        </Route>

        {/* Settings Page - For authenticated users */}
        <Route path="/settings">
          <ProtectedRoute>
            <SettingsPage />
          </ProtectedRoute>
        </Route>

        {/* Academy - Create/Join Organization */}
        <Route path="/org/create">
          <ProtectedRoute>
            <CreateOrganization />
          </ProtectedRoute>
        </Route>

        {/* Join via invite code - requires auth only */}
        <Route path="/join/:code">
          <ProtectedRoute>
            <JoinOrganization />
          </ProtectedRoute>
        </Route>

        {/* Manual invite code entry (no code in URL) */}
        <Route path="/join">
          <ProtectedRoute>
            <JoinOrganization />
          </ProtectedRoute>
        </Route>

        {/* Academy sub-pages (must come before catch-all) */}
        <Route path="/academy/invitations">
          <AcademyProtectedRoute>
            <InvitationManager />
          </AcademyProtectedRoute>
        </Route>

        <Route path="/academy/players/:id">
          <AcademyProtectedRoute>
            <PlayerDetail />
          </AcademyProtectedRoute>
        </Route>

        <Route path="/academy/players">
          <AcademyProtectedRoute>
            <PlayerRoster />
          </AcademyProtectedRoute>
        </Route>

        <Route path="/academy/teams">
          <AcademyProtectedRoute>
            <TeamManagement />
          </AcademyProtectedRoute>
        </Route>

        <Route path="/academy/settings">
          <AcademyProtectedRoute>
            <AcademySettings />
          </AcademyProtectedRoute>
        </Route>

        {/* Academy Dashboard - Requires coach/admin/owner org membership */}
        <Route path="/academy">
          <AcademyProtectedRoute>
            <AcademyDashboard />
          </AcademyProtectedRoute>
        </Route>

        <Route path="/academy/:rest*">
          <AcademyProtectedRoute>
            <AcademyDashboard />
          </AcademyProtectedRoute>
        </Route>

        {/* Library App - Admin only */}
        <Route path="/library">
          <AdminProtectedRoute>
            <LibraryApp />
          </AdminProtectedRoute>
        </Route>

        <Route path="/library/:rest*">
          <AdminProtectedRoute>
            <LibraryApp />
          </AdminProtectedRoute>
        </Route>

        {/* Videos Audit - Admin only */}
        <Route path="/videos-audit">
          <AdminProtectedRoute>
            <VideosAuditPage />
          </AdminProtectedRoute>
        </Route>

        <Route>
          <NotFound />
        </Route>
      </Switch>
      </Suspense>
    </AuthProvider>
    </LanguageProvider>
  );
}
