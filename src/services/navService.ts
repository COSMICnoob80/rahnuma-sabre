/**
 * ETF NAV vs market price — information only.
 *
 * The gap between a fund's published NAV and the price the units actually
 * trade at is a FACT retail readers almost never see. This module publishes
 * that fact. It never says which side of the gap is better, and the screen
 * carries the caption "Gap is information, not a trade signal."
 *
 * ---------------------------------------------------------------------------
 * VERIFIED NAV SOURCES (probed live 2026-11-22 from this host)
 * ---------------------------------------------------------------------------
 * Primary and only source: PSX Data Portal's own per-ETF page.
 *
 *   URL          https://dps.psx.com.pk/etf/{SYMBOL}
 *   Status       200 for all nine catalog ETFs:
 *                UBLPETF 70,780 B · NITGETF 73,299 B · NBPGETF 71,936 B
 *                MZNPETF 75,453 B · JSMFETF 74,463 B · ACIETF 71,716 B
 *                HBLTETF 69,273 B · JSGBETF 72,982 B · MIIETF 75,267 B
 *   Field        the first `<div class="stats">` block on the page, whose
 *                `stats_label` is either `iNAV` (indicative NAV, intraday,
 *                refreshed every 15 s) or `NAV *` (day-end NAV):
 *
 *                <div class="stats">
 *                  <div class="stats_item">
 *                    <div class="stats_label" style="text-transform: none;">iNAV</div>
 *                    <div class="stats_value">18.27</div>
 *                    <div class="stats_note" ...>Last Updated:  2026-11-20 16:30:19</div>
 *                  </div>
 *                </div>
 *
 *   Observed per symbol on 2026-11-22 (field → value):
 *                UBLPETF iNAV 29.82        NITGETF iNAV 34.75
 *                NBPGETF iNAV 26.88        MZNPETF iNAV 18.27
 *                JSMFETF iNAV 9.92         ACIETF  iNAV 16.83
 *                HBLTETF NAV  107.9412     JSGBETF iNAV 40.90
 *                MIIETF  iNAV 16.85
 *
 *   So: EIGHT ETFs publish an intraday iNAV and ONE (HBLTETF) publishes only
 *   the day-end NAV. Both are the fund's own published NAV number, so both
 *   count; the quote keeps `navKind` so they are never conflated. No AMC page
 *   was needed — the exchange page carries the field for every fund that has
 *   one, which is also why there is exactly one honest source here.
 *
 *   A symbol whose page carries neither label yields `nav: null` and the
 *   screen prints "NAV unavailable". Nothing is derived.
 * ---------------------------------------------------------------------------
 *
 * The `Last Updated` note is PKT wall-clock (the exchange's own local time),
 * so it is converted with a fixed UTC+5 offset before storage. Only the age of
 * the cache depends on it; the gap math never does.
 */

export const DPS_ETF_BASE = 'https://dps.psx.com.pk/etf';
export const NAV_CACHE_PREFIX = 'nav_cache_';
export const NAV_CACHE_TTL_MS = 15 * 60 * 1000;
export const NAV_REQUEST_TIMEOUT_MS = 8_000;
export const NAV_UNAVAILABLE = 'NAV unavailable';
export const NAV_GAP_CAPTION = 'Gap is information, not a trade signal.';
export const PKT_OFFSET_MS = 5 * 60 * 60 * 1000;

const BROWSER_UA =
  'Mozilla/5.0 (Linux; Android 10) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/124.0 Mobile Safari/537.36';

export type NavKind = 'iNAV' | 'NAV';

export interface ParsedEtfNav {
  nav: number;
  navKind: NavKind;
  // The page's own "Last Updated" string, verbatim, or null when absent.
  navAsOf: string | null;
  // The same instant as epoch ms, parsed as PKT (UTC+5). Null when unparsed.
  updatedAtMs: number | null;
}

export interface EtfNavQuote {
  symbol: string;
  nav: number | null;
  navKind: NavKind | null;
  navAsOf: string | null;
  fetchedAtIsoUtc: string;
  source: string;
  cached: boolean;
}

export interface EtfNavCacheEntry {
  t: number;
  nav: number;
  navKind: NavKind;
  navAsOf: string | null;
}

export interface EtfNavDeps {
  fetchHtml?: (symbol: string) => Promise<string | null>;
  readCache?: (symbol: string, now: number) => Promise<EtfNavCacheEntry | null>;
  writeCache?: (symbol: string, entry: EtfNavCacheEntry) => Promise<void>;
  now?: number;
}

export interface EtfNavLine {
  // "NAV 42.10 · price 43.05 · gap +2.3%"
  text: string;
  gapPct: number;
  gapLabel: string;
  // Sign only. The screen maps this to neutral hues — never the accent green.
  tone: 'pos' | 'neg' | 'flat';
}

const NAV_SOURCE = 'PSX DPS ETF page';
const STATS_ANCHOR = '<div class="stats">';

function round2(value: number): number {
  return Math.round((value + Number.EPSILON) * 100) / 100;
}

export function isNavCacheFresh(t: number, now: number = Date.now()): boolean {
  if (!Number.isFinite(t)) return false;
  const age = now - t;
  return age >= 0 && age <= NAV_CACHE_TTL_MS;
}

/** "2026-11-20 16:30:19" (PKT wall clock) → epoch ms. */
export function pktWallClockToMs(value: string): number | null {
  const match = /^(\d{4})-(\d{2})-(\d{2}) (\d{2}):(\d{2}):(\d{2})$/.exec(value.trim());
  if (!match) return null;
  const ms =
    Date.UTC(
      Number(match[1]),
      Number(match[2]) - 1,
      Number(match[3]),
      Number(match[4]),
      Number(match[5]),
      Number(match[6])
    ) - PKT_OFFSET_MS;
  return Number.isFinite(ms) ? ms : null;
}

/**
 * Reads the first stats block on a DPS ETF page. Anchoring on the block and
 * requiring its label to be exactly `iNAV` or `NAV` keeps the page's other
 * numeric widgets — circuit breaker, day range, 52-week range — from ever
 * being mistaken for a NAV.
 */
export function parseDpsEtfNav(html: string): ParsedEtfNav | null {
  if (typeof html !== 'string' || html.length === 0) return null;

  const start = html.indexOf(STATS_ANCHOR);
  if (start < 0) return null;
  const block = html.slice(start, start + 2_000);

  const item =
    /<div class="stats_label"[^>]*>([\s\S]*?)<\/div><div class="stats_value">([^<]*)<\/div>(?:<div class="stats_note"[^>]*>([^<]*)<\/div>)?/.exec(
      block
    );
  if (!item) return null;

  const label = item[1]
    .replace(/<[^>]*>/g, '')
    .replace(/\*/g, '')
    .trim()
    .toLowerCase();
  const navKind: NavKind | null = label === 'inav' ? 'iNAV' : label === 'nav' ? 'NAV' : null;
  if (navKind === null) return null;

  const nav = Number(item[2].replace(/,/g, '').trim());
  if (!Number.isFinite(nav) || nav <= 0) return null;

  const note = (item[3] ?? '').trim();
  const asOf = /Last Updated:\s*(\d{4}-\d{2}-\d{2} \d{2}:\d{2}:\d{2})/.exec(note)?.[1] ?? null;

  return {
    // Kept at the page's own precision (HBLTETF publishes 107.9412). The row
    // formats to two decimals for display; the cached fact is what PSX said.
    nav,
    navKind,
    navAsOf: asOf,
    updatedAtMs: asOf === null ? null : pktWallClockToMs(asOf),
  };
}

/**
 * Signed gap of the traded price against the fund's own NAV, in percent.
 * Positive means the units trade above NAV; negative means below. The number
 * carries no verdict — that is the whole point of the line.
 */
export function navGapPct(nav: number | null, price: number | null): number | null {
  if (nav === null || price === null) return null;
  if (!Number.isFinite(nav) || !Number.isFinite(price)) return null;
  if (nav <= 0 || price <= 0) return null;
  return round2(((price - nav) / nav) * 100);
}

export function formatNavGap(gapPct: number | null): string {
  if (gapPct === null || !Number.isFinite(gapPct)) return '—';
  if (gapPct === 0) return '0.0%';
  return `${gapPct > 0 ? '+' : ''}${gapPct.toFixed(1)}%`;
}

/**
 * One ledger row's second line. Null when there is no NAV to state or no
 * traded price to compare against — the caller then prints NAV_UNAVAILABLE or
 * omits the line rather than inventing a number.
 */
export function buildEtfNavLine(nav: number | null, price: number | null): EtfNavLine | null {
  if (nav === null || price === null) return null;
  const gapPct = navGapPct(nav, price);
  if (gapPct === null) return null;
  const gapLabel = formatNavGap(gapPct);
  return {
    text: `NAV ${nav.toFixed(2)} · price ${price.toFixed(2)} · gap ${gapLabel}`,
    gapPct,
    gapLabel,
    tone: gapPct > 0 ? 'pos' : gapPct < 0 ? 'neg' : 'flat',
  };
}

async function fetchEtfPageHtml(symbol: string): Promise<string | null> {
  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), NAV_REQUEST_TIMEOUT_MS);
  try {
    const response = await fetch(`${DPS_ETF_BASE}/${symbol}`, {
      headers: {
        'User-Agent': BROWSER_UA,
        Accept: 'text/html,application/xhtml+xml',
      },
      signal: controller.signal,
    });
    if (!response.ok) return null;
    return await response.text();
  } catch {
    return null;
  } finally {
    clearTimeout(timer);
  }
}

function cacheKey(symbol: string): string {
  return NAV_CACHE_PREFIX + symbol;
}

async function readStoredCache(symbol: string, now: number): Promise<EtfNavCacheEntry | null> {
  try {
    const { getSetting } = await import('../database/db');
    const raw = await getSetting(cacheKey(symbol));
    if (!raw) return null;
    const entry = JSON.parse(raw) as Partial<EtfNavCacheEntry>;
    if (typeof entry.t !== 'number' || typeof entry.nav !== 'number') return null;
    if (!isNavCacheFresh(entry.t, now)) return null;
    const navKind: NavKind = entry.navKind === 'NAV' ? 'NAV' : 'iNAV';
    return {
      t: entry.t,
      nav: entry.nav,
      navKind,
      navAsOf: typeof entry.navAsOf === 'string' ? entry.navAsOf : null,
    };
  } catch {
    return null;
  }
}

async function writeStoredCache(symbol: string, entry: EtfNavCacheEntry): Promise<void> {
  try {
    const { setSetting } = await import('../database/db');
    await setSetting(cacheKey(symbol), JSON.stringify(entry));
  } catch {
    // A cache write failure must never break a live NAV read.
  }
}

/**
 * One ETF's NAV. Live page first, then an unexpired 15-minute cache, then an
 * honest `nav: null` — an unreachable exchange never yields a number.
 */
export async function fetchEtfNav(symbol: string, deps: EtfNavDeps = {}): Promise<EtfNavQuote> {
  const now = deps.now ?? Date.now();
  const upper = symbol.trim().toUpperCase();
  const base = {
    symbol: upper,
    fetchedAtIsoUtc: new Date(now).toISOString(),
  };

  const unavailable: EtfNavQuote = {
    ...base,
    nav: null,
    navKind: null,
    navAsOf: null,
    source: 'none',
    cached: false,
  };

  if (!/^[A-Z0-9]{1,12}$/.test(upper)) return unavailable;

  const readCache = deps.readCache ?? readStoredCache;
  const writeCache = deps.writeCache ?? writeStoredCache;

  const cached = await readCache(upper, now).catch(() => null);

  const html = await (deps.fetchHtml ?? fetchEtfPageHtml)(upper).catch(() => null);
  const parsed = html === null ? null : parseDpsEtfNav(html);
  if (parsed) {
    await writeCache(upper, {
      t: now,
      nav: parsed.nav,
      navKind: parsed.navKind,
      navAsOf: parsed.navAsOf,
    }).catch(() => undefined);
    return {
      ...base,
      nav: parsed.nav,
      navKind: parsed.navKind,
      navAsOf: parsed.navAsOf,
      source: NAV_SOURCE,
      cached: false,
    };
  }

  if (cached) {
    return {
      ...base,
      nav: cached.nav,
      navKind: cached.navKind,
      navAsOf: cached.navAsOf,
      source: `${NAV_SOURCE} (cached)`,
      cached: true,
    };
  }

  return unavailable;
}

/**
 * NAV for a set of ETF tickers, keyed by ticker. One page per fund, all in
 * parallel; a failure marks only that symbol unavailable.
 */
export async function fetchEtfNavMap(
  symbols: string[],
  deps: EtfNavDeps = {}
): Promise<Record<string, EtfNavQuote>> {
  const unique = Array.from(new Set(symbols.map((symbol) => symbol.trim().toUpperCase())));
  const quotes = await Promise.all(unique.map((symbol) => fetchEtfNav(symbol, deps)));
  const map: Record<string, EtfNavQuote> = {};
  quotes.forEach((quote) => {
    map[quote.symbol] = quote;
  });
  return map;
}
