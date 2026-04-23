import React, { useEffect, useState } from 'react';
import { useLocation, useParams } from 'wouter';
import { useTranslation } from 'react-i18next';
import { useAuth } from '../../lib/AuthContext';
import { lookupInviteCode, acceptInvitation } from './hooks/useInvitations';

export default function JoinOrganization() {
  const { t } = useTranslation();
  const { code } = useParams();
  const [, navigate] = useLocation();
  const { isAuthenticated, refreshOrganizations, organizations } = useAuth();

  const [invitation, setInvitation] = useState(null);
  const [loading, setLoading] = useState(!!code);
  const [error, setError] = useState(null);
  const [accepting, setAccepting] = useState(false);
  const [accepted, setAccepted] = useState(false);
  const [alreadyMember, setAlreadyMember] = useState(false);

  // Manual-entry state (used when no code is in the URL)
  const [manualCode, setManualCode] = useState('');
  const [manualSubmitting, setManualSubmitting] = useState(false);

  // Look up the invite code on mount
  useEffect(() => {
    if (!code) {
      // No code in URL — show manual entry form, don't error
      setLoading(false);
      return;
    }

    lookupInviteCode(code).then(({ invitation: inv, error: lookupError }) => {
      if (lookupError) {
        setError(lookupError);
      } else {
        setInvitation(inv);
        // Server already tells us if the user is a member
        if (inv?.already_member) setAlreadyMember(true);
      }
      setLoading(false);
    });
  }, [code]);

  const handleManualSubmit = (e) => {
    e.preventDefault();
    const trimmed = manualCode.trim().toUpperCase();
    if (trimmed.length < 6) return;
    setManualSubmitting(true);
    navigate(`/join/${trimmed}`);
  };

  const handleAccept = async () => {
    if (!invitation) return;
    setAccepting(true);
    setError(null);

    try {
      const prevOrgIds = new Set((organizations || []).map((o) => o.id));
      const acceptResult = await acceptInvitation(code);
      await refreshOrganizations();
      // Prefer server flag; fall back to pre/post membership diff
      const serverAlready = acceptResult?.already_member === true;
      if (serverAlready || prevOrgIds.has(invitation.organization_id)) {
        setAlreadyMember(true);
      }
      setAccepted(true);
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
    if (code) sessionStorage.setItem('joinRedirect', `/join/${code}`);
    navigate('/login');
    return null;
  }

  return (
    <div style={containerStyle}>
      <style>{`@keyframes spin { from { transform: rotate(0deg); } to { transform: rotate(360deg); } }`}</style>
      <div style={cardStyle}>
        {loading ? (
          <div style={{ textAlign: 'center', padding: 24 }}>
            <div style={spinnerStyle} />
            <p style={{ marginTop: 16, color: '#71717a' }}>{t('academy.join.lookingUpInvite')}</p>
          </div>
        ) : !code ? (
          <>
            <div style={iconCircleStyle('#3b82f6')}>#</div>
            <h1 style={titleStyle}>{t('academy.join.enterCodeTitle', 'Enter your invite code')}</h1>
            <p style={descStyle}>
              {t('academy.join.enterCodeDesc', 'Paste the 8-character code your coach gave you.')}
            </p>
            <form onSubmit={handleManualSubmit}>
              <input
                type="text"
                value={manualCode}
                onChange={(e) => setManualCode(e.target.value.toUpperCase().replace(/[^A-Z0-9]/g, ''))}
                placeholder="ABCD1234"
                maxLength={12}
                autoFocus
                style={codeInputStyle}
              />
              <button
                type="submit"
                disabled={manualCode.trim().length < 6 || manualSubmitting}
                style={{
                  ...primaryButtonStyle,
                  opacity: manualCode.trim().length < 6 ? 0.5 : 1,
                  cursor: manualCode.trim().length < 6 ? 'not-allowed' : 'pointer',
                }}
              >
                {t('academy.join.continue', 'Continue')}
              </button>
            </form>
            <button onClick={() => navigate('/')} style={secondaryButtonStyle}>
              {t('academy.join.goHome')}
            </button>
          </>
        ) : error && !invitation ? (
          <>
            <div style={iconCircleStyle('#ef4444')}>!</div>
            <h1 style={titleStyle}>{t('academy.join.invalidInvite')}</h1>
            <p style={descStyle}>{error}</p>
            <button onClick={() => navigate('/')} style={primaryButtonStyle}>
              {t('academy.join.goHome')}
            </button>
          </>
        ) : accepted ? (
          <>
            <div style={iconCircleStyle('#22c55e')}>&#10003;</div>
            <h1 style={titleStyle}>
              {alreadyMember ? t('academy.join.alreadyMember') : t('academy.join.youreIn')}
            </h1>
            <p style={descStyle}>
              {alreadyMember
                ? t('academy.join.alreadyMemberDesc', { orgName: invitation.organizations?.name })
                : t('academy.join.joinedAs', { orgName: invitation.organizations?.name, role: invitation.role })}
            </p>
          </>
        ) : (
          <>
            <div style={iconCircleStyle('#3b82f6')}>&#9734;</div>
            <h1 style={titleStyle}>{t('academy.join.youveBeenInvited')}</h1>
            <div style={orgInfoStyle}>
              {invitation.organizations?.logo_url && (
                <img
                  src={invitation.organizations.logo_url}
                  alt={invitation.organizations.name}
                  style={{ width: 48, height: 48, borderRadius: 8, objectFit: 'cover', margin: '0 auto 8px', display: 'block' }}
                />
              )}
              <p style={orgNameStyle}>{invitation.organizations?.name}</p>
              <p style={orgTypeStyle}>{invitation.organizations?.type}</p>
              {invitation.organizations?.description && (
                <p style={{ fontSize: 13, color: '#9ca3af', margin: '8px 0 0', lineHeight: 1.4 }}>
                  {invitation.organizations.description}
                </p>
              )}
            </div>
            <p style={descStyle}>
              {t('academy.join.joiningAs', { role: invitation.role })}
            </p>

            {error && <p style={{ color: '#ef4444', fontSize: 13, marginBottom: 12 }}>{error}</p>}

            <button onClick={handleAccept} disabled={accepting} style={primaryButtonStyle}>
              {accepting ? t('academy.join.joining') : t('academy.join.acceptInvitation')}
            </button>
            <button onClick={() => navigate('/')} style={secondaryButtonStyle}>
              {t('academy.join.decline')}
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

const codeInputStyle = {
  width: '100%',
  padding: '14px 16px',
  fontSize: 20,
  fontWeight: 700,
  fontFamily: 'SFMono-Regular, Menlo, monospace',
  letterSpacing: '0.15em',
  textAlign: 'center',
  background: 'rgba(255, 255, 255, 0.04)',
  border: '1px solid rgba(255, 255, 255, 0.12)',
  color: '#e4e4e7',
  borderRadius: 10,
  marginBottom: 12,
  outline: 'none',
  textTransform: 'uppercase',
};
