# Rahnuma SABRE — Principles XV + XVI

## XV. Delivery-First Validation

Before any spec proceeds past §0, this table MUST be filled and cited by /sp.plan:

| Question | Answer |
|---|---|
| Where used? | Phone (primary) + laptop browser (secondary). At home, office, or commute. Both hands usually free. |
| Network? | Home WiFi or mobile data. Internet REQUIRED for live market data (PSX prices, forex rates). Offline for portfolio viewing + historical analysis. |
| Data source? | Manual entry (holdings, purchases) + PSX API for live prices + SBP for forex/rates. No OCR. No camera. |
| Output? | Screen (charts, portfolio view). Optional: PDF export for tax filing, WhatsApp share of portfolio summary to advisor/family. |
| User's hand? | Seated, scrolling. Touch on phone, keyboard on laptop. |
| Primary LLM? | DeepSeek V4 Flash via OpenRouter (analysis, Q&A about portfolio, news summarization). |
| Offline req? | SOFT. Portfolio viewing + historical charts must work offline. Live prices need network (acceptable — user expects this). |

VIOLATION: Building features that require internet for viewing already-fetched portfolio data. Live market feed needing network is expected and acceptable. Locking the user out of their own holdings data because a server is down is a Principle XV violation.

## XVI. Model Selection (Financial)

1. **DeepSeek V4 Flash via OpenRouter (primary)** — portfolio analysis, news summarization, "should I rebalance?" reasoning. Per PIAIC guidance. Cheapest high-quality option.
2. **Kimi K2.6 / GLM 5.1 (fallback)** — if DeepSeek quota exhausted.
3. **Gemma 4 E4B on-device (offline)** — basic Q&A about user's portfolio when no internet. Limited but functional.
4. **NO financial advice framing** — every LLM response prefixed with "Information only, not investment advice" per SECP compliance. LLM never says "buy" or "sell" — it says "based on your criteria, these options match."

Development tooling (not shipped): HERMES + DeepSeek V4 Flash, Gemini 3 Free for planning.
