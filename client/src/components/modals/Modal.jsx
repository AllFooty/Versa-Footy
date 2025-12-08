import React, { useEffect } from 'react';
import { X, Save } from 'lucide-react';
import { IconButton, Button, SecondaryButton } from '../ui';

/**
 * Reusable modal wrapper component
 * Mobile-responsive with slide-up behavior
 */
const Modal = ({
  title,
  isOpen,
  onClose,
  onSave,
  saveLabel = 'Save',
  saveDisabled = false,
  showSave = true,
  large = false,
  children,
}) => {
  // Prevent body scroll when modal is open
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
        className={`modal ${large ? 'modal-large' : ''}`}
        onClick={(e) => e.stopPropagation()}
      >
        {/* Mobile drag handle indicator */}
        <div
          className="modal-drag-handle"
          style={{
            width: 40,
            height: 4,
            background: 'rgba(255,255,255,0.2)',
            borderRadius: 2,
            margin: '0 auto 16px',
            display: 'none',
          }}
        />

        {/* Header */}
        <div
          style={{
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            marginBottom: 24,
          }}
        >
          <h2
            className="modal-title"
            style={{
              margin: 0,
              fontFamily: "'Space Grotesk', sans-serif",
              fontSize: 20,
              fontWeight: 600,
            }}
          >
            {title}
          </h2>
          <IconButton onClick={onClose}>
            <X size={20} />
          </IconButton>
        </div>

        {/* Content */}
        <div className="modal-content">
          {children}
        </div>

        {/* Footer */}
        {showSave && (
          <div
            className="modal-footer"
            style={{
              display: 'flex',
              justifyContent: 'flex-end',
              gap: 12,
              marginTop: 32,
            }}
          >
            <SecondaryButton onClick={onClose}>Cancel</SecondaryButton>
            <Button onClick={onSave} disabled={saveDisabled}>
              <Save size={16} /> {saveLabel}
            </Button>
          </div>
        )}
      </div>

      {/* Mobile-specific modal styles */}
      <style>{`
        @media (max-width: 768px) {
          .modal-drag-handle {
            display: block !important;
          }
          .modal-title {
            font-size: 18px !important;
          }
          .modal-content {
            max-height: 60vh;
            overflow-y: auto;
            -webkit-overflow-scrolling: touch;
          }
          .modal-footer {
            flex-direction: column-reverse;
            gap: 10px !important;
            margin-top: 24px !important;
            padding-top: 16px;
            border-top: 1px solid rgba(255,255,255,0.06);
          }
          .modal-footer button {
            width: 100%;
            justify-content: center;
            min-height: 48px;
          }
        }
      `}</style>
    </div>
  );
};

export default Modal;
