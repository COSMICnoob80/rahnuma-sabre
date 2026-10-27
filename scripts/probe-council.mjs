// Live council probe — evidence only, no npm dependencies.
// Run: node scripts/probe-council.mjs
//
// Reads EXPO_PUBLIC_GEMINI_API_KEY straight out of .env (or the process env) and
// makes one small Gemini call, then reports HTTP status and the first 200 chars
// of the reply. The key is never printed, logged, or included in any output —
// only its presence and length are reported.

import { readFileSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import { dirname, join } from 'node:path';

const ROOT = join(dirname(fileURLToPath(import.meta.url)), '..');
const ENV_FILE = join(ROOT, '.env');
const MODEL = 'gemini-3.8-flash';
const BASE = 'https://generativelanguage.googleapis.com/v1beta';
const REQUEST_TIMEOUT_MS = 20_000;

function readEnvKey(name) {
  if (typeof process.env[name] === 'string' && process.env[name].trim()) {
    return process.env[name].trim();
  }
  let text;
  try {
    text = readFileSync(ENV_FILE, 'utf8');
  } catch {
    return null;
  }
  for (const line of text.split(/\r?\n/)) {
    const match = /^\s*([A-Z0-9_]+)\s*=\s*(.*)$/.exec(line);
    if (!match || match[1] !== name) continue;
    const value = match[2].trim().replace(/^["']|["']$/g, '');
    if (value) return value;
  }
  return null;
}

const key = readEnvKey('EXPO_PUBLIC_GEMINI_API_KEY');
console.log(`EXPO_PUBLIC_GEMINI_API_KEY: ${key ? `present (${key.length} chars)` : 'absent'}`);
if (!key) process.exit(0);

function redact(value) {
  return String(value).split(key).join('[redacted]').slice(0, 200);
}

async function listModels() {
  const response = await fetch(`${BASE}/models`, {
    headers: { 'x-goog-api-key': key },
    signal: AbortSignal.timeout(REQUEST_TIMEOUT_MS),
  });
  const body = await response.text();
  if (!response.ok) return { status: response.status, names: [] };
  try {
    const parsed = JSON.parse(body);
    const names = (parsed.models ?? []).map((m) => String(m.name).replace(/^models\//, ''));
    return { status: response.status, names };
  } catch {
    return { status: response.status, names: [] };
  }
}

async function generate() {
  const response = await fetch(`${BASE}/models/${MODEL}:generateContent`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json', 'x-goog-api-key': key },
    signal: AbortSignal.timeout(REQUEST_TIMEOUT_MS),
    body: JSON.stringify({
      systemInstruction: {
        parts: [
          {
            text:
              'You are one voice on a market-outlook council. State facts only. ' +
              'Never state a direction, a target, or an action.',
          },
        ],
      },
      contents: [
        { role: 'user', parts: [{ text: 'In one sentence, describe what a closed market is.' }] },
      ],
      generationConfig: { maxOutputTokens: 64, temperature: 0.2 },
    }),
  });
  const body = await response.text();
  let text = '';
  try {
    const parsed = JSON.parse(body);
    const parts = parsed.candidates?.[0]?.content?.parts;
    text = Array.isArray(parts) ? parts.map((p) => p?.text ?? '').join('') : '';
    if (!text) text = JSON.stringify(parsed);
  } catch {
    text = body;
  }
  return { status: response.status, text: redact(text.trim()) };
}

let listing;
try {
  listing = await listModels();
} catch (error) {
  console.log(`models list: failed (${error.name}: ${redact(error.message)})`);
  process.exit(0);
}
console.log(`models list: HTTP ${listing.status}, ${listing.names.length} models`);
console.log(`gemini-3.8-flash listed: ${listing.names.includes(MODEL) ? 'yes' : 'no'}`);
const flash = listing.names.filter((n) => /flash/.test(n)).slice(0, 10);
if (flash.length > 0) console.log(`flash models: ${flash.join(', ')}`);

let result;
try {
  result = await generate();
} catch (error) {
  console.log(`generateContent ${MODEL}: failed (${error.name}: ${redact(error.message)})`);
  process.exit(0);
}
console.log(`generateContent ${MODEL}: HTTP ${result.status}`);
console.log(`reply[0..200]: ${result.text}`);
