import React, { useEffect, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { toast } from 'sonner';
import { supabase } from '../../lib/supabase';
import { useConfirm } from '../../components/ConfirmProvider';
import SegmentBuilder from './marketing/SegmentBuilder.jsx';
import { emptyFilter } from './marketing/segments.js';
import { PageContainer, PageHeader, BackLink } from '../../components/Page';

export default function SegmentsPage() {
  const { t } = useTranslation();
  const confirmDialog = useConfirm();
  const [segments, setSegments] = useState(null);
  const [error, setError] = useState(null);
  const [editing, setEditing] = useState(null); // { id?, name, description, filter, is_builtin }
  const [counts, setCounts] = useState({});

  useEffect(() => { void load(); }, []);

  async function load() {
    setError(null);
    const { data, error } = await supabase
      .from('marketing_segments')
      .select('*')
      .order('is_builtin', { ascending: false })
      .order('name');
    if (error) { setError(error.message); return; }
    setSegments(data || []);
    // Live counts per segment.
    const next = {};
    for (const s of data || []) {
      const { data: c } = await supabase.rpc('marketing_segment_count', { p_filter: s.filter });
      next[s.id] = c;
      setCounts({ ...next });
    }
  }

  function newSegment() {
    setEditing({ name: '', description: '', filter: emptyFilter(), is_builtin: false });
  }

  function editSegment(s) {
    setEditing({ ...s });
  }

  async function saveSegment() {
    if (!editing.name?.trim()) { toast.error(t('admin.segments.nameRequired')); return; }
    const payload = {
      name: editing.name.trim(),
      description: editing.description?.trim() || null,
      filter: editing.filter,
    };
    if (editing.id) {
      const { error } = await supabase.from('marketing_segments').update(payload).eq('id', editing.id);
      if (error) { toast.error(error.message); return; }
      toast.success(t('admin.segments.updatedToast'));
    } else {
      const { error } = await supabase.from('marketing_segments').insert(payload);
      if (error) { toast.error(error.message); return; }
      toast.success(t('admin.segments.createdToast'));
    }
    setEditing(null);
    await load();
  }

  async function deleteSegment(s) {
    if (s.is_builtin) { toast.error(t('admin.segments.builtinDeleteError')); return; }
    const ok = await confirmDialog({
      title: t('admin.segments.deleteTitle'),
      message: t('admin.segments.deleteMessage', { name: s.name }),
      confirmLabel: t('admin.segments.delete'),
      danger: true,
    });
    if (!ok) return;
    const { error } = await supabase.from('marketing_segments').delete().eq('id', s.id);
    if (error) { toast.error(error.message); return; }
    toast.success(t('admin.segments.deletedToast'));
    await load();
  }

  if (editing) {
    return (
      <PageContainer width="narrow">
        <PageHeader
          backLink={
            <a className="page-backlink" onClick={() => setEditing(null)} style={{ cursor: 'pointer' }}>
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
                <line x1="19" y1="12" x2="5" y2="12" />
                <polyline points="12 19 5 12 12 5" />
              </svg>
              <span>{t('admin.segments.title')}</span>
            </a>
          }
          title={editing.id ? t('admin.segments.editTitle') : t('admin.segments.newTitle')}
        />
        <div>
          <div className="card card--lg">
            <label style={labelStyle}>
              {t('admin.segments.nameLabel')}
              <input
                type="text"
                value={editing.name}
                onChange={(e) => setEditing({ ...editing, name: e.target.value })}
                disabled={editing.is_builtin}
                style={inputStyle}
                placeholder={t('admin.segments.namePlaceholder')}
              />
            </label>
            <label style={labelStyle}>
              {t('admin.segments.descriptionLabel')}
              <input
                type="text"
                value={editing.description || ''}
                onChange={(e) => setEditing({ ...editing, description: e.target.value })}
                style={inputStyle}
                placeholder={t('admin.segments.descriptionPlaceholder')}
              />
            </label>
            <div style={labelStyle}>
              {t('admin.segments.rulesLabel')}
              <SegmentBuilder
                value={editing.filter}
                onChange={(filter) => setEditing({ ...editing, filter })}
              />
            </div>

            <div style={{ display: 'flex', gap: 12, marginTop: 16 }}>
              <button onClick={saveSegment} style={primaryBtnStyle}>
                {editing.id ? t('admin.segments.saveButton') : t('admin.segments.createButton')}
              </button>
              <button onClick={() => setEditing(null)} style={ghostBtnStyle}>{t('common.cancel')}</button>
            </div>
          </div>
        </div>
      </PageContainer>
    );
  }

  return (
    <PageContainer width="narrow">
      <PageHeader
        backLink={<BackLink href="/admin/marketing">{t('admin.common.marketing')}</BackLink>}
        title={t('admin.segments.title')}
        actions={<button onClick={newSegment} style={primaryBtnStyle}>{t('admin.segments.newSegment')}</button>}
      />
      <div>

        {error && <div style={errorBoxStyle}>{error}</div>}

        <div className="card card--lg">
          {segments == null ? (
            <p style={{ color: '#9ca3af' }}>{t('admin.common.loading')}</p>
          ) : segments.length === 0 ? (
            <p style={{ color: '#9ca3af' }}>{t('admin.segments.empty')}</p>
          ) : (
            segments.map((s) => (
              <div key={s.id} style={rowStyle}>
                <div style={{ flex: 1, minWidth: 0 }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                    <strong style={{ color: '#e5e7eb' }}>{s.name}</strong>
                    {s.is_builtin && <span style={tagStyle}>{t('admin.segments.builtinTag')}</span>}
                  </div>
                  {s.description && <div style={{ color: '#9ca3af', fontSize: 12, marginTop: 4 }}>{s.description}</div>}
                </div>
                <div style={{ color: '#22d3ee', fontWeight: 600, fontSize: 13, minWidth: 80, textAlign: 'right' }}>
                  {counts[s.id] != null ? t('admin.common.recipients', { count: counts[s.id] }) : '…'}
                </div>
                <button onClick={() => editSegment(s)} style={smallBtn}>{t('admin.segments.edit')}</button>
                <button onClick={() => deleteSegment(s)} disabled={s.is_builtin} style={{ ...smallBtn, opacity: s.is_builtin ? 0.4 : 1 }}>{t('admin.segments.delete')}</button>
              </div>
            ))
          )}
        </div>
      </div>
    </PageContainer>
  );
}

const labelStyle = { display: 'block', marginBottom: 16, fontSize: 13, fontWeight: 600, color: '#d1d5db' };
const inputStyle = {
  display: 'block', width: '100%', marginTop: 8, padding: '10px 12px',
  background: 'rgba(0,0,0,0.3)', border: '1px solid rgba(255,255,255,0.1)',
  borderRadius: 8, color: '#f4f4f5', fontSize: 14, boxSizing: 'border-box',
};
const rowStyle = {
  display: 'flex', alignItems: 'center', gap: 12,
  padding: '12px 0', borderBottom: '1px solid rgba(255,255,255,0.05)',
};
const tagStyle = {
  fontSize: 10, letterSpacing: '0.08em', textTransform: 'uppercase',
  color: '#22d3ee', background: 'rgba(34,211,238,0.1)',
  padding: '2px 6px', borderRadius: 4,
};
const primaryBtnStyle = {
  padding: '10px 18px', background: 'linear-gradient(135deg, #2563eb, #22d3ee)',
  color: '#0b1020', fontWeight: 700, border: 'none', borderRadius: 8,
  cursor: 'pointer', fontSize: 13,
};
const ghostBtnStyle = {
  padding: '10px 18px', background: 'rgba(255,255,255,0.04)',
  color: '#e5e7eb', fontWeight: 600, border: '1px solid rgba(255,255,255,0.1)',
  borderRadius: 8, cursor: 'pointer', fontSize: 13,
};
const smallBtn = {
  padding: '6px 10px', background: 'rgba(255,255,255,0.04)',
  color: '#e5e7eb', border: '1px solid rgba(255,255,255,0.1)',
  borderRadius: 6, cursor: 'pointer', fontSize: 12,
};
const errorBoxStyle = {
  padding: 12, marginBottom: 12,
  background: 'rgba(230,57,70,0.1)', border: '1px solid rgba(230,57,70,0.3)',
  borderRadius: 8, color: '#fca5a5', fontSize: 13,
};
