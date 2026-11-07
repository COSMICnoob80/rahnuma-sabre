import { test } from 'node:test';
import assert from 'node:assert/strict';
import {
  COMPARE_WINDOWS,
  buildCompareSeries,
  chartGeometry,
  formatUtcDateLabel,
  normalizeTo100,
  sliceToWindow,
  yahooRangeForWindow,
} from '../src/utils/compareChart.ts';
import type { ComparePoint, RawCompareSeries } from '../src/utils/compareChart.ts';

const DAY = 24 * 60 * 60 * 1000;
const BASE = Date.UTC(2026, 0, 1);

function dailySeries(symbol: string, startValue: number, step: number, days = 200): RawCompareSeries {
  const points: ComparePoint[] = [];
  for (let day = 0; day < days; day++) {
    points.push({ t: BASE + day * DAY, v: startValue + day * step });
  }
  return { symbol, label: symbol, color: '#123456', points };
}

test('compare: normalizeTo100 rebases every series to 100 at its own start', () => {
  const a = normalizeTo100([
    { t: 0, v: 100 },
    { t: 1, v: 110 },
    { t: 2, v: 90 },
  ]);
  assert.deepEqual(
    a.map((point) => point.v),
    [100, 110, 90]
  );

  const b = normalizeTo100([
    { t: 0, v: 5000 },
    { t: 1, v: 7500 },
  ]);
  assert.deepEqual(
    b.map((point) => point.v),
    [100, 150]
  );

  // A zero/absent base cannot be rebased, so nothing is fabricated.
  assert.deepEqual(normalizeTo100([{ t: 0, v: 0 }]), []);
  assert.deepEqual(normalizeTo100([]), []);
});

test('compare: every series in the render set starts at exactly 100', () => {
  const raw = [
    dailySeries('KSE100.KAR', 162000, 100),
    dailySeries('^GSPC', 5000, 5),
    dailySeries('GC=F', 2700, -2),
  ];
  const series = buildCompareSeries(raw, 30);

  assert.equal(series.length, 3);
  for (const entry of series) {
    assert.equal(entry.normalized[0].v, 100);
    assert.notEqual(entry.netPct, null);
  }
});

test('compare: a staggered / partial arrival renders only the series that landed', () => {
  const populated = dailySeries('KSE100.KAR', 100, 1, 40);
  const empty: RawCompareSeries = {
    symbol: '^GSPC',
    label: 'S&P 500',
    color: '#abcdef',
    points: [],
  };

  const partial = buildCompareSeries([populated, empty], 30);
  assert.deepEqual(
    partial.map((entry) => entry.symbol),
    ['KSE100.KAR']
  );

  const full = buildCompareSeries([populated, dailySeries('^GSPC', 4000, 4, 40)], 30);
  assert.equal(full.length, 2);
});

test('compare: window toggle changes the sliced point count and net percentage', () => {
  const raw = [dailySeries('KSE100.KAR', 100, 1, 200)];

  const counts = COMPARE_WINDOWS.map((windowDays) => {
    const [series] = buildCompareSeries(raw, windowDays);
    assert.equal(series.normalized[0].v, 100);
    return series.points.length;
  });

  // Daily points over a 30/90/180 day window (inclusive of both ends).
  assert.deepEqual(counts, [31, 91, 181]);

  const [shortWindow] = buildCompareSeries(raw, 30);
  const [longWindow] = buildCompareSeries(raw, 180);
  assert.ok(shortWindow.netPct !== null && shortWindow.netPct > 0);
  assert.ok(longWindow.netPct !== null && shortWindow.netPct !== null);
  assert.ok(longWindow.netPct > shortWindow.netPct);
});

test('compare: window ends at the last observation, not the wall clock', () => {
  const points = [
    { t: BASE, v: 1 },
    { t: BASE + DAY, v: 2 },
    { t: BASE + 400 * DAY, v: 3 },
  ];
  const sliced = sliceToWindow(points, 30);
  // Only the final observation is within 30 days of the series end.
  assert.deepEqual(sliced, [{ t: BASE + 400 * DAY, v: 3 }]);
});

test('compare: yahoo ranges map to 1mo / 3mo / 6mo', () => {
  assert.equal(yahooRangeForWindow(30), '1mo');
  assert.equal(yahooRangeForWindow(90), '3mo');
  assert.equal(yahooRangeForWindow(180), '6mo');
});

test('compare: chart geometry draws one path per series and coarse UTC weekly labels', () => {
  const series = buildCompareSeries(
    [dailySeries('KSE100.KAR', 100, 1, 40), dailySeries('^GSPC', 4000, 4, 40)],
    30
  );
  const geometry = chartGeometry(series, 320, 190);

  assert.equal(geometry.lines.length, 2);
  for (const line of geometry.lines) {
    assert.match(line.path, /^M/);
  }
  assert.equal(geometry.gridY.length, 3);
  assert.ok(geometry.ticksX.length >= 1 && geometry.ticksX.length <= 6);
  for (const tick of geometry.ticksX) {
    assert.match(tick.label, /^\d{2} [A-Z][a-z]{2}$/);
  }
  assert.ok(geometry.max >= 100);
});

test('compare: date labels are computed in UTC, independent of the device zone', () => {
  assert.equal(formatUtcDateLabel(Date.UTC(2026, 0, 5)), '05 Jan');
  assert.equal(formatUtcDateLabel(Date.UTC(2026, 11, 31)), '31 Dec');
});
