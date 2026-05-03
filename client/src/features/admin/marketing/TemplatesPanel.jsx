import React, { useEffect, useState, useCallback } from 'react';
import { useTranslation } from 'react-i18next';
import { toast } from 'sonner';
import { supabase } from '../../../lib/supabase';
import { useConfirm } from '../../../components/ConfirmProvider';

// Templates library: load / save-as / duplicate / delete.
// Built-ins (is_builtin=true) cannot be edited or deleted (RLS-enforced).
export default function TemplatesPanel({
  currentSubject,
  currentMode,
  currentBlocks,
  currentHtml,
  onLoad,
}) {
  const { t } = useTranslation();
  const confirmDialog = useConfirm();
  const [templates, setTemplates] = useState(null);
  const [error, setError] = useState(null);
  const [selectedId, setSelectedId] = useState('');
  const [busy, setBusy] = useState(false);

  const reload = useCallback(async () => {
    const { data, error } = await supabase
      .from('marketing_templates')
      .select('id, name, subject, mode, blocks_json, html, is_builtin, updated_at')
      .order('is_builtin', { ascending: false })
      .order('name', { ascending: true });
    if (error) setError(error.message);
    else { setError(null); setTemplates(data || []); }
  }, []);

  useEffect(() => { reload(); }, [reload]);

  const selected = templates?.find((t) => t.id === selectedId) || null;

  function loadSelected() {
    if (!selected) return;
    onLoad({
      subject: selected.subject || '',
      mode: selected.mode,
      blocks: selected.mode === 'blocks' ? (selected.blocks_json || []) : null,
      html: selected.mode === 'html' ? (selected.html || '') : null,
    });
  }

  async function saveAsNew() {
    const name = window.prompt(t('admin.templates.namePrompt'));
    if (!name) return;
    setBusy(true);
    const payload = {
      name: name.trim(),
      subject: currentSubject || '',
      mode: currentMode,
      blocks_json: currentMode === 'blocks' ? currentBlocks : null,
      html: currentMode === 'html' ? currentHtml : null,
      is_builtin: false,
    };
    const { error } = await supabase.from('marketing_templates').insert(payload);
    setBusy(false);
    if (error) { toast.error(t('admin.templates.saveFailed', { error: error.message })); return; }
    toast.success(t('admin.templates.savedToast'));
    reload();
  }

  async function duplicateSelected() {
    if (!selected) return;
    const name = window.prompt(t('admin.templates.newNamePrompt'), t('admin.templates.copyName', { name: selected.name }));
    if (!name) return;
    setBusy(true);
    const { error } = await supabase.from('marketing_templates').insert({
      name: name.trim(),
      subject: selected.subject || '',
      mode: selected.mode,
      blocks_json: selected.blocks_json,
      html: selected.html,
      is_builtin: false,
    });
    setBusy(false);
    if (error) { toast.error(t('admin.templates.duplicateFailed', { error: error.message })); return; }
    toast.success(t('admin.templates.duplicatedToast'));
    reload();
  }

  async function deleteSelected() {
    if (!selected || selected.is_builtin) return;
    const ok = await confirmDialog({
      title: t('admin.templates.deleteTitle'),
      message: t('admin.templates.deleteMessage', { name: selected.name }),
      confirmLabel: t('admin.templates.delete'),
      danger: true,
    });
    if (!ok) return;
    setBusy(true);
    const { error } = await supabase.from('marketing_templates').delete().eq('id', selected.id);
    setBusy(false);
    if (error) { toast.error(t('admin.templates.deleteFailed', { error: error.message })); return; }
    toast.success(t('admin.templates.deletedToast'));
    setSelectedId('');
    reload();
  }

  if (error) return <div style={errorBox}>{t('admin.common.failedToLoad', { error })}</div>;

  return (
    <div>
      <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap', alignItems: 'center' }}>
        <select
          value={selectedId}
          onChange={(e) => setSelectedId(e.target.value)}
          style={selectStyle}
          disabled={!templates}
        >
          <option value="">{t('admin.templates.pickPlaceholder')}</option>
          {templates?.map((tpl) => (
            <option key={tpl.id} value={tpl.id}>
              {tpl.is_builtin ? '★ ' : ''}{tpl.name}
            </option>
          ))}
        </select>
        <button onClick={loadSelected} disabled={!selected || busy} style={btnPrimary}>{t('admin.templates.load')}</button>
        <button onClick={duplicateSelected} disabled={!selected || busy} style={btnGhost}>{t('admin.templates.duplicate')}</button>
        <button
          onClick={deleteSelected}
          disabled={!selected || selected.is_builtin || busy}
          style={selected?.is_builtin ? btnDisabled : btnDanger}
          title={selected?.is_builtin ? t('admin.templates.builtinDeleteTitle') : ''}
        >
          {t('admin.templates.delete')}
        </button>
        <span style={{ flex: 1 }} />
        <button onClick={saveAsNew} disabled={busy || !currentSubject} style={btnGhost}>
          {t('admin.templates.saveCurrent')}
        </button>
      </div>
      {selected && (
        <div style={{ marginTop: 8, fontSize: 11, color: '#9ca3af' }}>
          {selected.is_builtin
            ? t('admin.templates.builtinNote')
            : t('admin.templates.customNote', { when: new Date(selected.updated_at).toLocaleString() })}
          {' · '}{t('admin.templates.subjectPrefix')}{' '}
          <em style={{ color: '#cbd5e1' }}>{selected.subject || t('admin.templates.emptySubject')}</em>
        </div>
      )}
    </div>
  );
}

const selectStyle = {
  flex: 1, minWidth: 200,
  padding: '8px 12px', fontSize: 13, borderRadius: 6,
  background: 'rgba(255,255,255,0.04)', color: '#e5e7eb',
  border: '1px solid rgba(255,255,255,0.12)',
};
const btnBase = {
  padding: '8px 14px', fontSize: 12, fontWeight: 600, borderRadius: 6, cursor: 'pointer',
};
const btnPrimary = { ...btnBase, background: 'linear-gradient(135deg,#2563eb,#22d3ee)', color: '#0b1020', border: 'none' };
const btnGhost = { ...btnBase, background: 'rgba(255,255,255,0.04)', color: '#e5e7eb', border: '1px solid rgba(255,255,255,0.12)' };
const btnDanger = { ...btnBase, background: 'rgba(230,57,70,0.12)', color: '#fca5a5', border: '1px solid rgba(230,57,70,0.4)' };
const btnDisabled = { ...btnGhost, opacity: 0.4, cursor: 'not-allowed' };
const errorBox = { padding: 12, background: 'rgba(230,57,70,0.1)', border: '1px solid rgba(230,57,70,0.3)', borderRadius: 8, color: '#fca5a5', fontSize: 13 };
