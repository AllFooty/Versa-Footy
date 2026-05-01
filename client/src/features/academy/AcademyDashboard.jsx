import React from 'react';
import { Link } from 'wouter';
import { useTranslation } from 'react-i18next';
import {
  BarChart, Bar, LineChart, Line, XAxis, YAxis, CartesianGrid,
  Tooltip, ResponsiveContainer,
} from 'recharts';
import { UserPlus } from 'lucide-react';
import { useAuth } from '../../lib/AuthContext';
import useAcademyDashboard from './hooks/useAcademyDashboard';
import usePlayerRoster, { getPlayerStatus } from './hooks/usePlayerRoster';
import { SkeletonCard, SkeletonChart } from '../../components/ui/Skeleton';
import { PageContainer, PageHeader } from '../../components/Page';

export default function AcademyDashboard() {
  const { t } = useTranslation();
  const { activeOrg } = useAuth();
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

  const isEmptyAcademy = !loading && (stats?.total_players ?? 0) === 0;

  return (
    <PageContainer width="default">
      <PageHeader
        title={activeOrg?.name || t('academy.dashboard.fallbackName')}
        subtitle={`${activeOrg?.type ?? ''} ${t('academy.dashboard.dashboardSuffix')}`.trim()}
        actions={!isEmptyAcademy && (
          <>
            <Link href="/academy/invitations" className="action-chip">
              {t('academy.dashboard.invitePlayers')}
            </Link>
            <Link href="/academy/players" className="action-chip action-chip--ghost">
              {t('academy.dashboard.viewAllPlayers')}
            </Link>
          </>
        )}
      />

      {loading && !stats ? (
        <>
          <div className="kpi-grid">
            {[...Array(6)].map((_, i) => <SkeletonCard key={i} />)}
          </div>
          <div className="charts-grid">
            <SkeletonChart />
            <SkeletonChart />
          </div>
        </>
      ) : isEmptyAcademy ? (
        <EmptyAcademyHero t={t} />
      ) : (
        <>
          <div className="kpi-grid">
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

          <div className="charts-grid">
            <div className="chart-card">
              <h3 className="chart-card__title">{t('academy.dashboard.weeklyActivePlayers')}</h3>
              <div className="chart-card__body">
                <ResponsiveContainer width="100%" height="100%">
                  <LineChart data={weeklyActivity}>
                    <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.06)" />
                    <XAxis dataKey="week" tick={{ fill: '#71717a', fontSize: 12 }} axisLine={{ stroke: 'rgba(255,255,255,0.08)' }} tickLine={false} />
                    <YAxis tick={{ fill: '#71717a', fontSize: 12 }} axisLine={false} tickLine={false} allowDecimals={false} />
                    <Tooltip contentStyle={tooltipStyle} labelStyle={{ color: '#e4e4e7' }} />
                    <Line type="monotone" dataKey="activePlayers" name={t('academy.dashboard.activePlayers')} stroke="#3b82f6" strokeWidth={2} dot={{ r: 3, fill: '#3b82f6' }} activeDot={{ r: 5 }} />
                  </LineChart>
                </ResponsiveContainer>
              </div>
            </div>

            <div className="chart-card">
              <h3 className="chart-card__title">{t('academy.dashboard.weeklyXPEarned')}</h3>
              <div className="chart-card__body">
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={weeklyActivity}>
                    <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.06)" />
                    <XAxis dataKey="week" tick={{ fill: '#71717a', fontSize: 12 }} axisLine={{ stroke: 'rgba(255,255,255,0.08)' }} tickLine={false} />
                    <YAxis tick={{ fill: '#71717a', fontSize: 12 }} axisLine={false} tickLine={false} />
                    <Tooltip contentStyle={tooltipStyle} labelStyle={{ color: '#e4e4e7' }} />
                    <Bar dataKey="totalXp" name={t('common.xp')} fill="#8b5cf6" radius={[4, 4, 0, 0]} />
                  </BarChart>
                </ResponsiveContainer>
              </div>
            </div>
          </div>

          {atRiskPlayers.length > 0 && (
            <section className="section">
              <h3 className="section__title">{t('academy.dashboard.atRiskPlayers')}</h3>
              <p className="section__desc">{t('academy.dashboard.atRiskDescription')}</p>
              <div className="list-rows">
                {atRiskPlayers.map((p) => {
                  const name = p.display_name || t('common.unknown');
                  const daysAgoValue = p.last_practice_date ? daysSince(p.last_practice_date) : null;
                  const ariaLabel = daysAgoValue != null
                    ? t('academy.dashboard.atRiskAria', { name, days: daysAgoValue })
                    : t('academy.dashboard.atRiskAriaNever', { name });
                  return (
                    <Link
                      key={p.player_id}
                      href={`/academy/players/${p.player_id}`}
                      className="list-row list-row--danger"
                      aria-label={ariaLabel}
                    >
                      <span className="list-row__avatar list-row__avatar--danger">
                        {(name[0] || '?').toUpperCase()}
                      </span>
                      <div className="list-row__main">
                        <p className="list-row__name">{name}</p>
                        <p className="list-row__sub">
                          {p.age_group || t('common.noAgeGroup')} &middot; {t('common.level')} {p.current_level}
                        </p>
                      </div>
                      <div className="list-row__trailing">
                        <p className="list-row__trailing-strong" style={{ color: '#ef4444' }}>
                          {p.last_practice_date
                            ? t('common.daysAgo', { days: daysSince(p.last_practice_date) })
                            : t('academy.dashboard.neverTrained')}
                        </p>
                        {p.current_streak === 0 && p.longest_streak > 0 && (
                          <p className="list-row__trailing-sub" style={{ color: '#ef4444' }}>
                            {t('academy.dashboard.streakBroken', { days: p.longest_streak })}
                          </p>
                        )}
                      </div>
                    </Link>
                  );
                })}
              </div>
            </section>
          )}
        </>
      )}
    </PageContainer>
  );
}

function EmptyAcademyHero({ t }) {
  return (
    <div className="empty-state empty-state--hero">
      <div className="empty-state__icon" aria-hidden="true">
        <UserPlus size={32} strokeWidth={2} />
      </div>
      <h2 className="empty-state__title">{t('academy.dashboard.empty.title')}</h2>
      <p className="empty-state__body">{t('academy.dashboard.empty.body')}</p>
      <div className="empty-state__actions">
        <Link href="/academy/invitations" className="btn-primary">
          {t('academy.dashboard.empty.invitePrimary')}
        </Link>
        <Link href="/academy/teams" className="btn-secondary">
          {t('academy.dashboard.empty.teamSecondary')}
        </Link>
      </div>
      <p className="empty-state__hint">{t('academy.dashboard.empty.hint')}</p>
    </div>
  );
}

function KPICard({ label, value, suffix, color }) {
  return (
    <div className="kpi-card">
      <span className="kpi-card__indicator" style={color ? { background: color } : undefined} />
      <p className="kpi-card__value">
        {value}
        {suffix && <span className="kpi-card__suffix">{suffix}</span>}
      </p>
      <p className="kpi-card__label">{label}</p>
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

const tooltipStyle = {
  background: '#1a1f2e',
  border: '1px solid rgba(255,255,255,0.1)',
  borderRadius: 8,
  fontSize: 12,
};
