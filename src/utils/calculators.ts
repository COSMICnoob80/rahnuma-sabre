// Tax rules encoded here are sourced from the NCCPL notice issued 5 Aug 2025
// implementing the Income Tax Ordinance, 2001 as amended by the Finance Act 2025
// (effective 1 July 2025). See docs/TAX-RULES.md for provenance and caveats.
export const CGT_RULES_VERIFIED_AS_OF = '2025-08-05';

export type CgtTranche =
  | 'exempt_pre_2013'
  | 'legacy_2013_2022'
  | 'progressive_2022_2024'
  | 'flat_post_2024';

export interface CgtResult {
  gain: number;
  tax: number;
  netGain: number;
  rate: number;
  tranche: CgtTranche;
  note: string;
}

const DAY_MS = 24 * 60 * 60 * 1000;

const CUTOFFS = {
  exemptBefore: Date.UTC(2013, 6, 1),
  progressiveFrom: Date.UTC(2022, 6, 1),
  flatFrom: Date.UTC(2024, 6, 1),
};

// Glide path applied to securities acquired between 1 July 2022 and 30 June 2024.
const LEGACY_SLABS: { minYears: number; rate: number }[] = [
  { minYears: 6, rate: 0 },
  { minYears: 5, rate: 0.025 },
  { minYears: 4, rate: 0.05 },
  { minYears: 3, rate: 0.075 },
  { minYears: 2, rate: 0.1 },
  { minYears: 0, rate: 0.125 },
];

// Glide path applied to securities acquired between 1 July 2013 and 30 June 2022.
const LEGACY_SLABS_PRE_2022: { minYears: number; rate: number }[] = [
  { minYears: 6, rate: 0 },
  { minYears: 5, rate: 0.025 },
  { minYears: 4, rate: 0.05 },
  { minYears: 3, rate: 0.075 },
  { minYears: 2, rate: 0.1 },
  { minYears: 1, rate: 0.125 },
  { minYears: 0, rate: 0.15 },
];

// Securities acquired on/after 1 July 2024: flat 15%, no holding-period relief,
// regardless of Active Taxpayer List status.
const FLAT_RATE_POST_2024 = 0.15;

export const SUPER_TAX_THRESHOLD_PKR = 150_000_000;
export const SUPER_TAX_NOTE =
  'Section 4C super tax applies to aggregate capital gains above Rs 150,000,000 in a tax year (progressive, up to 10%). Not included in this estimate.';

function toUtcMs(date: string | Date): number {
  if (date instanceof Date) return date.getTime();
  const parsed = Date.parse(date);
  return Number.isNaN(parsed) ? Date.now() : parsed;
}

function slabRate(slabs: { minYears: number; rate: number }[], years: number): number {
  for (const slab of slabs) {
    if (years >= slab.minYears) return slab.rate;
  }
  return 0;
}

export function cgtTrancheFor(acquisitionDate: string | Date): CgtTranche {
  const ms = toUtcMs(acquisitionDate);
  if (ms < CUTOFFS.exemptBefore) return 'exempt_pre_2013';
  if (ms < CUTOFFS.progressiveFrom) return 'legacy_2013_2022';
  if (ms < CUTOFFS.flatFrom) return 'progressive_2022_2024';
  return 'flat_post_2024';
}

export function cgtRateFor(
  acquisitionDate: string | Date,
  holdingDays: number
): { rate: number; tranche: CgtTranche; note: string } {
  const tranche = cgtTrancheFor(acquisitionDate);
  const years = holdingDays / 365;

  switch (tranche) {
    case 'exempt_pre_2013':
      return {
        rate: 0,
        tranche,
        note: 'Securities acquired before 1 July 2013 are exempt from CGT.',
      };
    case 'flat_post_2024':
      return {
        rate: FLAT_RATE_POST_2024,
        tranche,
        note: 'Flat 15% applies to securities acquired on/after 1 July 2024, regardless of holding period or ATL status.',
      };
    case 'progressive_2022_2024':
      return {
        rate: slabRate(LEGACY_SLABS, years),
        tranche,
        note: 'Progressive slab (12.5% down to 0%) applies to securities acquired between 1 July 2022 and 30 June 2024. Verify the legacy slab with NCCPL.',
      };
    case 'legacy_2013_2022':
      return {
        rate: slabRate(LEGACY_SLABS_PRE_2022, years),
        tranche,
        note: 'Pre-Finance Act 2024 slab (15% down to 0%). Verify with NCCPL for acquisitions in this window.',
      };
  }
}

export function calculateCGT(
  buyPrice: number,
  sellPrice: number,
  quantity: number,
  holdingDays: number,
  acquisitionDate?: string | Date
): CgtResult {
  const gain = (sellPrice - buyPrice) * quantity;
  const { rate, tranche, note } = cgtRateFor(acquisitionDate ?? new Date(), holdingDays);

  if (gain <= 0) {
    return { gain, tax: 0, netGain: gain, rate, tranche, note };
  }

  const tax = gain * rate;
  return { gain, tax, netGain: gain - tax, rate, tranche, note };
}

export function capitalGainsSuperTaxNote(gain: number): string | null {
  return gain > SUPER_TAX_THRESHOLD_PKR ? SUPER_TAX_NOTE : null;
}

export function calculateSIP(
  monthlyInvestment: number,
  annualReturn: number,
  years: number
): { invested: number; returns: number; totalValue: number; yearlyData: { year: number; invested: number; value: number }[] } {
  const monthlyRate = annualReturn / 100 / 12;
  const totalMonths = years * 12;
  const yearlyData: { year: number; invested: number; value: number }[] = [];

  for (let y = 1; y <= years; y++) {
    const m = y * 12;
    const invested = monthlyInvestment * m;
    const value = monthlyRate === 0
      ? invested
      : monthlyInvestment * ((Math.pow(1 + monthlyRate, m) - 1) / monthlyRate) * (1 + monthlyRate);
    yearlyData.push({ year: y, invested, value: Math.round(value) });
  }

  const invested = monthlyInvestment * totalMonths;
  const totalValue = yearlyData[yearlyData.length - 1]?.value ?? 0;
  return { invested, returns: totalValue - invested, totalValue, yearlyData };
}

export function calculateAssetROI(
  buyPrice: number,
  currentValue: number,
  yearsHeld: number
): { totalReturn: number; annualizedReturn: number; gain: number } {
  const gain = currentValue - buyPrice;
  const totalReturn = (gain / buyPrice) * 100;
  const annualizedReturn = yearsHeld > 0
    ? (Math.pow(currentValue / buyPrice, 1 / yearsHeld) - 1) * 100
    : 0;
  return { totalReturn, annualizedReturn, gain };
}

export function calculateDevaluation(
  currentPkrValue: number,
  devaluationPct: number,
  currentUsdRate = 280
): { newValue: number; loss: number; usdEquivalent: number; impliedUsdRate: number } {
  const newUsdRate = currentUsdRate * (1 + devaluationPct / 100);
  const usdEquivalent = currentPkrValue / currentUsdRate;
  const newValue = usdEquivalent * newUsdRate;
  return {
    newValue: Math.round(newValue),
    loss: Math.round(currentPkrValue - newValue),
    usdEquivalent,
    impliedUsdRate: newUsdRate,
  };
}

export function calculateFIRE(
  monthlyExpenses: number,
  currentSavings: number,
  monthlySavings: number,
  expectedReturn: number,
  inflationRate = 0,
  withdrawalRate = 4
): { targetCorpus: number; yearsToFire: number; progressPct: number; realReturn: number } {
  const annualExpenses = monthlyExpenses * 12;
  const targetCorpus = annualExpenses / (withdrawalRate / 100);
  const progressPct = Math.min((currentSavings / targetCorpus) * 100, 100);

  const realReturn = inflationRate > 0
    ? ((1 + expectedReturn / 100) / (1 + inflationRate / 100) - 1) * 100
    : expectedReturn;

  if (currentSavings >= targetCorpus) {
    return { targetCorpus, yearsToFire: 0, progressPct: 100, realReturn };
  }

  const monthlyRate = realReturn / 100 / 12;
  let years = 0;
  let fv = currentSavings;
  const maxYears = 100;

  while (fv < targetCorpus && years < maxYears) {
    for (let m = 0; m < 12; m++) {
      fv = fv * (1 + monthlyRate) + monthlySavings;
    }
    years++;
  }

  return {
    targetCorpus,
    yearsToFire: years >= maxYears ? -1 : years,
    progressPct,
    realReturn,
  };
}

export function formatPKR(amount: number): string {
  return `Rs. ${amount.toLocaleString('en-PK', { minimumFractionDigits: 0, maximumFractionDigits: 0 })}`;
}

export const calculateDHAROI = calculateAssetROI;

export function daysBetween(from: string | Date, to: string | Date = new Date()): number {
  return Math.max(0, Math.round((toUtcMs(to) - toUtcMs(from)) / DAY_MS));
}

// Records are filed by the user's local calendar day, and month queries use a
// local month key. toISOString() would stamp UTC, which files anything entered
// between local midnight and 05:00 PKT under the previous day.
export function todayLocal(date: Date = new Date()): string {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, '0');
  const day = String(date.getDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
}
