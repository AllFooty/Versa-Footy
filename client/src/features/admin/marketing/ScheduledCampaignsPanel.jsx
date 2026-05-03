import React, { useEffect, useState, useCallback } from 'react';
import { useTranslation } from 'react-i18next';
import { toast } from 'sonner';
import { supabase } from '../../../lib/supabase';
import { useConfirm } from '../../../components/ConfirmProvider';

export default function ScheduledCampaignsPanel({ refreshKey }) {
  const { t } = useTranslation();
  const confirmDialog = useConfirm();
  const [rows, setRows] = useState(null);
  const [error, setError] = useState(null);
  const [busyId, setBusyId] = useState(null);

  const reload = useCallback(async () => {
    const { data, error } = await supabase.rpc('marketing_list_scheduled');
    if (error) setError(error.message);
    else { setError(null); setRows(data || []); }
  }, []);

  useEffect(() => { reload(); }, [reload, refreshKey]);

  async function cancel(id) {
    const ok = await confirmDialog({
      title: t('admin.scheduled.cancelTitle'),
      message: t('admin.scheduled.cancelMessage'),
      confirmLabel: t('admin.scheduled.cancelButton'),
      danger: true,
    });
    if (!ok) return;
    setBusyId(id);
    const { data, error } = await supabase.rpc('marketing_cancel_scheduled', { p_id: id });
    setBusyId(null);
    if (error) { toast.error(t('admin.scheduled.cancelFailed', { error: error.message })); return; }
    if (!data) {
      toast.warning(t('admin.scheduled.cancelTooLate'));
    } else {
      toast.success(t('admin.scheduled.canceledToast'));
    }
    reload();
  }

  async function reschedule(id) {
    const input = window.prompt(t('admin.scheduled.reschedulePrompt'));
    if (!input) return;
    const dt = new Date(input);
    if (isNaN(dt.getTime())) { toast.error(t('admin.scheduled.invalidDate')); return; }
    if (dt <= new Date()) { toast.error(t('admin.scheduled.futureRequired')); return; }
    setBusyId(id);
    const { data, error } = await supabase.rpc('marketing_reschedule_campaign', { p_id: id, p_new_time: dt.toISOString() });
    setBusyId(null);
    if (error) { toast.error(t('admin.scheduled.rescheduleFailed', { error: error.message })); return; }
    if (!data) {
      toast.warning(t('admin.scheduled.rescheduleTooLate'));
    } else {
      toast.success(t('admin.scheduled.rescheduledToast'));
    }
    reload();
  }

  if (error) return <div style={errorBox}>{t('admin.common.failedToLoad', { error })}</div>;
  if (!rows) return <div style={muted}>{t('admin.scheduled.loading')}</div>;
  if (rows.length === 0) return <div style={muted}>{t('admin.scheduled.empty')}</div>;

  return (
    <div>
      {rows.map((c) => {
        const when = c.scheduled_for ? new Date(c.scheduled_for) : null;
        const isPast = when && when < new Date();
        const statusColor = c.status === 'scheduled' ? '#22d3ee' : c.status === 'sending' ? '#fdba74' : '#9ca3af';
        return (
          <div key={c.id} style={row}>
            <div style={{ minWidth: 0, flex: 1 }}>
              <div style={{ color: '#e5e7eb', fontWeight: 600, fontSize: 13 }}>{c.subject}</div>
              <div style={{ color: '#9ca3af', fontSize: 11, marginTop: 2 }}>
                {c.audience}{c.category ? ` · ${c.category}` : ''} ·{' '}
                <span style={{ color: statusColor }}>{c.status}</span>
                {when ? <> · {when.toLocaleString()}{isPast && c.status === 'scheduled' ? t('admin.scheduled.overdue') : ''}</> : null}
              </div>
            </div>
            {c.status === 'scheduled' && (
              <div style={{ display: 'flex', gap: 8 }}>
                <button onClick={() => reschedule(c.id)} disabled={busyId === c.id} style={btnGhost}>{t('admin.scheduled.reschedule')}</button>
                <button onClick={() => cancel(c.id)} disabled={busyId === c.id} style={btnDanger}>{t('admin.scheduled.cancel')}</button>
              </div>
            )}
          </div>
        );
      })}
    </div>
  );
}

const row = {
  display: 'flex', alignItems: 'center', gap: 12,
  padding: '12px', borderBottom: '1px solid rgba(255,255,255,0.04)',
};
const muted = { color: '#9ca3af', fontSize: 13, padding: 12, fontStyle: 'italic' };
const errorBox = { padding: 12, background: 'rgba(230,57,70,0.1)', border: '1px solid rgba(230,57,70,0.3)', borderRadius: 8, color: '#fca5a5', fontSize: 13 };
const btnGhost = {
  padding: '6px 12px', fontSize: 12, fontWeight: 600, borderRadius: 6, cursor: 'pointer',
  background: 'rgba(255,255,255,0.04)', color: '#e5e7eb', border: '1px solid rgba(255,255,255,0.12)',
};
const btnDanger = {
  padding: '6px 12px', fontSize: 12, fontWeight: 600, borderRadius: 6, cursor: 'pointer',
  background: 'rgba(230,57,70,0.12)', color: '#fca5a5', border: '1px solid rgba(230,57,70,0.4)',
};
