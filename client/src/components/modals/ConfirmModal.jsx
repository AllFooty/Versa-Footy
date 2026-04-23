import React, { useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import { AlertTriangle } from 'lucide-react';

/**
 * Reusable confirmation dialog modal
 * Styled consistently with existing modals, supports danger actions
 */
const ConfirmModal = ({
  isOpen,
  title,
  message,
  confirmLabel,
  confirmDanger = false,
  onConfirm,
  onClose,
}) => {
  const { t } = useTranslation();

  const resolvedTitle = title || t('modals.confirm.defaultTitle');
  const resolvedConfirmLabel = confirmLabel || t('modals.confirm.defaultTitle');

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
    <div className="modal-overlay" onClick={onClose}>
      <div
        className="modal"
        onClick={(e) => e.stopPropagation()}
        style={{ maxWidth: 420 }}
      >
        <div style={{
          display: 'flex',
          alignItems: 'center',
          gap: 12,
          marginBottom: 16,
        }}>
          <div style={{
            width: 40,
            height: 40,
            borderRadius: 10,
            background: confirmDanger
              ? 'rgba(239, 68, 68, 0.15)'
              : 'rgba(59, 130, 246, 0.15)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            flexShrink: 0,
          }}>
            <AlertTriangle
              size={20}
              color={confirmDanger ? '#ef4444' : '#3b82f6'}
            />
          </div>
          <h2 style={{
            margin: 0,
            fontFamily: "'Space Grotesk', sans-serif",
            fontSize: 18,
            fontWeight: 600,
          }}>
            {resolvedTitle}
          </h2>
        </div>

        <p style={{
          color: '#a1a1aa',
          fontSize: 14,
          lineHeight: 1.6,
          margin: '0 0 24px',
        }}>
          {message}
        </p>

        <div
          className="modal-footer"
          style={{
            display: 'flex',
            justifyContent: 'flex-end',
            gap: 12,
          }}
        >
          <button className="btn-secondary" onClick={onClose}>
            {t('modals.confirm.defaultCancel')}
          </button>
          <button
            className="btn-primary"
            onClick={() => {
              onConfirm();
              onClose();
            }}
            style={confirmDanger ? {
              background: 'linear-gradient(135deg, #ef4444, #dc2626)',
              boxShadow: 'none',
            } : {}}
          >
            {resolvedConfirmLabel}
          </button>
        </div>
      </div>

    </div>
  );
};

export default ConfirmModal;
