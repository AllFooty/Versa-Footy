import React, { useState } from 'react';

const products = [
  { name: 'VERSA Footy', url: 'https://versafooty.com', accentColor: '#22c55e', isActive: true },
  { name: 'FAIR Footy', url: 'https://fairfooty.com', accentColor: '#ec4899' },
  { name: 'TRACK Footy', url: 'https://trackfooty.com', accentColor: '#f97316' },
  { name: 'KAAS Footy', url: 'https://kaasfooty.com', accentColor: '#22d3ee' },
  { name: 'JUGGLE Footy', url: 'https://jugglefooty.com', accentColor: '#3b82f6' },
];

export default function All4FootyFamilyBar() {
  const [isExpanded, setIsExpanded] = useState(false);

  return (
    <div className="all4footy-family-bar">
      <div className="family-bar-container">
        <a
          href="https://all4footy.com"
          target="_blank"
          rel="noopener noreferrer"
          className="family-brand"
          title="Visit All4Footy"
        >
          <svg
            className="family-logo"
            viewBox="0 0 24 24"
            fill="none"
            xmlns="http://www.w3.org/2000/svg"
          >
            <circle cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="1.5" />
            <path d="M12 6v6l4 2" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" />
          </svg>
          <span className="family-brand-text">All4Footy</span>
          <span className="family-tagline">Family</span>
        </a>

        <div className="family-products-desktop">
          {products.map((product) => (
            <a
              key={product.name}
              href={product.url}
              target={product.isActive ? '_self' : '_blank'}
              rel="noopener noreferrer"
              className={`family-product-link ${product.isActive ? 'active' : ''}`}
              style={{ '--product-color': product.accentColor }}
              title={`Visit ${product.name}`}
            >
              <span className="product-indicator" />
              {product.name}
            </a>
          ))}
        </div>

        <button
          className="family-mobile-toggle"
          onClick={() => setIsExpanded(!isExpanded)}
          aria-label="Toggle product navigation"
        >
          <span>Our Products</span>
          <svg
            className={`toggle-icon ${isExpanded ? 'expanded' : ''}`}
            viewBox="0 0 24 24"
            fill="none"
          >
            <path d="M6 9l6 6 6-6" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
          </svg>
        </button>
      </div>

      {isExpanded && (
        <div className="family-products-mobile">
          {products.map((product) => (
            <a
              key={product.name}
              href={product.url}
              target={product.isActive ? '_self' : '_blank'}
              rel="noopener noreferrer"
              className={`family-product-link-mobile ${product.isActive ? 'active' : ''}`}
              style={{ '--product-color': product.accentColor }}
            >
              <span className="product-indicator" />
              {product.name}
            </a>
          ))}
        </div>
      )}

      <style jsx="true">{`
        .all4footy-family-bar {
          background: linear-gradient(135deg, #0f172a 0%, #1e293b 100%);
          border-bottom: 1px solid rgba(99, 102, 241, 0.3);
          font-size: 13px;
        }
        .family-bar-container {
          max-width: 1400px;
          margin: 0 auto;
          padding: 0.5rem 1rem;
          display: flex;
          align-items: center;
          justify-content: space-between;
        }
        .family-brand {
          display: flex;
          align-items: center;
          gap: 0.5rem;
          text-decoration: none;
          transition: opacity 0.2s;
          color: inherit;
        }
        .family-brand:hover {
          opacity: 0.9;
        }
        .family-logo {
          width: 18px;
          height: 18px;
          color: #6366f1;
        }
        .family-brand-text {
          font-weight: 700;
          background: linear-gradient(135deg, #6366f1 0%, #22d3ee 100%);
          -webkit-background-clip: text;
          -webkit-text-fill-color: transparent;
          background-clip: text;
        }
        .family-tagline {
          color: #64748b;
          font-size: 11px;
          padding-left: 0.25rem;
          border-left: 1px solid #334155;
          margin-left: 0.25rem;
        }
        .family-products-desktop {
          display: none;
          align-items: center;
          gap: 1.5rem;
        }
        @media (min-width: 768px) {
          .family-products-desktop {
            display: flex;
          }
          .family-mobile-toggle {
            display: none !important;
          }
        }
        .family-product-link {
          display: flex;
          align-items: center;
          gap: 0.375rem;
          color: #94a3b8;
          text-decoration: none;
          font-size: 12px;
          font-weight: 500;
          transition: color 0.2s;
          position: relative;
        }
        .family-product-link:hover {
          color: var(--product-color);
        }
        .family-product-link.active {
          color: #e2e8f0;
        }
        .family-product-link.active::after {
          content: '';
          position: absolute;
          bottom: -8px;
          left: 0;
          right: 0;
          height: 2px;
          background: var(--product-color);
          border-radius: 2px;
        }
        .product-indicator {
          width: 6px;
          height: 6px;
          border-radius: 50%;
          background: var(--product-color);
          opacity: 0.7;
        }
        .family-product-link:hover .product-indicator,
        .family-product-link.active .product-indicator {
          opacity: 1;
        }
        .family-mobile-toggle {
          display: flex;
          align-items: center;
          gap: 0.375rem;
          background: rgba(99, 102, 241, 0.1);
          border: 1px solid rgba(99, 102, 241, 0.2);
          border-radius: 6px;
          padding: 0.375rem 0.75rem;
          color: #94a3b8;
          font-size: 12px;
          cursor: pointer;
          transition: all 0.2s;
        }
        .family-mobile-toggle:hover {
          background: rgba(99, 102, 241, 0.2);
          color: #e2e8f0;
        }
        .toggle-icon {
          width: 14px;
          height: 14px;
          transition: transform 0.2s;
        }
        .toggle-icon.expanded {
          transform: rotate(180deg);
        }
        .family-products-mobile {
          display: flex;
          flex-direction: column;
          padding: 0.5rem 1rem 0.75rem;
          gap: 0.25rem;
          border-top: 1px solid rgba(51, 65, 85, 0.5);
        }
        .family-product-link-mobile {
          display: flex;
          align-items: center;
          gap: 0.5rem;
          color: #94a3b8;
          text-decoration: none;
          font-size: 13px;
          padding: 0.5rem 0.75rem;
          border-radius: 6px;
          transition: all 0.2s;
        }
        .family-product-link-mobile:hover {
          background: rgba(99, 102, 241, 0.1);
          color: var(--product-color);
        }
        .family-product-link-mobile.active {
          background: rgba(34, 197, 94, 0.1);
          color: #e2e8f0;
        }
      `}</style>
    </div>
  );
}

