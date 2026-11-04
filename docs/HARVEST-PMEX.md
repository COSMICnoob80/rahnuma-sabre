# Harvest — PMEX local-commodity lane (source crawl, verified live)

**Target of harvest:** whether the Command strip's commodity cards can be sourced from
Pakistan Mercantile Exchange (PMEX) without a key, and at what cost in payload, latency and
fragility. NOT an app change — this beat harvests and scopes only.

**Harvest channel: 1 — the target's own live endpoints.** Every claim below is labeled with
the status code observed from this host on **2026-11-04** (UTC). No archive, no cache, no
second-hand price. No advice: this file states prices and mechanics, never a direction.

---

## 1. Entry point — the public site is walled, the portal is not

| URL | Result | Note |
|---|---|---|
| `https://www.pmex.com.pk/` | **403** `cf-mitigated: challenge` | Cloudflare managed challenge ("Just a moment…"), 5,373 B |
| `https://pmex.com.pk/` | **403** | same wall |
| `https://www.pmex.com.pk/robots.txt` | **403** | the wall covers *every* path, not just HTML |
| `https://www.pmex.com.pk/sitemap.xml` | **403** | |
| `http://www.pmex.com.pk/` | **403** | scheme is not the variable |
| `https://dportal.pmex.com.pk/mwatchnew` | **200** | 226,858 B, server-rendered market-watch shell — **this is the lane** |
| `https://dportal.pmex.com.pk/MWatchNew` | **200** | 226,858 B, same shell |
| `https://dportal.pmex.com.pk/MWatchNew/Home/Index` | **200** | 8,969 B, title `ManAPI` — no fetch calls of its own |
| `https://webtrade.pmex.com.pk/` | **200** | MetaQuotes web-terminal SPA; its `/api` and `/robots.txt` both **403** (13 B) — a trading terminal, not a quote API |

The full-browser-header retry (Accept, Accept-Language, `sec-ch-ua*`, `sec-fetch-*`,
`upgrade-insecure-requests`) still returns **403 / 3,270 B** — the challenge is JS/Turnstile,
not header sniffing. `cf-ray` came back `…-KHI`. Conclusion: `www.pmex.com.pk` is unusable
from a native fetch, and no bypass was attempted.

The market grid lives on the **`dportal` host**, which serves a plain ASP.NET MVC site
(`Server: Microsoft-IIS/10.0`, `X-AspNetMvc-Version: 5.2`) with **no challenge at all**.

---

## 2. Endpoint inventory (the site's own fetches, verbatim from the page source)

Only two fetch calls exist in the 226 KB shell:

```js
url:'/MWatchNew/Home/GetJSONObject'      // type: "Post", contentType: application/json
url: '/MWatchNew/Home/GetJSONObject1'    // type: "Get"
```

### 2.1 `POST /MWatchNew/Home/GetJSONObject` — the whole board

| Property | Verified value |
|---|---|
| URL | `https://dportal.pmex.com.pk/MWatchNew/Home/GetJSONObject` |
| Method | POST, `Content-Type: application/json; charset=utf-8` |
| Body | `{"status":"Active"}` (live contracts) or `{"status":"Inactive"}` (all contracts, incl. zero-sided) |
| Auth | **none** — no key, no token, no cookie. A bare POST with only `Content-Type` returned **200** |
| Status | **200**, 38,068 B (`Active`) / 65,735 B (`Inactive`) |
| Shape | flat JSON array; **80** rows (`Active`) / **144** rows (`Inactive`) |
| Freshness | per-row `_datetime` epoch, updated on every call (see §5) |
| Frequency used by PMEX's own page | `setInterval(updatePrices, 3000)` — the grid polls every 3 s |
| Cache headers | `Cache-Control: private`, no `Content-Encoding`, no `ETag` → 38 KB **uncompressed** per poll |
| CORS | **absent** (no `Access-Control-Allow-Origin`) — fine for native, fatal for the web mirror |
| Other methods | `GET` on the same route → **404** (route is POST-only) |

Trimmed real sample (one full record, `{"status":"Active"}` call, nothing redacted —
public market data):

```json
{
  "Contract": "GO100OZ-DE26", "Bid_Vol": null, "Bid": 4056.3, "Ask": 4056.8,
  "Ask_Vol": null, "Last_Price": "4053.6", "Last_Vol": "1", "Total_Vol": "17",
  "High": 4056.4, "Low": 3949.3, "Change": 118.7, "Change_Per": 3.01,
  "State": null, "_date": null, "_time": null, "_Message": null, "SysDate": null,
  "BidDiff": 0, "AskDiff": 0, "StatusTime": null, "last_": 0, "volume_": 0,
  "rBid": null, "rAsk": null, "BidVolume": null, "AskVolume": null,
  "Open": 3937.7, "Close": 3937.6, "Total_Volume": 0,
  "Category": "Metals", "_datetime": 1793821418
}
```

And the PKR-denominated tola row from the same response:

```json
{"Contract": "TOLAGOLD-WED", "Bid": 415833, "Ask": 424816, "Last_Price": "0",
 "High": 0, "Low": 0, "Change": -11453, "Change_Per": -2.68,
 "Category": "Phy_Gold", "_datetime": 1793821392}
```

Field notes that matter for a parser:

- `Last_Price`, `Last_Vol`, `Total_Vol` are **strings**; `Bid`, `Ask`, `High`, `Low`,
  `Change`, `Change_Per`, `Open`, `Close` are numbers. `Last_Price` can be `"0"` while a
  two-sided market exists — Bid/Ask is the reliable pair.
- `State`, `_date`, `_time`, `_Message`, `SysDate`, `StatusTime`, `rBid`, `rAsk`,
  `BidVolume`, `AskVolume` were **null in every row** across both calls — reserved, unused.
- `Change_Per` is a percentage number, not a fraction (`3.01` = +3.01%).

### 2.2 `GET /MWatchNew/Home/GetJSONObject1` — per-contract bid/ask ladder

| Property | Verified value |
|---|---|
| URL | `https://dportal.pmex.com.pk/MWatchNew/Home/GetJSONObject1` |
| Status | **200**, `application/json`, body is exactly `[]` (2 B) |
| Auth | none |
| Behaviour | The page feeds it `data: JSON.stringify([])` — the array is assembled client-side from the symbol the reader clicked. With an empty array the server answers an empty list. |
| Route probe | `?status=Active` → **200**, still `[]` |
| Related probe | `/MWatchNew/Home/GetClosingQuotes` → **404** (no closing-quote endpoint exists on this host) |
| Related probe | `https://dportal.pmex.com.pk/mwatch` → **500** (3,426 B) — an old route, do not use |

It returns per-symbol rows keyed by `Key`/`Symbol` with `BidVol`/`Bid`/`Ask`… but only when
it is given the symbol selector it expects. For the strip this endpoint is **not needed**:
the board already carries Bid/Ask for every live contract.

---

## 3. Contract map (144 contracts with `{"status":"Inactive"}`, 80 live)

| Category | Live | Total | Instruments | Unit (as quoted) | Denomination |
|---|---|---|---|---|---|
| `Metals` | 26 | 39 | `GO1OZ`, `GO10OZ`, `GO100OZ`, `GOMOZ` (gold); `SL1`, `SL10`, `SL100OZ`, `SL500OZ`, `SL5000OZ` (silver); `COPPER`, `COPPER25K`, `COPPER100`; `PLATINUM1/5/50`, `PLATINUMHOZ`; `PALDIUM100`; `ALUMINUM1/5` | USD per **troy ounce** (gold/silver/platinum/palladium); USD per pound (copper) | **USD** |
| `Phy_Gold` | 2 | 21 | `TOLAGOLD-<DAY>`, `MTOLAGOLD-<DAY>` (mon–fri), `MINIGOLD-<DAY>`, `TGOLD50`, `TGOLD100`, `GOLD-MONTH`, `GOLDKILO-MONTH` | PKR per **tola** (`TOLAGOLD`), per **0.001 tola** (`MTOLAGOLD`), per 50/100 tola (`TGOLD50/100`), per kilo (`GOLDKILO`) | **PKR** |
| `Oil` | 10 | 16 | `BRENT10/100/1000`, `CRUDE1/10/100/1000` (+`ID` variants) | USD per barrel | USD |
| `Energy` | 2 | 2 | `NGAS1K`, `NGAS10K` | USD per MMBtu | USD |
| `Agri` | 5 | 5 | `ICORN`, `IWHEAT`, `ISOYBEAN`, `ICOTTON`, `ICOTTON50K` | USD (cents/bu class) | USD |
| `Phy_Agri` | 3 | 17 | `SUGAR-NO26`, `LGMRRICE-NO26`, `MAIZELD-NO26` | PKR per 100 kg class | PKR |
| `Indices` | 10 | 10 | `SP500`, `NSDQ100`, `DJ`, `MICROSP500`, `MICROSDQ100`, `MINISP500`, `MININSDQ100`, `2NSDQ100`, `JPYEQTY1/5` | index points | USD-settled |
| `Cots` | 22 | 22 | `GOLD<AAA><BBB>` FX crosses — `GOLDEURUSD`, `GOLDGBPJPY`, `GOLDUSDCAD`, … | cross rate | — |
| `Financials` | 0 | 12 | `KIBOR3M-MONTH` (Dec-26 → Sep-29 strip) | — | all zero-sided today |

**Live contract codes observed in this beat's snapshot:** `GO100OZ-DE26` 4,053.6 last /
4,056.3 bid / 4,056.8 ask; `SL100OZ-DE26` 52.217 / 52.257 / 52.283; `BRENT10-JA27` 100.35 /
100.41 / 100.57; `CRUDE1-DE26` 93.19 / 93.14 / 93.20; `TOLAGOLD-WED` — last 0, bid 415,833,
ask 424,816; `MTOLAGOLD-WED` last 425, bid 424, ask 425.

Notes the map forces:

- **There is no PKR/USD contract.** `Financials` is KIBOR-only and all twelve rows are
  zero-sided; no currency pair involving PKR exists in the 144-row set. Any PKR conversion
  needs an FX rate from elsewhere (the app already carries `PKR=X`), or the implied rate in §4.
- **There is no PKR-denominated silver contract.** Silver is USD/oz only (`SL*`), so the
  PKR/tola silver figure must be derived, not read.
- **Gold, however, is quoted directly in PKR/tola** (`TOLAGOLD-*`), which is exactly the
  unit a Pakistani retail reader expects.
- `TOLAGOLD-WED` carries a **~2.2% spread** (415,833 vs 424,816) and `Last_Price: "0"` —
  only a midpoint is meaningful; the "last" field is not a price here.
- Monthly physical contracts (`GOLD-DE26`, `GOLDKILO`, `TGOLD50/100`) are all zero-sided
  today: they are listed but not continuously quoted.

---

## 4. Tola conversion layer

Definitions used (both are standards, not PMEX inventions):

- 1 tola = **11.6638 g** (the customary South-Asian standard; it is the unit `TOLAGOLD`
  is quoted in)
- 1 troy ounce = **31.1034768 g**
- therefore **1 tola = 0.375 troy ounce exactly** (0.375 × 31.1034768 = 11.6638038 g)

Formulas:

```
PKR/tola   = USD/oz × 0.375 × USD_PKR
PKR/gram   = PKR/tola ÷ 11.6638
PKR/10 g   = PKR/tola ÷ 1.16638
USD_PKR implied = TOLAGOLD_mid ÷ (USD_oz_bid × 0.375)
```

**Live verification of that formula** (same instant, 2026-11-04 ~19:43 PKT):

```
TOLAGOLD-WED mid  = (415,833 + 424,816) / 2 = 420,324.5 PKR/tola
GO100OZ-DE26 bid  = 4,057.6 USD/oz
implied USD/PKR   = 420,324.5 / (4,057.6 × 0.375) = 276.24
published USD/PKR = 276.5278   (open.er-api.com, daily fix)
difference        = 0.10%
```

So PMEX's own PKR/tola board *is* `USD/oz × 0.375 × rate` — the two sides of the exchange's
own book agree to a tenth of a percent, which is what makes the formula safe to ship.

Cross-check of the unit itself (independent keyless sources, same minute):

```
PMEX GO100OZ 4,056.3 bid   |  api.gold-api.com/price/XAU 4,048.5 USD/oz   (200)
PMEX SL100OZ   52.257 bid  |  api.gold-api.com/price/XAG   52.366 USD/oz  (200)
PMEX BRENT10  100.41 bid   |  (Yahoo BZ=F — 429 from this host, see §7)
```

`GO1OZ / GO10OZ / GO100OZ / GOMOZ` all printed within 4,053–4,058, i.e. the multipliers are
contract sizes, **not** price scales — the quote is always USD per ounce.

Silver worked example at the same snapshot:

```
PKR/tola silver = 52.257 × 0.375 × 276.5278 = 5,419 PKR/tola  (= 465 PKR/gram)
```

`MTOLAGOLD` is the sanity check that the tola unit is read correctly: `MTOLAGOLD-WED` bid
424 × 1000 = 424,000 vs `TOLAGOLD-WED` ask 424,816 — the "M" contract is PKR per
**0.001 tola**, i.e. the same price expressed in milli-tola.

---

## 5. Freshness field — `_datetime` is shifted +5 h

`_datetime` is an epoch integer, but it encodes **PKT wall-clock time stamped as if it were
UTC**. Verified against the server's own `Date` header on the same request:

```
response Date header : Wed, 04 Nov 2026 14:43:59 GMT    (real UTC)
row._datetime        : 1793821418 → 2026-11-04T19:43:38Z (5 h ahead)
```

So `real_utc = _datetime - 18000`. Repeat calls advanced `_datetime` by 30–40 s while
Bid/Ask moved (`GO100OZ` 4,057.6 → 4,056.3, `SL100OZ` 52.257 → 52.272), which is the proof
the feed is live rather than a daily file. Two rows in the same response can carry different
`_datetime` values (`TOLAGOLD` lags the metals board by ~1 min) — **freshness is per row,
not per response**.

---

## 6. Feasibility verdict — one page

**Verdict: yes — the Command strip's gold and silver cards can be sourced locally from
PMEX with no key, no token and no browser, via
`POST https://dportal.pmex.com.pk/MWatchNew/Home/GetJSONObject` with `{"status":"Active"}`
(**200**, 38 KB, 80 rows), which returns PKR/tola gold directly and USD/oz silver for a
single `× 0.375 × USD_PKR` conversion.**

| Question | Answer | Evidence (fetched this beat) |
|---|---|---|
| Keyless? | **Yes.** No auth header, no cookie, no referer. A bare POST returned 200. | `POST …/GetJSONObject` → **200**, 38,068 B |
| Is the public site usable? | **No.** Cloudflare challenge on every path of `www.` and apex, including `robots.txt`. | `https://www.pmex.com.pk/` → **403** `cf-mitigated: challenge` |
| Is the data real-time-ish? | **Yes, per-row.** `_datetime` advances between calls; Bid/Ask move. Grid upstream refresh = 3 s (`setInterval(…, 3000)` in the page). | two calls 40 s apart: `GO100OZ` 4,057.6 → 4,056.3 |
| Latency from a mobile-class client? | **~1.0 s steady**, 1.5–6.0 s cold (first call after idle). | timings: 0.97 / 1.00 / 1.01 / 1.04 / 1.20 / 1.53 / 5.84 / 6.02 s |
| Rate-limit risk? | **Low, but unstated.** 6 back-to-back POSTs (plus 3 earlier) all **200**, no `429`, no `Retry-After`. No published policy exists, so treat it as courtesy-limited. | burst 6/6 → 200 |
| Bandwidth | **38 KB uncompressed per poll** (`Cache-Control: private`, no gzip, no ETag) — for a 3 s poll that is ~12.7 KB/s. Poll on foreground refresh only. | response headers, `Content-Length: 38101` |
| Payload cost to parse | Trivial: flat array of 80 objects, stable key set, one `Category` field to filter on. | sample in §2.1 |
| Works in the web mirror? | **No.** No `Access-Control-Allow-Origin` → browser fetch is blocked. Native only. | response headers (no CORS) |
| Fragility | It is an undocumented route on a back-office portal (`dportal`), not a published API. Path is version-suffixed (`/MWatchNew/`) and sibling routes are already dead (`/mwatch` → **500**, `/MWatchNew/Home/GetClosingQuotes` → **404**). Needs a runtime gate and a labelled fallback. | those three status codes above |
| Missing pieces | No PKR/USD contract, no PKR silver contract, `TOLAGOLD` last-price is `"0"` with a 2.2% spread, `_datetime` is +5 h. | §3, §4, §5 |

### What that means for the Command strip

- **Gold card:** read `TOLAGOLD-<today's weekday>` **midpoint** → label "PKR per tola";
  show the USD/oz line from `GO100OZ` as the second row; freshness from the row's own
  `_datetime − 18000`.
- **Silver card:** `SL100OZ` bid × 0.375 × `PKR=X` (already fetched by the fusion strip) →
  PKR/tola. Label it *derived*, because PMEX does not quote silver in PKR.
- **Brent card:** `BRENT10-JA27` bid — USD/bbl, same shape as the existing `BZ=F` card.
- **Polling:** once per screen focus plus a manual refresh, not the exchange's 3 s cadence;
  cache 60 s. 38 KB per poll is acceptable, 38 KB every 3 s is not.
- **Contract expiry is in the code** (`-DE26`, `-JA27`): a new month silently appears as a
  new row, so select by prefix (`TOLAGOLD-`, `GO100OZ-`, `SL100OZ-`) and prefer the row with
  the freshest `_datetime`, never by hardcoded month suffix.
- **Do not** ship `Last_Price` for the tola contract (it is `"0"`), and do not ship any row
  whose Bid and Ask are both 0.

---

## 7. Evidence table

| Finding | Source | Status |
|---|---|---|
| Public site fully challenge-gated (all paths, both schemes) | `https://www.pmex.com.pk/`, `/robots.txt`, `/sitemap.xml`, `https://pmex.com.pk/` | 403 ×5, `cf-mitigated: challenge` |
| Market-watch app lives on an ungated portal host | `https://dportal.pmex.com.pk/mwatchnew` | 200 / 226,858 B |
| Board endpoint, POST-only, keyless, 80 live rows | `https://dportal.pmex.com.pk/MWatchNew/Home/GetJSONObject` | 200 / 38,068 B |
| All-contracts payload, 144 rows | same, body `{"status":"Inactive"}` | 200 / 65,735 B |
| Route is POST-only | same, GET | 404 |
| Per-symbol ladder returns `[]` with an empty selector | `…/Home/GetJSONObject1` | 200 / `[]` |
| No closing-quote endpoint | `…/Home/GetClosingQuotes` | 404 |
| Legacy route dead | `https://dportal.pmex.com.pk/mwatch` | 500 |
| Trading host is a MetaQuotes terminal, not a quote API | `https://webtrade.pmex.com.pk/` | 200 (SPA) |
| Gold USD/oz unit | `https://api.gold-api.com/price/XAU` = 4,048.5 | 200 |
| Silver USD/oz unit | `https://api.gold-api.com/price/XAG` = 52.366 | 200 |
| Published USD/PKR for the implied-rate check | `https://open.er-api.com/v6/latest/USD` = 276.5278 | 200 |
| Yahoo blocked from this host (unchanged from prior beats) | `query1.finance.yahoo.com/v8/finance/chart/GC=F`, `/PKR=X` | 429 ×2 |

---

## 8. Acceptance criteria (for the future build)

- [ ] Gold card renders PKR/tola from `TOLAGOLD-*` midpoint, with the USD/oz line beneath.
- [ ] Silver card shows a PKR/tola figure explicitly labelled *derived* (USD/oz × 0.375 × FX).
- [ ] Every card carries a freshness label built from `_datetime − 18000`, not from wall clock.
- [ ] Selection is prefix-based; no hardcoded `-DE26` / `-JA27` month suffix anywhere.
- [ ] A dead endpoint degrades to a labelled `No data` chip — the strip never blanks and
      never shows a stale quote as live.
- [ ] Poll on focus / manual refresh with a 60 s cache; no 3 s loop.
- [ ] Red-line pass: zero directional or transactional wording in the new code and copy —
      the banned-token grep stays empty; every commodity card is value + delta + freshness,
      nothing else.
