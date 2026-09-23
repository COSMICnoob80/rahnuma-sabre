import * as SecureStore from 'expo-secure-store';

// The PIN is a short secret, so two things matter: the stored value must never
// sit in plaintext in the SQLite file, and guesses must be throttled. The OS
// keystore (Keychain / Android Keystore) is the real security boundary here.
const HASH_KEY = 'rahnuma_pin_hash';
const FAILS_KEY = 'rahnuma_pin_fails';
const LOCK_UNTIL_KEY = 'rahnuma_pin_lock_until';

const MAX_ATTEMPTS = 5;
const LOCKOUT_MS = 30_000;

export type VerifyResult = 'ok' | 'wrong' | 'locked' | 'no_pin';

function hash(pin: string): string {
  let h = 5381;
  const salted = `sabre:${pin}`;
  for (let i = 0; i < salted.length; i++) {
    h = ((h << 5) + h + salted.charCodeAt(i)) | 0;
  }
  return (h >>> 0).toString(36);
}

async function read(key: string): Promise<string | null> {
  try {
    return await SecureStore.getItemAsync(key);
  } catch {
    return null;
  }
}

async function write(key: string, value: string): Promise<void> {
  await SecureStore.setItemAsync(key, value);
}

async function clear(key: string): Promise<void> {
  try {
    await SecureStore.deleteItemAsync(key);
  } catch {
    // Nothing stored under this key.
  }
}

export async function hasPin(): Promise<boolean> {
  const stored = await read(HASH_KEY);
  return !!stored;
}

export async function setPin(pin: string): Promise<void> {
  await write(HASH_KEY, hash(pin));
  await clear(FAILS_KEY);
  await clear(LOCK_UNTIL_KEY);
}

export async function removePin(): Promise<void> {
  await clear(HASH_KEY);
  await clear(FAILS_KEY);
  await clear(LOCK_UNTIL_KEY);
}

export async function lockoutRemainingMs(): Promise<number> {
  const until = await read(LOCK_UNTIL_KEY);
  const untilMs = until ? parseInt(until, 10) : 0;
  const remaining = untilMs - Date.now();
  return remaining > 0 ? remaining : 0;
}

export async function verifyPin(pin: string): Promise<VerifyResult> {
  const stored = await read(HASH_KEY);
  if (!stored) return 'no_pin';

  if ((await lockoutRemainingMs()) > 0) return 'locked';

  if (hash(pin) === stored) {
    await clear(FAILS_KEY);
    await clear(LOCK_UNTIL_KEY);
    return 'ok';
  }

  const fails = parseInt((await read(FAILS_KEY)) ?? '0', 10) + 1;
  if (fails >= MAX_ATTEMPTS) {
    await write(LOCK_UNTIL_KEY, String(Date.now() + LOCKOUT_MS));
    await write(FAILS_KEY, '0');
    return 'locked';
  }

  await write(FAILS_KEY, String(fails));
  return 'wrong';
}

export async function attemptsLeft(): Promise<number> {
  const fails = parseInt((await read(FAILS_KEY)) ?? '0', 10);
  return Math.max(0, MAX_ATTEMPTS - fails);
}
