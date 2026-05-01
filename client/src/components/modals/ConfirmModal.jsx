import React, { useEffect, useState } from 'react';
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
  requireConfirmText,
  onConfirm,
  onClose,
}) => {
  const { t } = useTranslation();
  const [typedConfirm, setTypedConfirm] = useState('');

  const resolvedTitle = title || t('modals.confirm.defaultTitle');
  const resolvedConfirmLabel = confirmLabel || t('modals.confirm.defaultConfirm');
  const needsTypedConfirm = !!requireConfirmText;
  const typedMatches = needsTypedConfirm && typedConfirm === requireConfirmText;
  const confirmDisabled = needsTypedConfirm && !typedMatches;

  useEffect(() => {
    if (isOpen) {
      document.body.style.overflow = 'hidden';
    } else {
      document.body.style.overflow = '';
      setTypedConfirm('');
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
          margin: needsTypedConfirm ? '0 0 16px' : '0 0 24px',
        }}>
          {message}
        </p>

        {needsTypedConfirm && (
          <div style={{ marginBottom: 24 }}>
            <label
              htmlFor="confirm-modal-typed"
              style={{
                display: 'block',
                fontSize: 13,
                color: '#cbd5e1',
                marginBottom: 8,
              }}
            >
              {t('modals.confirm.typeToConfirm', { value: requireConfirmText })}
            </label>
            <input
              id="confirm-modal-typed"
              type="text"
              autoFocus
              autoComplete="off"
              spellCheck={false}
              value={typedConfirm}
              onChange={(e) => setTypedConfirm(e.target.value)}
              placeholder={t('modals.confirm.typeToConfirmPlaceholder')}
              aria-invalid={typedConfirm.length > 0 && !typedMatches}
              style={{
                width: '100%',
                padding: '10px 12px',
                background: 'rgba(0, 0, 0, 0.3)',
                border: `1px solid ${typedMatches ? 'rgba(34, 197, 94, 0.5)' : 'rgba(255, 255, 255, 0.12)'}`,
                borderRadius: 8,
                color: '#e5e7eb',
                fontSize: 14,
                fontFamily: 'inherit',
                outline: 'none',
                boxSizing: 'border-box',
              }}
            />
          </div>
        )}

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
              if (confirmDisabled) return;
              onConfirm();
              onClose();
            }}
            disabled={confirmDisabled}
            aria-disabled={confirmDisabled}
            style={{
              ...(confirmDanger ? {
                background: 'linear-gradient(135deg, #ef4444, #dc2626)',
                boxShadow: 'none',
              } : {}),
              ...(confirmDisabled ? {
                opacity: 0.5,
                cursor: 'not-allowed',
              } : {}),
            }}
          >
            {resolvedConfirmLabel}
          </button>
        </div>
      </div>

    </div>
  );
};

export default ConfirmModal;
