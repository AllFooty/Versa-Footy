import React, { useEffect, useState, useCallback } from 'react';
import { useTranslation } from 'react-i18next';
import { toast } from 'sonner';
import { supabase } from '../../../lib/supabase';
import { useConfirm } from '../../../components/ConfirmProvider';

// Suppressions tab. Lists every email Resend bounced/complained on (or that an
// admin manually added). Removing a row re-enables marketing sends to that
// address — only do this if you have evidence the address is actually valid.
export default function SuppressionsPanel() {
  const { t } = useTranslation();
  const confirmDialog = useConfirm();
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
    const ok = await confirmDialog({
      title: t('admin.suppressions.removeTitle'),
      message: t('admin.suppressions.removeMessage', { email }),
      confirmLabel: t('admin.suppressions.remove'),
      danger: true,
    });
    if (!ok) return;
    const { error } = await supabase.from('marketing_suppressions').delete().eq('email', email);
    if (error) { toast.error(t('admin.suppressions.removeFailed', { error: error.message })); return; }
    toast.success(t('admin.suppressions.removedToast'));
    reload();
  }

  if (error) return <div style={errBox}>{t('admin.common.failedToLoad', { error })}</div>;
  if (!rows) return <div style={muted}>{t('admin.suppressions.loading')}</div>;

  const filtered = filter ? rows.filter((r) => r.email.toLowerCase().includes(filter.toLowerCase())) : rows;

  return (
    <div>
      <div style={{ display: 'flex', gap: 8, marginBottom: 12, alignItems: 'center', flexWrap: 'wrap' }}>
        <input
          type="search"
          placeholder={t('admin.suppressions.filterPlaceholder')}
          value={filter}
          onChange={(e) => setFilter(e.target.value)}
          style={searchInput}
        />
        <span style={{ color: '#9ca3af', fontSize: 12 }}>
          {t('admin.suppressions.filterCount', { filtered: filtered.length, total: rows.length })}
        </span>
      </div>

      {filtered.length === 0 && (
        <div style={muted}>
          {rows.length === 0 ? t('admin.suppressions.empty') : t('admin.suppressions.noMatches')}
        </div>
      )}

      {filtered.length > 0 && (
        <div style={{ border: '1px solid rgba(255,255,255,0.06)', borderRadius: 8, overflow: 'hidden' }}>
          <div style={headerRow}>
            <span>{t('admin.suppressions.colEmail')}</span>
            <span>{t('admin.suppressions.colReason')}</span>
            <span>{t('admin.suppressions.colNotes')}</span>
            <span>{t('admin.suppressions.colAdded')}</span>
            <span></span>
          </div>
          {filtered.map((r) => (
            <div key={r.email} style={dataRow}>
              <span style={{ color: '#e5e7eb', fontSize: 12, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{r.email}</span>
              <span style={{ color: r.reason === 'complained' ? '#fca5a5' : '#fdba74', fontSize: 12 }}>{r.reason}</span>
              <span style={{ color: '#9ca3af', fontSize: 11, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }} title={r.notes || ''}>{r.notes || '—'}</span>
              <span style={{ color: '#9ca3af', fontSize: 11 }}>{new Date(r.created_at).toLocaleDateString()}</span>
              <button onClick={() => remove(r.email)} style={btnDanger}>{t('admin.suppressions.remove')}</button>
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
