import React from 'react';
import { useTranslation } from 'react-i18next';
import ProfileDropdown from '../ProfileDropdown';
import LanguageSwitcher from '../LanguageSwitcher';
import OrgSwitcher from './OrgSwitcher';

export default function AppHeader({ pageTitle, mobileOpen, onToggleMobile }) {
  const { t } = useTranslation();

  return (
    <header className="app-header">
      <button
        type="button"
        className="app-header__hamburger"
        onClick={onToggleMobile}
        aria-expanded={mobileOpen}
        aria-controls="app-shell-sidebar"
        aria-label={t('nav.openMenu', 'Open navigation menu')}
      >
        <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round">
          <line x1="3" y1="6" x2="21" y2="6" />
          <line x1="3" y1="12" x2="21" y2="12" />
          <line x1="3" y1="18" x2="21" y2="18" />
        </svg>
      </button>

      <h1 className="app-header__title">{pageTitle}</h1>

      <div className="app-header__actions">
        <OrgSwitcher variant="header" />
        <LanguageSwitcher className="app-header__lang-btn" />
        <ProfileDropdown />
      </div>
    </header>
  );
}
