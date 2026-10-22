# RAHNUMA SABRE — Project State

**Last updated:** 2026-10-22
**Repo:** https://github.com/COSMICnoob80/rahnuma-sabre
**Branch:** master

Read this first when picking the project back up. It is the single source of truth for
"where was I".

App = Brahma-apt: brief engine + briefing screen live; preview APK built from f37eaf4.

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
| Advisory chat (9 voices — 7 named investors + Pakistani Street + Rahnuma default; Auto routing, Council debate) | Working, needs a provider key |
| Panic Day Briefing (quote + freshness, this month's investable amount from budget, fixed-purchase arithmetic, streak) | Working — facts only, no advisory output |
| PIN lock (SecureStore-backed, throttled) | Working |
| Data export (JSON) | Working |
| Preview APK (EAS `preview` profile, build f37eaf4) | Built, not yet tested on a phone |
| Backend / accounts / sync | Not built, and deliberately deferred |

## What does NOT work yet

- No backend. All data is on-device in SQLite. There is no login, no sync, no multi-device.
- **Bilingual UI chrome is not implemented.** The app chrome is English only: no Urdu
  Nastaliq strings, no Roman Urdu strings, no i18n files, no RTL layout. Persona answers
  already come back in Urdu or Roman Urdu when the user writes in one — that is the model,
  not the UI.
- **Global markets (international stocks, bonds, commodities, FX) are not built.** No live
  non-PSX data, and no attributed narrative outlook. The share-harvest pattern for it is
  specified but unbuilt. Worth noting: none of the local PSX competitors offer this in Urdu.
- **README's Scenario Simulator is still unbuilt.** The calculators do single-variable
  "what if" maths; there is no scenario simulator screen. README has been corrected to list
  it as roadmap.
- **On-device offline model is not built.** Gemma is specified in Principle XVI but absent;
  without a provider key and without internet, advisory chat is inert.
- Prices come from an undocumented Yahoo Finance endpoint for `.KAR` tickers. Indicative,
  end-of-day, and unlicensed. See `docs/DATA-SOURCES.md`.
- RAG / knowledge base and MCP servers (AGENTS.md Phase 2–3) are not built.
- No onboarding flow for first-time users.

---

## How to run

```bash
npm start          # Expo dev server
npm test           # 57 unit tests, no test dependencies (Node's built-in runner)
npm run ts:check   # TypeScript, strict — clean
```

To make the advisory chat answer, add at least one key in **Settings → AI Providers**.
Gemini and Groq both have free tiers, so a beta costs nothing to serve.

To build: `npx eas build --platform android --profile preview --non-interactive`, or locally
`npx expo prebuild --platform android` then `./gradlew assembleRelease` in `android/`.

---

## Architecture map

```
src/
  navigation/
    AppNavigator.tsx  Native stack: Tabs + Briefing route ("Morning briefing")
  screens/        Dashboard, Briefing, Portfolio, Budget, Calculators, Advisory, Settings, PinLock
  services/
    providers.ts      Provider catalogue (Gemini, Groq, OpenRouter) + models
    llmAdapters.ts    Pure request/response shaping (unit tested)
    llmService.ts     Provider fallback chain + response cache
    personaService.ts 9 personas, deterministic router, council debate, buy/sell guard
    priceFreshness.ts Quote staleness labelling (pure, unit tested)
    psxService.ts     Price fetch with fallback host
    dataService.ts    JSON export
  database/db.ts  SQLite schema + queries
  theme/          Colors, 4pt spacing scale, typography scale
  components/     Card, Button, Input, Chip, EmptyState, LoadingState
  utils/
    calculators.ts  All financial math (unit tested)
    briefing.ts     Panic Day Briefing math — pure, no advisory fields (unit tested)
    secureStorage.ts API keys per provider (SecureStore)
    pinLock.ts      PIN storage + attempt throttling
tests/            Node built-in test runner (briefing, calculators, persona, psxService)
docs/             WHY (charter), TAX-RULES, SECP-POSTURE, DATA-SOURCES, API-LANDSCAPE, BETA-LAUNCH-POST
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

1. **Phone test** the preview APK (f37eaf4): briefing screen, advisory chat with a free key,
   PIN lock, export.
2. **Closed beta to r/FIREPakistan** — log retention and query frequency.
3. **Bilingual chrome pass** — English + Urdu Nastaliq + Roman Urdu strings, RTL layout.
4. **Persona narration on the briefing** — let a persona explain the already-computed facts
   in the user's language, still with zero directional claims.
5. **Global outlook harvest build** — international stocks, bonds, commodities, FX with
   attributed narrative outlook, in Urdu.
6. Only then: backend for accounts/sync, if retention data justifies it.
