/**
 * PMEX board derivation — pure.
 *
 * Turns the verified live board (docs/HARVEST-PMEX.md §2.1) into searchable
 * rows. Quotes only: contract, category, bid/ask, signed change and freshness.
 * There is deliberately no settlement call, verdict or advisory field.
 *
 * The PKR/tola line appears only where the harvest can derive it:
 * - TOLAGOLD-*   native PKR per tola
 * - MTOLAGOLD-*  native PKR per 0.001 tola, shown as PKR/tola (x1000)
 * - SL*          USD/oz silver, converted with the verified formula and labelled
 *                "derived"
 * Every other contract ships without a PKR/tola line.
 */

import type { PmexRow } from '../services/pmexService.ts';
import { midPrice, pkrPerTolaFromUsdPerOz } from '../services/pmexService.ts';
import { formatOutlookNumber } from '../services/globalMarkets.ts';

export const PMEX_BOARD_OFFLINE = 'PMEX offline';
export const PMEX_BOARD_EMPTY = 'No live contracts.';

export type PmexGroup = 'Metals' | 'Energy' | 'FX' | 'Other';
export type PmexFilter = 'All' | 'Metals' | 'Energy' | 'FX';

// The 9 categories in the harvest map fold into the four filter chips. Indices,
// Agri, Phy_Agri and Financials are reachable under All.
export const PMEX_FILTERS: PmexFilter[] = ['All', 'Metals', 'Energy', 'FX'];

const GROUP_BY_CATEGORY: Record<string, PmexGroup> = {
  Metals: 'Metals',
  Phy_Gold: 'Metals',
  Oil: 'Energy',
  Energy: 'Energy',
  Cots: 'FX',
  Agri: 'Other',
  Phy_Agri: 'Other',
  Indices: 'Other',
  Financials: 'Other',
};

export function pmexCategoryGroup(category: string): PmexGroup {
  return GROUP_BY_CATEGORY[category] ?? 'Other';
}

export type PmexTone = 'pos' | 'neg' | 'flat';

export interface PmexAsset {
  contract: string;
  category: string;
  group: PmexGroup;
  bid: number | null;
  ask: number | null;
  changePct: number | null;
  changeLabel: string;
  tone: PmexTone;
  updatedAtMs: number | null;
  timeLabel: string;
  // "PKR 420,324.50 / tola" or "≈ PKR 5,419.00 / tola (derived)"; null where
  // the harvest cannot derive a PKR/tola figure.
  pkrLine: string | null;
  pkrDerived: boolean;
}

function changeTone(changePct: number | null): PmexTone {
  if (changePct === null || !Number.isFinite(changePct) || changePct === 0) return 'flat';
  return changePct > 0 ? 'pos' : 'neg';
}

function changeLabel(changePct: number | null): string {
  if (changePct === null || !Number.isFinite(changePct)) return '—';
  if (changePct === 0) return '0.00%';
  return `${changePct > 0 ? '+' : ''}${changePct.toFixed(2)}%`;
}

function timeLabel(updatedAtMs: number | null): string {
  if (updatedAtMs === null || !Number.isFinite(updatedAtMs)) return '—';
  const at = new Date(updatedAtMs);
  return `${String(at.getUTCHours()).padStart(2, '0')}:${String(at.getUTCMinutes()).padStart(2, '0')} UTC`;
}

// The harvest says never ship a row whose bid and ask are both zero/null: it is
// listed but has no two-sided market.
function hasTwoSidedMarket(row: PmexRow): boolean {
  const bid = row.bid ?? 0;
  const ask = row.ask ?? 0;
  return bid > 0 || ask > 0;
}

function tolaLine(
  row: PmexRow,
  mid: number | null,
  usdPkr: number | null
): { line: string | null; derived: boolean } {
  if (mid === null) return { line: null, derived: false };

  if (row.contract.startsWith('TOLAGOLD-')) {
    return { line: `${formatOutlookNumber(mid)} PKR / tola`, derived: false };
  }
  if (row.contract.startsWith('MTOLAGOLD-')) {
    return { line: `${formatOutlookNumber(mid * 1000)} PKR / tola`, derived: false };
  }
  if (row.contract.startsWith('SL')) {
    const pkrPerTola = usdPkr === null ? null : pkrPerTolaFromUsdPerOz(mid, usdPkr);
    if (pkrPerTola === null) return { line: null, derived: true };
    return { line: `≈ ${formatOutlookNumber(pkrPerTola)} PKR / tola (derived)`, derived: true };
  }
  return { line: null, derived: false };
}

export function buildPmexAssets(rows: PmexRow[], usdPkr: number | null): PmexAsset[] {
  const assets: PmexAsset[] = [];

  for (const row of rows) {
    if (!hasTwoSidedMarket(row)) continue;
    const mid = midPrice(row);
    const derived = tolaLine(row, mid, usdPkr);
    assets.push({
      contract: row.contract,
      category: row.category || '—',
      group: pmexCategoryGroup(row.category),
      bid: row.bid,
      ask: row.ask,
      changePct: row.changePct,
      changeLabel: changeLabel(row.changePct),
      tone: changeTone(row.changePct),
      updatedAtMs: row.updatedAtMs,
      timeLabel: timeLabel(row.updatedAtMs),
      pkrLine: derived.line,
      pkrDerived: derived.derived,
    });
  }

  return assets;
}

export function filterPmexAssets(assets: PmexAsset[], filter: PmexFilter): PmexAsset[] {
  if (filter === 'All') return assets;
  return assets.filter((asset) => asset.group === filter);
}

export function searchPmexAssets(assets: PmexAsset[], query: string): PmexAsset[] {
  const needle = query.trim().toLowerCase();
  if (needle.length === 0) return assets;
  return assets.filter(
    (asset) =>
      asset.contract.toLowerCase().includes(needle) ||
      asset.category.toLowerCase().includes(needle)
  );
}

export function visiblePmexAssets(
  assets: PmexAsset[],
  query: string,
  filter: PmexFilter
): PmexAsset[] {
  return searchPmexAssets(filterPmexAssets(assets, filter), query);
}
