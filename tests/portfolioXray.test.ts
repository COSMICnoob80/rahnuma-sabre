import { test } from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import {
  computePortfolioXray,
  XRAY_HEADER,
  XRAY_SCOPE,
} from '../src/utils/portfolioXray.ts';
import type { XrayInput } from '../src/utils/portfolioXray.ts';

const PORTFOLIO_SOURCE = readFileSync('src/screens/PortfolioScreen.tsx', 'utf8');

// Six ledger rows: value 12,400 total, cost basis 10,390 total.
const FIXTURE: XrayInput[] = [
  { ticker: 'A', quantity: 100, price: 60, costBasis: 5000, sector: 'Banks' },
  { ticker: 'F', quantity: 100, price: 40, costBasis: 3500, sector: 'Cement' },
  { ticker: 'B', quantity: 50, price: 40, costBasis: 1500, sector: 'E&P' },
  { ticker: 'C', quantity: 10, price: 20, costBasis: 250, sector: 'Banks' },
  { ticker: 'D', quantity: 5, price: 30, costBasis: 100, sector: 'Fertilizer' },
  { ticker: 'E', quantity: 1, price: 50, costBasis: 40, sector: 'Other' },
];

const TOTAL = 6000 + 4000 + 2000 + 200 + 150 + 50;

test('xray: weights are value shares that sum to 100 ± 0.5 and sort largest first', () => {
  const xray = computePortfolioXray(FIXTURE);

  assert.equal(xray.totalValue, TOTAL);
  assert.equal(xray.holdingsCount, FIXTURE.length);
  assert.deepEqual(xray.weights.map((row) => row.ticker), ['A', 'F', 'B', 'C', 'D', 'E']);

  const summed = xray.weights.reduce((sum, row) => sum + row.weightPct, 0);
  assert.ok(Math.abs(summed - 100) < 0.5, `weights sum to ${summed}`);

  for (const row of xray.weights) {
    assert.ok(Math.abs(row.weightPct - (row.value / TOTAL) * 100) < 1e-9);
  }
});

test('xray: largest holding and top-five share are exact ratios over the ledger', () => {
  const xray = computePortfolioXray(FIXTURE);

  assert.ok(Math.abs(xray.largestHoldingPct - (6000 / TOTAL) * 100) < 1e-9);
  assert.ok(Math.abs(xray.topFivePct - ((6000 + 4000 + 2000 + 200 + 150) / TOTAL) * 100) < 1e-9);

  const single = computePortfolioXray([FIXTURE[0]]);
  assert.equal(single.largestHoldingPct, 100);
  assert.equal(single.topFivePct, 100);
});

test('xray: HHI is the sum of squared fractional weights', () => {
  const xray = computePortfolioXray(FIXTURE);
  const expected =
    (6000 ** 2 + 4000 ** 2 + 2000 ** 2 + 200 ** 2 + 150 ** 2 + 50 ** 2) / TOTAL ** 2;

  assert.ok(Math.abs(xray.hhi - expected) < 1e-12, `HHI ${xray.hhi} != ${expected}`);
  assert.ok(xray.hhi > 0 && xray.hhi <= 1);

  const single = computePortfolioXray([FIXTURE[0]]);
  assert.equal(single.hhi, 1);
});

test('xray: cost basis is the exact sum of the ledger rows', () => {
  const xray = computePortfolioXray(FIXTURE);
  assert.equal(xray.totalCostBasis, 5000 + 3500 + 1500 + 250 + 100 + 40);
});

test('xray: sector split aggregates the holdings sectors and sums to 100 ± 0.5', () => {
  const xray = computePortfolioXray(FIXTURE);

  assert.deepEqual(xray.sectorSplit.map((row) => row.sector), [
    'Banks',
    'Cement',
    'E&P',
    'Fertilizer',
    'Other',
  ]);
  assert.equal(xray.sectorSplit[0].value, 6200);
  assert.ok(Math.abs(xray.sectorSplit[0].pct - (6200 / TOTAL) * 100) < 1e-9);

  const summed = xray.sectorSplit.reduce((sum, row) => sum + row.pct, 0);
  assert.ok(Math.abs(summed - 100) < 0.5, `sector shares sum to ${summed}`);
});

test('xray: an empty ledger returns zeros, never NaN', () => {
  const xray = computePortfolioXray([]);

  assert.equal(xray.holdingsCount, 0);
  assert.equal(xray.totalValue, 0);
  assert.equal(xray.totalCostBasis, 0);
  assert.deepEqual(xray.weights, []);
  assert.deepEqual(xray.sectorSplit, []);
  assert.equal(xray.largestHoldingPct, 0);
  assert.equal(xray.topFivePct, 0);
  assert.equal(xray.hhi, 0);
});

test('xray: an unpriced holding adds no weight but still counts in holdings and cost basis', () => {
  const xray = computePortfolioXray([
    { ticker: 'A', quantity: 10, price: 100, costBasis: 900, sector: 'Banks' },
    { ticker: 'B', quantity: 5, price: 0, costBasis: 400, sector: 'E&P' },
  ]);

  assert.equal(xray.holdingsCount, 2);
  assert.equal(xray.totalCostBasis, 1300);
  assert.equal(xray.totalValue, 1000);
  assert.deepEqual(xray.weights.map((row) => row.ticker), ['A']);
  assert.equal(xray.weights[0].weightPct, 100);
  assert.equal(xray.hhi, 1);
});

test('xray: the header is the ledger facts line and the copy carries no benchmark judgement', () => {
  assert.equal(XRAY_HEADER, 'Your composition — facts from your own ledger.');

  const copy = `${XRAY_HEADER} ${XRAY_SCOPE}`;
  assert.equal(
    /overweight|underweight|diversif|rebalance|concentrat|benchmark|style box/i.test(copy),
    false,
    'X-ray copy carries a benchmark-relative judgement'
  );

  assert.match(PORTFOLIO_SOURCE, /computePortfolioXray/);
  assert.match(PORTFOLIO_SOURCE, /\{XRAY_HEADER\}/);
});
