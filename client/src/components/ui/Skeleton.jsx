import React from 'react';

/**
 * Skeleton loading placeholder component
 * Displays a pulsing placeholder while content loads
 * Respects prefers-reduced-motion automatically via CSS
 */
const Skeleton = ({
  width = '100%',
  height = 20,
  borderRadius = 8,
  style = {},
}) => (
  <div
    className="skeleton-pulse"
    style={{
      width,
      height,
      borderRadius,
      background: 'rgba(255, 255, 255, 0.06)',
      ...style,
    }}
  />
);

/**
 * Skeleton card for KPI-style loading states
 */
export const SkeletonCard = ({ style = {} }) => (
  <div
    style={{
      background: 'rgba(15, 23, 42, 0.6)',
      border: '1px solid rgba(255, 255, 255, 0.08)',
      borderRadius: 12,
      padding: '16px 18px',
      ...style,
    }}
  >
    <Skeleton width={60} height={28} borderRadius={6} style={{ marginBottom: 8 }} />
    <Skeleton width={100} height={12} borderRadius={4} />
  </div>
);

/**
 * Skeleton row for table/list loading states
 */
export const SkeletonRow = ({ style = {} }) => (
  <div
    style={{
      display: 'flex',
      alignItems: 'center',
      gap: 12,
      padding: '14px 16px',
      background: 'rgba(15, 23, 42, 0.6)',
      border: '1px solid rgba(255, 255, 255, 0.08)',
      borderRadius: 12,
      marginBottom: 8,
      ...style,
    }}
  >
    <Skeleton width={40} height={40} borderRadius="50%" />
    <div style={{ flex: 1 }}>
      <Skeleton width="60%" height={14} borderRadius={4} style={{ marginBottom: 6 }} />
      <Skeleton width="40%" height={10} borderRadius={4} />
    </div>
    <Skeleton width={50} height={24} borderRadius={6} />
  </div>
);

/**
 * Skeleton chart placeholder
 */
export const SkeletonChart = ({ style = {} }) => (
  <div
    style={{
      background: 'rgba(15, 23, 42, 0.6)',
      border: '1px solid rgba(255, 255, 255, 0.08)',
      borderRadius: 14,
      padding: '20px 16px 12px',
      ...style,
    }}
  >
    <Skeleton width={140} height={14} borderRadius={4} style={{ marginBottom: 16 }} />
    <Skeleton width="100%" height={200} borderRadius={8} />
  </div>
);

export default Skeleton;
