import * as SecureStore from 'expo-secure-store';

const KEYS = {
  OPENROUTER_API_KEY: 'openrouter_api_key',
  OPENROUTER_MODEL: 'openrouter_model',
};

export async function getApiKey(): Promise<string | null> {
  try {
    return await SecureStore.getItemAsync(KEYS.OPENROUTER_API_KEY);
  } catch {
    return null;
  }
}

export async function setApiKey(key: string): Promise<void> {
  await SecureStore.setItemAsync(KEYS.OPENROUTER_API_KEY, key);
}

export async function getApiModel(): Promise<string | null> {
  try {
    return await SecureStore.getItemAsync(KEYS.OPENROUTER_MODEL);
  } catch {
    return null;
  }
}

export async function setApiModel(model: string): Promise<void> {
  await SecureStore.setItemAsync(KEYS.OPENROUTER_MODEL, model);
}
