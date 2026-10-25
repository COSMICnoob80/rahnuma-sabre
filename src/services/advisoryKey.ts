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

export function embeddedKeyChipLabel(hasEmbeddedKey: boolean): string | null {
  return hasEmbeddedKey ? EMBEDDED_KEY_CHIP_LABEL : null;
}
