/**
 * Rahnuma Sabre — Inter typeface
 *
 * Inter is the app-wide face. Only the two weights the theme uses are loaded so
 * the bundle stays small; styles reference the exported token strings, and the
 * family name is the same string the font map is keyed by.
 */

import { useFonts, Inter_400Regular, Inter_700Bold } from '@expo-google-fonts/inter';

export const fonts = {
  regular: 'Inter_400Regular',
  bold: 'Inter_700Bold',
} as const;

/**
 * Loads Inter once at boot. Returns true when the fonts are ready — or when
 * loading failed, so a bad font never locks the user out of their own ledger.
 */
export function useAppFonts(): boolean {
  const [loaded, error] = useFonts({ Inter_400Regular, Inter_700Bold });
  return loaded || !!error;
}
