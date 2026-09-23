# Beta Launch Post — r/FIREPakistan

Draft. Post only after the beta build is installable and the free-tier keys work end to end.

---

## Title options

1. I built a free AI financial advisor for PSX investors — it refuses to tell you what to buy
2. Every PSX app wants to sell me a trade. I built the opposite and I'm giving it away
3. Doctor by day, vibe-coder by night: an AI advisor for your PSX portfolio (free beta)

**Recommendation:** option 1. It states the differentiation in the title, and the refusal to
give buy/sell calls is the thing this subreddit will actually argue about — which is the point.

---

## Body

> Salaam everyone. Long-time lurker.
>
> Every PSX app I tried does one of two things: it tracks prices, or it wants me to trade.
> Neither one tells me whether my actual situation makes sense. So I built the thing I wanted.
>
> **What it does**
> - Put in your holdings (ticker, quantity, buy price, date) and your monthly income/expenses.
> - Ask it anything: "what's my CGT if I sell this?", "how long to FIRE at this savings rate?",
>   "what happens to my portfolio if the rupee drops 20%?"
> - It answers using *your* numbers, in English or Urdu, and shows the arithmetic.
>
> **What it refuses to do**
> - It will not tell you to buy or sell. There's a filter in the code that catches the model
>   if it tries. It maps things against your stated goals instead.
> - It doesn't touch your brokerage account. No logins, no broker emails, no scraping.
> - Everything stays on your phone. No account, no server, no signup.
>
> **The tax calculator is the part I'm most careful about**
> CGT in Pakistan now depends on *when you bought*, not just how long you held — flat 15% for
> anything bought on/after July 2024, with older acquisitions on the legacy slabs. Most
> calculators I've seen still use the old rates. Mine asks for the purchase date.
>
> **Cost:** free. You add your own API key (Gemini and Groq both have free tiers — takes two
> minutes) or you can use the calculators with no key at all. I'm not paying for inference and
> neither are you.
>
> **What I want from you:** break it. Especially the tax numbers — if you know CGT better than
> me, tell me where it's wrong, because I'd rather find out from you than from an FBR notice.
>
> Not investment advice, just arithmetic and opinions. APK in the comments.
>
> [screenshots: portfolio, CGT with the new rate, FIRE projection, an Urdu answer]

---

## Pre-launch checklist

- [ ] Beta APK builds and installs on a clean device.
- [ ] First-run with no API key: calculators and portfolio work, advisory explains how to add one.
- [ ] Add a free Gemini key → advisory answers → shows the persona badge.
- [ ] Without internet: portfolio, budget and calculators still work; advisory degrades gracefully.
- [ ] CGT spot-check against a real broker contract note.
- [ ] `docs/TAX-RULES.md` caveats reflected in the CGT card caveat line.
- [ ] Reply plan ready: answer every critical comment within the first hours.

## What to measure (this is the pitch evidence)

- Installs → users who add a holding (activation).
- Users who return on day 3 and day 7 (retention).
- Advisory questions asked per active user, and how many are follow-ups.
- Which persona the router picks most often — that tells you which need is real.
