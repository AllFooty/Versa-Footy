import React, { useMemo, useState } from 'react';
import { Link } from 'wouter';
import { useTranslation } from 'react-i18next';
import { useVideosAudit } from './useVideosAudit';
import ConfirmModal from '../../components/modals/ConfirmModal';
import { useIsMobile } from '../../hooks/useMediaQuery';

// Multi-version is *informational*: exercises are allowed to have several
// candidate videos per folder and one is picked as active in the library
// modal. This tab just lists where it's happening.
const TAB_ORDER = [
  { key: 'missing',    tone: 'danger' },
  { key: 'broken',     tone: 'danger' },
  { key: 'mismatched', tone: 'danger' },
  { key: 'external',   tone: 'info' },
  { key: 'duplicates', tone: 'info' },
  { key: 'orphans',    tone: 'warn' },
];

const formatBytes = (n) => {
  if (!n) return '0 B';
  if (n < 1024) return `${n} B`;
  if (n < 1024 * 1024) return `${(n / 1024).toFixed(1)} KB`;
  if (n < 1024 * 1024 * 1024) return `${(n / (1024 * 1024)).toFixed(1)} MB`;
  return `${(n / (1024 * 1024 * 1024)).toFixed(2)} GB`;
};

export default function VideosAuditPage() {
  const { t } = useTranslation();
  const { audit, loading, error, refresh, deleteOrphans } = useVideosAudit();
  const [active, setActive] = useState('missing');
  const isMobile = useIsMobile();
  const [busy, setBusy] = useState(false);
  const [message, setMessage] = useState(null);
  const [showConfirmDelete, setShowConfirmDelete] = useState(false);

  const counts = useMemo(
    () => Object.fromEntries(TAB_ORDER.map(({ key }) => [key, audit[key]?.length || 0])),
    [audit]
  );

  const requestDeleteOrphans = () => {
    if (!audit.orphans.length) return;
    setShowConfirmDelete(true);
  };

  const handleConfirmDeleteOrphans = async () => {
    setBusy(true);
    setMessage(null);
    const { removed, errors } = await deleteOrphans(audit.orphans.map((o) => o.path));
    setBusy(false);
    setMessage(
      errors.length
        ? t('videosAudit.orphans.deleteErrors', { errors: errors.join(', ') })
        : t('videosAudit.orphans.deleteSuccess', { count: removed })
    );
  };

  return (
    <div style={pageStyle}>
      <div style={headerRowStyle}>
        <div>
          <div style={crumbStyle}>
            <Link href="/library"><a style={crumbLinkStyle}>{t('videosAudit.backToLibrary')}</a></Link>
          </div>
          <h1 style={titleStyle}>{t('videosAudit.title')}</h1>
          {audit.generated_at && (
            <p style={subtitleStyle}>
              {t('videosAudit.generatedAt', { when: new Date(audit.generated_at).toLocaleString() })}
            </p>
          )}
        </div>
        <button onClick={refresh} disabled={loading} style={refreshBtnStyle}>
          {loading ? t('videosAudit.loading') : t('videosAudit.refresh')}
        </button>
      </div>

      {error && <div style={errorBoxStyle}>{error}</div>}
      {message && <div role="status" aria-live="polite" style={messageBoxStyle}>{message}</div>}

      <div style={tabsWrapStyle}>
        {TAB_ORDER.map(({ key, tone }) => (
          <button
            key={key}
            onClick={() => setActive(key)}
            style={tabStyle(active === key, tone, counts[key], isMobile)}
          >
            <span>{t(`videosAudit.tabs.${key}`)}</span>
            <span style={badgeStyle(tone, counts[key])}>{counts[key]}</span>
          </button>
        ))}
      </div>

      <div style={panelStyle}>
        {active === 'missing'    && <MissingList items={audit.missing} t={t} />}
        {active === 'broken'     && <BrokenList items={audit.broken} t={t} />}
        {active === 'mismatched' && <MismatchedList items={audit.mismatched} t={t} />}
        {active === 'external'   && <ExternalList items={audit.external} t={t} />}
        {active === 'duplicates' && <DuplicatesList items={audit.duplicates} t={t} />}
        {active === 'orphans'    && (
          <OrphansList items={audit.orphans} onDeleteAll={requestDeleteOrphans} busy={busy} t={t} />
        )}
      </div>

      <ConfirmModal
        isOpen={showConfirmDelete}
        title={t('videosAudit.orphans.deleteConfirmTitle')}
        message={t('videosAudit.orphans.deleteConfirmBody', { count: audit.orphans?.length || 0 })}
        confirmLabel={t('common.delete', { defaultValue: 'Delete' })}
        confirmDanger
        onConfirm={handleConfirmDeleteOrphans}
        onClose={() => setShowConfirmDelete(false)}
      />
    </div>
  );
}

/* -------- lists ---------- */

const MissingList = ({ items, t }) =>
  !items.length ? <Empty text={t('videosAudit.empty.missing')} /> : (
    <ul style={ulStyle}>
      {items.map((e) => (
        <li key={e.id} style={rowStyle}>
          <div style={rowMainStyle}>
            <span style={idChipStyle}>#{e.id}</span>
            <span>{e.name}</span>
          </div>
          <span style={mutedStyle}>{t('videosAudit.row.skill', { id: e.skill_id })}</span>
        </li>
      ))}
    </ul>
  );

const BrokenList = ({ items, t }) =>
  !items.length ? <Empty text={t('videosAudit.empty.broken')} /> : (
    <ul style={ulStyle}>
      {items.map((e) => (
        <li key={e.id} style={rowStyle}>
          <div style={rowMainStyle}>
            <span style={idChipStyle}>#{e.id}</span>
            <span>{e.name}</span>
          </div>
          <code style={codeStyle}>{e.storage_path}</code>
        </li>
      ))}
    </ul>
  );

const MismatchedList = ({ items, t }) =>
  !items.length ? <Empty text={t('videosAudit.empty.mismatched')} /> : (
    <ul style={ulStyle}>
      {items.map((e) => (
        <li key={e.id} style={rowStyle}>
          <div style={rowMainStyle}>
            <span style={idChipStyle}>#{e.id}</span>
            <span>{e.name}</span>
          </div>
          <span style={mutedStyle}>
            {t('videosAudit.row.urlFolder', { id: e.url_exercise_id })}
          </span>
        </li>
      ))}
    </ul>
  );

const ExternalList = ({ items, t }) =>
  !items.length ? <Empty text={t('videosAudit.empty.external')} /> : (
    <ul style={ulStyle}>
      {items.map((e) => (
        <li key={e.id} style={rowStyle}>
          <div style={rowMainStyle}>
            <span style={idChipStyle}>#{e.id}</span>
            <span>{e.name}</span>
          </div>
          <a href={e.video_url} target="_blank" rel="noreferrer" style={linkStyle}>
            {t('videosAudit.row.open')}
          </a>
        </li>
      ))}
    </ul>
  );

const DuplicatesList = ({ items, t }) =>
  !items.length ? <Empty text={t('videosAudit.empty.duplicates')} /> : (
    <>
      <div style={{ padding: '8px 12px 12px', fontSize: 12, color: 'var(--text-muted)' }}>
        {t('videosAudit.duplicates.explanation')}
      </div>
      <ul style={ulStyle}>
        {items.map((d) => (
          <li key={d.exercise_id} style={{ ...rowStyle, flexDirection: 'column', alignItems: 'flex-start' }}>
            <div style={rowMainStyle}>
              <span style={idChipStyle}>#{d.exercise_id}</span>
              <span>{t('videosAudit.duplicates.candidateCount', { count: d.objects })}</span>
            </div>
            <details style={{ marginTop: 8, width: '100%' }}>
              <summary style={detailsSummaryStyle}>{t('videosAudit.duplicates.showPaths')}</summary>
              <ul style={{ margin: '6px 0 0 16px', padding: 0 }}>
                {d.paths.map((p) => <li key={p}><code style={codeStyle}>{p}</code></li>)}
              </ul>
            </details>
          </li>
        ))}
      </ul>
    </>
  );

const OrphansList = ({ items, onDeleteAll, busy, t }) => {
  const total = items.reduce((sum, o) => sum + (o.size_bytes || 0), 0);
  return !items.length ? <Empty text={t('videosAudit.empty.orphans')} /> : (
    <>
      <div style={orphanHeaderStyle}>
        <div>
          <strong>{items.length}</strong> · {formatBytes(total)}
        </div>
        <button onClick={onDeleteAll} disabled={busy} style={dangerBtnStyle}>
          {busy ? t('videosAudit.orphans.deleting') : t('videosAudit.orphans.deleteAll')}
        </button>
      </div>
      <ul style={ulStyle}>
        {items.map((o) => (
          <li key={o.path} style={rowStyle}>
            <code style={codeStyle}>{o.path}</code>
            <span style={mutedStyle}>{formatBytes(o.size_bytes)}</span>
          </li>
        ))}
      </ul>
    </>
  );
};

const Empty = ({ text }) => (
  <div style={{ padding: 32, color: '#86efac', textAlign: 'center' }}>✓ {text}</div>
);

/* -------- styles ---------- */

const pageStyle = {
  minHeight: '100vh',
  background: 'var(--bg-app-gradient)',
  color: 'var(--text-primary)',
  padding: 'max(16px, env(safe-area-inset-top)) 16px 24px',
  fontFamily: 'var(--font-sans)',
};

const headerRowStyle = {
  display: 'flex',
  justifyContent: 'space-between',
  alignItems: 'flex-end',
  gap: 12,
  marginBottom: 16,
  flexWrap: 'wrap',
};

const crumbStyle = { fontSize: 12, color: 'var(--text-muted)', marginBottom: 6 };
const crumbLinkStyle = { color: 'var(--text-muted)', textDecoration: 'none' };
const titleStyle = { margin: 0, fontSize: 24, fontWeight: 700 };
const subtitleStyle = { margin: '4px 0 0', fontSize: 12, color: 'var(--text-muted)' };

const refreshBtnStyle = {
  padding: '10px 16px',
  minHeight: 44,
  background: 'rgba(96,165,250,0.12)',
  border: '1px solid rgba(96,165,250,0.3)',
  borderRadius: 'var(--radius-md)',
  color: '#bfdbfe',
  cursor: 'pointer',
  fontWeight: 600,
};

const errorBoxStyle = {
  padding: 12, borderRadius: 'var(--radius-md)', marginBottom: 12,
  background: 'rgba(239,68,68,0.1)', border: '1px solid rgba(239,68,68,0.3)', color: '#fecaca',
};
const messageBoxStyle = {
  padding: 12, borderRadius: 'var(--radius-md)', marginBottom: 12,
  background: 'rgba(74,222,128,0.1)', border: '1px solid rgba(74,222,128,0.3)', color: '#bbf7d0',
};

const tabsWrapStyle = {
  display: 'flex', gap: 8, flexWrap: 'wrap', marginBottom: 16,
};

const toneColor = (tone, hasCount) => {
  if (!hasCount) return { border: 'rgba(74,222,128,0.3)', bg: 'rgba(74,222,128,0.08)', text: '#bbf7d0' };
  if (tone === 'danger') return { border: 'rgba(239,68,68,0.4)', bg: 'rgba(239,68,68,0.1)', text: '#fecaca' };
  if (tone === 'warn')   return { border: 'rgba(250,204,21,0.4)', bg: 'rgba(250,204,21,0.1)', text: '#fde68a' };
  return { border: 'rgba(96,165,250,0.4)', bg: 'rgba(96,165,250,0.1)', text: '#bfdbfe' };
};

const tabStyle = (isActive, tone, count, isMobile) => {
  const c = toneColor(tone, count > 0);
  return {
    display: 'inline-flex', alignItems: 'center', gap: 8,
    padding: isMobile ? '10px 12px' : '8px 14px',
    minHeight: isMobile ? 44 : 'auto',
    borderRadius: 'var(--radius-full)',
    background: isActive ? c.bg : 'transparent',
    border: `1px solid ${c.border}`,
    color: c.text,
    fontSize: 13,
    fontWeight: 600,
    cursor: 'pointer',
  };
};

const badgeStyle = (tone, count) => {
  const c = toneColor(tone, count > 0);
  return {
    padding: '2px 8px', borderRadius: 'var(--radius-full)',
    background: c.bg, color: c.text,
    fontSize: 11, fontWeight: 700,
    minWidth: 22, textAlign: 'center',
  };
};

const panelStyle = {
  background: 'rgba(255,255,255,0.03)',
  border: '1px solid rgba(255,255,255,0.08)',
  borderRadius: 'var(--radius-xl)',
  padding: 8,
};

const ulStyle = { listStyle: 'none', margin: 0, padding: 0 };
const rowStyle = {
  display: 'flex', justifyContent: 'space-between', alignItems: 'center',
  gap: 12, padding: '10px 12px',
  borderBottom: '1px solid rgba(255,255,255,0.05)',
  // Prevent long monospace paths from pushing the action column off-screen
  // on ≤375 px phones (user's primary mobile concern per CLAUDE.md).
  flexWrap: 'wrap',
  minWidth: 0,
};
const rowMainStyle = { display: 'flex', alignItems: 'center', gap: 10, minWidth: 0, flex: '1 1 auto', overflow: 'hidden' };
const idChipStyle = {
  background: 'rgba(96,165,250,0.15)', color: '#bfdbfe',
  padding: '2px 8px', borderRadius: 'var(--radius-sm)', fontSize: 12, fontWeight: 700,
  flexShrink: 0,
};
const mutedStyle = { color: 'var(--text-muted)', fontSize: 12, minWidth: 0, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' };
const codeStyle = {
  fontFamily: 'var(--font-mono)',
  fontSize: 11, color: '#d1d5db',
  minWidth: 0, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap',
  flex: '1 1 auto',
};
const linkStyle = { color: '#60a5fa', textDecoration: 'none', fontSize: 12 };
const detailsSummaryStyle = { cursor: 'pointer', color: 'var(--text-muted)', fontSize: 12 };

const orphanHeaderStyle = {
  display: 'flex', justifyContent: 'space-between', alignItems: 'center',
  padding: '10px 12px', marginBottom: 4,
  borderBottom: '1px solid rgba(255,255,255,0.08)',
  gap: 12, flexWrap: 'wrap',
};

const dangerBtnStyle = {
  padding: '10px 16px', minHeight: 44,
  background: 'rgba(239,68,68,0.15)',
  border: '1px solid rgba(239,68,68,0.4)',
  borderRadius: 'var(--radius-md)', color: '#fecaca',
  cursor: 'pointer', fontWeight: 600,
};
