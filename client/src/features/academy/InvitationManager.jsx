import React, { useState } from 'react';
import { Link } from 'wouter';
import { useTranslation } from 'react-i18next';
import { useAuth } from '../../lib/AuthContext';
import useInvitations from './hooks/useInvitations';

const ROLE_OPTIONS_KEYS = ['player', 'coach', 'parent'];

export default function InvitationManager() {
  const { t } = useTranslation();
  const { activeOrg } = useAuth();
  const { invitations, loading, inviteByEmail, inviteByCode, revokeInvitation } =
    useInvitations(activeOrg?.id);
  const [activeTab, setActiveTab] = useState(0);

  const TABS = [t('academy.invitations.tabEmail'), t('academy.invitations.tabCode'), t('academy.invitations.tabAll')];

  return (
    <div style={containerStyle}>
      <div style={headerStyle}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
          <Link href="/academy" style={backLinkStyle}>&larr; {t('nav.dashboard')}</Link>
        </div>
        <h1 style={titleStyle}>{t('academy.invitations.title')}</h1>
        <p style={subtitleStyle}>{t('academy.invitations.subtitle', { orgName: activeOrg?.name })}</p>
      </div>

      {/* Tabs */}
      <div style={tabBarStyle}>
        {TABS.map((tab, i) => (
          <button
            key={tab}
            onClick={() => setActiveTab(i)}
            style={activeTab === i ? activeTabStyle : tabStyle}
          >
            {tab}
            {i === 2 && invitations.length > 0 && (
              <span style={badgeStyle}>{invitations.length}</span>
            )}
          </button>
        ))}
      </div>

      {/* Tab Content */}
      <div style={contentStyle}>
        {activeTab === 0 && (
          <EmailInviteTab orgId={activeOrg?.id} inviteByEmail={inviteByEmail} />
        )}
        {activeTab === 1 && (
          <CodeInviteTab orgId={activeOrg?.id} inviteByCode={inviteByCode} />
        )}
        {activeTab === 2 && (
          <InvitationsListTab
            invitations={invitations}
            loading={loading}
            onRevoke={revokeInvitation}
          />
        )}
      </div>
    </div>
  );
}

// ─── Tab 1: Invite by Email ────────────────────────────────────────────────────

function EmailInviteTab({ inviteByEmail }) {
  const { t } = useTranslation();
  const [email, setEmail] = useState('');
  const [role, setRole] = useState('player');
  const [submitting, setSubmitting] = useState(false);
  const [message, setMessage] = useState(null);

  const ROLE_OPTIONS = [
    { value: 'player', label: t('academy.invitations.rolePlayer') },
    { value: 'coach', label: t('academy.invitations.roleCoach') },
    { value: 'parent', label: t('academy.invitations.roleParent') },
  ];

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!email.trim()) return;

    setSubmitting(true);
    setMessage(null);
    try {
      await inviteByEmail({ email, role });
      setMessage({ type: 'success', text: t('academy.invitations.invitationSentTo', { email }) });
      setEmail('');
    } catch (err) {
      setMessage({ type: 'error', text: err.message });
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div style={cardStyle}>
      <h2 style={cardTitleStyle}>{t('academy.invitations.emailInviteTitle')}</h2>
      <p style={cardDescStyle}>
        {t('academy.invitations.emailInviteDescription')}
      </p>

      <form onSubmit={handleSubmit}>
        <div style={fieldStyle}>
          <label style={labelStyle}>{t('academy.invitations.emailLabel')}</label>
          <input
            type="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            placeholder={t('academy.invitations.emailPlaceholder')}
            style={inputStyle}
            required
          />
        </div>

        <div style={fieldStyle}>
          <label style={labelStyle}>{t('academy.invitations.roleLabel')}</label>
          <select value={role} onChange={(e) => setRole(e.target.value)} style={inputStyle}>
            {ROLE_OPTIONS.map((r) => (
              <option key={r.value} value={r.value}>{r.label}</option>
            ))}
          </select>
        </div>

        {message && (
          <p style={{ color: message.type === 'success' ? '#22c55e' : '#ef4444', fontSize: 13, marginBottom: 12 }}>
            {message.text}
          </p>
        )}

        <button type="submit" disabled={submitting || !email.trim()} style={primaryButtonStyle}>
          {submitting ? t('academy.invitations.sending') : t('academy.invitations.sendInvitation')}
        </button>
      </form>
    </div>
  );
}

// ─── Tab 2: Invite by Code ─────────────────────────────────────────────────────

function CodeInviteTab({ inviteByCode }) {
  const { t } = useTranslation();
  const [role, setRole] = useState('player');
  const [generatedCode, setGeneratedCode] = useState(null);
  const [submitting, setSubmitting] = useState(false);
  const [copied, setCopied] = useState(false);
  const [error, setError] = useState(null);

  const ROLE_OPTIONS = [
    { value: 'player', label: t('academy.invitations.rolePlayer') },
    { value: 'coach', label: t('academy.invitations.roleCoach') },
    { value: 'parent', label: t('academy.invitations.roleParent') },
  ];

  const handleGenerate = async () => {
    setSubmitting(true);
    setError(null);
    setGeneratedCode(null);
    try {
      const inv = await inviteByCode({ role });
      setGeneratedCode(inv.invite_code);
    } catch (err) {
      setError(err.message);
    } finally {
      setSubmitting(false);
    }
  };

  const handleCopy = async (text) => {
    try {
      await navigator.clipboard.writeText(text);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch {
      // Fallback for older browsers
      const textarea = document.createElement('textarea');
      textarea.value = text;
      document.body.appendChild(textarea);
      textarea.select();
      document.execCommand('copy');
      document.body.removeChild(textarea);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    }
  };

  const joinUrl = generatedCode
    ? `${window.location.origin}/join/${generatedCode}`
    : null;

  return (
    <div style={cardStyle}>
      <h2 style={cardTitleStyle}>{t('academy.invitations.codeInviteTitle')}</h2>
      <p style={cardDescStyle}>
        {t('academy.invitations.codeInviteDescription')}
      </p>

      <div style={fieldStyle}>
        <label style={labelStyle}>{t('academy.invitations.roleForInvitees')}</label>
        <select value={role} onChange={(e) => setRole(e.target.value)} style={inputStyle}>
          {ROLE_OPTIONS.map((r) => (
            <option key={r.value} value={r.value}>{r.label}</option>
          ))}
        </select>
      </div>

      {error && <p style={{ color: '#ef4444', fontSize: 13, marginBottom: 12 }}>{error}</p>}

      {!generatedCode ? (
        <button onClick={handleGenerate} disabled={submitting} style={primaryButtonStyle}>
          {submitting ? t('academy.invitations.generating') : t('academy.invitations.generateInviteCode')}
        </button>
      ) : (
        <div style={codeDisplayStyle}>
          <div style={codeBoxStyle}>
            <span style={codeTextStyle}>{generatedCode}</span>
            <button onClick={() => handleCopy(generatedCode)} style={copyButtonStyle}>
              {copied ? t('common.copied') : t('common.copy')}
            </button>
          </div>
          <div style={{ marginTop: 12 }}>
            <p style={{ fontSize: 12, color: '#71717a', marginBottom: 4 }}>{t('academy.invitations.shareLink')}</p>
            <div style={codeBoxStyle}>
              <span style={{ fontSize: 13, color: '#94a3b8', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap', flex: 1 }}>
                {joinUrl}
              </span>
              <button onClick={() => handleCopy(joinUrl)} style={copyButtonStyle}>
                {t('common.copy')}
              </button>
            </div>
          </div>
          <p style={{ fontSize: 12, color: '#71717a', marginTop: 12 }}>
            {t('academy.invitations.expiresIn30Days')}
          </p>
          <button
            onClick={() => { setGeneratedCode(null); setCopied(false); }}
            style={{ ...secondaryButtonStyle, marginTop: 12 }}
          >
            {t('academy.invitations.generateAnother')}
          </button>
        </div>
      )}
    </div>
  );
}

// ─── Tab 3: All Invitations ────────────────────────────────────────────────────

function InvitationsListTab({ invitations, loading, onRevoke }) {
  const { t } = useTranslation();
  const [revoking, setRevoking] = useState(null);

  const handleRevoke = async (id) => {
    setRevoking(id);
    try {
      await onRevoke(id);
    } catch (err) {
      console.error('Error revoking:', err);
    } finally {
      setRevoking(null);
    }
  };

  if (loading) {
    return <p style={{ color: '#71717a', textAlign: 'center', padding: 32 }}>{t('academy.invitations.loadingInvitations')}</p>;
  }

  if (invitations.length === 0) {
    return (
      <div style={{ ...cardStyle, textAlign: 'center' }}>
        <p style={{ color: '#71717a', fontSize: 14 }}>{t('academy.invitations.noInvitationsYet')}</p>
      </div>
    );
  }

  return (
    <div style={cardStyle}>
      <h2 style={cardTitleStyle}>{t('academy.invitations.allInvitationsTitle')}</h2>
      <div style={tableWrapStyle}>
        <table style={tableStyle}>
          <thead>
            <tr>
              <th style={thStyle}>{t('academy.invitations.columnRecipient')}</th>
              <th style={thStyle}>{t('academy.invitations.columnRole')}</th>
              <th style={thStyle}>{t('academy.invitations.columnStatus')}</th>
              <th style={thStyle}>{t('academy.invitations.columnCreated')}</th>
              <th style={thStyle}>{t('academy.invitations.columnAction')}</th>
            </tr>
          </thead>
          <tbody>
            {invitations.map((inv) => (
              <tr key={inv.id} style={trStyle}>
                <td style={tdStyle}>
                  {inv.email || (
                    <span style={{ fontFamily: 'monospace', fontSize: 13 }}>
                      {t('academy.invitations.codePrefix', { code: inv.invite_code })}
                    </span>
                  )}
                </td>
                <td style={tdStyle}>
                  <span style={roleBadgeStyle(inv.role)}>{inv.role}</span>
                </td>
                <td style={tdStyle}>
                  <span style={statusBadgeStyle(inv.status)}>{inv.status}</span>
                </td>
                <td style={tdStyle}>
                  {new Date(inv.created_at).toLocaleDateString()}
                </td>
                <td style={tdStyle}>
                  {inv.status === 'pending' && (
                    <button
                      onClick={() => handleRevoke(inv.id)}
                      disabled={revoking === inv.id}
                      style={revokeButtonStyle}
                    >
                      {revoking === inv.id ? '...' : t('academy.invitations.revoke')}
                    </button>
                  )}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}

// ─── Styles ────────────────────────────────────────────────────────────────────

const containerStyle = {
  minHeight: '100vh',
  background: 'radial-gradient(circle at 10% 20%, #0b1020, #050910 60%, #02060f)',
  color: '#e4e4e7',
  fontFamily: "'Inter', system-ui, -apple-system, sans-serif",
  padding: '32px',
};

const headerStyle = { maxWidth: 900, margin: '0 auto 24px' };
const titleStyle = { fontSize: 28, fontWeight: 700, margin: '12px 0 8px' };
const subtitleStyle = { fontSize: 14, color: '#9ca3af', margin: 0 };
const backLinkStyle = { color: '#3b82f6', textDecoration: 'none', fontSize: 14 };

const tabBarStyle = {
  maxWidth: 900,
  margin: '0 auto 24px',
  display: 'flex',
  gap: 4,
  background: 'rgba(255, 255, 255, 0.04)',
  borderRadius: 10,
  padding: 4,
};

const tabStyle = {
  flex: 1,
  padding: '10px 16px',
  background: 'transparent',
  border: 'none',
  borderRadius: 8,
  color: '#9ca3af',
  fontSize: 13,
  fontWeight: 500,
  cursor: 'pointer',
  display: 'flex',
  alignItems: 'center',
  justifyContent: 'center',
  gap: 6,
};

const activeTabStyle = {
  ...tabStyle,
  background: 'rgba(59, 130, 246, 0.15)',
  color: '#3b82f6',
};

const badgeStyle = {
  background: 'rgba(59, 130, 246, 0.25)',
  color: '#60a5fa',
  fontSize: 11,
  padding: '2px 6px',
  borderRadius: 10,
  fontWeight: 600,
};

const contentStyle = { maxWidth: 900, margin: '0 auto' };

const cardStyle = {
  background: 'rgba(15, 23, 42, 0.6)',
  border: '1px solid rgba(255, 255, 255, 0.08)',
  borderRadius: 16,
  padding: 24,
  backdropFilter: 'blur(12px)',
};

const cardTitleStyle = { fontSize: 18, fontWeight: 600, margin: '0 0 8px' };
const cardDescStyle = { fontSize: 13, color: '#9ca3af', margin: '0 0 20px', lineHeight: 1.5 };

const fieldStyle = { marginBottom: 16 };
const labelStyle = { display: 'block', fontSize: 13, fontWeight: 500, color: '#9ca3af', marginBottom: 6 };
const inputStyle = {
  width: '100%',
  padding: '10px 12px',
  background: 'rgba(255, 255, 255, 0.06)',
  border: '1px solid rgba(255, 255, 255, 0.12)',
  borderRadius: 8,
  color: '#e4e4e7',
  fontSize: 14,
  outline: 'none',
  boxSizing: 'border-box',
};

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
};

const secondaryButtonStyle = {
  width: '100%',
  padding: '10px 16px',
  background: 'transparent',
  border: '1px solid rgba(255, 255, 255, 0.12)',
  color: '#94a3b8',
  fontWeight: 500,
  fontSize: 13,
  borderRadius: 8,
  cursor: 'pointer',
};

const codeDisplayStyle = {
  background: 'rgba(0, 0, 0, 0.3)',
  borderRadius: 12,
  padding: 16,
};

const codeBoxStyle = {
  display: 'flex',
  alignItems: 'center',
  gap: 12,
  background: 'rgba(255, 255, 255, 0.06)',
  borderRadius: 8,
  padding: '10px 12px',
};

const codeTextStyle = {
  fontFamily: 'monospace',
  fontSize: 22,
  fontWeight: 700,
  letterSpacing: '0.15em',
  color: '#e4e4e7',
  flex: 1,
};

const copyButtonStyle = {
  padding: '6px 12px',
  background: 'rgba(59, 130, 246, 0.2)',
  border: '1px solid rgba(59, 130, 246, 0.3)',
  borderRadius: 6,
  color: '#60a5fa',
  fontSize: 12,
  fontWeight: 600,
  cursor: 'pointer',
  whiteSpace: 'nowrap',
};

// Table styles
const tableWrapStyle = { overflowX: 'auto' };
const tableStyle = { width: '100%', borderCollapse: 'collapse', fontSize: 13 };
const thStyle = {
  textAlign: 'left',
  padding: '10px 12px',
  color: '#71717a',
  fontWeight: 500,
  borderBottom: '1px solid rgba(255, 255, 255, 0.08)',
  whiteSpace: 'nowrap',
};
const trStyle = { borderBottom: '1px solid rgba(255, 255, 255, 0.04)' };
const tdStyle = { padding: '10px 12px', whiteSpace: 'nowrap' };

const roleBadgeStyle = (role) => ({
  padding: '2px 8px',
  borderRadius: 6,
  fontSize: 11,
  fontWeight: 600,
  textTransform: 'capitalize',
  background: role === 'coach' ? 'rgba(139, 92, 246, 0.2)' : role === 'player' ? 'rgba(59, 130, 246, 0.2)' : 'rgba(249, 115, 22, 0.2)',
  color: role === 'coach' ? '#a78bfa' : role === 'player' ? '#60a5fa' : '#fb923c',
});

const statusBadgeStyle = (status) => ({
  padding: '2px 8px',
  borderRadius: 6,
  fontSize: 11,
  fontWeight: 600,
  textTransform: 'capitalize',
  background:
    status === 'pending' ? 'rgba(234, 179, 8, 0.15)' :
    status === 'accepted' ? 'rgba(34, 197, 94, 0.15)' :
    status === 'revoked' ? 'rgba(239, 68, 68, 0.15)' :
    'rgba(113, 113, 122, 0.15)',
  color:
    status === 'pending' ? '#eab308' :
    status === 'accepted' ? '#22c55e' :
    status === 'revoked' ? '#ef4444' :
    '#71717a',
});

const revokeButtonStyle = {
  padding: '4px 10px',
  background: 'rgba(239, 68, 68, 0.15)',
  border: '1px solid rgba(239, 68, 68, 0.25)',
  borderRadius: 6,
  color: '#ef4444',
  fontSize: 12,
  fontWeight: 500,
  cursor: 'pointer',
};
