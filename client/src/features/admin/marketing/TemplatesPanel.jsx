import React, { useEffect, useState, useCallback } from 'react';
import { supabase } from '../../../lib/supabase';

// Templates library: load / save-as / duplicate / delete.
// Built-ins (is_builtin=true) cannot be edited or deleted (RLS-enforced).
export default function TemplatesPanel({
  currentSubject,
  currentMode,
  currentBlocks,
  currentHtml,
  onLoad,
}) {
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
    const name = window.prompt('Template name:');
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
    if (error) { alert(`Save failed: ${error.message}`); return; }
    reload();
  }

  async function duplicateSelected() {
    if (!selected) return;
    const name = window.prompt('New name:', `${selected.name} (copy)`);
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
    if (error) { alert(`Duplicate failed: ${error.message}`); return; }
    reload();
  }

  async function deleteSelected() {
    if (!selected || selected.is_builtin) return;
    if (!window.confirm(`Delete template "${selected.name}"? This cannot be undone.`)) return;
    setBusy(true);
    const { error } = await supabase.from('marketing_templates').delete().eq('id', selected.id);
    setBusy(false);
    if (error) { alert(`Delete failed: ${error.message}`); return; }
    setSelectedId('');
    reload();
  }

  if (error) return <div style={errorBox}>Failed to load templates: {error}</div>;

  return (
    <div>
      <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap', alignItems: 'center' }}>
        <select
          value={selectedId}
          onChange={(e) => setSelectedId(e.target.value)}
          style={selectStyle}
          disabled={!templates}
        >
          <option value="">— Pick a template —</option>
          {templates?.map((t) => (
            <option key={t.id} value={t.id}>
              {t.is_builtin ? '★ ' : ''}{t.name}
            </option>
          ))}
        </select>
        <button onClick={loadSelected} disabled={!selected || busy} style={btnPrimary}>Load</button>
        <button onClick={duplicateSelected} disabled={!selected || busy} style={btnGhost}>Duplicate</button>
        <button
          onClick={deleteSelected}
          disabled={!selected || selected.is_builtin || busy}
          style={selected?.is_builtin ? btnDisabled : btnDanger}
          title={selected?.is_builtin ? 'Built-in templates cannot be deleted' : ''}
        >
          Delete
        </button>
        <span style={{ flex: 1 }} />
        <button onClick={saveAsNew} disabled={busy || !currentSubject} style={btnGhost}>
          Save current as template…
        </button>
      </div>
      {selected && (
        <div style={{ marginTop: 8, fontSize: 11, color: '#9ca3af' }}>
          {selected.is_builtin ? 'Built-in.' : `Custom · updated ${new Date(selected.updated_at).toLocaleString()}`}
          {' · subject: '}<em style={{ color: '#cbd5e1' }}>{selected.subject || '(empty)'}</em>
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
