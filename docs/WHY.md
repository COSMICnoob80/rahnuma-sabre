# WHY — Rahnuma Sabre Product Charter

**One sentence (the North Star):**
> A private, offline, Urdu mirror of your money: it shows you reality — correct math, real
> numbers, what your habits already imply — and refuses to gamble with it.

This file is the vector every future decision checks against. Feature requests that move
toward it are in scope. Anything that moves toward feature parity with cloud
research/signal apps (AlphaGen, Finqalab, PSX Terminal) is out of scope.

---

## The flagship scenario: the Panic Day Briefing

The product exists for this moment, precisely constructed from a real user experience
(kept anonymized because this repo is public):

> A salaried retail investor has a routine: one fixed amount into the same ETF every
> month, on autopilot. One morning the index opens sharply down and social media is in
> full panic. They lie there before a shift with a decision splitting them in two —
> stick to the plan, or pause it? Frontier models give them a committee of
> investing-legend personas; the advice is eloquent, generic, and **does not know their
> actual budget, their average cost, or their plan** — so the anxiety survives the chat
> log. Stagnation, decision paralysis.

What Rahnuma answers on that morning — facts, never a forecast:

1. **The price, and only the price, fresh from the feed** — labeled with freshness.
2. **The plan, restated:** what the user's own budget says they can put in this month
   (a math fact from their expense history, not advice).
3. **The mechanics, not the prediction:** what a fixed monthly amount does in a falling
   market — more units for the same rupees, by definition of how a fixed-amount purchase
   works. No "will it go lower" — that question gets a boundary, not an opinion:
   *"Rahnuma will never guess the market's direction. Here is what your plan already
   assumed."*
4. **The streak:** months of consistency, shown as evidence the user already knows how
   to do this.
5. **The calm contract:** every card prefixed with the disclaimer and the red lines.

Acceptance test: **a user walks in mid-panic and leaves with zero directional claims and
a complete statement of their own situation, in Urdu, in under a minute, offline-capable
except for the live quote.**

---

## Why an app and not a frontier-model chat (standing thesis)

- **Grounding:** the chat narrates the real on-device ledger; a frontier model invents yours.
- **Correctness:** tax/FIRE/SIP math is deterministic, unit-tested code (Finance Act 2025
  CGT structure). Models are least reliable exactly where money lives: slabs, dates, rates.
- **Persistence:** state survives — a chat session forgets everything by Tuesday.
- **Privacy:** portfolio never leaves the phone. No pasting your financial life into a cloud.
- **Access:** free-tier BYOK, Urdu-first, low bandwidth, no dollar card required.
- **Contract:** no buy/sell sells — a boundary neither frontier models nor signal apps offer.

Persona prompting (Buffett/Burry/Lynch voice) is a free-to-copy trick that produces
**ungrounded theater**. Rahnuma already ships it in-app — as garnish. The ledger and the
math engine are the meal. If the ledger dies, we are a ChatGPT wrapper and the thesis fails.

## Where not to go

- No reverse-engineering spree. One bounded harvest on ONE reference target, channel-first
  (published protocol → public docs → REA decompile), features-only, per the
  feature-harvesting policy. Cloning kills the moat (`competitive_analysis.md`).
- No signals, no predictions, no "cheaper AlphaGen."
- No cloud sync, no accounts — until beta retention data justifies it.
