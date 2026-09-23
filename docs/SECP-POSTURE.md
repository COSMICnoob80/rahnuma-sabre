# Regulatory Posture

This note exists so the question "are you a licensed advisor?" has a prepared, honest answer
before anyone asks it.

---

## What SABRE is, in regulatory terms

SABRE is an **educational and record-keeping tool**. It:

- does not execute, route, or transmit any trade or order;
- does not hold, custody, or move client money or securities;
- does not manage anyone's assets or act on anyone's behalf;
- does not charge for personalised investment advice;
- recommends nothing. It explains, calculates, and shows the arithmetic behind both.

Under SECP's framework, the licensing triggers sit around **investment advice**, **asset
management**, **robo-advisory** services, and **brokerage**. SABRE is designed to sit outside
all four: it is a calculator plus a conversational explainer operating on data the user
enters themselves.

## How that design is enforced in code, not just in a disclaimer

The commitment is worthless if it is only a paragraph in a prompt. In this codebase:

- `src/services/personaService.ts` contains `enforceNoDirective()`, which scans every model
  reply for directive phrasing ("you should buy", "I recommend selling", "strong buy", …)
  and appends an explicit correction when it appears. This is covered by tests.
- Every system prompt carries the same prohibition, so the model is instructed *and* checked.
- The app has no order-entry surface at all, and no brokerage credentials are collected.
- All user financial data stays in on-device SQLite. Nothing is transmitted except the
  context needed for a single advisory question, sent to the provider the user configured
  with the user's own key.

## Data protection

Pakistan's data-protection legislation remains unsettled, which makes on-device storage the
safest posture available: there is no server-side database of user finances to breach. Any
future hosted feature must revisit this note.

## What would change the analysis

The posture would need review if any of the following were added:

1. Model-generated, user-specific buy/sell recommendations.
2. Any custody of funds or securities, or order placement.
3. Charging for advice rather than for software.
4. Managed portfolios or discretionary authority.
5. Aggregated user data sold or shared.

None of these are in the roadmap. If one is ever proposed, get legal review first.

## Standing disclaimer

> Information only, not investment advice. Consult a SECP-registered advisor for decisions.
