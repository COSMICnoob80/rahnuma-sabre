const STALE_AFTER_MS = 60 * 60 * 1000;

export interface PriceFreshness {
  stale: boolean;
  label: string;
}

// Quotes are indicative end-of-day data, not a live feed. Labelling staleness is
// what keeps the portfolio screen honest when a fetch fails.
export function priceFreshness(
  lastFetched: string | null,
  now: number = Date.now()
): PriceFreshness {
  if (!lastFetched) return { stale: true, label: 'Price not fetched yet' };

  // SQLite's datetime('now') has no timezone, so a bare timestamp is UTC.
  const fetchedMs = Date.parse(lastFetched.includes('T') ? lastFetched : `${lastFetched.replace(' ', 'T')}Z`);
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

export function isQuoteStale(
  lastFetched: string | null,
  currentPrice: number | null,
  now: number = Date.now()
): boolean {
  return currentPrice === null || priceFreshness(lastFetched, now).stale;
}
