import React from 'react';
import { Link } from 'wouter';

const containerStyle = {
  minHeight: '100vh',
  padding: '64px 24px',
  display: 'flex',
  alignItems: 'center',
  justifyContent: 'center',
  background: 'radial-gradient(circle at 20% 20%, #0b1020, #050910 55%, #02060f)',
  color: '#e5e7eb',
  fontFamily: "'Inter', system-ui, -apple-system, sans-serif",
};

const shellStyle = {
  width: '100%',
  maxWidth: 1100,
  display: 'grid',
  gridTemplateColumns: '1fr 1fr',
  gap: 36,
  alignItems: 'center',
};

const cardStyle = {
  background: 'rgba(255,255,255,0.04)',
  border: '1px solid rgba(255,255,255,0.08)',
  borderRadius: 18,
  padding: '28px 32px',
  boxShadow: '0 20px 80px rgba(0,0,0,0.4)',
  backdropFilter: 'blur(10px)',
};

const eyebrowStyle = {
  textTransform: 'uppercase',
  letterSpacing: '0.3em',
  fontSize: 12,
  color: '#a5b4fc',
  marginBottom: 12,
};

const titleStyle = {
  fontSize: 38,
  lineHeight: 1.2,
  margin: '0 0 16px 0',
  color: '#f3f4f6',
};

const bodyStyle = {
  fontSize: 17,
  lineHeight: 1.7,
  color: '#d1d5db',
  marginBottom: 24,
};

const actionsStyle = {
  display: 'flex',
  flexWrap: 'wrap',
  gap: 12,
};

const primaryButtonStyle = {
  display: 'inline-flex',
  alignItems: 'center',
  gap: 8,
  padding: '12px 18px',
  background: 'linear-gradient(135deg, #2563eb, #22d3ee)',
  color: '#0b1020',
  fontWeight: 700,
  textDecoration: 'none',
  borderRadius: 12,
  boxShadow: '0 15px 40px rgba(34,211,238,0.35)',
};

const ghostButtonStyle = {
  display: 'inline-flex',
  alignItems: 'center',
  gap: 8,
  padding: '12px 18px',
  background: 'rgba(255,255,255,0.04)',
  color: '#e5e7eb',
  fontWeight: 600,
  textDecoration: 'none',
  borderRadius: 12,
  border: '1px solid rgba(255,255,255,0.08)',
};

const badgeStyle = {
  display: 'inline-flex',
  alignItems: 'center',
  gap: 8,
  padding: '10px 12px',
  background: 'rgba(34,211,238,0.1)',
  color: '#a5f3fc',
  borderRadius: 12,
  border: '1px solid rgba(34,211,238,0.3)',
  fontSize: 14,
  marginBottom: 16,
};

export default function Landing() {
  return (
    <div style={containerStyle}>
      <div style={shellStyle}>
        <div>
          <div style={cardStyle}>
            <div style={badgeStyle}>
              <span role="img" aria-label="football">
                ⚽
              </span>
              Versa Footy
            </div>
            <p style={eyebrowStyle}>Welcome</p>
            <h1 style={titleStyle}>Elite training, organized for every session.</h1>
            <p style={bodyStyle}>
              This is a placeholder landing page. We&apos;ll drop in the full Versa Footy
              marketing site once the assets are provided. Use the buttons below to explore the
              library or go to the admin login.
            </p>
            <div style={actionsStyle}>
              <Link href="/library">
                <a style={primaryButtonStyle}>Enter Library</a>
              </Link>
              <Link href="/login">
                <a style={ghostButtonStyle}>Admin Login</a>
              </Link>
            </div>
          </div>
        </div>
        <div>
          <div style={{ ...cardStyle, height: '100%', display: 'grid', placeItems: 'center' }}>
            <div style={{ textAlign: 'center' }}>
              <p style={{ ...eyebrowStyle, marginBottom: 8 }}>What’s next</p>
              <h2 style={{ ...titleStyle, fontSize: 28, marginBottom: 12 }}>
                Landing assets incoming
              </h2>
              <p style={bodyStyle}>
                We’ll replace this placeholder with the provided `@app`, `@components`, and
                `@public` landing content, keeping it isolated under `features/landing`.
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

