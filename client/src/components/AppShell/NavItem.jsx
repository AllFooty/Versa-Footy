import React from 'react';
import { Link, useLocation } from 'wouter';
import { useTranslation } from 'react-i18next';

export default function NavItem({ item, onNavigate }) {
  const { t } = useTranslation();
  const [location] = useLocation();

  const Icon = item.icon;
  const active = item.exact
    ? location === item.href
    : location === item.href || location.startsWith(`${item.href}/`);

  return (
    <Link href={item.href}>
      <a
        className={`app-nav-item${active ? ' app-nav-item--active' : ''}`}
        onClick={onNavigate}
      >
        <span className="app-nav-item__icon" aria-hidden="true">
          {Icon && <Icon />}
        </span>
        <span className="app-nav-item__label">{t(item.labelKey)}</span>
      </a>
    </Link>
  );
}
