---
id: 0007
title: Phone-test autopsia and facelift beat
stage: green
date_iso: "2026-10-22"
surface: agent
model: z-ai/glm-5.3-flash
feature: ui-facelift
branch: master
user: COSMICnoob80
command: "chat: APK looked 'broken and in chaos'; bank/FBR fetch idea; preview-width question"
labels: ["autopsy", "design-system", "app-icon", "account-aggregation", "red-team"]
links:
  spec: "docs/WHY.md"
  ticket: null
  adr: null
  pr: null
files:
  - src/screens/AdvisoryScreen.tsx
  - src/screens/CalculatorsScreen.tsx
  - src/screens/SettingsScreen.tsx
  - src/screens/PinLockScreen.tsx
  - src/navigation/AppNavigator.tsx
  - scripts/generate_brand.py
tests:
  - npm test (57 checks) + tsc gates ordered inside both work orders
---

## PROMPT_TEXT

Phone test on Xiaomi Redmi Note 13 Pro: "APK is so yuck... same as before, nothing changed much, buttons, sections, bars everywthing broken and in chaos... no fetching of live data from backend, app icon too shit and generic." Also asked: MCP/API to fetch bank balances (Pakistani banks + fintech apps), FBR statement, assets directly into Rahnuma — is the idea good? And whether artifacts felt good because designed for iOS, or common mechanism for both.

## RESPONSE_TEXT

Autopsy (grep-census root cause, soldier-obedience = verified non-issue): October design system covered only Dashboard/Portfolio/Budget/Briefing; Advisory/Calculators/Settings/PinLock still on May-era raw-hex styling (0 theme tokens; 25/40/23/11 hardcoded hex). The phone saw both worlds interleaved = visual chaos. It is NOT iOS-vs-Android (RN compiles one codebase; artifacts are CSS design targets, not RN renders) and NOT HyperOS. Ownership stated: the General sequenced the feature beat ahead of the deferred SPINE item #6 design pass and never scheduled a full port — that mismatch is the miss. Fix: two disjoint soldiers — UI-FACELIFT (port 4 legacy screens to theme tokens, safe-area tab bar for gesture-nav, seeded StatusBar, hex-count gate 0, tests/tsc gates) and BRAND-ICON (deterministic Pillow generator for 1024 master + adaptive 66% safe-zone foreground + splash + favicon on committed script; app.json bg hexes to theme) — then local gradle forge r3. Live data truth restated: no background feed exists; prices fetch on-demand via Yahoo .KAR only; artifact data labeled sample. Bank/FBR account aggregation: direction correct (unified net worth), mechanism premature — no licensed retail open-banking / account-aggregation standard in Pakistan; credential-sharing patterns contradict the privacy moat and are phishing-shaped; FBR IRIS has no statement API. Chosen safe seam: statement-import + OCR, restart when SBP open finance lands. Public beta timing: polish beat must precede the r/FIREPakistan post — the beta is only credible once the app looks like the artifacts.

## OUTCOME

- Confidence: high on the autopsy (grep-census is reproducible evidence)
- Eval: UI-FACELIFT acceptance = hex counts 0 in 4 screens + banners; BRAND-ICON acceptance = determinist sha256, four assets, app.json diff
