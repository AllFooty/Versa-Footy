import React from 'react';
import { useTranslation } from 'react-i18next';
import NavItem from './NavItem';

export default function NavSection({ section, onNavigate }) {
  const { t } = useTranslation();
  if (!section.items?.length) return null;

  return (
    <div className="app-nav-section">
      <div className="app-nav-section__label">{t(section.labelKey)}</div>
      <div className="app-nav-section__items">
        {section.items.map((item) => (
          <NavItem key={item.href} item={item} onNavigate={onNavigate} />
        ))}
      </div>
    </div>
  );
}
