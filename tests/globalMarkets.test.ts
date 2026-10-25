import { test } from 'node:test';
import assert from 'node:assert/strict';
import {
  NATIONAL_PROVIDER_LADDER,
  OUTLOOK_CACHE_PREFIX,
  OUTLOOK_CACHE_TTL_MS,
  OUTLOOK_SYMBOLS,
  buildDegradedQuote,
  formatOutlookNumber,
  freshnessChip,
  isCacheFresh,
  outlookCacheKey,
  outlookDegradedSymbols,
  parseDpsCompanyQuote,
  parseDpsIndexRow,
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

// Captured verbatim from https://dps.psx.com.pk/indices on 2026-10-25
// (KSE100 row + the KSE100PR row that follows it).
const DPS_INDICES_ROW =
  '<table class="tbl"><thead class="tbl__head"><tr><th>Index</th><th class="right">High</th><th class="right">Low</th><th class="right">Current</th><th class="right">Change</th><th class="right">% Change</th></tr></thead><tbody class="tbl__body"><tr><td><a class="link" href="javascript:;" data-code="KSE100"><b>KSE100</b></a></td><td class="right" data-order="163966.86">163,966.86</td><td class="right" data-order="162292.44">162,292.44</td><td class="right" data-order="162374.87">162,374.87</td><td class="right change__text--neg" data-order="-1549.4400000000023"><i class="icon-down-dir"></i> -1549.44</td><td class="right change__text--neg" data-order="-0.9452167283790929"><i class="icon-down-dir"></i> -0.95%</td></tr><tr><td><a class="link" href="javascript:;" data-code="KSE100PR"><b>KSE100PR</b></a></td><td class="right" data-order="48972.34">48,972.34</td><td class="right" data-order="48472.24">48,472.24</td><td class="right" data-order="48496.86">48,496.86</td><td class="right change__text--neg" data-order="-462.7699999999968"><i class="icon-down-dir"></i> -462.77</td><td class="right change__text--neg" data-order="-0.9452073065094586"><i class="icon-down-dir"></i> -0.95%</td></tr></tbody></table>';

test('parse: DPS indices row reads the captured KSE-100 current value and % change', () => {
  assert.deepEqual(parseDpsIndexRow(DPS_INDICES_ROW), {
    price: 162374.87,
    changePct: -0.95,
    currency: 'PKR',
  });
});

test('parse: DPS index anchor does not confuse KSE100 with KSE100PR', () => {
  assert.equal(parseDpsIndexRow(DPS_INDICES_ROW, 'KSE100PR')?.price, 48496.86);
  assert.equal(parseDpsIndexRow(DPS_INDICES_ROW, 'KSE30'), null);
});

test('parse: DPS indices rejects the SPA 404 body and rows without five cells', () => {
  assert.equal(parseDpsIndexRow(''), null);
  assert.equal(parseDpsIndexRow('<html><body>Not Found</body></html>'), null);
  assert.equal(
    parseDpsIndexRow('<tr><td data-code="KSE100">x</td><td data-order="1"></td></tr>'),
    null
  );
  assert.equal(
    parseDpsIndexRow('<tr><td data-code="KSE100"></td><td data-order="0"></td></tr>' +
      '<td data-order="1"></td><td data-order="2"></td><td data-order="3"></td><td data-order="4"></td>'),
    null
  );
});

// Captured verbatim from https://dps.psx.com.pk/company/{symbol} on 2026-10-25.
const DPS_OGDC_QUOTE =
  '<div class="quote__price"><div class="quote__close">Rs.298.12</div><div class="quote__change change__text--neg"><div class="change__direction"><i class="icon-down-dir"></i> </div><div class="change__value">-2.38</div><div class="change__percent">  (-0.79%)</div></div></div><div class="quote__chart"><div class="chart" id="companyDailyChart"></div></div>';
const DPS_ENGRO_QUOTE =
  '<div class="quote__price"><div class="quote__close">Rs.485.38</div><div class="quote__change change__text--pos"><div class="change__direction"><i class="icon-up-dir"></i> </div><div class="change__value">7.08</div><div class="change__percent"> (1.48%)</div></div></div><div class="quote__chart"></div>';

test('parse: DPS company page reads the captured negative quote block', () => {
  assert.deepEqual(parseDpsCompanyQuote(DPS_OGDC_QUOTE), {
    price: 298.12,
    changePct: -0.79,
    currency: 'PKR',
  });
});

test('parse: DPS company page signs an unsigned positive percent from its class', () => {
  assert.deepEqual(parseDpsCompanyQuote(DPS_ENGRO_QUOTE), {
    price: 485.38,
    changePct: 1.48,
    currency: 'PKR',
  });
});

test('parse: DPS company page rejects an error body instead of inventing a price', () => {
  assert.equal(parseDpsCompanyQuote(''), null);
  assert.equal(parseDpsCompanyQuote('<html><body>Internal Server Error</body></html>'), null);
  assert.equal(parseDpsCompanyQuote('<div class="quote__close">Rs.0.00</div>'), null);
});

test('ladder: national resolves DPS live, then Yahoo suffix probe, then 24h cache', () => {
  assert.deepEqual(NATIONAL_PROVIDER_LADDER, [
    'psx_dps_indices',
    'yahoo_national_suffix',
    'cache',
  ]);
});

test('degraded: a national row with no provider and no cache is flagged, never dropped', () => {
  const national = OUTLOOK_SYMBOLS.find((s) => s.region === 'national');
  assert.ok(national);

  const quotes = [
    quote(),
    buildDegradedQuote(national, null, NOW),
  ];
  assert.deepEqual(outlookDegradedSymbols(quotes), ['KSE100.KAR']);
  assert.equal(toChips(quotes[1]).value, 'No quote on device');
  assert.equal(freshnessChip(quotes[1], NOW), 'no data');
});

