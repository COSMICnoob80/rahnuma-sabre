import { Platform } from 'react-native';
import * as SecureStore from 'expo-secure-store';
import { createMemoryBackend, isWebPlatform, toKeyValueStore } from './webStorageCore';
import type { KeyValueStore, StorageBackend } from './webStorageCore';

// expo-secure-store ships an empty web implementation, so every call throws
// "setValueWithKeyAsync is not a function" in the browser. On web we substitute
// this browser tab's storage; on iOS/Android the platform check below keeps the
// existing OS-keystore path untouched.
type BrowserStorage = Pick<StorageBackend, 'getItem' | 'setItem' | 'removeItem'>;

function browserStorage(): BrowserStorage | null {
  try {
    const scope = globalThis as unknown as { localStorage?: BrowserStorage };
    const storage = scope.localStorage;
    if (storage && typeof storage.getItem === 'function') return storage;
  } catch {
    // Sandboxed or private-mode storage; fall through to memory.
  }
  return null;
}

function browserBackend(): StorageBackend {
  const storage = browserStorage();
  if (!storage) return createMemoryBackend();
  // Wrap rather than pass the Storage object: its methods require the Storage
  // receiver and throw "Illegal invocation" when called detached.
  return {
    getItem: (key) => storage.getItem(key),
    setItem: (key, value) => storage.setItem(key, value),
    removeItem: (key) => storage.removeItem(key),
  };
}

const webStore: KeyValueStore = toKeyValueStore(browserBackend());

const nativeStore: KeyValueStore = {
  getItemAsync: (key) => SecureStore.getItemAsync(key),
  setItemAsync: (key, value) => SecureStore.setItemAsync(key, value),
  deleteItemAsync: (key) => SecureStore.deleteItemAsync(key),
};

export const platformStore: KeyValueStore =
  isWebPlatform(Platform.OS) || typeof SecureStore.getItemAsync !== 'function'
    ? webStore
    : nativeStore;
