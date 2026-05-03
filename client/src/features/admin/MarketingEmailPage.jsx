import React, { useEffect, useState, useMemo } from 'react';
import { Link } from 'wouter';
import { useTranslation } from 'react-i18next';
import { toast } from 'sonner';
import { supabase } from '../../lib/supabase';
import { useAuth } from '../../lib/AuthContext';
import { useConfirm } from '../../components/ConfirmProvider';
import BlockComposer from './marketing/BlockComposer.jsx';
import { defaultBlocks, validateBlocks } from './marketing/blocks.js';
import { renderEmailHtml } from './marketing/renderEmail.jsx';
import RecentCampaignsPanel from './marketing/RecentCampaignsPanel.jsx';
import { PageContainer, PageHeader, BackLink } from '../../components/Page';
import ScheduledCampaignsPanel from './marketing/ScheduledCampaignsPanel.jsx';
import TemplatesPanel from './marketing/TemplatesPanel.jsx';
import SuppressionsPanel from './marketing/SuppressionsPanel.jsx';

const TEST_ADDR_KEY = 'versa_marketing_saved_test_addresses';
function loadSavedTestAddresses() {
  try { return JSON.parse(localStorage.getItem(TEST_ADDR_KEY) || '[]'); } catch { return []; }
}
function saveTestAddresses(arr) {
  try { localStorage.setItem(TEST_ADDR_KEY, JSON.stringify(arr.slice(0, 20))); } catch {}
}

// "Dirty" = admin has edited the buffer beyond the seed defaults. Used to
// decide whether toggling modes deserves a confirm dialog: a fresh, unedited
// buffer can be swapped silently; one with real work shouldn't surprise.
function isBlocksDirty(blocks) {
  const fresh = defaultBlocks();
  if (!Array.isArray(blocks) || blocks.length !== fresh.length) return true;
  for (let i = 0; i < fresh.length; i++) {
    const a = blocks[i];
    const b = fresh[i];
    if (!a || a.type !== b.type) return true;
    if (a.text !== b.text) return true;
    if (b.type === 'button' && a.href !== b.href) return true;
    if (b.type === 'image' && (a.src !== b.src || a.alt !== b.alt)) return true;
    if (b.type === 'spacer' && a.height !== b.height) return true;
    if (b.type === 'heading' && (a.level !== b.level || a.align !== b.align)) return true;
  }
  return false;
}

import { applyMergeTags, recipientToVars, MERGE_TAGS, findUnknownTags } from './marketing/mergeTags.js';

const FUNCTION_URL = `${import.meta.env.VITE_SUPABASE_URL}/functions/v1/send-marketing-email`;

const TEMPLATE_LAUNCH = `<!DOCTYPE html>
<html>
<body style="margin:0;padding:0;background:#f9fafb;font-family:Inter,Arial,sans-serif">
  <table width="100%" cellpadding="0" cellspacing="0" style="background:#f9fafb;padding:40px 16px">
    <tr><td align="center">
      <table width="560" cellpadding="0" cellspacing="0" style="background:#ffffff;border-radius:12px;overflow:hidden;box-shadow:0 4px 12px rgba(0,0,0,0.05)">
        <tr><td style="padding:32px 32px 16px 32px">
          <h1 style="margin:0 0 8px 0;font-size:24px;color:#111827">We're launching!</h1>
          <p style="margin:0;font-size:14px;color:#6b7280">Versa Footy is here</p>
        </td></tr>
        <tr><td style="padding:0 32px 24px 32px;color:#374151;font-size:16px;line-height:1.6">
          <p>Hey there,</p>
          <p>The wait is over. Versa Footy is officially live — your kid's personalized football training app.</p>
          <p>Tap below to start training:</p>
          <p style="text-align:center;margin:32px 0">
            <a href="https://versafooty.com" style="background:#E63946;color:#ffffff;text-decoration:none;padding:14px 28px;border-radius:8px;font-weight:600;display:inline-block">Open Versa Footy</a>
          </p>
          <p>If you have feedback, just hit reply — we read every message.</p>
          <p>— The Versa Footy team</p>
        </td></tr>
      </table>
      <p style="font-size:12px;color:#9ca3af;margin-top:24px">
        You're receiving this because you signed up at versafooty.com.<br/>
        <a href="{{unsubscribe_url}}" style="color:#9ca3af;text-decoration:underline">Unsubscribe</a>
      </p>
    </td></tr>
  </table>
</body>
</html>`;

export default function MarketingEmailPage() {
  const { t } = useTranslation();
  const { user } = useAuth();
  const confirmDialog = useConfirm();
  const [mode, setMode] = useState('blocks'); // 'blocks' | 'html'
  const [subject, setSubject] = useState('Versa Footy is launching today');
  const [html, setHtml] = useState(TEMPLATE_LAUNCH);
  const [blocks, setBlocks] = useState(() => defaultBlocks());
  const [audience, setAudience] = useState('test');
  const [category, setCategory] = useState('product_updates');
  const [segmentId, setSegmentId] = useState('');
  const [segments, setSegments] = useState([]);
  const [segmentCounts, setSegmentCounts] = useState({});
  const [testRecipient, setTestRecipient] = useState(user?.email || '');
  const [counts, setCounts] = useState(null);
  const [sending, setSending] = useState(false);
  const [showPreview, setShowPreview] = useState(false);
  const [renderedHtml, setRenderedHtml] = useState('');
  const [sampleRecipient, setSampleRecipient] = useState(null);
  const [sendMode, setSendMode] = useState('now'); // 'now' | 'schedule'
  const [scheduledFor, setScheduledFor] = useState(''); // datetime-local string, browser TZ
  const [scheduleRefresh, setScheduleRefresh] = useState(0);
  const [recentRefresh, setRecentRefresh] = useState(0);
  // Arabic variant (E). Mode is shared between EN and AR; only subject/body differ.
  const [enableAr, setEnableAr] = useState(false);
  const [langTab, setLangTab] = useState('en'); // 'en' | 'ar'
  const [subjectAr, setSubjectAr] = useState('');
  const [blocksAr, setBlocksAr] = useState(() => defaultBlocks());
  const [htmlAr, setHtmlAr] = useState('');
  const [renderedHtmlAr, setRenderedHtmlAr] = useState('');
  const [testLocale, setTestLocale] = useState('en');
  const [savedTestAddresses, setSavedTestAddresses] = useState(() => loadSavedTestAddresses());

  useEffect(() => {
    if (user?.email && !testRecipient) setTestRecipient(user.email);
  }, [user]);

  useEffect(() => {
    (async () => {
      const { data, error } = await supabase.rpc('marketing_audience_counts');
      if (!error && data) setCounts(data);
    })();
  }, []);

  // Load active segments + their live counts.
  useEffect(() => {
    let cancelled = false;
    (async () => {
      const { data } = await supabase.from('marketing_segments').select('id, name, filter, is_active').eq('is_active', true).order('name');
      if (cancelled || !data) return;
      setSegments(data);
      if (data[0] && !segmentId) setSegmentId(data[0].id);
      const next = {};
      for (const s of data) {
        const { data: c } = await supabase.rpc('marketing_segment_count', { p_filter: s.filter });
        if (cancelled) return;
        next[s.id] = c;
      }
      setSegmentCounts(next);
    })();
    return () => { cancelled = true; };
  }, []);

  // Re-render block-mode HTML whenever blocks change.
  useEffect(() => {
    if (mode !== 'blocks') return;
    let cancelled = false;
    (async () => {
      try {
        const result = await renderEmailHtml(blocks);
        if (!cancelled) setRenderedHtml(result);
      } catch (e) {
        if (!cancelled) toast.error(t('admin.email.errors.renderFailed', { error: e?.message || e }));
      }
    })();
    return () => { cancelled = true; };
  }, [blocks, mode, t]);

  // Same for the AR variant.
  useEffect(() => {
    if (mode !== 'blocks' || !enableAr) return;
    let cancelled = false;
    (async () => {
      try {
        const result = await renderEmailHtml(blocksAr);
        if (!cancelled) setRenderedHtmlAr(result);
      } catch (e) {
        if (!cancelled) toast.error(t('admin.email.errors.renderFailedAr', { error: e?.message || e }));
      }
    })();
    return () => { cancelled = true; };
  }, [blocksAr, mode, enableAr, t]);

  // Fetch a sample recipient for the merge preview when the audience changes.
  useEffect(() => {
    let cancelled = false;
    if (audience === 'test') { setSampleRecipient(null); return; }
    (async () => {
      const { data, error } = await supabase.rpc('marketing_sample_recipient', {
        p_audience: audience,
        p_segment_id: audience === 'segment' ? (segmentId || null) : null,
      });
      if (cancelled) return;
      if (error) setSampleRecipient(null);
      else setSampleRecipient(data || null);
    })();
    return () => { cancelled = true; };
  }, [audience, segmentId]);

  // Active-tab routing: when AR is enabled and user is editing AR, the subject
  // input + composer + preview all reflect the AR variant.
  const isAr = enableAr && langTab === 'ar';
  const activeSubject = isAr ? subjectAr : subject;
  const setActiveSubject = isAr ? setSubjectAr : setSubject;
  const activeBlocks = isAr ? blocksAr : blocks;
  const setActiveBlocks = isAr ? setBlocksAr : setBlocks;
  const activeRawHtml = isAr ? htmlAr : html;
  const setActiveRawHtml = isAr ? setHtmlAr : setHtml;

  // The HTML that will actually be sent for each variant (template, before per-recipient merge).
  const outgoingHtml = mode === 'blocks' ? renderedHtml : html;
  const outgoingHtmlAr = mode === 'blocks' ? renderedHtmlAr : htmlAr;
  const activeOutgoingHtml = isAr ? outgoingHtmlAr : outgoingHtml;

  // Preview values: use the sample recipient's vars; for tests, leave vars empty (fallbacks shown).
  const previewVars = useMemo(() => recipientToVars(sampleRecipient), [sampleRecipient]);
  const previewSubject = applyMergeTags(activeSubject, previewVars);
  const previewHtml = applyMergeTags(activeOutgoingHtml, previewVars, { encode: 'html' }).replaceAll('{{unsubscribe_url}}', '#preview-unsubscribe');
  const unknownTags = useMemo(
    () => Array.from(new Set([
      ...findUnknownTags(subject), ...findUnknownTags(outgoingHtml),
      ...(enableAr ? [...findUnknownTags(subjectAr), ...findUnknownTags(outgoingHtmlAr)] : []),
    ])),
    [subject, outgoingHtml, enableAr, subjectAr, outgoingHtmlAr]
  );

  // Live list of every reason the Send button is gated. Surfaced inline so
  // admins can see what's missing instead of staring at a disabled button.
  const sendIssues = useMemo(() => {
    const issues = [];
    if (!subject.trim()) issues.push(t('admin.email.validation.subjectMissing'));
    if (!outgoingHtml) issues.push(t('admin.email.validation.bodyMissing'));
    if (audience === 'test' && !testRecipient) {
      issues.push(t('admin.email.validation.testRecipientMissing'));
    }
    if (sendMode === 'schedule' && audience !== 'test' && !scheduledFor) {
      issues.push(t('admin.email.errors.pickDateTime'));
    }
    if (enableAr) {
      if (!subjectAr.trim()) issues.push(t('admin.email.validation.arSubjectMissing'));
      if (!outgoingHtmlAr) issues.push(t('admin.email.validation.arBodyMissing'));
    }
    if (mode === 'blocks') {
      issues.push(...validateBlocks(blocks));
      if (enableAr) {
        for (const issue of validateBlocks(blocksAr)) {
          issues.push(t('admin.email.errors.arPrefix', { issues: issue }));
        }
      }
    }
    // Recipient count: only flag once counts have loaded so we don't show a
    // false positive while the audience RPC is still in flight.
    if (audience !== 'test' && counts) {
      const recipientCount = audience === 'subscribers' ? counts.subscribers
        : audience === 'segment' ? (segmentCounts[segmentId] ?? 0)
        : audience === 'all_users' ? counts.all_users
        : counts.opted_in_users;
      if (recipientCount === 0) issues.push(t('admin.email.errors.noRecipients'));
    }
    return issues;
  }, [
    subject, outgoingHtml, audience, testRecipient, sendMode, scheduledFor,
    enableAr, subjectAr, outgoingHtmlAr, mode, blocks, blocksAr,
    counts, segmentCounts, segmentId, t,
  ]);

  // Toggle the editor mode. Both buffers (blocks + html) live in state in
  // parallel, so swapping never destroys content — but "what's about to send"
  // changes, so confirm if the active buffer has real edits.
  async function handleModeToggle(targetMode) {
    if (mode === targetMode) return;
    const activeDirty = mode === 'blocks'
      ? (isBlocksDirty(blocks) || (enableAr && isBlocksDirty(blocksAr)))
      : ((html.trim() !== '' && html !== TEMPLATE_LAUNCH) || (enableAr && htmlAr.trim() !== ''));
    if (activeDirty) {
      const ok = await confirmDialog({
        title: t('admin.email.modeSwitch.title', {
          target: targetMode === 'blocks' ? t('admin.email.modeBlocks') : t('admin.email.modeHtml'),
        }),
        message: t('admin.email.modeSwitch.message', {
          current: mode === 'blocks' ? t('admin.email.modeBlocks') : t('admin.email.modeHtml'),
        }),
        confirmLabel: t('admin.email.modeSwitch.confirm', {
          target: targetMode === 'blocks' ? t('admin.email.modeBlocks') : t('admin.email.modeHtml'),
        }),
      });
      if (!ok) return;
    }
    setMode(targetMode);
  }

  async function handleSend() {
    const recipientCount = audience === 'test' ? 1
      : audience === 'subscribers' ? (counts?.subscribers ?? 0)
      : audience === 'segment' ? (segmentCounts[segmentId] ?? 0)
      : audience === 'all_users' ? (counts?.all_users ?? 0)
      : (counts?.opted_in_users ?? 0);

    if (recipientCount === 0) {
      toast.error(t('admin.email.errors.noRecipients'));
      return;
    }

    const isSchedule = sendMode === 'schedule' && audience !== 'test';
    let scheduledISO = null;
    if (isSchedule) {
      if (!scheduledFor) { toast.error(t('admin.email.errors.pickDateTime')); return; }
      const dt = new Date(scheduledFor);
      if (isNaN(dt.getTime())) { toast.error(t('admin.email.errors.invalidDate')); return; }
      if (dt <= new Date()) { toast.error(t('admin.email.errors.futureDate')); return; }
      scheduledISO = dt.toISOString();
    }

    // Large sends require typing "SEND" — same modal pattern as smaller sends, just gated.
    // The magic word stays literal English so ops procedures are stable across locales.
    const isLargeSend = audience !== 'test' && recipientCount > 100 && !isSchedule;
    const costEst = (recipientCount * 0.0004).toFixed(2);
    const confirmTitle = audience === 'test'
      ? t('admin.email.confirm.testTitle')
      : isSchedule
        ? t('admin.email.confirm.scheduleTitle')
        : t('admin.email.confirm.campaignTitle');
    const confirmMsg = audience === 'test'
      ? t('admin.email.confirm.testMessage', { email: testRecipient })
      : isSchedule
        ? t('admin.email.confirm.scheduleMessage', { count: recipientCount, when: new Date(scheduledISO).toLocaleString() })
        : isLargeSend
          ? t('admin.email.confirm.campaignMessageLargeSend', { count: recipientCount, cost: costEst })
          : audience === 'subscribers'
            ? t('admin.email.confirm.campaignMessageSubscribers', { count: recipientCount })
            : t('admin.email.confirm.campaignMessageOptedIn', { count: recipientCount });
    const ok = await confirmDialog({
      title: confirmTitle,
      message: confirmMsg,
      confirmLabel: isSchedule ? t('admin.email.confirm.schedule') : t('admin.email.confirm.send'),
      danger: !isSchedule && audience !== 'test',
      requireConfirmText: isLargeSend ? 'SEND' : undefined,
    });
    if (!ok) return;

    if (mode === 'blocks') {
      const issues = validateBlocks(blocks);
      if (issues.length > 0) {
        toast.error(issues.join(' '));
        return;
      }
      if (enableAr) {
        const issuesAr = validateBlocks(blocksAr);
        if (issuesAr.length > 0) { toast.error(t('admin.email.errors.arPrefix', { issues: issuesAr.join(' ') })); return; }
      }
    }
    if (enableAr && (!subjectAr || (mode === 'html' && !htmlAr))) {
      toast.error(t('admin.email.errors.missingArVariant'));
      return;
    }

    setSending(true);
    try {
      const sendHtml = mode === 'blocks' ? await renderEmailHtml(blocks) : html;
      const sendHtmlAr = enableAr ? (mode === 'blocks' ? await renderEmailHtml(blocksAr) : htmlAr) : null;
      const sendSubjectAr = enableAr ? subjectAr : null;

      if (isSchedule) {
        const { data, error: rpcErr } = await supabase.rpc('marketing_schedule_campaign', {
          p_subject: subject,
          p_html: sendHtml,
          p_audience: audience,
          p_scheduled_for: scheduledISO,
          p_segment_id: audience === 'segment' ? segmentId : null,
          p_category: (audience === 'opted_in_users' || audience === 'all_users' || audience === 'segment') ? category : null,
          p_test_recipient: null,
          p_subject_ar: sendSubjectAr,
          p_html_ar: sendHtmlAr,
        });
        if (rpcErr) toast.error(rpcErr.message);
        else {
          toast.success(
            t('admin.email.scheduledToast', { when: new Date(scheduledISO).toLocaleString(), id: data }),
          );
          setScheduleRefresh((n) => n + 1);
        }
        setSending(false);
        return;
      }

      const { data: { session } } = await supabase.auth.getSession();
      if (!session) {
        toast.error(t('admin.email.errors.notAuthenticated'));
        setSending(false);
        return;
      }

      const res = await fetch(FUNCTION_URL, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${session.access_token}`,
        },
        body: JSON.stringify({
          subject,
          html: sendHtml,
          audience,
          testRecipient: audience === 'test' ? testRecipient : undefined,
          testLocale: audience === 'test' && enableAr ? testLocale : undefined,
          // Category only applies to user audiences (subscribers/test bypass it server-side).
          category: (audience === 'opted_in_users' || audience === 'all_users' || audience === 'segment') ? category : undefined,
          segmentId: audience === 'segment' ? segmentId : undefined,
          subject_ar: sendSubjectAr ?? undefined,
          html_ar: sendHtmlAr ?? undefined,
        }),
      });

      const body = await res.json();
      if (!res.ok || !body.ok) {
        toast.error(body.error || `HTTP ${res.status}`);
      } else {
        toast.success(
          t('admin.email.sentToast', {
            success: body.successful,
            failed: body.failed,
            total: body.totalRecipients,
            id: body.campaignId,
          }),
        );
        setRecentRefresh((n) => n + 1);
      }
    } catch (e) {
      toast.error(e?.message || String(e));
    } finally {
      setSending(false);
    }
  }

  return (
    <PageContainer width="narrow">
      <PageHeader
        backLink={<BackLink href="/library">{t('admin.common.library')}</BackLink>}
        title={t('admin.email.title')}
        subtitle={
          <>
            {t('admin.email.subtitle')}{' '}
            <Link href="/marketing/segments"><a style={{ color: '#22d3ee', textDecoration: 'none' }}>{t('admin.email.subtitleSegments')}</a></Link>
            {' · '}
            <Link href="/marketing/automations"><a style={{ color: '#22d3ee', textDecoration: 'none' }}>{t('admin.email.subtitleAutomations')}</a></Link>
          </>
        }
      />
      <div>

        <div className="card card--lg">
          <label style={labelStyle}>
            {t('admin.email.templatesLabel')}
            <span style={hintStyle}>
              {t('admin.email.templatesHint')}
            </span>
            <TemplatesPanel
              currentSubject={subject}
              currentMode={mode}
              currentBlocks={blocks}
              currentHtml={html}
              onLoad={({ subject: s, mode: m, blocks: b, html: h }) => {
                setSubject(s);
                setMode(m);
                // Only populate the mode the template targets. The inactive
                // mode is left as-is so admins don't lose draft work in the
                // other buffer when they load a template. (Toggle confirm
                // catches accidental swaps.)
                if (m === 'blocks') setBlocks(b || defaultBlocks());
                else setHtml(h ?? '');
              }}
            />
          </label>

          <label style={labelStyle}>
            {t('admin.email.audienceLabel')}
            <div style={radioGroupStyle}>
              <RadioOption
                value="test"
                checked={audience === 'test'}
                onChange={setAudience}
                label={t('admin.email.audience.test')}
                count={t('admin.common.recipients', { count: 1 })}
              />
              <RadioOption
                value="subscribers"
                checked={audience === 'subscribers'}
                onChange={setAudience}
                label={t('admin.email.audience.subscribers')}
                count={counts ? t('admin.common.recipients', { count: counts.subscribers }) : '...'}
              />
              <RadioOption
                value="opted_in_users"
                checked={audience === 'opted_in_users'}
                onChange={setAudience}
                label={t('admin.email.audience.opted_in_users')}
                count={counts ? t('admin.common.recipients', { count: counts.opted_in_users }) : '...'}
              />
              <RadioOption
                value="all_users"
                checked={audience === 'all_users'}
                onChange={setAudience}
                label={t('admin.email.audience.all_users')}
                count={counts ? t('admin.common.recipients', { count: counts.all_users }) : '...'}
                warn
              />
              <RadioOption
                value="segment"
                checked={audience === 'segment'}
                onChange={setAudience}
                label={t('admin.email.audience.segment')}
                count={segments.length === 0 ? t('admin.email.noSegments') : t('admin.email.segmentsAvailable', { count: segments.length })}
              />
            </div>
            {audience === 'segment' && (
              <div style={{ marginTop: 12, display: 'flex', gap: 8, alignItems: 'center', flexWrap: 'wrap' }}>
                <select value={segmentId} onChange={(e) => setSegmentId(e.target.value)} style={inputStyle}>
                  {segments.map((s) => (
                    <option key={s.id} value={s.id}>
                      {s.name} {segmentCounts[s.id] != null ? t('admin.email.segmentRecipients', { count: segmentCounts[s.id] }) : ''}
                    </option>
                  ))}
                </select>
                <Link href="/marketing/segments"><a style={{ color: '#22d3ee', fontSize: 12, textDecoration: 'none' }}>{t('admin.email.manageSegments')}</a></Link>
              </div>
            )}
          </label>

          {(audience === 'opted_in_users' || audience === 'all_users' || audience === 'segment') && (
            <label style={labelStyle}>
              {t('admin.email.categoryLabel')}
              <span style={hintStyle}>
                {t('admin.email.categoryHint')}
                {audience === 'all_users' && (
                  <> <span style={{ color: '#fdba74' }}>{t('admin.email.categoryAllUsersWarn')}</span></>
                )}
              </span>
              <select value={category} onChange={(e) => setCategory(e.target.value)} style={inputStyle}>
                <option value="product_updates">{t('admin.categories.product_updates')}</option>
                <option value="training_tips">{t('admin.categories.training_tips')}</option>
                <option value="promotions">{t('admin.categories.promotions')}</option>
              </select>
            </label>
          )}

          {audience === 'test' && (
            <label style={labelStyle}>
              {t('admin.email.testRecipientLabel')}
              <div style={{ display: 'flex', gap: 8, alignItems: 'center', flexWrap: 'wrap' }}>
                <input
                  type="email"
                  value={testRecipient}
                  onChange={(e) => setTestRecipient(e.target.value)}
                  style={{ ...inputStyle, flex: 1, minWidth: 200 }}
                  placeholder={t('admin.email.testRecipientPlaceholder')}
                />
                {savedTestAddresses.length > 0 && (
                  <select
                    value=""
                    onChange={(e) => { if (e.target.value) setTestRecipient(e.target.value); }}
                    style={{ ...inputStyle, marginTop: 0, width: 'auto' }}
                  >
                    <option value="">{t('admin.email.savedAddresses')}</option>
                    {savedTestAddresses.map((a) => <option key={a} value={a}>{a}</option>)}
                  </select>
                )}
                <button
                  type="button"
                  onClick={() => {
                    if (!testRecipient) return;
                    const next = [testRecipient, ...savedTestAddresses.filter((a) => a !== testRecipient)];
                    setSavedTestAddresses(next);
                    saveTestAddresses(next);
                  }}
                  style={{ padding: '8px 12px', fontSize: 12, fontWeight: 600, borderRadius: 6, cursor: 'pointer', background: 'rgba(255,255,255,0.04)', color: '#e5e7eb', border: '1px solid rgba(255,255,255,0.12)' }}
                  title={t('admin.email.saveAddressTitle')}
                >
                  {t('admin.email.saveAddress')}
                </button>
                {savedTestAddresses.includes(testRecipient) && (
                  <button
                    type="button"
                    onClick={() => {
                      const next = savedTestAddresses.filter((a) => a !== testRecipient);
                      setSavedTestAddresses(next);
                      saveTestAddresses(next);
                    }}
                    style={{ padding: '8px 12px', fontSize: 12, fontWeight: 600, borderRadius: 6, cursor: 'pointer', background: 'rgba(230,57,70,0.12)', color: '#fca5a5', border: '1px solid rgba(230,57,70,0.4)' }}
                    title={t('admin.email.forgetAddressTitle')}
                  >
                    {t('admin.email.forgetAddress')}
                  </button>
                )}
              </div>
              {enableAr && (
                <div style={{ marginTop: 8, display: 'flex', gap: 8, alignItems: 'center' }}>
                  <span style={{ fontSize: 12, color: '#9ca3af' }}>{t('admin.email.testAsLocale')}</span>
                  <select value={testLocale} onChange={(e) => setTestLocale(e.target.value)} style={{ ...inputStyle, marginTop: 0, width: 'auto' }}>
                    <option value="en">{t('admin.email.localeEn')}</option>
                    <option value="ar">{t('admin.email.localeAr')}</option>
                  </select>
                </div>
              )}
            </label>
          )}

          <div style={{ marginBottom: 8, display: 'flex', gap: 12, alignItems: 'center', flexWrap: 'wrap' }}>
            <label style={{ display: 'flex', alignItems: 'center', gap: 6, fontSize: 13, color: '#e5e7eb', cursor: 'pointer' }}>
              <input type="checkbox" checked={enableAr} onChange={(e) => { setEnableAr(e.target.checked); if (!e.target.checked) setLangTab('en'); }} />
              {t('admin.email.addArVariant')}
            </label>
            {enableAr && (
              <div style={{ display: 'flex', gap: 6 }}>
                <button type="button" onClick={() => setLangTab('en')} style={langTab === 'en' ? langTabActive : langTabStyle}>{t('admin.email.tabEnglish')}</button>
                <button type="button" onClick={() => setLangTab('ar')} style={langTab === 'ar' ? langTabActive : langTabStyle}>{t('admin.email.tabArabic')}</button>
              </div>
            )}
          </div>

          <label style={labelStyle}>
            {t('admin.email.subjectLabel')} {enableAr && <span style={{ color: '#9ca3af', fontWeight: 400, fontSize: 11 }}>{t('admin.email.subjectVariantSuffix', { lang: langTab.toUpperCase() })}</span>}
            <input
              type="text"
              value={activeSubject}
              onChange={(e) => setActiveSubject(e.target.value)}
              style={{ ...inputStyle, direction: isAr ? 'rtl' : 'ltr', textAlign: isAr ? 'right' : 'left' }}
              placeholder={t('admin.email.subjectPlaceholder')}
              dir={isAr ? 'rtl' : 'ltr'}
            />
          </label>

          <div style={{ marginBottom: 16 }}>
            <span style={hintStyle}>
              {t('admin.email.mergeTagsHintPre')}
              <code style={codeStyle}>{`{{tag|"fallback"}}`}</code>
              {t('admin.email.mergeTagsHintPost')}
            </span>
            <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap', marginTop: 6 }}>
              {MERGE_TAGS.map((tag) => (
                <button
                  key={tag}
                  type="button"
                  onClick={() => navigator.clipboard?.writeText(`{{${tag}}}`)}
                  style={tagBtnStyle}
                  title={t('admin.email.copyTag', { tag: `{{${tag}}}` })}
                >
                  {`{{${tag}}}`}
                </button>
              ))}
              <button
                type="button"
                onClick={() => navigator.clipboard?.writeText('{{first_name|"there"}}')}
                style={tagBtnStyle}
                title={t('admin.email.copyTag', { tag: '{{first_name|"there"}}' })}
              >
                {`{{first_name|"there"}}`}
              </button>
            </div>
            {unknownTags.length > 0 && (
              <div style={{ ...hintStyle, color: '#fdba74', marginTop: 6 }}>
                {t('admin.email.unknownTags', { count: unknownTags.length, tags: unknownTags.map((tag) => `{{${tag}}}`).join(', ') })}
              </div>
            )}
          </div>

          <div style={{ marginBottom: 16 }}>
            <div style={modeToggleStyle}>
              <button
                type="button"
                onClick={() => handleModeToggle('blocks')}
                style={mode === 'blocks' ? modeBtnActive : modeBtnStyle}
              >
                {t('admin.email.modeBlocks')}
              </button>
              <button
                type="button"
                onClick={() => handleModeToggle('html')}
                style={mode === 'html' ? modeBtnActive : modeBtnStyle}
              >
                {t('admin.email.modeHtml')}
              </button>
            </div>
            {mode === 'blocks' ? (
              <BlockComposer blocks={activeBlocks} onChange={setActiveBlocks} />
            ) : (
              <>
                <span style={hintStyle}>
                  {t('admin.email.rawHtmlHintPre')}
                  <code style={codeStyle}>{'{{unsubscribe_url}}'}</code>
                  {t('admin.email.rawHtmlHintPost')}
                </span>
                <textarea
                  value={activeRawHtml}
                  onChange={(e) => setActiveRawHtml(e.target.value)}
                  style={{ ...textareaStyle, direction: isAr ? 'rtl' : 'ltr' }}
                  dir={isAr ? 'rtl' : 'ltr'}
                  rows={16}
                />
              </>
            )}
          </div>

          {audience !== 'test' && (
            <div style={{ marginBottom: 16, padding: 12, border: '1px solid rgba(255,255,255,0.08)', borderRadius: 8, background: 'rgba(255,255,255,0.02)' }}>
              <div style={{ display: 'flex', gap: 16, flexWrap: 'wrap', alignItems: 'center' }}>
                <label style={{ display: 'flex', alignItems: 'center', gap: 6, fontSize: 13, color: '#e5e7eb', cursor: 'pointer' }}>
                  <input type="radio" name="sendMode" value="now" checked={sendMode === 'now'} onChange={() => setSendMode('now')} />
                  {t('admin.email.sendNow')}
                </label>
                <label style={{ display: 'flex', alignItems: 'center', gap: 6, fontSize: 13, color: '#e5e7eb', cursor: 'pointer' }}>
                  <input type="radio" name="sendMode" value="schedule" checked={sendMode === 'schedule'} onChange={() => setSendMode('schedule')} />
                  {t('admin.email.scheduleFor')}
                </label>
                {sendMode === 'schedule' && (
                  <input
                    type="datetime-local"
                    value={scheduledFor}
                    onChange={(e) => setScheduledFor(e.target.value)}
                    style={{ ...inputStyle, marginTop: 0, width: 'auto' }}
                  />
                )}
              </div>
              {sendMode === 'schedule' && (
                <div style={{ ...hintStyle, marginTop: 6 }}>
                  {t('admin.email.scheduleHint')}
                </div>
              )}
            </div>
          )}

          {audience !== 'test' && (() => {
            const recipientCount = audience === 'subscribers' ? (counts?.subscribers ?? 0)
              : audience === 'segment' ? (segmentCounts[segmentId] ?? 0)
              : audience === 'all_users' ? (counts?.all_users ?? 0)
              : (counts?.opted_in_users ?? 0);
            return (
              <div style={{ ...hintStyle, marginBottom: 8 }}>
                {t('admin.email.estimateRecipients', { count: recipientCount.toLocaleString() })}
                {recipientCount > 0 && <> · {t('admin.email.estimateCost', { cost: (recipientCount * 0.0004).toFixed(2) })}</>}
                {recipientCount > 100 && <span style={{ color: '#fdba74' }}> · {t('admin.email.estimateLargeSend')}</span>}
              </div>
            );
          })()}

          {sendIssues.length > 0 && (
            <div style={issuesPanelStyle} role="status" aria-live="polite">
              <strong style={issuesPanelHeadingStyle}>
                {t('admin.email.validation.heading')}
              </strong>
              <ul style={issuesPanelListStyle}>
                {sendIssues.map((issue, i) => (
                  <li key={`${i}-${issue}`}>{issue}</li>
                ))}
              </ul>
            </div>
          )}

          <div style={{ display: 'flex', gap: 12, flexWrap: 'wrap', alignItems: 'center' }}>
            <button
              onClick={handleSend}
              disabled={sending || sendIssues.length > 0}
              style={sending || sendIssues.length > 0 ? buttonDisabledStyle : buttonStyle}
            >
              {sending
                ? (sendMode === 'schedule' && audience !== 'test' ? t('admin.email.schedulingButton') : t('admin.email.sendingButton'))
                : audience === 'test' ? t('admin.email.sendTest')
                : sendMode === 'schedule' ? t('admin.email.scheduleCampaign')
                : t('admin.email.sendCampaign')}
            </button>
            <button
              onClick={() => setShowPreview((v) => !v)}
              style={ghostButtonStyle}
              type="button"
            >
              {showPreview ? t('admin.email.hidePreview') : t('admin.email.showPreview')}
            </button>
          </div>

        </div>

        {showPreview && (
          <div style={previewCardStyle}>
            <h3 style={{ margin: '0 0 12px 0', color: '#e5e7eb', fontSize: 14, letterSpacing: '0.1em', textTransform: 'uppercase' }}>
              {t('admin.email.previewLabel')}
            </h3>
            <div style={previewSubjectStyle}>
              <strong>{t('admin.email.previewSubject')}</strong> {previewSubject || <em style={{ color: '#9ca3af' }}>{t('admin.email.previewEmpty')}</em>}
            </div>
            {sampleRecipient ? (
              <div style={{ ...previewSubjectStyle, color: '#22d3ee', fontSize: 11 }}>
                {t('admin.email.previewPersonalized', { email: sampleRecipient.email })}
                {sampleRecipient.first_name ? ` (${sampleRecipient.first_name})` : ''}
                {sampleRecipient.current_level != null ? ` · ${t('admin.email.previewLevel', { level: sampleRecipient.current_level })}` : ''}
              </div>
            ) : audience !== 'test' && audience !== 'subscribers' ? (
              <div style={{ ...previewSubjectStyle, color: '#fdba74', fontSize: 11 }}>
                {t('admin.email.previewNoSample')}
              </div>
            ) : null}
            <iframe
              srcDoc={isAr ? `<html dir="rtl" lang="ar"><body style="margin:0">${previewHtml}</body></html>` : previewHtml}
              title={t('admin.email.previewIframeTitle')}
              sandbox=""
              style={iframeStyle}
            />
            {enableAr && (
              <div style={{ marginTop: 6, fontSize: 11, color: '#9ca3af' }}>
                {langTab === 'ar' ? t('admin.email.previewVariantArabic') : t('admin.email.previewVariantEnglish')}
              </div>
            )}
          </div>
        )}

        <div className="card card--lg">
          <h2 style={{ margin: '0 0 12px 0', fontSize: 16, color: '#e5e7eb' }}>{t('admin.email.scheduledTitle')}</h2>
          <p style={{ ...subtitleStyle, margin: '0 0 12px 0' }}>
            {t('admin.email.scheduledSubtitle')}
          </p>
          <ScheduledCampaignsPanel refreshKey={scheduleRefresh} />
        </div>

        <div className="card card--lg">
          <h2 style={{ margin: '0 0 12px 0', fontSize: 16, color: '#e5e7eb' }}>{t('admin.email.recentTitle')}</h2>
          <p style={{ ...subtitleStyle, margin: '0 0 12px 0' }}>
            {t('admin.email.recentSubtitle')}
          </p>
          <RecentCampaignsPanel refreshKey={recentRefresh} />
        </div>

        <div className="card card--lg">
          <h2 style={{ margin: '0 0 12px 0', fontSize: 16, color: '#e5e7eb' }}>{t('admin.email.suppressionsTitle')}</h2>
          <p style={{ ...subtitleStyle, margin: '0 0 12px 0' }}>
            {t('admin.email.suppressionsSubtitle')}
          </p>
          <SuppressionsPanel />
        </div>

        <div style={infoBoxStyle}>
          <strong>{t('admin.email.remindersTitle')}</strong>
          <ul style={{ margin: '8px 0 0 0', paddingLeft: 20, lineHeight: 1.7 }}>
            <li>
              {t('admin.email.reminderSender').split('<code>').map((part, i) =>
                i === 0 ? part : <React.Fragment key={i}>{part.split('</code>').map((p, j) => j === 0 ? <code key={j}>{p}</code> : p)}</React.Fragment>
              )}
            </li>
            <li>{t('admin.email.reminderRouting')}</li>
            <li>{t('admin.email.reminderTest')}</li>
          </ul>
        </div>
      </div>
    </PageContainer>
  );
}

function RadioOption({ value, checked, onChange, label, count, warn }) {
  const { t } = useTranslation();
  const accent = warn ? '#f97316' : '#22d3ee';
  const accentBg = warn ? 'rgba(249,115,22,0.08)' : 'rgba(34,211,238,0.08)';
  return (
    <label style={{
      ...radioOptionStyle,
      borderColor: checked ? accent : 'rgba(255,255,255,0.08)',
      background: checked ? accentBg : 'rgba(255,255,255,0.02)',
    }}>
      <input
        type="radio"
        name="audience"
        value={value}
        checked={checked}
        onChange={() => onChange(value)}
        style={{ marginRight: 10 }}
      />
      <span style={{ flex: 1 }}>
        <div style={{ fontWeight: 600, color: '#e5e7eb' }}>{label}</div>
        <div style={{ fontSize: 12, color: '#9ca3af', marginTop: 2 }}>{count}</div>
        {warn && checked && (
          <div style={{ fontSize: 11, color: '#fdba74', marginTop: 6 }}>
            {t('admin.email.audienceWarning')}
          </div>
        )}
      </span>
    </label>
  );
}

const subtitleStyle = { fontSize: 14, color: '#9ca3af', margin: '0 0 24px 0' };


const labelStyle = {
  display: 'block',
  marginBottom: 16,
  fontSize: 13,
  fontWeight: 600,
  color: '#d1d5db',
  letterSpacing: '0.02em',
};

const hintStyle = {
  display: 'block',
  fontSize: 12,
  fontWeight: 400,
  color: '#9ca3af',
  margin: '4px 0 8px 0',
};

const codeStyle = {
  background: 'rgba(255,255,255,0.06)',
  padding: '2px 6px',
  borderRadius: 4,
  fontSize: 11,
  fontFamily: 'ui-monospace, SFMono-Regular, monospace',
};

const inputStyle = {
  display: 'block',
  width: '100%',
  marginTop: 8,
  padding: '10px 12px',
  background: 'rgba(0,0,0,0.3)',
  border: '1px solid rgba(255,255,255,0.1)',
  borderRadius: 8,
  color: '#f4f4f5',
  fontSize: 14,
  fontFamily: 'inherit',
  boxSizing: 'border-box',
};

const textareaStyle = {
  ...inputStyle,
  fontFamily: 'ui-monospace, SFMono-Regular, monospace',
  fontSize: 12,
  resize: 'vertical',
  lineHeight: 1.5,
};

const radioGroupStyle = { display: 'grid', gap: 8, marginTop: 8 };
const radioOptionStyle = {
  display: 'flex',
  alignItems: 'center',
  padding: '12px 14px',
  border: '1px solid',
  borderRadius: 8,
  cursor: 'pointer',
  fontWeight: 400,
};

const buttonStyle = {
  padding: '12px 24px',
  background: 'linear-gradient(135deg, #2563eb, #22d3ee)',
  color: '#0b1020',
  fontWeight: 700,
  border: 'none',
  borderRadius: 8,
  cursor: 'pointer',
  fontSize: 14,
};

const buttonDisabledStyle = { ...buttonStyle, opacity: 0.5, cursor: 'not-allowed' };

const ghostButtonStyle = {
  padding: '12px 20px',
  background: 'rgba(255,255,255,0.04)',
  color: '#e5e7eb',
  fontWeight: 600,
  border: '1px solid rgba(255,255,255,0.1)',
  borderRadius: 8,
  cursor: 'pointer',
  fontSize: 14,
};

const issuesPanelStyle = {
  marginBottom: 12,
  padding: 12,
  background: 'rgba(251,191,36,0.06)',
  border: '1px solid rgba(251,191,36,0.25)',
  borderRadius: 8,
  fontSize: 13,
};

const issuesPanelHeadingStyle = {
  display: 'block',
  color: '#fde68a',
  fontSize: 12,
  fontWeight: 700,
  letterSpacing: '0.04em',
  textTransform: 'uppercase',
  marginBottom: 6,
};

const issuesPanelListStyle = {
  margin: 0,
  paddingInlineStart: 20,
  color: '#e5e7eb',
  lineHeight: 1.7,
};

const previewCardStyle = {
  background: 'rgba(15, 23, 42, 0.6)',
  border: '1px solid rgba(255,255,255,0.08)',
  borderRadius: 12,
  padding: 24,
  marginBottom: 16,
};

const previewSubjectStyle = {
  padding: '8px 12px',
  background: 'rgba(0,0,0,0.3)',
  borderRadius: 6,
  fontSize: 13,
  color: '#d1d5db',
  marginBottom: 12,
};

const iframeStyle = {
  width: '100%',
  height: 600,
  border: '1px solid rgba(255,255,255,0.1)',
  borderRadius: 8,
  background: '#fff',
};

const tagBtnStyle = {
  padding: '4px 8px',
  background: 'rgba(34,211,238,0.08)',
  color: '#22d3ee',
  border: '1px solid rgba(34,211,238,0.25)',
  borderRadius: 4,
  cursor: 'pointer',
  fontSize: 11,
  fontFamily: 'ui-monospace, SFMono-Regular, monospace',
};

const modeToggleStyle = {
  display: 'inline-flex',
  gap: 0,
  background: 'rgba(0,0,0,0.3)',
  border: '1px solid rgba(255,255,255,0.08)',
  borderRadius: 8,
  padding: 3,
  marginBottom: 12,
};

const modeBtnStyle = {
  padding: '6px 14px',
  background: 'transparent',
  color: '#9ca3af',
  border: 'none',
  borderRadius: 5,
  cursor: 'pointer',
  fontSize: 12,
  fontWeight: 600,
};

const modeBtnActive = {
  ...modeBtnStyle,
  background: 'rgba(34,211,238,0.15)',
  color: '#22d3ee',
};

const langTabStyle = {
  padding: '6px 12px', fontSize: 12, fontWeight: 600, borderRadius: 6, cursor: 'pointer',
  background: 'rgba(255,255,255,0.04)', color: '#cbd5e1',
  border: '1px solid rgba(255,255,255,0.12)',
};
const langTabActive = { ...langTabStyle, background: 'rgba(34,211,238,0.15)', color: '#22d3ee', borderColor: 'rgba(34,211,238,0.4)' };

const infoBoxStyle = {
  marginTop: 16,
  padding: 16,
  background: 'rgba(34,211,238,0.06)',
  border: '1px solid rgba(34,211,238,0.2)',
  borderRadius: 8,
  fontSize: 13,
  color: '#d1d5db',
};
