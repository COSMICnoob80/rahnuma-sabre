export type ProviderId = 'openrouter' | 'gemini' | 'groq';

export interface ProviderConfig {
  id: ProviderId;
  label: string;
  signupNote: string;
  defaultModel: string;
  models: { label: string; value: string }[];
}

// Model ids are kept to ones a live call has answered for, or that the founder
// pinned. Retired ids cost a round trip and a 404 on every fall-through.
export const PROVIDERS: ProviderConfig[] = [
  {
    id: 'gemini',
    label: 'Google Gemini',
    signupNote: 'Free tier — get a key at aistudio.google.com',
    defaultModel: 'gemini-3.8-flash',
    models: [
      { label: 'Gemini 3.8 Flash', value: 'gemini-3.8-flash' },
      { label: 'Gemini 3.5 Flash', value: 'gemini-3.5-flash' },
      { label: 'Gemini 3.1 Flash Lite (fastest)', value: 'gemini-3.1-flash-lite' },
    ],
  },
  {
    id: 'groq',
    label: 'Groq',
    signupNote: 'Free tier — get a key at console.groq.com',
    defaultModel: 'llama-3.3-70b-versatile',
    models: [
      { label: 'Llama 3.3 70B (free tier)', value: 'llama-3.3-70b-versatile' },
      { label: 'Llama 3.1 8B (free tier, fastest)', value: 'llama-3.1-8b-instant' },
    ],
  },
  {
    id: 'openrouter',
    label: 'OpenRouter',
    signupNote: 'Paid, pay-as-you-go — openrouter.ai/keys. Best quality.',
    defaultModel: 'deepseek/deepseek-v4-flash',
    models: [
      { label: 'DeepSeek V4 Flash', value: 'deepseek/deepseek-v4-flash' },
      { label: 'DeepSeek V4 (free)', value: 'deepseek/deepseek-chat-v3:free' },
      { label: 'Kimi K2 (fallback)', value: 'moonshotai/kimi-k2' },
      { label: 'GLM (fallback)', value: 'z-ai/glm-4.6' },
    ],
  },
];

const STORAGE_KEYS: Record<ProviderId, { key: string; model: string }> = {
  openrouter: { key: 'openrouter_api_key', model: 'openrouter_model' },
  gemini: { key: 'gemini_api_key', model: 'gemini_model' },
  groq: { key: 'groq_api_key', model: 'groq_model' },
};

export function providerById(id: ProviderId): ProviderConfig {
  const found = PROVIDERS.find((p) => p.id === id);
  if (!found) throw new Error(`Unknown provider: ${id}`);
  return found;
}

export interface ConfiguredProvider {
  id: ProviderId;
  key: string;
  model: string;
}

// Pasted keys keep the order they were configured in; a build's own embedded
// key is the last resort and never displaces a key the user supplied.
export function withEmbeddedFallback(
  configured: ConfiguredProvider[],
  embedded: ConfiguredProvider[]
): ConfiguredProvider[] {
  const merged = [...configured];
  const seen = new Set(configured.map((provider) => provider.id));
  for (const entry of embedded) {
    if (!entry.key || seen.has(entry.id)) continue;
    seen.add(entry.id);
    merged.push(entry);
  }
  return merged;
}
