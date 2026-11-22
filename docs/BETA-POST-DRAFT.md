# r/FIREPakistan beta post — DRAFT (for founder's final yes)

**Title:** Built an on-device PSX portfolio ledger — no account, no cloud, works offline (open source, MIT)

**Post body:**

After months of building between hospital shifts, sharing the tool here first.

**What it is:** Rahnuma SABRE — a private portfolio ledger for PSX investors that runs entirely on your phone. No signup, no cloud, no server — your holdings live in a local database, and nothing leaves your device.

**What it does:**
- Track PSX holdings with a searchable ticker picker (KSE-100 + top movers + all 9 listed ETFs, pulled from the exchange's own data portal)
- Live NAV vs price gap on ETF holdings (iNAV from PSX DPS — the gap is shown as information, never as a trade signal)
- Import bank statements / FBR text exports by file — multi-file batch with dedupe
- Portfolio X-ray: weights, top-5 concentration, HHI, sector split — computed from YOUR ledger only
- A Command Center screen: local + global markets (KSE-100, S&P 500, gold per tola from PMEX, Brent, USD/PKR) with freshness labels — if a feed is stale, it says stale
- A council of famous investors commenting on the day's market state — with hard-coded bans: it will never print a price target, a rating, or a "you should"
- FIRE math that refuses to fabricate targets when you haven't entered expenses

**What it will never do:** tell you to buy or sell. It shows your plan, the facts, and the prices — decisions stay yours.

**For the privacy-minded:** the repo is MIT-licensed, every build is a public GitHub release with a recorded sha256, and the source is readable. The embedded AI key ships inside the beta APK by design (owner's own key); bring-your-own-key is supported in Settings and production builds switch to BYOK-only.

**Screenshots attached:** [1] Command Center (fused strip + PMEX board), [2] Portfolio with NAV gap line, [3] Compare chart (KSE-100 vs global, normalized), [4] Costs screen (PKR 0 vs advisory seats).

**Honest limits:** Android-only beta APK for now. 258 tests green, but the test suite is stronger than my user base — that's why I'm here. Feedback wanted on everything: UX, features, what's missing, what's annoying.

Repo + releases (install the Latest APK): https://github.com/COSMICnoob80/rahnuma-sabre/releases

Rahnuma will never tell you to buy or sell. It just shows you what's real.

---

**Posting notes (playbook):**
- Attach 4 screenshots (phone captures, real numbers visible)
- Reply to every comment within the first 2 hours; answer questions, never pitch
- Do NOT cross-post or DM anyone about it
- Timing: Thursday ~20:00–21:30 PKT (community activity window from the SIGINT ledger)
- If a mod asks for rule-compliant edits: comply instantly, no debate
