import React, { useEffect, useState } from 'react';
import { supabase } from '../../../lib/supabase';

const FUNCTION_URL = `${import.meta.env.VITE_SUPABASE_URL}/functions/v1/resend-campaign-failures`;

export default function CampaignDrilldownModal({ campaign, onClose }) {
  const [rows, setRows] = useState(null);
  const [error, setError] = useState(null);
  const [filter, setFilter] = useState('all'); // all | sent | failed | bounced
  const [resending, setResending] = useState(false);
  const [resendResult, setResendResult] = useState(null);

  async function load() {
    const { data, error } = await supabase.rpc('marketing_campaign_recipients', {
      p_campaign_id: campaign.id, p_limit: 500, p_offset: 0,
    });
    if (error) setError(error.message);
    else { setError(null); setRows(data || []); }
  }

  useEffect(() => { load(); }, [campaign.id]);

  async function resendFailures() {
    if (!window.confirm(`Resend to all ${counts.failed} failed addresses for this campaign?`)) return;
    setResending(true);
    setResendResult(null);
    try {
      const { data: { session } } = await supabase.auth.getSession();
      const res = await fetch(FUNCTION_URL, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${session.access_token}` },
        body: JSON.stringify({ campaign_id: campaign.id }),
      });
      const body = await res.json();
      if (!res.ok || !body.ok) setResendResult({ error: body.error || `HTTP ${res.status}` });
      else setResendResult(body);
      await load();
    } catch (e) {
      setResendResult({ error: e?.message || String(e) });
    } finally {
      setResending(false);
    }
  }

  const filtered = (rows || []).filter((r) => {
    if (filter === 'all') return true;
    if (filter === 'sent') return r.status === 'sent';
    if (filter === 'failed') return r.status === 'failed';
    if (filter === 'bounced') return !!r.bounced_at || !!r.complained_at;
    if (filter === 'opened') return !!r.opened_at;
    if (filter === 'clicked') return !!r.clicked_at;
    return true;
  });

  const counts = (rows || []).reduce((acc, r) => {
    if (r.status === 'sent') acc.sent++;
    if (r.status === 'failed') acc.failed++;
    if (r.opened_at) acc.opened++;
    if (r.clicked_at) acc.clicked++;
    if (r.bounced_at || r.complained_at) acc.bounced++;
    return acc;
  }, { sent: 0, failed: 0, opened: 0, clicked: 0, bounced: 0 });

  return (
    <div style={overlay} onClick={onClose}>
      <div style={modal} onClick={(e) => e.stopPropagation()}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', gap: 12, marginBottom: 12 }}>
          <div style={{ minWidth: 0 }}>
            <h2 style={{ margin: 0, color: '#e5e7eb', fontSize: 16 }}>{campaign.subject}</h2>
            <div style={{ color: '#9ca3af', fontSize: 12, marginTop: 4 }}>
              {campaign.audience} · status: {campaign.status} · id: <code>{campaign.id}</code>
            </div>
          </div>
          <button onClick={onClose} style={btnGhost}>Close</button>
        </div>

        <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap', marginBottom: 12 }}>
          {['all', 'sent', 'failed', 'opened', 'clicked', 'bounced'].map((f) => (
            <button key={f} onClick={() => setFilter(f)} style={filter === f ? chipActive : chip}>
              {f}{f !== 'all' ? ` (${counts[f] ?? 0})` : ` (${rows?.length ?? 0})`}
            </button>
          ))}
          <span style={{ flex: 1 }} />
          <button
            onClick={resendFailures}
            disabled={resending || counts.failed === 0}
            style={counts.failed === 0 ? btnDisabled : btnPrimary}
          >
            {resending ? 'Resending…' : `Resend to ${counts.failed} failure${counts.failed === 1 ? '' : 's'}`}
          </button>
        </div>

        {resendResult && (
          <div style={resendResult.error ? errBox : okBox}>
            {resendResult.error
              ? <>Error: {resendResult.error}</>
              : <>Resend complete — {resendResult.sent} sent, {resendResult.failed} failed, {resendResult.skipped} skipped (suppressed/unsubscribed).</>
            }
          </div>
        )}

        {error && <div style={errBox}>Failed to load recipients: {error}</div>}
        {!rows && !error && <div style={muted}>Loading recipients…</div>}
        {rows && rows.length === 0 && <div style={muted}>No recipient rows logged for this campaign.</div>}

        {filtered.length > 0 && (
          <div style={{ maxHeight: 480, overflow: 'auto', border: '1px solid rgba(255,255,255,0.06)', borderRadius: 8 }}>
            <div style={headerRow}>
              <span>Email</span>
              <span>Status</span>
              <span>Opened</span>
              <span>Clicked</span>
              <span>Bounce/Comp.</span>
              <span>Error</span>
            </div>
            {filtered.map((r, i) => (
              <div key={`${r.email}-${i}`} style={dataRow}>
                <span style={{ color: '#e5e7eb', fontSize: 12, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{r.email}</span>
                <span style={{ color: r.status === 'sent' ? '#34d399' : '#fca5a5', fontSize: 12 }}>{r.status}</span>
                <span style={{ color: r.opened_at ? '#22d3ee' : '#6b7280', fontSize: 11 }}>{r.opened_at ? new Date(r.opened_at).toLocaleDateString() : '—'}</span>
                <span style={{ color: r.clicked_at ? '#22d3ee' : '#6b7280', fontSize: 11 }}>{r.clicked_at ? new Date(r.clicked_at).toLocaleDateString() : '—'}</span>
                <span style={{ color: '#fdba74', fontSize: 11 }}>{r.bounced_at ? 'bounced' : r.complained_at ? 'complained' : '—'}</span>
                <span style={{ color: '#9ca3af', fontSize: 11, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }} title={r.error_message || ''}>{r.error_message || '—'}</span>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}

const overlay = {
  position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.7)', zIndex: 1000,
  display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 16,
};
const modal = {
  background: '#0b1020', border: '1px solid rgba(255,255,255,0.1)', borderRadius: 12,
  width: 'min(960px, 100%)', maxHeight: 'calc(100vh - 32px)', overflow: 'auto', padding: 20, color: '#e4e4e7',
};
const headerRow = {
  display: 'grid', gridTemplateColumns: '2fr 0.7fr 0.8fr 0.8fr 0.8fr 1.5fr', gap: 8,
  padding: '8px 12px', borderBottom: '1px solid rgba(255,255,255,0.08)',
  fontSize: 10, letterSpacing: '0.08em', textTransform: 'uppercase', color: '#9ca3af',
  position: 'sticky', top: 0, background: '#0b1020',
};
const dataRow = {
  display: 'grid', gridTemplateColumns: '2fr 0.7fr 0.8fr 0.8fr 0.8fr 1.5fr', gap: 8,
  padding: '8px 12px', borderBottom: '1px solid rgba(255,255,255,0.04)', alignItems: 'center',
};
const muted = { color: '#9ca3af', fontSize: 13, padding: 12, fontStyle: 'italic' };
const chip = { padding: '4px 10px', borderRadius: 999, fontSize: 11, cursor: 'pointer', background: 'rgba(255,255,255,0.04)', color: '#cbd5e1', border: '1px solid rgba(255,255,255,0.1)' };
const chipActive = { ...chip, background: 'rgba(34,211,238,0.15)', color: '#22d3ee', borderColor: 'rgba(34,211,238,0.4)' };
const btnBase = { padding: '6px 12px', fontSize: 12, fontWeight: 600, borderRadius: 6, cursor: 'pointer' };
const btnGhost = { ...btnBase, background: 'rgba(255,255,255,0.04)', color: '#e5e7eb', border: '1px solid rgba(255,255,255,0.12)' };
const btnPrimary = { ...btnBase, background: 'linear-gradient(135deg,#2563eb,#22d3ee)', color: '#0b1020', border: 'none' };
const btnDisabled = { ...btnGhost, opacity: 0.4, cursor: 'not-allowed' };
const errBox = { padding: 10, background: 'rgba(230,57,70,0.1)', border: '1px solid rgba(230,57,70,0.3)', borderRadius: 8, color: '#fca5a5', fontSize: 12, marginBottom: 10 };
const okBox = { padding: 10, background: 'rgba(34,197,94,0.1)', border: '1px solid rgba(34,197,94,0.3)', borderRadius: 8, color: '#86efac', fontSize: 12, marginBottom: 10 };
