import React, { useEffect, useRef, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { useAuth } from '../../lib/AuthContext';

function ChevronDown({ size = 14 }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
      <polyline points="6 9 12 15 18 9" />
    </svg>
  );
}

function StarIcon({ filled, size = 12 }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill={filled ? '#facc15' : 'none'} stroke={filled ? '#facc15' : 'currentColor'} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
      <polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2" />
    </svg>
  );
}

function CheckIcon({ size = 14 }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
      <polyline points="20 6 9 17 4 12" />
    </svg>
  );
}

export default function OrgSwitcher({ variant = 'sidebar' }) {
  const { t } = useTranslation();
  const { activeOrg, organizations, setActiveOrg, setPrimaryOrganization, orgsLoading } = useAuth();
  const [open, setOpen] = useState(false);
  const [busyId, setBusyId] = useState(null);
  const wrapRef = useRef(null);

  useEffect(() => {
    if (!open) return undefined;
    const onClick = (e) => {
      if (wrapRef.current && !wrapRef.current.contains(e.target)) setOpen(false);
    };
    const onKey = (e) => { if (e.key === 'Escape') setOpen(false); };
    document.addEventListener('mousedown', onClick);
    document.addEventListener('keydown', onKey);
    return () => {
      document.removeEventListener('mousedown', onClick);
      document.removeEventListener('keydown', onKey);
    };
  }, [open]);

  if (orgsLoading) {
    return variant === 'sidebar'
      ? <div className="app-sidebar__org-skeleton" aria-hidden="true" />
      : null;
  }

  if (!activeOrg) {
    if (variant === 'sidebar') return null;
    return null;
  }

  const multi = organizations.length > 1;
  const initial = (activeOrg.name || 'A')[0].toUpperCase();

  const handleSelect = (org) => {
    if (org.id !== activeOrg.id) setActiveOrg(org);
    setOpen(false);
  };

  const handleSetPrimary = async (e, org) => {
    e.stopPropagation();
    if (org.is_primary) return;
    setBusyId(org.id);
    try { await setPrimaryOrganization(org.id); }
    catch (err) { console.error('Failed to set primary org:', err); }
    finally { setBusyId(null); }
  };

  if (variant === 'header') {
    return (
      <div className="app-orgswitcher app-orgswitcher--header" ref={wrapRef}>
        <button
          type="button"
          className="app-orgswitcher__pill"
          onClick={() => multi && setOpen((v) => !v)}
          aria-haspopup={multi ? 'menu' : undefined}
          aria-expanded={multi ? open : undefined}
          disabled={!multi}
        >
          {activeOrg.is_primary && <StarIcon filled size={11} />}
          <span className="app-orgswitcher__pill-name">{activeOrg.name}</span>
          {multi && <ChevronDown size={12} />}
        </button>
        {open && multi && <Popover orgs={organizations} activeOrg={activeOrg} busyId={busyId} onSelect={handleSelect} onSetPrimary={handleSetPrimary} t={t} placement="header" />}
      </div>
    );
  }

  return (
    <div className="app-orgswitcher app-orgswitcher--sidebar" ref={wrapRef}>
      <button
        type="button"
        className="app-orgswitcher__trigger"
        onClick={() => multi && setOpen((v) => !v)}
        aria-haspopup={multi ? 'menu' : undefined}
        aria-expanded={multi ? open : undefined}
        disabled={!multi}
      >
        <div className="app-sidebar__org-avatar" aria-hidden="true">{initial}</div>
        <div className="app-sidebar__org-meta">
          <div className="app-sidebar__org-name" title={activeOrg.name}>
            {activeOrg.is_primary && <span className="app-sidebar__org-star" aria-hidden="true">★</span>}
            {activeOrg.name}
          </div>
          <div className="app-sidebar__org-type">
            {activeOrg.type || ''}
            {multi && ` · ${organizations.length}`}
          </div>
        </div>
        {multi && <ChevronDown size={14} />}
      </button>
      {open && multi && <Popover orgs={organizations} activeOrg={activeOrg} busyId={busyId} onSelect={handleSelect} onSetPrimary={handleSetPrimary} t={t} placement="sidebar" />}
    </div>
  );
}

function Popover({ orgs, activeOrg, busyId, onSelect, onSetPrimary, t, placement }) {
  return (
    <div className={`app-orgswitcher__popover app-orgswitcher__popover--${placement}`} role="menu">
      {orgs.map((org) => {
        const isActive = org.id === activeOrg.id;
        const isPrimary = !!org.is_primary;
        const isBusy = busyId === org.id;
        return (
          <div
            key={org.id}
            className={`app-orgswitcher__row${isActive ? ' app-orgswitcher__row--active' : ''}`}
          >
            <button
              type="button"
              role="menuitem"
              className="app-orgswitcher__item"
              onClick={() => onSelect(org)}
            >
              <div className="app-orgswitcher__item-main">
                <div className="app-orgswitcher__item-name">
                  {isPrimary && <StarIcon filled size={11} />}
                  <span>{org.name}</span>
                </div>
                <div className="app-orgswitcher__item-meta">
                  {org.type ? `${org.type}` : ''}
                  {org.role ? ` · ${org.role}` : ''}
                </div>
              </div>
              {isActive && (
                <span className="app-orgswitcher__item-check" aria-hidden="true">
                  <CheckIcon size={14} />
                </span>
              )}
            </button>
            {!isPrimary && (
              <button
                type="button"
                className="app-orgswitcher__star-btn"
                onClick={(e) => onSetPrimary(e, org)}
                disabled={isBusy}
                title={t('academy.setAsPrimary', 'Set as primary')}
                aria-label={t('academy.setAsPrimary', 'Set as primary')}
              >
                <StarIcon size={13} />
              </button>
            )}
          </div>
        );
      })}
    </div>
  );
}
