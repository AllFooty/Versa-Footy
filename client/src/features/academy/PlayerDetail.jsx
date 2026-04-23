import React, { useEffect, useState } from 'react';
import { Link, useParams } from 'wouter';
import { useTranslation } from 'react-i18next';
import {
  RadarChart, Radar, PolarGrid, PolarAngleAxis, PolarRadiusAxis,
  LineChart, Line, BarChart, Bar, XAxis, YAxis, CartesianGrid,
  Tooltip, ResponsiveContainer,
} from 'recharts';
import usePlayerDetail from './hooks/usePlayerDetail';
import { SkeletonCard, SkeletonChart } from '../../components/ui/Skeleton';

export default function PlayerDetail() {
  const { t } = useTranslation();
  const { id } = useParams();
  const {
    profile, skillProgress, dailyActivity, recentSessions,
    levelProgress,
    categoryRadar, weeklyTrends, roadmap,
    loading, error, sectionErrors,
  } = usePlayerDetail(id);
  const [activeTab, setActiveTab] = useState(0);
  const [roadmapCategoryFilter, setRoadmapCategoryFilter] = useState('all');

  const TABS = [
    t('academy.playerDetail.tabOverview'),
    t('academy.playerDetail.tabSkillRoadmap'),
    t('academy.playerDetail.tabTrainingHistory'),
    t('academy.playerDetail.tabTrends'),
  ];

  if (loading) {
    return (
      <div style={containerStyle}>
        <div style={headerStyle}>
          <Link href="/academy/players" style={backLinkStyle}>&larr; {t('academy.roster.title')}</Link>
          <div style={{ display: 'flex', alignItems: 'center', gap: 16, marginTop: 12 }}>
            <SkeletonCard style={{ width: 52, height: 52, borderRadius: '50%', padding: 0 }} />
            <div style={{ flex: 1 }}>
              <SkeletonCard style={{ padding: '8px 12px' }} />
            </div>
          </div>
          <div style={{ ...miniKpiRowStyle }}>
            {[...Array(6)].map((_, i) => (
              <SkeletonCard key={i} style={{ minWidth: 80, padding: '10px 14px' }} />
            ))}
          </div>
        </div>
        <div style={{ ...contentStyle, display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(380px, 1fr))', gap: 16 }}>
          <SkeletonChart />
          <SkeletonChart />
        </div>
      </div>
    );
  }

  if (error || !profile) {
    return (
      <div style={containerStyle}>
        <div style={{ textAlign: 'center', padding: 64 }}>
          <p style={{ color: '#ef4444', fontSize: 14 }}>{error || t('academy.playerDetail.playerNotFound')}</p>
          <Link href="/academy/players" style={{ color: '#3b82f6', fontSize: 14 }}>&larr; {t('academy.roster.title')}</Link>
        </div>
      </div>
    );
  }

  const displayName = profile.display_name || profile.profiles?.full_name || t('common.unknown');
  const skillsMastered = skillProgress.filter((s) => s.status === 'mastered').length;
  const skillsPracticed = skillProgress.filter((s) => s.times_practiced > 0).length;

  return (
    <div style={containerStyle}>
      {/* Header */}
      <div style={headerStyle}>
        <Link href="/academy/players" style={backLinkStyle}>&larr; {t('academy.roster.title')}</Link>
        <div style={playerHeaderStyle}>
          <div style={largeAvatarStyle}>{displayName[0].toUpperCase()}</div>
          <div>
            <h1 style={titleStyle}>{displayName}</h1>
            <p style={subtitleStyle}>
              {profile.age_group || t('common.noAgeGroup')} &middot; {t('common.level')} {profile.current_level} &middot; {profile.total_xp?.toLocaleString()} {t('common.xp')}
            </p>
          </div>
        </div>

        {/* Mini KPIs */}
        <div style={miniKpiRowStyle}>
          <MiniKPI label={t('academy.playerDetail.kpiLevel')} value={profile.current_level} />
          <MiniKPI label={t('academy.playerDetail.kpiTotalXP')} value={profile.total_xp?.toLocaleString()} />
          <MiniKPI label={t('academy.playerDetail.kpiStreak')} value={profile.current_streak > 0 ? `${profile.current_streak}d` : '—'} />
          <MiniKPI label={t('academy.playerDetail.kpiBestStreak')} value={profile.longest_streak > 0 ? `${profile.longest_streak}d` : '—'} />
          <MiniKPI label={t('academy.playerDetail.kpiMastered')} value={skillsMastered} />
          <MiniKPI label={t('academy.playerDetail.kpiPracticed')} value={skillsPracticed} />
        </div>

        {/* Level progress bar (XP until next level) */}
        <LevelProgressBar levelProgress={levelProgress} />
      </div>

      {/* Tabs */}
      <div style={tabBarStyle} role="tablist" aria-label={t('academy.playerDetail.tabsLabel', { defaultValue: 'Player sections' })}>
        {TABS.map((tab, i) => {
          const selected = activeTab === i;
          return (
            <button
              key={tab}
              id={`player-tab-${i}`}
              role="tab"
              aria-selected={selected}
              aria-controls={`player-tabpanel-${i}`}
              tabIndex={selected ? 0 : -1}
              onClick={() => setActiveTab(i)}
              style={selected ? activeTabBtnStyle : tabBtnStyle}
            >
              {tab}
            </button>
          );
        })}
      </div>

      {/* Tab Content */}
      <div
        id={`player-tabpanel-${activeTab}`}
        role="tabpanel"
        aria-labelledby={`player-tab-${activeTab}`}
        style={contentStyle}
      >
        {activeTab === 0 && (
          <OverviewTab
            categoryRadar={categoryRadar}
            dailyActivity={dailyActivity}
            skillsError={sectionErrors?.skillProgress}
            activityError={sectionErrors?.dailyActivity}
          />
        )}
        {activeTab === 1 && (
          <SkillRoadmapTab
            roadmap={roadmap}
            categoryFilter={roadmapCategoryFilter}
            setCategoryFilter={setRoadmapCategoryFilter}
            errorMessage={sectionErrors?.allSkills || sectionErrors?.skillProgress}
          />
        )}
        {activeTab === 2 && (
          <HistoryTab sessions={recentSessions} errorMessage={sectionErrors?.recentSessions} />
        )}
        {activeTab === 3 && (
          <TrendsTab weeklyTrends={weeklyTrends} errorMessage={sectionErrors?.dailyActivity} />
        )}
      </div>
    </div>
  );
}

// ─── Level progress bar ───────────────────────────────────────────────────────

function LevelProgressBar({ levelProgress }) {
  const { t } = useTranslation();
  if (!levelProgress) return null;

  const inLevel = Math.max(0, levelProgress.xp_in_current_level || 0);
  const required = Math.max(1, levelProgress.xp_required_for_next_level || 1);
  const remaining = Math.max(0, required - inLevel);
  const pct = Math.min(100, Math.round((inLevel / required) * 100));
  const nextLevel = (levelProgress.current_level || 0) + 1;

  return (
    <div
      style={levelProgressWrapStyle}
      aria-label={t('academy.playerDetail.levelProgressAria', {
        defaultValue: '{{remaining}} XP until Level {{nextLevel}}',
        remaining: remaining.toLocaleString(),
        nextLevel,
      })}
    >
      <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 6, fontSize: 12, color: '#9ca3af' }}>
        <span>
          {t('academy.playerDetail.levelProgressLabel', {
            defaultValue: '{{inLevel}} / {{required}} XP to Level {{nextLevel}}',
            inLevel: inLevel.toLocaleString(),
            required: required.toLocaleString(),
            nextLevel,
          })}
        </span>
        <span style={{ color: '#e4e4e7', fontWeight: 600 }}>{pct}%</span>
      </div>
      <div style={{ height: 6, borderRadius: 3, background: 'rgba(255,255,255,0.08)', overflow: 'hidden' }}>
        <div
          style={{
            width: `${pct}%`,
            height: '100%',
            background: 'linear-gradient(90deg, #3b82f6, #22d3ee)',
            transition: 'width 0.5s ease',
          }}
        />
      </div>
    </div>
  );
}

// ─── Tab: Overview ─────────────────────────────────────────────────────────────

function OverviewTab({ categoryRadar, dailyActivity, skillsError, activityError }) {
  const { t } = useTranslation();

  const hasRadarData = categoryRadar.length > 0 && categoryRadar.some((c) => (c.masteryPercent || 0) > 0);
  const hasActivityData = dailyActivity.length > 0 && dailyActivity.some((d) => (d.xp_earned || 0) > 0);

  return (
    <div style={tabGridStyle}>
      {/* Skill Category Radar */}
      <div style={cardStyle}>
        <h3 style={cardTitleStyle}>{t('academy.playerDetail.chartSkillMastery')}</h3>
        {skillsError ? (
          <p style={errorStyle}>{t('academy.playerDetail.sectionLoadError', { defaultValue: 'Could not load this section. Try refreshing.' })}</p>
        ) : hasRadarData ? (
          <div style={{ height: 300 }}>
            <ResponsiveContainer width="100%" height="100%">
              <RadarChart data={categoryRadar}>
                <PolarGrid stroke="rgba(255,255,255,0.08)" />
                <PolarAngleAxis dataKey="category" tick={{ fill: '#9ca3af', fontSize: 12 }} />
                <PolarRadiusAxis tick={{ fill: '#71717a', fontSize: 11 }} domain={[0, 100]} />
                <Radar dataKey="masteryPercent" name="Mastery %" stroke="#8b5cf6" fill="#8b5cf6" fillOpacity={0.25} />
              </RadarChart>
            </ResponsiveContainer>
          </div>
        ) : (
          <p style={emptyStyle}>
            {t('academy.playerDetail.noSkillMasteryYet', {
              defaultValue: 'Start practicing to fill your mastery profile.',
            })}
          </p>
        )}
      </div>

      {/* Activity Heatmap (simplified as a bar chart of daily XP) */}
      <div style={cardStyle}>
        <h3 style={cardTitleStyle}>{t('academy.playerDetail.chartRecentActivity')}</h3>
        {activityError ? (
          <p style={errorStyle}>{t('academy.playerDetail.sectionLoadError', { defaultValue: 'Could not load this section. Try refreshing.' })}</p>
        ) : hasActivityData ? (
          <div style={{ height: 300 }}>
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={dailyActivity.slice(-90)}>
                <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.06)" />
                <XAxis
                  dataKey="activity_date"
                  tick={{ fill: '#71717a', fontSize: 11 }}
                  tickFormatter={(d) => new Date(d).toLocaleDateString('en', { month: 'short', day: 'numeric' })}
                  interval={14}
                  axisLine={{ stroke: 'rgba(255,255,255,0.08)' }}
                  tickLine={false}
                />
                <YAxis tick={{ fill: '#71717a', fontSize: 12 }} axisLine={false} tickLine={false} />
                <Tooltip contentStyle={tooltipStyle} labelStyle={{ color: '#e4e4e7' }} />
                <Bar dataKey="xp_earned" name={t('common.xp')} fill="#22c55e" radius={[2, 2, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        ) : (
          <p style={emptyStyle}>{t('academy.playerDetail.noActivityData')}</p>
        )}
      </div>
    </div>
  );
}

// ─── Tab: Skill Roadmap ───────────────────────────────────────────────────────

function SkillRoadmapTab({ roadmap, categoryFilter, setCategoryFilter, errorMessage }) {
  const { t } = useTranslation();

  if (errorMessage) {
    return <p style={errorStyle}>{t('academy.playerDetail.sectionLoadError', { defaultValue: 'Could not load this section. Try refreshing.' })}</p>;
  }

  if (roadmap?.missingAgeGroup) {
    return (
      <p style={emptyStyle}>
        {t('academy.playerDetail.roadmapNoAgeGroup', {
          defaultValue: "Set this player's age group to see their skill roadmap.",
        })}
      </p>
    );
  }

  if (!roadmap || roadmap.totalSkillsToMaster === 0) {
    return <p style={emptyStyle}>{t('academy.playerDetail.noSkillDataAvailable')}</p>;
  }

  // Unique categories for filter chips
  const categories = roadmap.categorySummary || [];

  return (
    <div>
      {/* Roadmap Header */}
      <div style={roadmapHeaderStyle}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', flexWrap: 'wrap', gap: 12 }}>
          <div>
            <h3 style={{ fontSize: 16, fontWeight: 700, margin: '0 0 4px', color: '#e4e4e7' }}>
              {t('academy.playerDetail.roadmapTitle', { ageGroup: roadmap.playerAgeGroup })}
            </h3>
            <p style={{ fontSize: 13, color: '#9ca3af', margin: 0 }}>
              {t('academy.playerDetail.roadmapProgress', { mastered: roadmap.masteredCount, total: roadmap.totalSkillsToMaster })}
            </p>
          </div>
          <div style={roadmapPercentStyle}>
            <span style={{ fontSize: 28, fontWeight: 800, color: getRoadmapColor(roadmap.progressPercent) }}>
              {roadmap.progressPercent}%
            </span>
          </div>
        </div>
        <div style={{ ...progressBarBgStyle, height: 8, borderRadius: 4, marginTop: 12 }}>
          <div style={{
            height: '100%', borderRadius: 4, transition: 'width 0.5s ease',
            width: `${roadmap.progressPercent}%`,
            background: `linear-gradient(90deg, ${getRoadmapColor(roadmap.progressPercent)}, ${getRoadmapColor(roadmap.progressPercent)}cc)`,
          }} />
        </div>

        {/* Category mini-summary */}
        <div style={categorySummaryRowStyle}>
          {categories.map((cat) => (
            <div key={cat.name} style={categorySummaryChipStyle}>
              <span style={{ fontSize: 12 }}>{cat.icon}</span>
              <span style={{ fontSize: 11, color: '#9ca3af' }}>{cat.name}</span>
              <span style={{ fontSize: 11, fontWeight: 600, color: cat.mastered === cat.total ? '#22c55e' : '#e4e4e7' }}>
                {cat.mastered}/{cat.total}
              </span>
            </div>
          ))}
        </div>
      </div>

      {/* Category filter chips */}
      <div style={{ display: 'flex', gap: 6, marginBottom: 16, flexWrap: 'wrap' }}>
        <button
          onClick={() => setCategoryFilter('all')}
          style={categoryFilter === 'all' ? activeChipStyle : chipStyle}
        >
          {t('academy.playerDetail.roadmapAll')}
        </button>
        {categories.map((cat) => (
          <button
            key={cat.name}
            onClick={() => setCategoryFilter(cat.name)}
            style={categoryFilter === cat.name ? { ...activeChipStyle, borderColor: cat.color + '55', color: cat.color } : chipStyle}
          >
            {cat.icon} {cat.name}
          </button>
        ))}
      </div>

      {/* Skills grouped by age */}
      {roadmap.skillsByAge.map((group) => {
        const filteredSkills = categoryFilter === 'all'
          ? group.skills
          : group.skills.filter((s) => s.category === categoryFilter);
        if (filteredSkills.length === 0) return null;

        const mastered = filteredSkills.filter((s) => s.isMastered).length;
        const total = filteredSkills.length;
        const allMastered = mastered === total;

        return (
          <div key={group.ageGroup} style={{ marginBottom: 24 }}>
            {/* Age group header */}
            <div style={ageGroupHeaderStyle}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                <span style={{
                  ...ageGroupBadgeStyle,
                  background: group.isRelevant
                    ? (allMastered ? 'rgba(34,197,94,0.15)' : 'rgba(59,130,246,0.15)')
                    : 'rgba(255,255,255,0.04)',
                  color: group.isRelevant
                    ? (allMastered ? '#22c55e' : '#60a5fa')
                    : '#71717a',
                }}>
                  {group.ageGroup}
                </span>
                <span style={{ fontSize: 13, color: '#9ca3af' }}>
                  {t('academy.playerDetail.roadmapMasteredOfTotal', { mastered, total })}
                </span>
                {allMastered && <span style={{ fontSize: 14 }}>&#10003;</span>}
              </div>
              {group.isRelevant && !allMastered && (
                <span style={{ fontSize: 11, color: '#eab308', fontWeight: 500 }}>
                  {t('academy.playerDetail.roadmapShouldMaster')}
                </span>
              )}
            </div>

            {/* Skills grid */}
            <div style={skillGridStyle}>
              {filteredSkills.map((skill) => (
                <SkillRoadmapCard key={skill.id} skill={skill} />
              ))}
            </div>
          </div>
        );
      })}
    </div>
  );
}

function SkillRoadmapCard({ skill }) {
  const { t } = useTranslation();
  const progressPercent = Math.round(skill.masteryProgress * 100);

  return (
    <div style={{
      ...skillCardStyle,
      borderLeft: `3px solid ${skill.isMastered ? '#22c55e' : skill.isCloseToMastering ? '#eab308' : skill.timesPracticed > 0 ? skill.categoryColor : 'rgba(255,255,255,0.06)'}`,
    }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 6 }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 6, flex: 1, minWidth: 0 }}>
          <span style={{ fontSize: 12, flexShrink: 0 }}>{skill.categoryIcon}</span>
          <span style={{ fontSize: 13, fontWeight: 500, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
            {skill.name}
          </span>
        </div>
        {skill.isMastered && <span style={masteredBadge}>{t('academy.playerDetail.skillMastered')}</span>}
        {skill.isCloseToMastering && <span style={almostBadge}>{t('academy.playerDetail.skillAlmost')}</span>}
      </div>

      <div style={{ display: 'flex', alignItems: 'center', gap: 6, marginBottom: 4 }}>
        <div style={{ ...progressBarBgStyle, flex: 1 }}>
          <div style={{
            ...progressBarFillStyle,
            width: `${progressPercent}%`,
            background: skill.isMastered ? '#22c55e' : skill.isCloseToMastering ? '#eab308' : skill.categoryColor,
          }} />
        </div>
        {!skill.isMastered && (
          <span style={{ fontSize: 10, color: '#71717a', flexShrink: 0, minWidth: 28, textAlign: 'right' }}>
            {progressPercent}%
          </span>
        )}
      </div>

      {skill.needsRatingBoost && (
        <p style={{ fontSize: 10, color: '#eab308', margin: '0 0 4px', lineHeight: 1.3 }}>
          {t('academy.playerDetail.skillNeedsHigherRatings', { defaultValue: 'Needs higher ratings to master' })}
        </p>
      )}

      <div style={{ display: 'flex', justifyContent: 'space-between', marginTop: 2 }}>
        <span style={{ fontSize: 11, color: '#71717a' }}>
          {skill.timesPracticed > 0 ? t('academy.playerDetail.skillCompletions', { count: skill.timesPracticed }) : t('academy.playerDetail.skillNotStarted')}
        </span>
        {skill.timesPracticed > 0 && (
          <span style={{ fontSize: 11, color: skill.avgRating >= 4.5 ? '#22c55e' : '#71717a' }}>
            {skill.avgRating.toFixed(1)}&#9733;
          </span>
        )}
      </div>
    </div>
  );
}

function getRoadmapColor(percent) {
  if (percent >= 80) return '#22c55e';
  if (percent >= 50) return '#3b82f6';
  if (percent >= 25) return '#eab308';
  return '#ef4444';
}

// ─── Tab: Training History ─────────────────────────────────────────────────────

const SESSION_STATUS_STYLES = {
  completed: { bg: 'rgba(34,197,94,0.15)', fg: '#22c55e' },
  abandoned: { bg: 'rgba(239,68,68,0.15)', fg: '#ef4444' },
  in_progress: { bg: 'rgba(234,179,8,0.15)', fg: '#eab308' },
};
const UNKNOWN_STATUS_STYLE = { bg: 'rgba(255,255,255,0.06)', fg: '#9ca3af' };

function formatSessionDate(startedAt) {
  if (!startedAt) return '\u2014';
  const d = new Date(startedAt);
  return Number.isNaN(d.getTime()) ? '\u2014' : d.toLocaleDateString();
}

function StatusBadge({ status }) {
  const palette = SESSION_STATUS_STYLES[status] || UNKNOWN_STATUS_STYLE;
  return (
    <span style={{
      padding: '2px 8px', borderRadius: 6, fontSize: 11, fontWeight: 600,
      textTransform: 'capitalize',
      background: palette.bg,
      color: palette.fg,
    }}>
      {status || 'unknown'}
    </span>
  );
}

function HistoryTab({ sessions, errorMessage }) {
  const { t } = useTranslation();
  const [isMobile, setIsMobile] = useState(false);

  useEffect(() => {
    const checkMobile = () => setIsMobile(window.innerWidth <= 768);
    checkMobile();
    window.addEventListener('resize', checkMobile);
    return () => window.removeEventListener('resize', checkMobile);
  }, []);

  if (errorMessage) {
    return <p style={errorStyle}>{t('academy.playerDetail.sectionLoadError', { defaultValue: 'Could not load this section. Try refreshing.' })}</p>;
  }

  if (sessions.length === 0) {
    return <p style={emptyStyle}>{t('academy.playerDetail.noRecentTraining')}</p>;
  }

  if (isMobile) {
    return (
      <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
        {sessions.map((s) => (
          <div key={s.id} style={sessionCardStyle}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 6 }}>
              <span style={{ fontSize: 14, fontWeight: 600, color: '#e4e4e7' }}>
                {formatSessionDate(s.started_at)}
              </span>
              <StatusBadge status={s.status} />
            </div>
            <div style={{ display: 'flex', gap: 10, flexWrap: 'wrap', fontSize: 12, color: '#9ca3af' }}>
              <span style={{ textTransform: 'capitalize' }}>{s.session_type}</span>
              <span>&middot;</span>
              <span>{t('academy.playerDetail.historyExercises')}: <strong style={{ color: '#e4e4e7' }}>{s.exercises_completed}</strong></span>
              <span>&middot;</span>
              <span>{t('common.xp')}: <strong style={{ color: '#e4e4e7' }}>{s.total_xp_earned}</strong></span>
              {s.average_rating && (
                <>
                  <span>&middot;</span>
                  <span>{Number(s.average_rating).toFixed(1)}&#9733;</span>
                </>
              )}
            </div>
          </div>
        ))}
      </div>
    );
  }

  return (
    <div style={cardStyle}>
      <div style={{ overflowX: 'auto' }}>
        <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 13 }}>
          <thead>
            <tr>
              <th style={thStyle}>{t('academy.playerDetail.historyDate')}</th>
              <th style={thStyle}>{t('academy.playerDetail.historyType')}</th>
              <th style={thStyle}>{t('academy.playerDetail.historyExercises')}</th>
              <th style={thStyle}>{t('academy.playerDetail.historyXPEarned')}</th>
              <th style={thStyle}>{t('academy.playerDetail.historyAvgRating')}</th>
              <th style={thStyle}>{t('academy.playerDetail.historyStatus')}</th>
            </tr>
          </thead>
          <tbody>
            {sessions.map((s) => (
              <tr key={s.id} style={{ borderBottom: '1px solid rgba(255,255,255,0.04)' }}>
                <td style={tdStyle}>{formatSessionDate(s.started_at)}</td>
                <td style={tdStyle}><span style={{ textTransform: 'capitalize' }}>{s.session_type}</span></td>
                <td style={tdStyle}>{s.exercises_completed}</td>
                <td style={tdStyle}>{s.total_xp_earned}</td>
                <td style={tdStyle}>{s.average_rating ? `${Number(s.average_rating).toFixed(1)}\u2605` : '\u2014'}</td>
                <td style={tdStyle}><StatusBadge status={s.status} /></td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}

// ─── Tab: Trends ───────────────────────────────────────────────────────────────

function TrendsTab({ weeklyTrends, errorMessage }) {
  const { t } = useTranslation();

  if (errorMessage) {
    return <p style={errorStyle}>{t('academy.playerDetail.sectionLoadError', { defaultValue: 'Could not load this section. Try refreshing.' })}</p>;
  }

  const hasTrendData = weeklyTrends.some((w) => (w.xp || 0) > 0 || (w.minutes || 0) > 0);
  if (!hasTrendData) {
    return (
      <p style={emptyStyle}>
        {t('academy.playerDetail.noTrendActivityYet', {
          defaultValue: 'Come back after a week of practice to see trends.',
        })}
      </p>
    );
  }

  return (
    <div style={tabGridStyle}>
      <div style={cardStyle}>
        <h3 style={cardTitleStyle}>{t('academy.playerDetail.chartXPPerWeek')}</h3>
        <div style={{ height: 240 }}>
          <ResponsiveContainer width="100%" height="100%">
            <LineChart data={weeklyTrends}>
              <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.06)" />
              <XAxis dataKey="week" tick={{ fill: '#71717a', fontSize: 12 }} axisLine={{ stroke: 'rgba(255,255,255,0.08)' }} tickLine={false} />
              <YAxis tick={{ fill: '#71717a', fontSize: 12 }} axisLine={false} tickLine={false} />
              <Tooltip contentStyle={tooltipStyle} labelStyle={{ color: '#e4e4e7' }} />
              <Line type="monotone" dataKey="xp" name={t('common.xp')} stroke="#3b82f6" strokeWidth={2} dot={{ r: 3, fill: '#3b82f6' }} />
            </LineChart>
          </ResponsiveContainer>
        </div>
      </div>

      <div style={cardStyle}>
        <h3 style={cardTitleStyle}>{t('academy.playerDetail.chartPracticeMinutes')}</h3>
        <div style={{ height: 240 }}>
          <ResponsiveContainer width="100%" height="100%">
            <BarChart data={weeklyTrends}>
              <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.06)" />
              <XAxis dataKey="week" tick={{ fill: '#71717a', fontSize: 12 }} axisLine={{ stroke: 'rgba(255,255,255,0.08)' }} tickLine={false} />
              <YAxis tick={{ fill: '#71717a', fontSize: 12 }} axisLine={false} tickLine={false} />
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

const levelProgressWrapStyle = {
  marginTop: 16,
  padding: '12px 14px',
  background: 'rgba(255, 255, 255, 0.04)',
  borderRadius: 10,
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

const errorStyle = {
  color: '#fca5a5', fontSize: 14, textAlign: 'center', padding: 32,
  background: 'rgba(239, 68, 68, 0.06)',
  border: '1px solid rgba(239, 68, 68, 0.18)',
  borderRadius: 12,
};

const sessionCardStyle = {
  padding: '14px 14px',
  background: 'rgba(15, 23, 42, 0.6)',
  border: '1px solid rgba(255, 255, 255, 0.08)',
  borderRadius: 12,
};

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

// ─── Roadmap-specific styles ────────────────────────────────────────────────

const roadmapHeaderStyle = {
  background: 'rgba(15, 23, 42, 0.6)',
  border: '1px solid rgba(255, 255, 255, 0.08)',
  borderRadius: 14, padding: '20px 20px 16px',
  marginBottom: 16,
};

const roadmapPercentStyle = {
  textAlign: 'right',
};

const categorySummaryRowStyle = {
  display: 'flex', flexWrap: 'wrap', gap: 6, marginTop: 14,
};

const categorySummaryChipStyle = {
  display: 'flex', alignItems: 'center', gap: 4,
  padding: '4px 8px', borderRadius: 6,
  background: 'rgba(255, 255, 255, 0.04)',
  border: '1px solid rgba(255, 255, 255, 0.06)',
};

const ageGroupHeaderStyle = {
  display: 'flex', justifyContent: 'space-between', alignItems: 'center',
  marginBottom: 10, padding: '0 2px',
};

const ageGroupBadgeStyle = {
  padding: '3px 10px', borderRadius: 6,
  fontSize: 12, fontWeight: 700,
};

const almostBadge = {
  padding: '2px 6px', borderRadius: 4, fontSize: 10, fontWeight: 600,
  background: 'rgba(234, 179, 8, 0.15)', color: '#eab308',
};
