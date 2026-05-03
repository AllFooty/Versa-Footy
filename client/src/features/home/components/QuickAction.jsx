import React from 'react';
import { Link } from 'wouter';

export default function QuickAction({ href, title, description, icon, accent = 'var(--color-focus)', primary }) {
  return (
    <Link href={href}>
      <a
        className="dash-action"
        style={{
          display: 'flex',
          alignItems: 'center',
          gap: 14,
          padding: '16px 18px',
          background: primary ? 'var(--surface-card)' : 'var(--surface-glass)',
          border: primary ? `1px solid color-mix(in srgb, ${accent} 34%, transparent)` : '1px solid var(--border-subtle)',
          borderRadius: 12,
          textDecoration: 'none',
          color: 'var(--text-primary)',
          transition: 'transform 0.15s, background 0.15s, border-color 0.15s',
        }}
      >
        <div style={{
          width: 40,
          height: 40,
          borderRadius: 10,
          background: `color-mix(in srgb, ${accent} 18%, transparent)`,
          color: accent,
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          flexShrink: 0,
        }}>
          {icon}
        </div>
        <div style={{ flex: 1, minWidth: 0 }}>
          <div style={{ fontSize: 15, fontWeight: 600, color: 'var(--text-primary)', marginBottom: 2 }}>
            {title}
          </div>
          {description && (
            <div style={{ fontSize: 12.5, color: 'var(--text-muted)' }}>
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
