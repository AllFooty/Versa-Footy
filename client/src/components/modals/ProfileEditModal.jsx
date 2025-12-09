import React, { useState, useEffect } from 'react';
import { X, Save, User, Mail, Check } from 'lucide-react';
import { useAuth } from '../../lib/AuthContext';
import { IconButton, Button, SecondaryButton } from '../ui';

/**
 * Modal for editing user profile
 * Allows users to update their name and view their email
 */
export default function ProfileEditModal({ isOpen, onClose }) {
  const { user, profile, updateProfile, profileLoading } = useAuth();
  const [fullName, setFullName] = useState('');
  const [saving, setSaving] = useState(false);
  const [success, setSuccess] = useState(false);
  const [error, setError] = useState('');

  // Initialize form with current profile data
  useEffect(() => {
    if (isOpen && profile) {
      setFullName(profile.full_name || '');
      setError('');
      setSuccess(false);
    }
  }, [isOpen, profile]);

  // Prevent body scroll when modal is open
  useEffect(() => {
    if (isOpen) {
      document.body.style.overflow = 'hidden';
    } else {
      document.body.style.overflow = '';
    }
    return () => {
      document.body.style.overflow = '';
    };
  }, [isOpen]);

  const handleSave = async () => {
    if (!fullName.trim()) {
      setError('Please enter your name');
      return;
    }

    setSaving(true);
    setError('');

    try {
      await updateProfile({ full_name: fullName.trim() });
      setSuccess(true);
      setTimeout(() => {
        onClose();
        setSuccess(false);
      }, 1000);
    } catch (err) {
      setError(err.message || 'Failed to update profile');
    } finally {
      setSaving(false);
    }
  };

  if (!isOpen) return null;

  // Overlay styles - ensures proper centering
  const overlayStyle = {
    position: 'fixed',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    background: 'rgba(0, 0, 0, 0.8)',
    backdropFilter: 'blur(8px)',
    WebkitBackdropFilter: 'blur(8px)',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    zIndex: 2000,
    padding: '20px',
    boxSizing: 'border-box',
  };

  // Modal container styles
  const modalStyle = {
    background: 'linear-gradient(145deg, #1e2433 0%, #151a26 100%)',
    border: '1px solid rgba(255, 255, 255, 0.1)',
    borderRadius: '20px',
    padding: '28px',
    width: '100%',
    maxWidth: '420px',
    maxHeight: 'calc(100vh - 40px)',
    overflowY: 'auto',
    boxShadow: '0 20px 60px rgba(0, 0, 0, 0.5)',
    position: 'relative',
  };

  return (
    <div style={overlayStyle} onClick={onClose}>
      <div
        style={modalStyle}
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div
          style={{
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            marginBottom: 24,
          }}
        >
          <h2
            style={{
              margin: 0,
              fontFamily: "'Space Grotesk', sans-serif",
              fontSize: 20,
              fontWeight: 600,
              color: 'white',
            }}
          >
            Edit Profile
          </h2>
          <IconButton onClick={onClose}>
            <X size={20} />
          </IconButton>
        </div>

        {/* Avatar Preview */}
        <div style={{
          display: 'flex',
          justifyContent: 'center',
          marginBottom: 24,
        }}>
          <div style={{
            width: '80px',
            height: '80px',
            borderRadius: '50%',
            background: 'linear-gradient(135deg, #3b82f6 0%, #8b5cf6 100%)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            fontSize: '28px',
            fontWeight: '600',
            color: 'white',
            boxShadow: '0 8px 24px rgba(59, 130, 246, 0.3)',
          }}>
            {fullName.trim() ? 
              fullName.trim().split(' ').length >= 2 ?
                `${fullName.trim().split(' ')[0][0]}${fullName.trim().split(' ')[fullName.trim().split(' ').length - 1][0]}`.toUpperCase() :
                fullName.trim().substring(0, 2).toUpperCase() :
              user?.email?.substring(0, 2).toUpperCase() || 'U'
            }
          </div>
        </div>

        {/* Form */}
        <div>
          {/* Full Name Field */}
          <div style={{ marginBottom: 20 }}>
            <label style={{
              display: 'flex',
              alignItems: 'center',
              gap: 8,
              fontSize: 14,
              fontWeight: 500,
              color: 'rgba(255, 255, 255, 0.8)',
              marginBottom: 8,
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
                transition: 'all 0.2s ease',
              }}
              onFocus={(e) => e.target.style.borderColor = '#3b82f6'}
              onBlur={(e) => e.target.style.borderColor = 'rgba(255, 255, 255, 0.1)'}
            />
          </div>

          {/* Email Field (Read-only) */}
          <div style={{ marginBottom: 20 }}>
            <label style={{
              display: 'flex',
              alignItems: 'center',
              gap: 8,
              fontSize: 14,
              fontWeight: 500,
              color: 'rgba(255, 255, 255, 0.8)',
              marginBottom: 8,
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
              fontSize: 12,
              color: 'rgba(255, 255, 255, 0.4)',
              marginTop: 6,
              marginBottom: 0,
            }}>
              Email cannot be changed
            </p>
          </div>

          {/* Error Message */}
          {error && (
            <div style={{
              background: 'rgba(239, 68, 68, 0.1)',
              border: '1px solid rgba(239, 68, 68, 0.3)',
              borderRadius: 8,
              padding: '12px 16px',
              marginBottom: 16,
              color: '#fca5a5',
              fontSize: 14,
            }}>
              {error}
            </div>
          )}

          {/* Success Message */}
          {success && (
            <div style={{
              background: 'rgba(34, 197, 94, 0.1)',
              border: '1px solid rgba(34, 197, 94, 0.3)',
              borderRadius: 8,
              padding: '12px 16px',
              marginBottom: 16,
              color: '#86efac',
              fontSize: 14,
              display: 'flex',
              alignItems: 'center',
              gap: 8,
            }}>
              <Check size={16} />
              Profile updated successfully!
            </div>
          )}
        </div>

        {/* Footer */}
        <div
          style={{
            display: 'flex',
            justifyContent: 'flex-end',
            gap: 12,
            marginTop: 24,
          }}
        >
          <SecondaryButton onClick={onClose}>Cancel</SecondaryButton>
          <Button onClick={handleSave} disabled={saving || profileLoading || success}>
            {saving ? (
              <>
                <div style={{
                  width: 16,
                  height: 16,
                  border: '2px solid rgba(255,255,255,0.3)',
                  borderTopColor: 'white',
                  borderRadius: '50%',
                  animation: 'spin 1s linear infinite',
                }} />
                Saving...
              </>
            ) : success ? (
              <>
                <Check size={16} />
                Saved!
              </>
            ) : (
              <>
                <Save size={16} />
                Save Changes
              </>
            )}
          </Button>
        </div>

        {/* Keyframes for spinner */}
        <style>{`
          @keyframes spin {
            from { transform: rotate(0deg); }
            to { transform: rotate(360deg); }
          }
        `}</style>
      </div>
    </div>
  );
}
