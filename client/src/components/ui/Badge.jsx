import React from 'react';

/**
 * Badge component for displaying labels and counts
 */
export const Badge = ({ children, color, style = {} }) => {
  const badgeStyle = color
    ? {
        background: `${color}20`,
        color: color,
        ...style,
      }
    : style;

  return (
    <span className="badge" style={badgeStyle}>
      {children}
    </span>
  );
};

/**
 * Age group badge with green styling
 */
export const AgeBadge = ({ age }) => (
  <span className="badge age-badge">{age}</span>
);

/**
 * Skill count badge with purple styling
 * Shows shorter text on mobile
 */
export const SkillCountBadge = ({ count }) => {
  // Detect if mobile for shorter label
  const isMobile = typeof window !== 'undefined' && window.innerWidth <= 768;
  
  return (
    <Badge
      style={{
        background: 'rgba(139, 92, 246, 0.15)',
        color: '#8b5cf6',
      }}
    >
      <span className="skill-count-full">{count} {count === 1 ? 'exercise' : 'exercises'}</span>
      <span className="skill-count-short">{count}</span>
    </Badge>
  );
};

export default Badge;
