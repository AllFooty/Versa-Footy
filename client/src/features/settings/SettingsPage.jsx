import React, { useState, useEffect } from 'react';
import { Link, useLocation } from 'wouter';
import { useTranslation } from 'react-i18next';
import { User, Mail, Check, ArrowLeft, Save, Trash2 } from 'lucide-react';
import { useAuth } from '../../lib/AuthContext';
import ConfirmModal from '../../components/modals/ConfirmModal';

// Landing page components for consistent look
import HeaderLanding from '../landing/components/HeaderLanding';
import FooterLanding from '../landing/components/FooterLanding';
import All4FootyFamilyBar from '../landing/components/All4FootyFamilyBar';

const COOLDOWN_DAYS = 7;

export default function SettingsPage() {
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

  // Redirect if not authenticated
  useEffect(() => {
    if (!isAuthenticated && !profileLoading) {
      setLocation('/login');
    }
  }, [isAuthenticated, profileLoading, setLocation]);

  // Initialize form with current profile data
  useEffect(() => {
    if (profile) {
      setFullName(profile.full_name || '');
    }
  }, [profile]);

  // Cooldown: only applies if user has already set a name before
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

  // Get user initials for avatar
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
      setError(t('settings.editCooldownLocked', { days: daysUntilEdit }));
      return;
    }

    setSaving(true);
    setError('');
    setSuccess(false);

    try {
      await updateProfile({ full_name: fullName.trim() });
      setSuccess(true);
      // Clear success message after 3 seconds
      setTimeout(() => setSuccess(false), 3000);
    } catch (err) {
      setError(err.message || t('errors.profileUpdateFailed'));
    } finally {
      setSaving(false);
    }
  };

  return (
    <>
      <All4FootyFamilyBar />
      <div
        style={{
          minHeight: '100vh',
          background: 'linear-gradient(135deg, #0a0f1a 0%, #1a1f2e 50%, #0d1117 100%)',
          fontFamily: "'DM Sans', -apple-system, BlinkMacSystemFont, sans-serif",
          color: '#e4e4e7',
        }}
      >
        <HeaderLanding />

        {/* Main Content */}
        <main style={{
          maxWidth: '600px',
          margin: '0 auto',
          padding: '40px 24px 80px',
        }}>
          {/* Back Button */}
          <Link href="/">
            <a style={{
              display: 'inline-flex',
              alignItems: 'center',
              gap: '8px',
              color: 'rgba(255, 255, 255, 0.6)',
              textDecoration: 'none',
              fontSize: '14px',
              marginBottom: '24px',
              transition: 'color 0.2s',
            }}
            onMouseEnter={(e) => e.currentTarget.style.color = 'white'}
            onMouseLeave={(e) => e.currentTarget.style.color = 'rgba(255, 255, 255, 0.6)'}
            >
              <ArrowLeft size={18} />
              {t('settings.backToHome')}
            </a>
          </Link>

          {/* Page Title */}
          <h1 style={{
            fontSize: '28px',
            fontWeight: '700',
            marginBottom: '8px',
            fontFamily: "'Space Grotesk', sans-serif",
          }}>
            {t('settings.pageTitle')}
          </h1>
          <p style={{
            color: 'rgba(255, 255, 255, 0.5)',
            fontSize: '15px',
            marginBottom: '32px',
          }}>
            {t('settings.pageSubtitle')}
          </p>

          {/* Profile Section */}
          <div style={{
            background: 'rgba(255, 255, 255, 0.03)',
            border: '1px solid rgba(255, 255, 255, 0.08)',
            borderRadius: '16px',
            padding: '28px',
          }}>
            <h2 style={{
              fontSize: '18px',
              fontWeight: '600',
              marginBottom: '24px',
              display: 'flex',
              alignItems: 'center',
              gap: '10px',
            }}>
              <User size={20} />
              {t('settings.profileInfo')}
            </h2>

            {/* Avatar Preview */}
            <div style={{
              display: 'flex',
              alignItems: 'center',
              gap: '20px',
              marginBottom: '28px',
              padding: '20px',
              background: 'rgba(0, 0, 0, 0.2)',
              borderRadius: '12px',
            }}>
              <div style={{
                width: '72px',
                height: '72px',
                borderRadius: '50%',
                background: 'linear-gradient(135deg, #3b82f6 0%, #8b5cf6 100%)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                fontSize: '24px',
                fontWeight: '600',
                color: 'white',
                boxShadow: '0 8px 24px rgba(59, 130, 246, 0.3)',
                flexShrink: 0,
              }}>
                {getInitials()}
              </div>
              <div>
                <div style={{
                  fontSize: '18px',
                  fontWeight: '600',
                  marginBottom: '4px',
                }}>
                  {fullName || t('settings.yourName')}
                </div>
                <div style={{
                  fontSize: '14px',
                  color: 'rgba(255, 255, 255, 0.5)',
                }}>
                  {user?.email}
                </div>
              </div>
            </div>

            {/* Form */}
            <form onSubmit={handleSave}>
              {/* Full Name Field */}
              <div style={{ marginBottom: '20px' }}>
                <label style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: '8px',
                  fontSize: '14px',
                  fontWeight: '500',
                  color: 'rgba(255, 255, 255, 0.8)',
                  marginBottom: '8px',
                }}>
                  <User size={16} />
                  {t('settings.fullNameLabel')}
                </label>
                <input
                  type="text"
                  value={fullName}
                  onChange={(e) => setFullName(e.target.value)}
                  placeholder={t('settings.fullNamePlaceholder')}
                  disabled={!canEdit}
                  style={{
                    background: canEdit ? 'rgba(0, 0, 0, 0.3)' : 'rgba(0, 0, 0, 0.15)',
                    border: '1px solid rgba(255, 255, 255, 0.1)',
                    borderRadius: '10px',
                    padding: '14px 16px',
                    color: canEdit ? 'white' : 'rgba(255, 255, 255, 0.4)',
                    fontSize: '15px',
                    width: '100%',
                    boxSizing: 'border-box',
                    outline: 'none',
                    transition: 'border-color 0.2s',
                    cursor: canEdit ? 'text' : 'not-allowed',
                  }}
                  onFocus={(e) => canEdit && (e.target.style.borderColor = '#3b82f6')}
                  onBlur={(e) => (e.target.style.borderColor = 'rgba(255, 255, 255, 0.1)')}
                />
                {!canEdit && (
                  <p style={{
                    fontSize: '12px',
                    color: '#f59e0b',
                    marginTop: '6px',
                    marginBottom: '0',
                    display: 'flex',
                    alignItems: 'center',
                    gap: '4px',
                  }}>
                    🔒 {t('settings.editCooldownLocked', { days: daysUntilEdit })}
                  </p>
                )}
              </div>

              {/* Email Field (Read-only) */}
              <div style={{ marginBottom: '24px' }}>
                <label style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: '8px',
                  fontSize: '14px',
                  fontWeight: '500',
                  color: 'rgba(255, 255, 255, 0.8)',
                  marginBottom: '8px',
                }}>
                  <Mail size={16} />
                  {t('settings.emailLabel')}
                </label>
                <input
                  type="email"
                  value={user?.email || ''}
                  disabled
                  style={{
                    background: 'rgba(0, 0, 0, 0.2)',
                    border: '1px solid rgba(255, 255, 255, 0.06)',
                    borderRadius: '10px',
                    padding: '14px 16px',
                    color: 'rgba(255, 255, 255, 0.5)',
                    fontSize: '15px',
                    width: '100%',
                    boxSizing: 'border-box',
                    cursor: 'not-allowed',
                  }}
                />
                <p style={{
                  fontSize: '12px',
                  color: 'rgba(255, 255, 255, 0.4)',
                  marginTop: '6px',
                  marginBottom: '0',
                }}>
                  {t('settings.emailCannotChange')}
                </p>
              </div>

              {/* Error Message */}
              {error && (
                <div style={{
                  background: 'rgba(239, 68, 68, 0.1)',
                  border: '1px solid rgba(239, 68, 68, 0.3)',
                  borderRadius: '8px',
                  padding: '12px 16px',
                  marginBottom: '16px',
                  color: '#fca5a5',
                  fontSize: '14px',
                }}>
                  {error}
                </div>
              )}

              {/* Success Message */}
              {success && (
                <div style={{
                  background: 'rgba(34, 197, 94, 0.1)',
                  border: '1px solid rgba(34, 197, 94, 0.3)',
                  borderRadius: '8px',
                  padding: '12px 16px',
                  marginBottom: '16px',
                  color: '#86efac',
                  fontSize: '14px',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '8px',
                }}>
                  <Check size={16} />
                  {t('errors.profileUpdated')}
                </div>
              )}

              {/* Save Button */}
              <button
                type="submit"
                disabled={saving || profileLoading || !canEdit}
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  gap: '8px',
                  width: '100%',
                  padding: '14px 24px',
                  background: (saving || !canEdit) ? 'rgba(59, 130, 246, 0.5)' : 'linear-gradient(135deg, #3b82f6 0%, #2563eb 100%)',
                  border: 'none',
                  borderRadius: '12px',
                  color: 'white',
                  fontSize: '15px',
                  fontWeight: '600',
                  cursor: (saving || !canEdit) ? 'not-allowed' : 'pointer',
                  transition: 'all 0.2s',
                  boxShadow: (saving || !canEdit) ? 'none' : '0 8px 24px rgba(59, 130, 246, 0.3)',
                }}
              >
                {saving ? (
                  <>
                    <div style={{
                      width: '18px',
                      height: '18px',
                      border: '2px solid rgba(255,255,255,0.3)',
                      borderTopColor: 'white',
                      borderRadius: '50%',
                      animation: 'spin 1s linear infinite',
                    }} />
                    {t('common.saving')}
                  </>
                ) : (
                  <>
                    <Save size={18} />
                    {t('settings.saveChanges')}
                  </>
                )}
              </button>
            </form>
          </div>

          {/* Danger Zone */}
          <div style={{
            marginTop: '32px',
            background: 'rgba(239, 68, 68, 0.04)',
            border: '1px solid rgba(239, 68, 68, 0.2)',
            borderRadius: '16px',
            padding: '28px',
          }}>
            <h2 style={{
              fontSize: '18px',
              fontWeight: '600',
              marginBottom: '16px',
              display: 'flex',
              alignItems: 'center',
              gap: '10px',
              color: '#ef4444',
            }}>
              <Trash2 size={20} />
              {t('settings.dangerZone')}
            </h2>

            <p style={{
              fontSize: '14px',
              color: 'rgba(255, 255, 255, 0.5)',
              marginBottom: '20px',
              lineHeight: 1.6,
            }}>
              {t('settings.deleteAccountWarning')}
            </p>

            {deleteError && (
              <div style={{
                background: 'rgba(239, 68, 68, 0.1)',
                border: '1px solid rgba(239, 68, 68, 0.3)',
                borderRadius: '8px',
                padding: '12px 16px',
                marginBottom: '16px',
                color: '#fca5a5',
                fontSize: '14px',
              }}>
                {deleteError}
              </div>
            )}

            <button
              type="button"
              onClick={() => setShowDeleteConfirm(true)}
              disabled={deleting}
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: '8px',
                padding: '12px 20px',
                background: 'rgba(239, 68, 68, 0.1)',
                border: '1px solid rgba(239, 68, 68, 0.3)',
                borderRadius: '10px',
                color: '#ef4444',
                fontSize: '14px',
                fontWeight: '600',
                cursor: deleting ? 'not-allowed' : 'pointer',
                transition: 'all 0.2s',
                opacity: deleting ? 0.6 : 1,
              }}
              onMouseEnter={(e) => !deleting && (e.currentTarget.style.background = 'rgba(239, 68, 68, 0.2)')}
              onMouseLeave={(e) => (e.currentTarget.style.background = 'rgba(239, 68, 68, 0.1)')}
            >
              <Trash2 size={16} />
              {deleting ? t('settings.deletingAccount') : t('settings.deleteAccount')}
            </button>
          </div>
        </main>
      </div>

      <ConfirmModal
        isOpen={showDeleteConfirm}
        title={t('settings.deleteAccountConfirmTitle')}
        message={t('settings.deleteAccountConfirmMessage')}
        confirmLabel={t('settings.deleteAccountConfirmButton')}
        confirmDanger
        onConfirm={handleDeleteAccount}
        onClose={() => setShowDeleteConfirm(false)}
      />

      <FooterLanding />

      <style>{`
        @keyframes spin {
          from { transform: rotate(0deg); }
          to { transform: rotate(360deg); }
        }
      `}</style>
    </>
  );
}
