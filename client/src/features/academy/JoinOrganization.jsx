import React, { useEffect, useState } from 'react';
import { useLocation, useParams } from 'wouter';
import { useTranslation } from 'react-i18next';
import { Hash, AlertTriangle, Check, Sparkles } from 'lucide-react';
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

  const [manualCode, setManualCode] = useState('');
  const [manualSubmitting, setManualSubmitting] = useState(false);

  useEffect(() => {
    if (!code) {
      setLoading(false);
      return;
    }

    lookupInviteCode(code).then(({ invitation: inv, error: lookupError }) => {
      if (lookupError) {
        setError(lookupError);
      } else {
        setInvitation(inv);
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

  if (!isAuthenticated && !loading) {
    if (code) sessionStorage.setItem('joinRedirect', `/join/${code}`);
    navigate('/login');
    return null;
  }

  return (
    <div className="auth-shell">
      <div className="auth-shell__card auth-shell__card--center">
        {loading ? (
          <div style={{ padding: 24 }}>
            <span className="spinner spinner--lg" aria-hidden="true" />
            <p style={{ marginTop: 16, color: 'var(--text-tertiary)' }}>
              {t('academy.join.lookingUpInvite')}
            </p>
          </div>
        ) : !code ? (
          <>
            <div className="auth-shell__icon auth-shell__icon--info" aria-hidden="true">
              <Hash size={24} />
            </div>
            <h1 className="auth-shell__title">{t('academy.join.enterCodeTitle')}</h1>
            <p className="auth-shell__desc">{t('academy.join.enterCodeDesc')}</p>
            <form onSubmit={handleManualSubmit}>
              <input
                type="text"
                className="code-input"
                value={manualCode}
                onChange={(e) => setManualCode(e.target.value.toUpperCase().replace(/[^A-Z0-9]/g, ''))}
                placeholder="ABCD1234"
                maxLength={12}
                autoFocus
                aria-label={t('academy.join.enterCodeTitle')}
              />
              <button
                type="submit"
                className="btn-primary"
                disabled={manualCode.trim().length < 6 || manualSubmitting}
                style={{ width: '100%', justifyContent: 'center', marginTop: 14 }}
              >
                {t('academy.join.continue')}
              </button>
            </form>
            <button
              type="button"
              className="btn-secondary"
              onClick={() => navigate('/')}
              style={{ width: '100%', justifyContent: 'center', marginTop: 10 }}
            >
              {t('academy.join.goHome')}
            </button>
          </>
        ) : error && !invitation ? (
          <>
            <div className="auth-shell__icon auth-shell__icon--danger" aria-hidden="true">
              <AlertTriangle size={24} />
            </div>
            <h1 className="auth-shell__title">{t('academy.join.invalidInvite')}</h1>
            <p className="auth-shell__desc">{error}</p>
            <button
              type="button"
              className="btn-primary"
              onClick={() => navigate('/')}
              style={{ width: '100%', justifyContent: 'center' }}
            >
              {t('academy.join.goHome')}
            </button>
          </>
        ) : accepted ? (
          <>
            <div className="auth-shell__icon auth-shell__icon--success" aria-hidden="true">
              <Check size={24} />
            </div>
            <h1 className="auth-shell__title">
              {alreadyMember ? t('academy.join.alreadyMember') : t('academy.join.youreIn')}
            </h1>
            <p className="auth-shell__desc">
              {alreadyMember
                ? t('academy.join.alreadyMemberDesc', { orgName: invitation.organizations?.name })
                : t('academy.join.joinedAs', { orgName: invitation.organizations?.name, role: invitation.role })}
            </p>
          </>
        ) : (
          <>
            <div className="auth-shell__icon auth-shell__icon--info" aria-hidden="true">
              <Sparkles size={22} />
            </div>
            <h1 className="auth-shell__title">{t('academy.join.youveBeenInvited')}</h1>

            <div className="entity-preview">
              {invitation.organizations?.logo_url && (
                <img
                  src={invitation.organizations.logo_url}
                  alt=""
                  className="entity-preview__logo"
                />
              )}
              <p className="entity-preview__name">{invitation.organizations?.name}</p>
              <p className="entity-preview__type">{invitation.organizations?.type}</p>
              {invitation.organizations?.description && (
                <p className="entity-preview__desc">{invitation.organizations.description}</p>
              )}
            </div>

            <p className="auth-shell__desc">
              {t('academy.join.joiningAs', { role: invitation.role })}
            </p>

            {error && (
              <div role="alert" className="alert alert--danger">{error}</div>
            )}

            <button
              type="button"
              className="btn-primary"
              onClick={handleAccept}
              disabled={accepting}
              style={{ width: '100%', justifyContent: 'center' }}
            >
              {accepting ? (
                <>
                  <span className="spinner" aria-hidden="true" />
                  {t('academy.join.joining')}
                </>
              ) : (
                t('academy.join.acceptInvitation')
              )}
            </button>
            <button
              type="button"
              className="btn-secondary"
              onClick={() => navigate('/')}
              style={{ width: '100%', justifyContent: 'center', marginTop: 10 }}
            >
              {t('academy.join.decline')}
            </button>
          </>
        )}
      </div>
    </div>
  );
}
