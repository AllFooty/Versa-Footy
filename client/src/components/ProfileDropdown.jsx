import React, { useState, useRef, useEffect } from 'react';
import { Link } from 'wouter';
import { motion, AnimatePresence } from 'framer-motion';
import { useAuth } from '../lib/AuthContext';

/**
 * Profile dropdown with avatar circle
 * Shows user info, settings link, and sign out with confirmation
 */
export default function ProfileDropdown() {
  const { user, profile, signOut } = useAuth();
  const [isOpen, setIsOpen] = useState(false);
  const [showConfirmSignOut, setShowConfirmSignOut] = useState(false);
  const dropdownRef = useRef(null);

  // Close dropdown when clicking outside
  useEffect(() => {
    const handleClickOutside = (event) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target)) {
        setIsOpen(false);
        setShowConfirmSignOut(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  // Get user initials for avatar
  const getInitials = () => {
    if (profile?.full_name) {
      const names = profile.full_name.trim().split(' ');
      if (names.length >= 2) {
        return `${names[0][0]}${names[names.length - 1][0]}`.toUpperCase();
      }
      return names[0].substring(0, 2).toUpperCase();
    }
    if (user?.email) {
      return user.email.substring(0, 2).toUpperCase();
    }
    return 'U';
  };

  const handleSignOutClick = () => {
    setShowConfirmSignOut(true);
  };

  const handleConfirmSignOut = () => {
    signOut();
    setIsOpen(false);
    setShowConfirmSignOut(false);
  };

  const handleCancelSignOut = () => {
    setShowConfirmSignOut(false);
  };

  return (
    <div ref={dropdownRef} style={{ position: 'relative' }}>
      {/* Avatar Button */}
      <button
        onClick={() => setIsOpen(!isOpen)}
        style={{
          width: '42px',
          height: '42px',
          borderRadius: '50%',
          background: 'linear-gradient(135deg, #3b82f6 0%, #8b5cf6 100%)',
          border: '2px solid rgba(255, 255, 255, 0.2)',
          color: 'white',
          fontSize: '14px',
          fontWeight: '600',
          cursor: 'pointer',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          transition: 'all 0.2s ease',
          boxShadow: isOpen ? '0 0 0 3px rgba(59, 130, 246, 0.3)' : 'none',
        }}
        onMouseEnter={(e) => {
          e.currentTarget.style.transform = 'scale(1.05)';
          e.currentTarget.style.borderColor = 'rgba(255, 255, 255, 0.4)';
        }}
        onMouseLeave={(e) => {
          e.currentTarget.style.transform = 'scale(1)';
          e.currentTarget.style.borderColor = 'rgba(255, 255, 255, 0.2)';
        }}
        aria-label="Open profile menu"
      >
        {getInitials()}
      </button>

      {/* Dropdown Menu */}
      <AnimatePresence>
        {isOpen && (
          <motion.div
            initial={{ opacity: 0, y: 8, scale: 0.95 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 8, scale: 0.95 }}
            transition={{ duration: 0.15 }}
            style={{
              position: 'absolute',
              top: 'calc(100% + 8px)',
              right: 0,
              width: '280px',
              background: 'linear-gradient(145deg, #1e2433 0%, #151a26 100%)',
              border: '1px solid rgba(255, 255, 255, 0.1)',
              borderRadius: '16px',
              boxShadow: '0 20px 40px rgba(0, 0, 0, 0.4)',
              overflow: 'hidden',
              zIndex: 1000,
            }}
          >
            {/* User Info Section */}
            <div style={{
              padding: '20px',
              borderBottom: '1px solid rgba(255, 255, 255, 0.08)',
            }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '14px' }}>
                {/* Large Avatar */}
                <div style={{
                  width: '48px',
                  height: '48px',
                  borderRadius: '50%',
                  background: 'linear-gradient(135deg, #3b82f6 0%, #8b5cf6 100%)',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  fontSize: '18px',
                  fontWeight: '600',
                  color: 'white',
                  flexShrink: 0,
                }}>
                  {getInitials()}
                </div>
                <div style={{ overflow: 'hidden' }}>
                  <div style={{
                    fontSize: '15px',
                    fontWeight: '600',
                    color: 'white',
                    marginBottom: '2px',
                    overflow: 'hidden',
                    textOverflow: 'ellipsis',
                    whiteSpace: 'nowrap',
                  }}>
                    {profile?.full_name || 'Set your name'}
                  </div>
                  <div style={{
                    fontSize: '13px',
                    color: 'rgba(255, 255, 255, 0.5)',
                    overflow: 'hidden',
                    textOverflow: 'ellipsis',
                    whiteSpace: 'nowrap',
                  }}>
                    {user?.email}
                  </div>
                </div>
              </div>
            </div>

            {/* Menu Items */}
            {!showConfirmSignOut ? (
              <div style={{ padding: '8px' }}>
                {/* Settings Link */}
                <Link href="/settings">
                  <a
                    onClick={() => setIsOpen(false)}
                    style={{
                      width: '100%',
                      display: 'flex',
                      alignItems: 'center',
                      gap: '12px',
                      padding: '12px',
                      background: 'transparent',
                      border: 'none',
                      borderRadius: '10px',
                      color: 'rgba(255, 255, 255, 0.9)',
                      fontSize: '14px',
                      fontWeight: '500',
                      cursor: 'pointer',
                      transition: 'background 0.2s',
                      textAlign: 'left',
                      textDecoration: 'none',
                    }}
                    onMouseEnter={(e) => e.currentTarget.style.background = 'rgba(255, 255, 255, 0.06)'}
                    onMouseLeave={(e) => e.currentTarget.style.background = 'transparent'}
                  >
                    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                      <circle cx="12" cy="12" r="3" />
                      <path d="M19.4 15a1.65 1.65 0 0 0 .33 1.82l.06.06a2 2 0 0 1 0 2.83 2 2 0 0 1-2.83 0l-.06-.06a1.65 1.65 0 0 0-1.82-.33 1.65 1.65 0 0 0-1 1.51V21a2 2 0 0 1-2 2 2 2 0 0 1-2-2v-.09A1.65 1.65 0 0 0 9 19.4a1.65 1.65 0 0 0-1.82.33l-.06.06a2 2 0 0 1-2.83 0 2 2 0 0 1 0-2.83l.06-.06a1.65 1.65 0 0 0 .33-1.82 1.65 1.65 0 0 0-1.51-1H3a2 2 0 0 1-2-2 2 2 0 0 1 2-2h.09A1.65 1.65 0 0 0 4.6 9a1.65 1.65 0 0 0-.33-1.82l-.06-.06a2 2 0 0 1 0-2.83 2 2 0 0 1 2.83 0l.06.06a1.65 1.65 0 0 0 1.82.33H9a1.65 1.65 0 0 0 1-1.51V3a2 2 0 0 1 2-2 2 2 0 0 1 2 2v.09a1.65 1.65 0 0 0 1 1.51 1.65 1.65 0 0 0 1.82-.33l.06-.06a2 2 0 0 1 2.83 0 2 2 0 0 1 0 2.83l-.06.06a1.65 1.65 0 0 0-.33 1.82V9a1.65 1.65 0 0 0 1.51 1H21a2 2 0 0 1 2 2 2 2 0 0 1-2 2h-.09a1.65 1.65 0 0 0-1.51 1z" />
                    </svg>
                    Settings
                  </a>
                </Link>

                {/* Divider */}
                <div style={{
                  height: '1px',
                  background: 'rgba(255, 255, 255, 0.08)',
                  margin: '8px 0',
                }} />

                {/* Sign Out */}
                <button
                  onClick={handleSignOutClick}
                  style={{
                    width: '100%',
                    display: 'flex',
                    alignItems: 'center',
                    gap: '12px',
                    padding: '12px',
                    background: 'transparent',
                    border: 'none',
                    borderRadius: '10px',
                    color: '#ef4444',
                    fontSize: '14px',
                    fontWeight: '500',
                    cursor: 'pointer',
                    transition: 'background 0.2s',
                    textAlign: 'left',
                  }}
                  onMouseEnter={(e) => e.currentTarget.style.background = 'rgba(239, 68, 68, 0.1)'}
                  onMouseLeave={(e) => e.currentTarget.style.background = 'transparent'}
                >
                  <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                    <path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4" />
                    <polyline points="16 17 21 12 16 7" />
                    <line x1="21" y1="12" x2="9" y2="12" />
                  </svg>
                  Sign Out
                </button>
              </div>
            ) : (
              /* Sign Out Confirmation */
              <div style={{ padding: '16px' }}>
                <div style={{
                  textAlign: 'center',
                  marginBottom: '16px',
                }}>
                  <div style={{
                    width: '48px',
                    height: '48px',
                    borderRadius: '50%',
                    background: 'rgba(239, 68, 68, 0.15)',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    margin: '0 auto 12px',
                  }}>
                    <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="#ef4444" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                      <path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4" />
                      <polyline points="16 17 21 12 16 7" />
                      <line x1="21" y1="12" x2="9" y2="12" />
                    </svg>
                  </div>
                  <div style={{
                    fontSize: '15px',
                    fontWeight: '600',
                    color: 'white',
                    marginBottom: '4px',
                  }}>
                    Sign out?
                  </div>
                  <div style={{
                    fontSize: '13px',
                    color: 'rgba(255, 255, 255, 0.5)',
                  }}>
                    Are you sure you want to sign out?
                  </div>
                </div>
                <div style={{
                  display: 'flex',
                  gap: '10px',
                }}>
                  <button
                    onClick={handleCancelSignOut}
                    style={{
                      flex: 1,
                      padding: '10px',
                      background: 'rgba(255, 255, 255, 0.06)',
                      border: '1px solid rgba(255, 255, 255, 0.1)',
                      borderRadius: '10px',
                      color: 'rgba(255, 255, 255, 0.9)',
                      fontSize: '14px',
                      fontWeight: '500',
                      cursor: 'pointer',
                      transition: 'background 0.2s',
                    }}
                    onMouseEnter={(e) => e.currentTarget.style.background = 'rgba(255, 255, 255, 0.1)'}
                    onMouseLeave={(e) => e.currentTarget.style.background = 'rgba(255, 255, 255, 0.06)'}
                  >
                    Cancel
                  </button>
                  <button
                    onClick={handleConfirmSignOut}
                    style={{
                      flex: 1,
                      padding: '10px',
                      background: '#ef4444',
                      border: 'none',
                      borderRadius: '10px',
                      color: 'white',
                      fontSize: '14px',
                      fontWeight: '600',
                      cursor: 'pointer',
                      transition: 'background 0.2s',
                    }}
                    onMouseEnter={(e) => e.currentTarget.style.background = '#dc2626'}
                    onMouseLeave={(e) => e.currentTarget.style.background = '#ef4444'}
                  >
                    Sign Out
                  </button>
                </div>
              </div>
            )}
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
