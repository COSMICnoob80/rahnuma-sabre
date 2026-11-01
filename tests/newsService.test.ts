import { test } from 'node:test';
import assert from 'node:assert/strict';
import {
  NEWS_CACHE_TTL_MS,
  NEWS_MAX_STORIES,
  fetchNews,
  googleNewsRssUrl,
  isNewsCacheFresh,
  mergeStories,
  newsCacheKey,
  parseGoogleNewsRss,
  storyAge,
  withTimeout,
} from '../src/services/newsService.ts';
import type { NewsStory } from '../src/services/newsService.ts';

const NOW = Date.parse('2026-11-01T06:00:00.000Z');

// Shape captured from a Google News RSS response: CDATA headline, entity in a
// headline, CDATA link, an item with no <source>, and an item with no title.
const RSS = `<?xml version="1.0" encoding="UTF-8"?>
<rss version="2.0"><channel>
  <title>Pakistan economy - Google News</title>
  <item>
    <title><![CDATA[SBP holds policy rate at 11% - Dawn]]></title>
    <link>https://news.google.com/rss/articles/AAA?oc=5</link>
    <pubDate>Sun, 01 Nov 2026 04:30:00 GMT</pubDate>
    <source url="https://www.dawn.com">Dawn</source>
  </item>
  <item>
    <title>Rupee settles at 281.35 &amp; holds - The Express Tribune</title>
    <link><![CDATA[https://news.google.com/rss/articles/BBB?oc=5]]></link>
    <pubDate>Sat, 31 Oct 2026 18:05:00 GMT</pubDate>
  </item>
  <item>
    <title>   </title>
    <link>https://news.google.com/rss/articles/CCC?oc=5</link>
    <pubDate>Sat, 31 Oct 2026 12:00:00 GMT</pubDate>
  </item>
</channel></rss>`;

function story(overrides: Partial<NewsStory> = {}): NewsStory {
  return {
    key: 'https://example.test/a',
    title: 'A headline',
    link: 'https://example.test/a',
    source: 'Test Wire',
    query: 'Pakistan economy',
    publishedAtMs: NOW - 60_000,
    publishedAtIso: new Date(NOW - 60_000).toISOString(),
    ...overrides,
  };
}

test('news: RSS items parse into structured stories', () => {
  const stories = parseGoogleNewsRss(RSS, 'Pakistan economy');
  assert.equal(stories.length, 2);
  assert.equal(stories[0].title, 'SBP holds policy rate at 11% - Dawn');
  assert.equal(stories[0].link, 'https://news.google.com/rss/articles/AAA?oc=5');
  assert.equal(stories[0].source, 'Dawn');
  assert.equal(stories[0].publishedAtIso, '2026-11-01T04:30:00.000Z');
  assert.equal(stories[0].query, 'Pakistan economy');
  assert.equal(stories[1].title, 'Rupee settles at 281.35 & holds - The Express Tribune');
  assert.equal(stories[1].link, 'https://news.google.com/rss/articles/BBB?oc=5');
  assert.equal(stories[1].source, 'The Express Tribune');
});

test('news: malformed XML yields no stories and never throws', () => {
  assert.deepEqual(parseGoogleNewsRss('', 'gold price'), []);
  assert.deepEqual(parseGoogleNewsRss('<rss><channel>broken</channel></rss>', 'gold price'), []);
  assert.deepEqual(parseGoogleNewsRss(undefined as unknown as string, 'gold price'), []);
});

test('news: merge dedupes, sorts freshest first and caps the list', () => {
  const older = story({ key: 'b', link: 'b', publishedAtMs: NOW - 9 * 60_000 });
  const newest = story({ key: 'a', link: 'a', publishedAtMs: NOW - 60_000 });
  const duplicate = story({ key: 'a', link: 'a', title: 'A duplicate', publishedAtMs: NOW });
  const undated = story({ key: 'c', link: 'c', publishedAtMs: Number.NaN });

  const merged = mergeStories([[older, newest], [duplicate, undated]]);
  assert.deepEqual(
    merged.map((item) => item.key),
    ['a', 'b', 'c']
  );
  assert.equal(merged[0].title, 'A headline');
});

test('news: cap defaults to twelve stories', () => {
  const many = Array.from({ length: 20 }, (_, index) =>
    story({ key: `k${index}`, link: `k${index}`, publishedAtMs: NOW - index * 1000 })
  );
  assert.equal(mergeStories([many]).length, NEWS_MAX_STORIES);
});

test('news: cache is fresh inside the window and stale after it', () => {
  assert.equal(isNewsCacheFresh(NOW - 5 * 60_000, NOW), true);
  assert.equal(isNewsCacheFresh(NOW - NEWS_CACHE_TTL_MS, NOW), true);
  assert.equal(isNewsCacheFresh(NOW - NEWS_CACHE_TTL_MS - 1000, NOW), false);
  assert.equal(isNewsCacheFresh(NOW + 60_000, NOW), false);
  assert.equal(isNewsCacheFresh(Number.NaN, NOW), false);
});

test('news: cache key is stable per query set', () => {
  assert.equal(newsCacheKey(undefined), newsCacheKey());
  assert.notEqual(newsCacheKey(['gold price']), newsCacheKey(['Brent oil']));
  assert.match(googleNewsRssUrl('gold price'), /^https:\/\/news\.google\.com\/rss\/search\?/);
  assert.match(googleNewsRssUrl('gold price'), /gold%20price/);
});

test('news: a fresh cache entry is returned without touching the network', async () => {
  const cachedStories = parseGoogleNewsRss(RSS, 'Pakistan economy');
  let fetched = 0;
  const result = await fetchNews({
    now: NOW,
    queries: ['Pakistan economy', 'gold price'],
    readCache: async () => ({ t: NOW - 60_000, stories: cachedStories }),
    fetchText: async () => {
      fetched++;
      return null;
    },
  });

  assert.equal(fetched, 0);
  assert.equal(result.cached, true);
  assert.equal(result.stories.length, 2);
  assert.deepEqual(
    result.sources.map((source) => source.status),
    ['stale', 'stale']
  );
});

test('news: an expired cache entry is refetched and rewritten', async () => {
  const written: { key: string; t: number }[] = [];
  const result = await fetchNews({
    now: NOW,
    queries: ['Pakistan economy', 'gold price'],
    readCache: async () => ({ t: NOW - NEWS_CACHE_TTL_MS - 1, stories: [] }),
    writeCache: async (key, entry) => {
      written.push({ key, t: entry.t });
    },
    fetchText: async () => RSS,
  });

  assert.equal(result.cached, false);
  assert.equal(result.stories.length, 2);
  assert.deepEqual(
    result.sources.map((source) => source.status),
    ['live', 'live']
  );
  assert.equal(written.length, 1);
  assert.equal(written[0].key, newsCacheKey(['Pakistan economy', 'gold price']));
});

test('news: a dead feed reports failed sources instead of inventing stories', async () => {
  let written = 0;
  const result = await fetchNews({
    now: NOW,
    queries: ['Pakistan economy'],
    readCache: async () => null,
    writeCache: async () => {
      written++;
    },
    fetchText: async () => null,
  });

  assert.deepEqual(result.stories, []);
  assert.deepEqual(result.sources, [{ query: 'Pakistan economy', status: 'failed', stories: 0 }]);
  assert.equal(written, 0);
});

test('news: a stalled query resolves to the fallback at the deadline', async () => {
  const stalled = new Promise<string | null>(() => undefined);
  const started = Date.now();
  const value = await withTimeout(stalled, 20, null);
  assert.equal(value, null);
  assert.ok(Date.now() - started < 2000);
});

test('news: story age is stated in the smallest honest unit', () => {
  assert.equal(storyAge(NOW - 10_000, NOW), 'just now');
  assert.equal(storyAge(NOW - 12 * 60_000, NOW), '12m ago');
  assert.equal(storyAge(NOW - 3 * 60 * 60_000, NOW), '3h ago');
  assert.equal(storyAge(NOW - 50 * 60 * 60_000, NOW), '2d ago');
  assert.equal(storyAge(Number.NaN, NOW), 'time unknown');
});
