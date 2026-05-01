import React, { useState, useEffect } from 'react';
import { useLocation } from 'wouter';
import { useTranslation } from 'react-i18next';
import { User, Mail, Check, Save, Trash2, Lock } from 'lucide-react';
import { useAuth } from '../../lib/AuthContext';
import ConfirmModal from '../../components/modals/ConfirmModal';
import { PageContainer, PageHeader } from '../../components/Page';

const COOLDOWN_DAYS = 7;

export default function AccountPage() {
  const { t } = useTranslation();
  const [, setLocation] = useLocation();
  const { user, profile, updateProfile, deleteAccount, profileLoading, isAuthenticated } = useAuth();
  const [fullName, setFullName] = useState('');
  const [saving, setSaving] = useState(false);
  const [success, setSuccess] = useState(false);
  const [error, setError] = useState('');
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
  const [deleting, setDeleting] = useState(false);
  const [deleteError, setDeleteError] = useState('');

  useEffect(() => {
    if (!isAuthenticated && !profileLoading) {
      setLocation('/login');
    }
  }, [isAuthenticated, profileLoading, setLocation]);

  useEffect(() => {
    if (profile) {
      setFullName(profile.full_name || '');
    }
  }, [profile]);

  const lastEdit = profile?.updated_at ? new Date(profile.updated_at) : null;
  const daysSinceEdit = lastEdit ? (Date.now() - lastEdit.getTime()) / 86400000 : Infinity;
  const hasSetNameBefore = !!(profile?.full_name);
  const canEdit = !hasSetNameBefore || daysSinceEdit >= COOLDOWN_DAYS;
  const daysUntilEdit = canEdit ? 0 : Math.ceil(COOLDOWN_DAYS - daysSinceEdit);

  const handleDeleteAccount = async () => {
    setDeleting(true);
    setDeleteError('');
    try {
      await deleteAccount();
      setLocation('/');
    } catch (err) {
      setDeleteError(err.message || t('errors.generic'));
      setDeleting(false);
    }
  };

  const getInitials = () => {
    if (fullName.trim()) {
      const names = fullName.trim().split(' ');
      if (names.length >= 2) {
        return `${names[0][0]}${names[names.length - 1][0]}`.toUpperCase();
      }
      return fullName.trim().substring(0, 2).toUpperCase();
    }
    if (user?.email) {
      return user.email.substring(0, 2).toUpperCase();
    }
    return 'U';
  };

  const handleSave = async (e) => {
    e.preventDefault();

    if (!fullName.trim()) {
      setError(t('errors.enterName'));
      return;
    }

    if (!canEdit) {
      setError(t('account.editCooldownLocked', { days: daysUntilEdit }));
      return;
    }

    setSaving(true);
    setError('');
    setSuccess(false);

    try {
      await updateProfile({ full_name: fullName.trim() });
      setSuccess(true);
      setTimeout(() => setSuccess(false), 3000);
    } catch (err) {
      setError(err.message || t('errors.profileUpdateFailed'));
    } finally {
      setSaving(false);
    }
  };

  return (
    <>
      <PageContainer width="narrow">
        <PageHeader
          title={t('account.pageTitle')}
          subtitle={t('account.pageSubtitle')}
        />

        {/* Profile Section */}
        <section className="card card--lg">
          <div className="card-heading">
            <User size={20} aria-hidden="true" />
            <h2>{t('account.profileInfo')}</h2>
          </div>

          <div className="media-row">
            <span className="avatar avatar--lg" aria-hidden="true">{getInitials()}</span>
            <div className="media-row__main">
              <p className="media-row__title">{fullName || t('account.yourName')}</p>
              <p className="media-row__sub">{user?.email}</p>
            </div>
          </div>

          <form onSubmit={handleSave}>
            <div className="field">
              <label className="field-label" htmlFor="account-name">
                <User size={16} aria-hidden="true" />
                {t('account.fullNameLabel')}
              </label>
              <input
                id="account-name"
                className="input"
                type="text"
                value={fullName}
                onChange={(e) => setFullName(e.target.value)}
                placeholder={t('account.fullNamePlaceholder')}
                disabled={!canEdit}
                autoComplete="name"
              />
              {canEdit ? (
                <p className="field-hint">{t('account.editCooldownHint')}</p>
              ) : (
                <p className="field-hint field-hint--warning">
                  <Lock size={12} aria-hidden="true" />
                  <span>
                    {t('account.editCooldownLocked', { days: daysUntilEdit })}
                    {' · '}
                    <span style={{ color: 'var(--text-tertiary)' }}>
                      {t('account.editCooldownHint')}
                    </span>
                  </span>
                </p>
              )}
            </div>

            <div className="field">
              <label className="field-label" htmlFor="account-email">
                <Mail size={16} aria-hidden="true" />
                {t('account.emailLabel')}
              </label>
              <input
                id="account-email"
                className="input"
                type="email"
                value={user?.email || ''}
                disabled
                autoComplete="email"
              />
              <p className="field-hint">{t('account.emailCannotChange')}</p>
            </div>

            {error && (
              <div role="alert" className="alert alert--danger">{error}</div>
            )}

            {success && (
              <div role="status" aria-live="polite" className="alert alert--success">
                <Check size={16} aria-hidden="true" />
                <span>{t('errors.profileUpdated')}</span>
              </div>
            )}

            <button
              type="submit"
              className="btn-primary"
              disabled={saving || profileLoading || !canEdit}
              style={{ width: '100%', justifyContent: 'center' }}
            >
              {saving ? (
                <>
                  <span className="spinner" aria-hidden="true" />
                  {t('common.saving')}
                </>
              ) : (
                <>
                  <Save size={18} aria-hidden="true" />
                  {t('account.saveChanges')}
                </>
              )}
            </button>
          </form>
        </section>

        {/* Danger Zone */}
        <section className="card card--lg card--danger" style={{ marginTop: 24 }}>
          <div className="card-heading card-heading--danger">
            <Trash2 size={20} aria-hidden="true" />
            <h2>{t('account.dangerZone')}</h2>
          </div>

          <p className="section__desc" style={{ marginBottom: 20 }}>
            {t('account.deleteAccountWarning')}
          </p>

          {deleteError && (
            <div role="alert" className="alert alert--danger">{deleteError}</div>
          )}

          <button
            type="button"
            className="danger-button"
            onClick={() => setShowDeleteConfirm(true)}
            disabled={deleting}
          >
            <Trash2 size={16} aria-hidden="true" />
            {deleting ? t('account.deletingAccount') : t('account.deleteAccount')}
          </button>
        </section>
      </PageContainer>

      <ConfirmModal
        isOpen={showDeleteConfirm}
        title={t('account.deleteAccountConfirmTitle')}
        message={t('account.deleteAccountConfirmMessage')}
        confirmLabel={t('account.deleteAccountConfirmButton')}
        confirmDanger
        requireConfirmText={user?.email}
        onConfirm={handleDeleteAccount}
        onClose={() => setShowDeleteConfirm(false)}
      />
    </>
  );
}
