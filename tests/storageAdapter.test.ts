import { test } from 'node:test';
import assert from 'node:assert/strict';
import {
  createMemoryBackend,
  isWebPlatform,
  toKeyValueStore,
} from '../src/utils/webStorageCore.ts';
import type { StorageBackend } from '../src/utils/webStorageCore.ts';

test('web storage core: memory backend keeps values per key', () => {
  const backend = createMemoryBackend();
  assert.equal(backend.getItem('rahnuma_pin_hash'), null);
  backend.setItem('rahnuma_pin_hash', 'abc123');
  backend.setItem('rahnuma_pin_fails', '2');
  assert.equal(backend.getItem('rahnuma_pin_hash'), 'abc123');
  assert.equal(backend.getItem('rahnuma_pin_fails'), '2');
  backend.removeItem('rahnuma_pin_hash');
  assert.equal(backend.getItem('rahnuma_pin_hash'), null);
  assert.equal(backend.getItem('rahnuma_pin_fails'), '2');
});

test('web storage core: store wrapper has the SecureStore async signatures', async () => {
  const store = toKeyValueStore(createMemoryBackend());
  assert.equal(await store.getItemAsync('missing'), null);
  await store.setItemAsync('groq_api_key', 'gsk-preview');
  assert.equal(await store.getItemAsync('groq_api_key'), 'gsk-preview');
  await store.deleteItemAsync('groq_api_key');
  assert.equal(await store.getItemAsync('groq_api_key'), null);
  await store.deleteItemAsync('groq_api_key');
});

test('web storage core: a blocked backend never throws through the store', async () => {
  const blocked: StorageBackend = {
    getItem: () => {
      throw new Error('SecurityError');
    },
    setItem: () => {
      throw new Error('QuotaExceededError');
    },
    removeItem: () => {
      throw new Error('SecurityError');
    },
  };
  const store = toKeyValueStore(blocked);
  assert.equal(await store.getItemAsync('rahnuma_pin_hash'), null);
  await store.setItemAsync('rahnuma_pin_hash', 'abc123');
  await store.deleteItemAsync('rahnuma_pin_hash');
});

test('web storage core: only the web platform selects the browser store', () => {
  assert.equal(isWebPlatform('web'), true);
  assert.equal(isWebPlatform('ios'), false);
  assert.equal(isWebPlatform('android'), false);
  assert.equal(isWebPlatform(undefined), false);
});
