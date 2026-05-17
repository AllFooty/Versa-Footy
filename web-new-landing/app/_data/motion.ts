/**
 * Versa Footy — motion tokens for JS-driven animation.
 *
 * Mirrors the CSS custom properties in app/globals.css:
 *   --ease-versa  → EASE_VERSA   (signature cinematic ease, the brand fingerprint)
 *   --ease-quick  → EASE_QUICK   (UI feedback — taps, toggles, focus)
 *   --ease-spring → EASE_SPRING  (celebration overshoot — level-up, mastery earned)
 *
 * If the brand fingerprint changes, update it here AND in globals.css.
 */
export const EASE_VERSA = [0.22, 1, 0.36, 1] as const;
export const EASE_QUICK = [0.4, 0, 0.2, 1] as const;
export const EASE_SPRING = [0.34, 1.56, 0.64, 1] as const;
