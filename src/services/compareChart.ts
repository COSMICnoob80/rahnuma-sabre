/**
 * Local vs global comparison series.
 *
 * Five instruments, one shared timeline, every series normalized to 100 at its
 * own start (see src/utils/compareChart.ts). Data comes from the same Yahoo
 * chart endpoint the outlook lane already uses — query1 first, query2 fallback,
 * browser UA, 8 s abort. This runs on the phone's own network; a 429 from a
 * fixed host does not mean the phone is blocked, so failures degrade per series
 * and the screen renders whatever arrived.
 *
 * GOLD uses `GC=F` (the app's verified gold future). PMEX has no historical
 * chart endpoint, so there is nothing to fetch there.
 */

import { colors } from '../theme/colors.ts';
import type { ComparePoint, RawCompareSeries } from '../utils/compareChart.ts';
import { yahooRangeForWindow } from '../utils/compareChart.ts';

export interface CompareSpec {
  symbol: string;
  label: string;
  color: string;
}

export const COMPARE_SERIES: CompareSpec[] = [
  { symbol: 'KSE100.KAR', label: 'KSE-100', color: colors.series[0] },
  { symbol: '^GSPC', label: 'S&P 500', color: colors.series[1] },
  { symbol: 'GC=F', label: 'GOLD', color: colors.series[2] },
  { symbol: 'BZ=F', label: 'BRENT', color: colors.series[3] },
  { symbol: '^DJUSRE', label: 'US REAL ESTATE', color: colors.series[4] },
];

const YAHOO_HOSTS = [
  'https://query1.finance.yahoo.com/v8/finance/chart',
  'https://query2.finance.yahoo.com/v8/finance/chart',
];
const BROWSER_UA =
  'Mozilla/5.0 (Linux; Android 10) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/124.0 Mobile Safari/537.36';
const REQUEST_TIMEOUT_MS = 8_000;

export function compareChartUrl(host: string, symbol: string, windowDays: number): string {
  return `${host}/${encodeURIComponent(symbol)}?interval=1d&range=${yahooRangeForWindow(windowDays)}`;
}

// Yahoo chart payload: parallel `timestamp[]` and `indicators.quote[0].close[]`.
// A null close (halted day, holiday padding) is dropped, not carried as zero.
export function parseYahooChartSeries(data: unknown): ComparePoint[] {
  const result = (data as any)?.chart?.result?.[0];
  const timestamps = result?.timestamp;
  const closes = result?.indicators?.quote?.[0]?.close;
  if (!Array.isArray(timestamps) || !Array.isArray(closes)) return [];

  const points: ComparePoint[] = [];
  const length = Math.min(timestamps.length, closes.length);
  for (let index = 0; index < length; index++) {
    const seconds = timestamps[index];
    const close = closes[index];
    if (typeof seconds !== 'number' || typeof close !== 'number') continue;
    if (!Number.isFinite(seconds) || !Number.isFinite(close) || close <= 0) continue;
    points.push({ t: seconds * 1000, v: close });
  }
  return points;
}

async function fetchWithTimeout(url: string): Promise<Response | null> {
  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), REQUEST_TIMEOUT_MS);
  try {
    return await fetch(url, {
      headers: {
        'User-Agent': BROWSER_UA,
        Accept: 'application/json,text/plain,*/*',
      },
      signal: controller.signal,
    });
  } catch {
    return null;
  } finally {
    clearTimeout(timer);
  }
}

// Resolves to a series with an empty point list when both hosts fail, so the
// caller can mark that legend line "unavailable" without an exception branch.
export async function fetchCompareSeries(
  spec: CompareSpec,
  windowDays: number
): Promise<RawCompareSeries> {
  for (const host of YAHOO_HOSTS) {
    const response = await fetchWithTimeout(compareChartUrl(host, spec.symbol, windowDays));
    if (!response || !response.ok) continue;
    const data = await response.json().catch(() => null);
    const points = parseYahooChartSeries(data);
    if (points.length > 0) {
      return { symbol: spec.symbol, label: spec.label, color: spec.color, points };
    }
  }

  return { symbol: spec.symbol, label: spec.label, color: spec.color, points: [] };
}
