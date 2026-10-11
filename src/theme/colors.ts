/**
 * Rahnuma Sabre — Brand Palette
 *
 * Single source of truth for all colors. Screens must NOT hardcode hex values;
 * import from here so a rebrand is a one-file change.
 */

export const colors = {
  // Surfaces
  background: '#0a1628', // deep navy — app background
  surface: '#1e293b', // card / elevated surface
  surfaceAlt: '#0f172a', // tab bar, header
  border: '#334155', // hairline borders, input backgrounds

  // Text
  textPrimary: '#e2e8f0', // high-emphasis text
  textSecondary: '#94a3b8', // captions, labels
  textMuted: '#64748b', // placeholders, hints

  // Brand / Accent
  accent: '#3b82f6', // primary action, links, active states
  onAccent: '#ffffff', // text on accent

  // Semantic
  success: '#22c55e', // gains, positive
  danger: '#ef4444', // losses, destructive
  warning: '#f59e0b', // stale data, caution

  // Misc
  white: '#f8fafc',
} as const;

export type ColorKey = keyof typeof colors;
