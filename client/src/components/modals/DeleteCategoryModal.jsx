import React, { useState, useEffect } from 'react';
import { Trash2, AlertTriangle, X } from 'lucide-react';
import { IconButton } from '../ui';

/**
 * Confirmation modal for deleting a category.
 * Requires the user to type the category name to confirm deletion,
 * preventing accidental removals.
 */
const DeleteCategoryModal = ({ isOpen, category, skillCount, exerciseCount, onConfirm, onClose }) => {
  const [typedName, setTypedName] = useState('');

  useEffect(() => {
    if (isOpen) {
      setTypedName('');
      document.body.style.overflow = 'hidden';
    } else {
      document.body.style.overflow = '';
    }
    return () => {
      document.body.style.overflow = '';
    };
  }, [isOpen]);

  if (!isOpen || !category) return null;

  const nameMatches = typedName.trim().toLowerCase() === category.name.trim().toLowerCase();

  const handleConfirm = () => {
    if (nameMatches) {
      onConfirm(category.id);
      onClose();
    }
  };

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div
        className="modal"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div
          style={{
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            marginBottom: 20,
          }}
        >
          <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
            <AlertTriangle size={22} color="#ef4444" />
            <h2
              style={{
                margin: 0,
                fontFamily: "'Space Grotesk', sans-serif",
                fontSize: 20,
                fontWeight: 600,
                color: '#ef4444',
              }}
            >
              Delete Category
            </h2>
          </div>
          <IconButton onClick={onClose}>
            <X size={20} />
          </IconButton>
        </div>

        {/* Warning */}
        <div
          style={{
            backgroundColor: 'rgba(239, 68, 68, 0.08)',
            border: '1px solid rgba(239, 68, 68, 0.2)',
            borderRadius: 8,
            padding: 16,
            marginBottom: 20,
          }}
        >
          <p style={{ margin: 0, fontSize: 14, color: '#fca5a5', lineHeight: 1.6 }}>
            You are about to permanently delete the category{' '}
            <strong style={{ color: '#fff' }}>"{category.name}"</strong>.
            {(skillCount > 0 || exerciseCount > 0) && (
              <>
                {' '}This will also delete:
                <br />
                {skillCount > 0 && (
                  <>
                    {' '}&bull; <strong style={{ color: '#fff' }}>{skillCount} skill{skillCount === 1 ? '' : 's'}</strong>
                    <br />
                  </>
                )}
                {exerciseCount > 0 && (
                  <>
                    {' '}&bull; <strong style={{ color: '#fff' }}>{exerciseCount} exercise{exerciseCount === 1 ? '' : 's'}</strong>
                    <br />
                  </>
                )}
              </>
            )}
            This action <strong style={{ color: '#fff' }}>cannot be undone</strong>.
          </p>
        </div>

        {/* Type to confirm */}
        <div style={{ marginBottom: 24 }}>
          <label
            style={{
              display: 'block',
              fontSize: 13,
              color: '#a1a1aa',
              marginBottom: 8,
            }}
          >
            Type <strong style={{ color: '#e4e4e7' }}>{category.name}</strong> to confirm:
          </label>
          <input
            type="text"
            value={typedName}
            onChange={(e) => setTypedName(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === 'Enter' && nameMatches) handleConfirm();
            }}
            placeholder={category.name}
            autoFocus
            style={{
              width: '100%',
              padding: '10px 12px',
              backgroundColor: '#16161a',
              border: `1px solid ${typedName.length > 0 && !nameMatches ? '#ef4444' : '#2e2e38'}`,
              borderRadius: 8,
              color: '#e4e4e7',
              fontSize: 14,
              outline: 'none',
              boxSizing: 'border-box',
              transition: 'border-color 0.2s',
            }}
          />
        </div>

        {/* Actions */}
        <div
          className="modal-footer"
          style={{
            display: 'flex',
            justifyContent: 'flex-end',
            gap: 12,
          }}
        >
          <button
            onClick={onClose}
            style={{
              padding: '10px 20px',
              backgroundColor: 'transparent',
              border: '1px solid #2e2e38',
              borderRadius: 8,
              color: '#a1a1aa',
              fontSize: 14,
              cursor: 'pointer',
            }}
          >
            Cancel
          </button>
          <button
            onClick={handleConfirm}
            disabled={!nameMatches}
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: 8,
              padding: '10px 20px',
              backgroundColor: nameMatches ? '#dc2626' : '#3f3f46',
              border: 'none',
              borderRadius: 8,
              color: nameMatches ? '#fff' : '#71717a',
              fontSize: 14,
              fontWeight: 600,
              cursor: nameMatches ? 'pointer' : 'not-allowed',
              opacity: nameMatches ? 1 : 0.6,
              transition: 'all 0.2s',
            }}
          >
            <Trash2 size={14} />
            Delete Category
          </button>
        </div>
      </div>

      <style>{`
        @media (max-width: 768px) {
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

export default DeleteCategoryModal;
