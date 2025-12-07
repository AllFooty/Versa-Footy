import React from 'react';
import { Link } from 'wouter';

const containerStyle = {
  minHeight: '100vh',
  display: 'flex',
  alignItems: 'center',
  justifyContent: 'center',
  background: 'radial-gradient(circle at 10% 20%, #0b1020, #050910 60%, #02060f)',
  color: '#e5e7eb',
  fontFamily: "'Inter', system-ui, -apple-system, sans-serif",
  padding: '32px',
};

const cardStyle = {
  width: '100%',
  maxWidth: 480,
  background: 'rgba(255,255,255,0.04)',
  border: '1px solid rgba(255,255,255,0.08)',
  borderRadius: 16,
  padding: '28px 30px',
  boxShadow: '0 24px 70px rgba(0,0,0,0.4)',
  backdropFilter: 'blur(10px)',
};

const labelStyle = {
  display: 'block',
  marginBottom: 6,
  color: '#cbd5e1',
  fontWeight: 600,
  fontSize: 14,
};

const inputStyle = {
  width: '100%',
  padding: '12px 14px',
  borderRadius: 10,
  border: '1px solid rgba(255,255,255,0.12)',
  background: 'rgba(255,255,255,0.03)',
  color: '#e5e7eb',
  fontSize: 15,
  marginBottom: 14,
};

const buttonStyle = {
  width: '100%',
  padding: '12px 14px',
  borderRadius: 12,
  border: 'none',
  background: 'linear-gradient(135deg, #2563eb, #22d3ee)',
  color: '#0b1020',
  fontWeight: 700,
  cursor: 'pointer',
  boxShadow: '0 16px 40px rgba(34,211,238,0.35)',
  marginTop: 8,
};

const noteStyle = {
  fontSize: 14,
  color: '#94a3b8',
  marginTop: 12,
  lineHeight: 1.6,
};

export default function Login() {
  return (
    <div style={containerStyle}>
      <div style={cardStyle}>
        <p style={{ textTransform: 'uppercase', letterSpacing: '0.25em', fontSize: 12, margin: 0, color: '#94a3b8' }}>
          Admin
        </p>
        <h1 style={{ margin: '6px 0 16px 0', fontSize: 26 }}>Sign in to Versa Footy</h1>
        <p style={{ ...noteStyle, marginTop: 0, marginBottom: 16 }}>
          Placeholder form. We&apos;ll hook this up to the backend auth endpoints (sessions +
          passport) and add client-side validation.
        </p>

        <label style={labelStyle} htmlFor="username">
          Username
        </label>
        <input style={inputStyle} id="username" name="username" placeholder="coach@example.com" />

        <label style={labelStyle} htmlFor="password">
          Password
        </label>
        <input style={inputStyle} id="password" name="password" type="password" placeholder="••••••••" />

        <button style={buttonStyle} type="button">
          Sign in
        </button>

        <p style={noteStyle}>
          Need to go back? <Link href="/">Return to landing</Link>
        </p>
      </div>
    </div>
  );
}

