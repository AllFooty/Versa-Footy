import React from 'react';
import { Link } from 'wouter';
import { useTranslation } from 'react-i18next';
import { useAuth } from '../../lib/AuthContext';
import usePlayerRoster, { getPlayerStatus } from './hooks/usePlayerRoster';

const STATUS_OPTIONS = ['', 'active', 'idle', 'inactive'];
const AGE_GROUPS = ['', 'U-7', 'U-8', 'U-9', 'U-10', 'U-11', 'U-12', 'U-13', 'U-14', 'U-15+'];

export default function PlayerRoster() {
  const { t } = useTranslation();
  const { activeOrg } = useAuth();
  const {
    players, loading, sortField, sortDir, toggleSort,
    search, setSearch, filterAgeGroup, setFilterAgeGroup,
    filterStatus, setFilterStatus,
  } = usePlayerRoster(activeOrg?.id);

  const COLUMNS = [
    { key: 'display_name', label: t('academy.roster.columnPlayer') },
    { key: 'age_group', label: t('academy.roster.columnAge') },
    { key: 'current_level', label: t('academy.roster.columnLevel') },
    { key: 'total_xp', label: t('academy.roster.columnXP') },
    { key: 'xp_this_week', label: t('academy.roster.columnWeekXP') },
    { key: 'skills_mastered', label: t('academy.roster.columnMastered') },
    { key: 'current_streak', label: t('academy.roster.columnStreak') },
    { key: 'avg_self_rating', label: t('academy.roster.columnAvgRating') },
    { key: 'last_practice_date', label: t('academy.roster.columnLastActive') },
  ];

  const STATUS_LABELS = {
    '': t('academy.roster.allStatus'),
    active: t('academy.roster.active'),
    idle: t('academy.roster.idle'),
    inactive: t('academy.roster.inactive'),
  };

  return (
    <div style={containerStyle}>
      <div style={headerStyle}>
        <Link href="/academy" style={backLinkStyle}>&larr; {t('nav.dashboard')}</Link>
        <h1 style={titleStyle}>{t('academy.roster.title')}</h1>
        <p style={subtitleStyle}>{t('academy.roster.playerCount', { count: players.length })}</p>
      </div>

      {/* Filters */}
      <div style={filtersStyle}>
        <input
          type="text"
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          placeholder={t('academy.roster.searchPlaceholder')}
          style={searchInputStyle}
        />
        <select value={filterAgeGroup} onChange={(e) => setFilterAgeGroup(e.target.value)} style={filterSelectStyle}>
          <option value="">{t('academy.roster.allAges')}</option>
          {AGE_GROUPS.slice(1).map((ag) => (
            <option key={ag} value={ag}>{ag}</option>
          ))}
        </select>
        <select value={filterStatus} onChange={(e) => setFilterStatus(e.target.value)} style={filterSelectStyle}>
          {STATUS_OPTIONS.map((s) => (
            <option key={s} value={s}>{STATUS_LABELS[s]}</option>
          ))}
        </select>
      </div>

      {/* Table */}
      <div style={tableWrapStyle}>
        {loading ? (
          <div style={{ textAlign: 'center', padding: 48 }}>
            <div style={spinnerStyle} />
            <p style={{ marginTop: 16, color: '#71717a' }}>{t('academy.roster.loadingPlayers')}</p>
          </div>
        ) : players.length === 0 ? (
          <div style={{ textAlign: 'center', padding: 48 }}>
            <p style={{ color: '#71717a', fontSize: 14 }}>{t('academy.roster.noPlayersFound')}</p>
            <Link href="/academy/invitations" style={{ color: '#3b82f6', fontSize: 14 }}>{t('academy.roster.invitePlayers')}</Link>
          </div>
        ) : (
          <div style={{ overflowX: 'auto' }}>
            <table style={tableStyle}>
              <thead>
                <tr>
                  {COLUMNS.map((col) => (
                    <th
                      key={col.key}
                      onClick={() => toggleSort(col.key)}
                      style={thStyle}
                    >
                      {col.label}
                      {sortField === col.key && (
                        <span style={{ marginLeft: 4 }}>{sortDir === 'asc' ? '\u2191' : '\u2193'}</span>
                      )}
                    </th>
                  ))}
                  <th style={thStyle}>{t('academy.roster.columnStatus')}</th>
                </tr>
              </thead>
              <tbody>
                {players.map((p) => {
                  const status = getPlayerStatus(p);
                  return (
                    <tr key={p.player_id} style={trStyle}>
                      <td style={tdStyle}>
                        <Link href={`/academy/players/${p.player_id}`} style={playerLinkStyle}>
                          <div style={avatarStyle}>{(p.display_name || '?')[0].toUpperCase()}</div>
                          {p.display_name || t('common.unknown')}
                        </Link>
                      </td>
                      <td style={tdStyle}>{p.age_group || '\u2014'}</td>
                      <td style={tdStyle}>{p.current_level}</td>
                      <td style={tdStyle}>{p.total_xp?.toLocaleString()}</td>
                      <td style={tdStyle}>{p.xp_this_week?.toLocaleString()}</td>
                      <td style={tdStyle}>{p.skills_mastered}</td>
                      <td style={tdStyle}>
                        {p.current_streak > 0 ? `${p.current_streak}d` : '\u2014'}
                      </td>
                      <td style={tdStyle}>
                        {p.avg_self_rating > 0 ? `${p.avg_self_rating}\u2605` : '\u2014'}
                      </td>
                      <td style={tdStyle}>
                        {p.last_practice_date
                          ? formatRelativeDate(p.last_practice_date, t)
                          : t('common.never')}
                      </td>
                      <td style={tdStyle}>
                        <span style={statusBadgeStyle(status)}>{status}</span>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
}

function formatRelativeDate(dateStr, t) {
  const days = Math.floor((Date.now() - new Date(dateStr).getTime()) / (1000 * 60 * 60 * 24));
  if (days === 0) return t('common.today');
  if (days === 1) return t('common.yesterday');
  if (days < 7) return t('common.daysAgo', { days });
  return new Date(dateStr).toLocaleDateString();
}

const statusBadgeStyle = (status) => ({
  padding: '3px 8px', borderRadius: 6, fontSize: 11, fontWeight: 600, textTransform: 'capitalize',
  background:
    status === 'active' ? 'rgba(34, 197, 94, 0.15)' :
    status === 'idle' ? 'rgba(234, 179, 8, 0.15)' :
    'rgba(239, 68, 68, 0.15)',
  color:
    status === 'active' ? '#22c55e' :
    status === 'idle' ? '#eab308' :
    '#ef4444',
});

// ─── Styles ────────────────────────────────────────────────────────────────────

const containerStyle = {
  minHeight: '100vh',
  background: 'radial-gradient(circle at 10% 20%, #0b1020, #050910 60%, #02060f)',
  color: '#e4e4e7',
  fontFamily: "'Inter', system-ui, -apple-system, sans-serif",
  padding: '32px',
};

const headerStyle = { maxWidth: 1200, margin: '0 auto 20px' };
const backLinkStyle = { color: '#3b82f6', textDecoration: 'none', fontSize: 14 };
const titleStyle = { fontSize: 28, fontWeight: 700, margin: '12px 0 4px' };
const subtitleStyle = { fontSize: 14, color: '#9ca3af', margin: 0 };

const filtersStyle = {
  maxWidth: 1200, margin: '0 auto 16px',
  display: 'flex', gap: 8, flexWrap: 'wrap',
};

const searchInputStyle = {
  flex: '1 1 200px', padding: '8px 12px',
  background: 'rgba(255, 255, 255, 0.06)',
  border: '1px solid rgba(255, 255, 255, 0.12)',
  borderRadius: 8, color: '#e4e4e7', fontSize: 13, outline: 'none',
};

const filterSelectStyle = {
  padding: '8px 12px',
  background: 'rgba(255, 255, 255, 0.06)',
  border: '1px solid rgba(255, 255, 255, 0.12)',
  borderRadius: 8, color: '#e4e4e7', fontSize: 13,
};

const tableWrapStyle = {
  maxWidth: 1200, margin: '0 auto',
  background: 'rgba(15, 23, 42, 0.6)',
  border: '1px solid rgba(255, 255, 255, 0.08)',
  borderRadius: 14,
};

const spinnerStyle = {
  width: 40, height: 40,
  border: '3px solid #27272a', borderTopColor: '#E63946',
  borderRadius: '50%', animation: 'spin 1s linear infinite', margin: '0 auto',
};

const tableStyle = { width: '100%', borderCollapse: 'collapse', fontSize: 13 };

const thStyle = {
  textAlign: 'left', padding: '12px 10px', color: '#71717a', fontWeight: 500,
  borderBottom: '1px solid rgba(255, 255, 255, 0.08)',
  whiteSpace: 'nowrap', cursor: 'pointer', userSelect: 'none',
};

const trStyle = {
  borderBottom: '1px solid rgba(255, 255, 255, 0.04)',
  transition: 'background 0.1s',
};

const tdStyle = { padding: '10px', whiteSpace: 'nowrap' };

const playerLinkStyle = {
  display: 'flex', alignItems: 'center', gap: 8,
  color: '#e4e4e7', textDecoration: 'none', fontWeight: 500,
};

const avatarStyle = {
  width: 28, height: 28, borderRadius: '50%',
  background: 'rgba(59, 130, 246, 0.15)', color: '#60a5fa',
  display: 'flex', alignItems: 'center', justifyContent: 'center',
  fontSize: 12, fontWeight: 600, flexShrink: 0,
};
