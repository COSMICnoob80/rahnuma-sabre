/**
 * Fusion strip derivation for the Command Center.
 *
 * One place decides what a card says: the value, the signed change, the border
 * tone and whether the quote is stale. Pure on purpose — the stale chip is the
 * honest part of the screen, so it is unit-tested rather than trusted.
 *
 * The window is deliberately shorter than the 24h quote cache below it: a
 * quote fetched yesterday is not live, and the card says so.
 */

import type { InstrumentQuote } from '../services/globalMarkets';
import { formatChangePct, formatOutlookNumber } from '../services/globalMarkets.ts';

export const FUSION_FRESH_WINDOW_MS = 15 * 60 * 1000;

export type FusionTone = 'pos' | 'neg' | 'flat';

export interface FusionCard {
  symbol: string;
  label: string;
  urdu: string;
  value: string;
  delta: string;
  tone: FusionTone;
  stale: boolean;
  timeLabel: string;
  source: string;
}

// EN label comes from the quote itself; the Urdu sublabel is fixed per symbol.
const URDU_LABELS: Record<string, string> = {
  'KSE100.KAR': 'کے ایس ای 100',
  '^GSPC': 'ایس اینڈ پی 500',
  '^IXIC': 'ناسڈیک',
  'GC=F': 'سونا',
  'BZ=F': 'برینٹ',
  'PKR=X': 'ڈالر',
};

// These two Yahoo tickers quote in US dollars, so the card shows the unit.
const USD_SYMBOLS = new Set(['GC=F', 'BZ=F']);

export function isFusionStale(
  fetchedAtIsoUtc: string,
  now: number = Date.now(),
  windowMs: number = FUSION_FRESH_WINDOW_MS
): boolean {
  const fetchedAt = Date.parse(fetchedAtIsoUtc);
  if (!Number.isFinite(fetchedAt)) return true;
  const age = now - fetchedAt;
  if (!Number.isFinite(age)) return true;
  return age > windowMs;
}

export function fusionTone(changePct: number | null, stale: boolean): FusionTone {
  if (stale || changePct === null || !Number.isFinite(changePct) || changePct === 0) return 'flat';
  return changePct > 0 ? 'pos' : 'neg';
}

export function fusionTimeLabel(fetchedAtIsoUtc: string): string {
  const fetchedAt = Date.parse(fetchedAtIsoUtc);
  if (!Number.isFinite(fetchedAt)) return '—';
  const at = new Date(fetchedAt);
  return `${String(at.getHours()).padStart(2, '0')}:${String(at.getMinutes()).padStart(2, '0')}`;
}

export function fusionValue(quote: InstrumentQuote): string {
  if (quote.pricePKR === null || !Number.isFinite(quote.pricePKR)) return 'No data';
  const formatted = formatOutlookNumber(quote.pricePKR);
  return USD_SYMBOLS.has(quote.symbol) ? `$${formatted}` : formatted;
}

export function buildFusionCards(quotes: InstrumentQuote[], now: number = Date.now()): FusionCard[] {
  return quotes.map((quote) => {
    const stale = quote.pricePKR === null || isFusionStale(quote.fetchedAtIsoUtc, now);
    return {
      symbol: quote.symbol,
      label: quote.label.toUpperCase(),
      urdu: URDU_LABELS[quote.symbol] ?? '',
      value: fusionValue(quote),
      delta: formatChangePct(quote.changePct),
      tone: fusionTone(quote.changePct, stale),
      stale,
      timeLabel: fusionTimeLabel(quote.fetchedAtIsoUtc),
      source: quote.source,
    };
  });
}
