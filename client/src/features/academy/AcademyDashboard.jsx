import React from 'react';
import { Link } from 'wouter';
import {
  BarChart, Bar, LineChart, Line, XAxis, YAxis, CartesianGrid,
  Tooltip, ResponsiveContainer,
} from 'recharts';
import { useAuth } from '../../lib/AuthContext';
import useAcademyDashboard from './hooks/useAcademyDashboard';
import usePlayerRoster, { getPlayerStatus } from './hooks/usePlayerRoster';

export default function AcademyDashboard() {
  const { activeOrg, organizations, setActiveOrg } = useAuth();
  const { stats, weeklyActivity, loading } = useAcademyDashboard(activeOrg?.id);
  const { players: allPlayers } = usePlayerRoster(activeOrg?.id);

  const atRiskPlayers = allPlayers
    .filter((p) => getPlayerStatus(p) === 'inactive')
    .sort((a, b) => {
      if (!a.last_practice_date) return -1;
      if (!b.last_practice_date) return 1;
      return new Date(a.last_practice_date) - new Date(b.last_practice_date);
    })
    .slice(0, 5);

  return (
    <div style={containerStyle}>
      {/* Header */}
      <div style={headerStyle}>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: 12 }}>
          <div>
            <h1 style={titleStyle}>{activeOrg?.name || 'Academy'}</h1>
            <p style={subtitleStyle}>{activeOrg?.type} Dashboard</p>
          </div>
          {organizations.length > 1 && (
            <select
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
        <div style={quickActionsStyle}>
          <Link href="/academy/invitations" style={actionLinkStyle}>Invite Players</Link>
          <Link href="/academy/players" style={actionLinkStyle}>View All Players</Link>
        </div>
      </div>

      {loading && !stats ? (
        <div style={loadingStyle}>
          <div style={spinnerStyle} />
          <p style={{ marginTop: 16, color: '#71717a' }}>Loading dashboard...</p>
        </div>
      ) : (
        <>
          {/* KPI Cards */}
          <div style={kpiGridStyle}>
            <KPICard label="Total Players" value={stats?.total_players ?? 0} color="#3b82f6" />
            <KPICard
              label="Active This Week"
              value={stats?.active_this_week ?? 0}
              suffix={stats?.total_players ? `/ ${stats.total_players}` : ''}
              color="#22c55e"
            />
            <KPICard label="Skills Mastered" value={stats?.total_skills_mastered ?? 0} color="#8b5cf6" />
            <KPICard label="Avg Level" value={stats?.avg_player_level ?? 0} color="#f97316" />
            <KPICard label="Weekly XP" value={formatNumber(stats?.total_xp_this_week ?? 0)} color="#22d3ee" />
            <KPICard label="Avg Streak" value={`${stats?.avg_streak ?? 0}d`} color="#eab308" />
          </div>

          {/* Charts */}
          <div style={chartsGridStyle}>
            <div style={chartCardStyle}>
              <h3 style={chartTitleStyle}>Weekly Active Players</h3>
              <div style={{ height: 240 }}>
                <ResponsiveContainer width="100%" height="100%">
                  <LineChart data={weeklyActivity}>
                    <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.06)" />
                    <XAxis dataKey="week" tick={{ fill: '#71717a', fontSize: 11 }} axisLine={{ stroke: 'rgba(255,255,255,0.08)' }} tickLine={false} />
                    <YAxis tick={{ fill: '#71717a', fontSize: 11 }} axisLine={false} tickLine={false} allowDecimals={false} />
                    <Tooltip contentStyle={tooltipStyle} labelStyle={{ color: '#e4e4e7' }} />
                    <Line type="monotone" dataKey="activePlayers" name="Active Players" stroke="#3b82f6" strokeWidth={2} dot={{ r: 3, fill: '#3b82f6' }} activeDot={{ r: 5 }} />
                  </LineChart>
                </ResponsiveContainer>
              </div>
            </div>

            <div style={chartCardStyle}>
              <h3 style={chartTitleStyle}>Weekly XP Earned</h3>
              <div style={{ height: 240 }}>
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={weeklyActivity}>
                    <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.06)" />
                    <XAxis dataKey="week" tick={{ fill: '#71717a', fontSize: 11 }} axisLine={{ stroke: 'rgba(255,255,255,0.08)' }} tickLine={false} />
                    <YAxis tick={{ fill: '#71717a', fontSize: 11 }} axisLine={false} tickLine={false} />
                    <Tooltip contentStyle={tooltipStyle} labelStyle={{ color: '#e4e4e7' }} />
                    <Bar dataKey="totalXp" name="XP" fill="#8b5cf6" radius={[4, 4, 0, 0]} />
                  </BarChart>
                </ResponsiveContainer>
              </div>
            </div>
          </div>

          {/* At-Risk Players */}
          {atRiskPlayers.length > 0 && (
            <div style={sectionStyle}>
              <h3 style={sectionTitleStyle}>At-Risk Players</h3>
              <p style={sectionDescStyle}>Players who haven't trained in 7+ days</p>
              <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
                {atRiskPlayers.map((p) => (
                  <Link key={p.player_id} href={`/academy/players/${p.player_id}`} style={{ textDecoration: 'none' }}>
                    <div style={atRiskCardStyle}>
                      <div style={atRiskAvatarStyle}>
                        {(p.display_name || '?')[0].toUpperCase()}
                      </div>
                      <div style={{ flex: 1, minWidth: 0 }}>
                        <p style={{ fontSize: 14, fontWeight: 500, margin: '0 0 2px', color: '#e4e4e7' }}>{p.display_name || 'Unknown'}</p>
                        <p style={{ fontSize: 12, color: '#71717a', margin: 0 }}>{p.age_group || 'No age group'} &middot; Level {p.current_level}</p>
                      </div>
                      <div style={{ textAlign: 'right' }}>
                        <p style={{ fontSize: 13, fontWeight: 600, color: '#ef4444', margin: '0 0 2px' }}>
                          {p.last_practice_date ? `${daysSince(p.last_practice_date)}d ago` : 'Never trained'}
                        </p>
                        {p.current_streak === 0 && p.longest_streak > 0 && (
                          <p style={{ fontSize: 11, color: '#ef4444', margin: 0 }}>Streak broken (was {p.longest_streak}d)</p>
                        )}
                      </div>
                    </div>
                  </Link>
                ))}
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
    <div style={kpiCardStyle}>
      <div style={{ ...kpiIndicatorStyle, background: color }} />
      <p style={kpiValueStyle}>{value}{suffix && <span style={{ fontSize: 14, fontWeight: 400, color: '#71717a' }}> {suffix}</span>}</p>
      <p style={kpiLabelStyle}>{label}</p>
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
  background: 'radial-gradient(circle at 10% 20%, #0b1020, #050910 60%, #02060f)',
  color: '#e4e4e7',
  fontFamily: "'Inter', system-ui, -apple-system, sans-serif",
  padding: '32px',
};

const headerStyle = { maxWidth: 1200, margin: '0 auto 28px' };
const titleStyle = { fontSize: 28, fontWeight: 700, margin: '0 0 4px' };
const subtitleStyle = { fontSize: 14, color: '#9ca3af', margin: 0, textTransform: 'capitalize' };

const orgSwitcherStyle = {
  padding: '8px 12px',
  background: 'rgba(255, 255, 255, 0.06)',
  border: '1px solid rgba(255, 255, 255, 0.12)',
  borderRadius: 8,
  color: '#e4e4e7',
  fontSize: 13,
};

const quickActionsStyle = { display: 'flex', gap: 8, marginTop: 16 };

const actionLinkStyle = {
  padding: '8px 16px',
  background: 'rgba(59, 130, 246, 0.12)',
  border: '1px solid rgba(59, 130, 246, 0.25)',
  borderRadius: 8,
  color: '#60a5fa',
  fontSize: 13,
  fontWeight: 500,
  textDecoration: 'none',
};

const loadingStyle = { maxWidth: 1200, margin: '0 auto', textAlign: 'center', padding: 64 };

const spinnerStyle = {
  width: 40, height: 40,
  border: '3px solid #27272a', borderTopColor: '#E63946',
  borderRadius: '50%', animation: 'spin 1s linear infinite', margin: '0 auto',
};

const kpiGridStyle = {
  maxWidth: 1200, margin: '0 auto 24px',
  display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(160px, 1fr))', gap: 12,
};

const kpiCardStyle = {
  background: 'rgba(15, 23, 42, 0.6)',
  border: '1px solid rgba(255, 255, 255, 0.08)',
  borderRadius: 12, padding: '16px 18px',
  position: 'relative', overflow: 'hidden',
};

const kpiIndicatorStyle = {
  position: 'absolute', top: 0, left: 0, width: 4, height: '100%',
  borderRadius: '12px 0 0 12px',
};

const kpiValueStyle = { fontSize: 26, fontWeight: 700, margin: '0 0 4px', color: '#e4e4e7' };
const kpiLabelStyle = { fontSize: 12, color: '#9ca3af', margin: 0 };

const chartsGridStyle = {
  maxWidth: 1200, margin: '0 auto 24px',
  display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(400px, 1fr))', gap: 16,
};

const chartCardStyle = {
  background: 'rgba(15, 23, 42, 0.6)',
  border: '1px solid rgba(255, 255, 255, 0.08)',
  borderRadius: 14, padding: '20px 16px 12px',
};

const chartTitleStyle = { fontSize: 14, fontWeight: 600, margin: '0 0 16px 4px', color: '#d1d5db' };

const tooltipStyle = {
  background: '#1a1f2e', border: '1px solid rgba(255,255,255,0.1)',
  borderRadius: 8, fontSize: 12,
};

const sectionStyle = { maxWidth: 1200, margin: '0 auto 24px' };
const sectionTitleStyle = { fontSize: 16, fontWeight: 600, margin: '0 0 4px' };
const sectionDescStyle = { fontSize: 12, color: '#71717a', margin: '0 0 12px' };

const atRiskCardStyle = {
  display: 'flex', alignItems: 'center', gap: 12,
  padding: '12px 16px',
  background: 'rgba(239, 68, 68, 0.06)',
  border: '1px solid rgba(239, 68, 68, 0.12)',
  borderRadius: 10, cursor: 'pointer',
};

const atRiskAvatarStyle = {
  width: 36, height: 36, borderRadius: '50%',
  background: 'rgba(239, 68, 68, 0.15)', color: '#ef4444',
  display: 'flex', alignItems: 'center', justifyContent: 'center',
  fontSize: 14, fontWeight: 600, flexShrink: 0,
};
