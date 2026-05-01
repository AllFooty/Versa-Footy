import React, { useEffect, useMemo, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { toast } from 'sonner';
import { useVideosAudit } from './useVideosAudit';
import { useConfirm } from '../../components/ConfirmProvider';
import { PageContainer, PageHeader, BackLink } from '../../components/Page';

const TAB_ORDER = [
  { key: 'missing',    tone: 'danger' },
  { key: 'broken',     tone: 'danger' },
  { key: 'mismatched', tone: 'danger' },
  { key: 'external',   tone: 'info' },
  // Multi-version is *informational*: exercises are allowed to have several
  // candidate videos per folder and one is picked as active in the library
  // modal. This tab just lists where it's happening.
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
  const confirmDialog = useConfirm();
  const { audit, loading, error, refresh, deleteOrphans } = useVideosAudit();
  const [active, setActive] = useState('missing');
  const [isMobile, setIsMobile] = useState(false);
  const [busy, setBusy] = useState(false);

  useEffect(() => {
    const check = () => setIsMobile(window.innerWidth <= 768);
    check();
    window.addEventListener('resize', check);
    return () => window.removeEventListener('resize', check);
  }, []);

  const counts = useMemo(
    () => Object.fromEntries(TAB_ORDER.map(({ key }) => [key, audit[key]?.length || 0])),
    [audit]
  );

  const handleDeleteOrphans = async () => {
    if (!audit.orphans.length) return;
    const count = audit.orphans.length;
    const ok = await confirmDialog({
      title: t('admin.videos.deleteOrphansTitle'),
      message: t('admin.videos.deleteOrphansMessage', { count }),
      confirmLabel: t('admin.segments.delete'),
      danger: true,
    });
    if (!ok) return;
    setBusy(true);
    const { removed, errors } = await deleteOrphans(audit.orphans.map((o) => o.path));
    setBusy(false);
    if (errors.length) {
      toast.error(t('admin.videos.deleteOrphansErrors', { errors: errors.join(', ') }));
    } else {
      toast.success(t('admin.videos.deleteOrphansSuccess', { count: removed }));
    }
  };

  return (
    <PageContainer width="default">
      <PageHeader
        backLink={<BackLink href="/admin/library">{t('admin.common.library')}</BackLink>}
        title={t('admin.videos.title')}
        subtitle={audit.generated_at
          ? t('admin.videos.generated', { when: new Date(audit.generated_at).toLocaleString() })
          : undefined}
        actions={
          <button onClick={refresh} disabled={loading} style={refreshBtnStyle}>
            {loading ? t('admin.common.loading') : t('admin.common.refresh')}
          </button>
        }
      />

      {error && <div style={errorBoxStyle}>{error}</div>}

      <div style={tabsWrapStyle}>
        {TAB_ORDER.map(({ key, tone }) => (
          <button
            key={key}
            onClick={() => setActive(key)}
            style={tabStyle(active === key, tone, counts[key], isMobile)}
          >
            <span>{t(`admin.videos.tabs.${key}`)}</span>
            <span style={badgeStyle(tone, counts[key])}>{counts[key]}</span>
          </button>
        ))}
      </div>

      <div style={panelStyle}>
        {active === 'missing'    && <MissingList items={audit.missing} />}
        {active === 'broken'     && <BrokenList items={audit.broken} />}
        {active === 'mismatched' && <MismatchedList items={audit.mismatched} />}
        {active === 'external'   && <ExternalList items={audit.external} />}
        {active === 'duplicates' && <DuplicatesList items={audit.duplicates} />}
        {active === 'orphans'    && (
          <OrphansList items={audit.orphans} onDeleteAll={handleDeleteOrphans} busy={busy} />
        )}
      </div>
    </PageContainer>
  );
}

/* -------- lists ---------- */

const MissingList = ({ items }) => {
  const { t } = useTranslation();
  return !items.length ? <Empty text={t('admin.videos.empty.missing')} /> : (
    <ul style={ulStyle}>
      {items.map((e) => (
        <li key={e.id} style={rowStyle}>
          <div style={rowMainStyle}>
            <span style={idChipStyle}>#{e.id}</span>
            <span>{e.name}</span>
          </div>
          <span style={mutedStyle}>{t('admin.videos.skillId', { id: e.skill_id })}</span>
        </li>
      ))}
    </ul>
  );
};

const BrokenList = ({ items }) => {
  const { t } = useTranslation();
  return !items.length ? <Empty text={t('admin.videos.empty.broken')} /> : (
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
};

const MismatchedList = ({ items }) => {
  const { t } = useTranslation();
  return !items.length ? <Empty text={t('admin.videos.empty.mismatched')} /> : (
    <ul style={ulStyle}>
      {items.map((e) => (
        <li key={e.id} style={rowStyle}>
          <div style={rowMainStyle}>
            <span style={idChipStyle}>#{e.id}</span>
            <span>{e.name}</span>
          </div>
          <span style={mutedStyle}>{t('admin.videos.urlFolder', { id: e.url_exercise_id })}</span>
        </li>
      ))}
    </ul>
  );
};

const ExternalList = ({ items }) => {
  const { t } = useTranslation();
  return !items.length ? <Empty text={t('admin.videos.empty.external')} /> : (
    <ul style={ulStyle}>
      {items.map((e) => (
        <li key={e.id} style={rowStyle}>
          <div style={rowMainStyle}>
            <span style={idChipStyle}>#{e.id}</span>
            <span>{e.name}</span>
          </div>
          <a href={e.video_url} target="_blank" rel="noreferrer" style={linkStyle}>
            {t('admin.videos.openLink')}
          </a>
        </li>
      ))}
    </ul>
  );
};

const DuplicatesList = ({ items }) => {
  const { t } = useTranslation();
  return !items.length ? <Empty text={t('admin.videos.empty.duplicates')} /> : (
    <>
      <div style={{ padding: '8px 12px 12px', fontSize: 12, color: '#9ca3af' }}>
        {t('admin.videos.duplicatesHint')}
      </div>
      <ul style={ulStyle}>
        {items.map((d) => (
          <li key={d.exercise_id} style={{ ...rowStyle, flexDirection: 'column', alignItems: 'flex-start' }}>
            <div style={rowMainStyle}>
              <span style={idChipStyle}>#{d.exercise_id}</span>
              <span>{t('admin.videos.duplicatesCandidates', { count: d.objects })}</span>
            </div>
            <details style={{ marginTop: 8, width: '100%' }}>
              <summary style={detailsSummaryStyle}>{t('admin.videos.showPaths')}</summary>
              <ul style={{ margin: '6px 0 0 16px', padding: 0 }}>
                {d.paths.map((p) => <li key={p}><code style={codeStyle}>{p}</code></li>)}
              </ul>
            </details>
          </li>
        ))}
      </ul>
    </>
  );
};

const OrphansList = ({ items, onDeleteAll, busy }) => {
  const { t } = useTranslation();
  const total = items.reduce((sum, o) => sum + (o.size_bytes || 0), 0);
  return !items.length ? <Empty text={t('admin.videos.empty.orphans')} /> : (
    <>
      <div style={orphanHeaderStyle}>
        <div>{t('admin.videos.orphanSummary', { count: items.length, size: formatBytes(total) })}</div>
        <button onClick={onDeleteAll} disabled={busy} style={dangerBtnStyle}>
          {busy ? t('admin.common.deleting') : t('admin.videos.deleteAll')}
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

const refreshBtnStyle = {
  padding: '10px 16px',
  minHeight: 44,
  background: 'rgba(96,165,250,0.12)',
  border: '1px solid rgba(96,165,250,0.3)',
  borderRadius: 8,
  color: '#bfdbfe',
  cursor: 'pointer',
  fontWeight: 600,
};

const errorBoxStyle = {
  padding: 12, borderRadius: 8, marginBottom: 12,
  background: 'rgba(239,68,68,0.1)', border: '1px solid rgba(239,68,68,0.3)', color: '#fecaca',
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
    borderRadius: 999,
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
    padding: '2px 8px', borderRadius: 999,
    background: c.bg, color: c.text,
    fontSize: 11, fontWeight: 700,
    minWidth: 22, textAlign: 'center',
  };
};

const panelStyle = {
  background: 'rgba(255,255,255,0.03)',
  border: '1px solid rgba(255,255,255,0.08)',
  borderRadius: 12,
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
  padding: '2px 8px', borderRadius: 6, fontSize: 12, fontWeight: 700,
  flexShrink: 0,
};
const mutedStyle = { color: '#9ca3af', fontSize: 12, minWidth: 0, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' };
const codeStyle = {
  fontFamily: 'ui-monospace, Menlo, monospace',
  fontSize: 11, color: '#d1d5db',
  minWidth: 0, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap',
  flex: '1 1 auto',
};
const linkStyle = { color: '#60a5fa', textDecoration: 'none', fontSize: 12 };
const detailsSummaryStyle = { cursor: 'pointer', color: '#9ca3af', fontSize: 12 };

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
  borderRadius: 8, color: '#fecaca',
  cursor: 'pointer', fontWeight: 600,
};
