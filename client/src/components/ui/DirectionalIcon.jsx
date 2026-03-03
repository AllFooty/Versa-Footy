import React from 'react';
import { useLanguage } from '../../lib/LanguageContext';

/**
 * Wrapper that flips directional icons (arrows, chevrons) in RTL mode.
 * Usage: <DirectionalIcon icon={ChevronRight} size={16} />
 */
export default function DirectionalIcon({ icon: Icon, flip = true, style, ...props }) {
  const { isRTL } = useLanguage();
  const shouldFlip = flip && isRTL;

  return (
    <Icon
      {...props}
      style={{
        ...style,
        transform: shouldFlip ? 'scaleX(-1)' : undefined,
      }}
    />
  );
}
