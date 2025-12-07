import React from 'react';

const overlayStyle = {
  position: 'fixed',
  inset: 0,
  background: 'rgba(0,0,0,0.55)',
  display: 'flex',
  alignItems: 'center',
  justifyContent: 'center',
  zIndex: 1000,
};

const modalStyle = {
  background: 'white',
  borderRadius: 16,
  padding: 24,
  maxWidth: 420,
  width: '90%',
  boxShadow: '0 24px 60px rgba(0,0,0,0.35)',
};

const SignUpModal = ({ onClose }) => {
  return (
    <div style={overlayStyle} onClick={onClose} role="presentation">
      <div style={modalStyle} onClick={(e) => e.stopPropagation()}>
        <h2 style={{ fontSize: 20, marginBottom: 12 }}>Join the waitlist</h2>
        <p style={{ marginBottom: 16, color: '#475569' }}>
          This is a placeholder modal. We will connect this to your signup backend or email service.
        </p>
        <label htmlFor="email" style={{ display: 'block', marginBottom: 8, fontWeight: 600 }}>
          Email
        </label>
        <input
          id="email"
          type="email"
          placeholder="you@example.com"
          style={{
            width: '100%',
            padding: '10px 12px',
            borderRadius: 10,
            border: '1px solid #e2e8f0',
            marginBottom: 16,
          }}
        />
        <button
          type="button"
          style={{
            width: '100%',
            padding: '12px 14px',
            borderRadius: 12,
            border: 'none',
            background: 'linear-gradient(135deg, #2563eb, #22d3ee)',
            color: '#0b1020',
            fontWeight: 700,
            cursor: 'pointer',
          }}
          onClick={onClose}
        >
          Submit
        </button>
        <button
          type="button"
          onClick={onClose}
          style={{
            marginTop: 10,
            width: '100%',
            padding: '10px 12px',
            borderRadius: 10,
            border: '1px solid #e2e8f0',
            background: 'white',
            cursor: 'pointer',
          }}
        >
          Close
        </button>
      </div>
    </div>
  );
};

export default SignUpModal;

