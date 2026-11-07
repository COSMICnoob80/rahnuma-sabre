/**
 * PMEX local-commodity board — keyless, verified live 2026-11-04.
 *
 * Endpoint (docs/HARVEST-PMEX.md §2.1):
 *   POST https://dportal.pmex.com.pk/MWatchNew/Home/GetJSONObject
 *   Content-Type: application/json; charset=utf-8
 *   body: {"status":"Active"}
 *   -> 200, 38,068 B, flat array of 80 live rows, no auth, no CORS.
 *
 * One full record exactly as harvested (public market data):
 *
 * {
 *   "Contract": "GO100OZ-DE26", "Bid_Vol": null, "Bid": 4056.3, "Ask": 4056.8,
 *   "Ask_Vol": null, "Last_Price": "4053.6", "Last_Vol": "1", "Total_Vol": "17",
 *   "High": 4056.4, "Low": 3949.3, "Change": 118.7, "Change_Per": 3.01,
 *   "State": null, "_date": null, "_time": null, "_Message": null, "SysDate": null,
 *   "BidDiff": 0, "AskDiff": 0, "StatusTime": null, "last_": 0, "volume_": 0,
 *   "rBid": null, "rAsk": null, "BidVolume": null, "AskVolume": null,
 *   "Open": 3937.7, "Close": 3937.6, "Total_Volume": 0,
 *   "Category": "Metals", "_datetime": 1793821418
 * }
 *
 * The PKR-denominated tola row from the same response:
 *
 * {"Contract": "TOLAGOLD-WED", "Bid": 415833, "Ask": 424816, "Last_Price": "0",
 *  "High": 0, "Low": 0, "Change": -11453, "Change_Per": -2.68,
 *  "Category": "Phy_Gold", "_datetime": 1793821392}
 *
 * Field notes (harvest §2.1 / §5):
 * - Last_Price / Last_Vol / Total_Vol are strings; Bid / Ask / Change /
 *   Change_Per / _datetime are numbers.
 * - Change_Per is already a percentage (3.01 = +3.01%).
 * - TOLAGOLD's Last_Price is "0" while a two-sided bid/ask exists, so the
 *   midpoint is the price; rows with no two-sided market are skipped.
 * - _datetime is PKT wall-clock stamped as UTC: subtract 18,000 s for real UTC.
 * - Contract months live in the symbol (…-DE26, …-JA27), so rows are selected by
 *   prefix and the freshest _datetime, never by a hardcoded month.
 *
 * Units (harvest §4): 1 tola = 0.375 troy ounce exactly, therefore
 *   PKR/tola = USD/oz x 0.375 x USD_PKR.
 * PMEX quotes gold directly in PKR/tola (TOLAGOLD-*); silver is USD/oz only
 * (SL100OZ), so the silver PKR/tola figure is DERIVED with that formula.
 */

export const PMEX_ENDPOINT = 'https://dportal.pmex.com.pk/MWatchNew/Home/GetJSONObject';
export const PMEX_CACHE_TTL_MS = 15 * 60 * 1000;
export const PMEX_REQUEST_TIMEOUT_MS = 8_000;
export const PMEX_MAX_ATTEMPTS = 2;
export const PMEX_DATETIME_UTC_SHIFT_S = 18_000;
export const TROY_OZ_PER_TOLA = 0.375;
export const GRAMS_PER_TOLA = 11.6638;
export const PMEX_CACHE_PREFIX = 'pmex_cache_';
export const PMEX_OFFLINE_VALUE = 'PMEX offline';

export type PmexErrorCode = 'pmex-unreachable';

export class PmexError extends Error {
  readonly code: PmexErrorCode = 'pmex-unreachable';

  constructor(message = 'PMEX unreachable') {
    super(message);
    this.name = 'PmexError';
  }
}

export interface PmexRow {
  contract: string;
  bid: number | null;
  ask: number | null;
  lastPrice: number | null;
  changePct: number | null;
  category: string;
  updatedAtMs: number | null;
}

export interface PmexQuote {
  goldPkrPerTola: number | null;
  goldUsdPerOz: number | null;
  goldChangePct: number | null;
  goldUpdatedAtMs: number | null;
  silverPkrPerTola: number | null;
  silverUsdPerOz: number | null;
  silverChangePct: number | null;
  silverUpdatedAtMs: number | null;
}

export interface PmexCacheEntry {
  t: number;
  rows: PmexRow[];
}

export interface PmexResult {
  quote: PmexQuote;
  cached: boolean;
}

export interface PmexDeps {
  fetchBoard?: () => Promise<PmexRow[]>;
  readCache?: (now: number) => Promise<PmexCacheEntry | null>;
  writeCache?: (entry: PmexCacheEntry) => Promise<void>;
  now?: number;
}

function round2(value: number): number {
  return Math.round((value + Number.EPSILON) * 100) / 100;
}

function finiteOrNull(value: unknown): number | null {
  const parsed =
    typeof value === 'number' ? value : typeof value === 'string' ? Number(value) : Number.NaN;
  return Number.isFinite(parsed) ? parsed : null;
}

export function parsePmexBoard(payload: unknown): PmexRow[] {
  if (!Array.isArray(payload)) return [];

  const rows: PmexRow[] = [];
  for (const raw of payload) {
    if (!raw || typeof raw !== 'object') continue;
    const record = raw as Record<string, unknown>;
    const contract = record.Contract;
    if (typeof contract !== 'string' || contract.trim().length === 0) continue;

    const seconds = finiteOrNull(record._datetime);
    rows.push({
      contract: contract.trim().toUpperCase(),
      bid: finiteOrNull(record.Bid),
      ask: finiteOrNull(record.Ask),
      lastPrice: finiteOrNull(record.Last_Price),
      changePct: finiteOrNull(record.Change_Per),
      category: typeof record.Category === 'string' ? record.Category : '',
      updatedAtMs: seconds === null ? null : (seconds - PMEX_DATETIME_UTC_SHIFT_S) * 1000,
    });
  }
  return rows;
}

// Prefix selection, freshest two-sided row wins. A contract month rollover adds
// a new symbol but never changes the prefix, so nothing here names a month.
export function pickContract(rows: PmexRow[], prefix: string): PmexRow | null {
  const matches = rows.filter((row) => row.contract.startsWith(prefix));
  if (matches.length === 0) return null;

  const twoSided = matches.filter(
    (row) => row.bid !== null && row.ask !== null && row.bid > 0 && row.ask > 0
  );
  const pool = twoSided.length > 0 ? twoSided : matches;

  let best: PmexRow | null = null;
  for (const row of pool) {
    if (best === null || (row.updatedAtMs ?? 0) > (best.updatedAtMs ?? 0)) best = row;
  }
  return best;
}

export function midPrice(row: PmexRow | null): number | null {
  if (!row) return null;
  if (row.bid !== null && row.ask !== null && row.bid > 0 && row.ask > 0) {
    return round2((row.bid + row.ask) / 2);
  }
  if (row.lastPrice !== null && row.lastPrice > 0) return row.lastPrice;
  if (row.bid !== null && row.bid > 0) return row.bid;
  if (row.ask !== null && row.ask > 0) return row.ask;
  return null;
}

export function pkrPerTolaFromUsdPerOz(usdPerOz: number, usdPkr: number): number | null {
  if (!Number.isFinite(usdPerOz) || !Number.isFinite(usdPkr)) return null;
  if (usdPerOz <= 0 || usdPkr <= 0) return null;
  return round2(usdPerOz * TROY_OZ_PER_TOLA * usdPkr);
}

export function pkrPerGramFromTola(pkrPerTola: number): number | null {
  if (!Number.isFinite(pkrPerTola) || pkrPerTola <= 0) return null;
  return round2(pkrPerTola / GRAMS_PER_TOLA);
}

export function buildPmexQuote(rows: PmexRow[], usdPkr: number | null): PmexQuote {
  const goldRow = pickContract(rows, 'TOLAGOLD-');
  const goldUsdRow = pickContract(rows, 'GO100OZ');
  const silverRow = pickContract(rows, 'SL100OZ');

  const goldUsdPerOz = midPrice(goldUsdRow);
  const silverUsdPerOz = midPrice(silverRow);

  return {
    goldPkrPerTola: midPrice(goldRow),
    goldUsdPerOz,
    goldChangePct: goldRow ? goldRow.changePct : null,
    goldUpdatedAtMs: goldRow ? goldRow.updatedAtMs : null,
    silverPkrPerTola:
      silverUsdPerOz !== null && usdPkr !== null
        ? pkrPerTolaFromUsdPerOz(silverUsdPerOz, usdPkr)
        : null,
    silverUsdPerOz,
    silverChangePct: silverRow ? silverRow.changePct : null,
    silverUpdatedAtMs: silverRow ? silverRow.updatedAtMs : null,
  };
}

export function isPmexCacheFresh(t: number, now: number = Date.now()): boolean {
  if (!Number.isFinite(t)) return false;
  const age = now - t;
  return age >= 0 && age <= PMEX_CACHE_TTL_MS;
}

function cacheKey(): string {
  return PMEX_CACHE_PREFIX + 'board';
}

async function readStoredCache(now: number): Promise<PmexCacheEntry | null> {
  try {
    const { getSetting } = await import('../database/db');
    const raw = await getSetting(cacheKey());
    if (!raw) return null;
    const entry = JSON.parse(raw) as Partial<PmexCacheEntry>;
    if (typeof entry.t !== 'number' || !Array.isArray(entry.rows)) return null;
    if (!isPmexCacheFresh(entry.t, now)) return null;
    return { t: entry.t, rows: entry.rows as PmexRow[] };
  } catch {
    return null;
  }
}

async function writeStoredCache(entry: PmexCacheEntry): Promise<void> {
  try {
    const { setSetting } = await import('../database/db');
    await setSetting(cacheKey(), JSON.stringify(entry));
  } catch {
    // A cache write failure must never break a live board.
  }
}

// Two attempts at most: one POST plus one courtesy retry. The endpoint has no
// published rate-limit policy, so it is treated as courtesy-limited.
async function fetchPmexBoardFromFeed(): Promise<PmexRow[]> {
  let lastError: unknown = null;

  for (let attempt = 0; attempt < PMEX_MAX_ATTEMPTS; attempt++) {
    const controller = new AbortController();
    const timer = setTimeout(() => controller.abort(), PMEX_REQUEST_TIMEOUT_MS);
    try {
      const response = await fetch(PMEX_ENDPOINT, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json; charset=utf-8',
          Accept: 'application/json',
        },
        body: JSON.stringify({ status: 'Active' }),
        signal: controller.signal,
      });
      if (!response.ok) {
        throw new PmexError(`PMEX answered ${response.status}`);
      }
      const payload = await response.json();
      const rows = parsePmexBoard(payload);
      if (rows.length === 0) throw new PmexError('PMEX returned an empty board');
      return rows;
    } catch (error) {
      lastError = error;
    } finally {
      clearTimeout(timer);
    }
  }

  throw lastError instanceof PmexError ? lastError : new PmexError();
}

// One board poll feeds the strip cards and the searchable board. A failed poll
// may serve an unexpired 15-minute cache, but a cache miss is an explicit
// `pmex-unreachable` — never a fake number.
export interface PmexBoardResult {
  rows: PmexRow[];
  cached: boolean;
}

export async function fetchPmexBoard(deps: PmexDeps = {}): Promise<PmexBoardResult> {
  const now = deps.now ?? Date.now();
  const readCache = deps.readCache ?? readStoredCache;
  const writeCache = deps.writeCache ?? writeStoredCache;
  const cached = await readCache(now).catch(() => null);

  try {
    const rows = await (deps.fetchBoard ?? fetchPmexBoardFromFeed)();
    await writeCache({ t: now, rows }).catch(() => undefined);
    return { rows, cached: false };
  } catch {
    if (cached) {
      return { rows: cached.rows, cached: true };
    }
    throw new PmexError();
  }
}

export async function fetchPmexQuote(
  usdPkr: number | null,
  deps: PmexDeps = {}
): Promise<PmexResult> {
  const board = await fetchPmexBoard(deps);
  return { quote: buildPmexQuote(board.rows, usdPkr), cached: board.cached };
}
