/**
 * Rahnuma Sabre — Typography Scale
 *
 * Font sizes and weights used across the app. Screens should reference
 * these instead of inline fontSize/fontWeight pairs.
 */

import { colors } from './colors';

export const typography = {
  // Display / hero numbers
  display: { fontSize: 36, fontWeight: '700' as const, color: colors.textPrimary },
  // Card-level big numbers
  headline: { fontSize: 32, fontWeight: '700' as const, color: colors.textPrimary },
  // Section titles (uppercase, letter-spaced)
  sectionTitle: {
    fontSize: 13,
    fontWeight: '600' as const,
    color: colors.textSecondary,
    textTransform: 'uppercase' as const,
    letterSpacing: 1,
  },
  // Body text
  body: { fontSize: 15, fontWeight: '400' as const, color: colors.textPrimary },
  bodyStrong: { fontSize: 15, fontWeight: '600' as const, color: colors.textPrimary },
  // Captions / labels
  caption: { fontSize: 13, fontWeight: '400' as const, color: colors.textSecondary },
  captionStrong: { fontSize: 13, fontWeight: '600' as const, color: colors.textSecondary },
  // Small print
  small: { fontSize: 11, fontWeight: '400' as const, color: colors.textMuted },
} as const;

export type TypographyKey = keyof typeof typography;
