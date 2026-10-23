/**
 * Rahnuma Sabre — Brand Palette
 *
 * Single source of truth for all colors. Screens must NOT hardcode hex values;
 * import from here so a rebrand is a one-file change.
 *
 * Values are the oklch tokens extracted from the October design artifacts
 * (design/panic-briefing.html, design/outlook-briefing.html,
 * design/mockup-dashboard.html) and converted to sRGB. Accent is emerald;
 * red is reserved for negative values and alerts.
 */

export const colors = {
  // Surfaces (--bg, --surface, --surface-2, --chip-sunk, contract bar)
  background: '#05090d',
  surface: '#0e1319',
  surfaceAlt: '#080d12',
  surfaceRaised: '#161d24',
  surfaceSunken: '#0a0f14',
  border: '#21272e',
  borderStrong: '#303942',

  // Text (--fg, --muted, --faint)
  textPrimary: '#e7ecf0',
  textSecondary: '#838d98',
  textMuted: '#575e66',

  // Brand / Accent — emerald
  accent: '#3add9e',
  accentTint: '#001e10',
  accentSoft: '#3add9e24',
  accentBorder: '#005f3a',
  onAccent: '#010804',

  // Semantic
  success: '#3add9e',
  danger: '#ff696d',
  dangerSurface: '#280e0e',
  dangerBorder: '#742d2e',
  dangerInk: '#fceae7',
  warning: '#ddb049',
  warningTint: '#251800',
  info: '#67aaed',
  infoTint: '#03172c',

  // Misc
  white: '#e7ecf0',
} as const;

export type ColorKey = keyof typeof colors;
