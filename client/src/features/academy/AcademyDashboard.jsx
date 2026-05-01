import React from 'react';
import { Link } from 'wouter';
import { useTranslation } from 'react-i18next';
import {
  BarChart, Bar, LineChart, Line, XAxis, YAxis, CartesianGrid,
  Tooltip, ResponsiveContainer,
} from 'recharts';
import { useAuth } from '../../lib/AuthContext';
import useAcademyDashboard from './hooks/useAcademyDashboard';
import usePlayerRoster, { getPlayerStatus } from './hooks/usePlayerRoster';
import { SkeletonCard, SkeletonChart } from '../../components/ui/Skeleton';

export default function AcademyDashboard() {
  const { t } = useTranslation();
  const { activeOrg, organizations, setActiveOrg } = useAuth();
  const { stats, weeklyActivity, loading } = useAcademyDashboard(activeOrg?.id);
  const { players: allPlayers } = usePlayerRoster(activeOrg?.id);

  const atRiskPlayers = allPlayers
    .filter((p) => getPlayerStatus(p) === 'inactive')
    .sort((a, b) => {
      if (!a.last_practice_date && !b.last_practice_date) return 0;
      if (!a.last_practice_date) return -1;
      if (!b.last_practice_date) return 1;
      return new Date(a.last_practice_date) - new Date(b.last_practice_date);
    })
    .slice(0, 5);

  return (
    <div className="academy-container" style={containerStyle}>
      {/* Header */}
      <div style={headerStyle}>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: 12 }}>
          <div>
            <h1 className="academy-title" style={titleStyle}>{activeOrg?.name || t('academy.dashboard.fallbackName')}</h1>
            <p className="academy-subtitle" style={subtitleStyle}>{activeOrg?.type} {t('academy.dashboard.dashboardSuffix')}</p>
          </div>
          {organizations.length > 1 && (
            <select
              className="academy-org-switcher"
              value={activeOrg?.id || ''}
              onChange={(e) => {
                const org = organizations.find((o) => o.id === e.target.value);
                if (org) setActiveOrg(org);
              }}
              style={orgSwitcherStyle}
            >
              {organizations.map((o) => (
                <option key={o.id} value={o.id}>{o.name}</option>
              ))}
            </select>
          )}
        </div>

        {/* Quick Actions */}
        <div className="academy-quick-actions" style={quickActionsStyle}>
          <Link href="/academy/invitations" className="academy-action-link" style={actionLinkStyle}>{t('academy.dashboard.invitePlayers')}</Link>
          <Link href="/academy/players" className="academy-action-link" style={actionLinkStyle}>{t('academy.dashboard.viewAllPlayers')}</Link>
        </div>
      </div>

      {loading && !stats ? (
        <>
          <div className="academy-kpi-grid" style={kpiGridStyle}>
            {[...Array(6)].map((_, i) => <SkeletonCard key={i} />)}
          </div>
          <div className="academy-charts-grid" style={chartsGridStyle}>
            <SkeletonChart />
            <SkeletonChart />
          </div>
        </>
      ) : (
        <>
          {/* KPI Cards */}
          <div className="academy-kpi-grid" style={kpiGridStyle}>
            <KPICard label={t('academy.dashboard.totalPlayers')} value={stats?.total_players ?? 0} color="#3b82f6" />
            <KPICard
              label={t('academy.dashboard.activeThisWeek')}
              value={stats?.active_this_week ?? 0}
              suffix={stats?.total_players ? `/ ${stats.total_players}` : ''}
              color="#22c55e"
            />
            <KPICard label={t('academy.dashboard.skillsMastered')} value={stats?.total_skills_mastered ?? 0} color="#8b5cf6" />
            <KPICard label={t('academy.dashboard.avgLevel')} value={stats?.avg_player_level ?? 0} color="#f97316" />
            <KPICard label={t('academy.dashboard.weeklyXP')} value={formatNumber(stats?.total_xp_this_week ?? 0)} color="#22d3ee" />
            <KPICard label={t('academy.dashboard.avgStreak')} value={`${stats?.avg_streak ?? 0}d`} color="#eab308" />
          </div>

          {/* Charts */}
          <div className="academy-charts-grid" style={chartsGridStyle}>
            <div style={chartCardStyle}>
              <h3 style={chartTitleStyle}>{t('academy.dashboard.weeklyActivePlayers')}</h3>
              <div style={{ height: 240 }}>
                <ResponsiveContainer width="100%" height="100%">
                  <LineChart data={weeklyActivity}>
                    <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.06)" />
                    <XAxis dataKey="week" tick={{ fill: 'var(--text-dim)', fontSize: 12 }} axisLine={{ stroke: 'var(--border-light)' }} tickLine={false} />
                    <YAxis tick={{ fill: 'var(--text-dim)', fontSize: 12 }} axisLine={false} tickLine={false} allowDecimals={false} />
                    <Tooltip contentStyle={tooltipStyle} labelStyle={{ color: 'var(--text-primary)' }} />
                    <Line type="monotone" dataKey="activePlayers" name={t('academy.dashboard.activePlayers')} stroke="var(--color-blue)" strokeWidth={2} dot={{ r: 3, fill: 'var(--color-blue)' }} activeDot={{ r: 5 }} />
                  </LineChart>
                </ResponsiveContainer>
              </div>
            </div>

            <div style={chartCardStyle}>
              <h3 style={chartTitleStyle}>{t('academy.dashboard.weeklyXPEarned')}</h3>
              <div style={{ height: 240 }}>
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={weeklyActivity}>
                    <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.06)" />
                    <XAxis dataKey="week" tick={{ fill: 'var(--text-dim)', fontSize: 12 }} axisLine={{ stroke: 'var(--border-light)' }} tickLine={false} />
                    <YAxis tick={{ fill: 'var(--text-dim)', fontSize: 12 }} axisLine={false} tickLine={false} />
                    <Tooltip contentStyle={tooltipStyle} labelStyle={{ color: 'var(--text-primary)' }} />
                    <Bar dataKey="totalXp" name={t('common.xp')} fill="var(--color-purple)" radius={[4, 4, 0, 0]} />
                  </BarChart>
                </ResponsiveContainer>
              </div>
            </div>
          </div>

          {/* At-Risk Players */}
          {atRiskPlayers.length > 0 && (
            <div style={sectionStyle}>
              <h3 style={sectionTitleStyle}>{t('academy.dashboard.atRiskPlayers')}</h3>
              <p className="academy-muted-text" style={sectionDescStyle}>{t('academy.dashboard.atRiskDescription')}</p>
              <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
                {atRiskPlayers.map((p) => {
                  const name = p.display_name || t('common.unknown');
                  const daysAgoValue = p.last_practice_date ? daysSince(p.last_practice_date) : null;
                  const ariaLabel = daysAgoValue != null
                    ? t('academy.dashboard.atRiskAria', {
                        defaultValue: '{{name}}, last trained {{days}} days ago',
                        name,
                        days: daysAgoValue,
                      })
                    : t('academy.dashboard.atRiskAriaNever', {
                        defaultValue: '{{name}}, never trained',
                        name,
                      });
                  return (
                  <Link
                    key={p.player_id}
                    href={`/academy/players/${p.player_id}`}
                    style={{ textDecoration: 'none' }}
                    aria-label={ariaLabel}
                  >
                    <div className="academy-at-risk-card" style={atRiskCardStyle}>
                      <div style={atRiskAvatarStyle}>
                        {(name[0] || '?').toUpperCase()}
                      </div>
                      <div style={{ flex: 1, minWidth: 0 }}>
                        <p style={{ fontSize: 14, fontWeight: 500, margin: '0 0 2px', color: 'var(--text-primary)' }}>{p.display_name || t('common.unknown')}</p>
                        <p className="academy-muted-text" style={{ fontSize: 12, color: 'var(--text-dim)', margin: 0 }}>{p.age_group || t('common.noAgeGroup')} &middot; {t('common.level')} {p.current_level}</p>
                      </div>
                      <div style={{ textAlign: 'right' }}>
                        <p style={{ fontSize: 13, fontWeight: 600, color: 'var(--color-red)', margin: '0 0 2px' }}>
                          {p.last_practice_date ? t('common.daysAgo', { days: daysSince(p.last_practice_date) }) : t('academy.dashboard.neverTrained')}
                        </p>
                        {p.current_streak === 0 && p.longest_streak > 0 && (
                          <p style={{ fontSize: 11, color: 'var(--color-red)', margin: 0 }}>{t('academy.dashboard.streakBroken', { days: p.longest_streak })}</p>
                        )}
                      </div>
                    </div>
                  </Link>
                  );
                })}
              </div>
            </div>
          )}
        </>
      )}
    </div>
  );
}

function KPICard({ label, value, suffix, color }) {
  return (
    <div className="academy-kpi-card" style={kpiCardStyle}>
      <div style={{ ...kpiIndicatorStyle, background: color }} />
      <p className="academy-kpi-value" style={kpiValueStyle}>{value}{suffix && <span style={{ fontSize: 14, fontWeight: 400, color: 'var(--text-muted)' }}> {suffix}</span>}</p>
      <p className="academy-kpi-label" style={kpiLabelStyle}>{label}</p>
    </div>
  );
}

function formatNumber(n) {
  if (n >= 1000) return `${(n / 1000).toFixed(1)}k`;
  return String(n);
}

function daysSince(dateStr) {
  return Math.floor((Date.now() - new Date(dateStr).getTime()) / (1000 * 60 * 60 * 24));
}

// ─── Styles ────────────────────────────────────────────────────────────────────

const containerStyle = {
  minHeight: '100vh',
  background: 'var(--bg-app-gradient)',
  color: 'var(--text-primary)',
  fontFamily: 'var(--font-sans)',
  padding: 'var(--space-8)',
};

const headerStyle = { maxWidth: 'var(--layout-content-width)', margin: '0 auto var(--space-7)' };
const titleStyle = {
  fontFamily: 'var(--font-display)',
  fontSize: 'var(--text-4xl)',
  fontWeight: 700,
  margin: '0 0 var(--space-1)',
};
const subtitleStyle = {
  fontSize: 'var(--text-base)',
  color: 'var(--text-muted)',
  margin: 0,
  textTransform: 'capitalize',
};

const orgSwitcherStyle = {
  padding: '8px 12px',
  background: 'var(--bg-soft-hover)',
  border: '1px solid var(--border-medium)',
  borderRadius: 'var(--radius-sm)',
  color: 'var(--text-primary)',
  fontSize: 13,
};

const quickActionsStyle = { display: 'flex', gap: 'var(--space-2)', marginTop: 'var(--space-4)' };

const actionLinkStyle = {
  padding: '8px 16px',
  background: 'var(--color-blue-soft)',
  border: '1px solid var(--color-blue-soft-strong)',
  borderRadius: 'var(--radius-sm)',
  color: 'var(--color-blue-link)',
  fontSize: 13,
  fontWeight: 500,
  textDecoration: 'none',
};

const kpiGridStyle = {
  maxWidth: 'var(--layout-content-width)', margin: '0 auto var(--space-6)',
  display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(160px, 1fr))', gap: 'var(--space-3)',
};

const kpiCardStyle = {
  background: 'var(--bg-elevated)',
  border: '1px solid var(--border-light)',
  borderRadius: 'var(--radius-lg)',
  padding: '16px 18px',
  position: 'relative', overflow: 'hidden',
};

const kpiIndicatorStyle = {
  position: 'absolute', top: 0, left: 0, width: 4, height: '100%',
  borderRadius: 'var(--radius-lg) 0 0 var(--radius-lg)',
};

const kpiValueStyle = {
  fontSize: 'var(--text-3xl)',
  fontWeight: 700,
  margin: '0 0 var(--space-1)',
  color: 'var(--text-primary)',
};
const kpiLabelStyle = { fontSize: 'var(--text-sm)', color: 'var(--text-muted)', margin: 0 };

const chartsGridStyle = {
  maxWidth: 'var(--layout-content-width)', margin: '0 auto var(--space-6)',
  display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(400px, 1fr))', gap: 'var(--space-4)',
};

const chartCardStyle = {
  background: 'var(--bg-elevated)',
  border: '1px solid var(--border-light)',
  borderRadius: 'var(--radius-xl)',
  padding: '20px 16px 12px',
};

const chartTitleStyle = {
  fontSize: 'var(--text-base)',
  fontWeight: 600,
  margin: '0 0 16px 4px',
  color: 'var(--text-secondary)',
};

const tooltipStyle = {
  background: 'var(--bg-surface-2)',
  border: '1px solid var(--border-medium)',
  borderRadius: 'var(--radius-sm)',
  fontSize: 12,
};

const sectionStyle = { maxWidth: 'var(--layout-content-width)', margin: '0 auto var(--space-6)' };
const sectionTitleStyle = { fontSize: 'var(--text-lg)', fontWeight: 600, margin: '0 0 var(--space-1)' };
const sectionDescStyle = { fontSize: 'var(--text-sm)', color: 'var(--text-dim)', margin: '0 0 var(--space-3)' };

const atRiskCardStyle = {
  display: 'flex', alignItems: 'center', gap: 'var(--space-3)',
  padding: '12px 16px',
  background: 'rgba(239, 68, 68, 0.06)',
  border: '1px solid var(--color-red-soft)',
  borderRadius: 'var(--radius-md)', cursor: 'pointer',
};

const atRiskAvatarStyle = {
  width: 36, height: 36, borderRadius: '50%',
  background: 'var(--color-red-soft-strong)', color: 'var(--color-red)',
  display: 'flex', alignItems: 'center', justifyContent: 'center',
  fontSize: 14, fontWeight: 600, flexShrink: 0,
};
