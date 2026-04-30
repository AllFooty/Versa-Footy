import React, { useEffect, useState, useCallback } from 'react';
import { supabase } from '../../../lib/supabase';

// Suppressions tab. Lists every email Resend bounced/complained on (or that an
// admin manually added). Removing a row re-enables marketing sends to that
// address — only do this if you have evidence the address is actually valid.
export default function SuppressionsPanel() {
  const [rows, setRows] = useState(null);
  const [error, setError] = useState(null);
  const [filter, setFilter] = useState('');

  const reload = useCallback(async () => {
    const { data, error } = await supabase
      .from('marketing_suppressions')
      .select('email, reason, notes, created_at')
      .order('created_at', { ascending: false })
      .limit(500);
    if (error) setError(error.message);
    else { setError(null); setRows(data || []); }
  }, []);

  useEffect(() => { reload(); }, [reload]);

  async function remove(email) {
    if (!window.confirm(`Remove ${email} from suppressions? Future campaigns will start sending to this address again.`)) return;
    const { error } = await supabase.from('marketing_suppressions').delete().eq('email', email);
    if (error) { alert(`Remove failed: ${error.message}`); return; }
    reload();
  }

  if (error) return <div style={errBox}>Failed to load: {error}</div>;
  if (!rows) return <div style={muted}>Loading suppressions…</div>;

  const filtered = filter ? rows.filter((r) => r.email.toLowerCase().includes(filter.toLowerCase())) : rows;

  return (
    <div>
      <div style={{ display: 'flex', gap: 8, marginBottom: 12, alignItems: 'center', flexWrap: 'wrap' }}>
        <input
          type="search"
          placeholder="Filter by email…"
          value={filter}
          onChange={(e) => setFilter(e.target.value)}
          style={searchInput}
        />
        <span style={{ color: '#9ca3af', fontSize: 12 }}>
          {filtered.length} of {rows.length} suppressed
        </span>
      </div>

      {filtered.length === 0 && <div style={muted}>{rows.length === 0 ? 'No suppressed addresses.' : 'No matches.'}</div>}

      {filtered.length > 0 && (
        <div style={{ border: '1px solid rgba(255,255,255,0.06)', borderRadius: 8, overflow: 'hidden' }}>
          <div style={headerRow}>
            <span>Email</span>
            <span>Reason</span>
            <span>Notes</span>
            <span>Added</span>
            <span></span>
          </div>
          {filtered.map((r) => (
            <div key={r.email} style={dataRow}>
              <span style={{ color: '#e5e7eb', fontSize: 12, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{r.email}</span>
              <span style={{ color: r.reason === 'complained' ? '#fca5a5' : '#fdba74', fontSize: 12 }}>{r.reason}</span>
              <span style={{ color: '#9ca3af', fontSize: 11, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }} title={r.notes || ''}>{r.notes || '—'}</span>
              <span style={{ color: '#9ca3af', fontSize: 11 }}>{new Date(r.created_at).toLocaleDateString()}</span>
              <button onClick={() => remove(r.email)} style={btnDanger}>Remove</button>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

const headerRow = {
  display: 'grid', gridTemplateColumns: '2fr 1fr 1fr 1fr 80px', gap: 8,
  padding: '8px 12px', borderBottom: '1px solid rgba(255,255,255,0.08)',
  fontSize: 10, letterSpacing: '0.08em', textTransform: 'uppercase', color: '#9ca3af',
};
const dataRow = {
  display: 'grid', gridTemplateColumns: '2fr 1fr 1fr 1fr 80px', gap: 8,
  padding: '8px 12px', borderBottom: '1px solid rgba(255,255,255,0.04)', alignItems: 'center',
};
const muted = { color: '#9ca3af', fontSize: 13, padding: 12, fontStyle: 'italic' };
const searchInput = {
  flex: 1, minWidth: 200, maxWidth: 400,
  padding: '8px 10px', fontSize: 13, borderRadius: 6,
  background: 'rgba(255,255,255,0.04)', color: '#e5e7eb',
  border: '1px solid rgba(255,255,255,0.12)',
};
const btnDanger = {
  padding: '4px 10px', fontSize: 11, fontWeight: 600, borderRadius: 6, cursor: 'pointer',
  background: 'rgba(230,57,70,0.12)', color: '#fca5a5', border: '1px solid rgba(230,57,70,0.4)',
};
const errBox = { padding: 12, background: 'rgba(230,57,70,0.1)', border: '1px solid rgba(230,57,70,0.3)', borderRadius: 8, color: '#fca5a5', fontSize: 13 };
