import React, { useState } from 'react';
import { Link, useParams } from 'wouter';
import {
  RadarChart, Radar, PolarGrid, PolarAngleAxis, PolarRadiusAxis,
  LineChart, Line, BarChart, Bar, XAxis, YAxis, CartesianGrid,
  Tooltip, ResponsiveContainer,
} from 'recharts';
import usePlayerDetail from './hooks/usePlayerDetail';

const TABS = ['Overview', 'Skills', 'Training History', 'Trends'];

export default function PlayerDetail() {
  const { id } = useParams();
  const {
    profile, skillProgress, dailyActivity, recentSessions,
    categoryRadar, weeklyTrends, skillsByCategory,
    loading, error,
  } = usePlayerDetail(id);
  const [activeTab, setActiveTab] = useState(0);
  const [skillFilter, setSkillFilter] = useState('all');

  if (loading) {
    return (
      <div style={containerStyle}>
        <div style={{ textAlign: 'center', padding: 64 }}>
          <div style={spinnerStyle} />
          <p style={{ marginTop: 16, color: '#71717a' }}>Loading player...</p>
        </div>
      </div>
    );
  }

  if (error || !profile) {
    return (
      <div style={containerStyle}>
        <div style={{ textAlign: 'center', padding: 64 }}>
          <p style={{ color: '#ef4444', fontSize: 14 }}>{error || 'Player not found'}</p>
          <Link href="/academy/players" style={{ color: '#3b82f6', fontSize: 14 }}>Back to Roster</Link>
        </div>
      </div>
    );
  }

  const displayName = profile.display_name || profile.profiles?.full_name || 'Unknown';
  const skillsMastered = skillProgress.filter((s) => s.status === 'mastered').length;
  const skillsPracticed = skillProgress.filter((s) => s.times_practiced > 0).length;

  return (
    <div style={containerStyle}>
      {/* Header */}
      <div style={headerStyle}>
        <Link href="/academy/players" style={backLinkStyle}>&larr; Player Roster</Link>
        <div style={playerHeaderStyle}>
          <div style={largeAvatarStyle}>{displayName[0].toUpperCase()}</div>
          <div>
            <h1 style={titleStyle}>{displayName}</h1>
            <p style={subtitleStyle}>
              {profile.age_group || 'No age group'} &middot; Level {profile.current_level} &middot; {profile.total_xp?.toLocaleString()} XP
            </p>
          </div>
        </div>

        {/* Mini KPIs */}
        <div style={miniKpiRowStyle}>
          <MiniKPI label="Level" value={profile.current_level} />
          <MiniKPI label="Total XP" value={profile.total_xp?.toLocaleString()} />
          <MiniKPI label="Streak" value={`${profile.current_streak}d`} />
          <MiniKPI label="Best Streak" value={`${profile.longest_streak}d`} />
          <MiniKPI label="Mastered" value={skillsMastered} />
          <MiniKPI label="Practiced" value={skillsPracticed} />
        </div>
      </div>

      {/* Tabs */}
      <div style={tabBarStyle}>
        {TABS.map((tab, i) => (
          <button key={tab} onClick={() => setActiveTab(i)} style={activeTab === i ? activeTabBtnStyle : tabBtnStyle}>
            {tab}
          </button>
        ))}
      </div>

      {/* Tab Content */}
      <div style={contentStyle}>
        {activeTab === 0 && (
          <OverviewTab
            categoryRadar={categoryRadar}
            dailyActivity={dailyActivity}
          />
        )}
        {activeTab === 1 && (
          <SkillsTab
            skillsByCategory={skillsByCategory}
            filter={skillFilter}
            setFilter={setSkillFilter}
          />
        )}
        {activeTab === 2 && <HistoryTab sessions={recentSessions} />}
        {activeTab === 3 && <TrendsTab weeklyTrends={weeklyTrends} />}
      </div>
    </div>
  );
}

// ─── Tab: Overview ─────────────────────────────────────────────────────────────

function OverviewTab({ categoryRadar, dailyActivity }) {
  return (
    <div style={tabGridStyle}>
      {/* Skill Category Radar */}
      <div style={cardStyle}>
        <h3 style={cardTitleStyle}>Skill Mastery by Category</h3>
        {categoryRadar.length > 0 ? (
          <div style={{ height: 300 }}>
            <ResponsiveContainer width="100%" height="100%">
              <RadarChart data={categoryRadar}>
                <PolarGrid stroke="rgba(255,255,255,0.08)" />
                <PolarAngleAxis dataKey="category" tick={{ fill: '#9ca3af', fontSize: 10 }} />
                <PolarRadiusAxis tick={{ fill: '#71717a', fontSize: 10 }} domain={[0, 100]} />
                <Radar dataKey="masteryPercent" name="Mastery %" stroke="#8b5cf6" fill="#8b5cf6" fillOpacity={0.25} />
              </RadarChart>
            </ResponsiveContainer>
          </div>
        ) : (
          <p style={emptyStyle}>No skill data yet</p>
        )}
      </div>

      {/* Activity Heatmap (simplified as a bar chart of daily XP) */}
      <div style={cardStyle}>
        <h3 style={cardTitleStyle}>Recent Activity (Last 6 Months)</h3>
        {dailyActivity.length > 0 ? (
          <div style={{ height: 300 }}>
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={dailyActivity.slice(-90)}>
                <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.06)" />
                <XAxis
                  dataKey="activity_date"
                  tick={{ fill: '#71717a', fontSize: 9 }}
                  tickFormatter={(d) => new Date(d).toLocaleDateString('en', { month: 'short', day: 'numeric' })}
                  interval={14}
                  axisLine={{ stroke: 'rgba(255,255,255,0.08)' }}
                  tickLine={false}
                />
                <YAxis tick={{ fill: '#71717a', fontSize: 10 }} axisLine={false} tickLine={false} />
                <Tooltip contentStyle={tooltipStyle} labelStyle={{ color: '#e4e4e7' }} />
                <Bar dataKey="xp_earned" name="XP" fill="#22c55e" radius={[2, 2, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        ) : (
          <p style={emptyStyle}>No activity data yet</p>
        )}
      </div>
    </div>
  );
}

// ─── Tab: Skills ───────────────────────────────────────────────────────────────

function SkillsTab({ skillsByCategory, filter, setFilter }) {
  return (
    <div>
      <div style={{ display: 'flex', gap: 6, marginBottom: 16 }}>
        {['all', 'mastered', 'in_progress', 'not_started'].map((f) => (
          <button
            key={f}
            onClick={() => setFilter(f)}
            style={filter === f ? activeChipStyle : chipStyle}
          >
            {f === 'all' ? 'All' : f === 'in_progress' ? 'In Progress' : f === 'not_started' ? 'Not Started' : 'Mastered'}
          </button>
        ))}
      </div>

      {skillsByCategory.map((cat) => {
        const filtered = cat.skills.filter((s) => {
          if (filter === 'all') return true;
          if (filter === 'mastered') return s.status === 'mastered';
          if (filter === 'in_progress') return s.times_practiced > 0 && s.status !== 'mastered';
          return s.times_practiced === 0;
        });
        if (filtered.length === 0) return null;

        return (
          <div key={cat.name} style={{ marginBottom: 20 }}>
            <h4 style={{ fontSize: 14, fontWeight: 600, color: cat.color, margin: '0 0 8px' }}>
              {cat.icon} {cat.name} ({filtered.length})
            </h4>
            <div style={skillGridStyle}>
              {filtered.map((sp) => (
                <div key={sp.id} style={skillCardStyle}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 6 }}>
                    <span style={{ fontSize: 13, fontWeight: 500 }}>{sp.skills?.name}</span>
                    {sp.status === 'mastered' && <span style={masteredBadge}>Mastered</span>}
                  </div>
                  <div style={progressBarBgStyle}>
                    <div style={{ ...progressBarFillStyle, width: `${getProgressPercent(sp)}%`, background: cat.color }} />
                  </div>
                  <div style={{ display: 'flex', justifyContent: 'space-between', marginTop: 4 }}>
                    <span style={{ fontSize: 11, color: '#71717a' }}>
                      Practiced {sp.times_practiced}x
                    </span>
                    <span style={{ fontSize: 11, color: '#71717a' }}>
                      {sp.skills?.age_group}
                    </span>
                  </div>
                </div>
              ))}
            </div>
          </div>
        );
      })}
    </div>
  );
}

function getProgressPercent(sp) {
  if (sp.status === 'mastered') return 100;
  // Based on completions needed (8 high-rated for mastery)
  return Math.min(100, Math.round((sp.high_rated_completions / 8) * 100));
}

// ─── Tab: Training History ─────────────────────────────────────────────────────

function HistoryTab({ sessions }) {
  if (sessions.length === 0) {
    return <p style={emptyStyle}>No recent training sessions</p>;
  }

  return (
    <div style={cardStyle}>
      <div style={{ overflowX: 'auto' }}>
        <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 13 }}>
          <thead>
            <tr>
              <th style={thStyle}>Date</th>
              <th style={thStyle}>Type</th>
              <th style={thStyle}>Exercises</th>
              <th style={thStyle}>XP Earned</th>
              <th style={thStyle}>Avg Rating</th>
              <th style={thStyle}>Status</th>
            </tr>
          </thead>
          <tbody>
            {sessions.map((s) => (
              <tr key={s.id} style={{ borderBottom: '1px solid rgba(255,255,255,0.04)' }}>
                <td style={tdStyle}>{new Date(s.started_at).toLocaleDateString()}</td>
                <td style={tdStyle}><span style={{ textTransform: 'capitalize' }}>{s.session_type}</span></td>
                <td style={tdStyle}>{s.exercises_completed}</td>
                <td style={tdStyle}>{s.total_xp_earned}</td>
                <td style={tdStyle}>{s.average_rating ? `${Number(s.average_rating).toFixed(1)}★` : '—'}</td>
                <td style={tdStyle}>
                  <span style={{
                    padding: '2px 8px', borderRadius: 6, fontSize: 11, fontWeight: 600,
                    textTransform: 'capitalize',
                    background: s.status === 'completed' ? 'rgba(34,197,94,0.15)' : 'rgba(234,179,8,0.15)',
                    color: s.status === 'completed' ? '#22c55e' : '#eab308',
                  }}>
                    {s.status}
                  </span>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}

// ─── Tab: Trends ───────────────────────────────────────────────────────────────

function TrendsTab({ weeklyTrends }) {
  if (weeklyTrends.length === 0) {
    return <p style={emptyStyle}>Not enough data for trends yet</p>;
  }

  return (
    <div style={tabGridStyle}>
      <div style={cardStyle}>
        <h3 style={cardTitleStyle}>XP per Week</h3>
        <div style={{ height: 240 }}>
          <ResponsiveContainer width="100%" height="100%">
            <LineChart data={weeklyTrends}>
              <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.06)" />
              <XAxis dataKey="week" tick={{ fill: '#71717a', fontSize: 11 }} axisLine={{ stroke: 'rgba(255,255,255,0.08)' }} tickLine={false} />
              <YAxis tick={{ fill: '#71717a', fontSize: 11 }} axisLine={false} tickLine={false} />
              <Tooltip contentStyle={tooltipStyle} labelStyle={{ color: '#e4e4e7' }} />
              <Line type="monotone" dataKey="xp" name="XP" stroke="#3b82f6" strokeWidth={2} dot={{ r: 3, fill: '#3b82f6' }} />
            </LineChart>
          </ResponsiveContainer>
        </div>
      </div>

      <div style={cardStyle}>
        <h3 style={cardTitleStyle}>Practice Minutes per Week</h3>
        <div style={{ height: 240 }}>
          <ResponsiveContainer width="100%" height="100%">
            <BarChart data={weeklyTrends}>
              <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.06)" />
              <XAxis dataKey="week" tick={{ fill: '#71717a', fontSize: 11 }} axisLine={{ stroke: 'rgba(255,255,255,0.08)' }} tickLine={false} />
              <YAxis tick={{ fill: '#71717a', fontSize: 11 }} axisLine={false} tickLine={false} />
              <Tooltip contentStyle={tooltipStyle} labelStyle={{ color: '#e4e4e7' }} />
              <Bar dataKey="minutes" name="Minutes" fill="#22c55e" radius={[4, 4, 0, 0]} />
            </BarChart>
          </ResponsiveContainer>
        </div>
      </div>
    </div>
  );
}

// ─── Shared Sub-components ─────────────────────────────────────────────────────

function MiniKPI({ label, value }) {
  return (
    <div style={miniKpiStyle}>
      <p style={{ fontSize: 18, fontWeight: 700, margin: '0 0 2px', color: '#e4e4e7' }}>{value}</p>
      <p style={{ fontSize: 11, color: '#9ca3af', margin: 0 }}>{label}</p>
    </div>
  );
}

// ─── Styles ────────────────────────────────────────────────────────────────────

const containerStyle = {
  minHeight: '100vh',
  background: 'radial-gradient(circle at 10% 20%, #0b1020, #050910 60%, #02060f)',
  color: '#e4e4e7',
  fontFamily: "'Inter', system-ui, -apple-system, sans-serif",
  padding: '32px',
};

const headerStyle = { maxWidth: 1000, margin: '0 auto 24px' };
const backLinkStyle = { color: '#3b82f6', textDecoration: 'none', fontSize: 14 };
const titleStyle = { fontSize: 24, fontWeight: 700, margin: '0 0 4px' };
const subtitleStyle = { fontSize: 13, color: '#9ca3af', margin: 0 };

const playerHeaderStyle = { display: 'flex', alignItems: 'center', gap: 16, marginTop: 12 };
const largeAvatarStyle = {
  width: 52, height: 52, borderRadius: '50%',
  background: 'rgba(59, 130, 246, 0.15)', color: '#60a5fa',
  display: 'flex', alignItems: 'center', justifyContent: 'center',
  fontSize: 22, fontWeight: 700, flexShrink: 0,
};

const miniKpiRowStyle = {
  display: 'flex', gap: 8, marginTop: 16, flexWrap: 'wrap',
};
const miniKpiStyle = {
  padding: '8px 14px',
  background: 'rgba(255, 255, 255, 0.04)',
  borderRadius: 8,
  textAlign: 'center',
  minWidth: 70,
};

const tabBarStyle = {
  maxWidth: 1000, margin: '0 auto 20px',
  display: 'flex', gap: 4,
  background: 'rgba(255, 255, 255, 0.04)',
  borderRadius: 10, padding: 4,
};

const tabBtnStyle = {
  flex: 1, padding: '9px 12px',
  background: 'transparent', border: 'none', borderRadius: 8,
  color: '#9ca3af', fontSize: 13, fontWeight: 500, cursor: 'pointer',
};

const activeTabBtnStyle = {
  ...tabBtnStyle,
  background: 'rgba(59, 130, 246, 0.15)', color: '#3b82f6',
};

const contentStyle = { maxWidth: 1000, margin: '0 auto' };

const tabGridStyle = {
  display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(380px, 1fr))', gap: 16,
};

const cardStyle = {
  background: 'rgba(15, 23, 42, 0.6)',
  border: '1px solid rgba(255, 255, 255, 0.08)',
  borderRadius: 14, padding: '20px 16px',
};

const cardTitleStyle = { fontSize: 14, fontWeight: 600, margin: '0 0 12px', color: '#d1d5db' };

const tooltipStyle = {
  background: '#1a1f2e', border: '1px solid rgba(255,255,255,0.1)',
  borderRadius: 8, fontSize: 12,
};

const spinnerStyle = {
  width: 40, height: 40,
  border: '3px solid #27272a', borderTopColor: '#E63946',
  borderRadius: '50%', animation: 'spin 1s linear infinite', margin: '0 auto',
};

const emptyStyle = { color: '#71717a', fontSize: 14, textAlign: 'center', padding: 32 };

// Skill filter chips
const chipStyle = {
  padding: '6px 12px', background: 'rgba(255,255,255,0.04)',
  border: '1px solid rgba(255,255,255,0.08)', borderRadius: 8,
  color: '#9ca3af', fontSize: 12, fontWeight: 500, cursor: 'pointer',
};
const activeChipStyle = {
  ...chipStyle,
  background: 'rgba(59, 130, 246, 0.15)',
  border: '1px solid rgba(59, 130, 246, 0.3)',
  color: '#3b82f6',
};

const skillGridStyle = {
  display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(260px, 1fr))', gap: 8,
};

const skillCardStyle = {
  padding: '10px 12px',
  background: 'rgba(255, 255, 255, 0.03)',
  border: '1px solid rgba(255, 255, 255, 0.06)',
  borderRadius: 8,
};

const masteredBadge = {
  padding: '2px 6px', borderRadius: 4, fontSize: 10, fontWeight: 600,
  background: 'rgba(34, 197, 94, 0.15)', color: '#22c55e',
};

const progressBarBgStyle = {
  height: 4, borderRadius: 2,
  background: 'rgba(255, 255, 255, 0.08)',
};

const progressBarFillStyle = {
  height: '100%', borderRadius: 2,
  transition: 'width 0.3s',
};

const thStyle = {
  textAlign: 'left', padding: '10px 10px', color: '#71717a', fontWeight: 500,
  borderBottom: '1px solid rgba(255, 255, 255, 0.08)', whiteSpace: 'nowrap',
};

const tdStyle = { padding: '10px', whiteSpace: 'nowrap' };
