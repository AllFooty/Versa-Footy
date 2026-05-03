import React, { useEffect, useId, useRef, useState } from 'react';
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
  const titleId = useId();
  const descId = useId();
  const hintId = useId();
  const [busy, setBusy] = useState(false);
  const [typedText, setTypedText] = useState('');
  const inputRef = useRef(null);

  const resolvedTitle = title || t('modals.confirm.defaultTitle');
  const resolvedConfirmLabel = confirmLabel || t('modals.confirm.defaultConfirm');
  const typedMatches = !requireConfirmText || typedText === requireConfirmText;

  useEffect(() => {
    if (!isOpen) return;
    setTypedText('');
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

  // Focus the typed-confirm input when it appears so admins don't have to click it.
  useEffect(() => {
    if (isOpen && requireConfirmText && inputRef.current) {
      inputRef.current.focus();
    }
  }, [isOpen, requireConfirmText]);

  if (!isOpen) return null;

  const handleConfirm = async () => {
    if (busy || !typedMatches) return;
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
            margin: requireConfirmText ? '0 0 16px' : '0 0 24px',
          }}
        >
          {message}
        </p>

        {requireConfirmText && (
          <div style={{ margin: '0 0 24px' }}>
            <label
              id={hintId}
              htmlFor={`${titleId}-typed-confirm`}
              style={{
                display: 'block',
                color: '#d4d4d8',
                fontSize: 13,
                fontWeight: 500,
                marginBottom: 8,
              }}
            >
              {t('modals.confirm.confirmTextHint', { token: requireConfirmText })}
            </label>
            <input
              ref={inputRef}
              id={`${titleId}-typed-confirm`}
              type="text"
              autoComplete="off"
              spellCheck={false}
              value={typedText}
              onChange={(e) => setTypedText(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === 'Enter' && typedMatches && !busy) handleConfirm();
              }}
              aria-describedby={hintId}
              placeholder={requireConfirmText}
              disabled={busy}
              style={{
                width: '100%',
                padding: '10px 12px',
                background: 'rgba(0,0,0,0.3)',
                border: `1px solid ${typedMatches && typedText.length > 0 ? 'rgba(34,211,238,0.5)' : 'rgba(255,255,255,0.12)'}`,
                borderRadius: 'var(--radius-md)',
                color: '#f4f4f5',
                fontSize: 14,
                fontFamily: 'ui-monospace, SFMono-Regular, monospace',
                letterSpacing: '0.05em',
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
          <button className="btn-secondary" onClick={onClose} disabled={busy}>
            {t('modals.confirm.defaultCancel')}
          </button>
          <button
            className="btn-primary"
            onClick={handleConfirm}
            disabled={busy || !typedMatches}
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
