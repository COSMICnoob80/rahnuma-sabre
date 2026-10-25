# SPINE — RAHNUMA SABRE

**Purpose:** single source of truth to resume work cold. Read this first in any new session.

- Updated: 2026-10-11
- Repo: `github.com/COSMICnoob80/rahnuma-sabre` (public) @ `e06aaa6`, synced
- App: Offline-first, Urdu-friendly personal finance advisor for PSX investors
- Stack: React Native / Expo, TypeScript, SQLite, expo-secure-store
- Budget: $0/mo. Machine: Linux, **no sudo**

---

## 📊 CURRENT STATE (2026-10-11)

### Verdict: **BETA-READY** — functional core, generic shell → design system now in place

### What's Working
- ✅ Dashboard (net worth, savings rate, portfolio P&L, FIRE progress)
- ✅ Portfolio (add/delete holdings, sector allocation, price refresh, freshness)
- ✅ Budget (income + expenses by category and month)
- ✅ Calculators (CGT, SIP, asset ROI, PKR devaluation, FIRE) — unit tested
- ✅ Advisory chat (6 personas, Auto routing, Council debate) — **inert without API key**
- ✅ PIN lock (SecureStore-backed, throttled)
- ✅ Data export (JSON)
- ✅ Offline-first (SQLite on-device, no backend, no login)
- ✅ **49/49 tests pass**, TypeScript strict clean

### What's Not Ready
- ❌ Advisory chat is **inert** — needs a free AI key (Gemini or Groq)
- ❌ Urdu support is **partial** — persona prompts instruct Urdu, but no UI strings or i18n files
- ❌ README promises "Scenario Simulator" — not implemented
- ❌ No onboarding flow for first-time users
- ❌ APK not rebuilt after persona rework + design system changes

### Studio Team (created 2026-10-11)
- **AGENTS.md:** Router to 6 specialist personas + preserves original product agent spec
- **agents/:** Director, Product Auditor, UX Reviewer, Competitive Analyst, Compliance Officer, QA
- **audit_report.md:** BETA-READY verdict, feature scorecard, red-lines check
- **competitive_analysis.md:** DEFENSIBLE verdict — owns offline/Urdu/no-advice gap
- **AUDIT-SUMMARY.md:** 2-minute brutally honest summary (functional core, generic shell)
- **UI-DESIGN-SYSTEM.md:** Design system implementation summary
- **docs/API-LANDSCAPE.md:** PSX data sources (pyPSX, Sarmaaya, Capital Stake)

### Design System (implemented 2026-10-11)
- `src/theme/colors.ts` — brand palette + semantic colors
- `src/theme/spacing.ts` — 4pt grid + border-radius tokens
- `src/theme/typography.ts` — 6-step type scale
- `src/components/` — Card, Button, Input, Chip, EmptyState, LoadingState
- 3 screens updated: Dashboard, Portfolio, Budget
- Emoji tab icons → SVG vector icons
- Loading states added

### Advisory Council (reworked 2026-10-11)
- **Real named investors:** Warren Buffett, Peter Lynch, Ray Dalio, Jim Simons, Michael Burry, Charlie Munger, R.F. Habib
- **Plus:** Pakistani Street (local mechanics), Rahnuma (default)
- **Safety guardrails:** BASE_RULES (no buy/sell), enforceNoDirective(), disclaimer on every response
- **Council debate:** Buffett + Munger + Burry

### Competitive Position
- **Moat:** offline-first + Urdu + no-advice (structural, not feature-based)
- **Incumbents:** Nuffa (Ticker Analyst), FinClub, PSX Terminal, Finqalab, Smarter PSX
- **Threat:** irrelevance, not a competitor
- **Differentiation:** "Your data never leaves your phone, in your language, and we will never tell you what to buy"

### Data Sources
- **Current:** Yahoo Finance `.KAR` endpoint (undocumented, indicative, unlicensed)
- **Recommended:** pyPSX (free, no key, 10yr OHLCV) — drop-in replacement
- **Production:** Sarmaaya (PSX-authorized) or Capital Stake (commercial API)
- **Mutual fund NAVs:** No clean API exists — potential moat if scraped/normalized

---

## 📋 NEXT STEPS (priority order)

1. **Add a free AI key** (Groq llama-3.3-70b-versatile or Gemini) → advisory chat works
2. **Rebuild APK** → install on phone → test advisory chat + new UI
3. **Decide Urdu scope** → either ship real Urdu UI strings or soften "Urdu-first" claim
4. **Build or remove Scenario Simulator promise**
5. **Beta launch** → 5-10 real PSX investors (r/pakistan, personal network)
6. **UI design pass** → minimal and beautiful like Finqalab (user's target)

---

## 🔴 RED LINES

- **No buy/sell advice** — the LLM never says "buy" or "sell"
- **Every response prefixed:** "Information only, not investment advice"
- **No specific-ticker recommendations**
- **No return promises**
- **Not a SECP-registered advisor** — must not present as one
- **Offline-first is the moat** — do not dilute to chase competitor features

- [brief-ui] BriefingScreen + route + dashboard entry landed — tsc clean — commit "briefing screen: Panic Day Briefing UI per harvest pattern"

- [brief-engine] briefing.ts + tests landed, 57 tests pass, tsc clean — 4daacd3

## Beat: Panic Day Briefing (2026-10-21) — LANDED

- WHY charter (docs/WHY.md) + Finqalab UI pattern harvest (docs/HARVEST-FINQALAB-UI.md, channel 2 public docs) committed (4251a0a).
- Soldier BRIEF-ENGINE (90f2d59): src/utils/briefing.ts + 8 tests — pure math, no advisory fields.
- Soldier BRIEF-UI (72d714f): BriefingScreen + native-stack route + dashboard "Morning briefing" entry.
- Parent verified: 57/57 tests, tsc clean, red-line grep clean, SPINE checkpoints committed by both soldiers.
- HTML artifact: design/panic-briefing.html (OpenDesign run 489b76ff, self-contained).
- Soldier models: all execution tiers on deepseek-v4.1-flash (verified in run logs).
- NEXT: APK rebuild → install on phone → beta post to r/FIREPakistan.

- [apk-forge] preview APK: FINISHED — /home/cosmicnoob/Downloads/rahnuma-sabre-preview.apk (66,959,054 bytes / 64M) + https://expo.dev/accounts/cosmicnoob80/projects/rahnuma-sabre/builds/6267aadf-7ce0-45f8-a11d-a79b20245b2f — buildId 6267aadf-7ce0-45f8-a11d-a79b20245b2f — no code fix, no commit

- [gradle-forge] local native build: release r2 v2 — /home/cosmicnoob/Downloads/releases/rahnuma-sabre-r2-local-v2.apk — sha256 35ec4980 — this commit

- [ui-facelift] 4 legacy screens ported to design system; insets + statusbar done; hex count Advisory:22→0 Calculators:38→0 Settings:21→0 PinLock:10→0 — this commit
- [brand-icon] deterministic generator scripts/generate_brand.py → assets/icon.png 1024x1024 (pre-rounded), adaptive-icon.png 1024x1024 (transparent, 66% safe zone), splash-icon.png 1024x1024, favicon.png 48x48 — emerald #3add9e + mist #e7ecf0 on #05090d (colors.background/textPrimary), geometric ڕ monogram (Nastaliq ر is a 24x36 hairline at 400pt, illegible at 48px), app.json splash/adaptive bg → #05090d — this commit

- [gradle-forge] r3 v3 local native build: release — ~/Downloads/releases/rahnuma-sabre-r3-local-v3.apk (66,887,882 bytes) — sha256 1cb7563a… — versionCode 2→3, prebuild re-emitted brand mipmaps/splash + #0a1628→#05090d in colors.xml/styles.xml — BUILD SUCCESSFUL in 1m 22s (83s, vs r2 cold-cache) — r1/r2 backups re-verified unchanged — this commit

- [import-positions] assets table+migration idempotent, statement import v1 (bank csv + FBR wealth), advisory personal-key prefill path — commit
- [import-positions] FOLLOW-UP: imported `assets` rows are not yet part of Dashboard net worth — DashboardScreen is owned by the outlook lane, so merging `getAssets()` into the net-worth total is a separate beat.

- [outlook-live] globalMarkets.ts + OutlookScreen + live probe evidences — providers verified: Yahoo chart `^GSPC` HTTP 200 symbol=/price=/prevClose=/changePct= (see tests/aux/probe-providers.mjs); HTML symbol pages 200 for `^IXIC`, `GC=F`, `BZ=F`, `PKR=X`; stooq CSV HTTP 404 (endpoint moved / anti-bot) so it stays runtime-gated and never used unverified; `KSE100.KAR` and `XAUEUR=X` both 404 → national KSE-100 renders a labelled degraded quote, gold ships as verified `GC=F` (Gold XAU, USD quoted) — 89/89 tests, tsc clean, grep gate 1 hit = pinned closing line only — commit

- [psx-national] national KSE-100 source resolved empirically (2026-10-25). Probes from this host: `dps.psx.com.pk/timeseries/eod|int|interrupt/KSE100` → 404 SPA shell bare, **403 with XHR headers** (WAF-gated) — JSON timeseries route ruled out; `dps.psx.com.pk/post/display/market-watch`, `/papx` → 404; `www.psx.com.pk/psx/market-data/market-summary` → 504; Yahoo `KSE100.KSE` / `.KA` / `.KAR` and `^GSPC` → **429 all** (host family rate-limited, confirms General's 7 probes); `dps.psx.com.pk/indices` → **200 text/html, 56,324 B** with server-rendered table → **PROVIDER-1**. Live parse immediately pre-commit: KSE-100 `162374.87`, `-0.95%` (published "As of Oct 23, 2026 4:50 PM"; high 163966.86 / low 162292.44, change −1549.44). Equity path likewise: `dps.psx.com.pk/company/{SYM}` 200 for OGDC/HBL/ENGRO/LUCK/PSO/SYS/MEBL/FFC, 500 for a bogus symbol → parsed live OGDC 298.12 / −0.79%. Code: `globalMarkets.ts` gains `parseDpsIndexRow` (anchors the row's own `data-code`, five `data-order` cells High/Low/Current/Change/%Change) + `parseDpsCompanyQuote` (`quote__close`, sign from `change__text--pos/neg` because positives print an unsigned percent) + national ladder `psx_dps_indices → yahoo_national_suffix (.KSE/.KA/.KAR, winner memoized per session) → cache(24h) → labelled no-data`; `psxService.ts` appends `fetchDpsCompanyPrice` after its existing Yahoo hosts (additive, no host removed). Contract exports unchanged; `outlookDegradedSymbols` extracted so the degraded flag is testable. 97/97 tests (8 new, fixtures = verbatim captured bodies), tsc clean, red-line grep = only pre-existing pinned disclaimer/guardrail lines. No push. **Caveat: this box's IP path is 429-blocked at Yahoo; the r4 phone ride on mobile data is the real validator for both Yahoo and DPS reachability.** — commit

- [forge-r4] local release v4 — sha256 07720da7667e — versionCode 4 verified — leak-gate 0 — BUILD SUCCESSFUL in 1m 45s (42 executed / 343 up-to-date), APK 66,924,174 B, ~/Downloads/releases/rahnuma-sabre-r4-local-v4.apk + latest pointer rotated; versionCode 4 confirmed on artifact by both `aapt dump badging` and `apkanalyzer manifest version-code`; personal key inlined into assets/index.android.bundle (1 occurrence) with 0 source-tree leaks; r1/r2/r3 shas re-verified unchanged before and after — this commit

- [web-mirror] export succeeded — first attempt failed `Unable to resolve module ./wa-sqlite/wa-sqlite.wasm` (file EXISTS at 617,652 B; `.wasm` absent from Metro default assetExts) → root `metro.config.js` pushes `wasm` onto assetExts, no install/no src change — then `npx expo export --platform web` = 620 modules, 2 bundles (1.03 MB + 132 kB) + wa-sqlite.wasm 618 kB, 17 files/2.0 MB to `/home/cosmicnoob/.hermes/cache/scratch/rahnuma-web-export`; served via `python3 -m http.server 8777` → index.html 200/1219 B, bundle 200/1,029,211 B; Chromium on the export boots the real PinLock screen ("RAHNUMA / SABRE / CREATE 4-DIGIT PIN"), no error page, 0 console errors — but PIN create rejects `n.default.setValueWithKeyAsync is not a function` (expo-secure-store web impl is `export default {}`), so no screen past the lock is reachable on web → next beat needs a web secure-store adapter (SQLite web path bundles fine) — commit

- [web-flow] preview storage adapter — chat preview now gets past the PIN on web (2026-10-25). Root cause (from [web-mirror] above): `expo-secure-store`'s web build is `export default {}`, so `setValueWithKeyAsync` is undefined in the browser. Fix: `src/utils/webStorageCore.ts` (pure, RN-free: `StorageBackend`/`KeyValueStore`, `isWebPlatform`, `createMemoryBackend`, `toKeyValueStore`) + `src/utils/webStorageAdapter.ts` (only file allowed to touch `localStorage`; wraps the `Storage` object so detached calls don't throw `Illegal invocation`, memory fallback when storage is blocked, delegates to `SecureStore` only when `Platform.OS !== 'web'`). `secureStorage.ts` + `pinLock.ts` move their 8 call sites to `platformStore` — exported signatures and every hash/throttle/keystore rule unchanged; native path identical. `PinLockScreen` renders an amber `colors.warning`/`warningTint` web-only banner, copy verbatim: "Web preview mode — data lives in this browser tab's storage only. Not your phone, not production." Evidence: tsc clean, **101/101 tests** (4 new: memory semantics, async KV contract, blocked-backend tolerance, platform selector), grep gate `localStorage` outside the adapter = 0, export 622 modules (1.03 MB bundle) → `~/.hermes/cache/scratch/rahnuma-web-export`, served 8779: index 200 with `div id="root"`=1, bundle 200/1,030,799 B; Chromium run: banner → create PIN 1234 → Dashboard → Advisory chip "personal build key active" resolves → reload → Enter PIN (persisted) → unlock → 0 console errors. Trade-off, visible in-app: preview stores PIN hash + provider keys in this tab's browser storage; the phone path still uses the OS keystore. No push. — this commit

- [brand-r5] true-black hero logo — founder approved the 512px variant and it is now the real icon set (2026-10-25). `scripts/generate_brand.py` fully rewritten: the compass/ڕ monogram is gone, replaced by the board's own master-SVG geometry from `design/brand-logo.html` panel 01/05, authored in 512-space and scaled x2 into the 1024 render space so every number is traceable — `BG #000000` (pure), `PAPER #e7ecf0` (the R, `colors.textPrimary`), `ACCENT #3add9e` (ticker), Times-class serif capital R at `R_SIZE_512 = round(R_RATIO*512)` = 389 with `text-anchor=middle` at (256, 387), ascending six-point ticker `M41 440 L133 379 L205 399 L297 276 L379 215 L451 123` at stroke 12 / 9% line + r28 glow / 16% + r12 end dot / 28%, 22% pre-rounded full-bleed ground. Typeface resolves from an explicit ordered candidate list, never a system default: `LiberationSerif-Regular.ttf` (metric-compatible with Times New Roman — the board's ink width lands at 495/1024 = 0.637em exactly), and the script hard-fails if no candidate exists so the bytes never drift. No emerald hairline on the icon: row 01 (the approved hero) has none — the hairline exists only on row 03's ink-ground variant. Proof it is the approved artwork, not an approximation: headless-Chrome raster of the board's own master SVG at 1024 vs `assets/icon.png` = **mean abs diff 0.11/255, 67 px > 32 (0.006%), R ink bbox identical at x 275–769 / y 265–773**. Adaptive foreground is now fitted from the rendered alpha bbox instead of the old hardcoded 373-unit extent → 66.3% × 52.5% of canvas, centred (inside the 66% safe zone). Favicon 48px ships the board's row-04 compensation (+0.3px paper stroke) because Times hairlines pixel-thin at notification size — R reads with its serifs intact, 246 paper px of 2304, ticker lands ~1px as the board predicts. Determinism, two consecutive runs byte-identical AND unchanged by the ratio-constant refactor: `icon.png` 54,173 B 55d29540…, `adaptive-icon.png` 43,024 B 0180fb70…, `splash-icon.png` 43,024 B 0180fb70…, `favicon.png` 1,952 B 716b54b5…. `app.json`: `android.adaptiveIcon.backgroundColor` `#05090d` → `#000000` (the icon's ground is true black now); `splash.backgroundColor` deliberately kept `#05090d` because the splash hands off to the app's ink body and flipping it would seam on every cold start. 101/101 tests, tsc clean — this commit

- [forge-r5] local release v5 — sha256 7964125d8866 — versionCode 5 verified — first rung carrying the true-black hero icon — BUILD SUCCESSFUL in 1m 22s (83s wall, 47 executed / 338 up-to-date), APK 66,807,126 B → `~/Downloads/releases/rahnuma-sabre-r5-local-v5.apk` + `~/Downloads/rahnuma-sabre-latest.apk` rotated (pointer = r5); `assets/index.android.bundle` present at 1,658,528 B; versionCode 5 confirmed on the artifact by both `aapt dump badging` and `apkanalyzer manifest version-code`; signer cert SHA-256 638b05a8… — identical to r4's signer (CN=Rahnuma SABRE, OU=Preview), so r5 installs as an in-place upgrade; ladder re-verified before AND after rotation: r1 d00f5705… / r2 35ec4980… / r3 1cb7563a… / r4 07720da7… all byte-unchanged, no old rung touched. The brand is packaged, not just on disk: the adaptive-icon XML background resolves to `color/iconBackground` = 0xff000000 (pure black, was 0xff05090d), foreground xxxhdpi (432×432) is a fully transparent ground with 9,559 paper px and 0 opaque-black px, and the round icon xxxhdpi (192×192) is a 78.4% opaque pure-black ground under the R. Prebuild preserved the hand-added release signing block (`hasReleaseKeystore` in android/app/build.gradle) and `debug.keystore` sha, so no silent fallback to debug signing; `sdk.dir` re-asserted = /home/cosmicnoob/Android/sdk; prebuild's only side effect beyond the icon (package.json `android`/`ios` → `expo run:*`) reverted. No push. — this commit
