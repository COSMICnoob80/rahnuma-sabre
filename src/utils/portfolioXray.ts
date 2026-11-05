/**
 * Rahnuma Sabre — portfolio X-ray (composition only)
 *
 * Every number here is arithmetic over the user's own ledger. There is
 * deliberately no benchmark, no look-through, no expense ratio and no
 * judgement: weights, largest holding, top-five share, HHI, sector share and
 * cost basis. Nothing in this module can say what a figure means for a trade.
 */

export interface XrayInput {
  ticker: string;
  /** Units held. */
  quantity: number;
  /** Current price, or the buy price when no quote has ever landed. */
  price: number;
  /** quantity × average buy price. */
  costBasis: number;
  /** Sector label from the shipped symbol catalog. */
  sector: string;
}

export interface XrayWeight {
  ticker: string;
  sector: string;
  value: number;
  weightPct: number;
}

export interface XraySector {
  sector: string;
  value: number;
  pct: number;
}

export interface PortfolioXray {
  holdingsCount: number;
  totalValue: number;
  totalCostBasis: number;
  /** Value rows sorted largest first; zero-value rows are excluded. */
  weights: XrayWeight[];
  /** Share of the largest holding, in percent. */
  largestHoldingPct: number;
  /** Sum of the five largest weights, in percent. */
  topFivePct: number;
  /** Sum of squared fractional weights, 0..1 (Σ w²). */
  hhi: number;
  /** Sector totals sorted largest first, in percent of total value. */
  sectorSplit: XraySector[];
}

export const XRAY_HEADER = 'Your composition — facts from your own ledger.';
export const XRAY_SCOPE = 'Holdings only — no cash rows in this ledger.';

function positive(value: number): number {
  return Number.isFinite(value) && value > 0 ? value : 0;
}

export function computePortfolioXray(rows: XrayInput[]): PortfolioXray {
  const valued = rows.map((row) => ({
    ticker: row.ticker,
    sector: row.sector,
    value: positive(row.quantity) * positive(row.price),
  }));

  const totalValue = valued.reduce((sum, row) => sum + row.value, 0);
  const totalCostBasis = rows.reduce((sum, row) => sum + positive(row.costBasis), 0);

  const weights: XrayWeight[] = valued
    .filter((row) => row.value > 0)
    .map((row) => ({
      ticker: row.ticker,
      sector: row.sector,
      value: row.value,
      weightPct: totalValue > 0 ? (row.value / totalValue) * 100 : 0,
    }))
    .sort((a, b) => b.value - a.value);

  const sectorTotals = new Map<string, number>();
  for (const row of weights) {
    sectorTotals.set(row.sector, (sectorTotals.get(row.sector) ?? 0) + row.value);
  }

  const sectorSplit: XraySector[] = Array.from(sectorTotals.entries())
    .map(([sector, value]) => ({
      sector,
      value,
      pct: totalValue > 0 ? (value / totalValue) * 100 : 0,
    }))
    .sort((a, b) => b.value - a.value);

  return {
    holdingsCount: rows.length,
    totalValue,
    totalCostBasis,
    weights,
    largestHoldingPct: weights.length > 0 ? weights[0].weightPct : 0,
    topFivePct: weights.slice(0, 5).reduce((sum, row) => sum + row.weightPct, 0),
    hhi: totalValue > 0 ? weights.reduce((sum, row) => sum + (row.value / totalValue) ** 2, 0) : 0,
    sectorSplit,
  };
}
