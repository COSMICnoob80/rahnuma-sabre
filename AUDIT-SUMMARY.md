# Rahnuma Sabre — Audit Summary

**Date:** 2026-10-11 | **Auditor:** Product Auditor | **Read time:** 2 minutes

---

## Verdict: Functional core, generic shell. Not production-level. Not a paper tiger either.

The app is neither as broken as "paper tiger" implies nor as polished as "production-level" demands. It has a genuinely solid backend (SQLite, PIN lock, LLM provider fallback, CGT tax logic) wrapped in a UI that looks like it was styled in an afternoon with hardcoded hex colors and emoji icons.

---

## 1. UI Quality — Ad-hoc, not designed

**No design system.** Every screen defines its own `StyleSheet` with the same four hex values copy-pasted: `#0a1628` (bg), `#1e293b` (card), `#334155` (input), `#3b82f6` (accent). There is no shared theme file, no `colors.ts`, no `spacing.ts`, no typography scale. Change the brand color and you'll be doing a project-wide find-replace.

**Tab bar uses emoji.** 📊 📈 💰 🧮 💬 ⚙️ — not SVG icons, not a vector set. Emoji render differently across Android OEM skins and iOS versions. This alone signals "not production" to any r/pakistan user who has seen a real fintech app.

**No component library.** Cards, inputs, buttons, chips — every screen reinvents them inline. `Card` appears in Dashboard, Portfolio, Budget, Calculators, Settings with slightly different padding each time. There is no shared `<Card>`, no `<Button>`, no `<Input>`.

**Dark mode only.** No light mode. No system theme detection. This is a design choice, but it's undocumented and untested.

---

## 2. Loading / Error / Empty States

| State | Status | Details |
|---|---|---|
| **Loading** | Partial | AdvisoryScreen has `loading` + `loadingLabel` ("Rahnuma is thinking..."). Dashboard/Portfolio/Budget have `RefreshControl` pull-to-refresh. But no skeleton screens, no spinner on initial load — data just appears when `useFocusEffect` resolves. |
| **Error** | Weak | AdvisoryScreen catches errors and pushes them as chat messages. PortfolioScreen's `handleRefreshPrices` shows an Alert on completion. But DB failures, network failures on price fetch, and LLM timeouts are either swallowed silently or surfaced as generic Alerts. No error boundary. No retry button. |
| **Empty** | Minimal | PortfolioScreen: "No holdings yet. Add your first stock!" — that's the only real empty state. BudgetScreen shows nothing when empty. Dashboard shows zeros with no guidance. SettingsScreen has no empty concept. CalculatorsScreen is all inputs, no results = no feedback. |

---

## 3. Navigation — Functional but flat

**6 tabs, no hierarchy.** Dashboard, Portfolio, Budget, Calculators, Advisory, Settings — all at the same level. For a financial app, this is too flat. Where's the drill-down? Dashboard → tap a holding → see its detail? Doesn't exist. Budget → tap a category → see transactions? Doesn't exist.

**Quick Links on Dashboard are redundant.** Dashboard has "Quick Links" that navigate to Portfolio, Budget, Calculators — all already in the tab bar. Dead UI weight.

**No onboarding.** A first-time user opens the app and sees a dashboard with zeros, no explanation of what to do, and no setup flow. The PIN screen appears on first launch (create mode), but there's no welcome, no feature tour, no "add your first holding" guidance.

**No deep linking, no back stack management.** Standard React Navigation defaults.

---

## 4. What's Broken or Missing

### Broken / Non-functional
- **Advisory chat is inert without an API key.** The app's headline feature does nothing out of the box. `providerReady === false` shows a static "go add a key" screen. This is the single biggest gap.
- **No scenario simulator.** README promises it. Not implemented.
- **No document scanner (OCR).** In SPEC. Not implemented.
- **No daily briefing.** In SPEC (n8n). Not implemented.
- **Urdu is a lie.** Persona prompts say "reply in Urdu" but there are zero Urdu UI strings, no RTL layout support, no i18n framework. "Urdu-first" is a prompt instruction, not a product feature.

### Missing (should exist for production)
- No onboarding flow
- No skeleton/loading screens
- No error boundary
- No empty states on most screens
- No data import (only export)
- No data wipe / reset
- No haptic feedback
- No animations (screen transitions, button presses, list item entrance)
- No accessibility labels (`accessibilityLabel`, `accessibilityRole` — none found)
- No analytics or crash reporting
- No app icon / splash screen customization (defaults)
- No landscape support
- No tablet layout

### Bugs / Code Smells
- **Dashboard `month` is captured at render time** (line 21) — if the app stays open past midnight, the dashboard shows the wrong month until remount.
- **`useFocusEffect` + `useCallback` pattern** is correct but the `month` dependency in Dashboard means the callback identity changes every render where `now` changes — minor, but it's a stale-waiting-to-happen.
- **PIN lock uses djb2 hash** (line 16 of `pinLock.ts`) — a non-cryptographic hash for a PIN. Fine for a 4-digit PIN with SecureStore, but worth noting it's not bcrypt/argon2.
- **`secureStorage.ts` has legacy compatibility shims** (`getApiKey`, `setApiKey`, `getApiModel`, `setApiModel`) — dead code for screens "not yet migrated."
- **`dataService.ts` export** uses `expo-file-system` `File` + `writableStream` — this API is from SDK 53+ and may crash on older Expo Go versions. Untested.
- **Working tree is dirty** — 11 deleted screenshot files, modified AGENTS.md, untracked `.commandcode/`, `.handoff/`, stray PNG.

---

## 5. The Gap: "Paper Tiger" vs "Production-Level"

| Dimension | Paper Tiger (accusation) | Current State | Production-Level (target) |
|---|---|---|---|
| **Core logic** | Fake/broken | Real — SQLite, tax math, LLM fallback, PIN lock all work | Same |
| **UI design** | Generic template | Custom but ad-hoc — no system, no components, emoji icons | Design system, vector icons, consistent spacing |
| **States** | Nothing works | Loading partial, error weak, empty minimal | Full skeleton/error/empty on every screen |
| **Onboarding** | None | None | Guided setup flow |
| **Polish** | Broken | Functional but rough — no animation, no haptics, no a11y | Polished micro-interactions, accessible |
| **Urdu** | Claimed, absent | Claimed, absent (prompt-only) | Real Urdu UI or removed claim |
| **Advisory** | Inert | Inert without key | Works out of the box with a free key pre-configured |
| **Code quality** | Messy | Clean architecture, but legacy shims and dead code | No dead code, no compat shims |

---

## Bottom Line

**The engine is real. The bodywork is amateur.**

Rahnuma's backend — offline persistence, tax calculation, multi-provider LLM fallback with caching, PIN lock with throttle — is genuinely well-built. The safety guardrails (no buy/sell advice, disclaimers) are wired into the send path, not just documented. 49/49 tests pass.

But the UI is where it falls apart. No design system, no shared components, emoji icons, no loading skeletons, no error boundary, no onboarding, no accessibility, no animations. The headline feature (advisory chat) does nothing without a user-supplied API key. Urdu support is a fiction.

**To go from "functional beta" to "production-level, r/pakistan-worthy":**

1. Ship a free-tier API key pre-configured (or bundle one) — the advisory must work on first launch.
2. Build a real design system: theme file, shared components (Card, Button, Input, Chip), vector tab icons.
3. Add skeleton loaders, proper error states with retry, and empty states on every screen.
4. Build an onboarding flow — welcome → PIN → add first holding → see dashboard.
5. Either ship real Urdu UI strings or remove the "Urdu-first" claim.
6. Clean the working tree and remove dead code.

The foundation is strong enough that these are execution tasks, not architecture rewrites. But until they're done, this is a well-engineered app wearing a generic costume.
