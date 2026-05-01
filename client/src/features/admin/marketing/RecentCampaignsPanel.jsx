import React, { useEffect, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { supabase } from '../../../lib/supabase';
import CampaignDrilldownModal from './CampaignDrilldownModal.jsx';

export default function RecentCampaignsPanel({ refreshKey }) {
  const { t } = useTranslation();
  const [campaigns, setCampaigns] = useState(null);
  const [error, setError] = useState(null);
  const [drilldown, setDrilldown] = useState(null);

  useEffect(() => {
    let cancelled = false;
    (async () => {
      const { data, error } = await supabase.rpc('marketing_recent_campaigns', { p_limit: 20 });
      if (cancelled) return;
      if (error) setError(error.message);
      else setCampaigns(data || []);
    })();
    return () => { cancelled = true; };
  }, [refreshKey]);

  if (error) return <div style={errorBox}>{t('admin.common.failedToLoad', { error })}</div>;
  if (!campaigns) return <div style={loadingStyle}>{t('admin.recent.loading')}</div>;
  if (campaigns.length === 0) return <div style={emptyStyle}>{t('admin.recent.empty')}</div>;

  return (
    <div>
      <div style={headerRow}>
        <span style={colSubject}>{t('admin.recent.colSubject')}</span>
        <span style={colStat}>{t('admin.recent.colSent')}</span>
        <span style={colStat}>{t('admin.recent.colDelivered')}</span>
        <span style={colStat}>{t('admin.recent.colOpened')}</span>
        <span style={colStat}>{t('admin.recent.colClicked')}</span>
        <span style={colStat}>{t('admin.recent.colBounced')}</span>
      </div>
      {campaigns.map((c) => (
        <CampaignRow key={c.id} c={c} onClick={() => setDrilldown(c)} />
      ))}
      {drilldown && <CampaignDrilldownModal campaign={drilldown} onClose={() => setDrilldown(null)} />}
    </div>
  );
}

function CampaignRow({ c, onClick }) {
  const { t } = useTranslation();
  const sent = c.successful_sends || 0;
  const denom = sent || 1;
  const pct = (n) => `${Math.round((n / denom) * 100)}%`;
  const date = c.completed_at || c.created_at;
  const sender = c.sent_by_email || t('admin.recent.rowSystemSender');
  return (
    <div style={{ ...dataRow, cursor: 'pointer' }} onClick={onClick} title={t('admin.recent.rowTitle')}>
      <div style={colSubject}>
        <div style={{ color: '#e5e7eb', fontWeight: 600, fontSize: 13 }}>{c.subject}</div>
        <div style={{ color: '#9ca3af', fontSize: 11, marginTop: 2 }}>
          {t('admin.recent.rowMeta', {
            audience: c.audience,
            date: date ? new Date(date).toLocaleDateString() : '—',
            status: c.status,
            sender,
          })}
        </div>
      </div>
      <Stat n={sent} pct="" />
      <Stat n={c.delivered} pct={sent ? pct(c.delivered) : ''} />
      <Stat n={c.opened} pct={sent ? pct(c.opened) : ''} />
      <Stat n={c.clicked} pct={sent ? pct(c.clicked) : ''} />
      <Stat n={c.bounced + c.complained} pct={sent ? pct(c.bounced + c.complained) : ''} warn={c.bounced + c.complained > 0} />
    </div>
  );
}

function Stat({ n, pct, warn }) {
  return (
    <div style={colStat}>
      <div style={{ color: warn ? '#fdba74' : '#e5e7eb', fontSize: 13, fontWeight: 600 }}>{n ?? 0}</div>
      {pct && <div style={{ color: '#9ca3af', fontSize: 10 }}>{pct}</div>}
    </div>
  );
}

const headerRow = {
  display: 'grid',
  gridTemplateColumns: '2fr repeat(5, 1fr)',
  gap: 8,
  padding: '8px 12px',
  fontSize: 10,
  letterSpacing: '0.08em',
  textTransform: 'uppercase',
  color: '#9ca3af',
  borderBottom: '1px solid rgba(255,255,255,0.08)',
};

const dataRow = {
  display: 'grid',
  gridTemplateColumns: '2fr repeat(5, 1fr)',
  gap: 8,
  padding: '12px',
  borderBottom: '1px solid rgba(255,255,255,0.04)',
  alignItems: 'center',
};

const colSubject = { minWidth: 0 };
const colStat = { textAlign: 'center' };

const loadingStyle = { color: '#9ca3af', fontSize: 13, padding: 12 };
const emptyStyle = { color: '#9ca3af', fontSize: 13, padding: 12, fontStyle: 'italic' };
const errorBox = {
  padding: 12,
  background: 'rgba(230,57,70,0.1)',
  border: '1px solid rgba(230,57,70,0.3)',
  borderRadius: 8,
  color: '#fca5a5',
  fontSize: 13,
};
