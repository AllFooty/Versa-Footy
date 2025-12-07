import React from 'react';
import { X, Save } from 'lucide-react';
import { IconButton, Button, SecondaryButton } from '../ui';

/**
 * Reusable modal wrapper component
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
  if (!isOpen) return null;

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div
        className={`modal ${large ? 'modal-large' : ''}`}
        onClick={(e) => e.stopPropagation()}
      >
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
        {children}

        {/* Footer */}
        {showSave && (
          <div
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
    </div>
  );
};

export default Modal;
