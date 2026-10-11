/**
 * Rahnuma Sabre — Spacing Scale
 *
 * 4pt grid. Use these tokens instead of magic numbers so padding/margins
 * stay consistent across screens.
 */

export const spacing = {
  xs: 4,
  sm: 8,
  md: 12,
  lg: 16,
  xl: 20,
  xxl: 24,
} as const;

export const radius = {
  sm: 8,
  md: 10,
  lg: 16,
  full: 9999,
} as const;

export type SpacingKey = keyof typeof spacing;
export type RadiusKey = keyof typeof radius;
