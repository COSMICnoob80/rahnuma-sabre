/**
 * Local vs global comparison chart — pure maths.
 *
 * Every series is normalized to 100 at its first observation in the selected
 * window, so five different instruments on five different scales share one y
 * axis. The x axis is a shared timeline. This module owns the window math and
 * the pixel geometry; the screen owns the fetch and the labels.
 *
 * Missing / staggered series are handled by omission: a series with no points
 * does not enter the render set, and the screen draws its legend line as
 * "unavailable". There is no interpolation and no fabricated value.
 */

export interface ComparePoint {
  t: number; // epoch ms
  v: number; // raw observation (price or index level)
}

export interface RawCompareSeries {
  symbol: string;
  label: string;
  color: string;
  points: ComparePoint[];
}

export interface CompareSeries extends RawCompareSeries {
  normalized: ComparePoint[];
  first: number | null;
  last: number | null;
  netPct: number | null;
}

export const COMPARE_WINDOWS = [30, 90, 180] as const;
export type CompareWindow = (typeof COMPARE_WINDOWS)[number];
export const DEFAULT_COMPARE_WINDOW: CompareWindow = 30;

const DAY_MS = 24 * 60 * 60 * 1000;
const MONTHS = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];

function round2(value: number): number {
  return Math.round((value + Number.EPSILON) * 100) / 100;
}

// Yahoo chart ranges that cover each window without a second endpoint shape.
export function yahooRangeForWindow(days: number): '1mo' | '3mo' | '6mo' {
  if (days <= 30) return '1mo';
  if (days <= 90) return '3mo';
  return '6mo';
}

// The window ends at the series' own last observation, never at the wall
// clock: a market that did not trade today still shows its full window.
export function sliceToWindow(points: ComparePoint[], windowDays: number): ComparePoint[] {
  if (points.length === 0) return [];
  const end = points[points.length - 1].t;
  const cutoff = end - windowDays * DAY_MS;
  return points.filter(
    (point) => Number.isFinite(point.t) && Number.isFinite(point.v) && point.t >= cutoff
  );
}

export function normalizeTo100(points: ComparePoint[]): ComparePoint[] {
  if (points.length === 0) return [];
  const base = points[0].v;
  if (!Number.isFinite(base) || base === 0) return [];
  return points.map((point) => ({ t: point.t, v: round2((point.v / base) * 100) }));
}

// Only series that actually carry observations in the window are returned.
// This is what makes a staggered fetch render safely as a partial set.
export function buildCompareSeries(
  raw: RawCompareSeries[],
  windowDays: number
): CompareSeries[] {
  const built: CompareSeries[] = [];

  for (const series of raw) {
    const windowed = sliceToWindow(series.points, windowDays);
    const normalized = normalizeTo100(windowed);
    if (normalized.length === 0) continue;

    const first = windowed[0].v;
    const last = windowed[windowed.length - 1].v;
    const netPct = first !== 0 ? round2(((last - first) / first) * 100) : null;

    built.push({ ...series, points: windowed, normalized, first, last, netPct });
  }

  return built;
}

export function formatUtcDateLabel(ms: number): string {
  const date = new Date(ms);
  return `${String(date.getUTCDate()).padStart(2, '0')} ${MONTHS[date.getUTCMonth()]}`;
}

export interface ChartPad {
  top: number;
  right: number;
  bottom: number;
  left: number;
}

export const DEFAULT_CHART_PAD: ChartPad = { top: 10, right: 8, bottom: 22, left: 34 };

export interface ChartLine {
  symbol: string;
  color: string;
  path: string;
}

export interface ChartGridY {
  y: number;
  value: number;
}

export interface ChartTickX {
  x: number;
  label: string;
}

export interface ChartGeometry {
  width: number;
  height: number;
  lines: ChartLine[];
  gridY: ChartGridY[];
  ticksX: ChartTickX[];
  min: number;
  max: number;
}

export function chartGeometry(
  series: CompareSeries[],
  width: number,
  height: number,
  pad: ChartPad = DEFAULT_CHART_PAD
): ChartGeometry {
  const plotW = Math.max(1, width - pad.left - pad.right);
  const plotH = Math.max(1, height - pad.top - pad.bottom);
  const points = series.flatMap((entry) => entry.normalized);

  if (points.length === 0) {
    return { width, height, lines: [], gridY: [], ticksX: [], min: 0, max: 0 };
  }

  let minT = Infinity;
  let maxT = -Infinity;
  let minV = Infinity;
  let maxV = -Infinity;
  for (const point of points) {
    minT = Math.min(minT, point.t);
    maxT = Math.max(maxT, point.t);
    minV = Math.min(minV, point.v);
    maxV = Math.max(maxV, point.v);
  }
  if (maxT === minT) maxT = minT + 1;
  if (maxV === minV) maxV = minV + 1;

  const xOf = (t: number) => pad.left + ((t - minT) / (maxT - minT)) * plotW;
  const yOf = (v: number) => pad.top + ((maxV - v) / (maxV - minV)) * plotH;

  const lines: ChartLine[] = series.map((entry) => ({
    symbol: entry.symbol,
    color: entry.color,
    path: entry.normalized
      .map((point, index) => `${index === 0 ? 'M' : 'L'}${round2(xOf(point.t))} ${round2(yOf(point.v))}`)
      .join(' '),
  }));

  const gridY: ChartGridY[] = [minV, (minV + maxV) / 2, maxV].map((value) => ({
    y: round2(yOf(value)),
    value: round2(value),
  }));

  const week = 7 * DAY_MS;
  const ticksX: ChartTickX[] = [];
  for (let t = Math.ceil(minT / week) * week; t <= maxT; t += week) {
    ticksX.push({ x: round2(xOf(t)), label: formatUtcDateLabel(t) });
  }
  // Coarse weekly labels: at most ~6 on a portrait canvas.
  const step = Math.max(1, Math.ceil(ticksX.length / 6));
  const coarseTicks = ticksX.filter((_, index) => index % step === 0);

  return { width, height, lines, gridY, ticksX: coarseTicks, min: round2(minV), max: round2(maxV) };
}
