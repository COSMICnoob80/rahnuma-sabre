---
id: 0008
title: Outlook-import-icon-r4 arc and web mirror
stage: green
date_iso: "2026-10-25"
surface: agent
model: z-ai/glm-5.3-flash
feature: global-outlook
branch: master
user: COSMICnoob80
command: "chat: logo redo orders, APK-in-chat request, simultaneous lanes, GROQ key integration"
labels: ["outlook-live", "import-positions", "gradle-r4", "web-mirror", "brand", "psx-national"]
links:
  spec: "docs/HARVEST-GLOBAL-OUTLOOK.md"
  ticket: null
  adr: null
  pr: null
files:
  - src/services/globalMarkets.ts
  - src/screens/OutlookScreen.tsx
  - src/utils/outlookText.ts
  - src/services/statementImport.ts
  - src/services/advisoryKey.ts
  - src/screens/BriefingScreen.tsx
  - scripts/generate_brand.py
  - design/brand-logo.html
  - app.json
  - package.json
tests:
  - npm test (97/97 incl. outlook + import suites)
  - npm run ts:check (clean)
---

## PROMPT_TEXT

User (multi-beat arc): logo redo ("R", Times serif, black bg, upward-ticker watermark overlay, /open-design, must be auto-invoked — distrust expressed after recent debacles, trust to be earned); run APK on machine without emulator or render in chat as artifact; implement local+global live data fetch AND bank/FBR statement import simultaneously not queued; light+dark themes?; embed forgotten GROQ key from .env by default if viable; validated sentence "Pakistan's first always-fresh, Urdu-hybrid, never-advising agentic council for PSX investors".

## RESPONSE_TEXT

Executed in parallel under graph doctrine (width 2 + OD lane): OUTLOOK-LIVE built globalMarkets.ts + OutlookScreen (89→97 tests; Yahoo probed live at build; red-line grep clean). IMPORT-POSITIONS shipped bank-CSV + FBR wealth paste-import with idempotent assets migration + no-credential law + POW personal-key resolver (advisoryKey.ts, build-time EXPO_PUBLIC env inline; leak-gate 0 verified by prefix-grep). PSX-NATIONAL fixer resolved the National hole — r4 packages everything, laddered per policy with sha-verified rungs r1–r3 intact + leak gate. WHY.md adopted the founder sentence verbatim. OD brand-logo.html per exact art direction awaiting verdict. WEB-MIRROR: react-dom+react-native-web installed, web export succeeded (fd8b591 pushed); blocked at PIN by no web SecureStore adapter — WEB-FLOW soldier dispatched to add a labeled preview-mode adapter. Theme toggle scheduled next. Trust ledger: every beat parent-verified with hashes/manifests/probes; diagnostics of the od-shadow trap recorded in soldier skill.

## OUTCOME

- Confidence: high (all gates re-run by parent; remote HEAD verified per push)
- Eval: real-phone validation of live outlook data pending the r4 mobile-data ride
