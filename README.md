# 🧭 Rahnuma AI — Your Wall Street Brain with a PSX Heart

> **رہنما** (Rahnuma) — Urdu for "Guide / Navigator / Advisor"

Rahnuma is a **Personal Financial Intelligence Agent** for Pakistani investors. It connects your budget, portfolio, and goals into one AI-powered advisor that speaks the language of Warren Buffett, thinks with the data of Ray Dalio, and knows the streets of PSX like a Karachi broker.

**Rahnuma does NOT trade for you.** It helps you think smarter about money.

---

## What Rahnuma Does

- 📊 **Unified Financial Dashboard** — Net worth, savings rate, portfolio performance, FIRE progress — one screen
- 💼 **Portfolio** — Add and delete holdings, sector allocation, price refresh, per-holding freshness labelling
- 🧾 **Budget** — Income and expenses by category and month, stored on-device
- 🧮 **Calculators** — CGT (Finance Act 2025 acquisition-date tranches), SIP projection, asset ROI, PKR devaluation, FIRE
- 🧠 **Advisory Council** — 9 voices, Auto routing to the best-fit persona, Council debate mode, and a hard buy/sell guard on every response. Answers in Urdu or Roman Urdu when you write in one.
- 🌅 **Panic Day Briefing** — A dedicated screen (`Morning briefing` on the dashboard) that restates your own facts on a bad market morning: the live quote with freshness, what your budget says you can invest this month, the arithmetic of a fixed monthly purchase in a falling market, and your consistency streak. **No predictions, no direction calls.**
- 🔒 **PIN lock** — SecureStore-backed, with attempt throttling
- 💾 **Data export** — Everything as JSON
- 📴 **Offline-first** — Your ledger lives in on-device SQLite. No account, no sync, no server.

## What Rahnuma Does NOT Do

- ❌ Execute trades
- ❌ Access your brokerage account
- ❌ Promise returns
- ❌ Replace a SECP-registered financial advisor

---

## Advisory Council

Every voice is a named investor or a local archetype. Each is prompted with the same non-negotiable rules: never say buy or sell, never predict returns, ground answers in your numbers, show the arithmetic, and state the disclaimer.

| Persona | Philosophy |
|---|---|
| 🏛️ **Warren Buffett** | Value investing, margin of safety, durable moats, long-term compounding |
| 📈 **Peter Lynch** | Buy what you know, earnings growth, PEG, ten-baggers in plain sight |
| 📊 **Ray Dalio** | All-weather allocation, risk parity, uncorrelated return streams |
| 🇵🇰 **Pakistani Street** | PSX mechanics: CDC/NCCPL, IPOs, T+2, commissions, CGT and ATL, DHA and gold conventions |
| 🔥 **Jim Simons** | Quantitative edge, systematic discipline, mathematics over narrative |
| ⚠️ **Michael Burry** | Tail risk, deep value, liquidity, what survives a crisis |
| 🧠 **Charlie Munger** | Mental models, inversion, avoiding stupidity, patience |
| 🇵🇰 **R.F. Habib** | Pakistani market realism, capital preservation, dividend stalwarts |

**Rahnuma** (balanced default) is the ninth voice used when no persona is pinned. **Council debate** runs Warren Buffett, Charlie Munger and Michael Burry in parallel and synthesises their answers.

---

## Tech Stack

| Layer | Technology | Status |
|---|---|---|
| Frontend | React Native + Expo (Android first), native-stack navigation | Built |
| UI | Shared theme (colors, 4pt spacing, type scale) + Card/Button/Input/Chip/EmptyState primitives | Built |
| Storage | SQLite on-device, SecureStore for keys and PIN | Built |
| AI runtime | Provider chain: Gemini / Groq free tiers, OpenRouter, user BYOK | Built |
| Routing | Deterministic persona router + Council debate mode | Built |
| Financial math | Pure TypeScript, unit tested | Built |
| Panic Day Briefing | Deterministic engine (`src/utils/briefing.ts`) + screen + route | Built |
| Backend | None — deliberately deferred (see `STATE.md`) | Not built |
| Urdu UI chrome | Nastaliq / Roman Urdu strings and RTL layout | Not built |
| Offline model | Gemma on-device (Principle XVI) | Not built |
| RAG, MCP servers, accounts | Specified in AGENTS.md | Not built |

---

## Getting Started

```bash
git clone https://github.com/COSMICnoob80/rahnuma-sabre.git
cd rahnuma-sabre
npm install
npm start          # Expo dev server
```

Then, inside the app, add a free AI key in **Settings → AI Providers** (Gemini and Groq both
have free tiers). Keys are stored in SecureStore on your device — nothing ships inside the
binary, and there is no key baked into the repo. Without a key, the dashboard, portfolio,
budget, briefing and every calculator still work; only the advisory chat is unavailable.

```bash
npm test           # 57 unit tests (Node's built-in runner, no test dependencies)
npm run ts:check   # strict TypeScript, clean
npx expo export --platform android   # verify a production JS bundle builds
```

---

## Build the APK

Two supported paths.

**(a) EAS cloud build (the path used for the current preview APK):**

```bash
npx eas build --platform android --profile preview --non-interactive
```

The `preview` profile in `eas.json` produces an installable `.apk`.

**(b) Local Gradle build (no EAS account needed):**

```bash
npx expo prebuild --platform android   # generates android/ from app.json
cd android
./gradlew assembleRelease              # output: app/build/outputs/apk/release/
```

The `android/` folder is generated by `prebuild`, never hand-edited. Build outputs, caches,
signing secrets and exported bundles are gitignored; the source config is `app.json`
(package `com.rahnuma.sabre`, adaptive icon, edge-to-edge, build version), so a fresh
`prebuild` reproduces it. Re-run `prebuild` after changing `app.json` or adding a native
dependency.

---

## Project Status

- [x] Vision document (CLAUDE.md), product charter (docs/WHY.md), agent architecture (AGENTS.md)
- [x] Dashboard: net worth, savings rate, portfolio P&L, FIRE progress
- [x] Portfolio: holdings, sector allocation, price refresh with freshness labelling
- [x] Budget: income and expenses by category and month
- [x] Calculators: CGT (Finance Act 2025 rules), SIP, asset ROI, PKR devaluation, FIRE
- [x] Advisory: 9 voices, Auto routing, Council debate, buy/sell guard
- [x] Panic Day Briefing: deterministic engine + screen + route (facts only, zero advisory fields)
- [x] PIN lock with attempt throttling, JSON data export
- [x] Zero-capital inference: free-tier provider chain + BYOK + response cache
- [x] Preview APK built from `f37eaf4`
- [ ] Phone test of the preview APK
- [ ] Closed beta on r/FIREPakistan
- [ ] Bilingual UI chrome (English + Urdu Nastaliq + Roman Urdu)
- [ ] Global markets outlook (international stocks, bonds, commodities, FX) with live data
- [ ] Offline on-device model, RAG
- [ ] Backend for accounts and sync — only if beta retention justifies it

**Not built (roadmap, not shipped):** Scenario Simulator. The calculators cover individual
"What if" maths (SIP, devaluation, FIRE), but there is no multi-variable scenario simulator
screen. READMEs that list it as a feature are wrong.

See `STATE.md` for the handover note and `docs/` for tax provenance, regulatory posture,
data sources, the beta launch plan and the product charter.

---

## Disclaimer

Rahnuma is an **educational tool**. It provides financial analysis and educational content. It is NOT a registered investment advisor, does NOT provide investment advice, and does NOT execute financial transactions. Every AI response is prefixed: *"Information only, not investment advice."* Always consult a SECP-registered financial advisor for personalized investment recommendations. Your money, your decision. Always.

---

## License

*TBD — License will be determined before public release.*

---

**Built by Shah G** — A Pakistani House Officer who learned to invest the hard way, and is building the advisor he wished he had.
