import React, { useEffect, useState } from 'react';
import { Link } from 'wouter';
import { useTranslation } from 'react-i18next';
import { useAuth } from '../../lib/AuthContext';
import { supabase } from '../../lib/supabase';
import useAcademyDashboard from '../academy/hooks/useAcademyDashboard';
import StatCard from './components/StatCard';
import QuickAction from './components/QuickAction';
import { PageContainer, PageHeader } from '../../components/Page';

const Icons = {
  buildings: (
    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <rect x="4" y="2" width="16" height="20" rx="2" />
      <line x1="9" y1="22" x2="9" y2="18" />
      <line x1="15" y1="22" x2="15" y2="18" />
      <line x1="8" y1="6" x2="8" y2="6" />
      <line x1="12" y1="6" x2="12" y2="6" />
      <line x1="16" y1="6" x2="16" y2="6" />
    </svg>
  ),
  star: (
    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2" />
    </svg>
  ),
  players: (
    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2" />
      <circle cx="9" cy="7" r="4" />
      <path d="M23 21v-2a4 4 0 0 0-3-3.87" />
      <path d="M16 3.13a4 4 0 0 1 0 7.75" />
    </svg>
  ),
  invite: (
    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M4 4h16c1.1 0 2 .9 2 2v12c0 1.1-.9 2-2 2H4c-1.1 0-2-.9-2-2V6c0-1.1.9-2 2-2z" />
      <polyline points="22,6 12,13 2,6" />
    </svg>
  ),
  dashboard: (
    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <rect x="3" y="3" width="7" height="7" /><rect x="14" y="3" width="7" height="7" />
      <rect x="14" y="14" width="7" height="7" /><rect x="3" y="14" width="7" height="7" />
    </svg>
  ),
  add: (
    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <line x1="12" y1="5" x2="12" y2="19" />
      <line x1="5" y1="12" x2="19" y2="12" />
    </svg>
  ),
  settings: (
    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <circle cx="12" cy="12" r="3" />
      <path d="M19.4 15a1.65 1.65 0 0 0 .33 1.82l.06.06a2 2 0 0 1-2.83 2.83l-.06-.06a1.65 1.65 0 0 0-1.82-.33 1.65 1.65 0 0 0-1 1.51V21a2 2 0 0 1-4 0v-.09A1.65 1.65 0 0 0 9 19.4a1.65 1.65 0 0 0-1.82.33l-.06.06a2 2 0 0 1-2.83-2.83l.06-.06A1.65 1.65 0 0 0 4.6 15a1.65 1.65 0 0 0-1.51-1H3a2 2 0 0 1 0-4h.09A1.65 1.65 0 0 0 4.6 9a1.65 1.65 0 0 0-.33-1.82l-.06-.06a2 2 0 0 1 2.83-2.83l.06.06A1.65 1.65 0 0 0 9 4.6a1.65 1.65 0 0 0 1-1.51V3a2 2 0 0 1 4 0v.09a1.65 1.65 0 0 0 1 1.51 1.65 1.65 0 0 0 1.82-.33l.06-.06a2 2 0 0 1 2.83 2.83l-.06.06A1.65 1.65 0 0 0 19.4 9a1.65 1.65 0 0 0 1.51 1H21a2 2 0 0 1 0 4h-.09a1.65 1.65 0 0 0-1.51 1z" />
    </svg>
  ),
  library: (
    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M4 19.5A2.5 2.5 0 0 1 6.5 17H20" />
      <path d="M6.5 2H20v20H6.5A2.5 2.5 0 0 1 4 19.5v-15A2.5 2.5 0 0 1 6.5 2z" />
    </svg>
  ),
};

function usePendingInvitationsCount(email) {
  const [count, setCount] = useState(null);
  useEffect(() => {
    if (!email) { setCount(0); return undefined; }
    let cancelled = false;
    (async () => {
      try {
        const { count: c, error } = await supabase
          .from('invitations')
          .select('id', { count: 'exact', head: true })
          .eq('email', email)
          .eq('status', 'pending');
        if (cancelled) return;
        if (error) {
          console.warn('Pending invitations count failed:', error.message);
          setCount(0);
        } else {
          setCount(c ?? 0);
        }
      } catch (err) {
        if (!cancelled) {
          console.warn('Pending invitations count error:', err);
          setCount(0);
        }
      }
    })();
    return () => { cancelled = true; };
  }, [email]);
  return count;
}

export default function DashboardHome() {
  const { t } = useTranslation();
  const { user, profile, organizations, activeOrg, orgsLoading, isCoach, isAdmin } = useAuth();
  const { stats } = useAcademyDashboard(activeOrg?.id);
  const pendingInvites = usePendingInvitationsCount(user?.email);

  const firstName = profile?.full_name?.split(' ')[0];
  const greeting = firstName ? t('home.welcomeBack', { firstName }) : t('home.welcomeGeneric');
  const hasOrgs = !orgsLoading && organizations.length > 0;
  const noOrgs = !orgsLoading && organizations.length === 0;

  return (
    <PageContainer width="default">
      <PageHeader
        eyebrow={t('home.eyebrow')}
        title={greeting}
        subtitle={hasOrgs ? t('home.dashboardSubtitle') : t('home.whereToGo')}
      />

      {noOrgs && (
        <div style={{
          background: 'rgba(15, 23, 42, 0.65)',
          border: '1px solid rgba(34, 211, 238, 0.18)',
          borderRadius: 14,
          padding: 22,
          marginBottom: 24,
          display: 'flex',
          alignItems: 'center',
          gap: 16,
          flexWrap: 'wrap',
        }}>
          <div style={{
            width: 48,
            height: 48,
            borderRadius: 12,
            background: 'rgba(34, 211, 238, 0.1)',
            color: '#22d3ee',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            flexShrink: 0,
          }}>{Icons.add}</div>
          <div style={{ flex: 1, minWidth: 200 }}>
            <div style={{ fontSize: 16, fontWeight: 600, color: '#f1f5f9', marginBottom: 3 }}>
              {t('home.createAcademy')}
            </div>
            <div style={{ fontSize: 13.5, color: '#94a3b8' }}>
              {t('home.createAcademyDescription')}
            </div>
          </div>
          <Link href="/org/create" style={{
            background: 'linear-gradient(135deg, #2563eb, #22d3ee)',
            color: '#0b1020',
            fontWeight: 700,
            padding: '10px 18px',
            borderRadius: 10,
            textDecoration: 'none',
            fontSize: 13.5,
          }}>{t('common.create')}</Link>
          <Link href="/join" style={{
            color: '#60a5fa',
            textDecoration: 'none',
            fontSize: 13,
          }}>{t('home.haveInviteCode', 'Have an invite code?')}</Link>
        </div>
      )}

      <div className="dash-stats-grid" style={{
        display: 'grid',
        gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))',
        gap: 14,
        marginBottom: 24,
      }}>
        <StatCard
          label={t('home.stats.myAcademies', 'My Academies')}
          value={organizations.length}
          accent="#3b82f6"
          icon={Icons.buildings}
          loading={orgsLoading}
        />
        {activeOrg && (
          <StatCard
            label={t('home.stats.activeAcademy', 'Active Academy')}
            value={activeOrg.name}
            accent="#22d3ee"
            icon={Icons.star}
            loading={orgsLoading}
          />
        )}
        {activeOrg && (
          <StatCard
            label={t('home.stats.playersInOrg', 'Players')}
            value={stats?.total_players ?? 0}
            accent="#22c55e"
            icon={Icons.players}
            loading={!stats}
          />
        )}
        {(pendingInvites === null || pendingInvites > 0) && (
          <StatCard
            label={t('home.stats.pendingInvitations', 'Pending Invitations')}
            value={pendingInvites ?? 0}
            accent="#f97316"
            icon={Icons.invite}
            loading={pendingInvites === null}
          />
        )}
      </div>

      <section style={{ marginBottom: 24 }}>
        <h2 style={{
          fontSize: 13,
          fontWeight: 700,
          color: '#94a3b8',
          textTransform: 'uppercase',
          letterSpacing: '0.1em',
          margin: '0 0 12px',
        }}>{t('home.quickActions', 'Quick actions')}</h2>
        <div className="dash-actions-grid" style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fit, minmax(260px, 1fr))',
          gap: 12,
        }}>
          {hasOrgs && isCoach && (
            <QuickAction
              href="/academy"
              title={t('home.academyDashboard')}
              description={t('home.academyDescription')}
              icon={Icons.dashboard}
              accent="#22d3ee"
              primary
            />
          )}
          {!hasOrgs && (
            <QuickAction
              href="/org/create"
              title={t('home.createAcademy')}
              description={t('home.createAcademyDescription')}
              icon={Icons.add}
              accent="#22d3ee"
              primary
            />
          )}
          {isAdmin && (
            <QuickAction
              href="/library"
              title={t('home.exerciseLibrary')}
              description={t('home.libraryDescription', 'Manage skills and exercises')}
              icon={Icons.library}
              accent="#3b82f6"
            />
          )}
          {isAdmin && (
            <QuickAction
              href="/videos-audit"
              title={t('nav.videosAudit', 'Videos Audit')}
              description={t('home.videosAuditDescription', 'Review uploaded videos')}
              icon={Icons.invite}
              accent="#a855f7"
            />
          )}
          <QuickAction
            href="/settings"
            title={t('nav.account', 'Account')}
            description={t('home.accountDescription', 'Profile, security and preferences')}
            icon={Icons.settings}
            accent="#94a3b8"
          />
        </div>
      </section>

    </PageContainer>
  );
}
