import { test } from 'node:test';
import assert from 'node:assert/strict';
import {
  FUSION_FRESH_WINDOW_MS,
  buildFusionCards,
  fusionPkrValue,
  fusionTimeLabel,
  fusionTone,
  fusionValue,
  isFusionStale,
  pkrConvert,
  pkrRateFromQuotes,
} from '../src/utils/fusionStrip.ts';
import type { InstrumentQuote } from '../src/services/globalMarkets.ts';

const NOW = Date.parse('2026-11-01T09:15:00.000Z');

function quote(overrides: Partial<InstrumentQuote> = {}): InstrumentQuote {
  return {
    symbol: 'KSE100.KAR',
    label: 'KSE-100',
    region: 'national',
    pricePKR: 162374.87,
    priceNote: null,
    changePct: -0.95,
    fetchedAtIsoUtc: '2026-11-01T09:10:00.000Z',
    source: 'PSX DPS indices',
    fresh: true,
    ...overrides,
  };
}

test('fusion: a quote inside the freshness window is not stale', () => {
  assert.equal(isFusionStale('2026-11-01T09:10:00.000Z', NOW), false);
  assert.equal(isFusionStale('2026-11-01T09:00:00.000Z', NOW), false);
  assert.equal(
    isFusionStale(new Date(NOW - FUSION_FRESH_WINDOW_MS).toISOString(), NOW),
    false
  );
});

test('fusion: a quote older than the window is stale', () => {
  assert.equal(
    isFusionStale(new Date(NOW - FUSION_FRESH_WINDOW_MS - 1000).toISOString(), NOW),
    true
  );
  assert.equal(isFusionStale('2026-11-01T07:45:00.000Z', NOW), true);
  assert.equal(isFusionStale('', NOW), true);
  assert.equal(isFusionStale('not-a-date', NOW), true);
});

test('fusion: a stale card never claims a positive tone', () => {
  assert.equal(fusionTone(1.1, false), 'pos');
  assert.equal(fusionTone(-0.95, false), 'neg');
  assert.equal(fusionTone(0, false), 'flat');
  assert.equal(fusionTone(null, false), 'flat');
  assert.equal(fusionTone(1.1, true), 'flat');
});

test('fusion: strip cards carry EN label, Urdu sublabel, mono value and delta', () => {
  const cards = buildFusionCards(
    [
      quote(),
      quote({
        symbol: '^IXIC',
        label: 'NASDAQ',
        region: 'international',
        pricePKR: 19077.4,
        priceNote: 'USD quoted',
        changePct: 1.1,
        source: 'Yahoo Finance chart',
      }),
    ],
    NOW
  );

  assert.equal(cards.length, 2);
  assert.deepEqual(
    {
      label: cards[0].label,
      urdu: cards[0].urdu,
      value: cards[0].value,
      delta: cards[0].delta,
      tone: cards[0].tone,
      stale: cards[0].stale,
    },
    {
      label: 'KSE-100',
      urdu: 'کے ایس ای 100',
      value: '162,374.87',
      delta: '-0.95%',
      tone: 'neg',
      stale: false,
    }
  );
  assert.equal(cards[1].urdu, 'ناسڈیک');
  assert.equal(cards[1].delta, '+1.10%');
  assert.equal(cards[1].tone, 'pos');
  assert.match(cards[1].timeLabel, /^\d{2}:\d{2}$/);
});

test('fusion: an old timestamp raises the STALE flag even with a fresh-looking price', () => {
  const cards = buildFusionCards(
    [
      quote({
        symbol: 'GC=F',
        label: 'Gold XAU',
        region: 'international',
        pricePKR: 2712,
        changePct: 0.42,
        fetchedAtIsoUtc: '2026-11-01T07:45:00.000Z',
        fresh: false,
      }),
    ],
    NOW
  );

  assert.equal(cards[0].stale, true);
  assert.equal(cards[0].tone, 'flat');
  assert.equal(cards[0].value, '$2,712.00');
  assert.equal(cards[0].urdu, 'سونا');
  // Local clock label: the shape is fixed, the hour depends on the device zone.
  assert.match(cards[0].timeLabel, /^\d{2}:\d{2}$/);
});

test('fusion: a missing quote is labelled, not blanked', () => {
  const missing = quote({
    symbol: 'BZ=F',
    label: 'Brent',
    pricePKR: null,
    priceNote: 'No quote on device',
    changePct: null,
    fetchedAtIsoUtc: '',
    source: 'none',
    fresh: false,
  });

  assert.equal(fusionValue(missing), 'No data');
  const [card] = buildFusionCards([missing], NOW);
  assert.equal(card.value, 'No data');
  assert.equal(card.delta, '—');
  assert.equal(card.stale, true);
  assert.equal(fusionTimeLabel(''), '—');
});

test('fusion: every non-PKR card carries a PKR value from the same session rate', () => {
  const fx = quote({
    symbol: 'PKR=X',
    label: 'USD/PKR',
    region: 'international',
    pricePKR: 278.5,
    priceNote: 'PKR quoted',
    changePct: 0.1,
    source: 'Yahoo Finance chart',
  });
  const gold = quote({
    symbol: 'GC=F',
    label: 'Gold XAU',
    region: 'international',
    pricePKR: 2712,
    priceNote: 'USD quoted',
    changePct: 0.42,
    source: 'Yahoo Finance chart',
  });
  const kse = quote();

  // Exact math: USD value x PKR/USD, rounded to paisa.
  assert.equal(pkrConvert(2712, 278.5), 755292);
  assert.equal(pkrConvert(null, 278.5), null);
  assert.equal(pkrConvert(2712, 0), null);

  const cards = buildFusionCards([kse, fx, gold], NOW);
  const bySymbol = Object.fromEntries(cards.map((entry) => [entry.symbol, entry]));

  assert.equal(bySymbol['GC=F'].pkrValue, '≈ PKR 755,292.00');
  // The PKR index and the FX pair itself are never multiplied by the rate.
  assert.equal(bySymbol['KSE100.KAR'].pkrValue, null);
  assert.equal(bySymbol['PKR=X'].pkrValue, null);

  // The rate comes from the snapshot — no second fetch and no rate, no value.
  assert.equal(pkrRateFromQuotes([kse, fx, gold]), 278.5);
  assert.equal(pkrRateFromQuotes([kse, gold]), null);
  assert.equal(fusionPkrValue(gold, null), null);
});
