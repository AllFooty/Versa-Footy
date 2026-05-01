import React from 'react';
import { Link } from 'wouter';
import { useTranslation } from 'react-i18next';
import { useAuth } from '../../lib/AuthContext';
import usePlayerRoster, { getPlayerStatus } from './hooks/usePlayerRoster';
import { SkeletonRow } from '../../components/ui/Skeleton';
import { PageContainer, PageHeader, BackLink } from '../../components/Page';

const STATUS_OPTIONS = ['', 'active', 'idle', 'inactive'];
const AGE_GROUPS = ['', 'U-7', 'U-8', 'U-9', 'U-10', 'U-11', 'U-12', 'U-13', 'U-14', 'U-15+'];

const STATUS_BADGE_VARIANT = {
  active: 'badge--success',
  idle: 'badge--warning',
  inactive: 'badge--danger',
};

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
    <PageContainer width="default">
      <PageHeader
        backLink={<BackLink href="/academy">{t('nav.dashboard')}</BackLink>}
        title={t('academy.roster.title')}
        subtitle={t('academy.roster.playerCount', { count: players.length })}
      />

      <div className="toolbar roster-filters">
        <input
          type="text"
          className="input toolbar__search"
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          placeholder={t('academy.roster.searchPlaceholder')}
          aria-label={t('academy.roster.searchPlaceholder')}
        />
        <select
          className="select toolbar__select"
          value={filterAgeGroup}
          onChange={(e) => setFilterAgeGroup(e.target.value)}
          aria-label={t('academy.roster.allAges')}
        >
          <option value="">{t('academy.roster.allAges')}</option>
          {AGE_GROUPS.slice(1).map((ag) => (
            <option key={ag} value={ag}>{ag}</option>
          ))}
        </select>
        <select
          className="select toolbar__select"
          value={filterStatus}
          onChange={(e) => setFilterStatus(e.target.value)}
          aria-label={STATUS_LABELS['']}
        >
          {STATUS_OPTIONS.map((s) => (
            <option key={s} value={s}>{STATUS_LABELS[s]}</option>
          ))}
        </select>
      </div>

      <div className="data-table-wrap">
        {loading ? (
          <div style={{ padding: 16 }}>
            {[...Array(5)].map((_, i) => <SkeletonRow key={i} />)}
          </div>
        ) : players.length === 0 ? (
          <div className="empty-compact roster-empty">
            <p className="empty-compact__msg">{t('academy.roster.noPlayersFound')}</p>
            <Link href="/academy/invitations" className="empty-compact__cta">
              {t('academy.roster.invitePlayers')}
            </Link>
          </div>
        ) : (
          <>
            {/* Desktop: Table */}
            <div className="roster-table-desktop data-table-wrap__scroll">
              <table className="data-table">
                <thead>
                  <tr>
                    {COLUMNS.map((col) => {
                      const isSorted = sortField === col.key;
                      const ariaSort = isSorted ? (sortDir === 'asc' ? 'ascending' : 'descending') : 'none';
                      return (
                        <th key={col.key} className="data-table__th--sortable" aria-sort={ariaSort} scope="col" style={{ padding: 0 }}>
                          <button
                            type="button"
                            className="data-table__sort-btn"
                            onClick={() => toggleSort(col.key)}
                          >
                            <span>{col.label}</span>
                            {isSorted && (
                              <span style={{ marginInlineStart: 4 }} aria-hidden="true">
                                {sortDir === 'asc' ? '↑' : '↓'}
                              </span>
                            )}
                          </button>
                        </th>
                      );
                    })}
                    <th scope="col">{t('academy.roster.columnStatus')}</th>
                  </tr>
                </thead>
                <tbody>
                  {players.map((p) => {
                    const status = getPlayerStatus(p);
                    return (
                      <tr key={p.player_id}>
                        <td>
                          <Link href={`/academy/players/${p.player_id}`} className="data-table__cell-link">
                            <span className="avatar avatar--sm">{(p.display_name || '?')[0].toUpperCase()}</span>
                            {p.display_name || t('common.unknown')}
                          </Link>
                        </td>
                        <td>{p.age_group || '—'}</td>
                        <td>{p.current_level}</td>
                        <td>{p.total_xp?.toLocaleString()}</td>
                        <td>{p.xp_this_week?.toLocaleString()}</td>
                        <td>{p.skills_mastered}</td>
                        <td>{p.current_streak > 0 ? `${p.current_streak}d` : '—'}</td>
                        <td>{p.avg_self_rating > 0 ? `${p.avg_self_rating}★` : '—'}</td>
                        <td>
                          {p.last_practice_date
                            ? formatRelativeDate(p.last_practice_date, t)
                            : t('common.never')}
                        </td>
                        <td>
                          <span className={`badge ${STATUS_BADGE_VARIANT[status] || 'badge--neutral'}`}>
                            {STATUS_LABELS[status] || status}
                          </span>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>

            {/* Mobile: Card Layout (uses academy.css mobile classes) */}
            <div className="roster-cards-mobile">
              {players.map((p) => {
                const status = getPlayerStatus(p);
                return (
                  <Link key={p.player_id} href={`/academy/players/${p.player_id}`} className="roster-player-card">
                    <div className="roster-card-header">
                      <div className="roster-card-avatar">
                        {(p.display_name || '?')[0].toUpperCase()}
                      </div>
                      <div className="roster-card-info">
                        <span className="roster-card-name">{p.display_name || t('common.unknown')}</span>
                        <span className="roster-card-meta">
                          {p.age_group || '—'} &middot; {t('common.level')} {p.current_level}
                        </span>
                      </div>
                      <span className={`roster-card-status roster-card-status--${status}`}>
                        {STATUS_LABELS[status] || status}
                      </span>
                    </div>
                    <div className="roster-card-stats">
                      <div className="roster-card-stat">
                        <span className="roster-card-stat-label">{t('academy.roster.columnXP')}</span>
                        <span className="roster-card-stat-value">{p.total_xp?.toLocaleString()}</span>
                      </div>
                      <div className="roster-card-stat">
                        <span className="roster-card-stat-label">{t('academy.roster.columnStreak')}</span>
                        <span className="roster-card-stat-value">{p.current_streak > 0 ? `${p.current_streak}d` : '—'}</span>
                      </div>
                      <div className="roster-card-stat">
                        <span className="roster-card-stat-label">{t('academy.roster.columnMastered')}</span>
                        <span className="roster-card-stat-value">{p.skills_mastered}</span>
                      </div>
                    </div>
                  </Link>
                );
              })}
            </div>
          </>
        )}
      </div>
    </PageContainer>
  );
}

function formatRelativeDate(dateStr, t) {
  const days = Math.floor((Date.now() - new Date(dateStr).getTime()) / (1000 * 60 * 60 * 24));
  if (days === 0) return t('common.today');
  if (days === 1) return t('common.yesterday');
  if (days < 7) return t('common.daysAgo', { days });
  return new Date(dateStr).toLocaleDateString();
}
