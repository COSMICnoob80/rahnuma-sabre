# RAHNUMA SABRE — Project State

**Last updated:** 2026-09-23
**Repo:** https://github.com/COSMICnoob80/rahnuma-sabre
**Branch:** master

Read this first when picking the project back up. It is the single source of truth for
"where was I".

---

## What this is

An offline-first, Urdu-friendly personal financial advisor for Pakistani (PSX) retail
investors. It answers questions about your own portfolio, budget and goals, and never
tells you to buy or sell.

---

## What actually works today

| Area | State |
|---|---|
| Dashboard (net worth, savings rate, portfolio P&L, FIRE progress) | Working |
| Portfolio (add/delete holdings, sector allocation, price refresh, per-holding freshness) | Working |
| Budget (income + expenses by category and month) | Working |
| Calculators (CGT, SIP, asset ROI, PKR devaluation, FIRE) | Working, unit tested |
| Advisory chat (6 personas, Auto routing, Council debate) | Working, needs a provider key |
| PIN lock (SecureStore-backed, throttled) | Working |
| Data export (JSON) | Working |
| Backend / accounts / sync | Not built, and deliberately deferred |

## What does NOT work yet

- No backend. All data is on-device in SQLite. There is no login, no sync, no multi-device.
- Prices come from an undocumented Yahoo Finance endpoint for `.KAR` tickers. Indicative,
  end-of-day, and unlicensed. See `docs/DATA-SOURCES.md`.
- On-device offline model (Gemma) is specified in Principle XVI but not implemented.
- RAG / knowledge base, MCP servers, daily briefings (AGENTS.md Phase 2–3) are not built.
- No Urdu localisation files yet — the persona prompts instruct the model to answer in Urdu.

---

## How to run

```bash
npm start          # Expo dev server
npm test           # 49 unit tests, no test dependencies (Node's built-in runner)
npm run ts:check   # TypeScript, strict
```

To make the advisory chat answer, add at least one key in **Settings → AI Providers**.
Gemini and Groq both have free tiers, so a beta costs nothing to serve.

---

## Architecture map

```
src/
  screens/        Dashboard, Portfolio, Budget, Calculators, Advisory, Settings, PinLock
  services/
    providers.ts      Provider catalogue (Gemini, Groq, OpenRouter) + models
    llmAdapters.ts    Pure request/response shaping (unit tested)
    llmService.ts     Provider fallback chain + response cache
    personaService.ts Personas, deterministic router, buy/sell guard
    priceFreshness.ts Quote staleness labelling (pure, unit tested)
    psxService.ts     Price fetch with fallback host
    dataService.ts    JSON export
  database/db.ts  SQLite schema + queries
  utils/
    calculators.ts  All financial math (unit tested)
    secureStorage.ts API keys per provider (SecureStore)
    pinLock.ts      PIN storage + attempt throttling
tests/            Node built-in test runner
docs/             TAX-RULES, SECP-POSTURE, DATA-SOURCES, BETA-LAUNCH-POST
```

---

## Silent-wrong-answer bugs already fixed

Read this before trusting any number the app displays. None of these crashed; each returned a
plausible but incorrect number, and all were found by reading code rather than by testing.

- **CGT rewritten** to the Finance Act 2025 / NCCPL structure. It is now
  acquisition-date-driven: flat 15% for anything bought on/after 1 Jul 2024, progressive
  12.5% → 0% for Jul 2022 – Jun 2024, exempt before Jul 2013. The old code applied the
  pre-2024 slab from holding days alone and would have charged 0% on a six-year hold.
  `purchase_date` was added to holdings and is captured in the add-holding form.
- **PIN removal no longer bricks the app.** It used to write an empty `pin_hash` while
  `hasPin()` tested for non-null, leaving the app permanently locked. The PIN now lives in
  SecureStore with a 30-second lockout after five wrong attempts.
- **Savings rate** was comparing one month of spending against *all-time* income, inflating
  the rate and the FIRE monthly contribution roughly threefold for anyone with a few months
  logged. Dashboard and Advisory now use current-month income on both sides.
- **Record dates** were stamped with `toISOString()` (UTC) while month queries used a local
  month key. In PKT, entries made between midnight and 05:00 landed in the previous day, and
  on the 1st of a month, in the previous month. Now stamped with `todayLocal()`.
- **Cached advisory answers** reported whichever provider was preferred rather than the one
  that actually answered. The cache now stores the real provider.
- **Price freshness** parsed SQLite's space-separated `YYYY-MM-DD HH:MM:SS` as `NaN`, so every
  refreshed holding displayed "freshness unknown". Extracted to `priceFreshness.ts` and tested.
- **Dashboard FIRE progress** read a `savings` state variable that was never assigned, so it
  always rendered 0%. It now uses real net worth and honours the saved `fire_target`.

The pattern: financial maths and date handling are where this app is either right or quietly
wrong. Anything touching those needs a test before it ships.

## Cost model (why this runs at zero capital)

Every provider in the chain has a free tier, the user brings their own key, and the
router falls through on rate limits or failures. Repeat questions are served from a
24-hour on-device cache. Calculators and portfolio maths use no model calls at all.
See `docs/BETA-LAUNCH-POST.md` for how the first cohort is recruited.

---

## Next steps, in order

1. Add `docs/TAX-RULES.md` items into the UI as a visible "assumptions" line on the CGT card.
2. Ship a closed beta to r/FIREPakistan and log retention + query frequency.
3. Replace Yahoo with a licensed EOD data source once there is any funding.
4. Implement Urdu UI strings (the model already answers in Urdu; the chrome is English).
5. Only then: backend for accounts/sync, if retention data justifies it.
