import React, { useEffect } from 'react';

/**
 * Mobile bottom sheet action menu
 * Replaces kebab dropdown menus on mobile for better UX
 */
const ActionSheet = ({ isOpen, onClose, items = [], title }) => {
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

  if (!isOpen) return null;

  return (
    <div
      style={{
        position: 'fixed',
        top: 0,
        left: 0,
        right: 0,
        bottom: 0,
        zIndex: 1000,
        display: 'flex',
        flexDirection: 'column',
        justifyContent: 'flex-end',
      }}
      onClick={onClose}
    >
      {/* Backdrop */}
      <div
        style={{
          position: 'absolute',
          inset: 0,
          background: 'rgba(0, 0, 0, 0.6)',
          backdropFilter: 'blur(4px)',
          animation: 'fadeIn 0.2s ease',
        }}
      />

      {/* Sheet */}
      <div
        onClick={(e) => e.stopPropagation()}
        style={{
          position: 'relative',
          background: 'linear-gradient(145deg, #1e2433, #151a26)',
          borderRadius: '20px 20px 0 0',
          padding: '12px 16px',
          paddingBottom: 'max(16px, env(safe-area-inset-bottom, 16px))',
          animation: 'slideUpMobile 0.3s ease-out',
          border: '1px solid rgba(255,255,255,0.1)',
          borderBottom: 'none',
        }}
      >
        {/* Drag handle */}
        <div
          style={{
            width: 40,
            height: 4,
            background: 'rgba(255,255,255,0.2)',
            borderRadius: 2,
            margin: '0 auto 16px',
          }}
        />

        {title && (
          <div
            style={{
              padding: '0 4px 12px',
              fontSize: 13,
              color: '#71717a',
              fontWeight: 600,
              textTransform: 'uppercase',
              letterSpacing: 0.5,
              overflow: 'hidden',
              textOverflow: 'ellipsis',
              whiteSpace: 'nowrap',
            }}
          >
            {title}
          </div>
        )}

        {items.map((item, i) => (
          <button
            key={i}
            onClick={(e) => {
              e.stopPropagation();
              onClose();
              item.onClick();
            }}
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: 14,
              width: '100%',
              padding: '16px 12px',
              background: 'transparent',
              border: 'none',
              borderRadius: 12,
              color: item.danger ? '#ef4444' : '#e4e4e7',
              fontSize: 16,
              fontWeight: 500,
              cursor: 'pointer',
              textAlign: 'left',
              fontFamily: "'DM Sans', sans-serif",
            }}
          >
            {item.icon}
            {item.label}
          </button>
        ))}

        {/* Cancel button */}
        <button
          onClick={onClose}
          style={{
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            width: '100%',
            padding: '16px',
            marginTop: 8,
            background: 'rgba(255,255,255,0.06)',
            border: '1px solid rgba(255,255,255,0.1)',
            borderRadius: 12,
            color: '#a1a1aa',
            fontSize: 16,
            fontWeight: 600,
            cursor: 'pointer',
            fontFamily: "'DM Sans', sans-serif",
          }}
        >
          Cancel
        </button>
      </div>
    </div>
  );
};

export default ActionSheet;
