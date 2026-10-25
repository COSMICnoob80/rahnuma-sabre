// Pure plumbing for the web preview storage adapter. Kept free of react-native
// and expo imports so node --test can exercise it.

export interface StorageBackend {
  getItem(key: string): string | null;
  setItem(key: string, value: string): void;
  removeItem(key: string): void;
}

export interface KeyValueStore {
  getItemAsync(key: string): Promise<string | null>;
  setItemAsync(key: string, value: string): Promise<void>;
  deleteItemAsync(key: string): Promise<void>;
}

export function isWebPlatform(os: string | undefined): boolean {
  return os === 'web';
}

export function createMemoryBackend(): StorageBackend {
  const entries = new Map<string, string>();
  return {
    getItem: (key) => (entries.has(key) ? (entries.get(key) as string) : null),
    setItem: (key, value) => {
      entries.set(key, value);
    },
    removeItem: (key) => {
      entries.delete(key);
    },
  };
}

export function toKeyValueStore(backend: StorageBackend): KeyValueStore {
  return {
    async getItemAsync(key) {
      try {
        return backend.getItem(key);
      } catch {
        return null;
      }
    },
    async setItemAsync(key, value) {
      try {
        backend.setItem(key, value);
      } catch {
        // Preview-only storage: an unavailable quota must not break the flow.
      }
    },
    async deleteItemAsync(key) {
      try {
        backend.removeItem(key);
      } catch {
        // Nothing stored under this key.
      }
    },
  };
}
