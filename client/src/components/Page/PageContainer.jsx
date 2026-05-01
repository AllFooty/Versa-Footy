import React from 'react';

const widthClass = {
  narrow: 'page--narrow',
  default: 'page--default',
  wide: 'page--wide',
  fluid: 'page--fluid',
};

export default function PageContainer({ children, width = 'default', className = '' }) {
  const w = widthClass[width] || widthClass.default;
  return (
    <div className={`page ${w}${className ? ` ${className}` : ''}`}>
      {children}
    </div>
  );
}
