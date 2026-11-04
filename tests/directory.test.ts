import { test } from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import {
  ADVISORS,
  ADVISOR_CITIES,
  ALL_CITIES,
  DIRECTORY_FOOTNOTE,
  filterAdvisors,
} from '../src/data/advisors.ts';

const SCREEN_SOURCE = readFileSync('src/screens/DirectoryScreen.tsx', 'utf8');

const AFFILIATE_OR_TRACKING = /[?&](utm_|ref=|aff|affiliate|partner)|go\.php|redirect\?/i;

test('directory: the roster carries at least 40 AMC + broker rows, both kinds present', () => {
  assert.ok(ADVISORS.length >= 40, `roster only has ${ADVISORS.length} rows`);

  const amcs = ADVISORS.filter((row) => row.kind === 'AMC');
  const brokers = ADVISORS.filter((row) => row.kind === 'Broker');
  assert.ok(amcs.length >= 15, `only ${amcs.length} AMC rows`);
  assert.ok(brokers.length >= 20, `only ${brokers.length} broker rows`);
  assert.equal(amcs.length + brokers.length, ADVISORS.length);
});

test('directory: every row has a valid kind, name and city', () => {
  for (const row of ADVISORS) {
    assert.ok(row.kind === 'AMC' || row.kind === 'Broker', `bad kind: ${row.kind}`);
    assert.equal(typeof row.name, 'string');
    assert.ok(row.name.trim().length > 0, `${row.kind} row has no name`);
    assert.equal(typeof row.city, 'string');
    assert.ok(row.city.trim().length > 0, `${row.name} has no city`);
    assert.ok(ADVISOR_CITIES.includes(row.city), `${row.name} city not in ADVISOR_CITIES`);
  }

  const keys = new Set(ADVISORS.map((row) => `${row.kind}:${row.name}`));
  assert.equal(keys.size, ADVISORS.length, 'duplicate roster rows');
});

test('directory: link-outs are plain https pages on the entity own domain, never affiliate hops', () => {
  for (const row of ADVISORS) {
    if (!row.url) continue;
    assert.match(row.url, /^https:\/\/[a-z0-9.-]+\.[a-z]{2,}(\/\S*)?$/i, `bad url: ${row.url}`);
    assert.doesNotMatch(row.url, AFFILIATE_OR_TRACKING, `affiliate/tracking link: ${row.url}`);
  }
});

test('directory: registry notes carry no credit ratings, fees or rankings', () => {
  for (const row of ADVISORS) {
    if (!row.licenseNote) continue;
    assert.doesNotMatch(row.licenseNote, /\bAM\d|star|rank|score|fee/i, `rating-like note: ${row.licenseNote}`);
  }
});

test('directory: cities are derived from the roster and sorted', () => {
  const expected = Array.from(new Set(ADVISORS.map((row) => row.city))).sort();
  assert.deepEqual([...ADVISOR_CITIES], expected);
  assert.ok(!ADVISOR_CITIES.includes(ALL_CITIES));
});

test('directory: kind filter returns only that kind and All returns everything', () => {
  const all = filterAdvisors(ADVISORS, { kind: 'All', city: ALL_CITIES, query: '' });
  assert.equal(all.length, ADVISORS.length);

  const amcs = filterAdvisors(ADVISORS, { kind: 'AMC', city: ALL_CITIES, query: '' });
  assert.ok(amcs.length > 0);
  assert.ok(amcs.every((row) => row.kind === 'AMC'));

  const brokers = filterAdvisors(ADVISORS, { kind: 'Broker', city: ALL_CITIES, query: '' });
  assert.ok(brokers.length > 0);
  assert.ok(brokers.every((row) => row.kind === 'Broker'));

  assert.equal(amcs.length + brokers.length, ADVISORS.length);
});

test('directory: city filter narrows to that city and combines with kind', () => {
  for (const city of ADVISOR_CITIES) {
    const rows = filterAdvisors(ADVISORS, { kind: 'All', city, query: '' });
    assert.ok(rows.length > 0, `no rows for city ${city}`);
    assert.ok(rows.every((row) => row.city === city));
  }

  const lahoreAmcs = filterAdvisors(ADVISORS, { kind: 'AMC', city: 'Lahore', query: '' });
  assert.ok(lahoreAmcs.length > 0);
  assert.ok(lahoreAmcs.every((row) => row.kind === 'AMC' && row.city === 'Lahore'));

  assert.deepEqual(filterAdvisors(ADVISORS, { kind: 'All', city: 'Quetta', query: '' }), []);
});

test('directory: search matches name or city, case-insensitively, and trims', () => {
  const byName = filterAdvisors(ADVISORS, { kind: 'All', city: ALL_CITIES, query: 'meezan' });
  assert.ok(byName.some((row) => /Meezan/i.test(row.name)));

  const byCity = filterAdvisors(ADVISORS, { kind: 'All', city: ALL_CITIES, query: '  lahore ' });
  assert.ok(byCity.length > 0);
  assert.ok(byCity.every((row) => row.city === 'Lahore'));

  const combined = filterAdvisors(ADVISORS, { kind: 'Broker', city: 'Karachi', query: 'habib' });
  assert.ok(combined.every((row) => row.kind === 'Broker' && row.city === 'Karachi'));
  assert.ok(combined.some((row) => /Habib/i.test(row.name)));

  assert.deepEqual(filterAdvisors(ADVISORS, { kind: 'All', city: ALL_CITIES, query: 'zzzzzz' }), []);
});

test('directory: the screen carries no endorsement wording and pins the neutral footnote', () => {
  assert.equal(/recommend/i.test(SCREEN_SOURCE), false, 'screen contains "recommend"');
  assert.equal(/\bbest\b/i.test(SCREEN_SOURCE), false, 'screen contains "best"');
  assert.equal(/\brank(ed|ing)?\b|\brating\b|\bscore\b/i.test(SCREEN_SOURCE), false);

  assert.match(SCREEN_SOURCE, /DIRECTORY_FOOTNOTE/);
  assert.match(DIRECTORY_FOOTNOTE, /endorses no provider/);
  assert.match(DIRECTORY_FOOTNOTE, /Information only/);
  assert.match(DIRECTORY_FOOTNOTE, /Not investment advice/);
});

test('directory: the roster file records its sources and pull date in comments', () => {
  const dataSource = readFileSync('src/data/advisors.ts', 'utf8');
  assert.match(dataSource, /not a recommendation list/);
  assert.match(dataSource, /mufap\.com\.pk\/members\.php/);
  assert.match(dataSource, /psx\.com\.pk/);
  assert.match(dataSource, /2026-11-04/);
  assert.equal(/recommend(?!ation list)/i.test(dataSource), false);
});
