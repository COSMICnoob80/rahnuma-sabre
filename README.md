# 🧭 Rahnuma AI — Your Wall Street Brain with a PSX Heart

> **رہنما** (Rahnuma) — Urdu for "Guide / Navigator / Advisor"

Rahnuma is a **Personal Financial Intelligence Agent** for Pakistani investors. It connects your budget, portfolio, and goals into one AI-powered advisor that speaks the language of Warren Buffett, thinks with the data of Ray Dalio, and knows the streets of PSX like a Karachi broker.

**Rahnuma does NOT trade for you.** It helps you think smarter about money.

---

## What Rahnuma Does

- 📊 **Unified Financial Dashboard** — Net worth, savings rate, portfolio performance, FIRE progress — one screen
- 🧠 **Advisory Council** — Ask financial questions, get perspectives from multiple investment philosophies
- 🔮 **Scenario Simulator** — "What if I increase my SIP?" "What if PKR devalues 20%?" — see the math
- 🇵🇰 **Pakistan-Specific** — CGT calculator, DHA property analysis, SBP rate tracking, military pension planning
- 📚 **Financial Education** — Learn investing concepts using YOUR actual portfolio as examples
- 🗣️ **Urdu Support** — Financial guidance in Urdu for those who need it

## What Rahnuma Does NOT Do

- ❌ Execute trades
- ❌ Access your brokerage account
- ❌ Promise returns
- ❌ Replace a SECP-registered financial advisor

---

## Advisory Council

| Persona | Philosophy |
|---|---|
| 🏛️ **The Oracle** | Value investing, margin of safety, long-term compounding |
| 📈 **The Fundamentalist** | Buy what you know, earnings growth, ten-baggers |
| 📊 **The Quant** | All-weather portfolio, risk parity, data-driven allocation |
| 🇵🇰 **Pakistani Street** | PSX dynamics, IPO strategy, DHA balloting, CGT optimization |
| 🔥 **FIRE Architect** | Savings rate, expense optimization, freedom calculation |
| ⚠️ **Risk Manager** | Black swans, tail risk, antifragility, stress testing |

---

## Tech Stack

| Layer | Technology | Status |
|---|---|---|
| Frontend | React Native + Expo (Android first) | Built |
| Storage | SQLite on-device, SecureStore for keys and PIN | Built |
| AI runtime | Provider chain: Gemini / Groq free tiers, OpenRouter, user BYOK | Built |
| Routing | Deterministic persona router + Council debate mode | Built |
| Financial math | Pure TypeScript, unit tested | Built |
| Backend | None — deliberately deferred (see `STATE.md`) | Not built |
| Offline model | Gemma on-device (Principle XVI) | Not built |
| MCP servers, RAG, daily briefings | Specified in AGENTS.md | Not built |

---

## Getting Started

```bash
git clone https://github.com/COSMICnoob80/rahnuma-sabre.git
cd rahnuma-sabre
npm install
npm start
```

Then, inside the app, add a free AI key in **Settings → AI Providers** (Gemini and Groq both
have free tiers). Without a key, the dashboard, portfolio, budget and every calculator still
work — only the advisory chat is unavailable.

```bash
npm test           # 38 unit tests, no test dependencies
npm run ts:check   # strict TypeScript
```

---

## Project Status

- [x] Vision document (CLAUDE.md) and agent architecture (AGENTS.md)
- [x] Dashboard: net worth, savings rate, portfolio P&L, FIRE progress
- [x] Portfolio: holdings, sector allocation, price refresh with freshness labelling
- [x] Budget: income and expenses by category and month
- [x] Calculators: CGT (Finance Act 2025 rules), SIP, asset ROI, PKR devaluation, FIRE
- [x] Advisory: 6 personas, Auto routing, Council debate, buy/sell guard
- [x] PIN lock with attempt throttling, JSON data export
- [x] Zero-capital inference: free-tier provider chain + BYOK + response cache
- [ ] Closed beta on Play Store
- [ ] Urdu UI strings (the model already answers in Urdu)
- [ ] Offline on-device model, RAG, daily briefings
- [ ] Backend for accounts and sync — only if beta retention justifies it

See `STATE.md` for the handover note, and `docs/` for tax provenance, regulatory posture,
data sources and the beta launch plan.

---

## Disclaimer

Rahnuma is an **educational tool**. It provides financial analysis and educational content. It is NOT a registered investment advisor, does NOT provide investment advice, and does NOT execute financial transactions. Always consult a SECP-registered financial advisor for personalized investment recommendations. Your money, your decision. Always.

---

## License

*TBD — License will be determined before public release.*

---

**Built by Shah G** — A Pakistani House Officer who learned to invest the hard way, and is building the advisor he wished he had.
