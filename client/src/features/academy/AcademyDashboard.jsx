import React from 'react';
import { useAuth } from '../../lib/AuthContext';

export default function AcademyDashboard() {
  const { activeOrg } = useAuth();

  return (
    <div style={containerStyle}>
      <div style={headerStyle}>
        <h1 style={titleStyle}>{activeOrg?.name || 'Academy'} Dashboard</h1>
        <p style={subtitleStyle}>
          {activeOrg?.type} &middot; {activeOrg?.player_count || 0} players &middot; {activeOrg?.coach_count || 0} coaches
        </p>
      </div>
      <div style={placeholderStyle}>
        <p style={{ color: '#71717a', fontSize: 16 }}>
          Dashboard KPIs, charts, and player insights coming soon.
        </p>
      </div>
    </div>
  );
}

const containerStyle = {
  minHeight: '100vh',
  background: 'radial-gradient(circle at 10% 20%, #0b1020, #050910 60%, #02060f)',
  color: '#e4e4e7',
  fontFamily: "'Inter', system-ui, -apple-system, sans-serif",
  padding: '32px',
};

const headerStyle = {
  maxWidth: 1200,
  margin: '0 auto 32px',
};

const titleStyle = {
  fontSize: 28,
  fontWeight: 700,
  margin: '0 0 8px',
};

const subtitleStyle = {
  fontSize: 14,
  color: '#9ca3af',
  margin: 0,
  textTransform: 'capitalize',
};

const placeholderStyle = {
  maxWidth: 1200,
  margin: '0 auto',
  padding: '48px 32px',
  background: 'rgba(15, 23, 42, 0.6)',
  border: '1px solid rgba(255, 255, 255, 0.08)',
  borderRadius: 16,
  textAlign: 'center',
};
