import React from 'react';
import { Link } from 'wouter';
import { useTranslation } from 'react-i18next';
import { useAuth } from '../../lib/AuthContext';
import navConfig from './navConfig';
import NavSection from './NavSection';
import OrgSwitcher from './OrgSwitcher';

function BrandHeader({ collapsed }) {
  const { t } = useTranslation();
  return (
    <Link href="/home">
      <a className="app-sidebar__brand">
        <div className="app-sidebar__brand-mark" aria-hidden="true">VF</div>
        {!collapsed && (
          <div className="app-sidebar__brand-text">
            <div className="app-sidebar__brand-name">{t('common.appName')}</div>
            <div className="app-sidebar__brand-tagline">{t('nav.ground')}</div>
          </div>
        )}
      </a>
    </Link>
  );
}

export default function AppSidebar({ onNavigate }) {
  const { t } = useTranslation();
  const { isAdmin, isCoach, organizations, orgsLoading } = useAuth();

  const allSections = navConfig
    .filter((section) => section.visible({ isAdmin, isCoach, organizations, orgsLoading }))
    .map((section) => ({
      ...section,
      items: section.items.filter((item) =>
        item.visible ? item.visible({ isAdmin, isCoach, organizations, orgsLoading }) : true
      ),
    }))
    .filter((section) => section.items.length > 0);

  const topSections = allSections.filter((s) => s.pinned !== 'bottom');
  const bottomSections = allSections.filter((s) => s.pinned === 'bottom');

  return (
    <div className="app-sidebar__inner">
      <BrandHeader />
      <OrgSwitcher variant="sidebar" />
      <nav className="app-sidebar__nav" aria-label={t('nav.primary', 'Primary navigation')}>
        {topSections.map((section) => (
          <NavSection key={section.groupKey} section={section} onNavigate={onNavigate} />
        ))}
      </nav>
      <div className="app-sidebar__pinned">
        {bottomSections.map((section) => (
          <NavSection key={section.groupKey} section={section} onNavigate={onNavigate} />
        ))}
      </div>
      <div className="app-sidebar__footer">
        <Link href="/">
          <a className="app-sidebar__back-link" onClick={onNavigate}>
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <line x1="19" y1="12" x2="5" y2="12" />
              <polyline points="12 19 5 12 12 5" />
            </svg>
            {t('nav.backToLanding')}
          </a>
        </Link>
      </div>
    </div>
  );
}
