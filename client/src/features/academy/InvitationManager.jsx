import React, { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { toast } from 'sonner';
import { useAuth } from '../../lib/AuthContext';
import useInvitations from './hooks/useInvitations';
import { PageContainer, PageHeader, BackLink } from '../../components/Page';

const ROLE_BADGE_VARIANT = {
  player: 'badge--info',
  coach: 'badge--info',
  parent: 'badge--warning',
};

const STATUS_BADGE_VARIANT = {
  pending: 'badge--warning',
  accepted: 'badge--success',
  revoked: 'badge--danger',
};

export default function InvitationManager() {
  const { t } = useTranslation();
  const { activeOrg } = useAuth();
  const { invitations, loading, inviteByEmail, inviteByCode, revokeInvitation } =
    useInvitations(activeOrg?.id);
  const [activeTab, setActiveTab] = useState(0);

  const TABS = [
    t('academy.invitations.tabEmail'),
    t('academy.invitations.tabCode'),
    t('academy.invitations.tabAll'),
  ];

  return (
    <PageContainer width="narrow">
      <PageHeader
        backLink={<BackLink href="/academy">{t('nav.dashboard')}</BackLink>}
        title={t('academy.invitations.title')}
        subtitle={t('academy.invitations.subtitle', { orgName: activeOrg?.name })}
      />

      <div className="tabs" role="tablist" style={{ width: '100%' }}>
        {TABS.map((tab, i) => (
          <button
            key={tab}
            type="button"
            role="tab"
            aria-selected={activeTab === i}
            className={`tab${activeTab === i ? ' tab--active' : ''}`}
            style={{ flex: 1, justifyContent: 'center' }}
            onClick={() => setActiveTab(i)}
          >
            {tab}
            {i === 2 && invitations.length > 0 && (
              <span className="tab__count">{invitations.length}</span>
            )}
          </button>
        ))}
      </div>

      {activeTab === 0 && <EmailInviteTab inviteByEmail={inviteByEmail} />}
      {activeTab === 1 && <CodeInviteTab inviteByCode={inviteByCode} />}
      {activeTab === 2 && (
        <InvitationsListTab
          invitations={invitations}
          loading={loading}
          onRevoke={revokeInvitation}
        />
      )}
    </PageContainer>
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
    <section className="card card--lg">
      <h2 className="section__title">{t('academy.invitations.emailInviteTitle')}</h2>
      <p className="section__desc">{t('academy.invitations.emailInviteDescription')}</p>

      <form onSubmit={handleSubmit}>
        <div className="field">
          <label className="field-label" htmlFor="invite-email">
            {t('academy.invitations.emailLabel')}
          </label>
          <input
            id="invite-email"
            className="input"
            type="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            placeholder={t('academy.invitations.emailPlaceholder')}
            required
            autoComplete="email"
          />
        </div>

        <div className="field">
          <label className="field-label" htmlFor="invite-role">
            {t('academy.invitations.roleLabel')}
          </label>
          <select
            id="invite-role"
            className="select"
            value={role}
            onChange={(e) => setRole(e.target.value)}
          >
            {ROLE_OPTIONS.map((r) => (
              <option key={r.value} value={r.value}>{r.label}</option>
            ))}
          </select>
        </div>

        {message && (
          <div
            role={message.type === 'success' ? 'status' : 'alert'}
            aria-live="polite"
            className={`alert alert--${message.type === 'success' ? 'success' : 'danger'}`}
          >
            {message.text}
          </div>
        )}

        <button
          type="submit"
          className="btn-primary"
          disabled={submitting || !email.trim()}
          style={{ width: '100%', justifyContent: 'center' }}
        >
          {submitting ? (
            <>
              <span className="spinner" aria-hidden="true" />
              {t('academy.invitations.sending')}
            </>
          ) : (
            t('academy.invitations.sendInvitation')
          )}
        </button>
      </form>
    </section>
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
    <section className="card card--lg">
      <h2 className="section__title">{t('academy.invitations.codeInviteTitle')}</h2>
      <p className="section__desc">{t('academy.invitations.codeInviteDescription')}</p>

      <div className="field">
        <label className="field-label" htmlFor="invite-code-role">
          {t('academy.invitations.roleForInvitees')}
        </label>
        <select
          id="invite-code-role"
          className="select"
          value={role}
          onChange={(e) => setRole(e.target.value)}
        >
          {ROLE_OPTIONS.map((r) => (
            <option key={r.value} value={r.value}>{r.label}</option>
          ))}
        </select>
      </div>

      {error && (
        <div role="alert" className="alert alert--danger">{error}</div>
      )}

      {!generatedCode ? (
        <button
          type="button"
          className="btn-primary"
          onClick={handleGenerate}
          disabled={submitting}
          style={{ width: '100%', justifyContent: 'center' }}
        >
          {submitting ? (
            <>
              <span className="spinner" aria-hidden="true" />
              {t('academy.invitations.generating')}
            </>
          ) : (
            t('academy.invitations.generateInviteCode')
          )}
        </button>
      ) : (
        <div className="code-reveal">
          <div className="code-reveal__row">
            <span className="code-reveal__code">{generatedCode}</span>
            <button
              type="button"
              className="code-reveal__copy-btn"
              onClick={() => handleCopy(generatedCode)}
            >
              {copied ? t('common.copied') : t('common.copy')}
            </button>
          </div>
          <p className="field-hint" style={{ marginTop: 12, marginBottom: 4 }}>
            {t('academy.invitations.shareLink')}
          </p>
          <div className="code-reveal__row">
            <span className="code-reveal__url">{joinUrl}</span>
            <button
              type="button"
              className="code-reveal__copy-btn"
              onClick={() => handleCopy(joinUrl)}
            >
              {t('common.copy')}
            </button>
          </div>
          <p className="code-reveal__hint">{t('academy.invitations.expiresIn30Days')}</p>
          <button
            type="button"
            className="btn-secondary"
            onClick={() => { setGeneratedCode(null); setCopied(false); }}
            style={{ width: '100%', justifyContent: 'center', marginTop: 12 }}
          >
            {t('academy.invitations.generateAnother')}
          </button>
        </div>
      )}
    </section>
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
      toast.error(err.message);
    } finally {
      setRevoking(null);
    }
  };

  if (loading) {
    return (
      <div className="empty-compact">
        <span className="spinner spinner--lg" aria-hidden="true" />
        <p className="empty-compact__msg" style={{ marginTop: 12 }}>
          {t('academy.invitations.loadingInvitations')}
        </p>
      </div>
    );
  }

  if (invitations.length === 0) {
    return (
      <div className="card card--lg">
        <div className="empty-compact">
          <p className="empty-compact__msg">{t('academy.invitations.noInvitationsYet')}</p>
        </div>
      </div>
    );
  }

  return (
    <section className="card card--lg">
      <h2 className="section__title" style={{ marginBottom: 14 }}>
        {t('academy.invitations.allInvitationsTitle')}
      </h2>
      <div className="data-table-wrap__scroll">
        <table className="data-table">
          <thead>
            <tr>
              <th scope="col">{t('academy.invitations.columnRecipient')}</th>
              <th scope="col">{t('academy.invitations.columnRole')}</th>
              <th scope="col">{t('academy.invitations.columnStatus')}</th>
              <th scope="col">{t('academy.invitations.columnCreated')}</th>
              <th scope="col">{t('academy.invitations.columnAction')}</th>
            </tr>
          </thead>
          <tbody>
            {invitations.map((inv) => (
              <tr key={inv.id}>
                <td>
                  {inv.email || (
                    <span style={{ fontFamily: 'monospace', fontSize: 13 }}>
                      {t('academy.invitations.codePrefix', { code: inv.invite_code })}
                    </span>
                  )}
                </td>
                <td>
                  <span className={`badge ${ROLE_BADGE_VARIANT[inv.role] || 'badge--neutral'}`}>
                    {inv.role}
                  </span>
                </td>
                <td>
                  <span className={`badge ${STATUS_BADGE_VARIANT[inv.status] || 'badge--neutral'}`}>
                    {inv.status}
                  </span>
                </td>
                <td>{new Date(inv.created_at).toLocaleDateString()}</td>
                <td>
                  {inv.status === 'pending' && (
                    <button
                      type="button"
                      className="btn-secondary"
                      style={{ padding: '6px 12px', fontSize: 12 }}
                      onClick={() => handleRevoke(inv.id)}
                      disabled={revoking === inv.id}
                    >
                      {revoking === inv.id ? (
                        <span className="spinner" aria-hidden="true" />
                      ) : (
                        t('academy.invitations.revoke')
                      )}
                    </button>
                  )}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </section>
  );
}
