import React, { useState } from 'react';
import { Link, useLocation } from 'wouter';
import { useAuth } from '../../lib/AuthContext';

const NAV_ITEMS = [
  {
    label: 'Dashboard',
    href: '/academy',
    icon: (
      <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
        <rect x="3" y="3" width="7" height="7" />
        <rect x="14" y="3" width="7" height="7" />
        <rect x="14" y="14" width="7" height="7" />
        <rect x="3" y="14" width="7" height="7" />
      </svg>
    ),
  },
  {
    label: 'Players',
    href: '/academy/players',
    icon: (
      <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
        <path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2" />
        <circle cx="9" cy="7" r="4" />
        <path d="M23 21v-2a4 4 0 0 0-3-3.87" />
        <path d="M16 3.13a4 4 0 0 1 0 7.75" />
      </svg>
    ),
  },
  {
    label: 'Teams',
    href: '/academy/teams',
    icon: (
      <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
        <path d="M12 2L2 7l10 5 10-5-10-5z" />
        <path d="M2 17l10 5 10-5" />
        <path d="M2 12l10 5 10-5" />
      </svg>
    ),
  },
  {
    label: 'Invitations',
    href: '/academy/invitations',
    icon: (
      <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
        <path d="M4 4h16c1.1 0 2 .9 2 2v12c0 1.1-.9 2-2 2H4c-1.1 0-2-.9-2-2V6c0-1.1.9-2 2-2z" />
        <polyline points="22,6 12,13 2,6" />
      </svg>
    ),
  },
  {
    label: 'Settings',
    href: '/academy/settings',
    icon: (
      <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
        <circle cx="12" cy="12" r="3" />
        <path d="M19.4 15a1.65 1.65 0 0 0 .33 1.82l.06.06a2 2 0 0 1 0 2.83 2 2 0 0 1-2.83 0l-.06-.06a1.65 1.65 0 0 0-1.82-.33 1.65 1.65 0 0 0-1 1.51V21a2 2 0 0 1-2 2 2 2 0 0 1-2-2v-.09A1.65 1.65 0 0 0 9 19.4a1.65 1.65 0 0 0-1.82.33l-.06.06a2 2 0 0 1-2.83 0 2 2 0 0 1 0-2.83l.06-.06a1.65 1.65 0 0 0 .33-1.82 1.65 1.65 0 0 0-1.51-1H3a2 2 0 0 1-2-2 2 2 0 0 1 2-2h.09A1.65 1.65 0 0 0 4.6 9a1.65 1.65 0 0 0-.33-1.82l-.06-.06a2 2 0 0 1 0-2.83 2 2 0 0 1 2.83 0l.06.06a1.65 1.65 0 0 0 1.82.33H9a1.65 1.65 0 0 0 1-1.51V3a2 2 0 0 1 2-2 2 2 0 0 1 2 2v.09a1.65 1.65 0 0 0 1 1.51 1.65 1.65 0 0 0 1.82-.33l.06-.06a2 2 0 0 1 2.83 0 2 2 0 0 1 0 2.83l-.06.06a1.65 1.65 0 0 0-.33 1.82V9a1.65 1.65 0 0 0 1.51 1H21a2 2 0 0 1 2 2 2 2 0 0 1-2 2h-.09a1.65 1.65 0 0 0-1.51 1z" />
      </svg>
    ),
  },
];

export default function AcademyLayout({ children }) {
  const { activeOrg, organizations, setActiveOrg } = useAuth();
  const [location] = useLocation();
  const [mobileOpen, setMobileOpen] = useState(false);

  const isActive = (href) => {
    if (href === '/academy') return location === '/academy';
    return location.startsWith(href);
  };

  return (
    <div style={{ display: 'flex', minHeight: '100vh', position: 'relative' }}>
      {/* Mobile top bar */}
      <div className="acad-mobile-bar" style={mobileBarStyle}>
        <button onClick={() => setMobileOpen(true)} style={hamburgerBtnStyle}>
          <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round">
            <line x1="3" y1="6" x2="21" y2="6" />
            <line x1="3" y1="12" x2="21" y2="12" />
            <line x1="3" y1="18" x2="21" y2="18" />
          </svg>
        </button>
        <span style={{ fontSize: 15, fontWeight: 600, color: '#e4e4e7' }}>
          {activeOrg?.name || 'Academy'}
        </span>
      </div>

      {/* Mobile overlay */}
      {mobileOpen && (
        <div
          className="acad-overlay"
          onClick={() => setMobileOpen(false)}
          style={{
            position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.6)',
            zIndex: 250, backdropFilter: 'blur(4px)',
          }}
        />
      )}

      {/* Sidebar */}
      <aside
        className={`acad-sidebar ${mobileOpen ? 'acad-sidebar-open' : ''}`}
        style={sidebarStyle}
      >
        {/* Close button (mobile only) */}
        <button
          className="acad-close-btn"
          onClick={() => setMobileOpen(false)}
          style={closeBtnStyle}
        >
          <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round">
            <line x1="18" y1="6" x2="6" y2="18" />
            <line x1="6" y1="6" x2="18" y2="18" />
          </svg>
        </button>

        {/* Org header */}
        <div style={orgHeaderStyle}>
          <div style={orgAvatarStyle}>
            {(activeOrg?.name || 'A')[0].toUpperCase()}
          </div>
          <div style={{ flex: 1, minWidth: 0 }}>
            <p style={orgNameStyle}>{activeOrg?.name || 'Academy'}</p>
            <p style={orgTypeStyle}>{activeOrg?.type || 'Organization'}</p>
          </div>
        </div>

        {organizations.length > 1 && (
          <select
            value={activeOrg?.id || ''}
            onChange={(e) => {
              const org = organizations.find((o) => o.id === e.target.value);
              if (org) setActiveOrg(org);
            }}
            style={orgSwitcherStyle}
          >
            {organizations.map((o) => (
              <option key={o.id} value={o.id}>{o.name}</option>
            ))}
          </select>
        )}

        {/* Navigation */}
        <nav style={{ flex: 1, padding: '16px 0' }}>
          {NAV_ITEMS.map((item) => {
            const active = isActive(item.href);
            return (
              <Link key={item.href} href={item.href}>
                <a
                  onClick={() => setMobileOpen(false)}
                  style={{
                    ...navItemStyle,
                    ...(active ? navItemActiveStyle : {}),
                  }}
                >
                  <span style={{ opacity: active ? 1 : 0.5, display: 'flex' }}>
                    {item.icon}
                  </span>
                  {item.label}
                </a>
              </Link>
            );
          })}
        </nav>

        {/* Footer */}
        <div style={sidebarFooterStyle}>
          <Link href="/">
            <a style={backLinkStyle}>
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <line x1="19" y1="12" x2="5" y2="12" />
                <polyline points="12 19 5 12 12 5" />
              </svg>
              Back to Home
            </a>
          </Link>
        </div>
      </aside>

      {/* Main content */}
      <main className="acad-content" style={{ flex: 1, minWidth: 0 }}>
        {children}
      </main>

      <style>{`
        .acad-mobile-bar { display: none; }
        .acad-close-btn { display: none; }
        .acad-sidebar {
          width: 230px;
          flex-shrink: 0;
          position: sticky;
          top: 0;
          height: 100vh;
          overflow-y: auto;
        }
        @media (max-width: 768px) {
          .acad-mobile-bar { display: flex !important; }
          .acad-close-btn { display: flex !important; }
          .acad-sidebar {
            position: fixed !important;
            top: 0; left: 0; bottom: 0;
            width: 260px !important;
            height: 100vh !important;
            transform: translateX(-100%);
            transition: transform 0.3s ease;
            z-index: 300;
          }
          .acad-sidebar-open {
            transform: translateX(0) !important;
          }
          .acad-content {
            padding-top: 56px;
          }
        }
        @media (min-width: 769px) {
          .acad-overlay { display: none !important; }
        }
      `}</style>
    </div>
  );
}

// ─── Styles ────────────────────────────────────────────────────────────────────

const mobileBarStyle = {
  position: 'fixed',
  top: 0,
  left: 0,
  right: 0,
  height: 56,
  background: '#080d18',
  borderBottom: '1px solid rgba(255, 255, 255, 0.08)',
  alignItems: 'center',
  gap: 12,
  padding: '0 16px',
  zIndex: 200,
  fontFamily: "'Inter', system-ui, -apple-system, sans-serif",
};

const hamburgerBtnStyle = {
  background: 'none',
  border: 'none',
  color: '#e4e4e7',
  cursor: 'pointer',
  padding: 8,
  borderRadius: 8,
  display: 'flex',
  alignItems: 'center',
  justifyContent: 'center',
};

const closeBtnStyle = {
  position: 'absolute',
  top: 16,
  right: 12,
  background: 'none',
  border: 'none',
  color: '#9ca3af',
  cursor: 'pointer',
  padding: 4,
  alignItems: 'center',
  justifyContent: 'center',
};

const sidebarStyle = {
  background: '#080d18',
  borderRight: '1px solid rgba(255, 255, 255, 0.08)',
  display: 'flex',
  flexDirection: 'column',
  fontFamily: "'Inter', system-ui, -apple-system, sans-serif",
  color: '#e4e4e7',
  padding: '20px 12px',
};

const orgHeaderStyle = {
  display: 'flex',
  alignItems: 'center',
  gap: 10,
  padding: '0 4px 16px',
  borderBottom: '1px solid rgba(255, 255, 255, 0.06)',
};

const orgAvatarStyle = {
  width: 36,
  height: 36,
  borderRadius: 10,
  background: 'linear-gradient(135deg, #3b82f6, #8b5cf6)',
  display: 'flex',
  alignItems: 'center',
  justifyContent: 'center',
  fontSize: 16,
  fontWeight: 700,
  color: 'white',
  flexShrink: 0,
};

const orgNameStyle = {
  fontSize: 14,
  fontWeight: 600,
  margin: 0,
  overflow: 'hidden',
  textOverflow: 'ellipsis',
  whiteSpace: 'nowrap',
};

const orgTypeStyle = {
  fontSize: 11,
  color: '#71717a',
  margin: 0,
  textTransform: 'capitalize',
};

const orgSwitcherStyle = {
  width: '100%',
  padding: '7px 10px',
  background: 'rgba(255, 255, 255, 0.04)',
  border: '1px solid rgba(255, 255, 255, 0.08)',
  borderRadius: 8,
  color: '#e4e4e7',
  fontSize: 12,
  margin: '12px 0 0',
};

const navItemStyle = {
  display: 'flex',
  alignItems: 'center',
  gap: 10,
  padding: '9px 12px',
  borderRadius: 8,
  fontSize: 13,
  fontWeight: 500,
  color: '#9ca3af',
  textDecoration: 'none',
  margin: '2px 0',
  transition: 'background 0.15s, color 0.15s',
};

const navItemActiveStyle = {
  background: 'rgba(59, 130, 246, 0.12)',
  color: '#60a5fa',
};

const sidebarFooterStyle = {
  paddingTop: 12,
  borderTop: '1px solid rgba(255, 255, 255, 0.06)',
};

const backLinkStyle = {
  display: 'flex',
  alignItems: 'center',
  gap: 8,
  padding: '9px 12px',
  borderRadius: 8,
  fontSize: 13,
  fontWeight: 500,
  color: '#71717a',
  textDecoration: 'none',
};
