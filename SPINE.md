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
