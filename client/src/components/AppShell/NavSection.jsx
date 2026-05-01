import React, { Fragment } from 'react';
import { useTranslation } from 'react-i18next';
import NavItem from './NavItem';

export default function NavSection({ section, onNavigate }) {
  const { t } = useTranslation();
  if (!section.items?.length) return null;

  return (
    <div className="app-nav-section">
      {section.labelKey && (
        <div className="app-nav-section__label">{t(section.labelKey)}</div>
      )}
      <div className="app-nav-section__items">
        {section.items.map((item) => (
          <Fragment key={item.href}>
            {item.subheaderKey && (
              <div className="app-nav-section__subheader">{t(item.subheaderKey)}</div>
            )}
            <NavItem item={item} onNavigate={onNavigate} />
          </Fragment>
        ))}
      </div>
    </div>
  );
}
