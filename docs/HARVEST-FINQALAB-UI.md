# Pattern Spec — Finqalab UI (bounded harvest)

**Target of harvest:** one pattern only — *how a polished Pakistani fintech app presents
market stress information on a morning screen*. NOT a clone of the app.

**Harvest channel: 2 — public documentation.** Evidence from finqalab.com, the Google
Play listing and the Apple App Store release notes (fetched 2026-10-19). No binary
decompilation occurred; every finding below is from published listings and is labeled
`[docs]`. Nothing here is decompilation evidence.

**Where this pattern goes:** the Panic Day Briefing screen (see `docs/WHY.md`, flagship
scenario). Our product refuses trading flows; the harvest is chrome patterns only.

---

## Findings

1. **[docs] Status-first chrome.** Finqalab's headline commitments — "Live Market Data",
   "stay ahead of the game", order book depth "so you always know what the market looks
   like before you trade" — all resolve to the same pattern: the user's first glance is
   *market state*, and analysis follows beneath it. **Adopted for our briefing:** the
   alert bar leads (index move + live quote), cards follow.
2. **[docs] Single-glance benchmarking.** "Market Benchmarking: compare your performance
   growth against the KSE 100 and KMI 30 indices." The pattern is *your line vs the
   index line*, one screen, no drilldown. **Adopted:** our DCA table shows "last month's
   units vs today's units" as the two-row comparison — same glanceability, no advice.
3. **[docs] Flown-to-completion flows.** "No screenshots required" (payments),
   "all without leaving the app" — the polish signal is *no copy-paste or camera-hop
   steps*. **Adopted:** the briefing is one screen, one pass: price → plan → mechanics →
   streak → contract; no navigation during a panic moment.
4. **[docs] Release cadence as polish evidence.** App Store version history shows
   incremental depth (MBP order book → benchmarking → dividend insights) roughly
   biweekly. **Learning for us:** depth arrives after the core loop ships — do not design
   the briefing to answer everything on day one.
5. **[docs] What Finqalab will never do (our lane).** Nothing in any listing promises
   calm, privacy, or an advice *boundary* — every promise is closer to action
   (order placement, alerts, research-desk picks, "Juice List"). **Adopted as the
   differentiator:** the briefing's closing bar states the no-advice contract in writing.

## Anti-patterns excluded from harvest (explicit non-goals)

- Order placement / order book / Market-By-Price depth — we never trade.
- Research-desk vetted picks ("Juice List") — that is the signal tower we refuse to be.
- Digital onboarding and payments — out of scope entirely.
- "Real-time" continuity of alerts — our freshness model labels staleness honestly
  instead of claiming liveness.

## Acceptance criteria for the briefing built from this pattern

- [ ] Alert bar leads with index move + quote + freshness label; no gesture needed to see state.
- [ ] One-screen, single pass; no mid-panic navigation steps.
- [ ] Two-row units comparison renders without any directional language.
- [ ] No-advice contract visible verbatim at the bottom of the screen.
- [ ] Zero trading verbs in the whole screen copy.

## Evidence table

| Finding | Source | Channel |
|---|---|---|
| Status-first chrome, MBP wording | Apple App Store listing v4.0.6 release notes | public docs |
| Market Benchmarking pattern | Apple App Store listing v4.0.5 release notes | public docs |
| Flown-to-completion wording | finqalab.com homepage + Play listing | public docs |
| Release cadence | App Store version history | public docs |
| No commitment to calm/privacy/boundary | All listings reviewed, 2026-10-19 | public docs (absence) |
