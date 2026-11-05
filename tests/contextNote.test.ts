import { test } from 'node:test';
import assert from 'node:assert/strict';
import {
  CONTEXT_NOTE_CACHE_TTL_MS,
  CONTEXT_NOTE_ORDER,
  CONTEXT_NOTE_TITLES,
  CONTEXT_NOTE_UNSTATED,
  buildContextNoteSource,
  isContextNoteCacheFresh,
  parseContextNoteReply,
  requestContextNote,
  stripBannedSegments,
} from '../src/services/contextNote.ts';
import type { ContextNoteCacheEntry } from '../src/services/contextNote.ts';
import type { CouncilNoteResult } from '../src/services/outlookCouncil.ts';
import type { AskOptions } from '../src/services/llmService.ts';

const NOW = Date.parse('2026-11-05T04:00:00.000Z');

// Deliberately emitted out of order, the way a provider may. The renderer owns
// the canonical order, not the model.
const REPLY = [
  '[Risks] The Brent row carries no quote on device and the gold row is labelled cached.',
  '[Facts] The snapshot records the KSE-100 at 162,374.87 with a change of -0.95%. The recorded time is stated on the row.',
  '[What would change this] A later snapshot that states a new value would change the Facts block.',
  '[Strategy] The snapshot states a negative change on one row and a positive change on another. Both rows keep their own freshness label.',
].join('\n');

const DIRTY_REPLY = [
  '[Facts] The snapshot records the KSE-100 at 162,374.87. Our fair value is 115.00.',
  '[Strategy] The record states cost pressure on one side. The price target of 175 is not in the record.',
  '[Risks] The gold row is labelled cached. It will rise once the feed returns.',
  '[What would change this] A new snapshot would change these facts. You should buy now.',
].join('\n');

const BAN =
  /fair\s*value|price\s*target|target\s*price|\bstars?\b|will\s+(rise|fall)|\byou should buy\b/i;

const SNAPSHOT = [
  'Market state snapshot recorded 2026-11-05T04:00:00.000Z. Freshness is stated per row.',
  'KSE-100 (KSE100.KAR): 162,374.87 · change -0.95% · live · source PSX DPS indices',
].join('\n');

const COUNCIL: CouncilNoteResult = {
  notes: [
    {
      by: 'Warren Buffett',
      org: 'Council',
      initials: 'WB',
      text: 'The snapshot records the KSE-100 at 162,374.87.',
    },
  ],
  synthesis: 'The voices read the same row and differ only in emphasis.',
  disclaimer: 'Information only, not investment advice.',
  provider: 'gemini',
  cached: false,
};

function memoryCache(clock: () => number) {
  const store = new Map<string, ContextNoteCacheEntry>();
  return {
    store,
    readCache: async (key: string) => {
      const entry = store.get(key);
      return entry && isContextNoteCacheFresh(entry.t, clock()) ? entry : null;
    },
    writeCache: async (key: string, entry: ContextNoteCacheEntry) => {
      store.set(key, entry);
    },
  };
}

function recordingAsk(text: string) {
  const calls: AskOptions[] = [];
  const ask = async (options: AskOptions) => {
    calls.push(options);
    return { text, provider: 'groq' as const, cached: false, failedProviders: [] };
  };
  return { calls, ask };
}

test('skeleton: four blocks render in the fixed order, none missing', () => {
  const parts = parseContextNoteReply(REPLY);

  assert.ok(parts);
  assert.equal(parts.length, 4);
  assert.deepEqual(
    parts.map((part) => part.id),
    CONTEXT_NOTE_ORDER
  );
  assert.deepEqual(
    parts.map((part) => part.number),
    [1, 2, 3, 4]
  );
  for (const part of parts) {
    assert.equal(part.title, CONTEXT_NOTE_TITLES[part.id]);
    assert.ok(part.body.length > 0);
    assert.notEqual(part.body, CONTEXT_NOTE_UNSTATED);
  }
  assert.match(parts[0].body, /162,374\.87/);
});

test('skeleton: each block is capped at two sentences', () => {
  const parts = parseContextNoteReply(
    '[Facts] One sentence. Two sentences. Three sentences that must not survive.'
  );
  assert.ok(parts);
  assert.equal(parts[0].body, 'One sentence. Two sentences.');
});

test('skeleton: a missing block is a labelled gap, not a shorter note', () => {
  const parts = parseContextNoteReply('[Facts] The snapshot records the KSE-100 value.');
  assert.ok(parts);
  assert.equal(parts.length, 4);
  assert.equal(parts[0].body, 'The snapshot records the KSE-100 value.');
  assert.equal(parts[1].body, CONTEXT_NOTE_UNSTATED);
  assert.equal(parts[2].body, CONTEXT_NOTE_UNSTATED);
  assert.equal(parts[3].body, CONTEXT_NOTE_UNSTATED);
});

test('ban words: a fair value, a target or a direction sentence is stripped whole', () => {
  const parts = parseContextNoteReply(DIRTY_REPLY);
  assert.ok(parts);

  for (const part of parts) {
    assert.doesNotMatch(part.body, BAN);
  }

  // The factual half of the dirty sentence survives; the verdict half does not.
  assert.match(parts[0].body, /162,374\.87/);
  assert.match(parts[1].body, /cost pressure/);
  assert.match(parts[2].body, /labelled cached/);
  assert.match(parts[3].body, /A new snapshot would change these facts/);
});

test('ban words: the segment stripper reports that it removed something', () => {
  const clean = stripBannedSegments('The snapshot records a value of 162,374.87.');
  assert.equal(clean.stripped, false);
  assert.equal(clean.text, 'The snapshot records a value of 162,374.87.');

  const dirty = stripBannedSegments('The snapshot records a value. Our fair value is 115.00.');
  assert.equal(dirty.stripped, true);
  assert.equal(dirty.text, 'The snapshot records a value.');
});

test('source: the note reads the same snapshot and the attributed council output', () => {
  const source = buildContextNoteSource(SNAPSHOT, COUNCIL);
  assert.match(source, /Market state snapshot/);
  assert.match(source, /\[Warren Buffett\] The snapshot records the KSE-100/);
  assert.match(source, /\[Synthesis\]/);
});

test('request: one provider call, then the 24h cache serves the same four blocks', async () => {
  let clock = NOW;
  const cache = memoryCache(() => clock);
  const { calls, ask } = recordingAsk(REPLY);

  const first = await requestContextNote(SNAPSHOT, COUNCIL, { now: clock, ask, ...cache });

  assert.equal(calls.length, 1);
  assert.equal(calls[0].useCache, false);
  assert.equal(calls[0].timeoutMs, 15_000);
  assert.ok(first);
  assert.equal(first?.cached, false);
  assert.equal(first?.provider, 'groq');
  assert.equal(first?.parts.length, 4);
  assert.equal(cache.store.size, 1);

  clock = NOW + 60_000;
  const second = await requestContextNote(SNAPSHOT, COUNCIL, { now: clock, ask, ...cache });

  assert.equal(calls.length, 1);
  assert.equal(second?.cached, true);
  assert.deepEqual(
    second?.parts.map((part) => part.id),
    CONTEXT_NOTE_ORDER
  );
});

test('cache: a day-old note is rebuilt, and the TTL is still 24h', async () => {
  let clock = NOW;
  const cache = memoryCache(() => clock);
  const { calls, ask } = recordingAsk(REPLY);

  await requestContextNote(SNAPSHOT, COUNCIL, { now: clock, ask, ...cache });
  clock = NOW + CONTEXT_NOTE_CACHE_TTL_MS + 1;
  await requestContextNote(SNAPSHOT, COUNCIL, { now: clock, ask, ...cache });

  assert.equal(calls.length, 2);
  assert.equal(isContextNoteCacheFresh(NOW, NOW + CONTEXT_NOTE_CACHE_TTL_MS), true);
  assert.equal(isContextNoteCacheFresh(NOW, NOW + CONTEXT_NOTE_CACHE_TTL_MS + 1), false);
});

test('request: no provider returns null rather than a fabricated note', async () => {
  const cache = memoryCache(() => NOW);
  const result = await requestContextNote(SNAPSHOT, COUNCIL, {
    now: NOW,
    ask: async () => {
      throw new Error('All AI providers failed');
    },
    ...cache,
  });

  assert.equal(result, null);
  assert.equal(cache.store.size, 0);
});

test('request: an unrecognisable reply returns null, so the card keeps its fallback', async () => {
  const cache = memoryCache(() => NOW);
  const result = await requestContextNote(SNAPSHOT, COUNCIL, {
    now: NOW,
    ask: async () => ({
      text: 'The market data is currently unavailable.',
      provider: 'groq' as const,
      cached: false,
      failedProviders: [],
    }),
    ...cache,
  });

  assert.equal(result, null);
  assert.equal(cache.store.size, 0);
});
