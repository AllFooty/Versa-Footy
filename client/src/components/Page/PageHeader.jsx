import React from 'react';

export default function PageHeader({ eyebrow, title, subtitle, backLink, actions, children }) {
  return (
    <header className="page-header">
      {backLink && <div className="page-header__backlink">{backLink}</div>}
      <div className="page-header__row">
        <div className="page-header__text">
          {eyebrow && <p className="page-header__eyebrow">{eyebrow}</p>}
          {title && <h1 className="page-header__title">{title}</h1>}
          {subtitle && <p className="page-header__subtitle">{subtitle}</p>}
        </div>
        {actions && <div className="page-header__actions">{actions}</div>}
      </div>
      {children}
    </header>
  );
}
