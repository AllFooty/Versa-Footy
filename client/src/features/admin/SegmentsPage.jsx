import React, { useEffect, useState } from 'react';
import { Link } from 'wouter';
import { supabase } from '../../lib/supabase';
import SegmentBuilder from './marketing/SegmentBuilder.jsx';
import { emptyFilter } from './marketing/segments.js';

export default function SegmentsPage() {
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
    if (!editing.name?.trim()) { alert('Name is required'); return; }
    const payload = {
      name: editing.name.trim(),
      description: editing.description?.trim() || null,
      filter: editing.filter,
    };
    if (editing.id) {
      const { error } = await supabase.from('marketing_segments').update(payload).eq('id', editing.id);
      if (error) { alert(error.message); return; }
    } else {
      const { error } = await supabase.from('marketing_segments').insert(payload);
      if (error) { alert(error.message); return; }
    }
    setEditing(null);
    await load();
  }

  async function deleteSegment(s) {
    if (s.is_builtin) { alert('Built-in segments cannot be deleted.'); return; }
    if (!window.confirm(`Delete segment "${s.name}"?`)) return;
    const { error } = await supabase.from('marketing_segments').delete().eq('id', s.id);
    if (error) { alert(error.message); return; }
    await load();
  }

  if (editing) {
    return (
      <div style={pageStyle}>
        <div style={{ maxWidth: 900, margin: '0 auto', padding: 24 }}>
          <div style={crumbStyle}>
            <a style={crumbLinkStyle} onClick={() => setEditing(null)}>← Segments</a>
          </div>
          <h1 style={titleStyle}>{editing.id ? 'Edit segment' : 'New segment'}</h1>

          <div style={cardStyle}>
            <label style={labelStyle}>
              Name
              <input
                type="text"
                value={editing.name}
                onChange={(e) => setEditing({ ...editing, name: e.target.value })}
                disabled={editing.is_builtin}
                style={inputStyle}
                placeholder="e.g. Power users with email"
              />
            </label>
            <label style={labelStyle}>
              Description
              <input
                type="text"
                value={editing.description || ''}
                onChange={(e) => setEditing({ ...editing, description: e.target.value })}
                style={inputStyle}
                placeholder="Optional one-line summary"
              />
            </label>
            <div style={labelStyle}>
              Rules
              <SegmentBuilder
                value={editing.filter}
                onChange={(filter) => setEditing({ ...editing, filter })}
              />
            </div>

            <div style={{ display: 'flex', gap: 12, marginTop: 16 }}>
              <button onClick={saveSegment} style={primaryBtnStyle}>
                {editing.id ? 'Save changes' : 'Create segment'}
              </button>
              <button onClick={() => setEditing(null)} style={ghostBtnStyle}>Cancel</button>
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div style={pageStyle}>
      <div style={{ maxWidth: 900, margin: '0 auto', padding: 24 }}>
        <div style={crumbStyle}>
          <Link href="/marketing"><a style={crumbLinkStyle}>← Marketing</a></Link>
        </div>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <h1 style={titleStyle}>Segments</h1>
          <button onClick={newSegment} style={primaryBtnStyle}>+ New segment</button>
        </div>

        {error && <div style={errorBoxStyle}>{error}</div>}

        <div style={cardStyle}>
          {segments == null ? (
            <p style={{ color: '#9ca3af' }}>Loading…</p>
          ) : segments.length === 0 ? (
            <p style={{ color: '#9ca3af' }}>No segments yet.</p>
          ) : (
            segments.map((s) => (
              <div key={s.id} style={rowStyle}>
                <div style={{ flex: 1, minWidth: 0 }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                    <strong style={{ color: '#e5e7eb' }}>{s.name}</strong>
                    {s.is_builtin && <span style={tagStyle}>built-in</span>}
                  </div>
                  {s.description && <div style={{ color: '#9ca3af', fontSize: 12, marginTop: 4 }}>{s.description}</div>}
                </div>
                <div style={{ color: '#22d3ee', fontWeight: 600, fontSize: 13, minWidth: 80, textAlign: 'right' }}>
                  {counts[s.id] != null ? `${counts[s.id]} recipients` : '…'}
                </div>
                <button onClick={() => editSegment(s)} style={smallBtn}>Edit</button>
                <button onClick={() => deleteSegment(s)} disabled={s.is_builtin} style={{ ...smallBtn, opacity: s.is_builtin ? 0.4 : 1 }}>Delete</button>
              </div>
            ))
          )}
        </div>
      </div>
    </div>
  );
}

const pageStyle = {
  minHeight: '100vh',
  background: 'radial-gradient(circle at 10% 20%, #0b1020, #050910 60%, #02060f)',
  color: '#e5e7eb',
  fontFamily: "'Inter', system-ui, -apple-system, sans-serif",
};
const crumbStyle = { marginBottom: 16, fontSize: 13 };
const crumbLinkStyle = { color: '#22d3ee', textDecoration: 'none', cursor: 'pointer' };
const titleStyle = { fontSize: 28, margin: '0 0 16px 0', color: '#f4f4f5' };
const cardStyle = {
  background: 'rgba(15,23,42,0.6)',
  border: '1px solid rgba(255,255,255,0.08)',
  borderRadius: 12,
  padding: 24,
  marginBottom: 16,
};
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
