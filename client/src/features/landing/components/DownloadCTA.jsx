import React, { useEffect, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { supabase } from '../../../lib/supabase';

const APP_STORE_URL = 'https://apps.apple.com/app/versa-footy/id6758730632';

function detectPlatform() {
  if (typeof navigator === 'undefined') return 'unknown';
  const ua = navigator.userAgent || '';
  if (/android/i.test(ua)) return 'android';
  if (/iphone|ipad|ipod/i.test(ua)) return 'ios';
  if (/macintosh/i.test(ua) && navigator.maxTouchPoints > 1) return 'ios';
  return 'desktop';
}

export default function DownloadCTA({ source = 'landing_hero', layout = 'row' }) {
  const { t, i18n } = useTranslation();
  const [platform, setPlatform] = useState('desktop');
  const [showAndroidForm, setShowAndroidForm] = useState(false);
  const [email, setEmail] = useState('');
  const [status, setStatus] = useState('idle');
  const [message, setMessage] = useState('');

  useEffect(() => {
    setPlatform(detectPlatform());
  }, []);

  async function submitAndroid(e) {
    e.preventDefault();
    if (!email || !/^[^@\s]+@[^@\s]+\.[^@\s]+$/.test(email)) {
      setStatus('error');
      setMessage(t('landing.download.invalidEmail'));
      return;
    }
    setStatus('submitting');
    setMessage('');

    const { data, error } = await supabase.rpc('subscribe_to_waitlist', {
      p_email: email,
      p_source: `${source}_android`,
      p_locale: i18n.language || null,
    });

    if (error) {
      setStatus('error');
      setMessage(error.message || t('landing.download.somethingWrong'));
      return;
    }
    if (!data?.ok) {
      setStatus('error');
      setMessage(data?.error === 'invalid_email' ? t('landing.download.invalidEmail') : t('landing.download.somethingWrong'));
      return;
    }

    setStatus('success');
    setMessage(
      data.already_subscribed
        ? t('landing.download.alreadyOnList')
        : data.resubscribed
          ? t('landing.download.welcomeBack')
          : t('landing.download.onTheList')
    );
    setEmail('');
  }

  const isStacked = layout === 'stack';

  return (
    <div style={{ ...wrapperStyle, alignItems: isStacked ? 'stretch' : 'center' }}>
      <div style={{ ...buttonRowStyle, flexDirection: isStacked ? 'column' : 'row' }}>
        <a
          href={APP_STORE_URL}
          target="_blank"
          rel="noopener noreferrer"
          style={iosButtonStyle}
          className="versa-store-badge versa-store-badge--ios"
          aria-label={t('landing.download.iosAriaLabel')}
        >
          <AppleLogo />
          <span style={badgeLabelStackStyle}>
            <span style={badgeSmallStyle}>{t('landing.download.iosTopLabel')}</span>
            <span style={badgeBigStyle}>{t('landing.download.iosBigLabel')}</span>
          </span>
        </a>

        <button
          type="button"
          onClick={() => setShowAndroidForm((v) => !v)}
          style={androidButtonStyle}
          className="versa-store-badge versa-store-badge--android"
          aria-expanded={showAndroidForm}
        >
          <span style={comingSoonRibbonStyle}>{t('landing.download.androidTopLabel')}</span>
          <AndroidLogo />
          <span style={badgeLabelStackStyle}>
            <span style={badgeSmallStyle}>{t('landing.download.androidNotifySmallLabel')}</span>
            <span style={badgeBigStyle}>{t('landing.download.androidBigLabel')}</span>
          </span>
        </button>
      </div>

      {platform === 'android' && !showAndroidForm && (
        <p style={hintStyle}>{t('landing.download.androidHint')}</p>
      )}

      {showAndroidForm && (
        <div style={formCardStyle}>
          {status === 'success' ? (
            <p style={successMessageStyle}>{message}</p>
          ) : (
            <form onSubmit={submitAndroid} style={formStyle}>
              <p style={formLabelStyle}>{t('landing.download.androidFormPrompt')}</p>
              <div style={formInputRowStyle}>
                <input
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder={t('landing.download.emailPlaceholder')}
                  disabled={status === 'submitting'}
                  style={inputStyle}
                  required
                />
                <button
                  type="submit"
                  disabled={status === 'submitting'}
                  style={status === 'submitting' ? submitButtonDisabledStyle : submitButtonStyle}
                >
                  {status === 'submitting' ? '...' : t('landing.download.notifyMe')}
                </button>
              </div>
              {status === 'error' && <p style={errorMessageStyle}>{message}</p>}
              <p style={privacyNoteStyle}>{t('landing.download.privacyNote')}</p>
            </form>
          )}
        </div>
      )}
    </div>
  );
}

function AppleLogo() {
  return (
    <svg width="32" height="32" viewBox="0 0 24 24" fill="currentColor" aria-hidden="true" style={{ flexShrink: 0 }}>
      <path d="M17.05 20.28c-.98.95-2.05.8-3.08.35-1.09-.46-2.09-.48-3.24 0-1.44.62-2.2.44-3.06-.35C2.79 15.25 3.51 7.59 9.05 7.31c1.35.07 2.29.74 3.08.8 1.18-.24 2.31-.93 3.57-.84 1.51.12 2.65.72 3.4 1.8-3.12 1.87-2.38 5.98.48 7.13-.57 1.5-1.31 2.99-2.54 4.09zM12.03 7.25c-.15-2.23 1.66-4.07 3.74-4.25.29 2.58-2.34 4.5-3.74 4.25z"/>
    </svg>
  );
}

function AndroidLogo() {
  return (
    <svg width="32" height="32" viewBox="0 0 24 24" fill="currentColor" aria-hidden="true" style={{ flexShrink: 0 }}>
      <path d="M3 19.5v-7c0-.83.67-1.5 1.5-1.5S6 11.67 6 12.5v7c0 .83-.67 1.5-1.5 1.5S3 20.33 3 19.5zM18 19.5v-7c0-.83.67-1.5 1.5-1.5s1.5.67 1.5 1.5v7c0 .83-.67 1.5-1.5 1.5s-1.5-.67-1.5-1.5zM7 11h10v9c0 .55-.45 1-1 1h-1v3c0 .55-.45 1-1 1s-1-.45-1-1v-3h-2v3c0 .55-.45 1-1 1s-1-.45-1-1v-3H8c-.55 0-1-.45-1-1v-9zM7 10c.18-2.79 1.81-5.16 4.13-6.42L9.86 1.31c-.07-.13-.05-.29.07-.36.13-.07.29-.05.36.07l1.32 2.32c.7-.27 1.5-.43 2.39-.43s1.69.16 2.39.43l1.32-2.32c.07-.13.23-.15.36-.07.13.07.15.23.07.36l-1.27 2.27c2.32 1.26 3.95 3.63 4.13 6.42H7zm3-2c.55 0 1-.45 1-1s-.45-1-1-1-1 .45-1 1 .45 1 1 1zm5 0c.55 0 1-.45 1-1s-.45-1-1-1-1 .45-1 1 .45 1 1 1z"/>
    </svg>
  );
}

const wrapperStyle = {
  display: 'flex',
  flexDirection: 'column',
  gap: 12,
  width: '100%',
};

const buttonRowStyle = {
  display: 'flex',
  gap: 14,
  flexWrap: 'wrap',
  justifyContent: 'flex-start',
};

const iosButtonStyle = {
  position: 'relative',
  display: 'inline-flex',
  alignItems: 'center',
  gap: 14,
  padding: '12px 24px',
  height: 60,
  background: '#000',
  color: '#fff',
  borderRadius: 14,
  textDecoration: 'none',
  border: '1.5px solid rgba(255,255,255,0.18)',
  minWidth: 210,
  fontFamily: 'inherit',
  cursor: 'pointer',
  boxShadow: '0 8px 24px rgba(0,0,0,0.35), 0 1px 0 rgba(255,255,255,0.06) inset',
  transition: 'transform 0.18s ease, box-shadow 0.18s ease, border-color 0.18s ease',
  boxSizing: 'border-box',
  textAlign: 'left',
};

const androidButtonStyle = {
  ...iosButtonStyle,
  background: 'linear-gradient(180deg, #1a1f2e 0%, #0d1119 100%)',
  border: '1.5px solid rgba(255,255,255,0.14)',
  color: 'rgba(255,255,255,0.92)',
  paddingTop: 14,
};

const badgeLabelStackStyle = {
  display: 'flex',
  flexDirection: 'column',
  textAlign: 'left',
  lineHeight: 1.1,
};

const badgeSmallStyle = {
  fontSize: 11,
  fontWeight: 500,
  letterSpacing: '0.02em',
  opacity: 0.8,
};

const badgeBigStyle = {
  fontSize: 19,
  fontWeight: 700,
  marginTop: 3,
  letterSpacing: '-0.01em',
};

const comingSoonRibbonStyle = {
  position: 'absolute',
  top: -8,
  right: 12,
  background: '#E63946',
  color: '#fff',
  fontSize: 9,
  fontWeight: 800,
  letterSpacing: '0.12em',
  textTransform: 'uppercase',
  padding: '3px 8px',
  borderRadius: 6,
  boxShadow: '0 4px 12px rgba(230,57,70,0.4)',
  whiteSpace: 'nowrap',
};

const hintStyle = {
  fontSize: 13,
  color: 'rgba(255,255,255,0.7)',
  textAlign: 'center',
  margin: 0,
};

const formCardStyle = {
  marginTop: 4,
  padding: 16,
  background: 'rgba(0,0,0,0.25)',
  border: '1px solid rgba(255,255,255,0.12)',
  borderRadius: 12,
  maxWidth: 480,
  width: '100%',
  margin: '4px auto 0',
};

const formStyle = {
  display: 'flex',
  flexDirection: 'column',
  gap: 8,
};

const formLabelStyle = {
  margin: 0,
  fontSize: 14,
  color: '#fff',
  fontWeight: 500,
};

const formInputRowStyle = {
  display: 'flex',
  gap: 8,
  flexWrap: 'wrap',
};

const inputStyle = {
  flex: '1 1 220px',
  padding: '12px 14px',
  borderRadius: 10,
  border: '1px solid rgba(255,255,255,0.15)',
  background: 'rgba(255,255,255,0.08)',
  color: '#fff',
  fontSize: 15,
  outline: 'none',
  fontFamily: 'inherit',
};

const submitButtonStyle = {
  padding: '12px 20px',
  borderRadius: 10,
  border: 'none',
  background: '#E63946',
  color: '#fff',
  fontWeight: 700,
  fontSize: 14,
  cursor: 'pointer',
  fontFamily: 'inherit',
  whiteSpace: 'nowrap',
};

const submitButtonDisabledStyle = { ...submitButtonStyle, opacity: 0.7, cursor: 'not-allowed' };

const successMessageStyle = {
  margin: 0,
  fontSize: 14,
  color: '#86efac',
  textAlign: 'center',
  padding: '8px 0',
};

const errorMessageStyle = {
  margin: 0,
  fontSize: 13,
  color: '#fca5a5',
};

const privacyNoteStyle = {
  margin: 0,
  fontSize: 12,
  color: 'rgba(255,255,255,0.5)',
};
