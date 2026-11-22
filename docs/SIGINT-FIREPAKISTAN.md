# SIGINT — r/FIREPakistan Builder-Post Recon + Posting Playbook

**Target of recon:** the posts where people showcase a financial app / agent / tool they built and
pitch the community for feedback — what got traction, what got ignored, what the mods allow, and
what that means for Rahnuma's eventual post.

**Method:** public pages only, no logins. Live reddit is bot-walled from this host, so every thread
row below was read from a **Wayback replay** of the real thread HTML (`shreddit-post` tag for
score / comment-count / author / created-timestamp; JSON-LD comment blocks for quotes). Traction
counts are therefore **as of the capture timestamp shown in the row**, not live. Rows I could not
open are labelled `index-only` and I do not state their contents.

**Live-wall status (measured 2026-11-22, ~10:5x UTC, this host):**

| URL | Status | Note |
|---|---|---|
| `https://www.reddit.com/r/FIREPakistan/` | 200 · 8,412 B | JS "Prove your humanity" shell — **0 posts in body** |
| `https://www.reddit.com/r/FIREPakistan/new/` | 200 · 8,416 B | same shell |
| `https://www.reddit.com/r/FIREPakistan/top/?t=all` | 200 · 8,416 B | same shell |
| `https://www.reddit.com/r/FIREPakistan/about/rules/` | 200 · 8,420 B | same shell — **no rule text rendered** |
| `https://www.reddit.com/r/FIREPakistan/new.json?limit=100` | 403 · 189,908 B | Cloudflare block page |
| `https://api.reddit.com/r/FIREPakistan/new?limit=100` | 403 · 189,908 B | same |
| `https://old.reddit.com/r/FIREPakistan/new.json?limit=100` | 403 · 189,908 B | same |
| `https://www.reddit.com/r/FIREPakistan/.rss` | 404 · 266 B | RSS route dead |
| `https://www.reddit.com/svc/shreddit/community-more-posts/new/?name=FIREPakistan` | 403 · 189,908 B | shreddit feed API blocked |
| `https://r.jina.ai/https://www.reddit.com/r/FIREPakistan/new/` | 200 · 477 B | body is "Target URL returned error 403" — proxy adds nothing |
| `https://pholder.com/r/firepakistan/` | 000 · 0 B | unreachable |
| `https://safereddit.com/r/FIREPakistan` | 200 · 4,353 B | Anubis "Verifying your browser" wall |
| `https://redlib.catsarch.com/r/FIREPakistan` | 429 · 2,424 B | rate-limited |
| `https://redlib.perennialte.ch/r/FIREPakistan` | 403 · 5,784 B | Cloudflare challenge |
| `https://redlib.privacyredirect.com/r/FIREPakistan` | 403 · 2,679 B | Cloudflare challenge |
| `https://redlib.nadeko.net/r/FIREPakistan` | 418 · 2,927 B | teapot / blocked |
| `https://api.pullpush.io/reddit/search/submission/?subreddit=FIREPakistan` | 429 · 191 B | "does not provide free scraping resources for agents" |
| `https://teddit.net/r/FIREPakistan` | 000 · 0 B | unreachable |

**Consequence:** the live subreddit was not readable. Everything below that is not a Wayback URL is
a product/news page, fetched live. No claim in this doc rests on a Reddit page I did not open.

---

## 1. Builder-post ledger

`up / cm` = score and comment-count as rendered in that replay. `mod` = post-level removal seen in
the capture (none seen; one *comment* removal noted in row 6).

| # | Post (title verbatim) | Author | Posted (PKT) | up / cm | Tool type | One-line pitch | mod | Source |
|---|---|---|---|---|---|---|---|---|
| 1 | **Built my own PSX Portfolio Tracker in Google Sheets** | u/AdventurousHat7255 | Thu 2025-02-06 21:56 | **33 / 38** | Google Sheet + Apps Script scraping PSX DPS; screenshot only, **no link in the post** | "built my portfolio tracker in Google Sheets by scraping data directly from the PSX data portal… would love input" | — | [archive 200](https://web.archive.org/web/20250208111113/https://www.reddit.com/r/FIREPakistan/comments/1ij79s8/built_my_own_psx_portfolio_tracker_in_google/) · [live 200 shell · 8,429 B](https://www.reddit.com/r/FIREPakistan/comments/1ij79s8/) |
| 2 | **PSX Portfolio Tracker Link** | u/AdventurousHat7255 | Fri 2025-02-07 21:59 | 14 / 2 | same sheet, now a "Make a Copy" Google link | "a stripped-down version of the tracker I mentioned in my post yesterday" — the deliberate **day-2 link drop** | — | [archive 200](https://web.archive.org/web/20250208111113/https://www.reddit.com/r/FIREPakistan/comments/1ijzqko/psx_portfolio_tracker_link/) · [sheet copy 200](https://docs.google.com/spreadsheets/d/1KwoAT-pWInqGFh8z9PW2_-AaTPkNcVGIEsRskYnMMBI/copy) |
| 3 | **KSE100 Market Breadth DashBoard** | u/More_Confusion_1402 | Thu 2025-02-13 19:40 | **30 / 3** | Heroku web dashboard, 4 charts (candles, %above 20DMA, %above 200DMA, NHNL) | "since there are no available market breadth indicators for KSE100 anywhere i decided to create them myself" | — | [archive 200](https://web.archive.org/web/20250310042031/https://www.reddit.com/r/FIREPakistan/comments/1iokhr8/kse100_market_breadth_dashboard/) · [Heroku link now 404](https://nameless-springs-31832-d6c0430394e1.herokuapp.com/) |
| 4 | **KSE100-MarketBreadth-Dashboard- Updated** | u/More_Confusion_1402 | Tue 2025-02-18 17:20 | 8 / 3 | same, v2: live 6 pm refresh, two themes, hover | "after overwhelming positive response to my previous post… I decided to improve the aesthetics" | — | [archive 200](https://web.archive.org/web/20250224160955/https://www.reddit.com/r/FIREPakistan/comments/1isbfgd/kse100marketbreadthdashboard_updated/) · [Heroku link now 404](https://kse100-market-breadth-26fba53a4a58.herokuapp.com/) |
| 5 | **KSE100 Dashboard Explained** | u/More_Confusion_1402 | Sun 2025-02-23 09:53 | 15 / **19** | tutorial for the same dashboard | "quite a few people have difficulty understanding it so i will try my best to explain it" | — | [archive 200](https://web.archive.org/web/20250224160955/https://www.reddit.com/r/FIREPakistan/comments/1iw2c5z/kse100_dashboard_explained/) |
| 6 | **Created a Portfolio Tracker!** | u/Huzaiifaaaa | Wed 2025-04-23 21:40 | 13 / 7 | image post (i.redd.it), **no body, no link** | title only + screenshot | post survived; **1 comment removed by moderator** | [archive 200](https://web.archive.org/web/20250424020811/https://www.reddit.com/r/FIREPakistan/comments/1k63t2k/created_a_portfolio_tracker/) |
| 7 | **Tools designed for real estate investors and those who are looking to manage their finances more effectively.** | u/Striking-Quantity661 | Thu 2024-11-13 04:15 | **1 / 0** | crosspost, no body | marketing sentence, no artifact | — | [archive 200](https://web.archive.org/web/20241117010040/https://www.reddit.com/r/FIREPakistan/comments/1gqqk3a/tools_designed_for_real_estate_investors_and/) |
| 8 | **[IDEA] Create AI Interface/website to file Easy Return** | u/Mammoth-Molasses-878 | Tue 2024-10-22 11:00 | 4 / 8 | idea, not a build | "train an AI model using relevant laws… from the FBR" | — | [archive 200](https://web.archive.org/web/20250802025515/https://www.reddit.com/r/FIREPakistan/comments/1g9b9uc/idea_create_ai_interfacewebsite_to_file_easy/) |
| 9 | **🌟 Help Us Shape a Free Personal Finance Course for Pakistan! 🌟** | u/Sorry_Inflation_879 | Fri 2024-11-15 08:10 | 10 / 2 | content project, anonymous "we" | "We're creating a completely free personal finance course" | — | [archive 200](https://web.archive.org/web/20241119051425/https://www.reddit.com/r/FIREPakistan/comments/1grmvss/help_us_shape_a_free_personal_finance_course_for/) |
| 10 | **Gold vs KSE100 vs MSF vs Real Estate (ChatGPT)** | u/sonia_chastised | Fri 2025-03-21 22:06 | 6 / 8 | LLM output posted as analysis | a ChatGPT answer comparing four assets over 20 years | — | [archive 200](https://web.archive.org/web/20250322200529/https://www.reddit.com/r/FIREPakistan/comments/1jglu37/gold_vs_kse100_vs_msf_vs_real_estate_chatgpt/) |
| 11 | *"I built a free, ad-free tool to track your PSX portfolio — introducing psxworth.com!"* | u/OkSea9637 (per index snippet) | Jul 2025 | **not reachable** | web app, AI statement parsing | free/ad-free portfolio tracker | **unknown** | `index-only` — title/author/date from a Pholder search snippet quoted in the prior run's log; **thread body never opened**. Product page [200](https://psxworth.com/) · [GitHub 200](https://github.com/Wajahat43/psxworth) |

Ten threads opened and verified; row 11 is explicitly index-only.

### Verbatim reception (quoted from the replays)

- Row 1 reply (1 up): *"My brokers app does the same for me. There is no need to reinvent the wheel."*
- The most technical reply in the set was about craft (row 5 thread): *"How are you getting data feeds? As a developer myself I had to find unofficial way to grab TradingView and Investing.com feeds"*.
- Row 3: *"Phenomenal work"*.
- Row 4 (the update): *"I do not want to disappoint you or anything, you probably did a good job and kudos on your efforts. But when i am opening on laptop its just showing this:"* + broken screenshot.
- Row 8 (AI tax idea): *"Sounds like a good idea on paper but this is simply not how the current AI language models work."* and *"It doesn't really solve any problem… the Khuari you'll have to go through when AI makes a mistake."*
- Row 9 (anonymous "we"): *"Who are WE?"* (6 up) — the only substantive reply.
- Row 10 (ChatGPT analysis): *"comparing gold with anything at the peak of the gold bull run is disingenuous."*
- Row 5, the community's most-loved builder, writes **directional advice in his own post**: *"You can just buy when the PSTH line goes into oversold territory… You can trim your positions when the PSTH line goes into overbought territories."*

### Demand-side evidence (not builder posts — tells you what people ask for)

| Thread | Posted | up / cm | What it says |
|---|---|---|---|
| [Best free portfolio tracker for PSX?](https://web.archive.org/web/20241208232223/https://www.reddit.com/r/FIREPakistan/comments/1g2hm7s/best_free_portfolio_tracker_for_psx/) · 200 · 1,070,042 B · live 200 shell | 2024-10-13 | 5 / 16 | *"Sarmaaya has shut down the portfolio service. What's the alternative now? All my investment data on Sarmaaya app is wiped out."* Reply: *"Pakistanis are cheap, they're not gonna pay for an app… It's what? 1000 a month?"* |
| [App to track all investments](https://web.archive.org/web/20250803220659/https://www.reddit.com/r/FIREPakistan/comments/1fx531s/app_to_track_all_investments/) · 200 · 1,108,480 B · live 200 shell | 2024-10-06 | 1 / 14 | Sarmaaya priced "5000 PKR per month… Only good for you if you have 1+ crore." |
| [app or excel sheet for investment tracking](https://web.archive.org/web/20250731221117/https://www.reddit.com/r/FIREPakistan/comments/1jgen3x/app_or_excel_sheet_for_investment_tracking/) · 200 · 1,103,425 B · live 200 shell | 2025-03-21 | 3 / 17 | *"i want something local which can ideally get latest data from psx mutual fund NAV price automatically"*; *"an app is only good if it lets you export data later in a legible format, otherwise you'll be locked in"* |
| [Portfolio tracker for psx](https://web.archive.org/web/20250219193207/https://www.reddit.com/r/FIREPakistan/comments/1e12342/portfolio_tracker_for_psx/) · 200 · 902,235 B · live 200 shell | 2024-07-11 | 2 / 3 | users name iinvest / Investify / pkfinance as the current options |

Those four are the pitch the community has already written for us: **free, local, exportable,
auto-NAV**. That is not a guess about taste; it is the exact sentence three separate posters typed.

---

## 2. Community taste summary

**Earns love.**
1. **A real artifact, shown working.** The two top posts are the sheet (33/38, screenshot first)
   and the breadth dashboard (30/3, live link first). Both led with the thing itself.
2. **Filling a gap the poster can name.** *"since there are no available market breadth indicators
   for KSE100 anywhere"* — a specific absence, not "revolutionising investing".
3. **Teaching, not just shipping.** The explainer post got **19 comments on 15 upvotes** — the
   highest comment ratio of the set. The update post, which only said "I improved it", got 3.
4. **Craft talk.** The only deep thread on the tracker is about *how he gets the data*.
5. **Free + no ads + local.** Every price complaint in the demand threads is aimed at Sarmaaya's
   ~PKR 1,000–5,000/month tiers.

**Earns silence.**
1. **Crossposts with no body.** Row 7: 1 up, 0 comments. The title was a marketing sentence.
2. **Ideas without anything built.** Row 8 got engagement, but all of it was "this won't work".
3. **Anonymity.** Row 9's only real reply was *"Who are WE?"*

**Earns removal.**
1. **Solicitation in comments.** Row 6 has a live *"Comment removed by moderator"* under a
   `[deleted]` author. Rule 6 is **"No 'dm me'"**; the capture does not publish the removal reason,
   so the pattern is consistent-but-unconfirmed: the funnel gets deleted, the post survives.
2. **Unlabelled AI output.** Row 10 was read as an argument, and lost on methodology.

**Mod rules, verbatim** (from the archived about page, capture 2025-02-08):
1. **Be nice**
2. **Avoid purely political discussion** — *"apni political biases baahir chor kar aayein"*
3. **No self promotion**
4. **This is not a job board**
5. **This is not a tax advice board**
6. **No 'dm me'**

Source: [archive 200](https://web.archive.org/web/20250208111056/https://www.reddit.com/r/FIREPakistan/about/) · live about page returns the 8,420 B challenge shell (200, no text).

**The rule that matters:** rule 3 says *no self promotion*, and yet both top builder posts are
literal self-promotion that survived. Enforcement is **by perceived value, not by category**: a
working tool with a screenshot is tolerated, a sales sentence is not. Do not read rule 3 as
"don't post"; read it as "don't post a pitch".

**The sanctioned channel exists and is unused.** AutoModerator posts *"Weekly Investing App
Reviews, Tips, Feedback, and Updates"* — body: *"With the growing interest in finding the best apps
for investing in Pakistan, we've decided to start a weekly discussion thread dedicated to investing
apps… App Reviews… Tips & Feedback & Issues… Updates"*. Its capture shows **1 up, 0 comments**.
Source: [archive 200](https://web.archive.org/web/20250208111113/https://www.reddit.com/r/FIREPakistan/comments/1ij4ihh/weekly_investing_app_reviews_tips_feedback_and/).
There is also a general [Megathread: Ask Questions Here — archive 200 · 901,981 B](https://web.archive.org/web/20250601183438/https://www.reddit.com/r/FIREPakistan/comments/1l0fuff/megathread_ask_questions_here_discussions_useful/)
5 up / 0 comments at capture. **Posting only there is compliant and would be seen by nobody.** The playbook below assumes the main feed, with the megathread as a secondary drop.

---

## 3. Posting playbook for Rahnuma

### Title patterns that worked
| Pattern | Example | Result |
|---|---|---|
| "Built my own X in Y" | *Built my own PSX Portfolio Tracker in Google Sheets* | 33 / 38 — best in set |
| "X Explained" | *KSE100 Dashboard Explained* | 15 / **19** — best comment ratio |
| "X — Updated" | *KSE100-MarketBreadth-Dashboard- Updated* | 8 / 3 — an update alone earns less than the original |
| Name the gap | *"since there are no available market breadth indicators for KSE100 anywhere"* | carried the whole post |
| Marketing sentence | *Tools designed for real estate investors and those who are looking to manage their finances more effectively.* | **1 / 0** |

Suggested shape: **"Built an on-device PSX portfolio ledger in Pakistan — no account, no cloud,
works offline [screenshot]"**. Concrete noun, concrete constraint, artifact in the title.

### Screenshot expectations
- The top post is `multi_media` and opens with a **readable, real screenshot**; row 1's screenshot
  plus body carried 33 upvotes with **no link at all**. Row 3, posted as text, led with a live link
  instead and still reached 30 / 3.
- A screenshot with **no way to try it** (row 6) still gets upvotes but the thread cannot convert —
  comments ask for the link.
- Show the **ledger with numbers**, not a logo or a hero shot. The community's own screenshots were
  candlestick dashboards and a spreadsheet grid.

### Two-step pattern — the strongest observed move
Row 1 (screenshot, no link) → row 2 next day (link). 33/38 → 14/2. The proof post earns the trust;
the link post spends it. Rather than one post that is both an ad and a demo, do **"here's what I
built" first, "here's how to install it" next**.

### What NOT to do
1. **No link drop without context.** Row 7 is the control: 1 upvote, 0 comments.
2. **No DM funnel.** Rule 6 is explicit and it *is* enforced at comment level (row 6).
3. **No anonymous "we".** *"Who are WE?"* is what an unnamed collective gets.
4. **Don't post LLM output as analysis.** Row 10 was attacked on method, not outcome.
5. **Don't promise what the build doesn't do.** The update post's first comment was "it's broken on
   my laptop". A demo link that 404s is worse than no link — both Heroku dashboards are dead now
   (404), which is exactly why our GitHub-releases ladder is a differentiator.
6. **Don't say "buy" or "sell" — including in the comments.** More on this below; it is the one
   place we will be pushed.

### Timing norms
`n = 10`, so this is an observation, not a law. Counts are as of each capture.

| PKT slot | Posts | up / cm |
|---|---|---|
| Thu 19:40–21:56 | rows 1, 3 | 33/38, 30/3 |
| Fri 21:59–22:06 | rows 2, 10 | 14/2, 6/8 |
| Tue 17:20 | row 4 | 8/3 |
| Sun 09:53 | row 5 | 15/19 |
| Thu 04:15 | row 7 | **1/0** |
| Fri 08:10 | row 9 | 10/2 |

Weak read: **weekday evenings 19:00–22:00 PKT** is where the two best posts landed; the 04:15 PKT
post is the only true zero. Weekend Sunday morning produced the best discussion ratio. I would post
**Thursday ~20:00–21:30 PKT** and not chase an exact minute.

### Differentiation per row — what we can say that the poster could not

| Row | Their ceiling | What Rahnuma can add |
|---|---|---|
| 1, 2 — Google Sheet | Holdings + the sheet live in Google's cloud; a scraper breaks when DPS changes; needs a Google account | **On-device ledger, no account, no cloud**; the NAV/price gap line is parsed on our side, not scraped into your Drive |
| 3, 4, 5 — breadth dashboard | A hosted page that dies when the free dyno dies (both are 404 today); and the author's own copy tells you when to **buy** and **trim** | **Offline-first charts**; and a written **never-advice contract** — the same information without the instruction |
| 6 — tracker screenshot | No text, no link, no explanation; the thread is where the mod deletes | A body that states the constraints, and **no DM funnel to delete** |
| 7 — crosspost | Nothing to evaluate | An artifact with a context paragraph |
| 8 — AI tax idea | A model asked to do tax law; the community correctly said models get this wrong | **Deterministic, unit-tested CGT/FIRE/SIP math** — the model never does the arithmetic |
| 9 — anonymous course | No identity, no artifact | A **public repo + signed release ladder** (r1…r14, byte-verified shas) you can audit |
| 10 — ChatGPT comparison | Unverifiable model output | **Cited sources with status codes and timestamps**, labelled by freshness |
| 11 — psxworth | Free, ad-free, AI statement parsing — the closest competitor; English, cloud, accounts | **Urdu-hybrid, on-device, no account**, and the never-advice boundary |

The three lines I would put in the post body, in this order:
1. **"Your portfolio never leaves your phone — no account, no signup, no cloud."**
2. **"Rahnuma will never tell you to buy or sell. It restates your own plan and the price."**
3. **"Every build is a public GitHub release with a verifiable sha — install it, or read the code first."**

Those are the three things no row in the ledger could claim.

---

## 4. Risk read — is the community hostile, neutral, or receptive *now*?

The community is now both **AI-literate and regulator-aware**, which is a different room from the
one those 2025 builder posts walked into. It grew from **30,512 members** (archived about,
2025-02-08) and **31,000** (Aurora, 22 Jul 2025) to **82k members, +21k/yr (+34%)** on
[GummySearch 200](https://gummysearch.com/r/FIREPakistan/) — live, 2026-11-22. The most recent
readable front page is the 2026-03-03 capture and it is a **crash room**: *"KSE-100 just had its
biggest crash in history (-16k points)"* (12 up / 5 cm) and *"Who bought the dip?"* (**261 up / 36
cm**) — [archive 200](https://web.archive.org/web/20260303085600/https://www.reddit.com/r/FIREPakistan/).
On the supply side, Finqalab's CEO **Najam Ali** posted on 2026-07-06 that *"investment advice is a
regulated activity that requires a license… can a large language model (LLM) be permitted to
provide investment advice"* ([X 200](https://x.com/najam_ali/status/2074002511900672071)), while
[finqalab.com 200](https://finqalab.com/), [ARN Financials 200](https://arnfinancials.com/) and
[ARN Securities 200](https://arnsecurities.com/) are all live and licensing-forward; the Aurora
piece already lists **Abdul Rehman Najam** among the voices the sub follows
([Aurora 200](https://aurora.dawn.com/news/1145563)). So the ARN/Najam wave is not a launch of an
AI advisor that we can point at — **no such launch was found** — it is an *advisory brand plus a
public licensing argument*, and it has set the room's expectation: an app that talks about advice
will be measured against licensed entities, and an app that claims AI will be asked what the model
is actually doing. Against that, the 82k-member, post-crash audience is **starved for a calm,
factual ledger** — the demand threads already ask for free/local/exportable/auto-NAV — and it has
shown it upvotes a working artifact from an unknown account. The risk is not that the community is
hostile to Rahnuma; it is that a *positioning* post ("Pakistan's first agentic advisory council")
reads as exactly the licensed-advice claim Najam just publicly questioned, and will be shredded,
whereas a *tool* post ("here is an on-device ledger, it never tells you what to do") lands in the
gap the sub itself keeps asking to be filled.

**Verdict: receptive to a working artifact, hostile to a pitch — post the tool, never the positioning.**

---

## Evidence table

| Finding | Source | Status |
|---|---|---|
| All 10 ledger threads: score/comment/author/timestamp | Wayback replay of the real thread HTML (`shreddit-post` tags, re-verified this run against the saved bodies) | 200 each (see row links) |
| Mod rules 1–6 verbatim | [`about/` capture 2025-02-08](https://web.archive.org/web/20250208111056/https://www.reddit.com/r/FIREPakistan/about/) | 200 · 615,605 B |
| Subscribers 30,512 | same `about/` capture (`subscribers="30512"`) | 200 |
| Weekly app-review thread, 1 up / 0 cm | [1ij4ihh capture](https://web.archive.org/web/20250208111113/https://www.reddit.com/r/FIREPakistan/comments/1ij4ihh/weekly_investing_app_reviews_tips_feedback_and/) | 200 |
| Ask-questions megathread, 5 up / 0 cm | [1l0fuff capture](https://web.archive.org/web/20250601183438/https://www.reddit.com/r/FIREPakistan/comments/1l0fuff/megathread_ask_questions_here_discussions_useful/) | 200 · 901,981 B |
| 82k members, +21k/yr (+34%) | [GummySearch](https://gummysearch.com/r/FIREPakistan/) | 200 · 84,537 B |
| 31,000 members, Najam named as a followed voice | [Aurora, 22 Jul 2025](https://aurora.dawn.com/news/1145563) | 200 · 87,376 B |
| Crash room on the latest readable front page | [front page capture 2026-03-03](https://web.archive.org/web/20260303085600/https://www.reddit.com/r/FIREPakistan/) | 200 · 533,379 B |
| Najam: LLM advice needs a licence | [X 2026-07-06](https://x.com/najam_ali/status/2074002511900672071) | 200 · 111,909 B (og meta only) |
| Licensed-adjacent competitors live | [finqalab.com](https://finqalab.com/) · [ARN Financials](https://arnfinancials.com/) · [ARN Securities](https://arnsecurities.com/) | 200 · 145,683 B / 407,893 B / 111,223 B |
| psxworth product (closest competitor) | [psxworth.com](https://psxworth.com/) · [GitHub](https://github.com/Wajahat43/psxworth) | 200 · 93,040 B / 200 |
| Both builder dashboards are dead links today | Heroku app URLs from rows 3–4 | **404** · 555 B each |
| Builder's Google Sheet is still live | row 2 copy link | 200 · 946,751 B |

**Walls recorded, not bypassed:** reddit.com serves a reCAPTCHA "Prove your humanity" page to both
curl and a real headless Chromium session (screenshot taken); the JSON, `.rss`, shreddit feed and
every redlib/teddit/pullpush mirror tried either 403/429/418 or returned a verification shell.
`web.archive.org` was intermittently "Temporarily Offline" during recon; every archive URL cited
above was re-probed at the end of this run and returned **200**.

**No code was changed by this recon.**
