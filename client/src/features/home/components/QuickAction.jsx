import React from 'react';
import { Link } from 'wouter';

export default function QuickAction({ href, title, description, icon, accent = '#22d3ee', primary }) {
  return (
    <Link href={href}>
      <a
        className="dash-action"
        style={{
          display: 'flex',
          alignItems: 'center',
          gap: 14,
          padding: '16px 18px',
          background: primary ? 'rgba(15, 23, 42, 0.65)' : 'rgba(255, 255, 255, 0.03)',
          border: primary ? `1px solid ${accent}3d` : '1px solid rgba(255, 255, 255, 0.06)',
          borderRadius: 12,
          textDecoration: 'none',
          color: '#e5e7eb',
          transition: 'transform 0.15s, background 0.15s, border-color 0.15s',
        }}
      >
        <div style={{
          width: 40,
          height: 40,
          borderRadius: 10,
          background: `${accent}1f`,
          color: accent,
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          flexShrink: 0,
        }}>
          {icon}
        </div>
        <div style={{ flex: 1, minWidth: 0 }}>
          <div style={{ fontSize: 15, fontWeight: 600, color: '#f1f5f9', marginBottom: 2 }}>
            {title}
          </div>
          {description && (
            <div style={{ fontSize: 12.5, color: '#94a3b8' }}>
              {description}
            </div>
          )}
        </div>
        <svg width="16" height="16" viewBox="0 0 24 24" fill="none"
          stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"
          style={{ marginInlineStart: 'auto', opacity: 0.4 }}>
          <polyline points="9 18 15 12 9 6" />
        </svg>
      </a>
    </Link>
  );
}
