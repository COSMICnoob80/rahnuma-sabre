/**
 * Rahnuma Sabre — fee grid
 *
 * Every cell is a public price with a source and a date. Nothing here is a
 * preference: pro tiers are named because their prices are published, not
 * because this app favours them, and no row carries a ranking or an ordering
 * by desirability.
 *
 * Sources (harvested 2026-11-04, docs/HARVEST-BANK-DNA.md §2):
 * - Reported pro terminal seat: $31,980 / year for a single subscription.
 *     https://www.thepricer.org/how-much-does-bloomberg-terminal-cost/ (200, 87,422 B)
 *     https://marketterminal.com/blog/bloomberg-terminal-cost (200, 186,479 B)
 *   Both pages state the vendor does not publish a retail quote, so the figure
 *   ships as REPORTED, not as a live published rate.
 * - USD/PKR fix 276.527777, updated 2026-11-04 00:02 UTC.
 *     https://open.er-api.com/v6/latest/USD (200, 2,972 B)
 *   31,980 × 276.527777 = 8,843,358.08 → shown as PKR 8,843,358 / year.
 * - India family advisory tier: fixed ₹151,000 / year, or up to 2.5% of assets.
 *   Reported in the published intro of Bloomberg's India Where-to-Invest
 *   special, Oct 2026. REPORTED only — this build did not verify it live.
 * - Brokerage commissions vary by broker in Pakistan and were NOT verified in
 *   the harvest, so no commission number ships. The row says so instead.
 */

export type FeeRowId = 'rahnuma' | 'pro-seat' | 'india-tier' | 'brokerage';

export interface FeeRow {
  id: FeeRowId;
  label: string;
  /** The headline price, exactly as it should read on screen. */
  price: string;
  /** PKR conversion, only where a second currency is stated. */
  converted?: string;
  /** One factual line under the price. */
  note: string;
  /** Where the number comes from, with its date. */
  source?: string;
  /** True only where the figure is a reported rate, not a live published quote. */
  reported?: boolean;
}

export const COST_HEADER = 'WHAT WE COST';
export const COST_SUBHEAD = 'Every number is public, sourced and dated.';
export const COST_FOOTER =
  'Information only · Not investment advice · Rahnuma will never tell you to buy or sell';

export const FEE_ROWS: FeeRow[] = [
  {
    id: 'rahnuma',
    label: 'Rahnuma',
    price: 'PKR 0',
    note: 'no account, no contract, no call',
    source: 'On-device ledger. No server, no login, no card.',
  },
  {
    id: 'pro-seat',
    label: 'Pro advisory seat (reported)',
    price: 'reported $31,980 / year',
    converted: '≈ PKR 8,843,358 / year',
    note: 'One seat. A reported rate, not a published quote.',
    source: 'USD/PKR 276.527777, open.er-api.com, 2026-11-04 00:02 UTC',
    reported: true,
  },
  {
    id: 'india-tier',
    label: 'India family advisory tier (reported)',
    price: 'reported ₹151,000 / year',
    converted: 'or up to 2.5% of assets',
    note: 'Reported figure, not verified live in this build.',
    source: 'Bloomberg India Where-to-Invest special, intro, Oct 2026',
    reported: true,
  },
  {
    id: 'brokerage',
    label: 'Brokerage and account fees',
    price: 'varies by broker',
    note: "Brokerage fees apply wherever you trade — that is your broker's page, not ours.",
    source: 'Not verified in this build, so no commission number ships.',
  },
];
