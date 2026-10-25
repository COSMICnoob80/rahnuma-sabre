import { test } from 'node:test';
import assert from 'node:assert/strict';
import {
  EMBEDDED_KEY_CHIP_LABEL,
  embeddedKeyChipLabel,
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
