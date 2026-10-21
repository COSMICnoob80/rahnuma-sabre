export interface BriefingQuote {
  pricePKR: number;
  fetchedAtIsoUtc: string;
  source: string;
}

export interface BriefingInput {
  plannedSipPKR: number;
  spareCapacityPKR: number;
  quote: BriefingQuote | null;
  unitsHistory: { monthKey: string; units: number }[];
}

export interface BriefingOutput {
  pricePKR: number | null;
  freshnessLabel: string | null;
  planIntact: boolean;
  affordablePKR: number;
  unitsToday: number | null;
  unitsLastMonth: number | null;
  streakMonths: number;
}

const HOUR_MS = 60 * 60 * 1000;
const DAY_MS = 24 * HOUR_MS;

export function freshnessLabel(fetchedAtIsoUtc: string, now: number = Date.now()): string {
  if (!fetchedAtIsoUtc) return 'Price not fetched yet';

  const fetchedMs = Date.parse(
    fetchedAtIsoUtc.includes('T') ? fetchedAtIsoUtc : `${fetchedAtIsoUtc.replace(' ', 'T')}Z`
  );
  if (Number.isNaN(fetchedMs)) return 'Price freshness unknown';

  const ageMs = now - fetchedMs;
  if (ageMs > DAY_MS) {
    return `As of ${new Date(fetchedMs).toLocaleDateString('en-PK')}`;
  }
  if (ageMs > HOUR_MS) {
    return `${Math.max(1, Math.round(ageMs / HOUR_MS))}h old`;
  }
  return 'Up to date';
}

function round2(value: number): number {
  return Math.round((value + Number.EPSILON) * 100) / 100;
}

export function computeBriefing(input: BriefingInput): BriefingOutput {
  const { plannedSipPKR, spareCapacityPKR, quote, unitsHistory } = input;

  const pricePKR = quote === null ? null : quote.pricePKR;
  const unitsToday =
    pricePKR === null || !Number.isFinite(pricePKR) || pricePKR <= 0
      ? null
      : round2(plannedSipPKR / pricePKR);

  let streakMonths = 0;
  for (let i = unitsHistory.length - 1; i >= 0; i -= 1) {
    if (!(unitsHistory[i].units > 0)) break;
    streakMonths += 1;
  }

  return {
    pricePKR,
    freshnessLabel: quote === null ? null : freshnessLabel(quote.fetchedAtIsoUtc),
    planIntact: spareCapacityPKR >= plannedSipPKR,
    affordablePKR: spareCapacityPKR,
    unitsToday,
    unitsLastMonth: unitsHistory.length === 0 ? null : unitsHistory[unitsHistory.length - 1].units,
    streakMonths,
  };
}
