import React, { useState, useEffect } from 'react';
import { Link } from 'wouter';
import { motion, AnimatePresence } from 'framer-motion';
import { useAuth } from '../../../lib/AuthContext';
import styles from '../styles/LandingPage.module.css';

export default function HeaderLanding() {
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const [isScrolled, setIsScrolled] = useState(false);
  const { isAuthenticated, user, signOut } = useAuth();

  useEffect(() => {
    const handleScroll = () => {
      setIsScrolled(window.scrollY > 20);
    };
    window.addEventListener('scroll', handleScroll);
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  // Base navigation items (always visible)
  const baseNavigationItems = [
    { name: 'How It Works', href: '/#how-it-works' },
    { name: 'Features', href: '/#features' },
    { name: 'Why Us', href: '/#why-versa-footy' },
    { name: 'Testimonials', href: '/#testimonials' },
    { name: 'FAQ', href: '/faq' },
    { name: 'About Us', href: '/about-us' },
  ];

  // Add Library link only when authenticated
  const navigationItems = isAuthenticated
    ? [...baseNavigationItems, { name: 'Library', href: '/library' }]
    : baseNavigationItems;

  const handleAnchorClick = (e, href, onClick) => {
    // Check if it's a hash link (anchor on current page)
    if (href.startsWith('/#')) {
      e.preventDefault();
      const targetId = href.substring(2); // Remove '/#' to get the id
      const element = document.getElementById(targetId);
      if (element) {
        element.scrollIntoView({ behavior: 'smooth', block: 'start' });
      }
      if (onClick) onClick(e);
    }
  };

  const LinkEl = ({ href, children, style, onClick }) => {
    const isExternal = href.startsWith('http');
    const isAnchor = href.startsWith('/#');
    
    if (isExternal) {
      return (
        <a href={href} style={style} onClick={onClick}>
          {children}
        </a>
      );
    }
    
    if (isAnchor) {
      return (
        <a 
          href={href} 
          style={style} 
          onClick={(e) => handleAnchorClick(e, href, onClick)}
        >
          {children}
        </a>
      );
    }
    
    return (
      <Link href={href}>
        <a style={style} onClick={onClick}>
          {children}
        </a>
      </Link>
    );
  };

  const headerStyle = {
    background: 'linear-gradient(180deg, rgba(26, 43, 71, 0.98) 0%, rgba(26, 43, 71, 0.95) 100%)',
    backdropFilter: 'blur(20px)',
    WebkitBackdropFilter: 'blur(20px)',
    padding: '12px 0',
    position: 'sticky',
    top: 0,
    zIndex: 100,
    borderBottom: '1px solid rgba(255, 255, 255, 0.08)',
    boxShadow: isScrolled ? '0 4px 30px rgba(0, 0, 0, 0.15)' : 'none',
    transition: 'box-shadow 0.3s ease',
  };

  const containerStyle = {
    maxWidth: '1280px',
    margin: '0 auto',
    padding: '0 24px',
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
  };

  const logoStyle = {
    display: 'flex',
    alignItems: 'center',
    gap: '12px',
    color: 'white',
    textDecoration: 'none',
    transition: 'color 0.2s ease',
  };

  const navLinkStyle = {
    color: 'rgba(255, 255, 255, 0.85)',
    fontSize: '15px',
    fontWeight: '500',
    padding: '8px 12px',
    borderRadius: '8px',
    transition: 'all 0.2s ease',
    textDecoration: 'none',
  };

  const buttonStyle = {
    background: 'linear-gradient(135deg, #ff4b4b 0%, #e63946 100%)',
    color: 'white',
    borderRadius: '10px',
    padding: '10px 20px',
    fontWeight: '600',
    fontSize: '14px',
    boxShadow: '0 4px 14px rgba(255, 75, 75, 0.35)',
    border: 'none',
    cursor: 'pointer',
    transition: 'all 0.3s ease',
    textDecoration: 'none',
    display: 'inline-flex',
    alignItems: 'center',
    gap: '8px',
  };

  const signOutButtonStyle = {
    background: 'transparent',
    color: 'rgba(255, 255, 255, 0.85)',
    borderRadius: '10px',
    padding: '10px 16px',
    fontWeight: '500',
    fontSize: '14px',
    border: '1px solid rgba(255, 255, 255, 0.2)',
    cursor: 'pointer',
    transition: 'all 0.3s ease',
    textDecoration: 'none',
    display: 'inline-flex',
    alignItems: 'center',
    gap: '6px',
  };

  return (
    <header style={headerStyle}>
      <div style={containerStyle}>
        {/* Logo */}
        <Link href="/">
          <a style={logoStyle}>
            <img
              src="/images/Versa Footy Icon.png"
              alt="Versa Footy Logo"
              style={{ width: '44px', height: '44px', borderRadius: '10px' }}
            />
            <div style={{ display: 'flex', flexDirection: 'column' }}>
              <span style={{ fontSize: '20px', fontWeight: '700', lineHeight: '1.2' }}>
                Versa Footy
              </span>
              <span style={{ fontSize: '10px', color: '#94a3b8', textTransform: 'uppercase', letterSpacing: '0.05em' }}>
                AI Soccer Training
              </span>
            </div>
          </a>
        </Link>

        {/* Desktop Navigation */}
        <nav style={{ display: 'flex', alignItems: 'center', gap: '4px' }} className="desktop-nav">
          {navigationItems.map((item) => (
            <LinkEl
              key={item.name}
              href={item.href}
              style={navLinkStyle}
            >
              {item.name}
            </LinkEl>
          ))}
        </nav>

        {/* CTA Buttons */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
          {isAuthenticated ? (
            <>
              <span style={{ 
                color: 'rgba(255, 255, 255, 0.7)', 
                fontSize: '13px',
                maxWidth: '140px',
                overflow: 'hidden',
                textOverflow: 'ellipsis',
                whiteSpace: 'nowrap',
              }} className="desktop-cta">
                {user?.email}
              </span>
              <button 
                onClick={signOut}
                style={signOutButtonStyle} 
                className="desktop-cta"
              >
                Sign Out
              </button>
            </>
          ) : (
            <Link href="/login">
              <a 
                style={buttonStyle} 
                className="desktop-cta"
              >
                <span>Sign In</span>
                <svg style={{ width: '16px', height: '16px' }} fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 7l5 5m0 0l-5 5m5-5H6" />
                </svg>
              </a>
            </Link>
          )}

          {/* Mobile Menu Button */}
          <button
            className="mobile-menu-btn"
            onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
            aria-label="Toggle mobile menu"
            style={{
              display: 'none',
              background: 'transparent',
              border: 'none',
              color: 'white',
              padding: '8px',
              borderRadius: '8px',
              cursor: 'pointer',
            }}
          >
            {isMobileMenuOpen ? (
              <svg style={{ width: '24px', height: '24px' }} viewBox="0 0 24 24" fill="none" stroke="currentColor">
                <path d="M6 18L18 6M6 6l12 12" strokeWidth="2" strokeLinecap="round" />
              </svg>
            ) : (
              <svg style={{ width: '24px', height: '24px' }} viewBox="0 0 24 24" fill="none" stroke="currentColor">
                <path d="M4 6h16M4 12h16M4 18h16" strokeWidth="2" strokeLinecap="round" />
              </svg>
            )}
          </button>
        </div>
      </div>

      {/* Mobile Menu */}
      <AnimatePresence>
        {isMobileMenuOpen && (
          <motion.div
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: 'auto', opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            transition={{ duration: 0.3, ease: 'easeInOut' }}
            style={{ overflow: 'hidden' }}
            className="mobile-menu"
          >
            <nav style={{
              padding: '16px 24px',
              display: 'flex',
              flexDirection: 'column',
              gap: '4px',
              borderTop: '1px solid rgba(255, 255, 255, 0.1)',
              background: 'rgba(26, 43, 71, 0.95)',
            }}>
              {navigationItems.map((item, index) => (
                <motion.div
                  key={item.name}
                  initial={{ opacity: 0, x: -20 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ delay: index * 0.05 }}
                >
                  <LinkEl
                    href={item.href}
                    style={{
                      display: 'block',
                      padding: '12px 16px',
                      borderRadius: '10px',
                      color: 'rgba(255, 255, 255, 0.9)',
                      fontSize: '16px',
                      fontWeight: '500',
                      textDecoration: 'none',
                      transition: 'background 0.2s',
                    }}
                    onClick={() => setIsMobileMenuOpen(false)}
                  >
                    {item.name}
                  </LinkEl>
                </motion.div>
              ))}
              <motion.div
                initial={{ opacity: 0, x: -20 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: navigationItems.length * 0.05 }}
                style={{ paddingTop: '12px' }}
              >
                {isAuthenticated ? (
                  <button
                    onClick={() => {
                      signOut();
                      setIsMobileMenuOpen(false);
                    }}
                    style={{
                      ...signOutButtonStyle,
                      width: '100%',
                      justifyContent: 'center',
                    }}
                  >
                    Sign Out
                  </button>
                ) : (
                  <Link href="/login">
                    <a
                      style={{
                        ...buttonStyle,
                        width: '100%',
                        justifyContent: 'center',
                      }}
                      onClick={() => setIsMobileMenuOpen(false)}
                    >
                      <span>Sign In</span>
                      <svg style={{ width: '16px', height: '16px' }} fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 7l5 5m0 0l-5 5m5-5H6" />
                      </svg>
                    </a>
                  </Link>
                )}
              </motion.div>
            </nav>
          </motion.div>
        )}
      </AnimatePresence>

      <style>{`
        @media (max-width: 1023px) {
          .desktop-nav {
            display: none !important;
          }
          .desktop-cta {
            display: none !important;
          }
          .mobile-menu-btn {
            display: flex !important;
          }
        }
        @media (min-width: 1024px) {
          .mobile-menu {
            display: none !important;
          }
        }
      `}</style>
    </header>
  );
}
