import React, { useState, useEffect } from 'react';
import { Link, useLocation } from 'wouter';
import { User, Mail, Check, ArrowLeft, Save } from 'lucide-react';
import { useAuth } from '../../lib/AuthContext';

// Landing page components for consistent look
import HeaderLanding from '../landing/components/HeaderLanding';
import FooterLanding from '../landing/components/FooterLanding';
import All4FootyFamilyBar from '../landing/components/All4FootyFamilyBar';

export default function SettingsPage() {
  const [, setLocation] = useLocation();
  const { user, profile, updateProfile, profileLoading, isAuthenticated } = useAuth();
  const [fullName, setFullName] = useState('');
  const [saving, setSaving] = useState(false);
  const [success, setSuccess] = useState(false);
  const [error, setError] = useState('');

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
      setError('Please enter your name');
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
      setError(err.message || 'Failed to update profile');
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
              Back to Home
            </a>
          </Link>

          {/* Page Title */}
          <h1 style={{
            fontSize: '28px',
            fontWeight: '700',
            marginBottom: '8px',
            fontFamily: "'Space Grotesk', sans-serif",
          }}>
            Settings
          </h1>
          <p style={{
            color: 'rgba(255, 255, 255, 0.5)',
            fontSize: '15px',
            marginBottom: '32px',
          }}>
            Manage your account settings and profile information
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
              Profile Information
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
                  {fullName || 'Your Name'}
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
                  Full Name
                </label>
                <input
                  type="text"
                  value={fullName}
                  onChange={(e) => setFullName(e.target.value)}
                  placeholder="Enter your full name"
                  style={{
                    background: 'rgba(0, 0, 0, 0.3)',
                    border: '1px solid rgba(255, 255, 255, 0.1)',
                    borderRadius: '10px',
                    padding: '14px 16px',
                    color: 'white',
                    fontSize: '15px',
                    width: '100%',
                    boxSizing: 'border-box',
                    outline: 'none',
                    transition: 'border-color 0.2s',
                  }}
                  onFocus={(e) => e.target.style.borderColor = '#3b82f6'}
                  onBlur={(e) => e.target.style.borderColor = 'rgba(255, 255, 255, 0.1)'}
                />
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
                  Email Address
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
                  Email address cannot be changed
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
                  Profile updated successfully!
                </div>
              )}

              {/* Save Button */}
              <button
                type="submit"
                disabled={saving || profileLoading}
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  gap: '8px',
                  width: '100%',
                  padding: '14px 24px',
                  background: saving ? 'rgba(59, 130, 246, 0.5)' : 'linear-gradient(135deg, #3b82f6 0%, #2563eb 100%)',
                  border: 'none',
                  borderRadius: '12px',
                  color: 'white',
                  fontSize: '15px',
                  fontWeight: '600',
                  cursor: saving ? 'not-allowed' : 'pointer',
                  transition: 'all 0.2s',
                  boxShadow: saving ? 'none' : '0 8px 24px rgba(59, 130, 246, 0.3)',
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
                    Saving...
                  </>
                ) : (
                  <>
                    <Save size={18} />
                    Save Changes
                  </>
                )}
              </button>
            </form>
          </div>
        </main>
      </div>

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
