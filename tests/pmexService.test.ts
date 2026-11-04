import { test } from 'node:test';
import assert from 'node:assert/strict';
import {
  GRAMS_PER_TOLA,
  PMEX_DATETIME_UTC_SHIFT_S,
  TROY_OZ_PER_TOLA,
  buildPmexQuote,
  parsePmexBoard,
  pkrPerGramFromTola,
  pkrPerTolaFromUsdPerOz,
} from '../src/services/pmexService.ts';
import { parseYahooQuotePage } from '../src/services/globalMarkets.ts';
import type { InstrumentQuote } from '../src/services/globalMarkets.ts';
import { buildCommodityCards, buildPropertyCard } from '../src/utils/fusionStrip.ts';

// Verbatim rows from docs/HARVEST-PMEX.md §2.1 (public market data, 2026-11-04).
const HARVEST_BOARD = [
  {
    Contract: 'GO100OZ-DE26',
    Bid_Vol: null,
    Bid: 4056.3,
    Ask: 4056.8,
    Ask_Vol: null,
    Last_Price: '4053.6',
    Last_Vol: '1',
    Total_Vol: '17',
    High: 4056.4,
    Low: 3949.3,
    Change: 118.7,
    Change_Per: 3.01,
    State: null,
    _date: null,
    _time: null,
    _Message: null,
    SysDate: null,
    BidDiff: 0,
    AskDiff: 0,
    StatusTime: null,
    last_: 0,
    volume_: 0,
    rBid: null,
    rAsk: null,
    BidVolume: null,
    AskVolume: null,
    Open: 3937.7,
    Close: 3937.6,
    Total_Volume: 0,
    Category: 'Metals',
    _datetime: 1793821418,
  },
  {
    Contract: 'TOLAGOLD-WED',
    Bid: 415833,
    Ask: 424816,
    Last_Price: '0',
    High: 0,
    Low: 0,
    Change: -11453,
    Change_Per: -2.68,
    Category: 'Phy_Gold',
    _datetime: 1793821392,
  },
  {
    Contract: 'SL100OZ-DE26',
    Bid: 52.257,
    Ask: 52.283,
    Last_Price: '52.217',
    Change: -0.14,
    Change_Per: -0.27,
    Category: 'Metals',
    _datetime: 1793821418,
  },
];

const NOW = Date.parse('2026-11-04T14:45:00Z');
// open.er-api.com daily fix quoted in the harvest's §4 verification.
const USD_PKR = 276.5278;

test('pmex: the harvest board parses to typed rows and the two-sided tola midpoint', () => {
  const rows = parsePmexBoard(HARVEST_BOARD);
  assert.equal(rows.length, 3);

  const gold = rows.find((row) => row.contract === 'TOLAGOLD-WED');
  assert.ok(gold);
  assert.equal(gold.lastPrice, 0);
  assert.equal(gold.updatedAtMs, (1793821392 - PMEX_DATETIME_UTC_SHIFT_S) * 1000);

  const quote = buildPmexQuote(rows, USD_PKR);
  assert.equal(quote.goldPkrPerTola, 420324.5); // (415,833 + 424,816) / 2
  assert.equal(quote.goldChangePct, -2.68);
  assert.equal(quote.goldUsdPerOz, 4056.55); // (4,056.3 + 4,056.8) / 2
  assert.equal(quote.silverUsdPerOz, 52.27); // (52.257 + 52.283) / 2
  assert.equal(quote.silverPkrPerTola, pkrPerTolaFromUsdPerOz(52.27, USD_PKR));
});

test('pmex: malformed payloads and contractless rows never become quotes', () => {
  assert.deepEqual(parsePmexBoard(null), []);
  assert.deepEqual(parsePmexBoard({}), []);
  assert.deepEqual(parsePmexBoard([{ Bid: 1 }, { Contract: '' }]), []);

  const empty = buildPmexQuote([], USD_PKR);
  assert.equal(empty.goldPkrPerTola, null);
  assert.equal(empty.silverPkrPerTola, null);
});

test('tola math: 1 tola = 0.375 oz and the harvest silver example holds within 0.10%', () => {
  assert.ok(Math.abs(TROY_OZ_PER_TOLA * 31.1034768 - 11.6638038) < 1e-9);

  // 52.257 x 0.375 x 276.5278 = 5,419 PKR/tola (harvest §4 worked example).
  const silver = pkrPerTolaFromUsdPerOz(52.257, USD_PKR);
  assert.ok(silver !== null);
  assert.ok(Math.abs(silver - 5419) / 5419 <= 0.001, `silver tola off by more than 0.10%`);

  // 5,419 PKR/tola = ~465 PKR/gram (1 tola = 11.6638 g).
  const gram = pkrPerGramFromTola(5419);
  assert.ok(gram !== null);
  assert.ok(Math.abs(gram - 465) / 465 <= 0.001, `per-gram tola off by more than 0.10%`);
  assert.equal(GRAMS_PER_TOLA, 11.6638);
});

test('pmex offline: both commodity cards render the gray PMEX offline state', () => {
  const cards = buildCommodityCards(null, USD_PKR, NOW, true);
  assert.equal(cards.length, 2);

  for (const card of cards) {
    assert.equal(card.value, 'PMEX offline');
    assert.equal(card.tone, 'flat'); // gray border, never green/red
    assert.equal(card.stale, true);
    assert.equal(card.delta, '—');
    assert.equal(card.pkrValue, null);
    assert.equal(card.sourceChip, 'PMEX');
  }
});

test('pmex cards: gold reads PKR/tola and silver is derived at the session rate', () => {
  const quote = buildPmexQuote(parsePmexBoard(HARVEST_BOARD), USD_PKR);
  const cards = buildCommodityCards(quote, USD_PKR, NOW, false);
  const bySymbol = Object.fromEntries(cards.map((card) => [card.symbol, card]));

  assert.equal(bySymbol.PMEX_GOLD.value, '420,324.50');
  assert.equal(bySymbol.PMEX_GOLD.delta, '-2.68%');
  assert.equal(bySymbol.PMEX_GOLD.tone, 'neg');
  assert.equal(bySymbol.PMEX_GOLD.stale, false);
  assert.equal(bySymbol.PMEX_GOLD.sourceChip, 'PMEX');

  const expectedSilver = pkrPerTolaFromUsdPerOz(52.27, USD_PKR);
  assert.ok(expectedSilver !== null);
  assert.equal(
    bySymbol.PMEX_SILVER.value,
    expectedSilver.toLocaleString('en-PK', {
      minimumFractionDigits: 2,
      maximumFractionDigits: 2,
    })
  );
  assert.equal(bySymbol.PMEX_SILVER.sourceChip, 'PMEX derived');
});

test('property feed: the quote-page parser anchors on qsp-price, not a widget number', () => {
  const html =
    '<div class="widget">141.31</div>' +
    '<fin-streamer data-testid="qsp-price" data-field="regularMarketPrice">381.03</fin-streamer>' +
    '<fin-streamer data-testid="qsp-price-change-percent">+0.56%</fin-streamer>';

  const parsed = parseYahooQuotePage(html);
  assert.equal(parsed?.price, 381.03);
  assert.equal(parsed?.changePct, 0.56);
  assert.equal(parseYahooQuotePage('<div>141.31</div>'), null);
  assert.equal(parseYahooQuotePage(''), null);
});

test('property card: ^DJUSRE shows the index level only — an index point is not a currency asset', () => {
  const quote: InstrumentQuote = {
    symbol: '^DJUSRE',
    label: 'Global property',
    region: 'international',
    pricePKR: 381.03,
    priceNote: 'index level',
    changePct: 0.56,
    fetchedAtIsoUtc: '2026-11-04T14:44:00Z',
    source: 'Yahoo quote page',
    fresh: true,
  };

  const card = buildPropertyCard(quote, NOW);
  assert.equal(card.value, '381.03');
  assert.equal(card.pkrValue, null); // no ≈ PKR line on an index card
  assert.equal(card.delta, '+0.56%');
  assert.equal(card.tone, 'pos');
  assert.equal(card.stale, false);
  assert.equal(card.urdu, 'عالمی رئیل اسٹیٹ');

  assert.equal(buildPropertyCard(null, NOW).value, 'No data');
  assert.equal(buildPropertyCard(null, NOW).pkrValue, null);
  assert.equal(buildPropertyCard(null, NOW).stale, true);
});
