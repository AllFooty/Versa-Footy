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
 */
export const SkillCountBadge = ({ count }) => (
  <Badge
    style={{
      background: 'rgba(139, 92, 246, 0.15)',
      color: '#8b5cf6',
    }}
  >
    {count} {count === 1 ? 'exercise' : 'exercises'}
  </Badge>
);

export default Badge;
