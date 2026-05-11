import { getHoldings, updateHoldingPrice } from '../database/db';

const YAHOO_BASE = 'https://query1.finance.yahoo.com/v8/finance/chart';
const CACHE_TTL_MS = 15 * 60 * 1000;

async function fetchPrice(ticker: string): Promise<number | null> {
  try {
    const url = `${YAHOO_BASE}/${ticker}.KAR?interval=1d&range=1d`;
    const response = await fetch(url);
    const data = await response.json();
    const meta = data?.chart?.result?.[0]?.meta;
    if (meta?.regularMarketPrice) {
      return meta.regularMarketPrice;
    }
    const close = data?.chart?.result?.[0]?.['indicators']?.quote?.[0]?.close?.[0];
    return close ?? null;
  } catch {
    return null;
  }
}

export async function refreshAllPrices(): Promise<{ success: number; failed: number }> {
  const holdings = await getHoldings();
  let success = 0;
  let failed = 0;

  for (const h of holdings) {
    if (h.last_fetched) {
      const lastFetch = new Date(h.last_fetched).getTime();
      if (Date.now() - lastFetch < CACHE_TTL_MS) {
        success++;
        continue;
      }
    }

    const price = await fetchPrice(h.ticker);
    if (price !== null && h.id) {
      await updateHoldingPrice(h.id, price);
      success++;
    } else {
      failed++;
    }
  }

  return { success, failed };
}

export async function refreshSinglePrice(ticker: string, holdingId: number): Promise<number | null> {
  const price = await fetchPrice(ticker);
  if (price !== null) {
    await updateHoldingPrice(holdingId, price);
  }
  return price;
}
