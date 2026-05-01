import React from 'react';
import { Link } from 'wouter';

export default function BackLink({ href, children }) {
  return (
    <Link href={href}>
      <a className="page-backlink">
        <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
          <line x1="19" y1="12" x2="5" y2="12" />
          <polyline points="12 19 5 12 12 5" />
        </svg>
        <span>{children}</span>
      </a>
    </Link>
  );
}
