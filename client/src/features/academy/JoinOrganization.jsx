import React, { useEffect, useState } from 'react';
import { useLocation, useParams } from 'wouter';
import { useAuth } from '../../lib/AuthContext';
import { lookupInviteCode, acceptInvitation } from './hooks/useInvitations';

export default function JoinOrganization() {
  const { code } = useParams();
  const [, navigate] = useLocation();
  const { isAuthenticated, refreshOrganizations } = useAuth();

  const [invitation, setInvitation] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [accepting, setAccepting] = useState(false);
  const [accepted, setAccepted] = useState(false);

  // Look up the invite code on mount
  useEffect(() => {
    if (!code) {
      setError('No invite code provided');
      setLoading(false);
      return;
    }

    lookupInviteCode(code).then(({ invitation: inv, error: lookupError }) => {
      if (lookupError) {
        setError(lookupError);
      } else {
        setInvitation(inv);
      }
      setLoading(false);
    });
  }, [code]);

  const handleAccept = async () => {
    if (!invitation) return;
    setAccepting(true);
    setError(null);

    try {
      await acceptInvitation(invitation);
      setAccepted(true);
      await refreshOrganizations();
      // Redirect after a short delay
      setTimeout(() => {
        const isCoachRole = ['coach', 'admin', 'owner'].includes(invitation.role);
        navigate(isCoachRole ? '/academy' : '/');
      }, 2000);
    } catch (err) {
      setError(err.message);
    } finally {
      setAccepting(false);
    }
  };

  // Redirect to login if not authenticated (will come back after login)
  if (!isAuthenticated && !loading) {
    // Store the join URL so login can redirect back
    sessionStorage.setItem('joinRedirect', `/join/${code}`);
    navigate('/login');
    return null;
  }

  return (
    <div style={containerStyle}>
      <div style={cardStyle}>
        {loading ? (
          <div style={{ textAlign: 'center', padding: 24 }}>
            <div style={spinnerStyle} />
            <p style={{ marginTop: 16, color: '#71717a' }}>Looking up invite...</p>
          </div>
        ) : error && !invitation ? (
          <>
            <div style={iconCircleStyle('#ef4444')}>!</div>
            <h1 style={titleStyle}>Invalid Invite</h1>
            <p style={descStyle}>{error}</p>
            <button onClick={() => navigate('/')} style={primaryButtonStyle}>
              Go Home
            </button>
          </>
        ) : accepted ? (
          <>
            <div style={iconCircleStyle('#22c55e')}>&#10003;</div>
            <h1 style={titleStyle}>You're In!</h1>
            <p style={descStyle}>
              You've joined <strong>{invitation.organizations?.name}</strong> as a {invitation.role}.
              Redirecting...
            </p>
          </>
        ) : (
          <>
            <div style={iconCircleStyle('#3b82f6')}>&#9734;</div>
            <h1 style={titleStyle}>You've Been Invited</h1>
            <div style={orgInfoStyle}>
              <p style={orgNameStyle}>{invitation.organizations?.name}</p>
              <p style={orgTypeStyle}>{invitation.organizations?.type}</p>
            </div>
            <p style={descStyle}>
              You'll be joining as a <strong style={{ color: '#e4e4e7' }}>{invitation.role}</strong>.
            </p>

            {error && <p style={{ color: '#ef4444', fontSize: 13, marginBottom: 12 }}>{error}</p>}

            <button onClick={handleAccept} disabled={accepting} style={primaryButtonStyle}>
              {accepting ? 'Joining...' : 'Accept Invitation'}
            </button>
            <button onClick={() => navigate('/')} style={secondaryButtonStyle}>
              Decline
            </button>
          </>
        )}
      </div>
    </div>
  );
}

// ─── Styles ────────────────────────────────────────────────────────────────────

const containerStyle = {
  minHeight: '100vh',
  display: 'flex',
  alignItems: 'center',
  justifyContent: 'center',
  background: 'radial-gradient(circle at 10% 20%, #0b1020, #050910 60%, #02060f)',
  color: '#e4e4e7',
  padding: 32,
  fontFamily: "'Inter', system-ui, -apple-system, sans-serif",
};

const cardStyle = {
  background: 'rgba(15, 23, 42, 0.6)',
  border: '1px solid rgba(255, 255, 255, 0.08)',
  borderRadius: 16,
  padding: 32,
  maxWidth: 420,
  width: '100%',
  textAlign: 'center',
  boxShadow: '0 20px 60px rgba(0,0,0,0.35)',
  backdropFilter: 'blur(12px)',
};

const spinnerStyle = {
  width: 40,
  height: 40,
  border: '3px solid #27272a',
  borderTopColor: '#E63946',
  borderRadius: '50%',
  animation: 'spin 1s linear infinite',
  margin: '0 auto',
};

const iconCircleStyle = (color) => ({
  width: 56,
  height: 56,
  borderRadius: '50%',
  background: `${color}20`,
  color,
  display: 'flex',
  alignItems: 'center',
  justifyContent: 'center',
  fontSize: 24,
  fontWeight: 700,
  margin: '0 auto 16px',
  border: `2px solid ${color}40`,
});

const titleStyle = { fontSize: 22, fontWeight: 700, margin: '0 0 12px' };
const descStyle = { fontSize: 14, color: '#9ca3af', lineHeight: 1.5, marginBottom: 20 };

const orgInfoStyle = {
  background: 'rgba(255, 255, 255, 0.04)',
  borderRadius: 10,
  padding: '12px 16px',
  marginBottom: 16,
};

const orgNameStyle = { fontSize: 16, fontWeight: 600, margin: '0 0 4px', color: '#e4e4e7' };
const orgTypeStyle = { fontSize: 12, color: '#71717a', margin: 0, textTransform: 'capitalize' };

const primaryButtonStyle = {
  width: '100%',
  padding: '12px 16px',
  background: 'linear-gradient(135deg, #2563eb, #22d3ee)',
  color: '#0b1020',
  fontWeight: 600,
  fontSize: 14,
  border: 'none',
  borderRadius: 10,
  cursor: 'pointer',
  marginBottom: 8,
};

const secondaryButtonStyle = {
  width: '100%',
  padding: '10px 16px',
  background: 'transparent',
  border: '1px solid rgba(255, 255, 255, 0.08)',
  color: '#94a3b8',
  fontWeight: 500,
  fontSize: 13,
  borderRadius: 8,
  cursor: 'pointer',
};
