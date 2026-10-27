import { platformStore } from './webStorageAdapter';
import {
  ConfiguredProvider,
  ProviderId,
  PROVIDERS,
  providerById,
  withEmbeddedFallback,
} from '../services/providers';
import { EMBEDDED_KEY_PROVIDER_IDS, getEmbeddedKey } from '../services/advisoryKey';

const LEGACY_OPENROUTER_KEY = 'openrouter_api_key';
const LEGACY_OPENROUTER_MODEL = 'openrouter_model';

function keyName(id: ProviderId): string {
  return id === 'openrouter' ? LEGACY_OPENROUTER_KEY : `${id}_api_key`;
}

function modelName(id: ProviderId): string {
  return id === 'openrouter' ? LEGACY_OPENROUTER_MODEL : `${id}_model`;
}

export async function getProviderKey(id: ProviderId): Promise<string | null> {
  try {
    return await platformStore.getItemAsync(keyName(id));
  } catch {
    return null;
  }
}

export async function setProviderKey(id: ProviderId, key: string): Promise<void> {
  if (key.trim()) {
    await platformStore.setItemAsync(keyName(id), key.trim());
  } else {
    await platformStore.deleteItemAsync(keyName(id));
  }
}

export async function getProviderModel(id: ProviderId): Promise<string> {
  try {
    const stored = await platformStore.getItemAsync(modelName(id));
    return stored || providerById(id).defaultModel;
  } catch {
    return providerById(id).defaultModel;
  }
}

export async function setProviderModel(id: ProviderId, model: string): Promise<void> {
  await platformStore.setItemAsync(modelName(id), model);
}

// Preference order: paid-quality first, then the free tiers. Callers override
// with the user's chosen provider, which is tried before this order. Keys the
// user pasted always come first; the build's own embedded keys are appended as
// the last resort.
export async function getConfiguredProviders(): Promise<ConfiguredProvider[]> {
  const configured: ConfiguredProvider[] = [];
  for (const provider of PROVIDERS) {
    const key = await getProviderKey(provider.id);
    if (key) {
      configured.push({ id: provider.id, key, model: await getProviderModel(provider.id) });
    }
  }

  const embedded: ConfiguredProvider[] = [];
  for (const id of EMBEDDED_KEY_PROVIDER_IDS) {
    const key = getEmbeddedKey(id);
    if (key) {
      embedded.push({ id, key, model: await getProviderModel(id) });
    }
  }

  return withEmbeddedFallback(configured, embedded);
}

// Kept for backward compatibility with screens not yet migrated.
export async function getApiKey(): Promise<string | null> {
  return getProviderKey('openrouter');
}

export async function setApiKey(key: string): Promise<void> {
  return setProviderKey('openrouter', key);
}

export async function getApiModel(): Promise<string | null> {
  return getProviderModel('openrouter');
}

export async function setApiModel(model: string): Promise<void> {
  return setProviderModel('openrouter', model);
}
