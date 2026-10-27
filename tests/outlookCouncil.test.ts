import { test } from 'node:test';
import assert from 'node:assert/strict';
import {
  COUNCIL_CACHE_TTL_MS,
  COUNCIL_DISCLAIMER,
  COUNCIL_LIVE_CHIP,
  COUNCIL_PERSONAS,
  COUNCIL_STATIC_CHIP,
  buildContextSnapshot,
  isCouncilCacheFresh,
  parseCouncilReply,
  requestCouncilNote,
} from '../src/services/outlookCouncil.ts';
import type { CouncilCacheEntry } from '../src/services/outlookCouncil.ts';
import type { InstrumentQuote } from '../src/services/globalMarkets.ts';
import type { AskOptions } from '../src/services/llmService.ts';

// Every banned word from the outlook contract, in one place. The snapshot and
// every council sentence must be clean against it.
const DIRECTION =
  /\b(will|shall|expect|expects|expected|forecast|target|targets|up|down|higher|lower|rise|rises|rising|rose|fell|fall|falls|falling|gain|gains|loss|losses|rally|rallies|surge|surges|slump|drop|drops|jump|jumps|plunge|plunges|climb|climbs|buy|buys|buying|sell|sells|selling|hold|holds|should|recommend|recommends|opportunity|opportunities|bullish|bearish|cheap|expensive|overvalued|undervalued)\b/i;

const NOW = Date.parse('2026-10-27T04:00:00.000Z');

const QUOTES: InstrumentQuote[] = [
  {
    symbol: 'KSE100.KAR',
    label: 'KSE-100',
    region: 'national',
    pricePKR: 162374.87,
    priceNote: null,
    changePct: -0.95,
    fetchedAtIsoUtc: '2026-10-27T03:58:00.000Z',
    source: 'PSX DPS indices',
    fresh: true,
  },
  {
    symbol: 'GC=F',
    label: 'Gold XAU',
    region: 'international',
    pricePKR: 4120.5,
    priceNote: 'USD quoted',
    changePct: 0.42,
    fetchedAtIsoUtc: '2026-10-26T18:10:00.000Z',
    source: 'Yahoo Finance chart (cached)',
    fresh: false,
  },
  {
    symbol: 'BZ=F',
    label: 'Brent',
    region: 'international',
    pricePKR: null,
    priceNote: 'No quote on device',
    changePct: null,
    fetchedAtIsoUtc: '',
    source: 'none',
    fresh: false,
  },
];

const REPLY = [
  '[Warren Buffett] The snapshot records KSE-100 at 162,374.87 with a change of -0.95% and labels the row live.',
  'The gold row is cached, so its number comes from 22:10 rather than now.',
  '[R.F. Habib] The Brent row carries no quote on this device, so the council cannot read it.',
  'The PKR row states the exchange rate at the recorded time.',
  '[Michael Burry] The snapshot has one row with no data and two rows with a stated change.',
  'The freshness labels are the only part of the record that is certain.',
  '[Synthesis] All three voices read the same rows; they differ only in which label they treat as decisive.',
].join('\n');

const SYNTHESIS_LINE = 'All three voices read the same rows; they differ only in which label they treat as decisive.';

function memoryCache(clock: () => number) {
  const store = new Map<string, CouncilCacheEntry>();
  return {
    store,
    readCache: async (key: string) => {
      const entry = store.get(key);
      return entry && isCouncilCacheFresh(entry.t, clock()) ? entry : null;
    },
    writeCache: async (key: string, entry: CouncilCacheEntry) => {
      store.set(key, entry);
    },
  };
}

function recordingAsk(text: string) {
  const calls: AskOptions[] = [];
  const ask = async (options: AskOptions) => {
    calls.push(options);
    return { text, provider: 'gemini' as const, cached: false, failedProviders: [] };
  };
  return { calls, ask };
}

test('snapshot: every row states value, change, freshness and source — and no direction', () => {
  const snapshot = buildContextSnapshot(QUOTES, NOW);

  assert.doesNotMatch(snapshot, DIRECTION);
  assert.match(snapshot, /KSE-100 \(KSE100\.KAR\): 162,374\.87/);
  assert.match(snapshot, /change -0\.95%/);
  assert.match(snapshot, /live/);
  assert.match(snapshot, /cached \d\d:\d\d/);
  assert.match(snapshot, /no data/);
  assert.match(snapshot, /Brent \(BZ=F\): no quote on device/);
  assert.match(snapshot, /source PSX DPS indices/);
  assert.match(snapshot, new RegExp(new Date(NOW).toISOString().replace(/\./g, '\\.')));

  const rows = snapshot.split('\n');
  assert.equal(rows.length, QUOTES.length + 1);
});

test('snapshot: the same quotes and clock always produce the same text', () => {
  assert.equal(buildContextSnapshot(QUOTES, NOW), buildContextSnapshot(QUOTES, NOW));
});

test('snapshot: a missing quote is labelled, never blanked out', () => {
  const snapshot = buildContextSnapshot(
    [{ ...QUOTES[2], priceNote: null }],
    NOW
  );
  assert.match(snapshot, /Brent \(BZ=F\): no quote on device/);
  assert.match(snapshot, /change —/);
  assert.match(snapshot, /no data/);
  assert.doesNotMatch(snapshot, DIRECTION);
});

test('council: first read calls the model once, the second read is served from the 24h cache', async () => {
  const snapshot = buildContextSnapshot(QUOTES, NOW);
  let clock = NOW;
  const cache = memoryCache(() => clock);
  const { calls, ask } = recordingAsk(REPLY);

  const first = await requestCouncilNote(snapshot, COUNCIL_PERSONAS, { now: clock, ask, ...cache });

  assert.equal(calls.length, 1);
  assert.equal(calls[0].useCache, false);
  assert.equal(calls[0].timeoutMs, 15_000);
  assert.match(calls[0].messages[0].content, /Market state snapshot/);
  assert.ok(first);
  assert.equal(first?.cached, false);
  assert.equal(first?.provider, 'gemini');
  assert.equal(first?.notes.length, COUNCIL_PERSONAS.length);
  assert.equal(first?.synthesis, SYNTHESIS_LINE);
  assert.equal(first?.disclaimer, COUNCIL_DISCLAIMER);
  assert.equal(cache.store.size, 1);

  clock = NOW + 60_000;
  const second = await requestCouncilNote(snapshot, COUNCIL_PERSONAS, { now: clock, ask, ...cache });

  assert.equal(calls.length, 1);
  assert.equal(second?.cached, true);
  assert.deepEqual(
    second?.notes.map((note) => note.by),
    first?.notes.map((note) => note.by)
  );
});

test('council: the cache rebuilds itself once the snapshot entry is a day old', async () => {
  const snapshot = buildContextSnapshot(QUOTES, NOW);
  let clock = NOW;
  const cache = memoryCache(() => clock);
  const { calls, ask } = recordingAsk(REPLY);

  await requestCouncilNote(snapshot, COUNCIL_PERSONAS, { now: clock, ask, ...cache });
  clock = NOW + COUNCIL_CACHE_TTL_MS + 1;
  const rebuilt = await requestCouncilNote(snapshot, COUNCIL_PERSONAS, { now: clock, ask, ...cache });

  assert.equal(calls.length, 2);
  assert.equal(rebuilt?.cached, false);
  assert.equal(cache.store.size, 1);
  assert.equal(isCouncilCacheFresh(NOW, NOW + COUNCIL_CACHE_TTL_MS), true);
});

test('council: a different snapshot does not read another snapshot’s cache row', async () => {
  const cache = memoryCache(() => NOW);
  const { calls, ask } = recordingAsk(REPLY);

  const first = buildContextSnapshot(QUOTES, NOW);
  const second = buildContextSnapshot(QUOTES, NOW + 60_000);

  await requestCouncilNote(first, COUNCIL_PERSONAS, { now: NOW, ask, ...cache });
  await requestCouncilNote(second, COUNCIL_PERSONAS, { now: NOW, ask, ...cache });

  assert.equal(calls.length, 2);
  assert.equal(cache.store.size, 2);
});

test('council: no provider leaves the static block standing — null, nothing cached', async () => {
  const snapshot = buildContextSnapshot(QUOTES, NOW);
  const cache = memoryCache(() => NOW);

  const result = await requestCouncilNote(snapshot, COUNCIL_PERSONAS, {
    now: NOW,
    ask: async () => {
      throw new Error('All AI providers failed — Google Gemini: HTTP 503 · Groq: HTTP 429');
    },
    ...cache,
  });

  assert.equal(result, null);
  assert.equal(cache.store.size, 0);
});

test('council: an unattributable reply is dropped rather than shown unattributed', async () => {
  const snapshot = buildContextSnapshot(QUOTES, NOW);
  const cache = memoryCache(() => NOW);

  const result = await requestCouncilNote(snapshot, COUNCIL_PERSONAS, {
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

test('council: every note is attributed, guarded, and free of direction', async () => {
  const snapshot = buildContextSnapshot(QUOTES, NOW);
  const { ask } = recordingAsk(REPLY);
  const result = await requestCouncilNote(snapshot, COUNCIL_PERSONAS, {
    now: NOW,
    ask,
    ...memoryCache(() => NOW),
  });

  assert.ok(result);
  for (const note of result.notes) {
    assert.ok(note.by.length > 0);
    assert.equal(note.org, 'Council');
    assert.match(note.initials, /^[A-Z]{2}$/);
    assert.doesNotMatch(note.text, DIRECTION);
  }
  assert.doesNotMatch(result.synthesis, DIRECTION);
  assert.equal(result.notes[0].by, 'Warren Buffett');
  assert.equal(result.notes[0].initials, 'WB');
  assert.equal(result.notes[1].by, 'R.F. Habib');
  assert.equal(result.notes[1].initials, 'RH');
});

test('council: a directive in the reply gets the standing correction appended', async () => {
  const snapshot = buildContextSnapshot(QUOTES, NOW);
  const { ask } = recordingAsk('[Warren Buffett] You should buy more of it now.');
  const result = await requestCouncilNote(snapshot, COUNCIL_PERSONAS, {
    now: NOW,
    ask,
    ...memoryCache(() => NOW),
  });

  assert.ok(result);
  assert.equal(result.notes.length, 1);
  assert.match(result.notes[0].text, /cannot tell you to/);
});

test('council: an invented voice is dropped and a missing synthesis gets the factual fallback', () => {
  const parsed = parseCouncilReply(
    '[Warren Buffett] The snapshot labels the KSE-100 row live.\n[Nostradamus] The snapshot is a secret.',
    COUNCIL_PERSONAS
  );

  assert.ok(parsed);
  assert.equal(parsed.notes.length, 1);
  assert.equal(parsed.notes[0].by, 'Warren Buffett');
  assert.match(parsed.synthesis, /differ in emphasis/);
  assert.doesNotMatch(parsed.synthesis, DIRECTION);
});

test('council: the two card chips are the visible state contract', () => {
  assert.equal(COUNCIL_LIVE_CHIP, 'live council');
  assert.equal(COUNCIL_STATIC_CHIP, 'static sample');
});
