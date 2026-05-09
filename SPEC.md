# RAHNUMA AI — SPEC.md (Phase 0: Foundation)

> **Scope:** Foundation only (Weeks 1-2)
> **Parent Document:** CLAUDE.md (read for vision, architecture, and personas)
> **Rule:** Code that contradicts this spec is a bug. Spec that contradicts user needs is a spec revision.
> **Status:** SKELETON — to be expanded when implementation begins

---

## 1. DATA MODELS

### 1.1 User

| Field | Type | Required | Constraints |
|---|---|---|---|
| `id` | UUID v4 | Auto | Immutable |
| `name` | String | Yes | 1-100 chars |
| `email` | String | Yes | Valid email, unique |
| `password_hash` | String | Yes | bcrypt, never exposed |
| `currency` | Enum | Yes | `PKR`, `USD` | Default: `PKR` |
| `city` | String | No | For cost-of-living benchmarks |
| `is_military` | Boolean | No | Enables military-specific features (pension, DHA) |
| `created_at` | ISO 8601 DateTime | Auto | — |

### 1.2 FIRE Plan

| Field | Type | Required | Constraints |
|---|---|---|---|
| `id` | UUID v4 | Auto | — |
| `user_id` | UUID (User ref) | Yes | — |
| `monthly_income` | Integer | Yes | PKR, > 0 |
| `monthly_expenses` | Integer | Yes | PKR, > 0 |
| `current_savings` | Integer | Yes | PKR, ≥ 0 |
| `current_investments` | Integer | Yes | PKR, ≥ 0 |
| `expected_return_rate` | Float | Yes | 0.01 - 0.50 (1% - 50%) |
| `inflation_rate` | Float | Yes | 0.01 - 0.50 |
| `withdrawal_rate` | Float | Yes | 0.02 - 0.06 (2% - 6%) | Default: 0.035 |
| `target_fire_date` | ISO 8601 Date | No | Optional goal date |
| `updated_at` | ISO 8601 DateTime | Auto | — |

### 1.3 Portfolio Holding (Phase 1 — skeleton for reference)

| Field | Type | Required | Constraints |
|---|---|---|---|
| `id` | UUID v4 | Auto | — |
| `user_id` | UUID (User ref) | Yes | — |
| `asset_type` | Enum | Yes | `equity`, `mutual_fund`, `gold`, `property`, `savings_cert`, `cash` |
| `name` | String | Yes | e.g., "MIIETF", "LUCK", "DHA Phase 9 Plot" |
| `quantity` | Float | Yes | Units/shares/tolas/sqyds |
| `purchase_price` | Float | Yes | Per unit in PKR |
| `purchase_date` | ISO 8601 Date | Yes | — |
| `current_price` | Float | No | Auto-updated via MCP (equities/MF) or manual (property) |

---

## 2. API CONTRACT (Phase 0)

**Base URL:** `/api/v1`
**Auth:** Bearer token (JWT)
**Error format:**
```json
{"error": "error_code", "message": "Human-readable description"}
```

### 2.1 Authentication

#### Register
`POST /api/v1/auth/register`
```json
// Request
{
  "name": "Shah G",
  "email": "shah@example.com",
  "password": "min8chars",
  "currency": "PKR",
  "city": "Islamabad"
}
// Success: 201 → { "id": "uuid", "token": "jwt..." }
// Errors: 400 (validation), 409 (email exists)
```

#### Login
`POST /api/v1/auth/login`
```json
// Request
{ "email": "shah@example.com", "password": "min8chars" }
// Success: 200 → { "token": "jwt...", "user": { ... } }
// Errors: 401 (invalid credentials)
```

### 2.2 FIRE Calculator

#### Calculate FIRE Projection
`POST /api/v1/fire/calculate`
```json
// Request
{
  "monthly_income": 150000,
  "monthly_expenses": 80000,
  "current_savings": 500000,
  "current_investments": 2000000,
  "expected_return_rate": 0.10,
  "inflation_rate": 0.15,
  "withdrawal_rate": 0.035
}
// Success: 200
{
  "savings_rate": 0.467,
  "fire_number": 27428571,
  "years_to_fire": 14.3,
  "current_progress_pct": 9.1,
  "fire_date_estimate": "2040-06",
  "monthly_investment_needed": 70000,
  "projections": {
    "5_year": 4521000,
    "10_year": 12340000,
    "15_year": 24500000,
    "20_year": 45000000
  }
}
```

**This endpoint is DETERMINISTIC — no AI model call. Pure math. Works offline.**

---

## 3. FIRE CALCULATOR — FORMULAS

### 3.1 Savings Rate
```
savings_rate = (monthly_income - monthly_expenses) / monthly_income
```

### 3.2 FIRE Number
```
annual_expenses = monthly_expenses × 12
fire_number = annual_expenses / withdrawal_rate
```

### 3.3 Years to FIRE (Simplified)
```
Required corpus = fire_number
Current corpus = current_savings + current_investments
Monthly contribution = monthly_income - monthly_expenses
Real return rate = (1 + expected_return) / (1 + inflation) - 1

Years = logarithmic FV calculation accounting for:
  - Starting corpus compounding at real return rate
  - Monthly contributions compounding at real return rate
  - Target = fire_number in today's PKR (inflation-adjusted)
```

### 3.4 CGT Calculation
```
gain = (sale_price - purchase_price) × quantity
holding_days = sale_date - purchase_date

if holding_days < 365: rate = 0.15
elif holding_days < 730: rate = 0.125
elif holding_days < 1095: rate = 0.10
elif holding_days < 1460: rate = 0.075
else: rate = 0.0

tax = gain × rate (only if gain > 0; losses have separate treatment)
```

---

## 4. ACCEPTANCE CRITERIA (Phase 0)

- [ ] `docker compose up` starts FastAPI + PostgreSQL + Redis without errors
- [ ] `GET /api/v1/health` returns `{"status": "alive", "version": "0.1.0"}`
- [ ] `POST /api/v1/auth/register` creates user and returns JWT
- [ ] `POST /api/v1/auth/login` returns JWT for valid credentials, 401 for invalid
- [ ] `POST /api/v1/fire/calculate` returns correct FIRE projection
- [ ] FIRE calculator test: income 150K, expenses 80K → savings_rate = 0.467
- [ ] FIRE calculator test: expenses 80K/mo, SWR 3.5% → fire_number = 27,428,571
- [ ] CGT test: bought at 25.50, sold at 32.00, 1000 shares, held 250 days → tax = 975
- [ ] CGT test: same scenario held 800 days → tax = 812.50 (12.5% rate)
- [ ] CGT test: held 1500 days → tax = 0 (0% rate)
- [ ] All endpoints return 401 without Bearer token
- [ ] `ruff check .` passes with zero warnings
- [ ] `pytest` passes all calculator tests
- [ ] Git repo has `main` and `dev` branches

---

## 5. WHAT THIS SPEC DOES NOT COVER (Future Phases)

- Phase 1: Advisory engine, persona routing, portfolio input
- Phase 2: MCP servers, market data, budget import
- Phase 3: RAG, council debate, daily briefing, tax calculator
- Phase 4: Mobile app, desktop app, push notifications
- Phase 5: Urdu support, voice, document scanning
- Phase 6: Beta, SECP review, launch

Each phase gets its own SPEC.md section when development begins.

---

*SPEC.md is the build instruction. CLAUDE.md is the project vision. Read CLAUDE.md to understand WHY. Read SPEC.md to know WHAT to build and HOW to verify it.*
