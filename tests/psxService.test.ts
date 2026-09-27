import { test } from 'node:test';
import assert from 'node:assert/strict';
import { priceFreshness, isQuoteStale } from '../src/services/priceFreshness.ts';

const NOW = Date.parse('2026-09-23T12:00:00Z');
const HOUR = 60 * 60 * 1000;

test('freshness: a holding never fetched is stale and says so', () => {
  const result = priceFreshness(null, NOW);
  assert.equal(result.stale, true);
  assert.equal(result.label, 'Price not fetched yet');
});

test('freshness: an unparseable timestamp is stale, never assumed fresh', () => {
  const result = priceFreshness('not-a-date', NOW);
  assert.equal(result.stale, true);
  assert.equal(result.label, 'Price freshness unknown');
});

test('freshness: a quote inside the TTL is not stale', () => {
  const result = priceFreshness('2026-09-23T11:55:00Z', NOW);
  assert.equal(result.stale, false);
  assert.equal(result.label, 'Up to date');
});

test('freshness: a quote older than an hour reports its age in hours', () => {
  const result = priceFreshness(new Date(NOW - 3 * HOUR).toISOString(), NOW);
  assert.equal(result.stale, true);
  assert.equal(result.label, '3h old');
});

test('freshness: a quote over a day old is dated rather than hour-rounded', () => {
  const result = priceFreshness(new Date(NOW - 3 * 24 * HOUR).toISOString(), NOW);
  assert.equal(result.stale, true);
  assert.ok(result.label.startsWith('As of '));
});

test('freshness: a SQLite datetime without a timezone is read as UTC', () => {
  // datetime('now') in SQLite returns "YYYY-MM-DD HH:MM:SS" with no timezone.
  const result = priceFreshness('2026-09-23 11:58:00', NOW);
  assert.equal(result.stale, false);
  assert.equal(result.label, 'Up to date');
});

test('freshness: the hour boundary rounds up so a stale quote never reads as fresh', () => {
  const justOverAnHour = priceFreshness(new Date(NOW - HOUR - 60_000).toISOString(), NOW);
  assert.equal(justOverAnHour.stale, true);
  assert.equal(justOverAnHour.label, '1h old');
});

test('freshness: a holding with no fetched price is always stale', () => {
  assert.equal(isQuoteStale(null, 100, NOW), true);
  assert.equal(isQuoteStale(null, null, NOW), true);
  assert.equal(isQuoteStale('2026-09-23T11:58:00Z', 100, NOW), false);
});
