import React, { Suspense } from 'react';
import { Link, Route, Switch } from 'wouter';
import { useTranslation } from 'react-i18next';

import { AuthProvider } from './lib/AuthContext';
import { LanguageProvider } from './lib/LanguageContext';
import ProtectedRoute from './components/ProtectedRoute';
import AdminProtectedRoute from './components/AdminProtectedRoute';
import AcademyProtectedRoute from './components/AcademyProtectedRoute';
import AppShell from './components/AppShell';

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
  background: 'var(--bg-app-gradient)',
  color: 'var(--text-primary)',
  padding: '32px',
  fontFamily: 'var(--font-sans)',
};

const cardStyle = {
  background: 'rgba(15, 23, 42, 0.6)',
  border: '1px solid rgba(255, 255, 255, 0.08)',
  borderRadius: 'var(--radius-2xl)',
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
  color: 'var(--text-muted)',
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
  background: 'var(--gradient-brand)',
  color: '#0b1020',
  fontWeight: 600,
  textDecoration: 'none',
  borderRadius: 'var(--radius-lg)',
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
  borderRadius: 'var(--radius-lg)',
  border: '1px solid rgba(255,255,255,0.08)',
};

const LoadingFallback = () => (
  <div style={{
    minHeight: '100vh',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    background: 'var(--bg-app-gradient)',
  }} />
);

function DevBanner() {
  const { t } = useTranslation();
  if (import.meta.env.PROD) return null;
  return (
    <div
      role="status"
      aria-label={t('common.devEnvironment')}
      style={{
        // Bottom-right so it never overlaps focus rings on top-bar items
        position: 'fixed', bottom: 8, insetInlineEnd: 8,
        zIndex: 9999,
        // Darker amber so #fff text hits 4.6:1 (was #f97316 → 2.6:1, fail).
        background: '#9a3412', color: '#fff',
        fontSize: 11, fontWeight: 700, letterSpacing: '0.05em',
        padding: '4px 10px', borderRadius: 'var(--radius-sm)',
        fontFamily: 'var(--font-sans)',
        boxShadow: '0 2px 6px rgba(0,0,0,0.4)',
        pointerEvents: 'none',
      }}
    >
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
            <AppShell pageTitleKey="nav.home"><HomePage /></AppShell>
          </ProtectedRoute>
        </Route>

        {/* Settings Page - For authenticated users */}
        <Route path="/settings">
          <ProtectedRoute>
            <AppShell pageTitleKey="nav.account"><SettingsPage /></AppShell>
          </ProtectedRoute>
        </Route>

        {/* Academy - Create/Join Organization */}
        <Route path="/org/create">
          <ProtectedRoute>
            <AppShell pageTitleKey="home.createAcademy"><CreateOrganization /></AppShell>
          </ProtectedRoute>
        </Route>

        {/* Join via invite code - requires auth only */}
        <Route path="/join/:code">
          <ProtectedRoute>
            <AppShell pageTitleKey="nav.invitations"><JoinOrganization /></AppShell>
          </ProtectedRoute>
        </Route>

        {/* Manual invite code entry (no code in URL) */}
        <Route path="/join">
          <ProtectedRoute>
            <AppShell pageTitleKey="nav.invitations"><JoinOrganization /></AppShell>
          </ProtectedRoute>
        </Route>

        {/* Academy sub-pages (must come before catch-all) */}
        <Route path="/academy/invitations">
          <AcademyProtectedRoute>
            <AppShell pageTitleKey="nav.invitations"><InvitationManager /></AppShell>
          </AcademyProtectedRoute>
        </Route>

        <Route path="/academy/players/:id">
          <AcademyProtectedRoute>
            <AppShell pageTitleKey="nav.players"><PlayerDetail /></AppShell>
          </AcademyProtectedRoute>
        </Route>

        <Route path="/academy/players">
          <AcademyProtectedRoute>
            <AppShell pageTitleKey="nav.players"><PlayerRoster /></AppShell>
          </AcademyProtectedRoute>
        </Route>

        <Route path="/academy/teams">
          <AcademyProtectedRoute>
            <AppShell pageTitleKey="nav.teams"><TeamManagement /></AppShell>
          </AcademyProtectedRoute>
        </Route>

        <Route path="/academy/settings">
          <AcademyProtectedRoute>
            <AppShell pageTitleKey="nav.academySettings"><AcademySettings /></AppShell>
          </AcademyProtectedRoute>
        </Route>

        {/* Academy Dashboard - Requires coach/admin/owner org membership */}
        <Route path="/academy">
          <AcademyProtectedRoute>
            <AppShell pageTitleKey="nav.dashboard"><AcademyDashboard /></AppShell>
          </AcademyProtectedRoute>
        </Route>

        <Route path="/academy/:rest*">
          <AcademyProtectedRoute>
            <AppShell pageTitleKey="nav.dashboard"><AcademyDashboard /></AppShell>
          </AcademyProtectedRoute>
        </Route>

        {/* Library App - Admin only */}
        <Route path="/library">
          <AdminProtectedRoute>
            <AppShell pageTitleKey="nav.library"><LibraryApp /></AppShell>
          </AdminProtectedRoute>
        </Route>

        <Route path="/library/:rest*">
          <AdminProtectedRoute>
            <AppShell pageTitleKey="nav.library"><LibraryApp /></AppShell>
          </AdminProtectedRoute>
        </Route>

        {/* Videos Audit - Admin only */}
        <Route path="/videos-audit">
          <AdminProtectedRoute>
            <AppShell pageTitleKey="nav.videosAudit"><VideosAuditPage /></AppShell>
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
