import { getSetting, setSetting } from '../database/db';
import { orderProviders, ProviderId } from './providers';
import { getConfiguredProviders } from '../utils/secureStorage';
import { buildRequest, cacheKey, ChatMessage, parseResponse } from './llmAdapters';
import {
  COUNCIL_CHECK_PROMPT,
  COUNCIL_CHECK_SYSTEM_PROMPT,
  CouncilCheckResult,
  CouncilLadderResult,
  LadderAttemptFailure,
  LlmHttpError,
  runCouncilCheck,
  runCouncilLadder,
} from './councilLadder';

export { ChatMessage };

const CACHE_TTL_MS = 24 * 60 * 60 * 1000;
const CACHE_PREFIX = 'llm_cache_';
const REQUEST_TIMEOUT_MS = 45_000;

export interface AskOptions {
  systemPrompt: string;
  messages: ChatMessage[];
  preferredProvider?: ProviderId;
  useCache?: boolean;
  // Per-call ceiling for one provider attempt. A provider that accepts the
  // connection and then stalls would otherwise hold the whole chain.
  timeoutMs?: number;
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

// The ONLY failure text that reaches the user when every provider is down.
// Per-provider 429/500/503 chatter stays on the error object for diagnostics.
export const COUNCIL_BUSY_MESSAGE = 'Council busy — retry shortly';

export class AllProvidersFailedError extends Error {
  readonly failedProviders: { provider: ProviderId; error: string }[];

  constructor(failedProviders: { provider: ProviderId; error: string }[]) {
    super(COUNCIL_BUSY_MESSAGE);
    this.name = 'AllProvidersFailedError';
    this.failedProviders = failedProviders;
  }
}

interface CacheEntry {
  t: number;
  text: string;
  provider: ProviderId;
}

async function readCache(key: string): Promise<CacheEntry | null> {
  try {
    const raw = await getSetting(CACHE_PREFIX + key);
    if (!raw) return null;
    const entry = JSON.parse(raw) as Partial<CacheEntry>;
    if (typeof entry.text !== 'string' || typeof entry.t !== 'number') return null;
    if (Date.now() - entry.t > CACHE_TTL_MS) return null;
    return { t: entry.t, text: entry.text, provider: entry.provider ?? 'openrouter' };
  } catch {
    return null;
  }
}

async function writeCache(key: string, text: string, provider: ProviderId): Promise<void> {
  try {
    const entry: CacheEntry = { t: Date.now(), text, provider };
    await setSetting(CACHE_PREFIX + key, JSON.stringify(entry));
  } catch {
    // A cache write failure must never break a successful answer.
  }
}

async function callProvider(
  provider: ProviderId,
  model: string,
  apiKey: string,
  systemPrompt: string,
  messages: ChatMessage[],
  timeoutMs: number = REQUEST_TIMEOUT_MS
): Promise<string> {
  const request = buildRequest(provider, model, apiKey, systemPrompt, messages);
  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), timeoutMs);

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
      // The status is what lets the ladder tell "this model is gone" (404, try
      // the next model) from "this lane is throttled" (429/5xx, next provider).
      throw new LlmHttpError(provider, response.status, message);
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
      return { text: cached.text, provider: cached.provider, cached: true, failedProviders: [] };
    }
  }

  const configured = await getConfiguredProviders();
  if (configured.length === 0) throw new NoProviderError();

  // Groq first, Gemini second, OpenRouter last; capped at three providers.
  const ordered = orderProviders(configured, preferredProvider);

  const ladder: CouncilLadderResult = await runCouncilLadder({
    providers: ordered,
    attempt: (provider, model) =>
      callProvider(
        provider.id,
        model,
        provider.key,
        systemPrompt,
        messages,
        options.timeoutMs
      ),
  });

  if (ladder.ok) {
    if (useCache) {
      await writeCache(cacheKey(systemPrompt, messages), ladder.text, ladder.provider);
    }
    return {
      text: ladder.text,
      provider: ladder.provider,
      cached: false,
      failedProviders: uniqueFailures(ladder.failures),
    };
  }

  throw new AllProvidersFailedError(uniqueFailures(ladder.failures));
}

// One row per provider even when several of its models failed; the first error
// text is kept for diagnostics.
function uniqueFailures(
  failures: LadderAttemptFailure[]
): { provider: ProviderId; error: string }[] {
  const seen = new Set<ProviderId>();
  const rows: { provider: ProviderId; error: string }[] = [];
  for (const failure of failures) {
    if (seen.has(failure.provider)) continue;
    seen.add(failure.provider);
    rows.push({ provider: failure.provider, error: failure.error });
  }
  return rows;
}

// Phone-side diagnostic: one tiny prompt through every configured provider, so
// the founder can see which lane is failing on his own network. It uses the
// same per-provider model ladder, bounded to 15 seconds total, and returns only
// closed-vocabulary chips — never raw provider text or quotation content.
export async function runCouncilSelfTest(): Promise<CouncilCheckResult> {
  const configured = await getConfiguredProviders();
  if (configured.length === 0) return { ok: false, statuses: [] };

  return runCouncilCheck({
    providers: orderProviders(configured),
    attempt: (provider, model, timeoutMs) =>
      callProvider(
        provider.id,
        model,
        provider.key,
        COUNCIL_CHECK_SYSTEM_PROMPT,
        [{ role: 'user', content: COUNCIL_CHECK_PROMPT }],
        timeoutMs
      ),
  });
}

export async function hasAnyProvider(): Promise<boolean> {
  const configured = await getConfiguredProviders();
  return configured.length > 0;
}
