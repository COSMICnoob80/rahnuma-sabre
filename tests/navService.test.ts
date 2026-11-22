import { test } from 'node:test';
import assert from 'node:assert/strict';
import {
  NAV_CACHE_TTL_MS,
  NAV_GAP_CAPTION,
  NAV_UNAVAILABLE,
  PKT_OFFSET_MS,
  buildEtfNavLine,
  fetchEtfNav,
  fetchEtfNavMap,
  formatNavGap,
  isNavCacheFresh,
  navGapPct,
  parseDpsEtfNav,
  pktWallClockToMs,
} from '../src/services/navService.ts';
import type { EtfNavCacheEntry } from '../src/services/navService.ts';

// Verbatim stats block from https://dps.psx.com.pk/etf/MZNPETF (intraday iNAV).
const MZN_HTML =
  '<div class="stats"><div class="stats_item"><div class="stats_label" style="text-transform: none;">iNAV</div>' +
  '<div class="stats_value">18.27</div>' +
  '<div class="stats_note" style="font-size: 0.9em; color:#666; margin-top:0.5em">Last Updated:  2026-11-20 16:30:19</div>' +
  '</div><div class="stats_item"></div></div><div> <span><a class="etfDisclaimer__link" href="#" ' +
  'style="font-weight:bold;">iNAV Disclaimer</a></span></div><div class="stats company__quote__rangeStats">' +
  '<div class="stats_item"><div class="stats_label">CIRCUIT BREAKER</div><div class="stats_value">16.30 — 19.91' +
  '<div class="numRange" data-low="16.3" data-high="19.91" data-current="18.22"></div></div></div></div>';

// Verbatim stats block from https://dps.psx.com.pk/etf/HBLTETF (day-end NAV *).
const HBLT_HTML =
  '<div class="stats"><div class="stats_item"><div class="stats_label" style="text-transform: none;">NAV' +
  '<span style="color:#4583B6;"> *</span></div><div class="stats_value">107.9412</div>' +
  '<div class="stats_note" style="font-size: 0.9em; color:#666; margin-top:0.5em">Last Updated:  2026-11-19 18:30:00</div>' +
  '</div><div class="stats_item"></div></div><div class="stats company__quote__rangeStats">' +
  '<div class="stats_item"><div class="stats_label">CIRCUIT BREAKER</div><div class="stats_value">97.18 — 118.78' +
  '<div class="numRange" data-low="97.18" data-high="118.78" data-current="108"></div></div></div></div>';

// A page with the stats widgets but no NAV label at all.
const NO_NAV_HTML =
  '<div class="stats"><div class="stats_item"><div class="stats_label">Open</div><div class="stats_value">107.98</div>' +
  '</div><div class="stats_item"><div class="stats_label">High</div><div class="stats_value">108.00</div></div></div>';

const NOW = Date.parse('2026-11-22T10:00:00Z');

test('nav parse: the DPS ETF page yields its own iNAV plus the as-of instant', () => {
  const parsed = parseDpsEtfNav(MZN_HTML);
  assert.ok(parsed);
  assert.equal(parsed.nav, 18.27);
  assert.equal(parsed.navKind, 'iNAV');
  assert.equal(parsed.navAsOf, '2026-11-20 16:30:19');

  // The page's own "Last Updated" is PKT wall clock; 16:30:19 PKT = 11:30:19Z.
  assert.equal(parsed.updatedAtMs, Date.parse('2026-11-20T11:30:19Z'));
});

test('nav parse: a day-end NAV * label is read as NAV, not conflated with iNAV', () => {
  const parsed = parseDpsEtfNav(HBLT_HTML);
  assert.ok(parsed);
  assert.equal(parsed.nav, 107.9412);
  assert.equal(parsed.navKind, 'NAV');
  assert.equal(parsed.navAsOf, '2026-11-19 18:30:00');
});

test('nav parse: widgets without a NAV label, empty bodies and junk all parse to null', () => {
  assert.equal(parseDpsEtfNav(NO_NAV_HTML), null);
  assert.equal(parseDpsEtfNav(''), null);
  assert.equal(parseDpsEtfNav('<html><body>0.00</body></html>'), null);
  // The 52-week / circuit-breaker numbers must never be mistaken for a NAV.
  assert.equal(
    parseDpsEtfNav(
      '<div class="stats"><div class="stats_label">52-WEEK RANGE ^</div>' +
        '<div class="stats_value">96.65 — 120.75</div></div>'
    ),
    null
  );
});

test('nav parse: a zero or non-numeric NAV is rejected rather than shipped', () => {
  const zero = '<div class="stats"><div class="stats_label">iNAV</div><div class="stats_value">0</div></div>';
  assert.equal(parseDpsEtfNav(zero), null);
});

test('gap math: the signed gap is (price - nav) / nav, rounded to two places', () => {
  // MZNPETF on 2026-11-22: iNAV 18.27, traded price Rs.18.22.
  const gap = navGapPct(18.27, 18.22);
  assert.ok(gap !== null);
  assert.equal(gap, -0.27); // units traded 0.27% BELOW NAV
  assert.equal(formatNavGap(gap), '-0.3%');

  // A price above NAV renders signed positive.
  assert.equal(navGapPct(100, 102), 2);
  assert.equal(formatNavGap(navGapPct(100, 102)), '+2.0%');
  assert.equal(formatNavGap(navGapPct(100, 100)), '0.0%');

  // Missing or impossible inputs never become a number.
  assert.equal(navGapPct(null, 10), null);
  assert.equal(navGapPct(10, null), null);
  assert.equal(navGapPct(0, 10), null);
  assert.equal(navGapPct(10, 0), null);
  assert.equal(formatNavGap(null), '—');
});

test('gap math: the ledger line reads NAV · price · gap and carries sign only', () => {
  const line = buildEtfNavLine(18.27, 18.22);
  assert.ok(line);
  assert.equal(line.text, 'NAV 18.27 · price 18.22 · gap -0.3%');
  assert.equal(line.gapLabel, '-0.3%');
  assert.equal(line.tone, 'neg');

  const above = buildEtfNavLine(40.9, 41.9);
  assert.ok(above);
  assert.equal(above.tone, 'pos');

  assert.equal(buildEtfNavLine(null, 18.22), null);
  assert.equal(buildEtfNavLine(18.27, null), null);
});

test('nav law: the caption states a fact and names no direction', () => {
  assert.equal(NAV_GAP_CAPTION, 'Gap is information, not a trade signal.');
  assert.doesNotMatch(NAV_GAP_CAPTION, /\b(buy|sell|cheap|expensive|overvalued|undervalued)\b/i);
  assert.equal(NAV_UNAVAILABLE, 'NAV unavailable');
});

test('nav fetch: a live page wins and is written to the 15-minute cache', async () => {
  let written: EtfNavCacheEntry | null = null;
  const quote = await fetchEtfNav('mznpetf', {
    now: NOW,
    fetchHtml: async () => MZN_HTML,
    readCache: async () => null,
    writeCache: async (_symbol, entry) => {
      written = entry;
    },
  });

  assert.equal(quote.symbol, 'MZNPETF');
  assert.equal(quote.nav, 18.27);
  assert.equal(quote.navKind, 'iNAV');
  assert.equal(quote.cached, false);
  assert.equal(quote.source, 'PSX DPS ETF page');
  assert.ok(written);
  assert.equal(written!.nav, 18.27);
  assert.equal(written!.t, NOW);

  assert.equal(isNavCacheFresh(NOW - NAV_CACHE_TTL_MS, NOW), true);
  assert.equal(isNavCacheFresh(NOW - NAV_CACHE_TTL_MS - 1, NOW), false);
});

test('nav fetch: an unreachable page serves an unexpired cache, labelled cached', async () => {
  const quote = await fetchEtfNav('MZNPETF', {
    now: NOW,
    fetchHtml: async () => null,
    readCache: async () => ({
      t: NOW - 1_000,
      nav: 18.27,
      navKind: 'iNAV',
      navAsOf: '2026-11-20 16:30:19',
    }),
  });
  assert.equal(quote.nav, 18.27);
  assert.equal(quote.cached, true);
  assert.equal(quote.source, 'PSX DPS ETF page (cached)');
});

test('nav unavailable: no page and no cache yields null, never a fabricated number', async () => {
  const quote = await fetchEtfNav('MZNPETF', {
    now: NOW,
    fetchHtml: async () => null,
    readCache: async () => null,
  });
  assert.equal(quote.nav, null);
  assert.equal(quote.navKind, null);
  assert.equal(quote.source, 'none');
  assert.equal(quote.cached, false);

  // The row's line is therefore absent, and the screen prints NAV_UNAVAILABLE.
  assert.equal(buildEtfNavLine(quote.nav, 18.22), null);

  // A malformed ticker never reaches the network.
  const bad = await fetchEtfNav('not a ticker!', { now: NOW, fetchHtml: async () => MZN_HTML });
  assert.equal(bad.nav, null);
});

test('nav fetch: a map keys every ETF by ticker and isolates per-symbol failure', async () => {
  const map = await fetchEtfNavMap(['MZNPETF', 'MIIETF', 'MZNPETF'], {
    now: NOW,
    fetchHtml: async (symbol) => (symbol === 'MZNPETF' ? MZN_HTML : null),
    readCache: async () => null,
    writeCache: async () => undefined,
  });

  assert.deepEqual(Object.keys(map).sort(), ['MIIETF', 'MZNPETF']);
  assert.equal(map.MZNPETF.nav, 18.27);
  assert.equal(map.MIIETF.nav, null);
});

test('nav time: PKT wall clock converts with the fixed UTC+5 offset', () => {
  assert.equal(PKT_OFFSET_MS, 5 * 60 * 60 * 1000);
  assert.equal(pktWallClockToMs('2026-11-20 16:30:19'), Date.parse('2026-11-20T11:30:19Z'));
  assert.equal(pktWallClockToMs('not a date'), null);
});
