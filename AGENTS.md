# RAHNUMA AI — AGENTS.md

> **Purpose:** Defines all AI agents, their roles, routing logic, and interaction protocols
> **Status:** Architecture Phase — not implemented

---

## 1. AGENT ROSTER

### 1.1 Primary Agent: Rahnuma (The Advisor)

```yaml
name: rahnuma_advisor
type: conversational
model: claude-sonnet (default) | claude-opus (complex scenarios)
state: stateful (LangGraph — maintains conversation + user financial context)
tools:
  - portfolio_reader
  - budget_reader
  - fire_calculator
  - cgt_calculator
  - scenario_simulator
  - psx_market_data_mcp
  - mutual_fund_nav_mcp
  - rag_retriever
persona: dynamic (routes to Advisory Council based on query type)
```

**Behavior:**
1. Receives user query
2. Classifies query type (portfolio, budget, FIRE, tax, education, scenario)
3. Selects appropriate persona(s) from Advisory Council
4. Loads relevant user data (portfolio, budget, goals) from state
5. Queries MCP servers for real-time market data if needed
6. Generates advisory response with citations
7. Appends disclaimer
8. Updates conversation state

### 1.2 Sub-Agent: Persona Router

```yaml
name: persona_router
type: classifier
model: phi3:mini (local — fast, cheap, private)
input: user_query + conversation_context
output: persona_id | "council_debate" | "rahnuma_default"
```

**Routing Rules (Deterministic First):**

| Query Pattern | Persona | Confidence |
|---|---|---|
| Contains "should I buy/sell" | The Oracle | High |
| Contains "evaluate/analyze company" | The Fundamentalist | High |
| Contains "allocate/diversify/rebalance" | The Quant | High |
| Contains "IPO/CDC/DHA/CGT/PSX specific" | The Pakistani Street | High |
| Contains "FIRE/retire/savings rate/expenses" | The FIRE Architect | High |
| Contains "risk/crash/what if disaster" | The Risk Manager | High |
| Contains "compare perspectives" or complex | Council Debate | High |
| Ambiguous / general | Rahnuma Default | Fallback |

### 1.3 Sub-Agent: Scenario Engine

```yaml
name: scenario_engine
type: computational
model: deterministic (no LLM — pure math)
input: scenario_parameters + user_financial_data
output: projection_data (JSON for charts)
```

**Capabilities:**
- SIP amount change → 10/20/30 year projections
- Inflation rate change → purchasing power impact
- Currency devaluation → portfolio impact by sector
- Job loss → runway calculation from emergency fund
- Property purchase → cash flow + opportunity cost analysis
- Interest rate change → bond/savings certificate impact

### 1.4 Sub-Agent: Briefing Generator

```yaml
name: briefing_generator
type: scheduled (n8n trigger — daily 7:00 AM PKT)
model: claude-sonnet (summary generation)
input: user_portfolio + overnight_market_data + news
output: structured_briefing (push notification + full report)
```

### 1.5 Sub-Agent: Document Scanner

```yaml
name: document_scanner
type: multimodal
model: gemini-3-pro (best multimodal for receipts/statements)
input: image (receipt, bank statement, tax document)
output: structured_data (expense entry, transaction record)
```

---

## 2. AGENT INTERACTION FLOW

```mermaid
graph TD
    User[User Query] --> Router[Persona Router]
    
    Router --> |"Should I buy?"| Oracle[The Oracle]
    Router --> |"Evaluate company"| Lynch[The Fundamentalist]
    Router --> |"Asset allocation"| Dalio[The Quant]
    Router --> |"PSX/IPO/CDC specific"| PSXVet[Pakistani Street]
    Router --> |"FIRE/savings/budget"| FIRE[FIRE Architect]
    Router --> |"Risk/crash/what-if"| Taleb[Risk Manager]
    Router --> |"Compare/complex"| Council[Council Debate]
    Router --> |"Ambiguous"| Default[Rahnuma Default]
    
    Oracle --> DataLayer[Load User Financial Data]
    Lynch --> DataLayer
    Dalio --> DataLayer
    PSXVet --> DataLayer
    FIRE --> DataLayer
    Taleb --> DataLayer
    Council --> DataLayer
    Default --> DataLayer
    
    DataLayer --> MCP[Query MCP Servers]
    MCP --> RAG[Search Knowledge Base]
    RAG --> Response[Generate Advisory + Citation]
    Response --> Disclaimer[Append Disclaimer]
    Disclaimer --> Output[Return to User]
```

---

## 3. TOOL DEFINITIONS

| Tool | Type | Auth Required | Offline? |
|---|---|---|---|
| `portfolio_reader` | Database query | Yes (user session) | Yes (cached) |
| `budget_reader` | Database query | Yes | Yes (cached) |
| `fire_calculator` | Deterministic math | No | Yes |
| `cgt_calculator` | Deterministic math | No | Yes |
| `scenario_simulator` | Deterministic math | No | Yes |
| `psx_market_data_mcp` | MCP server call | API key | No |
| `mutual_fund_nav_mcp` | MCP server call | None (public data) | No |
| `sbp_rates_mcp` | MCP server call | None (public data) | No |
| `news_aggregator_mcp` | MCP server call | API key | No |
| `rag_retriever` | Vector search | No | Partial (cached) |

---

## 4. CONVERSATION STATE SCHEMA

```json
{
  "session_id": "uuid",
  "user_id": "uuid",
  "active_persona": "oracle | fundamentalist | quant | psx_vet | fire | risk_mgr | council | default",
  "conversation_history": [],
  "financial_context_loaded": {
    "portfolio_snapshot": {},
    "budget_summary": {},
    "fire_plan": {},
    "net_worth": 0
  },
  "market_context": {
    "kse100_last": 0,
    "portfolio_day_change": 0,
    "relevant_news": []
  },
  "session_start": "ISO8601",
  "queries_this_session": 0
}
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

*Agents are defined. Routing is specified. Implementation begins when Phase 1 starts.*

## Cross-agent handoff (Command Code ⇄ Hermes)

Read `.handoff/STATE.md` before starting work. It records what the other agent was doing, what changed on disk, and the exact next action. Append your own handoff there before stopping.

---

## Studio Agent System (external build team)

This section is the entry point for build/orchestration agents (Hermes, Command Code,
OpenCode) working in this directory. It is separate from the in-app `rahnuma_advisor`
agent architecture defined above — that is the product; this is the team that builds it.

### How to Use

When a build agent enters this directory, it should:
1. Read this section to understand the studio structure
2. Identify which role(s) the task requires
3. Load the corresponding persona file(s) from `agents/`
4. Execute the task using the persona's expertise and guidelines

### Studio Roles

| Role | Persona File | Triggers |
|------|-------------|----------|
| **Director** | `agents/director.md` | Overall coordination, pipeline orchestration, quality gates, final approval |
| **Product Auditor** | `agents/product-auditor.md` | Feature completeness, production-readiness, gap analysis |
| **UX Reviewer** | `agents/ux-reviewer.md` | Interface quality, Urdu-first experience, onboarding, clarity |
| **Competitive Analyst** | `agents/competitive-analyst.md` | Market positioning, competitor feature gaps, differentiation |
| **Clinical Safety** | `agents/clinical-safety.md` | Financial-advice guardrails, no-buy/sell enforcement, SECP compliance |
| **QA** | `agents/qa.md` | Final review, release-readiness, red-line checks |

### Quick Routing

- **"Is this production-ready?"** → Load `agents/product-auditor.md`
- **"Audit the app"** → Load `agents/director.md` (it orchestrates the rest)
- **"Can we post this to r/pakistan?"** → Load `agents/competitive-analyst.md` + `agents/clinical-safety.md`
- **"Is this safe to ship?"** → Load `agents/qa.md`

### Studio Principles

- **Verify on disk, never from memory.** Read the actual file before claiming its state.
- **No sycophancy.** Flag gaps plainly; a polished-looking app with a broken core is worse than an honest prototype.
- **Offline-first is the moat.** Rahnuma's differentiation is on-device, Urdu-first, no-advice. Do not dilute it to chase competitor features.
- **Smallest viable change.** Cite files you touch.
