import { getSetting, setSetting } from '../database/db';
import { ProviderId } from './providers';
import { getConfiguredProviders } from '../utils/secureStorage';
import {
  buildRequest,
  cacheKey,
  ChatMessage,
  parseResponse,
  providerLabel,
} from './llmAdapters';

export { ChatMessage };

const CACHE_TTL_MS = 24 * 60 * 60 * 1000;
const CACHE_PREFIX = 'llm_cache_';
const REQUEST_TIMEOUT_MS = 45_000;

export interface AskOptions {
  systemPrompt: string;
  messages: ChatMessage[];
  preferredProvider?: ProviderId;
  useCache?: boolean;
}

export interface AskResult {
  text: string;
  provider: ProviderId;
  cached: boolean;
  failedProviders: { provider: ProviderId; error: string }[];
}

export class NoProviderError extends Error {
  constructor() {
    super('No AI provider configured. Add a free key in Settings (Gemini or Groq), or an OpenRouter key.');
    this.name = 'NoProviderError';
  }
}

async function readCache(key: string): Promise<string | null> {
  try {
    const raw = await getSetting(CACHE_PREFIX + key);
    if (!raw) return null;
    const entry = JSON.parse(raw) as { t: number; text: string };
    if (Date.now() - entry.t > CACHE_TTL_MS) return null;
    return entry.text;
  } catch {
    return null;
  }
}

async function writeCache(key: string, text: string): Promise<void> {
  try {
    await setSetting(CACHE_PREFIX + key, JSON.stringify({ t: Date.now(), text }));
  } catch {
    // A cache write failure must never break a successful answer.
  }
}

async function callProvider(
  provider: ProviderId,
  model: string,
  apiKey: string,
  systemPrompt: string,
  messages: ChatMessage[]
): Promise<string> {
  const request = buildRequest(provider, model, apiKey, systemPrompt, messages);
  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), REQUEST_TIMEOUT_MS);

  try {
    const response = await fetch(request.url, {
      method: 'POST',
      headers: request.headers,
      body: JSON.stringify(request.body),
      signal: controller.signal,
    });

    const data = await response.json().catch(() => null);

    if (!response.ok) {
      const message = (data as any)?.error?.message || `HTTP ${response.status}`;
      throw new Error(message);
    }

    const text = parseResponse(provider, data);
    if (!text) throw new Error('Empty response');
    return text;
  } finally {
    clearTimeout(timer);
  }
}

// Tries the user's preferred provider first, then every other configured
// provider in preference order. Free tiers rate-limit; falling through keeps
// the advisor answering at zero cost.
export async function askAdvisor(options: AskOptions): Promise<AskResult> {
  const { systemPrompt, messages, preferredProvider, useCache = true } = options;

  if (useCache) {
    const cached = await readCache(cacheKey(systemPrompt, messages));
    if (cached) {
      return { text: cached, provider: preferredProvider ?? 'openrouter', cached: true, failedProviders: [] };
    }
  }

  const configured = await getConfiguredProviders();
  if (configured.length === 0) throw new NoProviderError();

  const ordered = preferredProvider
    ? [
        ...configured.filter((p) => p.id === preferredProvider),
        ...configured.filter((p) => p.id !== preferredProvider),
      ]
    : configured;

  const failedProviders: { provider: ProviderId; error: string }[] = [];

  for (const provider of ordered) {
    try {
      const text = await callProvider(provider.id, provider.model, provider.key, systemPrompt, messages);
      if (useCache) await writeCache(cacheKey(systemPrompt, messages), text);
      return { text, provider: provider.id, cached: false, failedProviders };
    } catch (error) {
      failedProviders.push({
        provider: provider.id,
        error: error instanceof Error ? error.message : 'Unknown error',
      });
    }
  }

  const summary = failedProviders
    .map((f) => `${providerLabel(f.provider)}: ${f.error}`)
    .join(' · ');
  throw new Error(`All AI providers failed — ${summary}`);
}

export async function hasAnyProvider(): Promise<boolean> {
  const configured = await getConfiguredProviders();
  return configured.length > 0;
}
