import React, { useEffect, useState, useCallback } from 'react';
import { useTranslation } from 'react-i18next';
import { toast } from 'sonner';
import { supabase } from '../../lib/supabase';
import { useConfirm } from '../../components/ConfirmProvider';
import { PageContainer, PageHeader, BackLink } from '../../components/Page';

// Drip automations admin. Minimal UI for v1: list + create + activate/deactivate
// + per-step quick editor. For richer composition, send a one-shot from the main
// /marketing page and copy the HTML over.

export default function AutomationsPage() {
  const { t } = useTranslation();
  const confirmDialog = useConfirm();
  const [list, setList] = useState(null);
  const [editing, setEditing] = useState(null); // automation id or 'new'

  const reload = useCallback(async () => {
    const { data, error } = await supabase.rpc('marketing_automations_list');
    if (error) toast.error(t('admin.common.failedToLoad', { error: error.message }));
    else setList(data || []);
  }, [t]);

  useEffect(() => { reload(); }, [reload]);

  async function toggleActive(a) {
    const { error } = await supabase.from('marketing_automations').update({ is_active: !a.is_active }).eq('id', a.id);
    if (error) toast.error(t('admin.automations.toggleFailed', { error: error.message }));
    reload();
  }

  async function remove(a) {
    const ok = await confirmDialog({
      title: t('admin.automations.deleteTitle'),
      message: t('admin.automations.deleteMessage', { name: a.name }),
      confirmLabel: t('admin.automations.delete'),
      danger: true,
    });
    if (!ok) return;
    const { error } = await supabase.from('marketing_automations').delete().eq('id', a.id);
    if (error) toast.error(t('admin.automations.deleteFailed', { error: error.message }));
    else toast.success(t('admin.automations.deletedToast'));
    reload();
  }

  return (
    <PageContainer width="narrow">
      <PageHeader
        backLink={<BackLink href="/marketing">{t('admin.common.marketing')}</BackLink>}
        title={t('admin.automations.title')}
        subtitle={t('admin.automations.subtitle')}
      />
      <div>

        <div className="card">
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 12 }}>
            <h2 style={{ margin: 0, color: '#e5e7eb', fontSize: 16 }}>{t('admin.automations.allTitle')}</h2>
            <button onClick={() => setEditing('new')} style={btnPrimary}>{t('admin.automations.newButton')}</button>
          </div>

          {!list && <div style={muted}>{t('admin.common.loading')}</div>}
          {list && list.length === 0 && <div style={muted}>{t('admin.automations.empty')}</div>}

          {list?.map((a) => (
            <div key={a.id} style={row}>
              <div style={{ flex: 1, minWidth: 0 }}>
                <div style={{ color: '#e5e7eb', fontWeight: 600 }}>
                  {a.name}{' '}
                  <span style={{ color: a.is_active ? '#34d399' : '#9ca3af', fontWeight: 500, fontSize: 12 }}>
                    · {a.is_active ? t('admin.automations.active') : t('admin.automations.paused')}
                  </span>
                </div>
                <div style={{ color: '#9ca3af', fontSize: 12, marginTop: 2 }}>
                  {t(`admin.automations.triggers.${a.trigger_type}`, { defaultValue: a.trigger_type })} ·{' '}
                  {t('admin.automations.stepCount', { count: a.step_count })} ·{' '}
                  {t('admin.automations.runsPending', { count: a.runs_pending })} · {t('admin.automations.runsSent', { count: a.runs_sent })}
                  {a.runs_failed > 0 && <span style={{ color: '#fdba74' }}> · {t('admin.automations.runsFailed', { count: a.runs_failed })}</span>}
                </div>
              </div>
              <button onClick={() => toggleActive(a)} style={btnGhost}>{a.is_active ? t('admin.automations.pause') : t('admin.automations.activate')}</button>
              <button onClick={() => setEditing(a.id)} style={btnGhost}>{t('admin.automations.edit')}</button>
              <button onClick={() => remove(a)} style={btnDanger}>{t('admin.automations.delete')}</button>
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
  const { t } = useTranslation();
  const confirmDialog = useConfirm();
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
      const ok = await confirmDialog({
        title: t('admin.automations.editor.deleteStepTitle'),
        message: t('admin.automations.editor.deleteStepMessage'),
        confirmLabel: t('admin.automations.delete'),
        danger: true,
      });
      if (!ok) return;
      const { error } = await supabase.from('marketing_automation_steps').delete().eq('id', s.id);
      if (error) { toast.error(error.message); return; }
    }
    setSteps((prev) => prev.filter((_, i) => i !== idx).map((s, i) => ({ ...s, step_order: i })));
  }

  async function save() {
    if (!name.trim()) { toast.error(t('admin.automations.editor.nameRequired')); return; }
    if (steps.length === 0) { toast.error(t('admin.automations.editor.atLeastOneStep')); return; }
    for (const s of steps) {
      if (!s.subject || !s.html) { toast.error(t('admin.automations.editor.stepNeedsBody')); return; }
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
      if (error) { setBusy(false); toast.error(error.message); return; }
      aid = data.id;
    } else {
      const { error } = await supabase.from('marketing_automations').update({
        name: name.trim(), trigger_type: triggerType, trigger_config, is_active: isActive,
      }).eq('id', aid);
      if (error) { setBusy(false); toast.error(error.message); return; }
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
        if (error) { setBusy(false); toast.error(t('admin.automations.editor.stepError', { n: i, error: error.message })); return; }
      } else {
        const { error } = await supabase.from('marketing_automation_steps').insert(payload);
        if (error) { setBusy(false); toast.error(t('admin.automations.editor.stepError', { n: i, error: error.message })); return; }
      }
    }
    setBusy(false);
    toast.success(t('admin.automations.editor.savedToast'));
    onClose();
  }

  if (!loaded) return <div className="card" style={{ marginTop: 16 }}><div style={muted}>{t('admin.common.loading')}</div></div>;

  return (
    <div className="card" style={{ marginTop: 16 }}>
      <h2 style={{ margin: '0 0 12px 0', color: '#e5e7eb', fontSize: 16 }}>
        {automationId ? t('admin.automations.editor.editTitle') : t('admin.automations.editor.newTitle')}
      </h2>

      <label style={lbl}>{t('admin.automations.editor.nameLabel')}
        <input value={name} onChange={(e) => setName(e.target.value)} style={input} placeholder={t('admin.automations.editor.namePlaceholder')} />
      </label>

      <label style={lbl}>{t('admin.automations.editor.triggerLabel')}
        <select value={triggerType} onChange={(e) => setTriggerType(e.target.value)} style={input}>
          <option value="signup_welcome">{t('admin.automations.editor.triggerSignup')}</option>
          <option value="inactivity">{t('admin.automations.editor.triggerInactivity')}</option>
          <option value="level_reached">{t('admin.automations.editor.triggerLevel')}</option>
        </select>
      </label>

      {triggerType === 'inactivity' && (
        <label style={lbl}>{t('admin.automations.editor.daysInactiveLabel')}
          <input type="number" min={1} value={daysInactive} onChange={(e) => setDaysInactive(e.target.value)} style={input} />
        </label>
      )}
      {triggerType === 'level_reached' && (
        <label style={lbl}>{t('admin.automations.editor.levelThresholdLabel')}
          <input type="number" min={1} value={level} onChange={(e) => setLevel(e.target.value)} style={input} />
        </label>
      )}

      <label style={{ ...lbl, display: 'flex', alignItems: 'center', gap: 8 }}>
        <input type="checkbox" checked={isActive} onChange={(e) => setIsActive(e.target.checked)} />
        {t('admin.automations.editor.activeLabel')}
      </label>

      <div style={{ marginTop: 16 }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <h3 style={{ color: '#e5e7eb', margin: 0, fontSize: 14 }}>{t('admin.automations.editor.stepsTitle')}</h3>
          <button onClick={addStep} style={btnGhost}>{t('admin.automations.editor.addStep')}</button>
        </div>
        {steps.length === 0 && <div style={muted}>{t('admin.automations.editor.noStepsYet')}</div>}
        {steps.map((s, i) => (
          <div key={s.id} style={stepBox}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 8 }}>
              <strong style={{ color: '#22d3ee' }}>{t('admin.automations.editor.stepNumber', { n: i + 1 })}</strong>
              <span style={{ color: '#9ca3af', fontSize: 12 }}>{t('admin.automations.editor.stepFires')}</span>
              <span style={{ flex: 1 }} />
              <button onClick={() => deleteStep(i)} style={btnDanger}>{t('admin.automations.editor.remove')}</button>
            </div>
            <label style={lbl}>{t('admin.automations.editor.delayLabel')}
              <input type="number" min={0} value={s.delay_days} onChange={(e) => updateStep(i, { delay_days: e.target.value })} style={input} />
            </label>
            <label style={lbl}>{t('admin.automations.editor.categoryLabel')}
              <select value={s.category || ''} onChange={(e) => updateStep(i, { category: e.target.value || null })} style={input}>
                <option value="">{t('admin.automations.editor.categoryNone')}</option>
                <option value="product_updates">{t('admin.categories.product_updates')}</option>
                <option value="training_tips">{t('admin.categories.training_tips')}</option>
                <option value="promotions">{t('admin.categories.promotions')}</option>
              </select>
            </label>
            <label style={lbl}>{t('admin.automations.editor.subjectEn')}
              <input value={s.subject} onChange={(e) => updateStep(i, { subject: e.target.value })} style={input} />
            </label>
            <label style={lbl}>{t('admin.automations.editor.htmlEn')}
              <textarea value={s.html} onChange={(e) => updateStep(i, { html: e.target.value })} style={textarea} rows={8} />
            </label>
            <label style={lbl}>{t('admin.automations.editor.subjectAr')}
              <input value={s.subject_ar || ''} onChange={(e) => updateStep(i, { subject_ar: e.target.value || null })} style={{ ...input, direction: 'rtl', textAlign: 'right' }} dir="rtl" />
            </label>
            <label style={lbl}>{t('admin.automations.editor.htmlAr')}
              <textarea value={s.html_ar || ''} onChange={(e) => updateStep(i, { html_ar: e.target.value || null })} style={{ ...textarea, direction: 'rtl' }} dir="rtl" rows={8} />
            </label>
          </div>
        ))}
      </div>

      <div style={{ display: 'flex', gap: 8, marginTop: 16 }}>
        <button onClick={save} disabled={busy} style={btnPrimary}>
          {busy ? t('admin.automations.editor.savingButton') : t('admin.automations.editor.saveButton')}
        </button>
        <button onClick={onClose} disabled={busy} style={btnGhost}>{t('common.cancel')}</button>
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
const btnBase = { padding: '8px 14px', fontSize: 12, fontWeight: 600, borderRadius: 6, cursor: 'pointer' };
const btnPrimary = { ...btnBase, background: 'linear-gradient(135deg,#2563eb,#22d3ee)', color: '#0b1020', border: 'none' };
const btnGhost = { ...btnBase, background: 'rgba(255,255,255,0.04)', color: '#e5e7eb', border: '1px solid rgba(255,255,255,0.12)' };
const btnDanger = { ...btnBase, background: 'rgba(230,57,70,0.12)', color: '#fca5a5', border: '1px solid rgba(230,57,70,0.4)' };
