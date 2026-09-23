import { getHoldings, updateHoldingPrice } from '../database/db';
import { Holding } from '../types';

const YAHOO_HOSTS = [
  'https://query1.finance.yahoo.com/v8/finance/chart',
  'https://query2.finance.yahoo.com/v8/finance/chart',
];
const CACHE_TTL_MS = 15 * 60 * 1000;
const STALE_AFTER_MS = 60 * 60 * 1000;

async function fetchPriceFromHost(host: string, ticker: string): Promise<number | null> {
  try {
    const response = await fetch(`${host}/${ticker}.KAR?interval=1d&range=1d`);
    if (!response.ok) return null;
    const data = await response.json();
    const meta = data?.chart?.result?.[0]?.meta;
    if (meta?.regularMarketPrice) return meta.regularMarketPrice;
    const close = data?.chart?.result?.[0]?.['indicators']?.quote?.[0]?.close?.[0];
    return typeof close === 'number' ? close : null;
  } catch {
    return null;
  }
}

async function fetchPrice(ticker: string): Promise<number | null> {
  for (const host of YAHOO_HOSTS) {
    const price = await fetchPriceFromHost(host, ticker);
    if (price !== null) return price;
  }
  return null;
}

export interface PriceFreshness {
  stale: boolean;
  label: string;
}

// Quotes are indicative end-of-day data, not a live feed. Labelling staleness is
// what keeps the portfolio screen honest when a fetch fails.
export function priceFreshness(lastFetched: string | null, now: number = Date.now()): PriceFreshness {
  if (!lastFetched) return { stale: true, label: 'Price not fetched yet' };

  const fetchedMs = Date.parse(lastFetched.includes('T') ? lastFetched : `${lastFetched}Z`);
  if (Number.isNaN(fetchedMs)) return { stale: true, label: 'Price freshness unknown' };

  const ageMs = now - fetchedMs;
  if (ageMs > 24 * 60 * 60 * 1000) {
    return { stale: true, label: `As of ${new Date(fetchedMs).toLocaleDateString('en-PK')}` };
  }
  if (ageMs > STALE_AFTER_MS) {
    const hours = Math.max(1, Math.round(ageMs / (60 * 60 * 1000)));
    return { stale: true, label: `${hours}h old` };
  }
  return { stale: false, label: 'Up to date' };
}

export function isStaleQuote(holding: Holding, now: number = Date.now()): boolean {
  return holding.current_price === null || priceFreshness(holding.last_fetched, now).stale;
}

export interface RefreshResult {
  success: number;
  failed: number;
  stale: number;
}

// A failed fetch leaves the last good price in place and reports it as stale
// rather than blanking the holding out.
export async function refreshAllPrices(): Promise<RefreshResult> {
  const holdings = await getHoldings();
  let success = 0;
  let failed = 0;
  let stale = 0;

  for (const h of holdings) {
    const isFresh = h.last_fetched && Date.now() - Date.parse(h.last_fetched.includes('T') ? h.last_fetched : `${h.last_fetched}Z`) < CACHE_TTL_MS;
    if (isFresh) {
      success++;
      continue;
    }

    const price = await fetchPrice(h.ticker);
    if (price !== null && h.id) {
      await updateHoldingPrice(h.id, price);
      success++;
    } else {
      failed++;
      if (h.current_price !== null) stale++;
    }
  }

  return { success, failed, stale };
}

export async function refreshSinglePrice(ticker: string, holdingId: number): Promise<number | null> {
  const price = await fetchPrice(ticker);
  if (price !== null) {
    await updateHoldingPrice(holdingId, price);
  }
  return price;
}
