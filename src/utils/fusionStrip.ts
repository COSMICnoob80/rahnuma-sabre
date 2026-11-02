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
  // "≈ PKR 755,292.00" for a USD-quoted card, converted with the same session's
  // PKR/USD. Null when the card is already PKR, is the FX pair itself, or the
  // rate is missing.
  pkrValue: string | null;
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
  'SI=F': 'چاندی',
  'HG=F': 'تانبا',
  'BZ=F': 'برینٹ',
  'PKR=X': 'ڈالر',
};

// These Yahoo tickers quote in US dollars, so the card shows the unit.
const USD_SYMBOLS = new Set(['GC=F', 'SI=F', 'HG=F', 'BZ=F']);

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

// Cards already denominated in PKR, plus the FX pair itself, are never
// multiplied by the rate (the rate card IS the converter).
const NO_PKR_CONVERSION = new Set(['KSE100.KAR', 'PKR=X']);

// The USD/PKR rate is read from the SAME snapshot the strip renders, so the
// conversion can never disagree with the rate card and no second fetch happens.
export function pkrRateFromQuotes(quotes: InstrumentQuote[]): number | null {
  const fx = quotes.find((quote) => quote.symbol === 'PKR=X');
  const rate = fx ? fx.pricePKR : null;
  if (rate === null || !Number.isFinite(rate) || rate <= 0) return null;
  return rate;
}

export function pkrConvert(usdValue: number | null, rate: number | null): number | null {
  if (usdValue === null || rate === null) return null;
  if (!Number.isFinite(usdValue) || !Number.isFinite(rate) || rate <= 0) return null;
  return Math.round((usdValue * rate + Number.EPSILON) * 100) / 100;
}

export function fusionPkrValue(quote: InstrumentQuote, rate: number | null): string | null {
  if (NO_PKR_CONVERSION.has(quote.symbol)) return null;
  const converted = pkrConvert(quote.pricePKR, rate);
  if (converted === null) return null;
  return `≈ PKR ${formatOutlookNumber(converted)}`;
}

export function buildFusionCards(quotes: InstrumentQuote[], now: number = Date.now()): FusionCard[] {
  const rate = pkrRateFromQuotes(quotes);
  return quotes.map((quote) => {
    const stale = quote.pricePKR === null || isFusionStale(quote.fetchedAtIsoUtc, now);
    return {
      symbol: quote.symbol,
      label: quote.label.toUpperCase(),
      urdu: URDU_LABELS[quote.symbol] ?? '',
      value: fusionValue(quote),
      pkrValue: fusionPkrValue(quote, rate),
      delta: formatChangePct(quote.changePct),
      tone: fusionTone(quote.changePct, stale),
      stale,
      timeLabel: fusionTimeLabel(quote.fetchedAtIsoUtc),
      source: quote.source,
    };
  });
}
