/**
 * One batched LLM call turns the day's headlines into informational one-liners.
 *
 * Every story shares a single call — cheap on a free tier and one round trip
 * instead of five. The model reports what a headline says and nothing else: no
 * direction, no outlook, no price objective. When the call fails the stories
 * stay raw on screen behind an offline chip, never silently blanked.
 */

import type { AskOptions, AskResult } from './llmService';
import type { ProviderId } from './providers';
import type { NewsStory } from './newsService';
import { enforceNoDirective } from './personaService.ts';

export const NEWS_SUMMARY_CACHE_PREFIX = 'news_summary_cache_';
export const NEWS_SUMMARY_TTL_MS = 15 * 60 * 1000;
export const NEWS_SUMMARY_MAX_CHARS = 90;
export const NEWS_FUSE_TIMEOUT_MS = 20_000;
export const SUMMARIES_OFFLINE_CHIP = 'Summaries offline';
export const NEWS_CONTRACT = 'Not investment advice';

export interface NewsFuseCacheEntry {
  t: number;
  summaries: string[];
  provider: ProviderId | null;
}

export interface NewsFuseResult {
  summaries: string[];
  provider: ProviderId | null;
  cached: boolean;
  offline: boolean;
  disclaimer: string;
}

export interface NewsFuseDeps {
  ask?: (options: AskOptions) => Promise<AskResult>;
  now?: number;
  readCache?: (key: string) => Promise<NewsFuseCacheEntry | null>;
  writeCache?: (key: string, entry: NewsFuseCacheEntry) => Promise<void>;
  timeoutMs?: number;
}

export function buildSummarySystemPrompt(): string {
  return [
    'You write one-line news summaries for Rahnuma, a Pakistani personal-finance app.',
    '',
    'Rules you must never break:',
    '- Informational one-liner only: state what the headline reports, in plain English.',
    '- No recommendation, no forecast, no direction, no prediction, no price objective.',
    '- Add no figure that is absent from the headline.',
    '- At most 90 characters per line. No exclamation marks, no dramatic adjectives.',
    '- Never address the reader and never suggest an action.',
    '',
    'Reply with exactly one numbered line per story, in input order, and nothing else:',
    '1. <one-line summary>',
    '2. <one-line summary>',
    'No preamble, no heading, no closing note.',
  ].join('\n');
}

export function buildSummaryUserPrompt(stories: NewsStory[]): string {
  return stories
    .map((story, index) => `${index + 1}. ${story.title} (${story.source || 'unknown source'})`)
    .join('\n');
}

// 90 characters is the contract the card renders under. A cut summary keeps
// its opening meaning and ends on an ellipsis rather than mid-word.
export function cleanSummary(text: string): string {
  const flat = text
    .replace(/^[-•*]\s*/, '')
    .replace(/\s+/g, ' ')
    .trim();
  if (!flat) return '';
  if (enforceNoDirective(flat).violated) return '';
  if (flat.length <= NEWS_SUMMARY_MAX_CHARS) return flat;
  return `${flat.slice(0, NEWS_SUMMARY_MAX_CHARS - 1).trimEnd()}…`;
}

export function parseSummaryReply(reply: string, count: number): string[] | null {
  if (typeof reply !== 'string' || reply.trim().length === 0 || count <= 0) return null;

  const summaries = new Array<string>(count).fill('');
  const line = /^\s*(\d{1,2})[.)]\s+(.+?)\s*$/;
  let found = 0;

  for (const raw of reply.split(/\r?\n/)) {
    const match = line.exec(raw);
    if (!match) continue;
    const index = Number(match[1]) - 1;
    if (index < 0 || index >= count) continue;
    if (summaries[index]) continue;
    const text = cleanSummary(match[2]);
    if (!text) continue;
    summaries[index] = text;
    found++;
  }

  return found === 0 ? null : summaries;
}

export function summaryHash(stories: NewsStory[]): string {
  const input = stories.map((story) => story.key || story.title).join('\u0001');
  let hash = 5381;
  for (let i = 0; i < input.length; i++) {
    hash = ((hash << 5) + hash + input.charCodeAt(i)) | 0;
  }
  return (hash >>> 0).toString(36);
}

export function isSummaryCacheFresh(t: number, now: number = Date.now()): boolean {
  if (!Number.isFinite(t)) return false;
  const age = now - t;
  return age >= 0 && age <= NEWS_SUMMARY_TTL_MS;
}

export function alignSummaries(summaries: string[], count: number): string[] {
  return new Array<string>(count).fill('').map((_, index) => summaries[index] ?? '');
}

async function readStoredCache(key: string, now: number): Promise<NewsFuseCacheEntry | null> {
  try {
    const { getSetting } = await import('../database/db');
    const raw = await getSetting(key);
    if (!raw) return null;
    const entry = JSON.parse(raw) as Partial<NewsFuseCacheEntry>;
    if (typeof entry.t !== 'number' || !Array.isArray(entry.summaries)) return null;
    if (!isSummaryCacheFresh(entry.t, now)) return null;
    return {
      t: entry.t,
      summaries: entry.summaries.filter((line): line is string => typeof line === 'string'),
      provider: entry.provider ?? null,
    };
  } catch {
    return null;
  }
}

async function writeStoredCache(key: string, entry: NewsFuseCacheEntry): Promise<void> {
  try {
    const { setSetting } = await import('../database/db');
    await setSetting(key, JSON.stringify(entry));
  } catch {
    // A cache write failure must never break a successful summary pass.
  }
}

export async function summarizeStories(
  stories: NewsStory[],
  deps: NewsFuseDeps = {}
): Promise<NewsFuseResult> {
  const now = deps.now ?? Date.now();
  const empty: NewsFuseResult = {
    summaries: new Array<string>(stories.length).fill(''),
    provider: null,
    cached: false,
    offline: false,
    disclaimer: NEWS_CONTRACT,
  };
  if (stories.length === 0) return empty;

  const key = NEWS_SUMMARY_CACHE_PREFIX + summaryHash(stories);
  const readCache = deps.readCache ?? ((cacheKey: string) => readStoredCache(cacheKey, now));
  const cached = await readCache(key).catch(() => null);

  if (cached && isSummaryCacheFresh(cached.t, now)) {
    return {
      ...empty,
      summaries: alignSummaries(cached.summaries, stories.length),
      provider: cached.provider,
      cached: true,
    };
  }

  try {
    const ask = deps.ask ?? (await import('./llmService')).askAdvisor;
    const answer = await ask({
      systemPrompt: buildSummarySystemPrompt(),
      messages: [{ role: 'user', content: buildSummaryUserPrompt(stories) }],
      useCache: false,
      timeoutMs: deps.timeoutMs ?? NEWS_FUSE_TIMEOUT_MS,
    });

    const parsed = parseSummaryReply(answer.text, stories.length);
    if (!parsed) return { ...empty, offline: true };

    const writeCache = deps.writeCache ?? writeStoredCache;
    await writeCache(key, { t: now, summaries: parsed, provider: answer.provider }).catch(
      () => undefined
    );

    return { ...empty, summaries: parsed, provider: answer.provider };
  } catch {
    return { ...empty, offline: true };
  }
}
