import React, { useEffect, useState } from 'react';
import { Link } from 'wouter';
import { supabase } from '../../lib/supabase';

const STATUS = {
  LOADING: 'loading',
  SUCCESS: 'success',
  ALREADY: 'already',
  ERROR: 'error',
};

export default function UnsubscribePage() {
  const [status, setStatus] = useState(STATUS.LOADING);
  const [email, setEmail] = useState(null);
  const [errorMessage, setErrorMessage] = useState('');

  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    const token = params.get('token');

    if (!token) {
      setStatus(STATUS.ERROR);
      setErrorMessage('Missing unsubscribe token in URL.');
      return;
    }

    let cancelled = false;
    (async () => {
      const { data, error } = await supabase.rpc('unsubscribe_by_token', { p_token: token });
      if (cancelled) return;

      if (error) {
        setStatus(STATUS.ERROR);
        setErrorMessage(error.message || 'Could not process unsubscribe.');
        return;
      }
      if (!data?.ok) {
        setStatus(STATUS.ERROR);
        setErrorMessage(data?.error === 'token_not_found'
          ? 'This unsubscribe link is invalid or has expired.'
          : 'Could not unsubscribe. Please try again.');
        return;
      }
      if (data.already_unsubscribed) {
        setStatus(STATUS.ALREADY);
        return;
      }
      setEmail(data.email || null);
      setStatus(STATUS.SUCCESS);
    })();

    return () => { cancelled = true; };
  }, []);

  return (
    <div style={pageStyle}>
      <div style={cardStyle}>
        <h1 style={titleStyle}>Versa Footy</h1>

        {status === STATUS.LOADING && (
          <p style={bodyStyle}>Processing your request...</p>
        )}

        {status === STATUS.SUCCESS && (
          <>
            <h2 style={headingStyle}>You've been unsubscribed</h2>
            <p style={bodyStyle}>
              {email
                ? <>We've removed <strong>{email}</strong> from our marketing list.</>
                : <>We've removed your email from our marketing list.</>}
              {' '}You won't receive any more marketing emails from us.
            </p>
            <p style={smallStyle}>
              Note: you'll still receive transactional emails like login codes if you have an account.
            </p>
          </>
        )}

        {status === STATUS.ALREADY && (
          <>
            <h2 style={headingStyle}>Already unsubscribed</h2>
            <p style={bodyStyle}>
              This email is already removed from our marketing list. No further action needed.
            </p>
          </>
        )}

        {status === STATUS.ERROR && (
          <>
            <h2 style={headingStyle}>Something went wrong</h2>
            <p style={bodyStyle}>{errorMessage}</p>
            <p style={smallStyle}>
              If this keeps happening, email <a href="mailto:hi@all4footy.com" style={linkStyle}>hi@all4footy.com</a> and we'll remove you manually.
            </p>
          </>
        )}

        <Link href="/">
          <a style={buttonStyle}>Back to Versa Footy</a>
        </Link>
      </div>
    </div>
  );
}

const pageStyle = {
  minHeight: '100vh',
  display: 'flex',
  alignItems: 'center',
  justifyContent: 'center',
  background: 'radial-gradient(circle at 20% 20%, #111827, #0b1020 45%, #050910)',
  padding: '24px',
  fontFamily: "'Inter', system-ui, -apple-system, sans-serif",
};

const cardStyle = {
  background: 'rgba(15, 23, 42, 0.6)',
  border: '1px solid rgba(255, 255, 255, 0.08)',
  borderRadius: 16,
  padding: '40px 32px',
  maxWidth: 480,
  width: '100%',
  boxShadow: '0 20px 60px rgba(0,0,0,0.35)',
  backdropFilter: 'blur(12px)',
  textAlign: 'center',
};

const titleStyle = {
  fontSize: 14,
  letterSpacing: '0.2em',
  textTransform: 'uppercase',
  color: '#9ca3af',
  margin: '0 0 24px 0',
  fontWeight: 600,
};

const headingStyle = {
  fontSize: 24,
  color: '#e5e7eb',
  margin: '0 0 16px 0',
  fontWeight: 700,
};

const bodyStyle = {
  fontSize: 16,
  lineHeight: 1.6,
  color: '#d1d5db',
  margin: '0 0 16px 0',
};

const smallStyle = {
  fontSize: 13,
  lineHeight: 1.6,
  color: '#9ca3af',
  margin: '0 0 24px 0',
};

const linkStyle = {
  color: '#22d3ee',
  textDecoration: 'underline',
};

const buttonStyle = {
  display: 'inline-block',
  marginTop: 16,
  padding: '12px 24px',
  background: 'linear-gradient(135deg, #2563eb, #22d3ee)',
  color: '#0b1020',
  fontWeight: 600,
  textDecoration: 'none',
  borderRadius: 10,
  fontSize: 14,
};
