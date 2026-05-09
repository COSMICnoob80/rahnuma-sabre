# RAHNUMA AI — SKILL.md

> **Purpose:** Defines composable, swappable skills that agents use to accomplish tasks
> **Pattern:** Each skill is a self-contained capability with clear input/output contracts

---

## 1. FINANCIAL CALCULATION SKILLS (Deterministic — No AI)

### Skill: FIRE Calculator

```yaml
name: fire_calculator
type: deterministic
requires_ai: false
offline: true
```

**Input:**
```json
{
  "monthly_expenses": 80000,
  "monthly_income": 150000,
  "current_savings": 500000,
  "current_investments": 2000000,
  "expected_return_rate": 0.10,
  "inflation_rate": 0.15,
  "withdrawal_rate": 0.035,
  "currency": "PKR"
}
```

**Output:**
```json
{
  "savings_rate": 0.467,
  "fire_number": 27428571,
  "years_to_fire": 14.3,
  "monthly_savings_needed": 70000,
  "current_progress_pct": 9.1,
  "fire_date_estimate": "2040-06",
  "assumptions": "10% nominal return, 15% inflation, 3.5% SWR"
}
```

---

### Skill: CGT Calculator (Capital Gains Tax — PSX)

```yaml
name: cgt_calculator
type: deterministic
requires_ai: false
offline: true
```

**Input:**
```json
{
  "purchase_price": 25.50,
  "sale_price": 32.00,
  "quantity": 1000,
  "purchase_date": "2025-06-15",
  "sale_date": "2026-02-20",
  "asset_type": "listed_equity"
}
```

**Output:**
```json
{
  "gain": 6500,
  "holding_period_days": 250,
  "holding_period_category": "less_than_1_year",
  "cgt_rate": 0.15,
  "tax_liability": 975,
  "net_gain_after_tax": 5525,
  "note": "Holding > 2 years = 0% CGT. Consider holding 115 more days."
}
```

**CGT Rate Table (FY 2025-26):**

| Holding Period | CGT Rate |
|---|---|
| < 1 year | 15% |
| 1-2 years | 12.5% |
| 2-3 years | 10% |
| 3-4 years | 7.5% |
| > 4 years | 0% |

---

### Skill: Savings Rate Calculator

```yaml
name: savings_rate_calculator
type: deterministic
requires_ai: false
offline: true
```

**Input:**
```json
{
  "period": "2026-01",
  "income": 150000,
  "expenses": 80000,
  "investments_made": 45000
}
```

**Output:**
```json
{
  "savings_rate": 0.467,
  "investment_rate": 0.300,
  "expense_ratio": 0.533,
  "trend_vs_last_month": "+2.1%",
  "annualized_savings": 840000
}
```

---

### Skill: SIP Projector

```yaml
name: sip_projector
type: deterministic
requires_ai: false
offline: true
```

**Input:**
```json
{
  "monthly_sip": 10000,
  "current_corpus": 500000,
  "expected_return": 0.12,
  "years": [5, 10, 15, 20, 25, 30]
}
```

**Output:**
```json
{
  "projections": [
    {"years": 5, "corpus": 1702841, "invested": 1100000, "gains": 602841},
    {"years": 10, "corpus": 3807692, "invested": 1700000, "gains": 2107692},
    {"years": 15, "corpus": 7594283, "invested": 2300000, "gains": 5294283},
    {"years": 20, "corpus": 14212847, "invested": 2900000, "gains": 11312847},
    {"years": 25, "corpus": 25778431, "invested": 3500000, "gains": 22278431},
    {"years": 30, "corpus": 45991203, "invested": 4100000, "gains": 41891203}
  ],
  "note": "Nominal returns. Real returns after 15% inflation are significantly lower."
}
```

---

## 2. ADVISORY SKILLS (AI-Powered)

### Skill: Persona Advisory Response

```yaml
name: persona_advisory
type: ai_powered
model: claude-sonnet | claude-opus
requires: persona_context + user_financial_data + rag_results
```

**System Prompt Template (per persona):**

```markdown
You are {persona_name}, a financial advisor on the Rahnuma Advisory Council.

Your investment philosophy: {philosophy_summary}
Your speaking style: {style_description}

User's financial context:
- Net worth: {net_worth}
- Portfolio: {portfolio_summary}
- Monthly savings rate: {savings_rate}%
- FIRE progress: {fire_progress}%
- Active goals: {goals}

Relevant market data:
{mcp_data}

Relevant knowledge base results:
{rag_results}

Rules:
1. ALWAYS cite your sources
2. NEVER hallucinate financial data — if you don't have the data, say so
3. NEVER recommend specific buy/sell actions — educate, don't prescribe
4. ALWAYS end with: "This is educational analysis, not investment advice."
5. Respond in the user's language (English or Urdu as detected)
6. Use the user's ACTUAL financial data in examples, not hypothetical numbers
```

---

### Skill: Council Debate

```yaml
name: council_debate
type: ai_powered
model: claude-opus (needs complex multi-perspective reasoning)
requires: 2-3 persona_contexts + user_financial_data + rag_results
```

**Output Format:**
```markdown
## Advisory Council on: "{user_question}"

### 🏛️ The Oracle (Value Perspective)
{oracle_response}

### 📊 The Quant (Data Perspective)
{quant_response}

### ⚠️ The Risk Manager (Contrarian Perspective)
{risk_response}

### 🤝 Rahnuma Synthesis
Considering all perspectives, here are the key factors for YOUR decision:
{synthesis_with_user_specific_data}

---
*This is educational analysis, not investment advice.*
```

---

## 3. DATA INTEGRATION SKILLS

### Skill: Budget Import

```yaml
name: budget_import
type: data_pipeline
offline: true (CSV) | false (API)
sources: ["trackwallet_csv", "manual_entry", "bank_statement_scan"]
```

### Skill: Market Data Fetch

```yaml
name: market_data_fetch
type: mcp_call
offline: false
sources: ["psx_market_data_mcp", "mutual_fund_nav_mcp", "sbp_rates_mcp"]
cache: 15_minutes (intraday), 24_hours (post_market)
```

---

*Skills are the modular building blocks. Each is independently testable, swappable, and reusable across agents. The FIRE calculator works identically whether invoked by the Oracle, the FIRE Architect, or the Scenario Engine.*
