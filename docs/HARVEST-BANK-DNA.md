# Harvest — bank-DNA: four patterns from global wealth platforms (live-verified)

**Target of harvest:** the four patterns named by the founder — research-note format, fee
transparency page, holdings-batch import, portfolio X-ray — observed on Chase/J.P. Morgan,
Goldman Sachs, BlackRock, Citi/HSBC-style private-client platforms, and judged against a
Pakistan-market, **free**, **never-advising** product. NOT an app change; this beat harvests
and scopes only.

**Harvest channel: 1 — the targets' own live pages and specifications.** Every status code
below was observed from this host on **2026-11-04 (UTC)**, via `curl -L` with a desktop
Chrome user-agent, 25 s cap. Third-party guides are labelled as such and never used where an
official page exists. No archive, no cache, no second-hand price. No advice: this file
records product mechanics and prices, never a direction.

---

## 0. Citation correction — the ₹151k figure is not on disk

The work order asks the fee page to "cite Bloomberg's ₹151k figure we already own." It is not
in this repository:

```
grep -rn -E '151k|₹151|151,000|1,51,000' --include='*.md' .
→ 0 hits outside .beat/wo-bank-dna.md itself
```

Rather than repeat an unverifiable number, this beat read the public reported seat price live
and converted it at a live FX fix:

| Input | Value | Source (fetched this beat) |
|---|---|---|
| Bloomberg Terminal, single seat | **$31,980 / year** ($2,665 / month) | `https://www.thepricer.org/how-much-does-bloomberg-terminal-cost/` — **200**, 87,422 B |
| Same price, second independent page | **$31,980 / year**; $28,320 at multi-seat sites; $33,840 from 2027-01-01 | `https://marketterminal.com/blog/bloomberg-terminal-cost` — **200**, 186,479 B |
| USD/PKR fix | **276.527777** (updated 2026-11-04 00:02 UTC) | `https://open.er-api.com/v6/latest/USD` — **200**, 2,972 B |
| Converted | **PKR 8,843,358 / year** | 31,980 × 276.527777 |

Both price pages say Bloomberg does not publish a retail price list, so this is a *reported*
rate, not a quote — label it that way wherever it ships. ₹151,000 is roughly $1,800 at
₹84/USD, which is not a Bloomberg seat price and would understate the comparison by ~4.9×.
The grid below therefore cites the verified number and the date of the FX fix, not the
missing one.

---

## 1. Research-note format — Morningstar / Goldman Sachs one-pager

### 1.1 What the pattern is (observed)

A company report is a **fixed skeleton**, not free prose. Morningstar's own help page lists
the order explicitly:

- essential stats from the quote page first, then recent analyst notes;
- **Business strategy and outlook** — the analyst's view of the company;
- **Bulls Say / Bears Say** — positives and negatives, side by side;
- **Financial strength**, **Economic moats**, **Fair value and profit drivers**;
- **Risk and uncertainty**;
- **Capital Allocation**, then the **Analyst Notes Archive**.

The sample report's page 1 is the one-pager in miniature: `Last Price 149.15`, `Fair Value
Estimate 115.00`, `Price/FVE 1.30`, `Market Cap 2.49 USD Tril`, `Economic Moat Narrow`,
`Moat Trend Stable`, `Uncertainty High`, `Capital Allocation Standard` — followed by contents
`Business Description / Business Strategy & Outlook / Bulls Say / Bears Say / Economic Moat /
Fair Value and Profit Drivers / Risk and Uncertainty / Capital Allocation`.

Goldman Sachs runs the same idea as a series architecture rather than a single template:
`Insights — "Analysis and perspectives on the global economy and markets, from across Goldman
Sachs"`, organised into `Exchanges`, `The Markets`, `Talks at GS`, and `Top of Mind`.

### 1.2 The line we must not cross

The same page that gives the skeleton also gives a **verdict**: a five-tier rating running
from Gold to Negative, a fair-value estimate, and a price/fair-value ratio that reads
overvalued / fairly valued / undervalued. That is a recommendation with a number attached.
Our charter bans it twice — no directional claim, no "what to do."

### 1.3 Transplant — the "context note" skeleton

Adopt the *shape*, replace the verdict blocks with cited facts:

| Morningstar block | Our block | What changes |
|---|---|---|
| Essential stats | **Values, dated** | price · change · freshness · source, per row |
| Analyst notes | **What the record says** | attributed public statements, each with a date |
| Business strategy & outlook | **What the company itself reports** | filings/announcements, quoted and attributed |
| Bulls Say / Bears Say | **Evidence that cuts both ways** | both sides kept, neither scored |
| Fair value / profit drivers | **What would change these facts** | conditional on inputs, never a forecast |
| Risk and uncertainty | **Named unknowns** | list what is not known, not a probability |
| Moat / rating / price target | **omitted** | no score, no target, no cheap/expensive |

**Verdict: ADOPT the skeleton, SKIP the verdict layer.** One reason: the skeleton is a
reading aid a user can audit; the rating is a recommendation in disguise, and once a fair
value exists every other sentence starts serving it.

**No-advice-law check:** no field in the transplanted note can hold a buy/sell instruction,
a price target, or a directional sentence. "What would change these facts" is conditional
(`if the policy rate moves, the stated yield changes`) — not a prediction. Bulls/Bears remain
attributed evidence, never a score.

### 1.4 URLs fetched

| URL | Status | Payload observed |
|---|---|---|
| `https://www.goldmansachs.com/insights` | **200**, 945,317 B | title `Insights \| Goldman Sachs`; series `Exchanges`, `The Markets`, `Talks at GS`, `Top of Mind` |
| `https://www.gsam.com/content/gsam/us/en/advisors/market-insights.html` | **200**, 686,948 B | redirects to `am.gs.com/en-us/advisors`; title `Financial Intermediaries - Goldman Sachs Asset Management`; "Market Insights in Your Inbox" newsletter block |
| `https://www.morningstar.com/help-center/stocks/company-reports` | **200**, 224,152 B | the topic order quoted in §1.1 |
| `https://advisor.morningstar.com/Enterprise/VTC/MorningstarEquityAnalystReport.pdf` | **200**, 397,970 B | 19-page AAPL sample; page 1 metrics + contents listed in §1.1 (effective host `advhypo.morningstar.com`) |
| `https://www.morningstar.com/content/dam/marketing/shared/research/methodology/778136_Morningstar_Analyst_Rating_for_Funds_Methodology.pdf` | **200**, 711,413 B | five-tier scale Gold → Negative; "forward-looking analysis" |
| `https://morningstardirect.morningstar.com/clientcomm/Morningstar_Analyst_Rating_Brief_Descriptions.pdf` | **200**, 331,671 B | five pillars: People, Parent, Process, Performance, Price |

---

## 2. Fee transparency page — the brutal-simple grid

### 2.1 What the pattern is (observed)

Charles Schwab's pricing page opens with the number, not a paragraph:

- `$0 online equity trade commissions` in the hero;
- `$0 online trades` + `$0.65 per options contract`;
- `No account or trade minimums`;
- `No hidden fees`;
- then a jump-nav grid: `Trading Fees and Commissions`, `Account Fees and Minimums`,
  `Investment fees`, `Transferring Accounts`, and so on.

Vanguard does the same as one schedule keyed to assets, with every cell filled:

| Qualifying assets | Online ETF & stock | Broker-assisted | Options |
|---|---|---|---|
| < $1M | **$0** | $25 BAC per trade | $0 + $1 per contract |
| $1M–$4,999,999 | **$0** | $0 for first 25 trades | $0 + $1 per contract |
| $5M+ | **$0** | $0 for first 100 trades | $0 + $1 per contract |

Morningstar Investor prices the research layer as a subscription: `$249/year ($20.75/mo,
save 41%)` or `$34.95/month`.

### 2.2 Transplant — our "what we cost" page

The transplant is a grid, not a brochure. Every cell is a fact with a date:

| | Rahnuma | Morningstar Investor | Bloomberg Terminal (reported) |
|---|---|---|---|
| Price | **PKR 0** | $249 / year | $31,980 / year per seat |
| PKR at 276.527777 | **PKR 0** | **≈ PKR 68,855 / year** | **≈ PKR 8,843,358 / year** |
| Account required | no | yes | yes |
| Card required | no | yes | yes |
| Data leaves device | no — on-device ledger | yes — linked portfolios | yes |
| AI key | optional BYOK | n/a | n/a |
| Advice | none — boundary | ratings + fair value | research + terminal |

Footnote the two conversions with the source and the minute, e.g. "USD/PKR 276.527777,
open.er-api.com, 2026-11-04 00:02 UTC; Bloomberg price is a reported rate, not a published
quote."

**Verdict: ADOPT.** One reason: a fee grid is pure fact, needs no feed and no model, and it
makes the free/never-advising position legible on one screen — which is the exact argument
the beta post has to make.

**No-advice-law check:** the page states cost only. It must not imply better returns, must
not say "switch" or "save by moving", and must not rank providers by desirability. Pro
alternatives are named because their *prices are public*, not because the app prefers one.
The "Advice" row is a categorical difference, not a score.

**Caveat:** brokerage commission in Pakistan varies by broker and was **not** verified in
this beat. Do not invent a PSX commission line; either leave it out or run a separate
verified probe.

### 2.3 URLs fetched

| URL | Status | Payload observed |
|---|---|---|
| `https://www.schwab.com/pricing` | **200**, 610,770 B | `$0 online trades` · `$0.65 per options contract` · `No account or trade minimums` · `No hidden fees` · jump-nav sections |
| `https://investor.vanguard.com/client-benefits/investment-fees` | **200**, 208,819 B | "Vanguard Brokerage Services commission and fee schedules Effective July 10, 2026"; fees keyed to Qualifying Assets |
| `https://personal1.vanguard.com/pdf/v414.pdf` | **200**, 104,027 B | the 3-tier grid quoted in §2.1 (`Online: $0`, `$25 BAC`, `$1-per-contract`) |
| `https://www.morningstar.com/mm/investor/portfolio-management-tools` | **200**, 23,451 B | `$249 $20.75/mo—Save 41%` / `$34.95` monthly |
| `https://www.thepricer.org/how-much-does-bloomberg-terminal-cost/` | **200**, 87,422 B | `$31,980 per year for one subscription or $28,320 per year per Terminal at locations with multiple licenses`; explicitly "reported rates rather than a binding quote" |
| `https://marketterminal.com/blog/bloomberg-terminal-cost` | **200**, 186,479 B | `$31,980 a year ($2,665 a month)`; 2027 rise to `$33,840` / `$30,000` |
| `https://open.er-api.com/v6/latest/USD` | **200**, 2,972 B | `result: success`, `time_last_update_utc: Wed, 04 Nov 2026 00:02:31 +0000`, `PKR: 276.527777` |

---

## 3. Holdings-batch import — multi-account statement flows

### 3.1 What the pattern is (observed)

The flows differ in UI but agree on one shape: **one export = one account + one period +
one format**, and the file carries its own identity.

- **Chase.** Account Activity → Download offers `CSV, PDF, Excel`; the transaction detail
  carries `date, amount, type and reference number`. A third-party export guide adds that the
  web UI exports **one account at a time**, the mobile app cannot export CSV at all, and
  `.qbo` / `.qfx` / `.pdf` are separate choices — "Activity", not "Statements".
- **Bank of America (merchant).** Export up to **2,500** search results as **`.CSV` or
  `.JSON`**; the file carries "the information displayed in the Transaction List, including
  any customization's you make to the list and any filters you have applied."
- **Bank of America (QuickBooks).** Web Connect is the file-based path: download transactions
  from online banking, then open them in QuickBooks and reconcile — the QFX/OFX family.
- **OFX 2.2** is the formal contract behind those files: an `OFXHEADER` / `VERSION` /
  `SECURITY` / `ENCODING` / `CHARSET` envelope (§2.2), statement-download services for bank,
  credit card, loan, brokerage and mutual funds, posted vs pending transactions (§11.4.1),
  and account identity via `<ACCTID>` (§16.1.5) and `<ACCTTYPE>` (§16.1.6).

The failure modes are documented too, and they are the useful part. In Chase CSVs
(third-party guide): dates are `MM/DD/YYYY`; there is **one signed amount column** (negative
= debit, positive = credit); **pending rows have no Posting Date** and break date parsers;
the redundant `Details` and `Type` columns mislead importers into mapping the wrong amount;
long descriptions can truncate at 50 characters.

### 3.2 File formats and naming

No official page among the five fetched publishes a **filename convention**. The identity
that matters is inside the file — account mask, date range, header row, and format — not the
name on disk. Design consequence: **sniff the content, never parse the filename.** A user
who renames `download.csv` must not change the import result.

### 3.3 Transplant into our bank-CSV / FBR importers

Adopt the *batch envelope*, not a new file parser:

1. Wrap every import in metadata: `{ accountLabel, periodStart, periodEnd, sourceFormat,
   rowCount, skippedPending, skippedUnparsed }`.
2. Detect the header row instead of assuming row 0 — skip statement preambles/summary rows.
3. Accept column aliases (`Transaction Date` / `Post Date`, `Description` / `Details`,
   `Amount` signed vs separate debit/credit columns).
4. Deduplicate on `(accountLabel, postedDate, amount, normalizedDescription)` so re-importing
   an overlapping period is idempotent.
5. Report skipped pending rows explicitly — a blank-date row is a fact to surface, not a
   crash and not a silent drop.
6. Keep one batch per account; never merge two accounts into one undifferentiated list.

**Verdict: PARTIAL ADOPT — batch envelope + header sniffing + dedupe now; skip OFX/QFX this
sprint.** One reason: the beta cohort already exports bank CSV and FBR lines, and the two
landed importers parse those; a 695-page OFX surface adds parser risk for zero current users.

**No-advice-law check:** the import report counts rows, names rejects, and shows the period.
It never says what to do with a holding or an expense, and it never scores a transaction.

### 3.4 URLs fetched

| URL | Status | Payload observed |
|---|---|---|
| `https://www.chase.com/content/dam/chase-ux/documents/commercial-banking/chase-connect/cc_quickguide_account_activity.pdf` | **200**, 1,623,252 B | Account Activity → `Download Options … (CSV, PDF, Excel)`; transaction detail = date, amount, type, reference number |
| `https://merchanthelp.bankofamerica.com/Transaction_View_and_Export_in_Merchant_Services` | **200**, 92,296 B | export `up to 2500 transaction search results … either .CSV or .JSON`; file keeps applied filters/customisations |
| `https://www.bankofamerica.com/smallbusiness/online-banking/quickbooks/faqs/` | **200**, 168,800 B | Web Connect = download transactions from online banking, open in QuickBooks, reconcile |
| `https://financialdataexchange.org/wp-content/uploads/2025/12/OFX-2.2.pdf` | **200**, 4,989,726 B (695 pp) | §2.2 file format; bank/credit-card/loan/brokerage/mutual-fund statement download; §11.4.1 posted vs pending; §16.1.5 `<ACCTID>`, §16.1.6 `<ACCTTYPE>` |
| `https://ledgermatchapp.com/guides/chase-csv-reconciliation/` | **200**, 19,642 B | **third-party guide**: `MM/DD/YYYY`; one signed amount column; pending rows have no Posting Date; `Details`/`Type` duplicate the sign; 50-char truncation |
| `https://fynnap.com/guides/chase-csv-export` | **200**, 22,128 B | **third-party guide**: one account at a time; web-only export; avoid `.qbo` / `.qfx` / PDF for CSV import |

---

## 4. Portfolio X-ray — aggregate view without advice

### 4.1 What the pattern is (observed)

Morningstar's X-Ray is a set of named views over the same holdings, with a benchmark chosen
up front:

- **Asset class** — diversification across asset classes;
- **Stock sector** — "how you're concentrated across 12 sectors";
- **World regions** — geographic exposure;
- **Fees and expenses** — "weighted average expense ratio across your whole portfolio";
- **Stock stats** — price/book, price/earnings, and more;
- **Equity style box** and **fixed-income style box** (interest-rate sensitivity, credit
  quality);
- **Stock Intersection** — overlap between funds;
- a **Holdings Breakdown** table that names which securities drive **overweight or
  underweight** positions relative to the benchmark.

Schwab's Portfolio Checkup is the retail version of the same idea: check "sector and fixed
income diversification and equity concentration", check fund/stock ratings, and "create a PDF
report on-demand." BlackRock's Advisor Center 360 describes itself as helping advisors
"evaluate portfolios, compare models, surface tax-aware opportunities, and service SMAs" —
note that the last two are advice-adjacent and out of scope for us.

### 4.2 What we can compute honestly, on-device, today

| Metric | Honest today? | Why |
|---|---|---|
| Position weights | **yes** | quantity × price ÷ total, from the ledger |
| Largest holding / top-5 share | **yes** | same arithmetic |
| Herfindahl index (HHI) | **yes** | sum of squared weights; a single number, no judgement |
| Sector split | **yes** | `src/services/psxSymbols.ts` is the single sector source already shipped |
| Equity vs cash | **yes, if cash rows exist** | otherwise label the card "holdings only" |
| Cost basis / unrealised P/L | **yes** | already computed in the portfolio screen |
| Performance vs KSE-100 | **no** | we do not persist dated benchmark levels or a cash-flow-dated return series; any number would be invented |
| Fund look-through / overlap | **no** | no fund holdings data |
| Style boxes / P/E / P/B / credit quality | **no** | not in the PSX snapshot |
| Fee drag / weighted expense ratio | **no** | no expense-ratio field for PSX holdings |

**Verdict: ADOPT the composition subset (weights, concentration, sector, cost basis); SKIP
benchmark-relative performance and look-through.** One reason: arithmetic we can prove beats
a benchmark comparison we would have to fabricate, and the composition facts are already
computable from the shipped ledger.

**No-advice-law check:** show percentages and counts only. Do **not** use
"overweight"/"underweight" (that is a benchmark judgement), "diversify", "rebalance", or
"concentrated" as an adjective. Neutral labels: `largest holding`, `top five`, `sector
share`, `holdings only`. A user can see 41% in one name without the app telling them what
that means for their next trade.

### 4.3 URLs fetched

| URL | Status | Payload observed |
|---|---|---|
| `https://www.morningstar.com/help-center/portfolio/xray` | **200**, 258,213 B | the view list in §4.1; "concentrated across 12 sectors"; weighted average expense ratio; Stock Intersection; over/underweight vs benchmark |
| `https://www.schwab.com/portfolio-evaluation` | **200**, 342,827 B | Portfolio Checkup: "sector and fixed income diversification and equity concentration"; ratings; on-demand PDF |
| `https://www.blackrock.com/us/financial-professionals/tools/advisor-center-360` | **200**, 249,887 B | meta description: "evaluate portfolios, compare models, surface tax-aware opportunities, and service SMAs all from one place" |
| `https://www.blackrock.com/portfolio-centre/en-gb` | **200**, 93,038 B | Portfolio360 terms: "a suite of portfolio construction tools … improved understanding of their portfolio(s)" |

---

## 5. Probe ledger — what was walled or moved (so the next beat does not retry it)

| URL | Result | Note |
|---|---|---|
| `https://www.fidelity.com/trading/commissions-pricing` | **403**, 405 B | bot wall |
| `https://www.fidelity.com/calculators-tools/portfolio-analysis` | **403**, 418 B | bot wall |
| `https://www.fidelity.com/customer-service/how-to-download-account-data` | **403**, 437 B | bot wall |
| `https://www.morningstar.com/research` | **202**, 2,025 B | JS/bot shell, not the page |
| `https://www.morningstar.com/company/our-research` | **202**, 2,025 B | same shell |
| `https://www.blackrock.com/us/individual/products` | **403**, 426 B | bot wall |
| `https://www.blackrock.com/us/individual/products/portfolio-analyzer` | **404**, 92,755 B | page gone |
| `https://www.schwab.com/resource/csv-file-format` | **404**, 346,447 B | the old CSV spec page is gone |
| `https://www.schwab.com/portfolio-checkup` | **404**, 360,178 B | the Checkup lives under `/portfolio-evaluation` |
| `https://www.morningstar.com/portfolio/xray` | **404**, 152,589 B | help page is the live route |
| `https://www.ishares.com/us/strategies/portfolio-analysis` | **404**, 151,149 B | moved |
| `https://www.chase.com/digital/resources/faqs/statements/download-activity` | **404**, 241,075 B | retail help route retired |
| `https://investor.vanguard.com/client-benefits/expenses-fees` | **404**, 72,339 B | use `/investment-fees` |
| `https://www.wellsfargo.com/help/online-banking/statements/` | **404**, 9,680 B | moved |
| `https://www.bankofamerica.com/online-banking/account-activity/` | **404**, 0 B | moved |

All other probes in this beat returned **200** and are cited above. Nothing was bypassed: a
404/403 is recorded as a dead route, not worked around.

---

## 6. Build queue — ranked against the three landed harvests and the sprint

**Sprint reality, read from disk (not assumed):** budget **$0/mo**, Linux, **no sudo**
(`SPINE.md:9`); core is **BETA-READY** (`SPINE.md:15`); the next steps are a phone test/APK,
an Urdu-scope decision, a beta to **5–10 real PSX investors**, and a UI pass
(`SPINE.md:73–81`); the competitive note says ship the **phone test + r/FIREPakistan post
first**, before ARN's 10-day capture window closes (`competitive_analysis.md:91–94`). So the
queue is ordered by *what makes that beta post stronger with the least new surface*, not by
which pattern is most interesting.

| Rank | Build | Source | Why this position | Effort | Risk |
|---|---|---|---|---|---|
| 1 | **"What we cost" fee grid** | bank-DNA §2 | static copy, no host, no model; sharpens the free/never-advice pitch in the same post | hours | none |
| 2 | **X-ray composition card** (weights, top-1/top-5, HHI, sector, cost basis) | bank-DNA §4 | pure on-device math over the shipped ledger + `psxSymbols`; no new feed; visible in beta | small | copy red-line review |
| 3 | **PMEX PKR/tola gold + silver cards** | landed PMEX harvest | one keyless host, local unit (PKR/tola), proven conversion to 0.10%; the local-credibility card | medium | undocumented route, native-only, needs runtime gate |
| 4 | **Context-note renderer** (facts → drivers → both sides → what would change → sources) | bank-DNA §1 | reuses the existing council note shell; strongest no-advice review because "thesis/valuation" is one adjective from a recommendation | medium | red-line review |
| 5 | **Import batch envelope** (header sniff, account/period metadata, dedupe, pending counter) | bank-DNA §3 | real compatibility gain, but touches parsers and file picking; the existing two importers already serve the beta cohort | medium-high | parser regression |

**Deferred:** real-estate overview — only 12 symbols and no open-end PKR real-estate fund
lane was found, so it needs a fresh verification pass before it earns a build slot.

**No slot:** the advisor/AMC/broker directory — already shipped in the v10 rung; it is done,
not queued.

**Sequencing rule:** ranks 1–2 can land before the phone test. Ranks 3–5 should not start
until the phone test and the beta post are out; they are real work, but they do not make the
first five users' experience better than shipping the core to them does.

---

## 7. Evidence table

| Finding | Source | Status |
|---|---|---|
| Research-note skeleton is a fixed topic order, not free prose | Morningstar company-reports help | 200 / 224,152 B |
| Page 1 of a report leads with a rating, fair value and Price/FVE | Morningstar AAPL sample PDF | 200 / 397,970 B |
| Five-tier Gold→Negative scale + five pillars | Morningstar methodology + brief-description PDFs | 200 / 711,413 B + 331,671 B |
| GS frames research as named series (`Top of Mind`, `The Markets`) | goldmansachs.com/insights | 200 / 945,317 B |
| Brutal fee grid opens with `$0` and `No hidden fees` | Schwab pricing | 200 / 610,770 B |
| Fee schedule keyed to assets, every cell filled | Vanguard fee schedule PDF | 200 / 104,027 B |
| Research subscription is `$249/year` | Morningstar Investor tools page | 200 / 23,451 B |
| Bloomberg seat is a reported `$31,980/year` | The Pricer + Market Terminal | 200 / 87,422 B + 186,479 B |
| Live USD/PKR fix used for the conversion | open.er-api.com | 200 / 2,972 B |
| Chase exports CSV/PDF/Excel per account | Chase Connect Account Activity PDF | 200 / 1,623,252 B |
| BofA export cap is 2,500 rows, CSV or JSON | BofA merchant help | 200 / 92,296 B |
| OFX 2.2 defines the statement-download file format | financialdataexchange.org | 200 / 4,989,726 B |
| Chase CSV traps: signed amount, no pending date, 50-char truncation | LedgerMatch + Fynnap guides (third-party) | 200 / 19,642 B + 22,128 B |
| X-Ray views: asset class, 12 sectors, regions, fees, style boxes, overlap | Morningstar X-Ray help | 200 / 258,213 B |
| Retail Checkup: sector + fixed-income diversification, equity concentration | Schwab Portfolio Evaluation | 200 / 342,827 B |
| BlackRock 360: evaluate / compare / tax-aware / service | blackrock.com advisor page | 200 / 249,887 B |

**23 distinct URLs returned 200 and are cited in this file; 15 walled or moved URLs are
recorded in §5. Zero URLs were bypassed.**

---

## 8. Acceptance criteria (for the future builds)

- [ ] Fee page: every number carries a source and a date; the Bloomberg figure is labelled
      "reported"; the FX rate and its timestamp are visible; no "switch/save/better" copy.
- [ ] Context note: the five blocks render from cited facts; no fair value, rating, target,
      or cheap/expensive adjective; a red-line grep for `will (rise|fall)`, `target price`,
      `buy`, `sell` returns 0 in the new copy.
- [ ] X-ray: top-1 share, top-5 share, HHI, sector share, cost basis; no
      "overweight/underweight", "diversify", or "rebalance"; benchmark comparison absent
      until a dated series is persisted.
- [ ] Import: a renamed file imports identically; pending rows are counted, not dropped; a
      re-import of an overlapping period adds zero duplicates; one batch per account.
- [ ] Every new card degrades to a labelled `No data` rather than a blank or a stale number.
- [ ] Offline path: fee page, X-ray and import report all render with no network; only live
      quote cards depend on a feed.
