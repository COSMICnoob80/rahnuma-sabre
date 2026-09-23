# Data Sources

## Current state (beta)

PSX prices come from Yahoo Finance's chart endpoint for `.KAR` tickers
(`query1` with `query2` as a fallback host), read through `src/services/psxService.ts`.

**This is indicative, end-of-day data and it is not licensed.** Specifically:

- Undocumented and unsupported: the endpoint can change or rate-limit without notice.
- Delayed/EOD, not a live feed. It must never be presented as real-time.
- No contractual right to redistribute it.

Because of that, the app treats a quote as a claim with an expiry, not a fact:

- A failed fetch **keeps the last known price** and labels it stale. It never blanks a holding.
- `priceFreshness()` labels every quote: up to date, hours old, dated, or never fetched.
- Holdings with no fetched price display the buy price with an explicit
  "showing buy price" marker rather than implying it is the market price.
- Repeated questions are cached on-device for 24 hours, so a beta of a few hundred users does
  not hammer the endpoint.

## Roadmap

Ordered by what a pitch or an audit would require:

1. **Licensed EOD data.** PSX / NCCPL sell end-of-day data commercially. This is the first
   purchase once there is any funding, and it is the honest answer to "where does your data
   come from?".
2. **Mutual fund NAVs** via MUFAP-published data, for the fund-tracking half.
3. **SBP policy rates / T-bill cut-offs** for the savings and devaluation scenarios, replacing
   the user-supplied USD assumption.
4. **Real-time (delayed-15-min or live)** only if a user segment demonstrably pays for it.

## Things SABRE deliberately will not do

- Scrape broker portals or parse broker emails for position data. It requires user
  credentials, it is fragile, and it puts the user's brokerage account at risk.
- Store financial data on a server. Manual entry, on-device storage.

That second point is a genuine trade-off, not a pure win: several competitors auto-sync from
broker emails and it is a better first-run experience. SABRE's answer is that a financial
advisor holding brokerage credentials is a worse problem than manual entry — and manual entry
matching against your own records is a feature for the accuracy-conscious investor.
