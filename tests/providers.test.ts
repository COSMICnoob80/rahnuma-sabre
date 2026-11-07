import { test } from 'node:test';
import assert from 'node:assert/strict';
import {
  MAX_PROVIDER_ATTEMPTS,
  PROVIDERS,
  modelCandidatesFor,
  orderProviders,
  providerById,
  withEmbeddedFallback,
} from '../src/services/providers.ts';
import { EMBEDDED_KEY_PROVIDER_IDS } from '../src/services/advisoryKey.ts';

test('provider chain: Gemini is in the chain with the pinned model id', () => {
  const gemini = providerById('gemini');
  assert.equal(gemini.defaultModel, 'gemini-3.8-flash');
  assert.ok(gemini.models.some((model) => model.value === 'gemini-3.8-flash'));
  assert.ok(PROVIDERS.some((provider) => provider.id === 'gemini'));
});

test('provider chain: every default model is one the provider actually lists', () => {
  for (const provider of PROVIDERS) {
    assert.ok(
      provider.models.some((model) => model.value === provider.defaultModel),
      `${provider.id} defaults to an unlisted model: ${provider.defaultModel}`
    );
  }
});

test('provider chain: the embedded build keys join after the pasted keys, Groq first', () => {
  const pasted = [{ id: 'openrouter' as const, key: 'pasted-key', model: 'deepseek/deepseek-v4-flash' }];
  const embedded = [
    { id: 'groq' as const, key: 'build-key-groq', model: 'llama-3.3-70b-versatile' },
    { id: 'gemini' as const, key: 'build-key-gemini', model: 'gemini-3.8-flash' },
  ];

  const merged = withEmbeddedFallback(pasted, embedded);

  assert.deepEqual(
    merged.map((provider) => provider.id),
    ['openrouter', 'groq', 'gemini']
  );
  assert.deepEqual(EMBEDDED_KEY_PROVIDER_IDS, ['groq', 'gemini']);
  assert.equal(merged[0].key, 'pasted-key');
});

test('provider chain: the fall-through order is Groq, Gemini, OpenRouter', () => {
  assert.deepEqual(
    PROVIDERS.map((provider) => provider.id),
    ['groq', 'gemini', 'openrouter']
  );
  assert.deepEqual(EMBEDDED_KEY_PROVIDER_IDS, ['groq', 'gemini']);
});

test('provider chain: an embedded-only ladder walks Groq then Gemini', () => {
  const merged = withEmbeddedFallback([], [
    { id: 'groq' as const, key: 'build-groq', model: 'llama-3.3-70b-versatile' },
    { id: 'gemini' as const, key: 'build-gemini', model: 'gemini-3.8-flash' },
  ]);
  assert.deepEqual(
    orderProviders(merged).map((provider) => provider.id),
    ['groq', 'gemini']
  );
});

test('provider chain: attempts are capped at 3 and the preferred provider leads', () => {
  assert.equal(MAX_PROVIDER_ATTEMPTS, 3);

  const configured = [
    { id: 'gemini' as const, key: 'g1', model: 'gemini-3.8-flash' },
    { id: 'openrouter' as const, key: 'o1', model: 'deepseek/deepseek-v4-flash' },
    { id: 'groq' as const, key: 'q1', model: 'llama-3.3-70b-versatile' },
    { id: 'gemini' as const, key: 'g2', model: 'gemini-3.5-flash' },
  ];

  const capped = orderProviders(configured);
  assert.equal(capped.length, 3);
  assert.deepEqual(
    capped.map((provider) => provider.key),
    ['g1', 'o1', 'q1']
  );

  const preferred = orderProviders(configured, 'groq');
  assert.equal(preferred.length, 3);
  assert.equal(preferred[0].id, 'groq');
  assert.equal(preferred[0].key, 'q1');
});

test('provider chain: a key the user pasted is never displaced by a build key', () => {
  const merged = withEmbeddedFallback(
    [{ id: 'gemini' as const, key: 'pasted-gemini', model: 'gemini-3.5-flash' }],
    [{ id: 'gemini' as const, key: 'build-gemini', model: 'gemini-3.8-flash' }]
  );

  assert.equal(merged.length, 1);
  assert.equal(merged[0].key, 'pasted-gemini');
  assert.equal(merged[0].model, 'gemini-3.5-flash');
});

test('provider chain: an absent build key adds no provider', () => {
  const merged = withEmbeddedFallback([], [
    { id: 'gemini' as const, key: '', model: 'gemini-3.8-flash' },
  ]);
  assert.deepEqual(merged, []);
});

test('model ladder: each provider pins its ordered model candidates', () => {
  assert.deepEqual(modelCandidatesFor('groq'), [
    'llama-3.3-70b-versatile',
    'llama-3.1-8b-instant',
  ]);
  assert.deepEqual(modelCandidatesFor('gemini'), [
    'gemini-3.8-flash',
    'gemini-3.1-flash-lite',
    'gemini-2.5-flash',
  ]);
  assert.deepEqual(modelCandidatesFor('openrouter'), [
    'deepseek/deepseek-v4-flash',
    'deepseek/deepseek-chat-v3:free',
    'moonshotai/kimi-k2',
    'z-ai/glm-4.6',
  ]);
});

test('model ladder: the selected model leads and is never duplicated', () => {
  assert.deepEqual(modelCandidatesFor('groq', 'llama-3.1-8b-instant'), [
    'llama-3.1-8b-instant',
    'llama-3.3-70b-versatile',
  ]);
  assert.deepEqual(modelCandidatesFor('gemini', 'gemini-3.8-flash'), [
    'gemini-3.8-flash',
    'gemini-3.1-flash-lite',
    'gemini-2.5-flash',
  ]);
  const custom = modelCandidatesFor('gemini', 'gemini-3.5-flash');
  assert.equal(custom[0], 'gemini-3.5-flash');
  assert.equal(new Set(custom).size, custom.length);
});
