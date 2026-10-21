import { test } from 'node:test';
import assert from 'node:assert/strict';
import { computeBriefing } from '../src/utils/briefing.ts';
import { priceFreshness } from '../src/services/priceFreshness.ts';

const HOUR_MS = 60 * 60 * 1000;
const DAY_MS = 24 * HOUR_MS;

function quoteAt(fetchedAtIsoUtc: string, pricePKR = 182.4) {
  return { pricePKR, fetchedAtIsoUtc, source: 'test-feed' };
}

test('briefing: planIntact is true at the equality boundary and false below it', () => {
  const equal = computeBriefing({
    plannedSipPKR: 12_000,
    spareCapacityPKR: 12_000,
    quote: null,
    unitsHistory: [],
  });
  assert.equal(equal.planIntact, true);

  const below = computeBriefing({
    plannedSipPKR: 12_000,
    spareCapacityPKR: 11_999.99,
    quote: null,
    unitsHistory: [],
  });
  assert.equal(below.planIntact, false);

  const above = computeBriefing({
    plannedSipPKR: 12_000,
    spareCapacityPKR: 12_500,
    quote: null,
    unitsHistory: [],
  });
  assert.equal(above.planIntact, true);
});

test('briefing: unitsToday divides the plan by price at 2dp, and is null without a quote', () => {
  const priced = computeBriefing({
    plannedSipPKR: 12_000,
    spareCapacityPKR: 12_000,
    quote: quoteAt(new Date().toISOString(), 182.4),
    unitsHistory: [],
  });
  assert.equal(priced.unitsToday, 65.79);
  assert.equal(priced.pricePKR, 182.4);

  const noQuote = computeBriefing({
    plannedSipPKR: 12_000,
    spareCapacityPKR: 12_000,
    quote: null,
    unitsHistory: [],
  });
  assert.equal(noQuote.unitsToday, null);
});

test('briefing: streakMonths counts the trailing positive run and stops at a gap', () => {
  const withGap = computeBriefing({
    plannedSipPKR: 12_000,
    spareCapacityPKR: 12_000,
    quote: null,
    unitsHistory: [
      { monthKey: '2026-04', units: 9 },
      { monthKey: '2026-05', units: 0 },
      { monthKey: '2026-06', units: 11 },
      { monthKey: '2026-07', units: 12 },
      { monthKey: '2026-08', units: 13 },
    ],
  });
  assert.equal(withGap.streakMonths, 3);

  const lastMonthZero = computeBriefing({
    plannedSipPKR: 12_000,
    spareCapacityPKR: 12_000,
    quote: null,
    unitsHistory: [
      { monthKey: '2026-06', units: 11 },
      { monthKey: '2026-07', units: 0 },
    ],
  });
  assert.equal(lastMonthZero.streakMonths, 0);

  const unbroken = computeBriefing({
    plannedSipPKR: 12_000,
    spareCapacityPKR: 12_000,
    quote: null,
    unitsHistory: [
      { monthKey: '2026-06', units: 11 },
      { monthKey: '2026-07', units: 12 },
      { monthKey: '2026-08', units: 13 },
    ],
  });
  assert.equal(unbroken.streakMonths, 3);

  const empty = computeBriefing({
    plannedSipPKR: 12_000,
    spareCapacityPKR: 12_000,
    quote: null,
    unitsHistory: [],
  });
  assert.equal(empty.streakMonths, 0);
});

test('briefing: a null quote yields null price, null freshness, and null unitsToday', () => {
  const result = computeBriefing({
    plannedSipPKR: 12_000,
    spareCapacityPKR: 9_000,
    quote: null,
    unitsHistory: [{ monthKey: '2026-08', units: 13 }],
  });
  assert.equal(result.pricePKR, null);
  assert.equal(result.freshnessLabel, null);
  assert.equal(result.unitsToday, null);
});

test('briefing: affordablePKR is the exact spare capacity passthrough', () => {
  const result = computeBriefing({
    plannedSipPKR: 20_000,
    spareCapacityPKR: 12_345.67,
    quote: null,
    unitsHistory: [],
  });
  assert.equal(result.affordablePKR, 12_345.67);
  assert.equal(result.planIntact, false);
});

test('briefing: unitsLastMonth is the final history entry, null when history is empty', () => {
  const withHistory = computeBriefing({
    plannedSipPKR: 12_000,
    spareCapacityPKR: 12_000,
    quote: null,
    unitsHistory: [
      { monthKey: '2026-07', units: 12 },
      { monthKey: '2026-08', units: 0 },
    ],
  });
  assert.equal(withHistory.unitsLastMonth, 0);

  const empty = computeBriefing({
    plannedSipPKR: 12_000,
    spareCapacityPKR: 12_000,
    quote: null,
    unitsHistory: [],
  });
  assert.equal(empty.unitsLastMonth, null);
});

test('briefing: freshness wording matches the shared priceFreshness helper', () => {
  const now = Date.now();
  const cases = [
    new Date(now).toISOString(),
    new Date(now - 3 * HOUR_MS).toISOString(),
    new Date(now - 2 * DAY_MS).toISOString(),
    'not-a-date',
  ];

  for (const fetchedAtIsoUtc of cases) {
    const result = computeBriefing({
      plannedSipPKR: 12_000,
      spareCapacityPKR: 12_000,
      quote: quoteAt(fetchedAtIsoUtc),
      unitsHistory: [],
    });
    assert.equal(result.freshnessLabel, priceFreshness(fetchedAtIsoUtc).label);
  }
});

test('briefing: output carries facts only, with no advisory or predictive fields', () => {
  const result = computeBriefing({
    plannedSipPKR: 12_000,
    spareCapacityPKR: 12_000,
    quote: quoteAt(new Date().toISOString()),
    unitsHistory: [{ monthKey: '2026-08', units: 13 }],
  });

  assert.deepEqual(Object.keys(result).sort(), [
    'affordablePKR',
    'freshnessLabel',
    'planIntact',
    'pricePKR',
    'streakMonths',
    'unitsLastMonth',
    'unitsToday',
  ]);
});
