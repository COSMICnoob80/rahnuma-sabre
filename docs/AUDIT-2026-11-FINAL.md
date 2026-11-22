# AUDIT (FINAL VERDICT PASS) — Rahnuma SABRE r15 (versionCode 15)

- **Audited at:** HEAD `f621d52` (the r15 forge), fix commit `54ad7ba`, docs re-grade `f17f7cc`
- **Prior audits:** `docs/AUDIT-2026-11.md` — 70.5 / 100, ONE MORE BEAT · `docs/AUDIT-2026-11-RE.md` — 75.0 / 100, ONE MORE BEAT
- **Artefact inspected:** `~/Downloads/releases/rahnuma-sabre-r15-local-v15.apk` — 70,134,527 B,
  sha256 `4f9da99e8cc2a0f34dd9280e5aaa7b89e700c0e18d4b659a7f1370aa7956a4f1`, `apkanalyzer manifest version-code` = **15**
- **Gates re-run fresh for this pass:** `npm run ts:check` exit **0** · `npm test` **256/256 pass**, 0 fail, 0 skipped, 0 todo
- **Method:** this is the third look and the scope was deliberately narrow. R1 and R2 were re-run by **independent
  reproduction** — a throwaway script mounted the real `DashboardScreen` and `PortfolioScreen` through
  `tests/aux/renderHarness.mjs` and drove the real services, rather than reading the shipped tests' assertions and
  calling it confirmation. Then the whole tree was diffed against the fix commit to prove nothing else moved, and the
  shipped APK was checked against the build output. Only criteria **3** and **4** are re-scored; every other grade is
  carried from the r14 re-grade with its reason intact. Grading rule unchanged: **a 6 says 6**, and a fix earns the
  move only if it genuinely re-scores.

---

## 1. What changed since the re-grade — the entire delta

```
54ad7ba  fix(ledger): no gap on unpriced ETFs + single consistent FIRE target (re-audit R1+R2)
f621d52  build(r15): forge local v15 — re-audit R1+R2 fixes (ladder rotated)
```

`git diff 54ad7ba..HEAD` touches **four files and no source**: `app.json` + `android/app/build.gradle`
(`versionCode 14 → 15`), `SPINE.md`, and one prose rewording in `docs/AUDIT-2026-11-RE.md`. `git diff --name-only
54ad7ba..HEAD -- src tests` returns **0 files**. So the shipped code is exactly the code the fix commit produced — there
is no unreviewed drift between the fix and the artefact, which is the one thing a final pass must rule out.

---

## 2. R1 — NAV gap drawn against a buy price — **CLOSED (reproduced)**

**The r14 defect:** `PortfolioScreen.tsx` computed `currentPrice = h.current_price ?? h.avg_buy_price` and fed that into
`buildEtfNavLine`, so an ETF that had never been priced printed a market-shaped gap built from what the user paid.

**The r15 code** (`PortfolioScreen.tsx:279-283,293-303`):

```ts
const navValue = isEtf ? etfNav[h.ticker.toUpperCase()]?.nav ?? null : null;
const navLine = isEtf ? buildEtfNavLine(navValue, h.current_price) : null;
```

The cost-basis fallback is gone from the NAV call; only the live quote reaches it. **Three honest states** then render:
gap line when NAV **and** a live price exist, `NAV 18.27` alone when the NAV exists without a quote, `NAV unavailable`
only when the page itself had nothing.

**My reproduction** — `MZNPETF` bought at 15.00, published iNAV 18.27, `current_price = null`, DPS page stubbed:

| Case | Rendered NAV row |
|---|---|
| **unpriced** (r14's defect case) | `NAV 18.27` — **no** `· gap`, **no** `price 15.00`, **no** `-17.9%` |
| **priced** (`current_price = 18.22`) | `NAV 18.27 · price 18.22 · gap -0.3%` |
| **NAV page fails** | `NAV unavailable` |

Booleans from the run: `any "· gap": false · any "-17.9%": false · any "price 15.00": false`. The `· showing buy price`
label still appears on the row, so the 15.00 remains labelled as the cost basis it is. The r14 sentence "NAV vs the price
you paid, rendered as NAV vs price" is no longer producible. **Closed.**

---

## 3. R2 — two FIRE targets on one card — **CLOSED (reproduced)**

**The r14 defect:** the percentage came from `effectiveFireTarget` (explicit `fire_target` if saved) while the verdict
came from `fire.yearsToFire`, computed against the **auto** target — so the card could read `66.7% of target` and
`FIRE Achieved!` in the same frame.

**The r15 code:** `calculateFIRE` takes a trailing `targetOverride` (`calculators.ts:208,219-225`) that wins for
**corpus, progress and years together**; `DashboardScreen.tsx:80-83` recomputes against the saved target whenever one
exists, and only falls back to `autoFire` when none does. One target drives the whole card, by construction rather than
by two call sites agreeing.

**My reproduction**, mounted screen, verbatim strings:

| Case | Fraction | Percentage | Verdict |
|---|---|---|---|
| explicit 30M, corpus 20M, exp 50k/mo | `Rs. 20,000,000 / Rs. 30,000,000` | `66.7% of target` | **`5 years to FIRE`** — no `FIRE Achieved!` |
| no target, corpus 20M, exp 50k/mo (auto 15M) | `Rs. 20,000,000 / Rs. 15,000,000` | `100.0% of target` | `FIRE Achieved!` — agrees |
| explicit 30M, corpus 35M, exp 50k/mo | `Rs. 35,000,000 / Rs. 30,000,000` | `100.0% of target` | `FIRE Achieved!` — agrees |
| **fresh install**, Rs 250,000, no expenses | — | — | `Add your monthly expenses in Settings to see your FIRE math` |

Module probes confirm the same at the source:

```
calculateFIRE(0, 250000, 0, 10)          -> targetCorpus 0, yearsToFire -1, progressPct 0,   hasExpenseData false
calculateFIRE(50000, 20M, 0, 10)         -> targetCorpus 15000000, yearsToFire 0, progress 100
calculateFIRE(50000, 20M, 0,10,0,4,30M)  -> targetCorpus 30000000, yearsToFire 5, progress 66.67
calculateFIRE(50000, 30M, 0,10,0,4,30M)  -> targetCorpus 30000000, yearsToFire 0, progress 100
calculateFIRE(50000, 20M, 0,10,0,4,NaN)  -> targetCorpus 15000000   (invalid override is ignored, not trusted)
```

**Edge cases I probed because the fix introduces a new parameter** (this is where a fix of this shape usually breaks):
explicit target with **no** expenses (`35M / 30M · 100.0% · "Add your monthly expenses to project years to FIRE"`, no
verdict — correct, a verdict needs a savings series); explicit target with **zero** corpus (`0.0%`, no verdict);
negative expense row (treated as no data, honest prompt); explicit target with corpus above it (`100.0%` **and**
`FIRE Achieved!`, agreeing). No new false-money state was produced by any of them. The r13 fresh-install lie stays dead.
**Closed.**

---

## 4. New regressions from this beat — **none found**

The WO asked whether the last beat introduced anything. I looked in the places a change like this can leak:

- **Score/verdict coherence:** every FIRE state now derives from one target; the four reproduction tables above are the
  proof. `yearsToFire` has only two consumers (`DashboardScreen`, `CalculatorsScreen`) and the calculator passes no
  override, so its own path is untouched (`if (!e …) return` already refuses zero expenses).
- **NAV lane:** the three states are exhaustive over `(nav present?, price present?)`, and the `NAV_GAP_CAPTION` only
  renders when an ETF row exists — unchanged condition.
- **Numeric fallbacks:** swept `src/screens` and `src/utils` for `|| 1` / `|| 0` fabrication patterns; the only remaining
  hits are parse defaults (`parseFloat(...) || 4`) and an `amount_pkr || 0` sum, none of which can manufacture a
  target. The one that could — the `|| 1` at the Dashboard call site — is gone.
- **Suite:** 251 → **256** (+5: one `calculateFIRE` override unit test, two Dashboard render cases, two Portfolio render
  cases), all green, TS strict clean.

**Carried defects, unchanged and not new** (recorded so the record is complete, not re-litigated):

- `README.md:95` says `# 250 tests`; the suite is **256**. Drift grew by five, and it is exactly the class of
  checkable-claim-on-a-public-repo the earlier audits punished (it was the r13 Blocker #2 mechanism).
- `docs/BETA-LAUNCH-POST.md` still has **0** hits for `embedded` / `BYOK` — the r14 criterion-7 hold-back is unfixed.
- Nine bottom tabs (`grep -c "<Tab.Screen" src/navigation/AppNavigator.tsx` = **9**), no first-run card.
- No `LICENSE*` file, no `license` field in `package.json`.
- Render coverage is **2 of 12 screens** (7 render tests: `dashboardRender` 5, `portfolioRender` 2).

---

## 5. Adjusted scores — criteria 3 and 4 only

| # | Criterion (weight) | r14 | **r15** | Delta | Reason |
|---|---|---|---|---|---|
| 3 | **Feature completeness for the promise** (/15) | 8 | **8** | — | No move, and that is the honest answer. Both fixes are honesty corrections to features that already shipped — R1 makes the existing NAV lane stop lying, R2 makes the existing FIRE card consistent. Neither adds a capability. The four gaps the r13 audit named are unchanged: import→net worth closed in r14, but mutual-fund NAVs, the scenario simulator and onboarding are all still missing. A fix does not earn feature credit for repairing its own claim. |
| 4 | **Reliability & tests** (/15) | 7 | **8** | **+1** | The criterion's stated hold-back was: *"coverage is 3 tests on 1 screen; the very same beat shipped R1 through `PortfolioScreen`, which has no render test — the identical failure mode, one screen over."* That is now directly answered. `PortfolioScreen` has 2 render tests that mount the real screen and drive the real `navService` with only `fetch` stubbed, and they assert the **negative** (no `· gap`, no `-17.9%`, no `price 15.00`) as well as the positive — the precise failure mode is now guarded at the level where it occurred. Dashboard is at 5 render cases covering the fresh-install, import, explicit-target and auto-target paths. Suite 256/256, TS strict clean, no new manual drifting. **Not 9:** 2 of 12 screens have render coverage; Settings, Budget, Command Center, Outlook, Advisory, Briefing, Calculators, Costs, Directory and PinLock have none, and the discipline that produced R1 is still only enforced where someone happened to write a test. |

Every other criterion is carried unchanged, with its r14 reason — with one exception that must be stated rather than
papered over. **Criterion 10's ("beta-post gut call") r14 hold-back was verbatim: *"held at 5, not maxed, because R2 is
still a false money statement one Settings screen away, and R1 is a fresh one in the ledger."* Both of those reasons are
now discharged** — that is the whole point of §2 and §3. Carrying 5/5 unchanged therefore keeps a fraction of a point
that its own justification no longer supports. Under the WO's explicit scope ("re-score ONLY the criteria your findings
touched") I have left it at 5, so the total is a **conservative floor**: a stricter read that moved it to 6 would make
the weight 6/10 × 5 = 3.0 and the total **77.0**, which changes nothing about the verdict below.

| # | Criterion | Grade | Weight | Points |
|---|---|---|---|---|
| 1 | Core promise — never-advising, Urdu-hybrid, on-device privacy | 7 | 15 | 10.5 |
| 2 | Data truthfulness | 7 | 15 | 10.5 |
| 3 | Feature completeness | **8** | 15 | 12.0 |
| 4 | Reliability & tests | **8** | 15 | 12.0 |
| 5 | UX polish & coherence | 6 | 10 | 6.0 |
| 6 | Performance & footprint | 6 | 10 | 6.0 |
| 7 | Security posture | 7 | 10 | 7.0 |
| 8 | Regulatory/PR safety | 8 | 10 | 8.0 |
| 9 | Community readiness | 4 | 5 | 2.0 |
| 10 | Beta-post gut call | 5 | 5 | 2.5 |

**Weighted total: 76.5 / 100 → 7.65 / 10 (7.7)**

**Delta vs 75.0: +1.5**, which is criterion 4's one grade step (1/10 × 15). Nothing else moved because nothing else
changed — and I checked that by diffing the tree, not by assuming it.

**Cross-checks:** `ts:check` **0** · **256/256** pass · versionCode **15** in both `app.json:26` and
`android/app/build.gradle:102` · signer `CN=Rahnuma SABRE, OU=Preview`, SHA-256 `638b05a8…` (the same certificate as
r4–r14, so r15 installs in place) · `rahnuma-sabre-r15-local-v15.apk` and `rahnuma-sabre-latest.apk` byte-identical
(`cmp`, both `4f9da99e…`) · `gh release list` shows **r15 as Latest**, r4/r7–r15 plus the `legacy-rungs` archive ·
`lib/*.so` still four ABIs totalling **55,248,488 B** (`libreactnative.so` alone 22,522,608 B), `classes*.dex`
**20,496,892 B**, no ABI split · the shipped `assets/index.android.bundle` is **1,818,920 B vs r14's 1,818,688 B (+232 B)**
and is byte-identical to `android/app/build/…/createBundleReleaseJsAndAssets/index.android.bundle` stamped **17:32**,
i.e. built two minutes *after* the 17:30 fix commit — so the APK is not a versionCode-only re-stamp of r14, it carries
the changed code · leak gate: **0** real key prefixes in `src tests scripts docs README.md`; the single grep hit is the
prose token `AIza…` (an ellipsis, with the value never written) at `docs/AUDIT-2026-11-RE.md:43`.

---

## 6. VERDICT: **ONE MORE BEAT**

The two findings that caused the previous verdict are both closed and I reproduced them myself rather than trusting the
new tests — no screen in the app now states something false about the user's money — but the verdict sentence in the
re-audit named **four** things, and the other two (*"the nine-tab bar and the missing first-run card are still the first
impression"*) are untouched on disk, alongside a still-`TBD` license on the public repo the post asks people to read.

This is not a re-litigation of the rubric: criteria 5, 9 and 10 are carried exactly where r14 left them, and I did not
move a single grade I had no evidence to move. It is also not "TWO MORE BEATS" — what is left is one tab-signature edit,
one empty-state card, one license file, and two one-line doc corrections, none of which touches the architecture or
the now-correct math.

### Exact work list for the next beat

1. **Cut the bottom bar to five** — Dashboard, Portfolio, Command, Budget, Settings — with Directory, Costs,
   Calculators and Advisory behind a "More" entry (`AppNavigator.tsx:124-136`).
2. **Add the first-run card** — one empty-state block on Dashboard: "Add your first holding" → Portfolio's add form,
   "Set your monthly income and expenses" → Budget.
3. **Pick a license** (MIT is the low-friction default) — `LICENSE` file plus a `license` field in `package.json`.
4. **Correct `README.md:95`** to the current test count (256), and add the embedded-key/BYOK line to
   `docs/BETA-LAUNCH-POST.md`'s pre-launch checklist — one line each closes the last criterion-7 hold-back.

Optional: split the APK per ABI; arm64-only would cut roughly a third of the 70 MB download.

### Post-day checklist — staged, not yet used

The three-point posting checklist (title pattern, screenshot expectations, what not to do) is already written and
verified in **`docs/SIGINT-FIREPAKISTAN.md` §3** — it does not need rewriting for the next pass, only executing once the
four items above land. Post the tool, never the positioning; weekday evening ~20:00–21:30 PKT; screenshot first, link
the day after.

---

*No code was changed by this pass. Gates re-run fresh at `f621d52`: `npm run ts:check` exit 0 · `npm test` 256/256.
R1 and R2 were reproduced through mounted screens by a throwaway script outside the repo, deleted afterwards.*
