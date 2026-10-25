/**
 * Global markets data layer for the morning outlook screen.
 *
 * Facts only: every quote carries its value, change and freshness. Missing
 * data is labelled, never blanked out. The layer never throws — a failed
 * instrument is reported in `degraded` and the last durable cache value is
 * rendered as cached instead of disappearing.
 */

export type OutlookRegion = 'national' | 'international';

export interface InstrumentQuote {
  symbol: string;
  label: string;
  region: OutlookRegion;
  pricePKR: number | null;
  priceNote: string | null;
  changePct: number | null;
  fetchedAtIsoUtc: string;
  source: string;
  fresh: boolean;
}

export interface OutlookSymbol {
  sourceSymbol: string;
  display: string;
  region: OutlookRegion;
}

// The national row is resolved by its own ladder (see NATIONAL_PROVIDER_LADDER):
// PSX's own DPS indices page first, then a remembered Yahoo suffix probe.
// The remaining symbols are Yahoo chart tickers.
export const OUTLOOK_SYMBOLS: OutlookSymbol[] = [
  { sourceSymbol: 'KSE100.KAR', display: 'KSE-100', region: 'national' },
  { sourceSymbol: '^GSPC', display: 'S&P 500', region: 'international' },
  { sourceSymbol: '^IXIC', display: 'NASDAQ', region: 'international' },
  { sourceSymbol: 'GC=F', display: 'Gold XAU', region: 'international' },
  { sourceSymbol: 'BZ=F', display: 'Brent', region: 'international' },
  { sourceSymbol: 'PKR=X', display: 'USD/PKR', region: 'international' },
];

const YAHOO_HOSTS = [
  'https://query1.finance.yahoo.com/v8/finance/chart',
  'https://query2.finance.yahoo.com/v8/finance/chart',
];
const BROWSER_UA =
  'Mozilla/5.0 (Linux; Android 10) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/124.0 Mobile Safari/537.36';
const REQUEST_TIMEOUT_MS = 8_000;
const YAHOO_SOURCE = 'Yahoo Finance chart';
const STOOQ_SOURCE = 'Stooq CSV';
const STOOQ_BASE = 'https://stooq.com/q/l/';

// PSX Data Portal. The /timeseries/{eod,int}/{symbol} JSON routes are WAF-gated
// for this client family (probed 2026-10-25: 404 bare, 403 with XHR headers), so
// the server-rendered pages are the verified free path.
const DPS_SOURCE = 'PSX DPS indices';
const DPS_INDICES_URL = 'https://dps.psx.com.pk/indices';
const DPS_COMPANY_BASE = 'https://dps.psx.com.pk/company';

export const OUTLOOK_CACHE_PREFIX = 'outlook_cache_';
export const OUTLOOK_CACHE_TTL_MS = 24 * 60 * 60 * 1000;

export interface OutlookCacheEntry {
  t: number;
  price: number;
  changePct: number | null;
  source: string;
  priceNote: string | null;
}

export interface ParsedMarketQuote {
  price: number;
  changePct: number | null;
  currency: string | null;
}

export function outlookCacheKey(sourceSymbol: string): string {
  return OUTLOOK_CACHE_PREFIX + sourceSymbol;
}

export function isCacheFresh(fetchedAtMs: number, now: number = Date.now()): boolean {
  if (!Number.isFinite(fetchedAtMs)) return false;
  const age = now - fetchedAtMs;
  return age >= 0 && age <= OUTLOOK_CACHE_TTL_MS;
}

export function round2(value: number): number {
  return Math.round((value + Number.EPSILON) * 100) / 100;
}

export function yahooChartUrl(host: string, sourceSymbol: string): string {
  return `${host}/${encodeURIComponent(sourceSymbol)}?interval=1d&range=5d`;
}

export function parseYahooChart(data: unknown): ParsedMarketQuote | null {
  const result = (data as any)?.chart?.result?.[0];
  const meta = result?.meta;
  if (!meta) return null;

  let price: number | null =
    typeof meta.regularMarketPrice === 'number' ? meta.regularMarketPrice : null;
  if (price === null) {
    const close = result?.indicators?.quote?.[0]?.close?.[0];
    price = typeof close === 'number' ? close : null;
  }
  if (price === null || !Number.isFinite(price)) return null;

  let changePct: number | null = null;
  const previousClose =
    typeof meta.chartPreviousClose === 'number'
      ? meta.chartPreviousClose
      : typeof meta.previousClose === 'number'
        ? meta.previousClose
        : null;
  if (previousClose !== null && previousClose > 0) {
    changePct = round2(((price - previousClose) / previousClose) * 100);
  } else if (typeof meta.regularMarketChangePercent === 'number') {
    changePct = round2(meta.regularMarketChangePercent);
  }

  const currency = typeof meta.currency === 'string' ? meta.currency : null;
  return { price, changePct, currency };
}

// stooq answers with CSV only when the symbol is live. An HTML error or robot
// challenge page parses to null, which is why this doubles as the runtime
// coverage probe: unverified symbols are never used.
export function parseStooqCsv(csv: string): ParsedMarketQuote | null {
  const rows = csv.trim().split(/\r?\n/);
  if (rows.length < 2) return null;
  const header = rows[0].split(',').map((cell) => cell.trim().toLowerCase());
  const closeIndex = header.indexOf('close');
  if (closeIndex < 0) return null;
  const cells = rows[1].split(',');
  const price = Number(cells[closeIndex]);
  if (!Number.isFinite(price) || price <= 0) return null;
  return { price, changePct: null, currency: null };
}

// DPS /indices is a server-rendered table (captured 2026-10-25). One row per
// index, five numeric cells in this documented order:
//   <td data-order="163966.86"> high
//   <td data-order="162292.44"> low
//   <td data-order="162374.87"> current
//   <td data-order="-1549.44"> change
//   <td data-order="-0.945216…"> % change
// The anchor is the row's own data-code, so $INDX tables for other codes on the
// page cannot be mistaken for it.
export function parseDpsIndexRow(html: string, indexCode = 'KSE100'): ParsedMarketQuote | null {
  if (typeof html !== 'string' || html.length === 0) return null;
  const anchor = html.indexOf(`data-code="${indexCode}"`);
  if (anchor < 0) return null;
  const rowStart = html.lastIndexOf('<tr', anchor);
  const rowEnd = html.indexOf('</tr>', anchor);
  if (rowStart < 0 || rowEnd < 0) return null;

  const orders: number[] = [];
  const cell = /data-order="(-?\d+(?:\.\d+)?)"/g;
  const row = html.slice(rowStart, rowEnd);
  let match: RegExpExecArray | null;
  while ((match = cell.exec(row)) !== null) {
    orders.push(Number(match[1]));
  }
  if (orders.length < 5) return null;

  const [, , price, change, rawPct] = orders;
  if (!Number.isFinite(price) || price <= 0) return null;

  const previousClose = price - change;
  const changePct =
    Number.isFinite(rawPct) && rawPct !== 0
      ? round2(rawPct)
      : Number.isFinite(change) && previousClose > 0
        ? round2((change / previousClose) * 100)
        : rawPct === 0
          ? 0
          : null;

  return { price, changePct, currency: 'PKR' };
}

// DPS /company/{symbol} quote block (captured 2026-10-25):
//   <div class="quote__price">
//     <div class="quote__close">Rs.298.12</div>
//     <div class="quote__change change__text--neg">
//       <div class="change__value">-2.38</div>
//       <div class="change__percent"> (-0.79%)</div>
// Positive rows print `change__text--pos` and an unsigned value/percent
// ("7.08", " (1.48%)"), so the sign is taken from the class or the change value.
export function parseDpsCompanyQuote(html: string): ParsedMarketQuote | null {
  if (typeof html !== 'string' || html.length === 0) return null;
  const blockStart = html.indexOf('class="quote__price"');
  if (blockStart < 0) return null;
  const chartAt = html.indexOf('class="quote__chart"', blockStart);
  const block = html.slice(blockStart, chartAt > blockStart ? chartAt : undefined);

  const close = /class="quote__close"[^>]*>\s*(?:Rs\.?\s*)?([\d,]+(?:\.\d+)?)/.exec(block);
  if (!close) return null;
  const price = Number(close[1].replace(/,/g, ''));
  if (!Number.isFinite(price) || price <= 0) return null;

  const changeValue = /class="change__value"[^>]*>\s*([-+]?[\d,]+(?:\.\d+)?)/.exec(block);
  const percent = /class="change__percent"[^>]*>\s*\(?\s*([-+]?[\d.]+)\s*%\s*\)?/.exec(block);
  let changePct: number | null = null;
  if (percent) {
    const magnitude = Math.abs(Number(percent[1]));
    if (Number.isFinite(magnitude)) {
      const signed = changeValue ? Number(changeValue[1].replace(/,/g, '')) : Number.NaN;
      const negative = /change__text--neg/.test(block) || signed < 0;
      changePct = round2(negative ? -magnitude : magnitude);
    }
  }

  return { price, changePct, currency: 'PKR' };
}

export function priceNoteFor(currency: string | null, region: OutlookRegion): string | null {
  if (region === 'national') return null;
  if (!currency) return null;
  return `${currency} quoted`;
}

export function formatOutlookNumber(value: number | null): string {
  if (value === null || !Number.isFinite(value)) return 'No data';
  return value.toLocaleString('en-PK', {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  });
}

export function formatChangePct(changePct: number | null): string {
  if (changePct === null || !Number.isFinite(changePct)) return '—';
  if (changePct === 0) return '0.00%';
  const sign = changePct > 0 ? '+' : '';
  return `${sign}${changePct.toFixed(2)}%`;
}

export function toChips(q: InstrumentQuote): { label: string; value: string; delta: string } {
  const value =
    q.pricePKR === null ? (q.priceNote ?? 'No quote on device') : formatOutlookNumber(q.pricePKR);
  return {
    label: q.label,
    value,
    delta: formatChangePct(q.changePct),
  };
}

export function freshnessChip(q: InstrumentQuote, now: number = Date.now()): string {
  if (q.fresh) return 'live';
  if (q.pricePKR === null) return 'no data';
  const fetchedMs = Date.parse(q.fetchedAtIsoUtc);
  if (!Number.isFinite(fetchedMs)) {
    return 'cached';
  }
  const at = new Date(fetchedMs);
  const age = now - fetchedMs;
  if (age > OUTLOOK_CACHE_TTL_MS) return 'no data';
  return `cached ${String(at.getHours()).padStart(2, '0')}:${String(at.getMinutes()).padStart(2, '0')}`;
}

export function buildDegradedQuote(
  spec: OutlookSymbol,
  entry: OutlookCacheEntry | null,
  now: number = Date.now()
): InstrumentQuote {
  if (entry && isCacheFresh(entry.t, now)) {
    return {
      symbol: spec.sourceSymbol,
      label: spec.display,
      region: spec.region,
      pricePKR: entry.price,
      priceNote: entry.priceNote,
      changePct: entry.changePct,
      fetchedAtIsoUtc: new Date(entry.t).toISOString(),
      source: `${entry.source} (cached)`,
      fresh: false,
    };
  }

  return {
    symbol: spec.sourceSymbol,
    label: spec.display,
    region: spec.region,
    pricePKR: null,
    priceNote: 'No quote on device',
    changePct: null,
    fetchedAtIsoUtc: '',
    source: 'none',
    fresh: false,
  };
}

async function fetchWithTimeout(url: string, headers: Record<string, string>): Promise<Response | null> {
  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), REQUEST_TIMEOUT_MS);
  try {
    return await fetch(url, { headers, signal: controller.signal });
  } catch {
    return null;
  } finally {
    clearTimeout(timer);
  }
}

async function fetchYahooQuote(sourceSymbol: string): Promise<ParsedMarketQuote | null> {
  for (const host of YAHOO_HOSTS) {
    const response = await fetchWithTimeout(yahooChartUrl(host, sourceSymbol), {
      'User-Agent': BROWSER_UA,
      Accept: 'application/json,text/plain,*/*',
    });
    if (!response || !response.ok) continue;
    const data = await response.json().catch(() => null);
    const parsed = parseYahooChart(data);
    if (parsed) return parsed;
  }
  return null;
}

// Candidate stooq symbols per Yahoo ticker. Each is validated by a live parse
// before first use; failures are remembered for the session so an unavailable
// provider is never hammered.
const STOOQ_CANDIDATES: Record<string, string> = {
  '^GSPC': '^spx',
  '^IXIC': '^ndq',
  'GC=F': 'xauusd',
  'BZ=F': 'xbrusd',
  'PKR=X': 'usdpkr',
};
const stooqRejected = new Set<string>();

async function fetchStooqQuote(sourceSymbol: string): Promise<ParsedMarketQuote | null> {
  const stooqSymbol = STOOQ_CANDIDATES[sourceSymbol];
  if (!stooqSymbol || stooqRejected.has(sourceSymbol)) return null;

  const url = `${STOOQ_BASE}?s=${encodeURIComponent(stooqSymbol)}&f=sd2t2ohlcv&h&e=csv`;
  const response = await fetchWithTimeout(url, {
    'User-Agent': BROWSER_UA,
    Accept: 'text/csv,text/plain,*/*',
  });
  if (!response || !response.ok) {
    stooqRejected.add(sourceSymbol);
    return null;
  }
  const body = await response.text().catch(() => '');
  const parsed = parseStooqCsv(body);
  if (!parsed) {
    stooqRejected.add(sourceSymbol);
    return null;
  }
  return parsed;
}

async function fetchDpsIndexQuote(): Promise<ParsedMarketQuote | null> {
  const response = await fetchWithTimeout(DPS_INDICES_URL, {
    'User-Agent': BROWSER_UA,
    Accept: 'text/html,application/xhtml+xml',
  });
  if (!response || !response.ok) return null;
  const body = await response.text().catch(() => '');
  return parseDpsIndexRow(body);
}

// Holdings refresh path: one server-rendered company page per ticker. Only a
// parsed positive close counts, so an error page can never become a price.
export async function fetchDpsCompanyPrice(ticker: string): Promise<number | null> {
  const symbol = ticker.trim().toUpperCase();
  if (!/^[A-Z0-9]{1,12}$/.test(symbol)) return null;
  const response = await fetchWithTimeout(`${DPS_COMPANY_BASE}/${symbol}`, {
    'User-Agent': BROWSER_UA,
    Accept: 'text/html,application/xhtml+xml',
  });
  if (!response || !response.ok) return null;
  const body = await response.text().catch(() => '');
  return parseDpsCompanyQuote(body)?.price ?? null;
}

// Yahoo hides the KSE-100 behind different suffixes and rate-limits whole host
// families (probed 2026-10-25: 429 on .KSE, .KA and .KAR). Whichever suffix
// parses is remembered for the session; rejected suffixes are not retried.
const NATIONAL_YAHOO_CODE = 'KSE100';
const NATIONAL_YAHOO_SUFFIXES = ['.KSE', '.KA', '.KAR'];
let nationalYahooSuffix: string | null = null;
const nationalYahooRejected = new Set<string>();

interface NationalProviderResult {
  quote: ParsedMarketQuote;
  source: string;
}

async function fetchNationalYahooQuote(): Promise<NationalProviderResult | null> {
  if (nationalYahooSuffix !== null) {
    const symbol = `${NATIONAL_YAHOO_CODE}${nationalYahooSuffix}`;
    const parsed = await fetchYahooQuote(symbol);
    return parsed ? { quote: parsed, source: `${YAHOO_SOURCE} (${symbol})` } : null;
  }

  for (const suffix of NATIONAL_YAHOO_SUFFIXES) {
    if (nationalYahooRejected.has(suffix)) continue;
    const symbol = `${NATIONAL_YAHOO_CODE}${suffix}`;
    const parsed = await fetchYahooQuote(symbol);
    if (parsed) {
      nationalYahooSuffix = suffix;
      return { quote: parsed, source: `${YAHOO_SOURCE} (${symbol})` };
    }
    nationalYahooRejected.add(suffix);
  }
  return null;
}

export type NationalProviderId = 'psx_dps_indices' | 'yahoo_national_suffix' | 'cache';

const NATIONAL_PROVIDERS: Array<{
  id: Exclude<NationalProviderId, 'cache'>;
  fetch: () => Promise<NationalProviderResult | null>;
}> = [
  {
    id: 'psx_dps_indices',
    fetch: async () => {
      const quote = await fetchDpsIndexQuote();
      return quote ? { quote, source: DPS_SOURCE } : null;
    },
  },
  { id: 'yahoo_national_suffix', fetch: fetchNationalYahooQuote },
];

// Resolution order actually walked for the KSE-100 row: live DPS, remembered
// Yahoo suffix, then the 24h cache, then a labelled no-data quote.
export const NATIONAL_PROVIDER_LADDER: NationalProviderId[] = [
  ...NATIONAL_PROVIDERS.map((provider) => provider.id),
  'cache',
];

async function fetchNationalQuote(): Promise<NationalProviderResult | null> {
  for (const provider of NATIONAL_PROVIDERS) {
    const result = await provider.fetch();
    if (result) return result;
  }
  return null;
}

async function readCacheEntry(sourceSymbol: string, now: number): Promise<OutlookCacheEntry | null> {
  try {
    const { getSetting } = await import('../database/db');
    const raw = await getSetting(outlookCacheKey(sourceSymbol));
    if (!raw) return null;
    const entry = JSON.parse(raw) as Partial<OutlookCacheEntry>;
    if (typeof entry.t !== 'number' || typeof entry.price !== 'number') return null;
    if (!isCacheFresh(entry.t, now)) return null;
    return {
      t: entry.t,
      price: entry.price,
      changePct: typeof entry.changePct === 'number' ? entry.changePct : null,
      source: typeof entry.source === 'string' ? entry.source : 'cache',
      priceNote: typeof entry.priceNote === 'string' ? entry.priceNote : null,
    };
  } catch {
    return null;
  }
}

async function writeCacheEntry(sourceSymbol: string, entry: OutlookCacheEntry): Promise<void> {
  try {
    const { setSetting } = await import('../database/db');
    await setSetting(outlookCacheKey(sourceSymbol), JSON.stringify(entry));
  } catch {
    // A cache write failure must never break a fresh quote.
  }
}

async function fetchOne(spec: OutlookSymbol, now: number): Promise<InstrumentQuote> {
  try {
    let resolved: NationalProviderResult | null;
    if (spec.region === 'national') {
      resolved = await fetchNationalQuote();
    } else {
      let parsed = await fetchYahooQuote(spec.sourceSymbol);
      let source = YAHOO_SOURCE;
      if (!parsed) {
        parsed = await fetchStooqQuote(spec.sourceSymbol);
        source = STOOQ_SOURCE;
      }
      resolved = parsed ? { quote: parsed, source } : null;
    }

    if (resolved) {
      const { quote: parsed, source } = resolved;
      const priceNote = priceNoteFor(parsed.currency, spec.region);
      await writeCacheEntry(spec.sourceSymbol, {
        t: now,
        price: parsed.price,
        changePct: parsed.changePct,
        source,
        priceNote,
      });
      return {
        symbol: spec.sourceSymbol,
        label: spec.display,
        region: spec.region,
        pricePKR: parsed.price,
        priceNote,
        changePct: parsed.changePct,
        fetchedAtIsoUtc: new Date(now).toISOString(),
        source,
        fresh: true,
      };
    }

    const cached = await readCacheEntry(spec.sourceSymbol, now);
    return buildDegradedQuote(spec, cached, now);
  } catch {
    return buildDegradedQuote(spec, null, now);
  }
}

export function outlookDegradedSymbols(quotes: InstrumentQuote[]): string[] {
  return quotes.filter((q) => !q.fresh).map((q) => q.symbol);
}

export async function fetchOutlookQuotes(
  now: number = Date.now()
): Promise<{ quotes: InstrumentQuote[]; degraded: string[] }> {
  const quotes = await Promise.all(OUTLOOK_SYMBOLS.map((spec) => fetchOne(spec, now)));
  return { quotes, degraded: outlookDegradedSymbols(quotes) };
}
