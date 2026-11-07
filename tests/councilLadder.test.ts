import { test } from 'node:test';
import assert from 'node:assert/strict';
import {
  LlmHttpError,
  MAX_MODEL_RETRIES_PER_LAP,
  classifyLlmFailure,
  lastGoodModel,
  resetCouncilLadderMemory,
  runCouncilCheck,
  runCouncilLadder,
} from '../src/services/councilLadder.ts';
import type { LadderMemory } from '../src/services/councilLadder.ts';
import type { ConfiguredProvider } from '../src/services/providers.ts';

const GROQ: ConfiguredProvider = {
  id: 'groq',
  key: 'groq-key',
  model: 'llama-3.3-70b-versatile',
};
const GEMINI: ConfiguredProvider = {
  id: 'gemini',
  key: 'gemini-key',
  model: 'gemini-3.8-flash',
};

function memory(): LadderMemory {
  return { lastGood: null };
}

test('ladder: a 404-model moves to the NEXT MODEL in the same provider', async () => {
  const attempts: string[] = [];
  const result = await runCouncilLadder({
    providers: [GROQ],
    memory: memory(),
    attempt: async (provider, model) => {
      attempts.push(`${provider.id}:${model}`);
      if (model === 'llama-3.3-70b-versatile') {
        throw new LlmHttpError('groq', 404, 'model_not_found: the model does not exist');
      }
      return 'steady';
    },
  });

  assert.equal(result.ok, true);
  if (!result.ok) return;
  assert.equal(result.text, 'steady');
  assert.equal(result.provider, 'groq');
  assert.equal(result.model, 'llama-3.1-8b-instant');
  assert.deepEqual(attempts, [
    'groq:llama-3.3-70b-versatile',
    'groq:llama-3.1-8b-instant',
  ]);
  assert.equal(result.failures.length, 1);
  assert.equal(result.failures[0].kind, 'model_not_found');
});

test('ladder: a 429 leaves the provider instead of trying its other model', async () => {
  const attempts: string[] = [];
  const result = await runCouncilLadder({
    providers: [GROQ, GEMINI],
    memory: memory(),
    attempt: async (provider, model) => {
      attempts.push(`${provider.id}:${model}`);
      if (provider.id === 'groq') throw new LlmHttpError('groq', 429, 'rate limit reached');
      return 'OK';
    },
  });

  assert.equal(result.ok, true);
  if (!result.ok) return;
  assert.equal(result.provider, 'gemini');
  assert.deepEqual(attempts, ['groq:llama-3.3-70b-versatile', 'gemini:gemini-3.8-flash']);
  assert.equal(result.failures.length, 1);
  assert.equal(result.failures[0].kind, 'provider_down');
});

test('ladder: a lap never retries more than the cap, even with more candidates', async () => {
  assert.equal(MAX_MODEL_RETRIES_PER_LAP, 2);
  const attempts: string[] = [];

  const result = await runCouncilLadder({
    providers: [{ id: 'openrouter', key: 'k', model: 'deepseek/deepseek-v4-flash' }],
    memory: memory(),
    attempt: async (provider, model) => {
      attempts.push(`${provider.id}:${model}`);
      throw new LlmHttpError('openrouter', 404, 'unknown model');
    },
  });

  assert.equal(result.ok, false);
  // Four candidates exist; the lap stops after the first attempt + 2 retries.
  assert.equal(attempts.length, 3);
  if (result.ok) return;
  assert.equal(result.failures.length, 3);
});

test('ladder: last-good is tried first on the next call', async () => {
  const session = memory();
  const firstAttempts: string[] = [];

  const first = await runCouncilLadder({
    providers: [GROQ, GEMINI],
    memory: session,
    attempt: async (provider, model) => {
      firstAttempts.push(`${provider.id}:${model}`);
      if (provider.id === 'groq') throw new LlmHttpError('groq', 503, 'unavailable');
      return 'OK';
    },
  });

  assert.equal(first.ok, true);
  assert.deepEqual(lastGoodModel(session), { provider: 'gemini', model: 'gemini-3.8-flash' });
  assert.deepEqual(firstAttempts, ['groq:llama-3.3-70b-versatile', 'gemini:gemini-3.8-flash']);

  const secondAttempts: string[] = [];
  const second = await runCouncilLadder({
    providers: [GROQ, GEMINI],
    memory: session,
    attempt: async (provider, model) => {
      secondAttempts.push(`${provider.id}:${model}`);
      return 'OK';
    },
  });

  assert.equal(second.ok, true);
  assert.deepEqual(secondAttempts, ['gemini:gemini-3.8-flash']);
});

test('ladder: a failing last-good is cleared once and the normal order resumes', async () => {
  const session = memory();
  session.lastGood = { provider: 'gemini', model: 'gemini-3.1-flash-lite' };

  const attempts: string[] = [];
  const first = await runCouncilLadder({
    providers: [GROQ, GEMINI],
    memory: session,
    attempt: async (provider, model) => {
      attempts.push(`${provider.id}:${model}`);
      if (provider.id === 'gemini') throw new LlmHttpError('gemini', 429, 'quota');
      return 'OK';
    },
  });

  assert.equal(first.ok, true);
  if (!first.ok) return;
  assert.equal(first.provider, 'groq');
  assert.equal(lastGoodModel(session)?.provider, 'groq');
  // The remembered Gemini model went first, then the normal Groq lane.
  assert.deepEqual(attempts, ['gemini:gemini-3.1-flash-lite', 'groq:llama-3.3-70b-versatile']);
});

test('ladder: every provider failing returns all failures and remembers nothing', async () => {
  const session = memory();
  const result = await runCouncilLadder({
    providers: [GROQ, GEMINI],
    memory: session,
    attempt: async () => {
      throw new LlmHttpError('groq', 429, 'rate limit');
    },
  });

  assert.equal(result.ok, false);
  if (result.ok) return;
  assert.equal(lastGoodModel(session), null);
  assert.deepEqual(
    result.failures.map((failure) => failure.provider),
    ['groq', 'gemini']
  );
});

test('classifier: 404 and model_not_found text pick the model lane, the rest the provider lane', () => {
  assert.equal(classifyLlmFailure(new LlmHttpError('gemini', 404, 'not found')), 'model_not_found');
  assert.equal(
    classifyLlmFailure(new Error('models/gemini-9 is not found for API version v1beta')),
    'model_not_found'
  );
  assert.equal(classifyLlmFailure(new LlmHttpError('groq', 429, 'rate')), 'provider_down');
  assert.equal(classifyLlmFailure(new LlmHttpError('groq', 503, 'down')), 'provider_down');
  assert.equal(classifyLlmFailure(new Error('Network request failed')), 'provider_down');
});

test('self-test: one closed-shape chip per provider, raw provider text never leaks', async () => {
  const RAW =
    'Groq error: 429 {"error":{"message":"Rate limit reached for model llama-3.3-70b-versatile","type":"rate_limit_exceeded"},"request-id":"req_abc123"}';

  const result = await runCouncilCheck({
    providers: [GROQ, GEMINI],
    now: () => 0,
    totalTimeoutMs: 15_000,
    attempt: async (provider) => {
      if (provider.id === 'groq') throw new LlmHttpError('groq', 429, RAW);
      return 'OK';
    },
  });

  assert.deepEqual(
    result.statuses.map((status) => status.chip),
    ['Groq ✗ 429 rate', 'Gemini ✓ 0.0s']
  );
  assert.equal(result.ok, false);

  const serialized = JSON.stringify(result);
  assert.doesNotMatch(serialized, /request-id|rate_limit_exceeded|llama-3\.3-70b|\{"error"/);
  for (const status of result.statuses) {
    assert.match(status.chip, /^(Groq|Gemini|OpenRouter) (✓ \d+\.\d+s|✗ [a-z0-9 ]+)$/);
  }
});

test('self-test: a network failure and a missing model each get a short reason', async () => {
  const network = await runCouncilCheck({
    providers: [GROQ],
    now: () => 0,
    attempt: async () => {
      throw new TypeError('Network request failed');
    },
  });
  assert.equal(network.statuses[0].chip, 'Groq ✗ fetch failed');

  const missing = await runCouncilCheck({
    providers: [GEMINI],
    now: () => 0,
    attempt: async () => {
      throw new LlmHttpError('gemini', 404, 'not found');
    },
  });
  assert.equal(missing.statuses[0].chip, 'Gemini ✗ model missing');
});

test('self-test: an empty key set reports no statuses and is not a success', async () => {
  const result = await runCouncilCheck({
    providers: [],
    attempt: async () => 'OK',
  });
  assert.deepEqual(result.statuses, []);
  assert.equal(result.ok, false);
});

test('self-test: a stalled attempt is reported as a timeout chip, not raw text', async () => {
  const result = await runCouncilCheck({
    providers: [GROQ],
    now: () => 0,
    totalTimeoutMs: 15_000,
    attempt: async () => {
      const error = new Error('The operation was aborted. request-id req_zzz');
      error.name = 'AbortError';
      throw error;
    },
  });
  assert.equal(result.statuses[0].chip, 'Groq ✗ timeout');
});

test('session memory resets cleanly between app sessions', () => {
  const session = memory();
  session.lastGood = { provider: 'groq', model: 'llama-3.1-8b-instant' };
  resetCouncilLadderMemory(session);
  assert.equal(lastGoodModel(session), null);
});
