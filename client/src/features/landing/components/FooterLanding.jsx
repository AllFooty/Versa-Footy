import React from 'react';
import { Link } from 'wouter';
import SocialIcon from './SocialIcons';
import { useAuth } from '../../../lib/AuthContext';

const FooterLanding = () => {
  const { isAuthenticated } = useAuth();

  const LinkEl = ({ href, children, style }) => {
    const isExternal = href.startsWith('http');
    if (isExternal) {
      return (
        <a href={href} style={style} target="_blank" rel="noopener noreferrer">
          {children}
        </a>
      );
    }
    return (
      <Link href={href}>
        <a style={style}>{children}</a>
      </Link>
    );
  };

  // Base quick links
  const baseQuickLinks = [
    { name: 'Home', href: '/' },
    { name: 'Features', href: '/#features' },
    { name: 'Testimonials', href: '/#testimonials' },
    { name: 'FAQ', href: '/faq' },
    { name: 'About Us', href: '/about-us' },
  ];

  // Add Library link only when authenticated
  const quickLinks = isAuthenticated
    ? [...baseQuickLinks, { name: 'Library', href: '/library' }]
    : baseQuickLinks;

  const legalLinks = [
    { name: 'Terms of Service', href: '/terms-of-service' },
    { name: 'Privacy Policy', href: '/privacy-policy' },
  ];

  const productLinks = [
    { name: 'VERSA Footy', href: 'https://versafooty.com', color: '#22c55e', active: true },
    { name: 'FAIR Footy', href: 'https://fairfooty.com', color: '#ec4899' },
    { name: 'TRACK Footy', href: 'https://trackfooty.com', color: '#f97316' },
    { name: 'KAAS Footy', href: 'https://kaasfooty.com', color: '#22d3ee' },
    { name: 'JUGGLE Footy', href: 'https://jugglefooty.com', color: '#3b82f6' },
  ];

  const footerStyle = {
    background: 'linear-gradient(180deg, #0f172a 0%, #020617 100%)',
    color: 'rgba(255, 255, 255, 0.8)',
    padding: '64px 0 24px',
  };

  const containerStyle = {
    maxWidth: '1280px',
    margin: '0 auto',
    padding: '0 24px',
  };

  const linkStyle = {
    color: 'rgba(255, 255, 255, 0.7)',
    textDecoration: 'none',
    fontSize: '15px',
    display: 'flex',
    alignItems: 'center',
    gap: '8px',
    transition: 'color 0.2s ease',
  };

  const headingStyle = {
    fontSize: '18px',
    fontWeight: '600',
    color: '#ffd166',
    marginBottom: '20px',
  };

  return (
    <footer style={footerStyle}>
      <div style={containerStyle}>
        {/* Main Footer Content */}
        <div style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))',
          gap: '40px',
          paddingBottom: '48px',
          borderBottom: '1px solid rgba(255, 255, 255, 0.1)',
        }}>
          {/* Brand Column */}
          <div>
            <div style={{ marginBottom: '24px' }}>
              <img
                src="/images/Versa Footy Icon.png"
                alt="Versa Footy Logo"
                style={{ width: '80px', height: '80px', borderRadius: '16px', marginBottom: '16px' }}
              />
              <h3 style={{ fontSize: '24px', fontWeight: '700', color: '#ffd166', margin: '0 0 8px 0' }}>
                Versa Footy
              </h3>
              <p style={{ fontSize: '14px', color: 'rgba(255, 255, 255, 0.6)', margin: 0 }}>
                AI-Powered Soccer Training for Young Athletes
              </p>
            </div>
            <div style={{ display: 'flex', gap: '16px' }}>
              <SocialIcon platform="facebook" url="https://www.facebook.com/profile.php?id=61566950573877" />
              <SocialIcon platform="instagram" url="https://www.instagram.com/versa.footy/" />
              <SocialIcon platform="linkedin" url="https://www.linkedin.com/company/versa-footy" />
            </div>
          </div>

          {/* Quick Links */}
          <div>
            <h4 style={headingStyle}>Quick Links</h4>
            <ul style={{ listStyle: 'none', padding: 0, margin: 0 }}>
              {quickLinks.map((link) => (
                <li key={link.name} style={{ marginBottom: '12px' }}>
                  <LinkEl href={link.href} style={linkStyle}>
                    <span style={{ width: '6px', height: '6px', borderRadius: '50%', background: '#6366f1' }} />
                    {link.name}
                  </LinkEl>
                </li>
              ))}
            </ul>
          </div>

          {/* Legal */}
          <div>
            <h4 style={headingStyle}>Legal</h4>
            <ul style={{ listStyle: 'none', padding: 0, margin: 0 }}>
              {legalLinks.map((link) => (
                <li key={link.name} style={{ marginBottom: '12px' }}>
                  <LinkEl href={link.href} style={linkStyle}>
                    <span style={{ width: '6px', height: '6px', borderRadius: '50%', background: '#6366f1' }} />
                    {link.name}
                  </LinkEl>
                </li>
              ))}
            </ul>
          </div>

          {/* Contact */}
          <div>
            <h4 style={headingStyle}>Contact</h4>
            <ul style={{ listStyle: 'none', padding: 0, margin: 0 }}>
              <li style={{ display: 'flex', alignItems: 'center', gap: '12px', color: 'rgba(255, 255, 255, 0.7)', marginBottom: '16px' }}>
                <svg style={{ width: '20px', height: '20px', color: '#6366f1', flexShrink: 0 }} fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
                </svg>
                <a href="mailto:info@versafooty.com" style={{ color: 'inherit', textDecoration: 'none' }}>
                  info@versafooty.com
                </a>
              </li>
              <li style={{ marginTop: '16px' }}>
                <LinkEl
                  href="/#early-access"
                  style={{
                    display: 'inline-flex',
                    alignItems: 'center',
                    gap: '8px',
                    padding: '10px 16px',
                    background: 'rgba(99, 102, 241, 0.15)',
                    color: '#a5b4fc',
                    borderRadius: '10px',
                    fontSize: '14px',
                    textDecoration: 'none',
                    transition: 'background 0.2s',
                  }}
                >
                  <svg style={{ width: '16px', height: '16px' }} fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 17h5l-1.405-1.405A2.032 2.032 0 0118 14.158V11a6.002 6.002 0 00-4-5.659V5a2 2 0 10-4 0v.341C7.67 6.165 6 8.388 6 11v3.159c0 .538-.214 1.055-.595 1.436L4 17h5m6 0v1a3 3 0 11-6 0v-1m6 0H9" />
                  </svg>
                  Join Waitlist
                </LinkEl>
              </li>
            </ul>
          </div>
        </div>

        {/* All4Footy Section */}
        <div style={{ padding: '40px 0', borderBottom: '1px solid rgba(255, 255, 255, 0.1)' }}>
          <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '24px' }}>
            <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '8px' }}>
              <span style={{ fontSize: '11px', color: 'rgba(255, 255, 255, 0.5)', textTransform: 'uppercase', letterSpacing: '0.1em' }}>
                Part of the
              </span>
              <a
                href="https://all4footy.com"
                target="_blank"
                rel="noopener noreferrer"
                style={{ display: 'flex', alignItems: 'center', gap: '12px', textDecoration: 'none' }}
              >
                <div style={{
                  width: '40px',
                  height: '40px',
                  borderRadius: '50%',
                  background: 'linear-gradient(135deg, #6366f1 0%, #22d3ee 100%)',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                }}>
                  <svg style={{ width: '20px', height: '20px', color: 'white' }} viewBox="0 0 24 24" fill="currentColor">
                    <circle cx="12" cy="12" r="3" />
                    <path d="M12 2a10 10 0 100 20 10 10 0 000-20zm0 18a8 8 0 110-16 8 8 0 010 16z" />
                  </svg>
                </div>
                <span style={{
                  fontSize: '24px',
                  fontWeight: '700',
                  background: 'linear-gradient(135deg, #6366f1 0%, #22d3ee 100%)',
                  WebkitBackgroundClip: 'text',
                  WebkitTextFillColor: 'transparent',
                  backgroundClip: 'text',
                }}>
                  All4Footy
                </span>
                <span style={{ color: 'rgba(255, 255, 255, 0.5)', fontSize: '14px', fontWeight: '500' }}>
                  Family
                </span>
              </a>
              <p style={{ fontSize: '14px', color: 'rgba(255, 255, 255, 0.5)', textAlign: 'center', maxWidth: '400px', marginTop: '8px' }}>
                Empowering the soccer community with innovative software solutions
              </p>
            </div>

            {/* Product Links */}
            <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '12px', width: '100%', paddingTop: '16px' }}>
              <span style={{ fontSize: '11px', color: 'rgba(255, 255, 255, 0.4)', textTransform: 'uppercase', letterSpacing: '0.1em', fontWeight: '500' }}>
                Explore Our Products
              </span>
              <div style={{ display: 'flex', flexWrap: 'wrap', justifyContent: 'center', gap: '12px' }}>
                {productLinks.map((product) => (
                  <a
                    key={product.name}
                    href={product.href}
                    target={product.active ? undefined : '_blank'}
                    rel={product.active ? undefined : 'noopener noreferrer'}
                    style={{
                      display: 'flex',
                      alignItems: 'center',
                      gap: '8px',
                      padding: '8px 12px',
                      borderRadius: '8px',
                      fontSize: '13px',
                      fontWeight: '500',
                      textDecoration: 'none',
                      transition: 'all 0.2s',
                      background: product.active ? 'rgba(255, 255, 255, 0.05)' : 'transparent',
                      color: product.active ? 'white' : 'rgba(255, 255, 255, 0.6)',
                    }}
                  >
                    <span style={{
                      width: '8px',
                      height: '8px',
                      borderRadius: '50%',
                      background: product.color,
                      opacity: product.active ? 1 : 0.6,
                    }} />
                    {product.name}
                  </a>
                ))}
              </div>
            </div>
          </div>
        </div>

        {/* Copyright */}
        <div style={{
          padding: '24px 0 0',
          display: 'flex',
          flexWrap: 'wrap',
          justifyContent: 'space-between',
          alignItems: 'center',
          gap: '16px',
          fontSize: '14px',
          color: 'rgba(255, 255, 255, 0.5)',
        }}>
          <p style={{ margin: 0 }}>© {new Date().getFullYear()} Versa Footy. All rights reserved.</p>
          <p style={{ margin: 0, display: 'flex', alignItems: 'center', gap: '8px' }}>
            <span>An</span>
            <a
              href="https://all4footy.com"
              target="_blank"
              rel="noopener noreferrer"
              style={{ color: '#6366f1', fontWeight: '500', textDecoration: 'none' }}
            >
              All4Footy
            </a>
            <span>Product</span>
          </p>
        </div>
      </div>
    </footer>
  );
};

export default FooterLanding;
