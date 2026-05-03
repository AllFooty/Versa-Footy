import React, { useEffect, useState } from 'react';
import { Link } from 'wouter';
import { supabase } from '../../lib/supabase';

const STATUS = { LOADING: 'loading', READY: 'ready', SAVED: 'saved', ERROR: 'error' };

const CATEGORIES = [
  { key: 'product_updates', label: 'Product updates', desc: 'New features, releases, and what we shipped.' },
  { key: 'training_tips', label: 'Training tips', desc: 'Coaching content and how-to-train-better posts.' },
  { key: 'promotions', label: 'Promotions', desc: 'Discounts, special offers, and event invites.' },
];

export default function PreferencesPage() {
  const [status, setStatus] = useState(STATUS.LOADING);
  const [errorMessage, setErrorMessage] = useState('');
  const [token, setToken] = useState(null);
  const [email, setEmail] = useState(null);
  const [kind, setKind] = useState('user');
  const [prefs, setPrefs] = useState({ product_updates: true, training_tips: true, promotions: true });
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    const t = params.get('token');
    if (!t) {
      setStatus(STATUS.ERROR);
      setErrorMessage('Missing token in URL.');
      return;
    }
    setToken(t);

    let cancelled = false;
    (async () => {
      const { data, error } = await supabase.rpc('get_preferences_by_token', { p_token: t });
      if (cancelled) return;
      if (error) {
        setStatus(STATUS.ERROR);
        setErrorMessage(error.message || 'Could not load your preferences.');
        return;
      }
      if (!data?.ok) {
        setStatus(STATUS.ERROR);
        setErrorMessage(data?.error === 'token_not_found'
          ? 'This link is invalid or has expired.'
          : 'Could not load preferences.');
        return;
      }
      setEmail(data.email);
      setKind(data.kind);
      if (data.kind === 'user' && data.preferences) {
        setPrefs({
          product_updates: data.preferences.product_updates !== false,
          training_tips: data.preferences.training_tips !== false,
          promotions: data.preferences.promotions !== false,
        });
      }
      // If already fully unsubscribed, show all unchecked.
      if (data.unsubscribed) {
        setPrefs({ product_updates: false, training_tips: false, promotions: false });
      }
      setStatus(STATUS.READY);
    })();
    return () => { cancelled = true; };
  }, []);

  async function handleSave(nextPrefs = prefs) {
    setSaving(true);
    setErrorMessage('');
    const { data, error } = await supabase.rpc('update_preferences_by_token', {
      p_token: token,
      p_prefs: nextPrefs,
    });
    setSaving(false);
    if (error || !data?.ok) {
      setErrorMessage(error?.message || data?.error || 'Could not save preferences.');
      return;
    }
    setStatus(STATUS.SAVED);
  }

  async function handleUnsubAll() {
    const next = { product_updates: false, training_tips: false, promotions: false };
    setPrefs(next);
    await handleSave(next);
  }

  function toggle(key) {
    const next = { ...prefs, [key]: !prefs[key] };
    setPrefs(next);
    setStatus(STATUS.READY); // reset "saved" hint on edit
  }

  return (
    <div style={pageStyle}>
      <div style={cardStyle}>
        <h1 style={titleStyle}>Versa Footy</h1>

        {status === STATUS.LOADING && <p style={bodyStyle}>Loading your preferences…</p>}

        {status === STATUS.ERROR && (
          <>
            <h2 style={headingStyle}>Something went wrong</h2>
            <p style={bodyStyle}>{errorMessage}</p>
            <p style={smallStyle}>
              If this keeps happening, email <a href="mailto:hi@all4footy.com" style={linkStyle}>hi@all4footy.com</a> and we'll fix it manually.
            </p>
          </>
        )}

        {(status === STATUS.READY || status === STATUS.SAVED) && (
          <>
            <h2 style={headingStyle}>Email preferences</h2>
            <p style={bodyStyle}>
              {email ? <>Choose what kind of emails you want from Versa Footy at <strong>{email}</strong>.</>
                     : 'Choose what kind of emails you want from Versa Footy.'}
            </p>

            {kind === 'user' ? (
              <div style={{ textAlign: 'left', margin: '24px 0' }}>
                {CATEGORIES.map((c) => (
                  <label key={c.key} style={rowStyle}>
                    <input
                      type="checkbox"
                      checked={prefs[c.key]}
                      onChange={() => toggle(c.key)}
                      style={{ marginRight: 12, marginTop: 4 }}
                    />
                    <span>
                      <div style={{ color: '#e5e7eb', fontWeight: 600 }}>{c.label}</div>
                      <div style={{ color: '#9ca3af', fontSize: 13 }}>{c.desc}</div>
                    </span>
                  </label>
                ))}
              </div>
            ) : (
              <p style={bodyStyle}>
                You're on the Android waitlist. We'll only email you about the launch.
                If you'd like to unsubscribe, click below.
              </p>
            )}

            <div style={{ display: 'flex', gap: 12, justifyContent: 'center', flexWrap: 'wrap', marginTop: 8 }}>
              <button onClick={() => handleSave()} disabled={saving} style={primaryBtn}>
                {saving ? 'Saving…' : 'Save preferences'}
              </button>
              <button onClick={handleUnsubAll} disabled={saving} style={ghostBtn}>
                Unsubscribe from everything
              </button>
            </div>

            {status === STATUS.SAVED && (
              <p style={{ ...smallStyle, color: '#a7f3d0', marginTop: 16 }}>
                ✓ Preferences saved.
              </p>
            )}
            {errorMessage && (
              <p style={{ ...smallStyle, color: '#fca5a5', marginTop: 12 }}>{errorMessage}</p>
            )}

            <p style={smallStyle}>
              Note: you'll still receive transactional emails like login codes if you have an account.
            </p>
          </>
        )}

        <Link href="/"><a style={backLinkStyle}>Back to Versa Footy</a></Link>
      </div>
    </div>
  );
}

const pageStyle = {
  minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center',
  background: 'radial-gradient(circle at 20% 20%, #111827, #0b1020 45%, #050910)',
  padding: '24px', fontFamily: "'Inter', system-ui, -apple-system, sans-serif",
};
const cardStyle = {
  background: 'rgba(15,23,42,0.6)', border: '1px solid rgba(255,255,255,0.08)',
  borderRadius: 16, padding: '40px 32px', maxWidth: 520, width: '100%',
  boxShadow: '0 20px 60px rgba(0,0,0,0.35)', backdropFilter: 'blur(12px)', textAlign: 'center',
};
const titleStyle = {
  fontSize: 14, letterSpacing: '0.2em', textTransform: 'uppercase',
  color: '#9ca3af', margin: '0 0 24px 0', fontWeight: 600,
};
const headingStyle = { fontSize: 24, color: '#e5e7eb', margin: '0 0 16px 0', fontWeight: 700 };
const bodyStyle = { fontSize: 15, lineHeight: 1.6, color: '#d1d5db', margin: '0 0 16px 0' };
const smallStyle = { fontSize: 12, lineHeight: 1.5, color: '#9ca3af', margin: '16px 0 0 0' };
const rowStyle = {
  display: 'flex', alignItems: 'flex-start', padding: '12px 14px',
  background: 'rgba(0,0,0,0.25)', border: '1px solid rgba(255,255,255,0.06)',
  borderRadius: 8, marginBottom: 8, cursor: 'pointer',
};
const primaryBtn = {
  padding: '12px 20px', background: 'linear-gradient(135deg, #2563eb, #22d3ee)',
  color: '#0b1020', fontWeight: 700, border: 'none', borderRadius: 8, cursor: 'pointer', fontSize: 14,
};
const ghostBtn = {
  padding: '12px 20px', background: 'rgba(255,255,255,0.04)', color: '#e5e7eb',
  fontWeight: 600, border: '1px solid rgba(255,255,255,0.1)', borderRadius: 8, cursor: 'pointer', fontSize: 14,
};
const linkStyle = { color: '#22d3ee', textDecoration: 'underline' };
const backLinkStyle = {
  display: 'inline-block', marginTop: 24, color: '#9ca3af', fontSize: 13, textDecoration: 'none',
};
