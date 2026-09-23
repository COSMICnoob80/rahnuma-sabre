import * as SecureStore from 'expo-secure-store';
import { ProviderId, PROVIDERS, providerById } from '../services/providers';

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
    return await SecureStore.getItemAsync(keyName(id));
  } catch {
    return null;
  }
}

export async function setProviderKey(id: ProviderId, key: string): Promise<void> {
  if (key.trim()) {
    await SecureStore.setItemAsync(keyName(id), key.trim());
  } else {
    await SecureStore.deleteItemAsync(keyName(id));
  }
}

export async function getProviderModel(id: ProviderId): Promise<string> {
  try {
    const stored = await SecureStore.getItemAsync(modelName(id));
    return stored || providerById(id).defaultModel;
  } catch {
    return providerById(id).defaultModel;
  }
}

export async function setProviderModel(id: ProviderId, model: string): Promise<void> {
  await SecureStore.setItemAsync(modelName(id), model);
}

export interface ConfiguredProvider {
  id: ProviderId;
  key: string;
  model: string;
}

// Preference order: paid-quality first, then the free tiers. Callers override
// with the user's chosen provider, which is tried before this order.
export async function getConfiguredProviders(): Promise<ConfiguredProvider[]> {
  const configured: ConfiguredProvider[] = [];
  for (const provider of PROVIDERS) {
    const key = await getProviderKey(provider.id);
    if (key) {
      configured.push({ id: provider.id, key, model: await getProviderModel(provider.id) });
    }
  }
  return configured;
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
