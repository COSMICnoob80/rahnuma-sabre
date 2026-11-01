/**
 * Curated news layer for the Command Center.
 *
 * Google News RSS is free and keyless. A story keeps its own headline, source
 * and published time — this layer never rewrites them. Parsing, merging,
 * freshness and age labels are pure so the tests run without a network; only
 * `fetchNews` touches the feed, and one slow query can never stall the screen.
 */

export interface NewsStory {
  key: string;
  title: string;
  link: string;
  source: string;
  query: string;
  publishedAtMs: number;
  publishedAtIso: string;
}

export type NewsSourceStatus = 'live' | 'stale' | 'failed';

export interface NewsFeedSource {
  query: string;
  status: NewsSourceStatus;
  stories: number;
}

export interface NewsFeedResult {
  stories: NewsStory[];
  sources: NewsFeedSource[];
  cached: boolean;
  fetchedAt: number;
}

export interface NewsCacheEntry {
  t: number;
  stories: NewsStory[];
}

export const NEWS_CACHE_PREFIX = 'news_cache_';
export const NEWS_CACHE_TTL_MS = 15 * 60 * 1000;
export const NEWS_MAX_STORIES = 12;
export const NEWS_FETCH_TIMEOUT_MS = 8_000;

export const NEWS_QUERIES: string[] = [
  'Pakistan economy',
  'Pakistan stock exchange',
  'gold price',
  'Brent oil',
  'Pakistani rupee',
  'Pakistan geopolitics',
];

const BROWSER_UA =
  'Mozilla/5.0 (Linux; Android 10) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/124.0 Mobile Safari/537.36';

export function googleNewsRssUrl(query: string): string {
  const q = encodeURIComponent(query.trim());
  return `https://news.google.com/rss/search?q=${q}&hl=en-PK&gl=PK&ceid=PK:en`;
}

const ENTITIES: Record<string, string> = {
  amp: '&',
  lt: '<',
  gt: '>',
  quot: '"',
  apos: "'",
  nbsp: ' ',
};

export function decodeEntities(value: string): string {
  return value.replace(/&(#[xX]?[0-9a-fA-F]+|[a-zA-Z]+);/g, (whole, body: string) => {
    if (body.charAt(0) === '#') {
      const hex = body.charAt(1) === 'x' || body.charAt(1) === 'X';
      const code = Number.parseInt(hex ? body.slice(2) : body.slice(1), hex ? 16 : 10);
      return Number.isFinite(code) ? String.fromCodePoint(code) : whole;
    }
    return ENTITIES[body] ?? whole;
  });
}

// RSS mixes CDATA, inline markup and entities in the same field. One pass
// unwraps CDATA, drops tags, decodes entities and flattens whitespace.
export function cleanText(value: string): string {
  return decodeEntities(
    value
      .replace(/<!\[CDATA\[([\s\S]*?)\]\]>/g, '$1')
      .replace(/<[^>]*>/g, ' ')
  )
    .replace(/\s+/g, ' ')
    .trim();
}

function field(block: string, tag: string): string {
  const match = new RegExp(`<${tag}\\b[^>]*>([\\s\\S]*?)</${tag}>`, 'i').exec(block);
  return match ? cleanText(match[1]) : '';
}

// Google News puts "Headline - Publisher" in the title. The publisher is only
// used when the item carries no <source> element.
function sourceFromTitle(title: string): string {
  const dash = title.lastIndexOf(' - ');
  return dash > 0 ? title.slice(dash + 3).trim() : '';
}

export function parseGoogleNewsRss(xml: string, query: string): NewsStory[] {
  if (typeof xml !== 'string' || xml.length === 0) return [];

  const stories: NewsStory[] = [];
  const item = /<item\b[^>]*>([\s\S]*?)<\/item>/gi;
  let match: RegExpExecArray | null;
  while ((match = item.exec(xml)) !== null) {
    const block = match[1];
    const title = field(block, 'title');
    if (!title) continue;

    const link = field(block, 'link');
    const source = field(block, 'source') || sourceFromTitle(title) || query;
    const rawDate = field(block, 'pubDate');
    const parsedMs = rawDate ? Date.parse(rawDate) : Number.NaN;
    const publishedAtMs = Number.isFinite(parsedMs) ? parsedMs : Number.NaN;

    stories.push({
      key: link || `${query}:${title.toLowerCase()}`,
      title,
      link,
      source,
      query,
      publishedAtMs,
      publishedAtIso: Number.isFinite(parsedMs) ? new Date(parsedMs).toISOString() : '',
    });
  }
  return stories;
}

// Freshest first. Duplicates arrive because the curated queries overlap — the
// link is the identity when there is one, the headline otherwise. Stories with
// an unreadable date sink to the bottom instead of jumping to the top.
export function mergeStories(groups: NewsStory[][], cap: number = NEWS_MAX_STORIES): NewsStory[] {
  const seen = new Set<string>();
  const merged: NewsStory[] = [];

  for (const story of groups.flat()) {
    if (!story.title) continue;
    const identity = (story.link || story.title).trim().toLowerCase();
    if (seen.has(identity)) continue;
    seen.add(identity);
    merged.push(story);
  }

  merged.sort((a, b) => {
    const aTime = Number.isFinite(a.publishedAtMs) ? a.publishedAtMs : -Infinity;
    const bTime = Number.isFinite(b.publishedAtMs) ? b.publishedAtMs : -Infinity;
    if (aTime === bTime) return 0;
    return bTime - aTime;
  });

  return merged.slice(0, cap);
}

export function storyAge(publishedAtMs: number, now: number = Date.now()): string {
  if (!Number.isFinite(publishedAtMs)) return 'time unknown';
  const age = now - publishedAtMs;
  if (!Number.isFinite(age) || age < 60_000) return 'just now';
  const minutes = Math.floor(age / 60_000);
  if (minutes < 60) return `${minutes}m ago`;
  const hours = Math.floor(minutes / 60);
  if (hours < 24) return `${hours}h ago`;
  return `${Math.floor(hours / 24)}d ago`;
}

export function newsCacheKey(queries: string[] = NEWS_QUERIES): string {
  const input = queries.join('\u0000');
  let hash = 5381;
  for (let i = 0; i < input.length; i++) {
    hash = ((hash << 5) + hash + input.charCodeAt(i)) | 0;
  }
  return NEWS_CACHE_PREFIX + (hash >>> 0).toString(36);
}

export function isNewsCacheFresh(t: number, now: number = Date.now()): boolean {
  if (!Number.isFinite(t)) return false;
  const age = now - t;
  return age >= 0 && age <= NEWS_CACHE_TTL_MS;
}

// A query that accepts the connection and then stalls must not hold the strip.
export function withTimeout<T>(promise: Promise<T>, ms: number, fallback: T): Promise<T> {
  return Promise.race([
    promise.catch(() => fallback),
    new Promise<T>((resolve) => setTimeout(() => resolve(fallback), ms)),
  ]);
}

export async function fetchNewsText(
  url: string,
  timeoutMs: number = NEWS_FETCH_TIMEOUT_MS
): Promise<string | null> {
  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), timeoutMs);
  try {
    const response = await fetch(url, {
      headers: {
        'User-Agent': BROWSER_UA,
        Accept: 'application/rss+xml,application/xml,text/xml,*/*',
      },
      signal: controller.signal,
    });
    if (!response.ok) return null;
    return await response.text();
  } catch {
    return null;
  } finally {
    clearTimeout(timer);
  }
}

export interface NewsDeps {
  now?: number;
  queries?: string[];
  readCache?: (key: string) => Promise<NewsCacheEntry | null>;
  writeCache?: (key: string, entry: NewsCacheEntry) => Promise<void>;
  fetchText?: (url: string) => Promise<string | null>;
  timeoutMs?: number;
}

async function readStoredCache(key: string, now: number): Promise<NewsCacheEntry | null> {
  try {
    const { getSetting } = await import('../database/db');
    const raw = await getSetting(key);
    if (!raw) return null;
    const entry = JSON.parse(raw) as Partial<NewsCacheEntry>;
    if (typeof entry.t !== 'number' || !Array.isArray(entry.stories)) return null;
    if (!isNewsCacheFresh(entry.t, now)) return null;
    return { t: entry.t, stories: entry.stories };
  } catch {
    return null;
  }
}

async function writeStoredCache(key: string, entry: NewsCacheEntry): Promise<void> {
  try {
    const { setSetting } = await import('../database/db');
    await setSetting(key, JSON.stringify(entry));
  } catch {
    // A cache write failure must never break a fetch that already succeeded.
  }
}

export async function fetchNews(deps: NewsDeps = {}): Promise<NewsFeedResult> {
  const now = deps.now ?? Date.now();
  const queries = deps.queries ?? NEWS_QUERIES;
  const timeoutMs = deps.timeoutMs ?? NEWS_FETCH_TIMEOUT_MS;
  const key = newsCacheKey(queries);
  const readCache = deps.readCache ?? ((cacheKey: string) => readStoredCache(cacheKey, now));

  const cached = await readCache(key).catch(() => null);
  if (cached && isNewsCacheFresh(cached.t, now)) {
    return {
      stories: cached.stories,
      // Served from the on-device cache: no feed answered in this session, so
      // every source is labelled stale rather than live.
      sources: queries.map((query) => ({
        query,
        status: 'stale' as const,
        stories: cached.stories.filter((story) => story.query === query).length,
      })),
      cached: true,
      fetchedAt: cached.t,
    };
  }

  const fetchText = deps.fetchText ?? ((url: string) => fetchNewsText(url, timeoutMs));

  const attempts = await Promise.all(
    queries.map(async (query) => {
      const body = await withTimeout(fetchText(googleNewsRssUrl(query)), timeoutMs, null);
      const stories = body ? parseGoogleNewsRss(body, query) : [];
      return { query, stories };
    })
  );

  const stories = mergeStories(attempts.map((attempt) => attempt.stories));
  const sources: NewsFeedSource[] = attempts.map((attempt) => ({
    query: attempt.query,
    status: attempt.stories.length > 0 ? 'live' : 'failed',
    stories: attempt.stories.length,
  }));

  if (stories.length > 0) {
    const writeCache = deps.writeCache ?? writeStoredCache;
    await writeCache(key, { t: now, stories }).catch(() => undefined);
  }

  return { stories, sources, cached: false, fetchedAt: now };
}
