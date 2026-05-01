import React, { useEffect, useState, useCallback } from 'react';
import { supabase } from '../../lib/supabase';
import { PageContainer, PageHeader, BackLink } from '../../components/Page';

// Drip automations admin. Minimal UI for v1: list + create + activate/deactivate
// + per-step quick editor. For richer composition, send a one-shot from the main
// /marketing page and copy the HTML over.

const TRIGGER_LABELS = {
  signup_welcome: 'Signup welcome (anchor: profile.created_at)',
  inactivity: 'Inactivity (anchor: last_practice_date)',
  level_reached: 'Level reached (anchor: now)',
};

export default function AutomationsPage() {
  const [list, setList] = useState(null);
  const [error, setError] = useState(null);
  const [editing, setEditing] = useState(null); // automation id or 'new'

  const reload = useCallback(async () => {
    const { data, error } = await supabase.rpc('marketing_automations_list');
    if (error) setError(error.message);
    else { setError(null); setList(data || []); }
  }, []);

  useEffect(() => { reload(); }, [reload]);

  async function toggleActive(a) {
    const { error } = await supabase.from('marketing_automations').update({ is_active: !a.is_active }).eq('id', a.id);
    if (error) alert(`Toggle failed: ${error.message}`);
    reload();
  }

  async function remove(a) {
    if (!window.confirm(`Delete automation "${a.name}"? All steps + run history will be deleted.`)) return;
    const { error } = await supabase.from('marketing_automations').delete().eq('id', a.id);
    if (error) alert(`Delete failed: ${error.message}`);
    reload();
  }

  return (
    <PageContainer width="narrow">
      <PageHeader
        backLink={<BackLink href="/admin/marketing">Marketing</BackLink>}
        title="Automations"
        subtitle="Behavior-triggered drip campaigns. The dispatcher runs every 15 minutes via pg_cron. Each (automation, step, user) is enforced unique — once a step has been sent to a user, it never sends again."
      />
      <div>

        {error && <div style={errBox}>Failed to load: {error}</div>}

        <div className="card">
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 12 }}>
            <h2 style={{ margin: 0, color: '#e5e7eb', fontSize: 16 }}>All automations</h2>
            <button onClick={() => setEditing('new')} style={btnPrimary}>+ New automation</button>
          </div>

          {!list && <div style={muted}>Loading…</div>}
          {list && list.length === 0 && <div style={muted}>No automations yet.</div>}

          {list?.map((a) => (
            <div key={a.id} style={row}>
              <div style={{ flex: 1, minWidth: 0 }}>
                <div style={{ color: '#e5e7eb', fontWeight: 600 }}>
                  {a.name}{' '}
                  <span style={{ color: a.is_active ? '#34d399' : '#9ca3af', fontWeight: 500, fontSize: 12 }}>
                    · {a.is_active ? 'active' : 'paused'}
                  </span>
                </div>
                <div style={{ color: '#9ca3af', fontSize: 12, marginTop: 2 }}>
                  {TRIGGER_LABELS[a.trigger_type] || a.trigger_type} ·{' '}
                  {a.step_count} step{a.step_count === 1 ? '' : 's'} ·{' '}
                  {a.runs_pending} pending · {a.runs_sent} sent
                  {a.runs_failed > 0 && <span style={{ color: '#fdba74' }}> · {a.runs_failed} failed</span>}
                </div>
              </div>
              <button onClick={() => toggleActive(a)} style={btnGhost}>{a.is_active ? 'Pause' : 'Activate'}</button>
              <button onClick={() => setEditing(a.id)} style={btnGhost}>Edit</button>
              <button onClick={() => remove(a)} style={btnDanger}>Delete</button>
            </div>
          ))}
        </div>

        {editing && (
          <AutomationEditor
            automationId={editing === 'new' ? null : editing}
            onClose={() => { setEditing(null); reload(); }}
          />
        )}
      </div>
    </PageContainer>
  );
}

function AutomationEditor({ automationId, onClose }) {
  const [name, setName] = useState('');
  const [triggerType, setTriggerType] = useState('signup_welcome');
  const [daysInactive, setDaysInactive] = useState(14);
  const [level, setLevel] = useState(5);
  const [isActive, setIsActive] = useState(false);
  const [steps, setSteps] = useState([]);
  const [loaded, setLoaded] = useState(automationId == null);
  const [busy, setBusy] = useState(false);

  useEffect(() => {
    if (automationId == null) return;
    (async () => {
      const { data: a } = await supabase.from('marketing_automations').select('*').eq('id', automationId).single();
      const { data: ss } = await supabase.from('marketing_automation_steps').select('*').eq('automation_id', automationId).order('step_order');
      if (a) {
        setName(a.name);
        setTriggerType(a.trigger_type);
        setIsActive(a.is_active);
        if (a.trigger_type === 'inactivity') setDaysInactive(a.trigger_config?.days_inactive ?? 14);
        if (a.trigger_type === 'level_reached') setLevel(a.trigger_config?.level ?? 5);
      }
      setSteps((ss ?? []).map((s) => ({ ...s, _persisted: true })));
      setLoaded(true);
    })();
  }, [automationId]);

  function addStep() {
    setSteps((prev) => [...prev, {
      id: `tmp_${Date.now()}_${prev.length}`,
      step_order: prev.length,
      delay_days: 0,
      subject: '',
      html: '<p>Hello {{first_name|"there"}}!</p>\n<p><a href="{{unsubscribe_url}}">Unsubscribe</a></p>',
      subject_ar: null, html_ar: null,
      category: 'product_updates',
      _persisted: false,
    }]);
  }
  function updateStep(idx, patch) {
    setSteps((prev) => prev.map((s, i) => i === idx ? { ...s, ...patch, _dirty: true } : s));
  }
  async function deleteStep(idx) {
    const s = steps[idx];
    if (s._persisted) {
      if (!window.confirm('Delete this step? Existing run history is preserved but no future runs will fire.')) return;
      const { error } = await supabase.from('marketing_automation_steps').delete().eq('id', s.id);
      if (error) { alert(error.message); return; }
    }
    setSteps((prev) => prev.filter((_, i) => i !== idx).map((s, i) => ({ ...s, step_order: i })));
  }

  async function save() {
    if (!name.trim()) { alert('Name required.'); return; }
    if (steps.length === 0) { alert('Add at least one step.'); return; }
    for (const s of steps) {
      if (!s.subject || !s.html) { alert('Every step needs a subject and html body.'); return; }
    }
    const trigger_config =
      triggerType === 'inactivity' ? { days_inactive: Number(daysInactive) || 14 }
      : triggerType === 'level_reached' ? { level: Number(level) || 5 }
      : {};

    setBusy(true);
    let aid = automationId;
    if (!aid) {
      const { data, error } = await supabase.from('marketing_automations').insert({
        name: name.trim(), trigger_type: triggerType, trigger_config, is_active: isActive,
      }).select('id').single();
      if (error) { setBusy(false); alert(error.message); return; }
      aid = data.id;
    } else {
      const { error } = await supabase.from('marketing_automations').update({
        name: name.trim(), trigger_type: triggerType, trigger_config, is_active: isActive,
      }).eq('id', aid);
      if (error) { setBusy(false); alert(error.message); return; }
    }

    for (let i = 0; i < steps.length; i++) {
      const s = steps[i];
      const payload = {
        automation_id: aid, step_order: i,
        delay_days: Number(s.delay_days) || 0,
        subject: s.subject, html: s.html,
        subject_ar: s.subject_ar || null, html_ar: s.html_ar || null,
        category: s.category || null,
      };
      if (s._persisted) {
        const { error } = await supabase.from('marketing_automation_steps').update(payload).eq('id', s.id);
        if (error) { setBusy(false); alert(`Step ${i}: ${error.message}`); return; }
      } else {
        const { error } = await supabase.from('marketing_automation_steps').insert(payload);
        if (error) { setBusy(false); alert(`Step ${i}: ${error.message}`); return; }
      }
    }
    setBusy(false);
    onClose();
  }

  if (!loaded) return <div className="card" style={{ marginTop: 16 }}><div style={muted}>Loading…</div></div>;

  return (
    <div className="card" style={{ marginTop: 16 }}>
      <h2 style={{ margin: '0 0 12px 0', color: '#e5e7eb', fontSize: 16 }}>
        {automationId ? 'Edit automation' : 'New automation'}
      </h2>

      <label style={lbl}>Name
        <input value={name} onChange={(e) => setName(e.target.value)} style={input} placeholder="Welcome series" />
      </label>

      <label style={lbl}>Trigger
        <select value={triggerType} onChange={(e) => setTriggerType(e.target.value)} style={input}>
          <option value="signup_welcome">Signup welcome</option>
          <option value="inactivity">Inactivity</option>
          <option value="level_reached">Level reached</option>
        </select>
      </label>

      {triggerType === 'inactivity' && (
        <label style={lbl}>Days inactive
          <input type="number" min={1} value={daysInactive} onChange={(e) => setDaysInactive(e.target.value)} style={input} />
        </label>
      )}
      {triggerType === 'level_reached' && (
        <label style={lbl}>Level threshold (≥)
          <input type="number" min={1} value={level} onChange={(e) => setLevel(e.target.value)} style={input} />
        </label>
      )}

      <label style={{ ...lbl, display: 'flex', alignItems: 'center', gap: 8 }}>
        <input type="checkbox" checked={isActive} onChange={(e) => setIsActive(e.target.checked)} />
        Active (the dispatcher will start enrolling users)
      </label>

      <div style={{ marginTop: 16 }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <h3 style={{ color: '#e5e7eb', margin: 0, fontSize: 14 }}>Steps</h3>
          <button onClick={addStep} style={btnGhost}>+ Add step</button>
        </div>
        {steps.length === 0 && <div style={muted}>No steps yet — add one to start.</div>}
        {steps.map((s, i) => (
          <div key={s.id} style={stepBox}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 8 }}>
              <strong style={{ color: '#22d3ee' }}>Step {i + 1}</strong>
              <span style={{ color: '#9ca3af', fontSize: 12 }}>fires at anchor + N days</span>
              <span style={{ flex: 1 }} />
              <button onClick={() => deleteStep(i)} style={btnDanger}>Remove</button>
            </div>
            <label style={lbl}>Delay (days from anchor)
              <input type="number" min={0} value={s.delay_days} onChange={(e) => updateStep(i, { delay_days: e.target.value })} style={input} />
            </label>
            <label style={lbl}>Category (optional, respects /preferences opt-out)
              <select value={s.category || ''} onChange={(e) => updateStep(i, { category: e.target.value || null })} style={input}>
                <option value="">— none —</option>
                <option value="product_updates">product_updates</option>
                <option value="training_tips">training_tips</option>
                <option value="promotions">promotions</option>
              </select>
            </label>
            <label style={lbl}>Subject (EN)
              <input value={s.subject} onChange={(e) => updateStep(i, { subject: e.target.value })} style={input} />
            </label>
            <label style={lbl}>HTML body (EN)
              <textarea value={s.html} onChange={(e) => updateStep(i, { html: e.target.value })} style={textarea} rows={8} />
            </label>
            <label style={lbl}>Subject (AR, optional)
              <input value={s.subject_ar || ''} onChange={(e) => updateStep(i, { subject_ar: e.target.value || null })} style={{ ...input, direction: 'rtl', textAlign: 'right' }} dir="rtl" />
            </label>
            <label style={lbl}>HTML body (AR, optional)
              <textarea value={s.html_ar || ''} onChange={(e) => updateStep(i, { html_ar: e.target.value || null })} style={{ ...textarea, direction: 'rtl' }} dir="rtl" rows={8} />
            </label>
          </div>
        ))}
      </div>

      <div style={{ display: 'flex', gap: 8, marginTop: 16 }}>
        <button onClick={save} disabled={busy} style={btnPrimary}>{busy ? 'Saving…' : 'Save'}</button>
        <button onClick={onClose} disabled={busy} style={btnGhost}>Cancel</button>
      </div>
    </div>
  );
}

const row = { display: 'flex', gap: 8, alignItems: 'center', padding: '12px 0', borderBottom: '1px solid rgba(255,255,255,0.04)' };
const stepBox = { padding: 12, marginTop: 12, border: '1px solid rgba(255,255,255,0.08)', borderRadius: 8, background: 'rgba(255,255,255,0.02)' };
const lbl = { display: 'block', color: '#cbd5e1', fontSize: 13, marginTop: 8 };
const input = { width: '100%', padding: '8px 10px', borderRadius: 6, marginTop: 4, fontSize: 13, background: 'rgba(255,255,255,0.04)', color: '#e5e7eb', border: '1px solid rgba(255,255,255,0.12)', boxSizing: 'border-box' };
const textarea = { ...input, fontFamily: 'monospace', fontSize: 12 };
const muted = { color: '#9ca3af', fontSize: 13, padding: 8, fontStyle: 'italic' };
const errBox = { padding: 12, background: 'rgba(230,57,70,0.1)', border: '1px solid rgba(230,57,70,0.3)', borderRadius: 8, color: '#fca5a5', fontSize: 13, marginBottom: 12 };
const btnBase = { padding: '8px 14px', fontSize: 12, fontWeight: 600, borderRadius: 6, cursor: 'pointer' };
const btnPrimary = { ...btnBase, background: 'linear-gradient(135deg,#2563eb,#22d3ee)', color: '#0b1020', border: 'none' };
const btnGhost = { ...btnBase, background: 'rgba(255,255,255,0.04)', color: '#e5e7eb', border: '1px solid rgba(255,255,255,0.12)' };
const btnDanger = { ...btnBase, background: 'rgba(230,57,70,0.12)', color: '#fca5a5', border: '1px solid rgba(230,57,70,0.4)' };
