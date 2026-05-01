import React, { useEffect, useId, useState } from 'react';
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
  const titleId = useId();
  const descId = useId();
  const [busy, setBusy] = useState(false);

  const resolvedTitle = title || t('modals.confirm.defaultTitle');
  const resolvedConfirmLabel = confirmLabel || t('modals.confirm.defaultConfirm');

  useEffect(() => {
    if (!isOpen) return;
    document.body.style.overflow = 'hidden';
    const handleKeyDown = (e) => {
      if (e.key === 'Escape' && !busy) onClose();
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => {
      document.body.style.overflow = '';
      window.removeEventListener('keydown', handleKeyDown);
    };
  }, [isOpen, onClose, busy]);

  if (!isOpen) return null;

  const handleConfirm = async () => {
    if (busy) return;
    setBusy(true);
    try {
      await onConfirm();
      onClose();
    } finally {
      setBusy(false);
    }
  };

  return (
    <div className="modal-overlay" onClick={busy ? undefined : onClose}>
      <div
        className="modal"
        onClick={(e) => e.stopPropagation()}
        role="alertdialog"
        aria-modal="true"
        aria-labelledby={titleId}
        aria-describedby={descId}
        style={{ maxWidth: 420 }}
      >
        <div style={{
          display: 'flex',
          alignItems: 'center',
          gap: 12,
          marginBottom: 16,
        }}>
          <div
            aria-hidden="true"
            style={{
              width: 40,
              height: 40,
              borderRadius: 'var(--radius-lg)',
              background: confirmDanger
                ? 'rgba(239, 68, 68, 0.15)'
                : 'rgba(59, 130, 246, 0.15)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              flexShrink: 0,
            }}
          >
            <AlertTriangle
              size={20}
              color={confirmDanger ? '#ef4444' : '#3b82f6'}
            />
          </div>
          <h2
            id={titleId}
            style={{
              margin: 0,
              fontFamily: 'var(--font-display)',
              fontSize: 18,
              fontWeight: 600,
            }}
          >
            {resolvedTitle}
          </h2>
        </div>

        <p
          id={descId}
          style={{
            color: '#a1a1aa',
            fontSize: 14,
            lineHeight: 1.6,
            margin: '0 0 24px',
          }}
        >
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
          <button className="btn-secondary" onClick={onClose} disabled={busy}>
            {t('modals.confirm.defaultCancel')}
          </button>
          <button
            className="btn-primary"
            onClick={handleConfirm}
            disabled={busy}
            style={confirmDanger ? {
              background: 'var(--gradient-danger)',
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
