# Scope — Real-Estate Overview Lane (Pakistan + global, verified feeds)

**Status:** scoped, not built. Docs only — no app code, no screens in this beat.
**Probe window:** 2026-11-04T14:22–14:37Z, from this host.
**Charter check:** `docs/WHY.md` — facts, never a forecast. Exposure is shown through
traded instruments; the user's own property is never priced.
**Harvest channel:** public documentation and public quote pages only — PSX's own Data
Portal (server-rendered), MUFAP's published fund directory, Yahoo Finance quote pages.
No decompilation, no scraping of listing portals.

---

## What this lane is

A real-estate overview lane for the Command Center: a global property card on the
morning strip, plus a Pakistan list of every real-estate instrument that actually trades
on PSX. It answers "what is this market doing" with quotes and freshness labels. It does
not answer "what is my house worth" — there is no honest feed for that (see §3).

---

## 1. Pakistan — the traded universe

**Universe extraction:** `https://dps.psx.com.pk/screener` → **HTTP 200, 702,612 B**,
server-rendered table. The sector legend is the portal's own:

```
<option value="0836">REAL ESTATE INVESTMENT TRUST</option>
<option value="0838">PROPERTY</option>
```

Exactly **7 rows** carry sector `0836` and **5 rows** carry `0838`. The same table
carries a PRICE column, but the per-symbol daily quote is read from the symbol's own
page — the exact HTML block the app already parses with `parseDpsCompanyQuote`.

### 1.1 Listed REITs (7 of 7)

Every row below resolved **HTTP 200** on its DPS company page on probe day. Payload
trim is the page title plus the `quote__close` block.

| Symbol | Listed REIT | `dps.psx.com.pk/company/{SYM}` | Bytes | Last close (payload trim) |
|---|---|---|---|---|
| DCR | Dolmen City REIT | 200 | 66,185 | `<title>DCR - Stock quote for Dolmen City REIT…</title>` · `class="quote__close">Rs.38.79` |
| GRR | Globe Residency REIT | 200 | 72,281 | `<title>GRR - Stock quote for Globe Residency REIT…</title>` · `class="quote__close">Rs.16.27` |
| IREIT | Image REIT | 200 | 64,343 | `<title>IREIT - Stock quote for Image REIT…</title>` · `class="quote__close">Rs.7.71` |
| JSRR | JS Rental REIT | 200 | 59,289 | `<title>JSRR - Stock quote for JS Rental REIT…</title>` · `class="quote__close">Rs.10.50` |
| NNAR | Naya Nazimabad Apartment REIT | 200 | 62,871 | `<title>NNAR - Stock quote for Naya Nazimabad Apartment REIT…</title>` · `class="quote__close">Rs.21.34` |
| SRR | Signature Residency REIT | 200 | 64,511 | `<title>SRR - Stock quote for Signature Residency REIT…</title>` · `class="quote__close">Rs.18.00` |
| TPLRF1 | TPL REIT Fund I | 200 | 71,758 | `<title>TPLRF1 - Stock quote for TPL REIT Fund I…</title>` · `class="quote__close">Rs.8.78` |

`SRR`'s screener row carried the portal's own `XD` tag on probe day (ex-dividend). That
is a corporate-action label on the row, not a price gap; the page still published a close.

### 1.2 Listed property-sector companies (5 of 5)

PSX's own `0838 PROPERTY` classification. Reported as the exchange labels it, not as a
guess about the underlying business.

| Symbol | Listed name | DPS page | Bytes | Last close (payload trim) |
|---|---|---|---|---|
| BRRG | B.R.R Guardian Limited | 200 | 67,096 | `class="quote__close">Rs.39.89` |
| HUSI | Husein Industries Limited | 200 | 66,260 | `class="quote__close">Rs.45.31` |
| JVDC | Javedan Corporation Limited | 200 | 69,239 | `class="quote__close">Rs.132.97` |
| PACE | Pace (Pakistan) Limited | 200 | 69,031 | `class="quote__close">Rs.9.05` |
| TPLP | TPL Properties Limited | 200 | 73,021 | `class="quote__close">Rs.12.67` |

### 1.3 Listed REIT-management companies — empty

No such category was identifiable from the exchange's own data. The screener exposes no
REIT-management sector, and zero company titles contain "REIT Management". A REIT's
manager (the RMC) is a role inside the scheme, not a separately quoted ticker in this
universe. If the founder has a specific listed manager in mind, it needs its own DPS
probe before it can be added — it is not invented here.

### 1.4 Open-end real-estate funds — none published

`https://mufap.com.pk/FundProfile/FundDirectory` → **HTTP 200** in a headed Chromium
session (`Navigation Timing responseStatus = 200`), page title
`Fund Directory | MUTUAL FUNDS ASSOCIATION OF PAKISTAN`, **561 fund entries**, **60
category rows** (`.dtsp-name`). A scan of those 60 category labels for
`/real\s*estate|reit|propert/i` returned **zero matches**. The directory's category
taxonomy runs: Aggressive Fixed Income, Asset Allocation, Balanced, Capital Protected,
Dedicated Equity, Equity, Exchange Traded Fund, Fixed Rate / Return, Fund of Funds,
Income, Index Tracker, Money Market, plus the Shariah-compliant and VPS variants.

The same host answers a plain `curl` with **403** (`5,790 B`, Cloudflare
`Just a moment...`), and the old `.php` routes answer 404 — which is why the browser was
used. That is recorded, not hidden.

**Boundary on this claim:** SECP's own collective-investment-scheme register was not
readable this beat — `https://www.secp.gov.pk/document/real-estate-investment-trust-regulations-2022/`
returned **403** (Cloudflare challenge) to both curl and headed Chromium at 14:37Z. The
no-open-end-real-estate-fund finding therefore rests on MUFAP's published directory, not
on a SECP registry audit. It should be re-checked against SECP before any public claim.

### 1.5 PK feed verdict

All **12** instruments resolve from `dps.psx.com.pk/company/{SYM}` with a
`quote__close` value — the existing parser path, **no new host**. It is the exchange's
published daily close on a server-rendered page, not intraday. A blank or a 500 gets the
existing labelled `No data` treatment; nothing is fabricated.

---

## 2. Global — the existing Yahoo ladder

Ten symbols were tested. Each has two facts, and they are not the same fact:

1. The **quote page** `https://finance.yahoo.com/quote/{SYM}/` returned **200** for all
   ten, with the symbol's own name in the title and a `data-testid="qsp-price"` value.
2. The **chart endpoint** the app actually calls
   (`https://query1.finance.yahoo.com/v8/finance/chart/{SYM}?interval=1d&range=5d`,
   `query2` fallback) returned **429, 19 B** for all ten on both hosts during this
   window. This is the same host-family rate limit already recorded in `[outlook-live]`
   and `[psx-national]`.

| Symbol | What Yahoo calls it (title trim) | Quote page | Price trim | Chart 1/2 |
|---|---|---|---|---|
| VNQ | Vanguard Real Estate Index Fund ETF Shares | 200 · 846,451 B | `95.01`* | 429 / 429 |
| REZ | iShares Residential and Multisector Real Estate ETF | 200 · 837,677 B | `92.62` | 429 / 429 |
| RWO | State Street SPDR Dow Jones Global Real Estate ETF | 200 · 838,949 B | `48.31` | 429 / 429 |
| ^DJUSRE | Dow Jones U.S. Real Estate Inde | 200 · 807,859 B | `381.03` | 429 / 429 |
| XLRE | State Street Real Estate Select Sector SPDR ETF | 200 · 826,080 B | `43.67` | 429 / 429 |
| IYR | iShares U.S. Real Estate ETF | 200 · 838,651 B | `100.86` | 429 / 429 |
| SCHH | Schwab U.S. REIT ETF | 200 · 843,434 B | `23.31` | 429 / 429 |
| RWX | State Street SPDR Dow Jones International Real Estate ETF | 200 · 824,317 B | `25.94` | 429 / 429 |
| VNQI | Vanguard Global ex-U.S. Real Estate Index Fund ETF Shares | 200 · 840,297 B | `42.94` | 429 / 429 |
| ^SP500-60 | S&P 500 Real Estate (Sector) | 200 · 810,992 B | `278.40` | 429 / 429 |

\* The VNQ quote page also embeds unrelated market-summary widgets; the symbol's own
price is the `qsp-price` node, which read `95.01` on the page. The `141.31` first match
in the raw HTML belongs to that shared widget, so the node is the value to trust. This
discrepancy is recorded rather than smoothed over — the chart endpoint, not HTML
scraping, is the runtime path.

**What the 429 means for this scope:** the quote pages prove Yahoo carries the symbols
and serves their names. They do **not** prove the chart path works from this host today.
The global card must keep the existing runtime contract — chart success → live, chart
failure → cached or labelled `No data`, never a hardcoded number. The phone on mobile
data remains the real validator, as with every existing Yahoo symbol.

### Card choice

- **RWO — adopt for the "global property" card.** It is the DJ Global Real Estate ETF,
  USD-quoted and tradeable, so an `≈ PKR …` line is a conversion of a per-share price,
  which is a meaningful number.
- **VNQ — US-only alternative**, the most liquid of the set.
- **REZ** — US residential + multisector; redundant with VNQ for a one-card lane.
- **^DJUSRE / ^SP500-60** — index levels in points. Do **not** feed them through
  `pkrConvert`: multiplying an index level by PKR/USD yields a number with no meaning.
  If used at all, they are context rows labelled `index level`.
- **XLRE, IYR, SCHH, RWX, VNQI** — valid symbols, redundant with the three above;
  dropped from v1 to keep the lane honest and small.

---

## 3. Data boundaries — what this lane cannot honestly show

1. **Your house, plot, or mohalla.** There is no free, machine-readable local price
   feed and no sub-registrar (daftar) transaction feed. Listing portals publish asking
   prices, not executed prices. This lane never displays a valuation of the user's own
   property.
2. **Private and unlisted REIT schemes.** No public quote exists; the lane shows only
   the seven PSX-listed REITs.
3. **NAV and distribution data.** MUFAP publishes no real-estate category, and a REIT
   quote page carries price, not NAV or distribution. No derived yield is shown.
4. **DHA files, open plots, informal housing.** Not traded instruments; no verified
   price.
5. **Global property in PKR.** The PKR figure is a currency conversion of a USD-quoted
   ETF share, not an appraisal of property.
6. **Index levels.** Points are not currency-convertible; they stay unconverted and
   labelled.
7. **Thin REITs.** Market caps on probe day ranged from ~2.1B PKR (IREIT) and ~2.3B
   (JSRR, GRR) to 86.3B (DCR). The lane shows the quote and its freshness. It does not
   attach a liquidity score or infer anything from the size.

### Honest three-line verdict (copy for the lane intro)

> Real-estate exposure through traded instruments only: seven PSX-listed REITs and five
> PSX property-sector companies in PKR, plus one global property ETF converted at the
> session's PKR/USD. Rahnuma does not price your house, your plot, or your mohalla — no
> free, verifiable local-market feed exists, and listings are asking prices, not
> transactions. The card is a market snapshot with a freshness label, not a valuation
> and not a forecast.

---

## 4. Adopted shape (for the future build — no code in this beat)

- **Strip:** one card, `RWO`, label `GLOBAL PROPERTY`, Urdu sublabel `عالمی رئیل اسٹیٹ`,
  value + delta + freshness on the existing 15-minute window; `≈ PKR …` underneath via
  `pkrRateFromQuotes` reading `PKR=X` from the **same** snapshot — no second FX fetch.
- **Lane body:** two lists, `PK REITs (7)` and `PK PROPERTY (5)`. Each row: symbol ·
  listed name · last close · freshness · source. No charts in v1.
- **Index context line (optional):** `^DJUSRE` in points, labelled `index level`, never
  PKR-converted.
- **Fetches:** DPS company pages for PK through the existing parser; Yahoo through the
  existing query1 → query2 ladder for the card; 15-minute strip window over the 24-hour
  quote cache.
- **Contracts:** `Context, not forecast` chip; the pinned
  `Information only, not investment advice` prefix stays; no directional or
  transactional wording anywhere in the copy.

## 5. Acceptance criteria (for the future build)

- [ ] All 12 PK rows resolve from DPS; each shows a close or a labelled `No data`, never
      a blank.
- [ ] The global card shows value + delta + freshness; a 429 falls back to cached or
      `No data`, never a fabricated number.
- [ ] The PKR line uses the same snapshot's rate; no second FX fetch.
- [ ] Index levels are never PKR-converted.
- [ ] No valuation of user property and no local-market price claim.
- [ ] Copy grep returns zero directional/transactional wording.

---

## Evidence table

| Claim | URL | Status | Payload trim |
|---|---|---|---|
| REIT + PROPERTY universe, 7 + 5 rows | `https://dps.psx.com.pk/screener` | 200 · 702,612 B | `<option value="0836">REAL ESTATE INVESTMENT TRUST</option>`; `<option value="0838">PROPERTY</option>`; `<a href="/company/DCR" data-title="Dolmen City REIT">` |
| DCR quote | `https://dps.psx.com.pk/company/DCR` | 200 · 66,185 B | `<title>DCR - Stock quote for Dolmen City REIT…</title>` · `quote__close">Rs.38.79` |
| GRR quote | `https://dps.psx.com.pk/company/GRR` | 200 · 72,281 B | `quote__close">Rs.16.27` |
| IREIT quote | `https://dps.psx.com.pk/company/IREIT` | 200 · 64,343 B | `quote__close">Rs.7.71` |
| JSRR quote | `https://dps.psx.com.pk/company/JSRR` | 200 · 59,289 B | `quote__close">Rs.10.50` |
| NNAR quote | `https://dps.psx.com.pk/company/NNAR` | 200 · 62,871 B | `quote__close">Rs.21.34` |
| SRR quote | `https://dps.psx.com.pk/company/SRR` | 200 · 64,511 B | `quote__close">Rs.18.00` |
| TPLRF1 quote | `https://dps.psx.com.pk/company/TPLRF1` | 200 · 71,758 B | `quote__close">Rs.8.78` |
| BRRG quote | `https://dps.psx.com.pk/company/BRRG` | 200 · 67,096 B | `quote__close">Rs.39.89` |
| HUSI quote | `https://dps.psx.com.pk/company/HUSI` | 200 · 66,260 B | `quote__close">Rs.45.31` |
| JVDC quote | `https://dps.psx.com.pk/company/JVDC` | 200 · 69,239 B | `quote__close">Rs.132.97` |
| PACE quote | `https://dps.psx.com.pk/company/PACE` | 200 · 69,031 B | `quote__close">Rs.9.05` |
| TPLP quote | `https://dps.psx.com.pk/company/TPLP` | 200 · 73,021 B | `quote__close">Rs.12.67` |
| No open-end real-estate category | `https://mufap.com.pk/FundProfile/FundDirectory` | 200 (headed Chromium; curl 403 Cloudflare) | title `Fund Directory \| MUTUAL FUNDS ASSOCIATION OF PAKISTAN`; `Showing 1 to 30 of 561 entries`; 60 `.dtsp-name` categories; `/real estate\|reit\|property/i` → 0 |
| SECP register not readable | `https://www.secp.gov.pk/document/real-estate-investment-trust-regulations-2022/` | 403 (Cloudflare challenge, curl + headed Chromium) | `Just a moment...` — not relied on |
| Global symbols resolve | `https://finance.yahoo.com/quote/VNQ/` (same shape for REZ, RWO, ^DJUSRE, XLRE, IYR, SCHH, RWX, VNQI, ^SP500-60) | 200 · 807,859–846,451 B | `data-testid="qsp-price">95.01`; titles name each fund/index |
| Runtime chart path rate-limited | `https://query1.finance.yahoo.com/v8/finance/chart/RWO?interval=1d&range=5d` (query2 identical) | 429 · 19 B, all ten symbols, both hosts | rate-limit body only; no quote returned |

---

**What changed:** this document only. No source, screen, symbol constant, or feed was
modified. `npm run ts:check` exit 0, unchanged.
