import { test } from 'node:test';
import assert from 'node:assert/strict';
import {
  calculateCGT,
  cgtTrancheFor,
  calculateSIP,
  calculateAssetROI,
  calculateDevaluation,
  calculateFIRE,
  capitalGainsSuperTaxNote,
  daysBetween,
  formatPKR,
} from '../src/utils/calculators.ts';

// ---------- CGT: acquisition-date awareness (Finance Act 2025) ----------

test('CGT: acquisition on/after 1 Jul 2024 is flat 15% regardless of holding period', () => {
  const short = calculateCGT(25.5, 32, 1000, 250, '2026-01-01');
  assert.equal(short.rate, 0.15);
  assert.equal(short.tax, 975);

  // Regression: the old engine returned 0% here. Flat 15% applies even after 6 years.
  const long = calculateCGT(25.5, 32, 1000, 1500, '2026-01-01');
  assert.equal(long.rate, 0.15);
  assert.equal(long.tax, 975);

  const veryLong = calculateCGT(25.5, 32, 1000, 3000, '2025-08-01');
  assert.equal(veryLong.tax, 975);
});

test('CGT: missing acquisition date defaults to today (flat 15%)', () => {
  const result = calculateCGT(100, 200, 10, 4000);
  assert.equal(result.tranche, 'flat_post_2024');
  assert.equal(result.tax, 150);
});

test('CGT: securities acquired 1 Jul 2022 - 30 Jun 2024 use the progressive slab', () => {
  const short = calculateCGT(100, 200, 100, 250, '2023-01-01');
  assert.equal(short.rate, 0.125);
  assert.equal(short.tax, 1250);

  const twoYears = calculateCGT(100, 200, 100, 800, '2023-01-01');
  assert.equal(twoYears.rate, 0.1);
  assert.equal(twoYears.tax, 1000);

  const sixYears = calculateCGT(100, 200, 100, 365 * 6, '2023-01-01');
  assert.equal(sixYears.rate, 0);
  assert.equal(sixYears.tax, 0);
});

test('CGT: securities acquired 1 Jul 2013 - 30 Jun 2022 use the pre-2024 slab', () => {
  assert.equal(calculateCGT(100, 200, 100, 100, '2020-01-01').rate, 0.15);
  assert.equal(calculateCGT(100, 200, 100, 500, '2020-01-01').rate, 0.125);
  assert.equal(calculateCGT(100, 200, 100, 365 * 7, '2020-01-01').rate, 0);
});

test('CGT: securities acquired before 1 Jul 2013 are exempt', () => {
  const result = calculateCGT(10, 500, 1000, 100, '2010-05-05');
  assert.equal(result.tranche, 'exempt_pre_2013');
  assert.equal(result.tax, 0);
  assert.equal(result.netGain, 490000);
});

test('CGT: losses attract zero tax and keep the negative gain', () => {
  const result = calculateCGT(200, 150, 10, 100, '2026-01-01');
  assert.equal(result.gain, -500);
  assert.equal(result.tax, 0);
  assert.equal(result.netGain, -500);
});

test('CGT: tranche boundaries are computed on the acquisition date', () => {
  assert.equal(cgtTrancheFor('2013-06-30'), 'exempt_pre_2013');
  assert.equal(cgtTrancheFor('2013-07-01'), 'legacy_2013_2022');
  assert.equal(cgtTrancheFor('2022-06-30'), 'legacy_2013_2022');
  assert.equal(cgtTrancheFor('2022-07-01'), 'progressive_2022_2024');
  assert.equal(cgtTrancheFor('2024-06-30'), 'progressive_2022_2024');
  assert.equal(cgtTrancheFor('2024-07-01'), 'flat_post_2024');
});

test('CGT: super tax note only fires above Rs 150,000,000 of gain', () => {
  assert.equal(capitalGainsSuperTaxNote(149_999_999), null);
  assert.ok(capitalGainsSuperTaxNote(150_000_001));
});

// ---------- FIRE ----------

test('FIRE: 4% withdrawal rate implies a 25x annual-expense target', () => {
  const result = calculateFIRE(100000, 0, 50000, 10);
  assert.equal(result.targetCorpus, 30_000_000);
  assert.ok(result.yearsToFire > 0);
});

test('FIRE: a 3.5% withdrawal rate raises the required corpus', () => {
  const result = calculateFIRE(100000, 0, 50000, 10, 0, 3.5);
  assert.ok(Math.abs(result.targetCorpus - 34_285_714.29) < 1);
});

test('FIRE: inflation lowers the real return and delays the goal', () => {
  const nominal = calculateFIRE(100000, 0, 50000, 12);
  const real = calculateFIRE(100000, 0, 50000, 12, 10);
  assert.ok(real.realReturn < 12);
  assert.ok(real.yearsToFire >= nominal.yearsToFire);
});

test('FIRE: already at target reports zero years and full progress', () => {
  const result = calculateFIRE(100000, 50_000_000, 0, 10);
  assert.equal(result.yearsToFire, 0);
  assert.equal(result.progressPct, 100);
});

// ---------- SIP / ROI / devaluation ----------

test('SIP: zero return means value equals contributions', () => {
  const result = calculateSIP(10000, 0, 5);
  assert.equal(result.invested, 600000);
  assert.equal(result.totalValue, 600000);
  assert.equal(result.returns, 0);
});

test('SIP: 12% over 10 years compounds above contributions', () => {
  const result = calculateSIP(10000, 12, 10);
  assert.equal(result.invested, 1_200_000);
  assert.ok(Math.abs(result.totalValue - 2_323_391) < 5);
  assert.equal(result.yearlyData.length, 10);
  assert.equal(result.yearlyData[0].year, 1);
});

test('ROI: doubles over 5 years annualizes to 14.87%', () => {
  const result = calculateAssetROI(100, 200, 5);
  assert.equal(result.totalReturn, 100);
  assert.ok(Math.abs(result.annualizedReturn - 14.8698) < 0.001);
});

test('Devaluation: honours a caller-supplied USD base rate', () => {
  const result = calculateDevaluation(1_000_000, 20, 280);
  assert.equal(result.usdEquivalent, 3571.4285714285716);
  assert.equal(result.impliedUsdRate, 336);
  assert.equal(result.loss, -200000);
});

test('daysBetween counts whole days and never goes negative', () => {
  assert.equal(daysBetween('2026-01-01', '2026-01-11'), 10);
  assert.equal(daysBetween('2026-02-01', '2026-01-01'), 0);
});

test('formatPKR renders whole rupees', () => {
  assert.equal(formatPKR(1234567), 'Rs. 1,234,567');
});
