import React, { useEffect, useState, useMemo } from 'react';
import { Link } from 'wouter';
import { supabase } from '../../lib/supabase';
import { useAuth } from '../../lib/AuthContext';
import BlockComposer from './marketing/BlockComposer.jsx';
import { defaultBlocks, validateBlocks } from './marketing/blocks.js';
import { renderEmailHtml } from './marketing/renderEmail.jsx';
import RecentCampaignsPanel from './marketing/RecentCampaignsPanel.jsx';
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
  const { user } = useAuth();
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
  const [result, setResult] = useState(null);
  const [error, setError] = useState(null);
  const [showPreview, setShowPreview] = useState(false);
  const [renderedHtml, setRenderedHtml] = useState('');
  const [sampleRecipient, setSampleRecipient] = useState(null);
  const [sendMode, setSendMode] = useState('now'); // 'now' | 'schedule'
  const [scheduledFor, setScheduledFor] = useState(''); // datetime-local string, browser TZ
  const [scheduleRefresh, setScheduleRefresh] = useState(0);
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
        if (!cancelled) setError(`Render failed: ${e?.message || e}`);
      }
    })();
    return () => { cancelled = true; };
  }, [blocks, mode]);

  // Same for the AR variant.
  useEffect(() => {
    if (mode !== 'blocks' || !enableAr) return;
    let cancelled = false;
    (async () => {
      try {
        const result = await renderEmailHtml(blocksAr);
        if (!cancelled) setRenderedHtmlAr(result);
      } catch (e) {
        if (!cancelled) setError(`AR render failed: ${e?.message || e}`);
      }
    })();
    return () => { cancelled = true; };
  }, [blocksAr, mode, enableAr]);

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

  async function handleSend() {
    setError(null);
    setResult(null);

    const recipientCount = audience === 'test' ? 1
      : audience === 'subscribers' ? (counts?.subscribers ?? 0)
      : audience === 'segment' ? (segmentCounts[segmentId] ?? 0)
      : audience === 'all_users' ? (counts?.all_users ?? 0)
      : (counts?.opted_in_users ?? 0);

    if (recipientCount === 0) {
      setError('No recipients in this audience. Pick another or wait for signups.');
      return;
    }

    const isSchedule = sendMode === 'schedule' && audience !== 'test';
    let scheduledISO = null;
    if (isSchedule) {
      if (!scheduledFor) { setError('Pick a date/time to schedule.'); return; }
      const dt = new Date(scheduledFor);
      if (isNaN(dt.getTime())) { setError('Invalid date.'); return; }
      if (dt <= new Date()) { setError('Scheduled time must be in the future.'); return; }
      scheduledISO = dt.toISOString();
    }

    // Typed-SEND confirm gate for big sends. Plain confirm() is too easy to miss-click.
    if (audience !== 'test' && recipientCount > 100 && !isSchedule) {
      const costEst = (recipientCount * 0.0004).toFixed(2);
      const typed = window.prompt(
        `You're about to send to ${recipientCount} recipients (~$${costEst}). ` +
        `Type SEND to confirm. This cannot be undone.`
      );
      if (typed !== 'SEND') {
        setError(typed == null ? null : 'Send canceled (you must type SEND exactly).');
        return;
      }
    } else {
      const confirmMsg = audience === 'test'
        ? `Send test email to ${testRecipient}?`
        : isSchedule
          ? `Schedule send to ${recipientCount} recipient(s) for ${new Date(scheduledISO).toLocaleString()}?`
          : `Send to ${recipientCount} ${audience === 'subscribers' ? 'waitlist subscriber(s)' : 'opted-in user(s)'}? This cannot be undone.`;
      if (!window.confirm(confirmMsg)) return;
    }

    if (mode === 'blocks') {
      const issues = validateBlocks(blocks);
      if (issues.length > 0) {
        setError(issues.join(' '));
        return;
      }
      if (enableAr) {
        const issuesAr = validateBlocks(blocksAr);
        if (issuesAr.length > 0) { setError(`AR: ${issuesAr.join(' ')}`); return; }
      }
    }
    if (enableAr && (!subjectAr || (mode === 'html' && !htmlAr))) {
      setError('Arabic variant is enabled but missing subject or body.');
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
        if (rpcErr) setError(rpcErr.message);
        else {
          setResult({ scheduled: true, campaignId: data, scheduledFor: scheduledISO });
          setScheduleRefresh((n) => n + 1);
        }
        setSending(false);
        return;
      }

      const { data: { session } } = await supabase.auth.getSession();
      if (!session) {
        setError('Not authenticated.');
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
        setError(body.error || `HTTP ${res.status}`);
      } else {
        setResult(body);
      }
    } catch (e) {
      setError(e?.message || String(e));
    } finally {
      setSending(false);
    }
  }

  return (
    <div style={pageStyle}>
      <div style={{ maxWidth: 900, margin: '0 auto', padding: '24px' }}>
        <div style={crumbStyle}>
          <Link href="/library"><a style={crumbLinkStyle}>← Library</a></Link>
        </div>
        <h1 style={titleStyle}>Marketing Email</h1>
        <p style={subtitleStyle}>
          Send a campaign via Resend. Always test on yourself first before sending to real users.{' '}
          <Link href="/marketing/segments"><a style={{ color: '#22d3ee', textDecoration: 'none' }}>Segments</a></Link>
          {' · '}
          <Link href="/marketing/automations"><a style={{ color: '#22d3ee', textDecoration: 'none' }}>Automations</a></Link>
        </p>

        <div style={cardStyle}>
          <label style={labelStyle}>
            Templates
            <span style={hintStyle}>
              Built-ins (★) seed a fresh draft. Save your current draft as a custom template to reuse it later.
            </span>
            <TemplatesPanel
              currentSubject={subject}
              currentMode={mode}
              currentBlocks={blocks}
              currentHtml={html}
              onLoad={({ subject: s, mode: m, blocks: b, html: h }) => {
                setSubject(s);
                setMode(m);
                // Reset both modes so stale state from the unused mode doesn't leak
                // back if the admin toggles after loading. (P2-3)
                if (m === 'blocks') {
                  setBlocks(b || defaultBlocks());
                  setHtml(TEMPLATE_LAUNCH);
                } else {
                  setHtml(h ?? '');
                  setBlocks(defaultBlocks());
                }
                setError(null);
                setResult(null);
              }}
            />
          </label>

          <label style={labelStyle}>
            Audience
            <div style={radioGroupStyle}>
              <RadioOption
                value="test"
                checked={audience === 'test'}
                onChange={setAudience}
                label="Test (just me)"
                count="1 recipient"
              />
              <RadioOption
                value="subscribers"
                checked={audience === 'subscribers'}
                onChange={setAudience}
                label="Waitlist subscribers"
                count={counts ? `${counts.subscribers} recipient${counts.subscribers === 1 ? '' : 's'}` : '...'}
              />
              <RadioOption
                value="opted_in_users"
                checked={audience === 'opted_in_users'}
                onChange={setAudience}
                label="Opted-in app users"
                count={counts ? `${counts.opted_in_users} recipient${counts.opted_in_users === 1 ? '' : 's'}` : '...'}
              />
              <RadioOption
                value="all_users"
                checked={audience === 'all_users'}
                onChange={setAudience}
                label="All app users (one-time launch)"
                count={counts ? `${counts.all_users} recipient${counts.all_users === 1 ? '' : 's'}` : '...'}
                warn
              />
              <RadioOption
                value="segment"
                checked={audience === 'segment'}
                onChange={setAudience}
                label="Segment"
                count={segments.length === 0 ? 'no segments yet' : `${segments.length} segment${segments.length === 1 ? '' : 's'} available`}
              />
            </div>
            {audience === 'segment' && (
              <div style={{ marginTop: 12, display: 'flex', gap: 8, alignItems: 'center', flexWrap: 'wrap' }}>
                <select value={segmentId} onChange={(e) => setSegmentId(e.target.value)} style={inputStyle}>
                  {segments.map((s) => (
                    <option key={s.id} value={s.id}>
                      {s.name} {segmentCounts[s.id] != null ? `(${segmentCounts[s.id]} recipients)` : ''}
                    </option>
                  ))}
                </select>
                <Link href="/marketing/segments"><a style={{ color: '#22d3ee', fontSize: 12, textDecoration: 'none' }}>Manage segments →</a></Link>
              </div>
            )}
          </label>

          {(audience === 'opted_in_users' || audience === 'all_users' || audience === 'segment') && (
            <label style={labelStyle}>
              Category
              <span style={hintStyle}>
                Recipients who turned this category off in /preferences will be skipped.
                {audience === 'all_users' && (
                  <> <span style={{ color: '#fdba74' }}>Note: users who never visited /preferences (NULL prefs) are treated as opted-in to every category, so "all users" sends to them regardless of category.</span></>
                )}
              </span>
              <select value={category} onChange={(e) => setCategory(e.target.value)} style={inputStyle}>
                <option value="product_updates">Product updates</option>
                <option value="training_tips">Training tips</option>
                <option value="promotions">Promotions</option>
              </select>
            </label>
          )}

          {audience === 'test' && (
            <label style={labelStyle}>
              Test recipient email
              <div style={{ display: 'flex', gap: 8, alignItems: 'center', flexWrap: 'wrap' }}>
                <input
                  type="email"
                  value={testRecipient}
                  onChange={(e) => setTestRecipient(e.target.value)}
                  style={{ ...inputStyle, flex: 1, minWidth: 200 }}
                  placeholder="you@example.com"
                />
                {savedTestAddresses.length > 0 && (
                  <select
                    value=""
                    onChange={(e) => { if (e.target.value) setTestRecipient(e.target.value); }}
                    style={{ ...inputStyle, marginTop: 0, width: 'auto' }}
                  >
                    <option value="">— Saved addresses —</option>
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
                  title="Save this address for later"
                >
                  Save
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
                    title="Remove from saved addresses"
                  >
                    Forget
                  </button>
                )}
              </div>
              {enableAr && (
                <div style={{ marginTop: 8, display: 'flex', gap: 8, alignItems: 'center' }}>
                  <span style={{ fontSize: 12, color: '#9ca3af' }}>Test as locale:</span>
                  <select value={testLocale} onChange={(e) => setTestLocale(e.target.value)} style={{ ...inputStyle, marginTop: 0, width: 'auto' }}>
                    <option value="en">English (en)</option>
                    <option value="ar">Arabic (ar)</option>
                  </select>
                </div>
              )}
            </label>
          )}

          <div style={{ marginBottom: 8, display: 'flex', gap: 12, alignItems: 'center', flexWrap: 'wrap' }}>
            <label style={{ display: 'flex', alignItems: 'center', gap: 6, fontSize: 13, color: '#e5e7eb', cursor: 'pointer' }}>
              <input type="checkbox" checked={enableAr} onChange={(e) => { setEnableAr(e.target.checked); if (!e.target.checked) setLangTab('en'); }} />
              Add Arabic variant (recipients with locale=ar see this version)
            </label>
            {enableAr && (
              <div style={{ display: 'flex', gap: 6 }}>
                <button type="button" onClick={() => setLangTab('en')} style={langTab === 'en' ? langTabActive : langTabStyle}>English</button>
                <button type="button" onClick={() => setLangTab('ar')} style={langTab === 'ar' ? langTabActive : langTabStyle}>العربية</button>
              </div>
            )}
          </div>

          <label style={labelStyle}>
            Subject {enableAr && <span style={{ color: '#9ca3af', fontWeight: 400, fontSize: 11 }}>({langTab.toUpperCase()})</span>}
            <input
              type="text"
              value={activeSubject}
              onChange={(e) => setActiveSubject(e.target.value)}
              style={{ ...inputStyle, direction: isAr ? 'rtl' : 'ltr', textAlign: isAr ? 'right' : 'left' }}
              placeholder='Email subject line. Tags allowed: {{first_name|"there"}}'
              dir={isAr ? 'rtl' : 'ltr'}
            />
          </label>

          <div style={{ marginBottom: 16 }}>
            <span style={hintStyle}>
              Click a tag to copy it. Use <code style={codeStyle}>{'{{tag|"fallback"}}'}</code> to provide a default if the value is missing.
            </span>
            <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap', marginTop: 6 }}>
              {MERGE_TAGS.map((t) => (
                <button
                  key={t}
                  type="button"
                  onClick={() => navigator.clipboard?.writeText(`{{${t}}}`)}
                  style={tagBtnStyle}
                  title={`Copy {{${t}}} to clipboard`}
                >
                  {`{{${t}}}`}
                </button>
              ))}
              <button
                type="button"
                onClick={() => navigator.clipboard?.writeText('{{first_name|"there"}}')}
                style={tagBtnStyle}
                title='Copy {{first_name|"there"}} to clipboard'
              >
                {`{{first_name|"there"}}`}
              </button>
            </div>
            {unknownTags.length > 0 && (
              <div style={{ ...hintStyle, color: '#fdba74', marginTop: 6 }}>
                ⚠ Unknown tag{unknownTags.length === 1 ? '' : 's'} in template: {unknownTags.map((t) => `{{${t}}}`).join(', ')}.
                These will render as empty strings.
              </div>
            )}
          </div>

          <div style={{ marginBottom: 16 }}>
            <div style={modeToggleStyle}>
              <button
                type="button"
                onClick={() => setMode('blocks')}
                style={mode === 'blocks' ? modeBtnActive : modeBtnStyle}
              >
                Blocks
              </button>
              <button
                type="button"
                onClick={() => setMode('html')}
                style={mode === 'html' ? modeBtnActive : modeBtnStyle}
              >
                Raw HTML
              </button>
            </div>
            {mode === 'blocks' ? (
              <BlockComposer blocks={activeBlocks} onChange={setActiveBlocks} />
            ) : (
              <>
                <span style={hintStyle}>
                  Use <code style={codeStyle}>{'{{unsubscribe_url}}'}</code> wherever you want the unsubscribe link.
                  If you skip it, a default footer with the link gets added automatically.
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
                  Send now
                </label>
                <label style={{ display: 'flex', alignItems: 'center', gap: 6, fontSize: 13, color: '#e5e7eb', cursor: 'pointer' }}>
                  <input type="radio" name="sendMode" value="schedule" checked={sendMode === 'schedule'} onChange={() => setSendMode('schedule')} />
                  Schedule for…
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
                  Times are in your local timezone. The dispatcher runs every minute via pg_cron.
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
                ≈ {recipientCount.toLocaleString()} recipient{recipientCount === 1 ? '' : 's'}
                {recipientCount > 0 && <> · est. cost ≈ ${(recipientCount * 0.0004).toFixed(2)} (Resend pro tier)</>}
                {recipientCount > 100 && <span style={{ color: '#fdba74' }}> · large send: typed-SEND confirm required</span>}
              </div>
            );
          })()}

          <div style={{ display: 'flex', gap: 12, flexWrap: 'wrap', alignItems: 'center' }}>
            <button
              onClick={handleSend}
              disabled={sending || !subject || !outgoingHtml || (audience === 'test' && !testRecipient) || (sendMode === 'schedule' && audience !== 'test' && !scheduledFor) || (enableAr && (!subjectAr || !outgoingHtmlAr))}
              style={sending ? buttonDisabledStyle : buttonStyle}
            >
              {sending
                ? (sendMode === 'schedule' && audience !== 'test' ? 'Scheduling…' : 'Sending...')
                : audience === 'test' ? 'Send test'
                : sendMode === 'schedule' ? 'Schedule campaign'
                : 'Send campaign'}
            </button>
            <button
              onClick={() => setShowPreview((v) => !v)}
              style={ghostButtonStyle}
              type="button"
            >
              {showPreview ? 'Hide preview' : 'Show preview'}
            </button>
          </div>

          {result && result.scheduled && (
            <div style={successBoxStyle}>
              <strong>Scheduled.</strong> Will send at {new Date(result.scheduledFor).toLocaleString()}.
              Campaign id: <code>{result.campaignId}</code>
            </div>
          )}
          {result && !result.scheduled && (
            <div style={successBoxStyle}>
              <strong>Sent.</strong> {result.successful} successful, {result.failed} failed
              {' '}({result.totalRecipients} total). Campaign id: <code>{result.campaignId}</code>
            </div>
          )}
          {error && (
            <div style={errorBoxStyle}>
              <strong>Error:</strong> {error}
            </div>
          )}
        </div>

        {showPreview && (
          <div style={previewCardStyle}>
            <h3 style={{ margin: '0 0 12px 0', color: '#e5e7eb', fontSize: 14, letterSpacing: '0.1em', textTransform: 'uppercase' }}>
              Preview
            </h3>
            <div style={previewSubjectStyle}>
              <strong>Subject:</strong> {previewSubject || <em style={{ color: '#9ca3af' }}>(empty)</em>}
            </div>
            {sampleRecipient ? (
              <div style={{ ...previewSubjectStyle, color: '#22d3ee', fontSize: 11 }}>
                Personalized as: <strong>{sampleRecipient.email}</strong>
                {sampleRecipient.first_name ? ` (${sampleRecipient.first_name})` : ''}
                {sampleRecipient.current_level != null ? ` · level ${sampleRecipient.current_level}` : ''}
              </div>
            ) : audience !== 'test' && audience !== 'subscribers' ? (
              <div style={{ ...previewSubjectStyle, color: '#fdba74', fontSize: 11 }}>
                No sample recipient available for this audience — preview shows fallback values.
              </div>
            ) : null}
            <iframe
              srcDoc={isAr ? `<html dir="rtl" lang="ar"><body style="margin:0">${previewHtml}</body></html>` : previewHtml}
              title="Email preview"
              sandbox=""
              style={iframeStyle}
            />
            {enableAr && (
              <div style={{ marginTop: 6, fontSize: 11, color: '#9ca3af' }}>
                Showing {langTab === 'ar' ? 'Arabic (RTL)' : 'English'} variant. Switch with the EN/AR tabs above the subject.
              </div>
            )}
          </div>
        )}

        <div style={cardStyle}>
          <h2 style={{ margin: '0 0 12px 0', fontSize: 16, color: '#e5e7eb' }}>Scheduled</h2>
          <p style={{ ...subtitleStyle, margin: '0 0 12px 0' }}>
            Upcoming sends. Cancel or reschedule until the dispatcher picks them up.
          </p>
          <ScheduledCampaignsPanel refreshKey={scheduleRefresh} />
        </div>

        <div style={cardStyle}>
          <h2 style={{ margin: '0 0 12px 0', fontSize: 16, color: '#e5e7eb' }}>Recent campaigns</h2>
          <p style={{ ...subtitleStyle, margin: '0 0 12px 0' }}>
            Open / click / bounce rates update via Resend webhooks. If they're stuck at zero, check that the webhook is configured.
          </p>
          <RecentCampaignsPanel refreshKey={result?.campaignId} />
        </div>

        <div style={cardStyle}>
          <h2 style={{ margin: '0 0 12px 0', fontSize: 16, color: '#e5e7eb' }}>Suppressions</h2>
          <p style={{ ...subtitleStyle, margin: '0 0 12px 0' }}>
            Addresses we'll never send marketing to. Bounces and complaints land here automatically.
            Remove a row only if you have evidence the address is now valid.
          </p>
          <SuppressionsPanel />
        </div>

        <div style={infoBoxStyle}>
          <strong>Reminders:</strong>
          <ul style={{ margin: '8px 0 0 0', paddingLeft: 20, lineHeight: 1.7 }}>
            <li>Sender: <code>launch@versafooty.com</code> · Reply-To: <code>hi@all4footy.com</code></li>
            <li>Replies route to Lark via Cloudflare Email Routing — make sure that's set up before sending real campaigns.</li>
            <li>Always test on yourself first to verify rendering and inbox placement (not spam).</li>
          </ul>
        </div>
      </div>
    </div>
  );
}

function RadioOption({ value, checked, onChange, label, count, warn }) {
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
            ⚠ Sends to every signed-up user, even if they didn't opt in to marketing. Use only for one-time launch announcements.
          </div>
        )}
      </span>
    </label>
  );
}

const pageStyle = {
  minHeight: '100vh',
  background: 'radial-gradient(circle at 10% 20%, #0b1020, #050910 60%, #02060f)',
  color: '#e5e7eb',
  fontFamily: "'Inter', system-ui, -apple-system, sans-serif",
};

const crumbStyle = { marginBottom: 16, fontSize: 13 };
const crumbLinkStyle = { color: '#22d3ee', textDecoration: 'none' };

const titleStyle = { fontSize: 28, margin: '0 0 8px 0', color: '#f4f4f5' };
const subtitleStyle = { fontSize: 14, color: '#9ca3af', margin: '0 0 24px 0' };

const cardStyle = {
  background: 'rgba(15, 23, 42, 0.6)',
  border: '1px solid rgba(255,255,255,0.08)',
  borderRadius: 12,
  padding: 24,
  marginBottom: 16,
};

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

const successBoxStyle = {
  marginTop: 16,
  padding: 12,
  background: 'rgba(16,185,129,0.1)',
  border: '1px solid rgba(16,185,129,0.3)',
  borderRadius: 8,
  color: '#a7f3d0',
  fontSize: 13,
};

const errorBoxStyle = {
  marginTop: 16,
  padding: 12,
  background: 'rgba(230,57,70,0.1)',
  border: '1px solid rgba(230,57,70,0.3)',
  borderRadius: 8,
  color: '#fca5a5',
  fontSize: 13,
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
