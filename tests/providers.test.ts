import { test } from 'node:test';
import assert from 'node:assert/strict';
import { PROVIDERS, providerById, withEmbeddedFallback } from '../src/services/providers.ts';
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

test('provider chain: the embedded build keys join after the pasted keys, Gemini first', () => {
  const pasted = [{ id: 'openrouter' as const, key: 'pasted-key', model: 'deepseek/deepseek-v4-flash' }];
  const embedded = [
    { id: 'gemini' as const, key: 'build-key-gemini', model: 'gemini-3.8-flash' },
    { id: 'groq' as const, key: 'build-key-groq', model: 'qwen/qwen3.8-27b' },
  ];

  const merged = withEmbeddedFallback(pasted, embedded);

  assert.deepEqual(
    merged.map((provider) => provider.id),
    ['openrouter', 'gemini', 'groq']
  );
  assert.deepEqual(EMBEDDED_KEY_PROVIDER_IDS, ['gemini', 'groq']);
  assert.equal(merged[0].key, 'pasted-key');
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
