import { useEffect, useState } from 'react';

/**
 * Track a CSS media-query and re-render only when it crosses the threshold.
 *
 * Replaces the `window.addEventListener('resize', …)` + `setIsMobile(...)`
 * pattern that was firing on every pixel of resize and re-rendering the
 * subtree even when the breakpoint hadn't changed.
 *
 * @param {string} query — e.g. '(max-width: 768px)'
 * @returns {boolean}
 */
export default function useMediaQuery(query) {
  const [matches, setMatches] = useState(() => {
    if (typeof window === 'undefined' || !window.matchMedia) return false;
    return window.matchMedia(query).matches;
  });

  useEffect(() => {
    if (typeof window === 'undefined' || !window.matchMedia) return undefined;
    const mql = window.matchMedia(query);
    const onChange = (event) => setMatches(event.matches);
    setMatches(mql.matches);
    mql.addEventListener('change', onChange);
    return () => mql.removeEventListener('change', onChange);
  }, [query]);

  return matches;
}

/** Convenience: true on mobile-sized viewports (≤ 768px). */
export const useIsMobile = () => useMediaQuery('(max-width: 768px)');
