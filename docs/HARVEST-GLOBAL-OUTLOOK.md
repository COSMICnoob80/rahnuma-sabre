# Pattern Spec — Global Markets Outlook Briefing (bounded harvest)

**Target of harvest:** one pattern — *how the world's best-known market app turns global
real-time data into a daily readable outlook page*. NOT a clone of Investing.com,
NOT a trading tool. This feeds a feature decision only.

**Harvest channel: 2 — public documentation.** Evidence from Investing.com's App Store
listing, Google Play listing, and mobile landing page (fetched 2026-10-19). All findings
labeled `[docs]`. No binary/de-compilation evidence anywhere in this file.

---

## What the reference does (evidence, condensed)

1. `[docs]` 300,000+ instruments across stocks, ETFs, indices, **commodities (gold, silver, oil, gas), currencies (170+ FX pairs), bonds & yields, futures** — global coverage in ONE screen architecture.
2. `[docs]` Economic calendar with impact levels (Fed/ECB decisions, GDP, CPI) — the "why today moves" layer.
3. `[docs]` News & analysis feeds personalized to the user's portfolio.
4. `[docs]` **WarrenAI — an AI research assistant** ("turn market data into clear trading insights", "natural-language questions"). A competitor has already normalized "AI summarizes markets" — but as a *trading insight engine*, in English, cloud, paid tier.

## Where every current player stands (evidence)

| Player | Global data | Outlook/summary layer | Urdu | Contract |
|---|---|---|---|---|
| Investing.com | `[docs]` 300k+ instruments | Statement AI chart analysis + news | no | insight/trading-oriented |
| AlphaGen (PSX) | none — PSX-only scoring | model scores + narratives | no | algorithmic signal disclaimers |
| Finqalab (PSX) | none in listings reviewed | news + research desk picks | no | brokerage-adjacent |
| Mahaana | funds/retirement manage | human-written education | partial | licensed advisor (different lane) |
| **Rahnuma (planned)** | **planned: intl indices, commodities, FX, yields + KSE** | **attributed narrative outlook** | **yes (Nastaliq + Roman)** | **never-advice, facts-first** |

## The gap this harvest unlocks

`[docs]` No player with global coverage speaks Urdu to Pakistani retail investors;
no player with an Urdu voice has a written never-advice contract. The unlock is
**the Urdu market-morning page**: one screen that says what moved globally overnight and
*why the public record says it moved*, attributed, without a single forecast sentence.

## Adopted pattern for the AR global outlook card, and the ground rules

- **Adopt:** instrument chip row (value + delta + freshness label) for: KSE-100, S&P 500, NASDAQ, gold (XAU), Brent, PKR/USD, and Pak 6M T-bill yield.
- **Adopt:** economic-calendar thinking *as narrative attribution* — "Fed minutes land Thursday" is a fact; "market will do X" is banned by our red line.
- **Adopt:** AI summary slot — but ours renders the persona council's *reading of the public record*, attributed per persona, and carries a visible "Context, not forecast" chip. Horizons (short/medium/long) group *context*, never targets.
- **Adopt:** one-screen, morning-first; fresh quote labeling reused from the briefing engine path.
- **Excluded:** alerts pushed to trades, chart drawing tools, screener/funnelClaude surfaces, anything pushing a transaction — anti-patterns per `docs/HARVEST-FINQALAB-UI.md` and WHY.md.

## Acceptance criteria (for the future build)

- [ ] Every instrument row shows value + delta + freshness; no stale-unknown values.
- [ ] Outlook paragraphs are attributed ("the council notes…") and carry the pinned "Context, not forecast" chip.
- [ ] bilingual: EN primary, Urdu accent line + Roman Urdu subline per section.
- [ ] Red-line pass: zero occurrence of "will rise", "will fall", "buy", "sell", "target price".
- [ ] Works with the existing no-key profile: chips + facts render without a key; persona summary renders only when a key is present.

## Evidence table

| Finding | Source | Channel |
|---|---|---|
| 300k+ instruments incl. commodities/bonds/FX | Investing.com Google Play + App Store listing | public docs |
| WarrenAI NL assistant | Investing.com Google Play listing | public docs |
| Economic calendar impact levels | Investing.com App Store listing | public docs |
| Competitor outlook contracts (signal/insight framing) | alphagenpro.com + finqalab listings (prior harvest) | public docs |
| Absence of Urdu global market coverage | all listings reviewed 2026-10-19 | public docs (absence) |
