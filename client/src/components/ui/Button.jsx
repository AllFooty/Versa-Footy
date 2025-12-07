import React from 'react';

/**
 * Primary button component
 */
export const Button = ({ children, onClick, type = 'button', disabled = false }) => (
  <button
    type={type}
    className="btn-primary"
    onClick={onClick}
    disabled={disabled}
  >
    {children}
  </button>
);

/**
 * Secondary/ghost button component
 */
export const SecondaryButton = ({ children, onClick, type = 'button', style = {} }) => (
  <button
    type={type}
    className="btn-secondary"
    onClick={onClick}
    style={style}
  >
    {children}
  </button>
);

/**
 * Icon-only button component
 */
export const IconButton = ({ 
  children, 
  onClick, 
  danger = false, 
  title = '',
  style = {} 
}) => (
  <button
    className={`btn-icon ${danger ? 'danger' : ''}`}
    onClick={onClick}
    title={title}
    style={style}
  >
    {children}
  </button>
);

export default Button;
