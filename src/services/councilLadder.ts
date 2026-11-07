/**
 * Council ladder — provider fall-through plus per-provider model fallback.
 *
 * Two failure classes drive the walk:
 *   - model_not_found / 404-model  → the NEXT MODEL in the same provider
 *   - 429 / 5xx / blocked / network → the NEXT PROVIDER
 *
 * A lap through one provider is capped at MAX_MODEL_RETRIES_PER_LAP retries, so
 * a bad model can never eat the whole budget twice. The first (provider, model)
 * that answers is remembered for the session (in memory only — never persisted)
 * and tried first on the next call; one failure clears it and the ladder resumes
 * its normal order.
 */

import { MAX_PROVIDER_ATTEMPTS, modelCandidatesFor } from './providers.ts';
import type { ConfiguredProvider, ProviderId } from './providers.ts';

// Per-provider model retries after the first attempt. The Gemini ladder carries
// three ids, so 2 retries is exactly enough to reach its last rung.
export const MAX_MODEL_RETRIES_PER_LAP = 2;

export const MAX_MODEL_ATTEMPTS_PER_LAP = MAX_MODEL_RETRIES_PER_LAP + 1;

export type LadderFailureKind = 'model_not_found' | 'provider_down';

export type CheckFailureReason =
  | '429 rate'
  | 'server error'
  | 'model missing'
  | 'blocked'
  | 'fetch failed'
  | 'timeout'
  | 'failed';

export class LlmHttpError extends Error {
  readonly provider: ProviderId;
  readonly status: number;

  constructor(provider: ProviderId, status: number, message: string) {
    super(message);
    this.name = 'LlmHttpError';
    this.provider = provider;
    this.status = status;
  }
}

function messageOf(error: unknown): string {
  if (error instanceof Error) return error.message;
  if (typeof error === 'string') return error;
  return '';
}

function statusOf(error: unknown): number | null {
  const status = (error as { status?: unknown } | null)?.status;
  return typeof status === 'number' ? status : null;
}

const MODEL_MISSING_PATTERN =
  /model[_\s-]*not[_\s-]*found|model[^\n]{0,80}not found|unknown model|invalid model|model[^\n]{0,80}(does not exist|no longer (supported|available))|decommissioned/i;

const BLOCKED_PATTERN = /cloudflare|\b1010\b|access (?:denied|blocked)|request blocked|challenge/i;

const NETWORK_PATTERN = /fetch failed|network request failed|network error|econn|enotfound|getaddrinfo|dns/i;

const TIMEOUT_PATTERN = /abort|timed out|timeout/i;

// Only two outcomes matter to the ladder: retry a different model, or leave the
// provider. Anything ambiguous fails safe by leaving the provider.
export function classifyLlmFailure(error: unknown): LadderFailureKind {
  const status = statusOf(error);
  const message = messageOf(error);

  if (status === 404) return 'model_not_found';
  if (MODEL_MISSING_PATTERN.test(message)) return 'model_not_found';

  return 'provider_down';
}

// Closed vocabulary for the Settings self-test chip. Raw provider text never
// leaves this function — a 429 with a JSON dump still renders as "429 rate".
export function failureChipReason(error: unknown): CheckFailureReason {
  const status = statusOf(error);
  const message = messageOf(error);
  const name = (error as { name?: unknown } | null)?.name;

  if (status === 429) return '429 rate';
  if (name === 'AbortError' || TIMEOUT_PATTERN.test(message)) return 'timeout';
  if (status !== null && status >= 500) return 'server error';
  if (status === 403 && BLOCKED_PATTERN.test(message)) return 'blocked';
  if (BLOCKED_PATTERN.test(message)) return 'blocked';
  if (classifyLlmFailure(error) === 'model_not_found') return 'model missing';
  if (NETWORK_PATTERN.test(message)) return 'fetch failed';
  return 'failed';
}

export interface LastGoodModel {
  provider: ProviderId;
  model: string;
}

// Session-scoped, deliberately not persisted: a new app launch re-probes the
// ladder instead of trusting a model that may have been retired overnight.
export interface LadderMemory {
  lastGood: LastGoodModel | null;
}

export const councilLadderMemory: LadderMemory = { lastGood: null };

export function resetCouncilLadderMemory(memory: LadderMemory = councilLadderMemory): void {
  memory.lastGood = null;
}

export function lastGoodModel(memory: LadderMemory = councilLadderMemory): LastGoodModel | null {
  return memory.lastGood;
}

export interface LadderAttemptFailure {
  provider: ProviderId;
  model: string;
  kind: LadderFailureKind;
  error: string;
}

export type CouncilLadderResult =
  | {
      ok: true;
      text: string;
      provider: ProviderId;
      model: string;
      failures: LadderAttemptFailure[];
    }
  | { ok: false; failures: LadderAttemptFailure[] };

export interface CouncilLadderOptions {
  providers: ConfiguredProvider[];
  attempt: (provider: ConfiguredProvider, model: string) => Promise<string>;
  memory?: LadderMemory;
}

function orderWithLastGood(
  providers: ConfiguredProvider[],
  lastGood: LastGoodModel | null
): ConfiguredProvider[] {
  const ordered = [...providers];
  if (!lastGood) return ordered.slice(0, MAX_PROVIDER_ATTEMPTS);
  const index = ordered.findIndex((provider) => provider.id === lastGood.provider);
  if (index < 0) return ordered.slice(0, MAX_PROVIDER_ATTEMPTS);
  const [remembered] = ordered.splice(index, 1);
  return [remembered, ...ordered].slice(0, MAX_PROVIDER_ATTEMPTS);
}

export async function runCouncilLadder(
  options: CouncilLadderOptions
): Promise<CouncilLadderResult> {
  const memory = options.memory ?? councilLadderMemory;
  const providers = orderWithLastGood(options.providers, memory.lastGood);
  const failures: LadderAttemptFailure[] = [];

  for (const provider of providers) {
    const preferredModel =
      memory.lastGood?.provider === provider.id ? memory.lastGood.model : provider.model;
    const candidates = modelCandidatesFor(provider.id, preferredModel);

    for (let index = 0; index < candidates.length; index += 1) {
      if (index >= MAX_MODEL_ATTEMPTS_PER_LAP) break;
      const model = candidates[index];

      try {
        const text = await options.attempt(provider, model);
        memory.lastGood = { provider: provider.id, model };
        return { ok: true, text, provider: provider.id, model, failures };
      } catch (error) {
        const kind = classifyLlmFailure(error);
        failures.push({ provider: provider.id, model, kind, error: messageOf(error) });

        if (memory.lastGood?.provider === provider.id && memory.lastGood.model === model) {
          memory.lastGood = null;
        }

        if (kind === 'model_not_found') continue;
        break;
      }
    }
  }

  return { ok: false, failures };
}

export const COUNCIL_CHECK_TOTAL_TIMEOUT_MS = 15_000;
export const COUNCIL_CHECK_PROMPT = 'Reply OK';
export const COUNCIL_CHECK_SYSTEM_PROMPT =
  'You are a connectivity check. Reply with the single word OK.';

const CHIP_LABELS: Record<ProviderId, string> = {
  groq: 'Groq',
  gemini: 'Gemini',
  openrouter: 'OpenRouter',
};

export interface CouncilCheckStatus {
  provider: ProviderId;
  label: string;
  ok: boolean;
  ms: number;
  reason: CheckFailureReason | null;
  chip: string;
}

export interface CouncilCheckResult {
  ok: boolean;
  statuses: CouncilCheckStatus[];
}

export function formatCheckChip(
  provider: ProviderId,
  ok: boolean,
  ms: number,
  reason: CheckFailureReason | null
): string {
  const label = CHIP_LABELS[provider] ?? provider;
  if (ok) return `${label} ✓ ${(Math.max(0, ms) / 1000).toFixed(1)}s`;
  return `${label} ✗ ${reason ?? 'failed'}`;
}

function statusFor(
  provider: ProviderId,
  ok: boolean,
  ms: number,
  reason: CheckFailureReason | null
): CouncilCheckStatus {
  return {
    provider,
    label: CHIP_LABELS[provider] ?? provider,
    ok,
    ms,
    reason,
    chip: formatCheckChip(provider, ok, ms, reason),
  };
}

export interface CouncilCheckOptions {
  providers: ConfiguredProvider[];
  attempt: (provider: ConfiguredProvider, model: string, timeoutMs: number) => Promise<string>;
  now?: () => number;
  totalTimeoutMs?: number;
}

export async function runCouncilCheck(options: CouncilCheckOptions): Promise<CouncilCheckResult> {
  const now = options.now ?? Date.now;
  const totalTimeoutMs = options.totalTimeoutMs ?? COUNCIL_CHECK_TOTAL_TIMEOUT_MS;
  const providers = options.providers.slice(0, MAX_PROVIDER_ATTEMPTS);
  const deadline = now() + totalTimeoutMs;
  const statuses: CouncilCheckStatus[] = [];

  // Each provider is probed on its own so the founder sees a line per provider
  // rather than stopping at the first one that answers. The memory is local:
  // a diagnostic must not rewrite the session's last-good pick.
  const probeAll = async (): Promise<CouncilCheckResult> => {
    for (const provider of providers) {
      const startedAt = now();
      let reported: CouncilCheckStatus | null = null;
      const candidates = modelCandidatesFor(provider.id, provider.model);

      for (let index = 0; index < candidates.length; index += 1) {
        if (index >= MAX_MODEL_ATTEMPTS_PER_LAP) break;
        const remaining = deadline - now();
        if (remaining <= 0) {
          reported = statusFor(provider.id, false, now() - startedAt, 'timeout');
          break;
        }

        try {
          await options.attempt(provider, candidates[index], remaining);
          reported = statusFor(provider.id, true, now() - startedAt, null);
          break;
        } catch (error) {
          const kind = classifyLlmFailure(error);
          if (kind === 'model_not_found') continue;
          reported = statusFor(provider.id, false, now() - startedAt, failureChipReason(error));
          break;
        }
      }

      statuses.push(reported ?? statusFor(provider.id, false, now() - startedAt, 'model missing'));
    }

    return { ok: statuses.length > 0 && statuses.every((status) => status.ok), statuses };
  };

  let timer: ReturnType<typeof setTimeout> | undefined;
  const timeoutResult = new Promise<CouncilCheckResult>((resolve) => {
    timer = setTimeout(() => {
      const reported = new Set(statuses.map((status) => status.provider));
      const filled = [
        ...statuses,
        ...providers
          .filter((provider) => !reported.has(provider.id))
          .map((provider) => statusFor(provider.id, false, totalTimeoutMs, 'timeout')),
      ];
      resolve({ ok: false, statuses: filled });
    }, Math.max(0, totalTimeoutMs));
  });

  try {
    return await Promise.race([probeAll(), timeoutResult]);
  } finally {
    if (timer) clearTimeout(timer);
  }
}
