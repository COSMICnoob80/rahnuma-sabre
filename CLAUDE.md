# RAHNUMA AI — Financial Advisor Digital FTE

> **Name:** Rahnuma (رہنما — Urdu for "Guide / Navigator / Advisor")
> **Codename:** SABRE (Strategic Advisory for Budget, Returns & Equity)
> **Tagline:** "Your Wall Street brain with a PSX heart"
> **Author:** Shah G | House Officer → Agentic AI Engineer
> **Created:** February 2026
> **Status:** Vision & Architecture Phase — NOT in development
> **Priority:** AFTER Shift Buddy V2 MVP + DreamLand Homes Concierge
> **Vault:** `rahnuma-ai/` (clean vault)

---

## 1. MISSION STATEMENT

Rahnuma is a **Personal Financial Intelligence Agent** — a domain-specific AI advisor for Pakistani individuals navigating PSX equities, mutual funds, real estate (DHA balloting), FIRE planning, tax optimization, and daily budgeting. It is NOT a trading bot. It does NOT execute trades. It does NOT promise returns.

Rahnuma is **Harvey AI for personal finance in Pakistan.** Harvey made lawyers 80x faster at document review. Rahnuma makes Pakistani investors 10x smarter at financial decisions — by connecting their ACTUAL financial data (budget, portfolio, goals) with the reasoning of Wall Street veterans, PSX analysts, and FIRE movement architects.

### What Makes Rahnuma Different from Trading Bots

| PocketAI / Trading Bots | Rahnuma AI |
|---|---|
| "Click AI Trading to auto-trade" | "Here's why your savings rate dropped 12% this month" |
| Price charts + technical indicators only | YOUR TrackWallet budget + YOUR KTrade portfolio + YOUR FIRE goals |
| Executes trades for you (gambling with AI wrapper) | Educates you to make YOUR OWN decisions |
| Generic global markets | Pakistani ecosystem: PSX, CDC, NTN, SBP, DHA, military pensions |
| No persona — robotic signals | Advisory council: Munger's patience, Lynch's fundamentals, PSX veteran street wisdom |
| Binary output: Buy/Sell | Rich output: analysis, projections, scenarios, historical parallels, Urdu summaries |
| You watch results | You UNDERSTAND results |
| Regulated nowhere (Costa Rica shell company) | Positioned as EDUCATIONAL tool — no SECP advisory license needed |

### The Core Promise

> "Rahnuma doesn't tell you WHAT to buy. Rahnuma helps you understand WHY you're buying, WHETHER you should, and WHAT HAPPENS if you do — using the mental models of the greatest investors who ever lived, applied to YOUR specific financial reality in Pakistan."

---

## 2. THE PROBLEM (LIVED EXPERIENCE)

### 2.1 The Reality of a Pakistani Retail Investor

- **Information asymmetry:** Institutional investors have Bloomberg terminals, research teams, and insider networks. Retail investors have WhatsApp stock tips and YouTube "gurus"
- **No integrated view:** Budget is in TrackWallet, portfolio is in KTrade, property records are on paper, pension projections are in your head
- **FOMO-driven decisions:** IPO subscriptions with borrowed funds, panic selling during India-Pakistan tensions, chasing yesterday's winner
- **Tax illiteracy:** Most individual investors don't know how CGT (Capital Gains Tax) works on PSX, miss NTN filing deadlines, or overpay because they don't track cost basis
- **No FIRE framework:** The FIRE movement is Western-centric. Calculators assume USD, 401k, S&P 500. Pakistani FIRE needs PKR, mutual funds, DHA property appreciation, gold, and inflation at 20-30%
- **Emotional trading:** Selling MIIETF during geopolitical crisis instead of continuing SIP. Buying at ATH because "everyone is making money." The behavioral gap between knowing and doing
- **Urdu gap:** Most financial education content is English-only. 70% of Pakistan's population is more comfortable in Urdu. Quality Urdu financial content barely exists

### 2.2 Shah G's Actual Financial Journey (Source Material)

This project is born from lived experience — not theoretical market research:

- TrackWallet data showing 49.5% savings rate with food costs and FOMO spending identified
- FIRE trajectory analysis with realistic Pakistani parameters
- PSX IPO analysis (Signature Residency REIT, BlueEx, PQFTL)
- MIIETF systematic investment plan with monthly purchases through geopolitical volatility
- CDC Investor Account (e-IPO subscriptions via KTrade)
- DHA property analysis and balloting system understanding
- Military family financial ecosystem (pension, DHA allocation, AFHS)
- Personal experience with emotional investing mistakes — the exact mistakes Rahnuma prevents

---

## 3. THE ADVISORY COUNCIL (Persona System)

Rahnuma doesn't have ONE persona. It has an **Advisory Council** — multiple investment philosophy archetypes that can be invoked individually or combined based on the user's question.

### 3.1 Council Members

| Persona | Philosophy | When Invoked | Speaking Style |
|---|---|---|---|
| **"The Oracle" (Buffett/Munger)** | Value investing, margin of safety, circle of competence, long-term compounding | "Should I buy this stock?", "Is this IPO worth it?" | Folksy wisdom, Socratic questions, historical analogies. "Would you buy the whole company at this price?" |
| **"The Fundamentalist" (Peter Lynch)** | Buy what you know, earnings growth, PEG ratio, ten-bagger hunting | "Which sector should I research?", "How do I evaluate this company?" | Practical, street-level analysis. "Do you use this company's products? Do your neighbors?" |
| **"The Quant" (Ray Dalio)** | All-weather portfolio, risk parity, correlation, systematic rebalancing | "How should I allocate?", "Am I diversified enough?" | Data-driven, principles-based. "What does the data say? What's the historical base rate?" |
| **"The Pakistani Street" (PSX Veteran)** | Local market dynamics, settlement cycles, IPO strategy, DHA balloting, CGT optimization | "How does IPO allotment work?", "When should I apply to CDC?" | Direct, pragmatic, Pakistani context. Knows the KSE-100 seasonal patterns, T+2 settlement, and which brokerages actually work |
| **"The FIRE Architect" (Mr. Money Mustache + Pakistani twist)** | Savings rate optimization, expense tracking, investment automation, freedom calculation | "When can I retire?", "How do I save more?" | Motivational but data-grounded. "Your FIRE number isn't $1M. At PKR 80K/month expenses and 6% real return, it's PKR 16M. You're 23% there." |
| **"The Risk Manager" (Nassim Taleb)** | Black swans, tail risk, antifragility, barbell strategy, skin in the game | "What if Pakistan defaults?", "Should I put everything in stocks?" | Contrarian, stress-tests your assumptions. "You're not diversified — you have five positions that all crash on the same headline." |

### 3.2 Council Modes

- **Single Advisor:** User asks for specific persona — "What would Munger say about LUCK cement?"
- **Council Debate:** User asks complex question — Rahnuma presents 2-3 perspectives. "The Oracle says hold. The Quant says rebalance. The Risk Manager says hedge."
- **Default (Rahnuma):** Balanced synthesis of all personas. The "trusted senior" voice that draws from all philosophies contextually

---

## 4. CORE FEATURES

### 4.1 📊 Financial Dashboard (The Cockpit)

A unified view of the user's entire financial picture — the ONE screen that doesn't exist anywhere today:

- **Net Worth Tracker:** Assets (PSX portfolio, mutual funds, DHA property, gold, savings, CDC) minus liabilities (loans, credit cards)
- **Cash Flow:** Monthly income vs expenses (imported from TrackWallet or manual entry)
- **Savings Rate:** Real-time percentage with trend chart. Historical comparison
- **Portfolio Performance:** MIIETF units × NAV, individual stock positions, mutual fund returns
- **FIRE Progress Bar:** "You are 23% to financial independence. At current savings rate: 14 years, 3 months remaining"
- **Alert Feed:** "MIIETF NAV dropped 8% this week — your SIP bought at a 12% discount vs 3-month average"

### 4.2 🧠 Advisory Engine (The Brain)

Natural language Q&A powered by the Advisory Council:

**Example interactions:**
- "Should I subscribe to the BlueEx IPO?" → Analysis: business model, valuation, comparable, risk factors, allotment probability, historical IPO returns on PSX. Council perspective from Fundamentalist + Pakistani Street
- "My TrackWallet shows I spent PKR 18K on food this month. Is that too high?" → Budget analysis with benchmarks, specific reduction suggestions, projected annual savings from a 20% food budget cut, compound impact on FIRE timeline
- "India-Pakistan tensions are escalating. Should I sell my MIIETF?" → Historical analysis of PSX during previous crises (2019 Balakot, 2016 surgical strikes, Kargil), Taleb's antifragility perspective, Buffett's "be greedy when others are fearful," specific data on post-crisis recovery timelines
- "Explain CGT on PSX in simple Urdu" → Urdu explanation with examples using the user's actual holdings and purchase prices

### 4.3 🔮 Scenario Simulator

"What if" analysis using the user's actual data:

- "What if I increase SIP from PKR 10K to 15K/month?" → 10-year projection comparison chart
- "What if PKR devalues 20% against USD?" → Impact on import-dependent stocks vs export earners in portfolio
- "What if I buy DHA Phase 9 plot at current rate?" → Cash flow impact, opportunity cost vs equities, historical DHA appreciation rates, liquidity risk analysis
- "What if I lose my job for 6 months?" → Emergency fund adequacy, burn rate, liquidation priority order

### 4.4 📋 FIRE Calculator (Pakistan Edition)

Purpose-built for Pakistani parameters that Western calculators ignore:

- **Inflation:** 20-30% historical average, not 2-3%
- **Currency:** PKR with USD purchasing power tracking
- **Investment vehicles:** Mutual funds (MIIETF, KASB), PSX direct, DHA property, gold, savings certificates, NSS
- **Tax:** CGT on equities (15% < 1yr, 12.5% 1-2yr, 0% > 2yr holding), property tax, FBR filing
- **Expenses:** Pakistani cost of living baselines by city (Islamabad, Karachi, Lahore)
- **Military benefits:** If applicable — AFHS, pension, DHA allocation, ex-servicemen quotas

### 4.5 📰 Market Intelligence Briefing

Daily/weekly briefing tailored to the user's portfolio:

- "Good morning. KSE-100 closed at 98,420 yesterday (+1.2%). Your portfolio: up PKR 4,200. LUCK reported quarterly earnings — revenue up 15%, relevant because it's 12% of your portfolio. SBP policy rate announcement today at 2 PM — consensus expects 100bps cut. Impact on your mutual fund NAVs will be positive. No action needed."

### 4.6 🏫 Financial Education (Learn Module)

Structured courses with Pakistani context:

- "What is a mutual fund?" → Explained with MIIETF as the example, using the user's own NAV history
- "How does compound interest work?" → Calculated with the user's actual SIP amount and return rate
- "What is diversification?" → Analyzed against the user's ACTUAL portfolio — "You're 80% in equities. Here's what happens in a crash."

---

## 5. TECHNICAL ARCHITECTURE

### 5.1 Stack Overview

```
┌─────────────────────────────────────────────────┐
│                   FRONTEND                       │
│  React Native (Android/iOS)                      │
│  Next.js (Web Dashboard)                         │
│  Electron (Desktop — Linux/Windows/macOS)        │
│  Inter font family │ Dark theme default          │
├─────────────────────────────────────────────────┤
│                   API LAYER                      │
│  FastAPI (Python) — REST + WebSocket             │
│  Authentication │ Rate Limiting │ Encryption     │
├─────────────────────────────────────────────────┤
│              AGENT ORCHESTRATION                 │
│  LangGraph — Stateful advisory conversations     │
│  Persona Router │ Scenario Engine                │
│  Council Debate Mode │ FIRE Calculator           │
├─────────────────────────────────────────────────┤
│               MODEL LAYER                        │
│  Claude API (complex advisory reasoning)         │
│  Gemini 3 Pro (document scanning, OCR)           │
│  Ollama/phi3:mini (offline quick lookups)        │
│  Model Router: complexity-based switching        │
├─────────────────────────────────────────────────┤
│               DATA & MEMORY                      │
│  PostgreSQL (user profiles, portfolio history)   │
│  Redis (session state, real-time prices)         │
│  ChromaDB (RAG — financial knowledge base)       │
│  S3/MinIO (user documents, reports)              │
├─────────────────────────────────────────────────┤
│              MCP SERVERS                         │
│  PSX Market Data MCP │ Mutual Fund NAV MCP       │
│  Budget Import MCP │ Tax Calculator MCP          │
│  News Aggregator MCP │ DHA Property MCP          │
├─────────────────────────────────────────────────┤
│            AUTOMATION LAYER                      │
│  n8n — Workflow automation                       │
│  Daily briefing generation │ SIP reminders       │
│  Price alert triggers │ Tax deadline reminders   │
└─────────────────────────────────────────────────┘
```

### 5.2 Model Strategy

```
                    ┌─────────────────┐
                    │  Model Router   │
                    │  (LangChain)    │
                    └────────┬────────┘
                             │
              ┌──────────────┼──────────────┐
              ▼              ▼              ▼
     ┌────────────┐  ┌────────────┐  ┌────────────┐
     │  Claude    │  │  Gemini 3  │  │  Ollama    │
     │  Opus/     │  │  Pro       │  │  phi3:mini │
     │  Sonnet    │  │  (via API) │  │  (local)   │
     └────────────┘  └────────────┘  └────────────┘
     Complex          Document        Quick lookups,
     advisory,        scanning        offline mode,
     council debate,  (receipts,      basic calcs,
     scenario sim     bank stmts)     private data
```

### 5.3 MCP Server Definitions

| MCP Server | Purpose | Data Source | Priority |
|---|---|---|---|
| `psx-market-data-mcp` | Real-time and historical KSE-100, stock prices, volumes | PSX API / scraping | High |
| `mutual-fund-nav-mcp` | Daily NAV for Pakistani mutual funds (MIIETF, KASB, etc.) | MUFAP data / fund house APIs | High |
| `budget-import-mcp` | Import expense data from TrackWallet or manual CSV | TrackWallet export / CSV | High |
| `tax-calculator-mcp` | CGT calculation, NTN filing helpers, tax bracket lookup | FBR rules (deterministic) | Medium |
| `news-aggregator-mcp` | Pakistani financial news filtered by portfolio relevance | Business Recorder, Dawn Business, Bloomberg | Medium |
| `dha-property-mcp` | DHA plot prices, balloting history, transfer procedures | DHA websites / community data | Low |
| `cdc-portfolio-mcp` | CDC account holdings, dividend history, bonus shares | CDC API (if available) / manual | Low |
| `sbp-rates-mcp` | Policy rate, KIBOR, forex rates, T-bill yields | SBP data portal | Medium |

---

## 6. DATA PRIVACY & COMPLIANCE

### 6.1 Critical Financial Data Handling

- **No financial data leaves device by default** — local-first processing
- All cloud AI calls strip personally identifiable financial details
- Portfolio values sent for analysis are RELATIVE (percentages), not ABSOLUTE (amounts)
- Bank account numbers, CDC account numbers NEVER transmitted to any AI model
- All data encrypted at rest (AES-256) and in transit (TLS 1.3)
- User can export ALL their data at any time (GDPR-style right)
- User can delete ALL their data permanently with one action

### 6.2 Regulatory Positioning

- **Rahnuma is an EDUCATIONAL tool, NOT a registered investment advisor**
- All outputs carry disclaimer: "This is educational analysis, not investment advice. Consult a SECP-registered advisor for personalized recommendations."
- No trade execution capability — Rahnuma CANNOT buy or sell anything
- No portfolio management — Rahnuma CANNOT access brokerage accounts with write permissions
- SECP (Securities and Exchange Commission of Pakistan) compliance review required before commercial launch
- FBR/NTN guidance is informational only — "consult a tax professional" disclaimer on all tax outputs

---

## 7. RAG KNOWLEDGE BASE

### 7.1 Core Knowledge Sources

| Category | Sources | Update Frequency |
|---|---|---|
| Investment Classics | Intelligent Investor, One Up on Wall Street, Principles, Black Swan, Poor Charlie's Almanack | Static (one-time ingest) |
| Pakistani Market | PSX Investor Guide, SECP regulations, CGT rules, CDC procedures, KTrade tutorials | Quarterly update |
| FIRE Movement | Mr. Money Mustache archive, ERN Safe Withdrawal Rate series, Pakistani FIRE community content | Semi-annual |
| SBP Policy | Monetary policy statements, forex regulations, banking guidelines | After each MPC meeting |
| Tax Law | FBR Income Tax Ordinance (relevant sections), CGT schedules, NTN procedures | Annual (budget season) |
| Local Market | DHA pricing guides, property tax tables, gold rate history, savings certificate rates | Monthly |

### 7.2 Citation Requirement

**Every advisory response MUST cite its source.** No hallucinated financial claims.

- Market data → source + timestamp
- Tax rules → FBR section reference
- Investment principles → book/author/chapter
- Historical patterns → date range + data source
- Persona quotes → attributed to the persona with the underlying principle cited

---

## 8. COMPETITIVE LANDSCAPE

### 8.1 Why No One Has Built This

| Existing Tool | What It Does | What It Doesn't Do |
|---|---|---|
| KTrade / CDC app | Shows your portfolio holdings | Doesn't analyze, advise, or connect to your budget |
| TrackWallet / Wallet apps | Tracks expenses | Doesn't connect to investments or project FIRE |
| ChatGPT / Claude (general) | Answers financial questions | Doesn't know YOUR portfolio, YOUR budget, YOUR goals |
| PocketAI / Trading bots | Auto-executes trades | Gambling, not advising. No education. No domain specificity |
| Bloomberg Terminal | Everything for institutions | $24,000/year. Not for retail. Not Pakistani-specific |
| Investopedia | Financial education | Generic, not personalized, not Pakistani |
| YouTube "gurus" | Entertainment | Survivorship bias, no accountability, usually selling courses |

### 8.2 The Moat

1. **Pakistani domain specificity:** CGT rates, DHA balloting system, SBP policy cycles, military pensions, PKR-denominated FIRE math. No Western tool covers this
2. **Persona system:** Not a generic chatbot. Advisory council with investment philosophy frameworks that teach thinking, not just answers
3. **Data integration:** Budget + portfolio + goals in ONE agent. No other Pakistani tool unifies these
4. **Urdu capability:** Financial education in Urdu for the 70% who need it
5. **Offline-first:** Works on mobile data in Pakistani conditions. Core calculators don't need internet
6. **Built by a Pakistani investor FOR Pakistani investors:** Same lived experience. Same IPO FOMO. Same geopolitical anxiety. Same DHA dreams

---

## 9. PLATFORM TARGETS

### 9.1 Primary: Android App
- React Native
- Target: Android 10+ (90%+ Pakistani smartphones)
- Minimal storage (< 80MB base install)
- Offline: FIRE calculator, budget tracking, cached portfolio

### 9.2 Secondary: Web Dashboard
- Next.js web application
- Full-width portfolio analytics, scenario simulator charts
- Desktop-optimized for detailed analysis sessions

### 9.3 Tertiary: Desktop App
- Electron wrapper (Linux/Windows/macOS)
- For power users who want persistent dashboard
- System tray notifications for price alerts and SIP reminders

### 9.4 Future: iOS App
- Same React Native codebase
- Apple ecosystem integration

---

## 10. DEVELOPMENT PHASES

### Phase 0: Foundation (Weeks 1-2)
- [ ] Git repository with branching strategy
- [ ] Project structure (monorepo: `/api`, `/web`, `/mobile`, `/agents`, `/docs`)
- [ ] Docker Compose (FastAPI + PostgreSQL + Redis)
- [ ] Basic auth (email + password)
- [ ] FIRE calculator — standalone, deterministic, no AI needed

### Phase 1: Core Advisory Engine (Weeks 3-6)
- [ ] LangGraph advisory conversation graph
- [ ] Persona router (select advisor based on query type)
- [ ] Single advisor mode (start with "The Oracle")
- [ ] Basic portfolio input (manual entry)
- [ ] Budget input (manual entry or CSV import)
- [ ] Net worth calculator
- [ ] Savings rate tracker

### Phase 2: Data Integration (Weeks 7-10)
- [ ] PSX market data MCP server
- [ ] Mutual fund NAV MCP server
- [ ] TrackWallet/CSV budget import
- [ ] Portfolio performance calculator
- [ ] Basic scenario simulator (SIP change, inflation change)

### Phase 3: Intelligence Layer (Weeks 11-14)
- [ ] RAG knowledge base (investment books + Pakistani market data)
- [ ] Council debate mode (multi-persona response)
- [ ] Daily market briefing generator
- [ ] Tax calculator (CGT, holding period optimization)
- [ ] DHA property analysis module

### Phase 4: Mobile + Desktop (Weeks 15-18)
- [ ] React Native Android app
- [ ] Push notifications (SIP reminders, price alerts, tax deadlines)
- [ ] Offline mode (FIRE calculator, cached portfolio, local AI)
- [ ] Electron desktop wrapper

### Phase 5: Advanced Features (Weeks 19-24)
- [ ] Urdu language support (full advisory in Urdu)
- [ ] Voice interaction (ask financial questions by voice)
- [ ] Bill/receipt scanner (photograph → expense entry)
- [ ] Social features (anonymous portfolio comparison, community benchmarks)
- [ ] SBP rates MCP + news aggregator MCP

### Phase 6: Beta & Launch (Weeks 25-30)
- [ ] Beta with 10-20 Pakistani investors
- [ ] Feedback iteration
- [ ] SECP compliance review
- [ ] Play Store submission
- [ ] Demo video for portfolio

---

## 11. SUCCESS METRICS

| Metric | Target | How to Measure |
|---|---|---|
| User can answer "what's my net worth?" | < 5 seconds | Dashboard load time |
| FIRE projection accuracy | Within 5% of manual calculation | Backtest against spreadsheet |
| Advisory response quality | User rates "useful" > 80% | In-app feedback thumbs up/down |
| Budget import friction | < 2 minutes from CSV to dashboard | Time-on-task measurement |
| Scenario simulator usage | Average 3+ scenarios per session | Analytics |
| Urdu response quality | Comprehensible to non-English speaker | User testing with Urdu-primary users |
| Daily briefing open rate | > 60% | Push notification analytics |

---

## 12. KNOWN RISKS & MITIGATIONS

| Risk | Impact | Mitigation |
|---|---|---|
| PSX data access (no official API) | Core feature degraded | Web scraping fallback + community data + manual entry option |
| SECP regulatory concern | Legal risk | Position as EDUCATIONAL, not advisory. Disclaimers everywhere. No trade execution |
| Financial data breach | Trust destruction | Local-first, end-to-end encryption, zero-knowledge architecture where possible |
| AI hallucinating financial data | Wrong investment decisions | All market data from MCP servers (verified), not LLM memory. Citation required on every claim |
| Persona advice contradicts reality | User loss | Every persona response includes data backing. "The Oracle says patience, but here's the actual chart showing 40% drawdown duration" |
| User follows advice blindly | Liability | Mandatory disclaimer. "Rahnuma is educational. Your money, your decision. Always." |
| PKR volatility making projections useless | FIRE calculator unreliable | Dual-currency mode (PKR + USD purchasing power). Inflation-adjusted projections default |

---

## 13. V2 LESSONS APPLIED (From Shift Buddy)

Everything learned from Shift Buddy V1→V2 applies here from Day 1:

1. **FastAPI + React, not Streamlit** — production stack from the start
2. **LangGraph for stateful conversations** — advisory sessions maintain context across questions
3. **Git discipline** — branching strategy, conventional commits, never push to main
4. **Tests for deterministic features** — FIRE calculator, CGT calculator, savings rate = pure math = 100% testable
5. **Multi-model routing** — Claude for complex advisory, Gemini for document scanning, local for private data
6. **Offline-first** — FIRE calculator works without internet
7. **SPEC.md before code** — each phase gets its own spec before implementation begins
8. **MCP standard** — every data source is an MCP server, swappable and testable independently

---

## 14. AGENT INSTRUCTIONS (FOR CLAUDE CODE / ANTIGRAVITY)

When working on this project, the development agent should:

- **Always read this document first** before making architectural decisions
- **Use Inter font family** for all UI elements
- **Follow the git branching strategy** — never commit to main directly
- **Write tests** for every financial calculator (money math errors are unacceptable)
- **Never hallucinate financial data** — all market data from MCP servers or user input, NEVER from LLM training data
- **Use type hints** in all Python code
- **Use TypeScript** for all frontend code
- **Include disclaimer** on every advisory output: "Educational analysis, not investment advice"
- **Log all AI model calls** — for cost tracking and debugging
- **Never log financial data** — portfolio values, account numbers, and transaction details never appear in application logs
- **Citation required** — every financial claim must reference its source

---

## 15. THE HARVEY PARALLEL

Harvey AI is the architectural twin and business model validation for Rahnuma:

| Harvey (Legal → $11B) | Rahnuma (Finance → ?) |
|---|---|
| Custom LLM trained on case law | RAG on investment classics + Pakistani market data |
| Assistant, Vault, Workflows, History, Library | Dashboard, Portfolio, Advisory, Scenarios, Learn |
| Document review 80x faster | Financial decision-making 10x smarter |
| "Lawyers must validate everything" | "Your money, your decision. Always." |
| Allen & Overy, HSBC, PwC as clients | Pakistani retail investors as users |
| $1,000/lawyer/month | PKR 499/user/month (freemium) |
| Built by ex-litigation lawyer + DeepMind researcher | Built by practicing doctor + investor who lived the problem |

**If Harvey proves domain-specific AI for ONE profession can be worth $11 billion, Rahnuma proves the same model can work for personal finance in an underserved market of 220 million people.**

---

## 16. FILE STRUCTURE

```
rahnuma-ai/
├── CLAUDE.md                     # This file
├── SPEC.md                       # Implementation spec (per phase)
├── AGENTS.md                     # Agent definitions and routing
├── README.md                     # Public-facing description
├── docker-compose.yml            # Local dev orchestration
├── .github/
│   └── workflows/
│       ├── ci.yml
│       └── deploy.yml
├── api/                          # FastAPI backend
│   ├── main.py
│   ├── config.py
│   ├── models/
│   │   ├── user.py
│   │   ├── portfolio.py
│   │   ├── budget.py
│   │   └── fire_plan.py
│   ├── routes/
│   │   ├── auth.py
│   │   ├── portfolio.py
│   │   ├── budget.py
│   │   ├── advisory.py
│   │   ├── scenarios.py
│   │   └── fire.py
│   ├── agents/
│   │   ├── persona_router.py
│   │   ├── advisory_graph.py
│   │   ├── scenario_engine.py
│   │   ├── briefing_generator.py
│   │   └── council_debate.py
│   ├── calculators/              # Deterministic — no AI needed
│   │   ├── fire_calculator.py
│   │   ├── cgt_calculator.py
│   │   ├── savings_rate.py
│   │   ├── net_worth.py
│   │   └── sip_projector.py
│   ├── rag/
│   │   ├── ingest.py
│   │   ├── retriever.py
│   │   └── documents/
│   ├── mcp/
│   │   ├── psx_market_data.py
│   │   ├── mutual_fund_nav.py
│   │   ├── budget_import.py
│   │   ├── tax_calculator.py
│   │   └── sbp_rates.py
│   └── tests/
│       ├── test_fire_calculator.py
│       ├── test_cgt_calculator.py
│       ├── test_savings_rate.py
│       └── test_advisory.py
├── web/                          # Next.js dashboard
│   ├── app/
│   │   ├── layout.tsx
│   │   ├── page.tsx
│   │   ├── dashboard/
│   │   ├── portfolio/
│   │   ├── advisory/
│   │   ├── scenarios/
│   │   ├── fire/
│   │   └── learn/
│   └── components/
│       ├── NetWorthCard.tsx
│       ├── PortfolioChart.tsx
│       ├── SavingsRateGauge.tsx
│       ├── FIREProgressBar.tsx
│       ├── AdvisoryChat.tsx
│       └── PersonaSelector.tsx
├── mobile/                       # React Native
├── desktop/                      # Electron wrapper
├── n8n/
│   ├── daily-briefing.json
│   ├── sip-reminder.json
│   └── price-alert.json
└── docs/
    ├── architecture.md
    ├── api-reference.md
    ├── personas.md
    └── deployment.md
```



## Principle XV: Delivery-First
Phone (primary) + laptop browser (secondary). Home WiFi or mobile
data available. Internet REQUIRED for live PSX prices and forex
rates — user expects this. Portfolio viewing + historical charts
MUST work offline. Locking user out of their own holdings data
because a server is down is a Principle XV violation.
Data: manual entry + PSX API + SBP rates. No camera. No OCR.
Output: screen (charts) + optional WhatsApp share + PDF for tax.

## Principle XVI: Model Selection
Runtime: DeepSeek V4 Flash via OpenRouter (primary — analysis, Q&A).
Fallback: Kimi K2.6 / GLM 5.1 if DeepSeek quota exhausted.
Offline: Gemma 4 E4B for basic portfolio Q&A without internet.
Every response prefixed: "Information only, not investment advice."
LLM never says "buy" or "sell."


https://github.com/TauricResearch/TradingAgents

https://arxiv.org/abs/2412.20138



---

*This document captures the vision for Rahnuma AI. Implementation begins AFTER Shift Buddy V2 MVP is deployed and validated. The spec is the parking lot — ideas are safe here, ready for takeoff when the runway is clear.*

**— Shah G, February 2026**
**"From forced career to deliberate builder. From emotional investor to systematic thinker."**



