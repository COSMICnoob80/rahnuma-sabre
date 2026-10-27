import { test } from 'node:test';
import assert from 'node:assert/strict';
import {
  EMBEDDED_KEY_CHIP_LABEL,
  embeddedKeyChipLabel,
  getEmbeddedKey,
  resolveEmbeddedGeminiKey,
  resolveEmbeddedGroqKey,
} from '../src/services/advisoryKey.ts';

test('advisory key: no embedded key means no chip', () => {
  const key = resolveEmbeddedGroqKey(null, '');
  assert.equal(key, null);
  assert.equal(embeddedKeyChipLabel(key !== null), null);
});

test('advisory key: a mocked Constants extra produces the chip label only', () => {
  const key = resolveEmbeddedGroqKey({ embeddedGroqKey: 'test-key-value-never-real' }, null);
  const label = embeddedKeyChipLabel(key !== null);
  assert.equal(label, 'personal build key active');
  assert.equal(label, EMBEDDED_KEY_CHIP_LABEL);
  assert.equal(label?.includes('test-key-value-never-real'), false);
});

test('advisory key: the env fallback fills in when the Constants extra is empty', () => {
  assert.equal(resolveEmbeddedGroqKey({}, 'env-key-value'), 'env-key-value');
  assert.equal(resolveEmbeddedGroqKey({ embeddedGroqKey: '   ' }, 'env-key-value'), 'env-key-value');
});

test('advisory key: the Constants extra wins over the env fallback', () => {
  assert.equal(
    resolveEmbeddedGroqKey({ embeddedGroqKey: 'from-constants' }, 'from-env'),
    'from-constants'
  );
});

test('advisory key: the Gemini key resolves through the same pure path', () => {
  assert.equal(resolveEmbeddedGeminiKey(null, ''), null);
  assert.equal(resolveEmbeddedGeminiKey({}, '   '), null);
  assert.equal(
    resolveEmbeddedGeminiKey({ embeddedGeminiKey: 'test-gemini-value-never-real' }, null),
    'test-gemini-value-never-real'
  );
  assert.equal(resolveEmbeddedGeminiKey({}, 'env-gemini-value'), 'env-gemini-value');
  assert.equal(
    resolveEmbeddedGeminiKey({ embeddedGeminiKey: 'from-constants' }, 'from-env'),
    'from-constants'
  );
});

test('advisory key: the Gemini extra does not leak into the Groq resolver', () => {
  assert.equal(resolveEmbeddedGroqKey({ embeddedGeminiKey: 'gemini-only' }, null), null);
  assert.equal(resolveEmbeddedGeminiKey({ embeddedGroqKey: 'groq-only' }, null), null);
});

test('advisory key: getEmbeddedKey dispatches per provider and ignores providers without one', () => {
  const original = { ...process.env };
  try {
    process.env.EXPO_PUBLIC_GEMINI_API_KEY = 'inlined-gemini-value';
    process.env.EXPO_PUBLIC_GROQ_API_KEY = 'inlined-groq-value';

    assert.equal(getEmbeddedKey('gemini'), 'inlined-gemini-value');
    assert.equal(getEmbeddedKey('groq'), 'inlined-groq-value');
    assert.equal(getEmbeddedKey('openrouter'), null);
  } finally {
    process.env = original;
  }
});
