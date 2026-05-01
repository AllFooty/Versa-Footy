import React, { useEffect, useState } from 'react';
import { useLocation } from 'wouter';
import { useTranslation } from 'react-i18next';
import AppSidebar from './AppSidebar';
import AppHeader from './AppHeader';
import '../../styles/app-shell.css';
import '../../styles/page.css';

export default function AppShell({ children, pageTitle, pageTitleKey }) {
  const { t } = useTranslation();
  const resolvedTitle = pageTitleKey ? t(pageTitleKey) : pageTitle;
  const [mobileOpen, setMobileOpen] = useState(false);
  const [location] = useLocation();

  useEffect(() => {
    setMobileOpen(false);
  }, [location]);

  useEffect(() => {
    if (!resolvedTitle) return;
    const ground = t('nav.ground');
    const brand = t('common.appName');
    document.title = `${ground} · ${resolvedTitle} · ${brand}`;
  }, [resolvedTitle, t]);

  useEffect(() => {
    if (!mobileOpen) return undefined;
    const onKey = (e) => { if (e.key === 'Escape') setMobileOpen(false); };
    document.addEventListener('keydown', onKey);
    const prevOverflow = document.body.style.overflow;
    document.body.style.overflow = 'hidden';
    return () => {
      document.removeEventListener('keydown', onKey);
      document.body.style.overflow = prevOverflow;
    };
  }, [mobileOpen]);

  const handleSidebarNavigate = () => setMobileOpen(false);

  return (
    <div className="app-shell">
      <a className="app-shell__skip-link" href="#app-shell-content">
        {t('nav.skipToContent', 'Skip to main content')}
      </a>
      <aside
        id="app-shell-sidebar"
        className={`app-sidebar${mobileOpen ? ' app-sidebar--open' : ''}`}
        aria-label={t('nav.primary', 'Primary navigation')}
      >
        <AppSidebar onNavigate={handleSidebarNavigate} />
      </aside>

      {mobileOpen && (
        <div
          className="app-shell__overlay"
          onClick={() => setMobileOpen(false)}
          aria-hidden="true"
        />
      )}

      <div className="app-shell__main">
        <AppHeader
          pageTitle={resolvedTitle}
          mobileOpen={mobileOpen}
          onToggleMobile={() => setMobileOpen((v) => !v)}
        />
        <main id="app-shell-content" className="app-shell__content" tabIndex={-1}>
          {children}
        </main>
      </div>
    </div>
  );
}
