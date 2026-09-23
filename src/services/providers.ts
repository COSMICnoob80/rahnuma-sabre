export type ProviderId = 'openrouter' | 'gemini' | 'groq';

export interface ProviderConfig {
  id: ProviderId;
  label: string;
  signupNote: string;
  defaultModel: string;
  models: { label: string; value: string }[];
}

export const PROVIDERS: ProviderConfig[] = [
  {
    id: 'gemini',
    label: 'Google Gemini',
    signupNote: 'Free tier — get a key at aistudio.google.com',
    defaultModel: 'gemini-2.5-flash',
    models: [
      { label: 'Gemini 2.5 Flash (free tier)', value: 'gemini-2.5-flash' },
      { label: 'Gemini 2.5 Flash Lite (free tier)', value: 'gemini-2.5-flash-lite' },
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
