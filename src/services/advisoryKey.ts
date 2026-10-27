import type { ProviderId } from './providers';

export const EMBEDDED_KEY_CHIP_LABEL = 'personal build key active';

export function resolveEmbeddedGroqKey(
  constantsExtra?: Record<string, unknown> | null,
  envKey?: string | null
): string | null {
  const fromConfig = constantsExtra?.embeddedGroqKey;
  if (typeof fromConfig === 'string' && fromConfig.trim().length > 0) return fromConfig.trim();
  if (typeof envKey === 'string' && envKey.trim().length > 0) return envKey.trim();
  return null;
}

export function getEmbeddedGroqKey(): string | null {
  return resolveEmbeddedGroqKey(null, process.env.EXPO_PUBLIC_GROQ_API_KEY);
}

export function resolveEmbeddedGeminiKey(
  constantsExtra?: Record<string, unknown> | null,
  envKey?: string | null
): string | null {
  const fromConfig = constantsExtra?.embeddedGeminiKey;
  if (typeof fromConfig === 'string' && fromConfig.trim().length > 0) return fromConfig.trim();
  if (typeof envKey === 'string' && envKey.trim().length > 0) return envKey.trim();
  return null;
}

// The literal member expression matters: Expo inlines EXPO_PUBLIC_* at build
// time by matching it in the source, so a dynamic process.env[name] lookup
// would bundle as undefined.
export function getEmbeddedGeminiKey(): string | null {
  return resolveEmbeddedGeminiKey(null, process.env.EXPO_PUBLIC_GEMINI_API_KEY);
}

// Order in which embedded build keys join the fall-through chain, after the
// user's own pasted keys.
export const EMBEDDED_KEY_PROVIDER_IDS: ProviderId[] = ['gemini', 'groq'];

export function getEmbeddedKey(providerId: ProviderId): string | null {
  if (providerId === 'gemini') return getEmbeddedGeminiKey();
  if (providerId === 'groq') return getEmbeddedGroqKey();
  return null;
}

export function embeddedKeyChipLabel(hasEmbeddedKey: boolean): string | null {
  return hasEmbeddedKey ? EMBEDDED_KEY_CHIP_LABEL : null;
}
