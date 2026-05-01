import React from 'react';

export default function StatCard({ label, value, accent = '#3b82f6', icon, suffix, loading }) {
  return (
    <div className="dash-stat" style={{
      background: 'rgba(15, 23, 42, 0.55)',
      border: '1px solid rgba(255, 255, 255, 0.06)',
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
        background: `${accent}1a`,
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
            background: 'linear-gradient(90deg, rgba(255,255,255,0.06), rgba(255,255,255,0.12), rgba(255,255,255,0.06))',
            backgroundSize: '200% 100%',
            animation: 'app-shell-shimmer 1.4s ease-in-out infinite',
            marginBottom: 6,
          }} />
        ) : (
          <div style={{
            fontSize: 26,
            fontWeight: 700,
            color: '#f1f5f9',
            lineHeight: 1.1,
            marginBottom: 4,
            wordBreak: 'break-word',
            fontFamily: "'Space Grotesk', 'Inter', system-ui, sans-serif",
          }}>
            {value}
            {suffix && <span style={{ fontSize: 14, fontWeight: 500, color: '#94a3b8', marginInlineStart: 4 }}>{suffix}</span>}
          </div>
        )}
        <div style={{
          fontSize: 12.5,
          color: '#94a3b8',
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
