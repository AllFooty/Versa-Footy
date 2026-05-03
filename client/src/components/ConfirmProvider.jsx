import React, { createContext, useCallback, useContext, useRef, useState } from 'react';
import ConfirmModal from './modals/ConfirmModal';

const ConfirmContext = createContext(null);

export function ConfirmProvider({ children }) {
  const [state, setState] = useState(null);
  const resolverRef = useRef(null);

  const confirm = useCallback((options = {}) => {
    return new Promise((resolve) => {
      resolverRef.current = resolve;
      setState({
        title: options.title,
        message: options.message,
        confirmLabel: options.confirmLabel,
        danger: Boolean(options.danger),
        requireConfirmText: options.requireConfirmText,
      });
    });
  }, []);

  const handleClose = useCallback(() => {
    resolverRef.current?.(false);
    resolverRef.current = null;
    setState(null);
  }, []);

  const handleConfirm = useCallback(() => {
    resolverRef.current?.(true);
    resolverRef.current = null;
    setState(null);
  }, []);

  return (
    <ConfirmContext.Provider value={confirm}>
      {children}
      <ConfirmModal
        isOpen={Boolean(state)}
        title={state?.title}
        message={state?.message}
        confirmLabel={state?.confirmLabel}
        confirmDanger={state?.danger}
        requireConfirmText={state?.requireConfirmText}
        onConfirm={handleConfirm}
        onClose={handleClose}
      />
    </ConfirmContext.Provider>
  );
}

export function useConfirm() {
  const ctx = useContext(ConfirmContext);
  if (!ctx) throw new Error('useConfirm must be used inside <ConfirmProvider>');
  return ctx;
}
