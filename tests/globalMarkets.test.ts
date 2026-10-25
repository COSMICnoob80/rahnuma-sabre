import { test } from 'node:test';
import assert from 'node:assert/strict';
import {
  OUTLOOK_CACHE_PREFIX,
  OUTLOOK_CACHE_TTL_MS,
  OUTLOOK_SYMBOLS,
  buildDegradedQuote,
  formatOutlookNumber,
  freshnessChip,
  isCacheFresh,
  outlookCacheKey,
  parseStooqCsv,
  parseYahooChart,
  toChips,
  yahooChartUrl,
} from '../src/services/globalMarkets.ts';

const HOUR_MS = 60 * 60 * 1000;
const NOW = Date.parse('2026-10-25T12:00:00Z');
const GSPC = { sourceSymbol: '^GSPC', display: 'S&P 500', region: 'international' };

function quote(overrides = {}) {
  return {
    symbol: '^GSPC',
    label: 'S&P 500',
    region: 'international',
    pricePKR: 5912.34,
    priceNote: 'USD quoted',
    changePct: 0.8,
    fetchedAtIsoUtc: '2026-10-25T07:00:00Z',
    source: 'test-feed',
    fresh: true,
    ...overrides,
  };
}

function cacheEntry(overrides = {}) {
  return {
    t: NOW - 2 * HOUR_MS,
    price: 5900,
    changePct: 0.75,
    source: 'Yahoo Finance chart',
    priceNote: 'USD quoted',
    ...overrides,
  };
}

test('chips: value, delta and label are formatted as a row', () => {
  const chips = toChips(quote({ pricePKR: 118420.5, changePct: 3.2 }));
  assert.deepEqual(chips, {
    label: 'S&P 500',
    value: '118,420.50',
    delta: '+3.20%',
  });
});

test('chips: a null change renders a visible dash, never a blank', () => {
  assert.equal(toChips(quote({ changePct: null })).delta, '—');
  assert.equal(toChips(quote({ changePct: 0 })).delta, '0.00%');
  assert.equal(toChips(quote({ changePct: -3.2 })).delta, '-3.20%');
  assert.equal(toChips(quote({ changePct: 1.234 })).delta, '+1.23%');
});

test('chips: a six-decimal FX quote is clamped to two decimals, not printed raw', () => {
  const chips = toChips(quote({ symbol: 'PKR=X', label: 'USD/PKR', pricePKR: 281.352617 }));
  assert.equal(chips.value, '281.35');
  assert.equal(formatOutlookNumber(0.123456), '0.12');
  assert.equal(formatOutlookNumber(-1234.567), '-1,234.57');
  assert.equal(formatOutlookNumber(null), 'No data');
});

test('degraded: a cached quote renders stale with fresh=false and a cached label', () => {
  const degraded = buildDegradedQuote(GSPC, cacheEntry(), NOW);
  assert.equal(degraded.fresh, false);
  assert.equal(degraded.pricePKR, 5900);
  assert.equal(degraded.changePct, 0.75);
  assert.equal(degraded.source, 'Yahoo Finance chart (cached)');
  assert.equal(toChips(degraded).value, '5,900.00');

  const at = new Date(NOW - 2 * HOUR_MS);
  const expected = `cached ${String(at.getHours()).padStart(2, '0')}:${String(at.getMinutes()).padStart(2, '0')}`;
  assert.equal(freshnessChip(degraded, NOW), expected);
  assert.match(freshnessChip(degraded, NOW), /^cached \d{2}:\d{2}$/);
});

test('degraded: no cache and an expired cache both label the unknown price visibly', () => {
  const missing = buildDegradedQuote(GSPC, null, NOW);
  assert.equal(missing.pricePKR, null);
  assert.equal(missing.priceNote, 'No quote on device');
  assert.equal(freshnessChip(missing, NOW), 'no data');
  assert.equal(toChips(missing).value, 'No quote on device');

  const expired = buildDegradedQuote(GSPC, cacheEntry({ t: NOW - 25 * HOUR_MS }), NOW);
  assert.equal(expired.pricePKR, null);
  assert.equal(freshnessChip(expired, NOW), 'no data');
});

test('degraded: every declared instrument produces a labelled quote, never a drop', () => {
  for (const spec of OUTLOOK_SYMBOLS) {
    const degraded = buildDegradedQuote(spec, null, NOW);
    assert.equal(degraded.label, spec.display);
    assert.equal(degraded.region, spec.region);
    assert.notEqual(toChips(degraded).value, '');
    assert.match(freshnessChip(degraded, NOW), /^(no data|cached \d{2}:\d{2})$/);
  }
});

test('parse: Yahoo chart extracts price and computes changePct to 2dp from previous close', () => {
  const parsed = parseYahooChart({
    chart: {
      result: [
        {
          meta: {
            regularMarketPrice: 110,
            chartPreviousClose: 100,
            currency: 'USD',
          },
        },
      ],
    },
  });
  assert.deepEqual(parsed, { price: 110, changePct: 10, currency: 'USD' });

  const rounded = parseYahooChart({
    chart: {
      result: [
        {
          meta: {
            regularMarketPrice: 5912.345,
            chartPreviousClose: 5865.2,
            currency: 'USD',
          },
        },
      ],
    },
  });
  assert.equal(rounded.changePct, 0.8);
});

test('parse: Yahoo chart falls back to the first close and rejects garbage', () => {
  const fallback = parseYahooChart({
    chart: { result: [{ meta: {}, indicators: { quote: [{ close: [42.5] }] } }] },
  });
  assert.deepEqual(fallback, { price: 42.5, changePct: null, currency: null });

  assert.equal(parseYahooChart(null), null);
  assert.equal(parseYahooChart({ chart: { result: [] } }), null);
  assert.equal(parseYahooChart({ chart: { result: [{ meta: {} }] } }), null);
});

test('parse: stooq CSV accepts a real row and rejects an HTML challenge page', () => {
  const csv =
    'Symbol,Date,Time,Open,High,Low,Close,Volume\nUSDPKR,2026-10-24,22:00:00,281.1,281.5,280.9,281.35,0';
  assert.deepEqual(parseStooqCsv(csv), { price: 281.35, changePct: null, currency: null });

  assert.equal(parseStooqCsv('<html><body>This site requires JavaScript</body></html>'), null);
  assert.equal(parseStooqCsv(''), null);
});

test('cache: keys are per symbol and the 24h window is enforced with a mocked clock', () => {
  assert.equal(OUTLOOK_CACHE_TTL_MS, 24 * HOUR_MS);
  assert.equal(outlookCacheKey('^GSPC'), `${OUTLOOK_CACHE_PREFIX}^GSPC`);
  assert.notEqual(outlookCacheKey('^GSPC'), outlookCacheKey('^IXIC'));

  assert.equal(isCacheFresh(NOW, NOW), true);
  assert.equal(isCacheFresh(NOW - 24 * HOUR_MS, NOW), true);
  assert.equal(isCacheFresh(NOW - 24 * HOUR_MS - 1, NOW), false);
  assert.equal(isCacheFresh(Number.NaN, NOW), false);
  assert.equal(isCacheFresh(NOW + 1, NOW), false);
});

test('contract: national is KSE-100 and international carries the five live symbols', () => {
  const national = OUTLOOK_SYMBOLS.filter((s) => s.region === 'national').map((s) => s.display);
  const international = OUTLOOK_SYMBOLS.filter((s) => s.region === 'international').map((s) => s.display);

  assert.deepEqual(national, ['KSE-100']);
  assert.deepEqual(international, ['S&P 500', 'NASDAQ', 'Gold XAU', 'Brent', 'USD/PKR']);
});

test('contract: provider URLs encode tickers instead of interpolating them raw', () => {
  assert.equal(
    yahooChartUrl('https://query1.finance.yahoo.com/v8/finance/chart', '^GSPC'),
    'https://query1.finance.yahoo.com/v8/finance/chart/%5EGSPC?interval=1d&range=5d'
  );
  assert.equal(
    yahooChartUrl('https://query1.finance.yahoo.com/v8/finance/chart', 'BZ=F'),
    'https://query1.finance.yahoo.com/v8/finance/chart/BZ%3DF?interval=1d&range=5d'
  );
});
