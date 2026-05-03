import React from 'react';

export default function StatCard({ label, value, accent = 'var(--color-secondary-action)', icon, suffix, loading }) {
  return (
    <div className="dash-stat" style={{
      background: 'var(--surface-card)',
      border: '1px solid var(--border-subtle)',
      borderRadius: 14,
      padding: '18px 20px',
      display: 'flex',
      alignItems: 'flex-start',
      gap: 14,
      minHeight: 96,
    }}>
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
      <div style={{ minWidth: 0, flex: 1 }}>
        {loading ? (
          <div style={{
            width: 60,
            height: 28,
            borderRadius: 6,
            background: 'linear-gradient(90deg, var(--surface-glass-hover), var(--border-medium), var(--surface-glass-hover))',
            backgroundSize: '200% 100%',
            animation: 'app-shell-shimmer 1.4s ease-in-out infinite',
            marginBottom: 6,
          }} />
        ) : (
          <div style={{
            fontSize: 26,
            fontWeight: 700,
            color: 'var(--text-primary)',
            lineHeight: 1.1,
            marginBottom: 4,
            wordBreak: 'break-word',
          }}>
            {value}
            {suffix && <span style={{ fontSize: 14, fontWeight: 500, color: 'var(--text-muted)', marginInlineStart: 4 }}>{suffix}</span>}
          </div>
        )}
        <div style={{
          fontSize: 12.5,
          color: 'var(--text-muted)',
          textTransform: 'uppercase',
          letterSpacing: '0.06em',
          fontWeight: 600,
        }}>
          {label}
        </div>
      </div>
    </div>
  );
}
