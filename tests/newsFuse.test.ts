import { test } from 'node:test';
import assert from 'node:assert/strict';
import {
  NEWS_SUMMARY_MAX_CHARS,
  NEWS_SUMMARY_TTL_MS,
  SUMMARIES_OFFLINE_CHIP,
  buildSummarySystemPrompt,
  buildSummaryUserPrompt,
  cleanSummary,
  isSummaryCacheFresh,
  parseSummaryReply,
  summarizeStories,
  summaryHash,
} from '../src/services/newsFuse.ts';
import type { NewsFuseCacheEntry } from '../src/services/newsFuse.ts';
import type { NewsStory } from '../src/services/newsService.ts';
import type { AskOptions, AskResult } from '../src/services/llmService.ts';

// The red-line wording this app never emits. The summarizer prompt itself is
// held to it just like a model reply.
const BANNED = /will (rise|fall)|target price|\bbuy\b|\bsell\b/i;

const NOW = Date.parse('2026-11-01T06:00:00.000Z');

const STORIES: NewsStory[] = [
  {
    key: 'https://example.test/1',
    title: 'SBP holds policy rate at 11% - Dawn',
    link: 'https://example.test/1',
    source: 'Dawn',
    query: 'Pakistan economy',
    publishedAtMs: NOW - 60_000,
    publishedAtIso: '2026-11-01T05:59:00.000Z',
  },
  {
    key: 'https://example.test/2',
    title: 'Rupee settles at 281.35 - The Express Tribune',
    link: 'https://example.test/2',
    source: 'The Express Tribune',
    query: 'Pakistani rupee',
    publishedAtMs: NOW - 90 * 60_000,
    publishedAtIso: '2026-11-01T04:30:00.000Z',
  },
  {
    key: 'https://example.test/3',
    title: 'Trade data shows wider monthly deficit - Business Recorder',
    link: 'https://example.test/3',
    source: 'Business Recorder',
    query: 'Pakistan economy',
    publishedAtMs: NOW - 5 * 60 * 60_000,
    publishedAtIso: '2026-11-01T01:00:00.000Z',
  },
];

const REPLY = [
  '1. SBP kept the policy rate at 11%, Dawn reports.',
  '2. The rupee settled at 281.35 against the dollar in interbank trade.',
  '3. Trade data showed a wider monthly deficit, the paper reports.',
].join('\n');

function askReturning(text: string, calls: AskOptions[] = []): (options: AskOptions) => Promise<AskResult> {
  return async (options) => {
    calls.push(options);
    return { text, provider: 'groq', cached: false, failedProviders: [] };
  };
}

test('newsFuse: prompt is informational only and carries no direction wording', () => {
  const prompt = buildSummarySystemPrompt();
  assert.match(prompt, /informational one-liner only/i);
  assert.match(prompt, /never address the reader/i);
  assert.equal(BANNED.test(prompt), false);
  assert.equal(/recommend|forecast|prediction/i.test(prompt), true);
});

test('newsFuse: user prompt numbers every story to match the reply', () => {
  const prompt = buildSummaryUserPrompt(STORIES);
  const lines = prompt.split('\n');
  assert.equal(lines.length, 3);
  assert.ok(lines[0].startsWith('1. SBP holds policy rate'));
  assert.ok(lines[2].startsWith('3. Trade data shows'));
  assert.match(lines[1], /The Express Tribune\)$/);
});

test('newsFuse: numbered reply parses into per-story lines', () => {
  const parsed = parseSummaryReply(REPLY, 3);
  assert.ok(parsed);
  assert.equal(parsed.length, 3);
  assert.equal(parsed[0], 'SBP kept the policy rate at 11%, Dawn reports.');
  assert.equal(parsed[2], 'Trade data showed a wider monthly deficit, the paper reports.');
});

test('newsFuse: reply parsing ignores junk, out-of-range numbers and keeps the first line', () => {
  const reply = [
    'Here are your summaries:',
    '1. First reading of the story.',
    '1. A second attempt at the same story.',
    '9. Beyond the story count.',
    'no number here',
  ].join('\n');
  const parsed = parseSummaryReply(reply, 3);
  assert.ok(parsed);
  assert.equal(parsed[0], 'First reading of the story.');
  assert.equal(parsed[1], '');
  assert.equal(parsed[2], '');
  assert.equal(parseSummaryReply('', 3), null);
  assert.equal(parseSummaryReply('nothing numbered', 3), null);
});

test('newsFuse: a summary is capped at 90 characters with an ellipsis', () => {
  const long = `${'Rupee trade data '.repeat(12)}reported.`;
  const capped = cleanSummary(long);
  assert.equal(capped.length, NEWS_SUMMARY_MAX_CHARS);
  assert.ok(capped.endsWith('…'));
});

test('newsFuse: a directive sentence is dropped, not rewritten', () => {
  assert.equal(cleanSummary('You should sell it now before the close.'), '');
  assert.equal(cleanSummary('Dawn reports the rate was held.'), 'Dawn reports the rate was held.');
});

test('newsFuse: one call summarises every story and is cached for fifteen minutes', async () => {
  const calls: AskOptions[] = [];
  let written: NewsFuseCacheEntry | null = null;

  const first = await summarizeStories(STORIES, {
    now: NOW,
    ask: askReturning(REPLY, calls),
    readCache: async () => null,
    writeCache: async (_key, entry) => {
      written = entry;
    },
  });

  assert.equal(calls.length, 1);
  assert.equal(calls[0].useCache, false);
  assert.equal(first.offline, false);
  assert.equal(first.cached, false);
  assert.equal(first.provider, 'groq');
  assert.deepEqual(first.summaries, parseSummaryReply(REPLY, 3));
  assert.ok(written);
  assert.equal(written.t, NOW);

  let secondCalls = 0;
  const second = await summarizeStories(STORIES, {
    now: NOW + 60_000,
    ask: async () => {
      secondCalls++;
      throw new Error('must not be called');
    },
    readCache: async () => written,
  });

  assert.equal(secondCalls, 0);
  assert.equal(second.cached, true);
  assert.deepEqual(second.summaries, first.summaries);
  assert.equal(SUMMARIES_OFFLINE_CHIP, 'Summaries offline');
});

test('newsFuse: an expired summary cache is not reused', async () => {
  let calls = 0;
  const result = await summarizeStories(STORIES, {
    now: NOW,
    ask: async () => {
      calls++;
      return { text: REPLY, provider: 'gemini', cached: false, failedProviders: [] };
    },
    readCache: async () => ({ t: NOW - NEWS_SUMMARY_TTL_MS - 1, summaries: ['old'], provider: 'groq' }),
    writeCache: async () => undefined,
  });

  assert.equal(calls, 1);
  assert.equal(result.cached, false);
  assert.equal(result.provider, 'gemini');
  assert.equal(isSummaryCacheFresh(NOW - NEWS_SUMMARY_TTL_MS - 1, NOW), false);
  assert.equal(isSummaryCacheFresh(NOW - 60_000, NOW), true);
});

test('newsFuse: a failed call leaves stories raw and flags summaries offline', async () => {
  const result = await summarizeStories(STORIES, {
    now: NOW,
    ask: async () => {
      throw new Error('All AI providers failed');
    },
    readCache: async () => null,
  });

  assert.equal(result.offline, true);
  assert.equal(result.provider, null);
  assert.deepEqual(result.summaries, ['', '', '']);
  assert.equal(result.summaries.length, STORIES.length);
});

test('newsFuse: no stories means no call at all', async () => {
  let calls = 0;
  const result = await summarizeStories([], {
    now: NOW,
    ask: async () => {
      calls++;
      return { text: REPLY, provider: 'groq', cached: false, failedProviders: [] };
    },
    readCache: async () => null,
  });

  assert.equal(calls, 0);
  assert.equal(result.offline, false);
  assert.deepEqual(result.summaries, []);
});

test('newsFuse: cache hash is stable and changes with the story set', () => {
  assert.equal(summaryHash(STORIES), summaryHash(STORIES));
  assert.notEqual(summaryHash(STORIES), summaryHash(STORIES.slice(0, 2)));
});
