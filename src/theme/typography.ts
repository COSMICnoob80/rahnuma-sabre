/**
 * Rahnuma Sabre — Typography Scale
 *
 * Font sizes and weights used across the app. Screens should reference
 * these instead of inline fontSize/fontWeight pairs.
 *
 * Weight is carried by the family (Inter ships one file per weight), so a
 * token never pairs a custom fontFamily with a fontWeight — that pairing makes
 * Android look for a weighted variant of the family and fall back.
 */

import { colors } from './colors';
import { fonts } from '../utils/fonts';

export const typography = {
  // Display / hero numbers
  display: { fontSize: 36, fontFamily: fonts.bold, color: colors.textPrimary },
  // Card-level big numbers
  headline: { fontSize: 32, fontFamily: fonts.bold, color: colors.textPrimary },
  // Section titles (uppercase, letter-spaced)
  sectionTitle: {
    fontSize: 13,
    fontFamily: fonts.bold,
    color: colors.textSecondary,
    textTransform: 'uppercase' as const,
    letterSpacing: 1,
  },
  // Body text
  body: { fontSize: 15, fontFamily: fonts.regular, color: colors.textPrimary },
  bodyStrong: { fontSize: 15, fontFamily: fonts.bold, color: colors.textPrimary },
  // Captions / labels
  caption: { fontSize: 13, fontFamily: fonts.regular, color: colors.textSecondary },
  captionStrong: { fontSize: 13, fontFamily: fonts.bold, color: colors.textSecondary },
  // Small print
  small: { fontSize: 11, fontFamily: fonts.regular, color: colors.textMuted },
} as const;

export type TypographyKey = keyof typeof typography;
