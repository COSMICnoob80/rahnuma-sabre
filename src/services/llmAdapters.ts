import type { ProviderId } from './providers';

export interface ChatMessage {
  role: 'user' | 'assistant';
  content: string;
}

export interface BuiltRequest {
  url: string;
  headers: Record<string, string>;
  body: unknown;
}

const OPENAI_COMPATIBLE_ENDPOINTS: Partial<Record<ProviderId, string>> = {
  openrouter: 'https://openrouter.ai/api/v1/chat/completions',
  groq: 'https://api.groq.com/openai/v1/chat/completions',
};

export function buildRequest(
  providerId: ProviderId,
  model: string,
  apiKey: string,
  systemPrompt: string,
  messages: ChatMessage[]
): BuiltRequest {
  if (providerId === 'gemini') {
    return {
      url: `https://generativelanguage.googleapis.com/v1beta/models/${model}:generateContent?key=${apiKey}`,
      headers: { 'Content-Type': 'application/json' },
      body: {
        systemInstruction: { parts: [{ text: systemPrompt }] },
        contents: messages.map((m) => ({
          role: m.role === 'assistant' ? 'model' : 'user',
          parts: [{ text: m.content }],
        })),
        generationConfig: { maxOutputTokens: 1024, temperature: 0.4 },
      },
    };
  }

  const url = OPENAI_COMPATIBLE_ENDPOINTS[providerId];
  if (!url) throw new Error(`No endpoint configured for provider: ${providerId}`);

  const headers: Record<string, string> = {
    'Content-Type': 'application/json',
    Authorization: `Bearer ${apiKey}`,
  };
  if (providerId === 'openrouter') {
    headers['HTTP-Referer'] = 'https://rahnuma.app';
    headers['X-Title'] = 'Rahnuma SABRE';
  }

  return {
    url,
    headers,
    body: {
      model,
      messages: [{ role: 'system', content: systemPrompt }, ...messages],
      max_tokens: 1024,
      temperature: 0.4,
    },
  };
}

export function parseResponse(providerId: ProviderId, data: unknown): string | null {
  const payload = data as Record<string, any> | null;
  if (!payload) return null;

  const apiError = payload.error;
  if (apiError) {
    const message = apiError.message || String(apiError);
    throw new Error(`${providerId} error: ${message}`);
  }

  if (providerId === 'gemini') {
    const parts = payload.candidates?.[0]?.content?.parts;
    if (Array.isArray(parts)) {
      const text = parts.map((p: any) => p?.text ?? '').join('').trim();
      return text || null;
    }
    return null;
  }

  const content = payload.choices?.[0]?.message?.content;
  return typeof content === 'string' && content.trim() ? content.trim() : null;
}

// djb2 — stable, dependency-free. Non-cryptographic; this only keys a local cache.
export function cacheKey(systemPrompt: string, messages: ChatMessage[]): string {
  const input = `${systemPrompt}\u0000${messages.map((m) => `${m.role}:${m.content}`).join('\u0001')}`;
  let hash = 5381;
  for (let i = 0; i < input.length; i++) {
    hash = ((hash << 5) + hash + input.charCodeAt(i)) | 0;
  }
  return (hash >>> 0).toString(36);
}

const PROVIDER_LABELS: Record<ProviderId, string> = {
  gemini: 'Google Gemini',
  groq: 'Groq',
  openrouter: 'OpenRouter',
};

export function providerLabel(providerId: ProviderId): string {
  return PROVIDER_LABELS[providerId] ?? providerId;
}
