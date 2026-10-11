# Product Audit — Rahnuma Sabre

**Auditor:** Product Auditor persona
**Date:** 2026-10-11
**Method:** Read SPEC.md / STATE.md / README.md (the claims), then read `src/` (the truth), then ran the test suite.

---

## Verdict: **BETA-READY** — the core is real and the safety guardrails are genuinely well-built, but the working tree is dirty and the advisory chat is inert without a key.

---

## Feature Scorecard

| Feature | Spec/README says | Code says | Verdict |
|---|---|---|---|
| Dashboard (net worth, savings, P&L, FIRE) | Working | `src/screens/DashboardScreen.tsx` present | **Working** |
| Portfolio (add/delete, allocation, freshness) | Working | `PortfolioScreen.tsx` + `priceFreshness.ts` | **Working** |
| Budget (income/expense by category/month) | Working | `BudgetScreen.tsx` present | **Working** |
| Calculators (CGT, SIP, ROI, FIRE) | Working, unit tested | `calculators.ts` + `calculators.test.ts` | **Working** ✅ |
| Advisory chat (6 personas, routing) | Working, needs provider key | `personaService.ts` + `llmService.ts` + `AdvisoryScreen.tsx` | **Working, inert** ⚠️ |
| PIN lock | Working, throttled | `pinLock.ts` + `PinLockScreen.tsx` | **Working** |
| Offline-first (SQLite on-device) | Core promise | `expo-sqlite` + `expo-secure-store` | **Working** ✅ |
| No backend / no login | Deliberate | No backend code found | **Confirmed** ✅ |
| Urdu support | "Urdu Support" | Persona prompts instruct Urdu; no i18n files | **Partial** ⚠️ |
| Scenario simulator | "What if I increase my SIP?" | Not found as a dedicated feature | **Missing** ❌ |
| Document scanner (OCR) | In SPEC | Not implemented | **Missing** (deferred) |
| Daily briefing | In SPEC (n8n) | Not implemented | **Missing** (deferred) |

## Test Suite

- **49/49 tests pass** (`npm test`) — confirmed by running it.
- TypeScript strict: not run here (Command Code quota-dead; can run in Hermes).

## Critical Gaps (block a *public* launch, not a beta)

1. **Advisory chat is inert.** It needs a provider key (Gemini/Groq free tier). Without a key the app's headline feature does nothing. **This is the #1 gap.**
2. **Working tree is dirty.** 11 deleted TEST RUNS screenshots, 1 modified AGENTS.md, untracked `.commandcode/`, `.handoff/`, and a stray `slash grill me skill.png`. Not presentable.
3. **Urdu is partial.** Personas are told to answer in Urdu, but there are no Urdu localisation files and no UI strings in Urdu. "Urdu-first" is currently a prompt instruction, not a product feature.

## Polish Gaps (visible but non-blocking)

- README promises "Scenario Simulator" — not implemented. Either build it or remove the promise.
- No onboarding flow for a first-time user.
- `package.json` missing `"type": "module"` (causes a Node warning on every test run).

## What Would Make This Production-Ready

1. **Add a free AI key** (Gemini or Groq) → advisory chat works. Biggest single win.
2. **Clean the working tree** → commit real changes, delete screenshot debris.
3. **Decide on Urdu** → either ship real Urdu UI strings or soften the "Urdu-first" claim to "Urdu-capable advisory responses."
4. **Build or remove the Scenario Simulator promise.**

## Red Lines Check

- ✅ No buy/sell advice — `BASE_RULES` in `personaService.ts:82` explicitly forbids it, and `enforceNoDirective()` (line 160) is a post-generation guard.
- ✅ Disclaimer present — `AdvisoryScreen.tsx:259` and `SettingsScreen.tsx:260`.
- ✅ No backend/login — confirmed.
- ✅ Offline persistence — SQLite + SecureStore confirmed.

**The safety architecture is genuinely strong.** This is not a polished-looking app with a broken core — the core is real and the guardrails are wired into the send path, not just documented.
