# AUDIT (RE-GRADE) — Rahnuma SABRE r14 (versionCode 14)

- **Re-graded at:** HEAD `439e6d1`
- **Prior audit:** `docs/AUDIT-2026-11.md` — **70.5 / 100 → 7.0 / 10**, verdict **ONE MORE BEAT**, three blockers
- **Artefact inspected:** `~/Downloads/releases/rahnuma-sabre-r14-local-v14.apk` — 70,134,295 B, sha256 `6ef6835f…`,
  `assets/index.android.bundle` present at 1,818,688 B, `apkanalyzer manifest version-code` = **14**
- **Gates re-run fresh for this re-grade:** `npm run ts:check` exit **0** · `npm test` **251/251 pass**, 0 fail, 0 skipped, 0 todo
- **Method:** re-ran every gate; re-ran the three blockers by *reproduction* through the mounted screen (not by reading);
  re-read the rubric in the prior audit and re-scored each criterion with a fresh evidence line. Same weights as the
  founder order. Grading rule unchanged: **a 6 says 6**, and a fix earns the move only if it genuinely re-scores.

---

## 1. The three blockers — verified by reproduction

### Blocker #1 — FIRE first-run lie — **CLOSED**

The r13 defect: `calculateFIRE(monthlyExpenses || 1, …)` turned "no expense data" into a Rs 300 target and printed
`FIRE Achieved!` for any corpus ≥ Rs 300.

r14 executes as:

```
calculateFIRE(0, 250000, 0, 10)         -> {"targetCorpus":0,"yearsToFire":-1,"progressPct":0,"realReturn":10,"hasExpenseData":false}
calculateFIRE(0||1, 250000, 0, 10)      -> {"targetCorpus":300,"yearsToFire":0,"progressPct":100,"realReturn":10,"hasExpenseData":true}   ← trap still reproducible, now guarded at BOTH ends
calculateFIRE(0, 500, 0, 10)            -> {"targetCorpus":0,"yearsToFire":-1,"progressPct":0,"realReturn":10,"hasExpenseData":false}
```

Mounted-screen reproduction of the auditor's own case (fresh install, Rs 250,000 cash) renders:

```
FIRE Progress
Add your monthly expenses in Settings to see your FIRE math
```

…with **no** target, **no** `% of target` string, and **no** `Rs. 300` anywhere in the tree. The render test
`tests/dashboardRender.test.ts:38` asserts exactly that and runs in the suite. The `|| 1` is gone at the call site
(`DashboardScreen.tsx:75`) and the pure function refuses a non-positive expense series (`calculators.ts:213`).

### Blocker #2 — embedded key vs README — **CLOSED (disclosed, not hidden)**

Read out of the **shipped r14 binary** (counted, value never printed): exactly **one** `gsk…` key, **87 chars**, in
`assets/index.android.bundle`. `AIza…` = 0, `sk-or-…` = 0. So the key still ships — that was never in dispute.

What changed is the claim. The false r13 sentence (*"nothing ships inside the binary, and there is no key baked into the
repo"*) is gone (`grep -n "nothing ships" README.md` → exit 1) and `README.md:81-89` now states two checkable facts:

1. preview builds ship the maintainer's own free-tier key **by design**, it **is extractable**, an accepted beta trade-off;
2. a pasted key always wins, and **public/production builds must ship BYOK-only**.

The README and the APK now agree. That was the disposition the auditor allowed ("keep it and state it plainly").

**One sub-item not done:** the audit also asked for a line in `docs/BETA-LAUNCH-POST.md`'s pre-launch checklist.
`grep -n "embedded\|BYOK" docs/BETA-LAUNCH-POST.md` → **0 hits**. Disclosed in one document, not the other.

### Blocker #3 — import says "saved", net worth never moves — **CLOSED**

`getAssets()` now has a real reader (`DashboardScreen.tsx:48`, used in `netWorth` at `:66` and in the FIRE corpus at
`:72`), and the import alert counts actual inserts (`SettingsScreen.tsx:242-253`, `savedCount`, not `assetRows.length`).

Mounted-screen reproduction, verbatim from `tests/dashboardRender.test.ts:58`:

```
before  Net Worth -> Rs. 12,075,000
after   Net Worth -> Rs. 12,575,000      (one gold row of 500000, written exactly as the importer writes it)
        "Other assets: " line present, "Rs. 500,000" rendered
```

The `getAssets()`-with-zero-callers finding from the prior audit, and from `SPINE.md:117`, is closed at both ends.

---

## 2. New regressions since the prior audit

The WO asked specifically whether the NAV lane and the blocker lane introduced concurrency regressions. **One new
user-visible defect**, plus one carried-over defect the fix did not reach, plus doc drift.

### R1 (NEW) — the NAV gap line calls a *buy price* a *price* — `src/screens/PortfolioScreen.tsx:272,280`

The row computes `currentPrice = h.current_price ?? h.avg_buy_price` and feeds **that** into
`buildEtfNavLine(nav, currentPrice)`. When a holding has never been priced, the same fallback is already labelled
`· showing buy price` one line above — but the NAV line ignores that and prints a market-looking gap.

Reproduced with a stubbed NAV page for `MZNPETF` (iNAV 18.27), holding bought at 15.00, `current_price = null`:

```
MZNPETF
 · showing buy price
NAV 18.27 · price 15.00 · gap -17.9%
```

There is no market price in that row. The gap is "NAV vs the price you paid", rendered as "NAV vs price". This is a
falsifiable money statement in the beat's own headline feature, and it is the same *class* the auditor refused to post
over. It only fails when a quote is missing — the row does say "showing buy price" above, which mitigates but does not
correct it. **Scope:** the NAV lane added to `PortfolioScreen`, which has **zero render coverage** (see criterion 4).

### R2 (CARRIED, not new) — the FIRE card can print `FIRE Achieved!` while showing 66.7% of target

Present in r13 and unchanged in r14: the **percentage** uses `effectiveFireTarget` (explicit `fire_target` if set, else
auto), while the **verdict** uses `fire.yearsToFire`, computed against the *auto* target
(`DashboardScreen.tsx:75-83`, verdict at `:165-172`). When a user saves a conservative explicit target larger than the
auto target and also has expenses, the two disagree. Mounted-screen reproduction — corpus 20,000,000, explicit target
30,000,000, expenses 50,000/mo (auto target 15,000,000):

```
FIRE Progress · Rs. 20,000,000 / Rs. 30,000,000 · 66.7 % of target · FIRE Achieved!
```

The fresh-install case is fixed; this second path into the same card is not. Not a regression — the same math shipped in
r13 — but it is still a "states something false about their retirement" screenshot, reachable through Settings.

### Doc drift (cosmetic)

- `README.md:95` says `# 250 tests`; the suite is **251**.
- `README.md:160` still says every AI response is **prefixed** with the disclaimer; in practice it is a pinned footer.
  Pre-existing honest deviation, recorded in the prior audit, unchanged.
- The WO's note about the forge beat rewording the audit doc is **correct and harmless**: `docs/AUDIT-2026-11.md` now
  says "Groq-style `gsk…`" / "provider-key prefix" instead of the literal prefix, and the repo-wide leak gate reads **0**
  (a grep for the three provider-key prefixes over `src tests scripts docs README.md` → no matches) while the finding text survives.

---

## 3. Rubric (same weights, fresh evidence)

| # | Criterion (weight) | r13 | **r14** | Delta | Evidence for the r14 grade |
|---|---|---|---|---|---|
| 1 | **Core promise** — never-advising, Urdu-hybrid, on-device privacy (/15) | 7 | **7** | — | Never-advising still enforced in code (`enforceNoDirective` `personaService.ts:186`, applied in `outlookCouncil.ts:151,178`, `contextNote.ts:118`, `newsFuse.ts:76`, `AdvisoryScreen.tsx:113-138`, `BriefingScreen.tsx:68`) **and now extended to the new NAV surface**, whose caption is asserted directionless by test (`tests/navService.test.ts:116`). Privacy unchanged (SQLite only, no server). Urdu is still **partial — 13 hardcoded Urdu lines across 3 files** (`OutlookScreen.tsx`, `outlookText.ts`, `fusionStrip.ts`); Dashboard/Portfolio/Budget/Settings and all 9 tab labels remain English. No change to the weak leg, so no move. |
| 2 | **Data truthfulness** — live feeds, freshness, honest stale/offline (/15) | 7 | **7** | — | The import lie is **closed and tested** (net worth moves `12,075,000 → 12,575,000`), a genuine gain. **Offset by R1:** the new NAV line prints a literal *gap* against a buy price and labels it `price`. Honest-fail discipline otherwise intact (`NAV unavailable` on no page, `PMEX offline`, per-series `unavailable`, `priceFreshness`). Net change ≈ 0, so 7 holds. |
| 3 | **Feature completeness for the promise** (/15) | 7 | **8** | **+1** | One of the four "gaps that break the promise" is closed (**imported positions now reach net worth**) and a genuinely new user-visible capability ships (**ETF NAV-vs-price gap for all 9 catalog ETFs**, live iNAV from PSX DPS, 12 tests). Still missing: mutual-fund NAVs, scenario simulator (README:149 admits it), onboarding. The import loop was the *lie*, and it is gone; the new feature is real. +1 is earned, not gifted. |
| 4 | **Reliability & tests** (/15) | 6 | **7** | **+1** | The criterion's exact stated defect — *zero screen render tests* — is answered: `tests/dashboardRender.test.ts` mounts the real screen through `tests/aux/renderHarness.mjs` (sucrase + react-native-web + Node SQLite + nav/font stubs), **3 render tests**, suite **251/251 green**, TS strict clean. **Not 8:** coverage is 3 tests on **1 screen**; the very same beat shipped **R1** through `PortfolioScreen`, which has **no** render test — the identical failure mode, one screen over. |
| 5 | **UX polish & coherence** (/10) | 6 | **6** | — | Design system still coherent (theme tokens, Inter, mono numerals). The fresh-install false headline is fixed, but the card can still print `FIRE Achieved!` at `66.7%` (**R2**), the bottom bar is **still 9 tabs** (`AppNavigator.tsx:124-136`, `grep -c "<Tab.Screen"` = 9), and there is still no first-run guidance. Two of three underminers unchanged. |
| 6 | **Performance & footprint** (/10) | 6 | **6** | — | Footprint unchanged: **70,134,295 B**, still **4 ABIs**, `lib/*.so` total **37,909,652 B**, `classes*.dex` **20,496,892 B**, no ABI split. New cost is bounded and cached: one ETF page per ETF holding on Portfolio focus, 8 s abort, 15-min cache (`navService.ts:271-334`). Sensible, but the download is still the heaviest thing about the app. |
| 7 | **Security posture** (/10) | 6 | **7** | **+1** | The only ding was a README that **denied** a shipped key. That denial is gone; the README now discloses the key, its extractability, and the BYOK-only rule for production, and the r14 bundle still carries exactly one 87-char key (verified). Native path unchanged and solid (SecureStore, hashed+throttled PIN, `disableDeviceFallback`). A disclosed trade-off is a 7; a denied one was a 6. Partial credit held back because `docs/BETA-LAUNCH-POST.md`'s checklist lacks the disclosure line. |
| 8 | **Regulatory/PR safety** (/10) | 8 | **8** | — | Disclaimers still pinned (`feeGrid.ts:45`, `advisors.ts:508`, `BriefingScreen.tsx:26`, `OutlookScreen.tsx:298`, `SettingsScreen.tsx:593`); `docs/SECP-POSTURE.md` still matches the code. The new NAV surface adds a red-line-clean caption (**"Gap is information, not a trade signal."**) with a test that names no direction — a real strengthening that does not move an already-high integer. The one honest deviation (footer, not prefix) is unchanged. |
| 9 | **Community readiness** (/5) | 4 | **4** | — | Rollback story is **better**: `gh release list` shows **r7–r14 (8 rungs) + a `legacy-rungs` archive = 10 published**, r14 carries the APK and sha. New: `docs/SIGINT-FIREPAKISTAN.md` (268 lines) is a real posting playbook. But onboarding is still absent and the license is still **TBD** (no `LICENSE*` file, no `license` field in `package.json`). The criterion's two gaps are untouched. |
| 10 | **"Is it beta-post ready?" gut call** (/5) | 4 | **5** | **+1** | The single most screenshot-worthy defect in r13 — a stranger enters a number and reads `FIRE Achieved!` — is **fixed and proven by a rendered test**. The first-run path is now honest. Held at 5, not maxed, because **R2** is still a false money statement one Settings screen away, and **R1** is a fresh one in the ledger. |

---

## 4. Weighted total

| # | Criterion | r14 grade | Weight | Points |
|---|---|---|---|---|
| 1 | Core promise | 7 | 15 | 10.5 |
| 2 | Data truthfulness | 7 | 15 | 10.5 |
| 3 | Feature completeness | 8 | 15 | 12.0 |
| 4 | Reliability & tests | 7 | 15 | 10.5 |
| 5 | UX polish & coherence | 6 | 10 | 6.0 |
| 6 | Performance & footprint | 6 | 10 | 6.0 |
| 7 | Security posture | 7 | 10 | 7.0 |
| 8 | Regulatory/PR safety | 8 | 10 | 8.0 |
| 9 | Community readiness | 4 | 5 | 2.0 |
| 10 | Beta-post gut call | 5 | 5 | 2.5 |

**Weighted score: 75.0 / 100 → 7.5 / 10**

**Delta vs 70.5: +4.5.** The arithmetic is criterion 3 (+1 × 15 = +1.5), criterion 4 (+1 × 15 = +1.5), criterion 7
(+1 × 10 = +1.0) and criterion 10 (+1 × 5 = +0.5) = **+4.5**. Reasons, one line each: the import loop is closed and
tested; screen render tests now exist; the README no longer denies the shipped key; and the first-run money lie is gone.
Nothing else moved because nothing else changed — the nine-tab bar, the missing onboarding, the TBD license, the heavy
APK and the partial Urdu are all exactly where they were.

**Cross-checks:** `ts:check` 0 · 251/251 pass · leak gate 0 · versionCode 14 in both `app.json` and
`android/app/build.gradle` · ladder r1/r2/r3/r4/r5/r7/r8/r9/r10/r11/r12/r13 all byte-verified unchanged, N-1 = r13
`8a11ecd1…` intact · signer `CN=Rahnuma SABRE, OU=Preview` unchanged since r4 · `r14-local-v14.apk` and
`rahnuma-sabre-latest.apk` byte-identical (`cmp`).

---

## 5. Remaining top-3 gaps

1. **The FIRE card can still state something false (R2).** The verdict is computed against the auto target while the
   percentage is computed against the displayed target. Align them: gate the verdict on the *same* `effectiveFireTarget`
   the card shows (or compute a second `calculateFIRE` against the explicit target). One condition, one line, one test.
2. **The NAV gap line must not call a buy price a price (R1).** When `h.current_price` is null, do not build a gap —
   render `NAV 18.27 · price unavailable` (or reuse the existing "showing buy price" state) instead of a `-17.9%` that is
   not a market gap. Then add the **PortfolioScreen render test** the blocker lane skipped.
3. **The screen still says "unfinished" before it says anything else.** 9 tabs (`AppNavigator.tsx:124-136`) and no
   first-run path. Cut to five (Dashboard, Portfolio, Command, Budget, Settings) and add the one empty-state card the
   prior audit asked for. License still `TBD`.

---

## 6. VERDICT: **ONE MORE BEAT**

Not "POST NOW." The three blockers the prior audit named are genuinely closed, and two of them are proven by a mounted
screen rather than by prose. That is real progress and the score reflects it. But the auditor's own line was that a
statement about the user's retirement must never be false — and **R2 still prints `FIRE Achieved!` at 66.7% of target**,
and **R1 prints a market-style `-17.9%` gap against a purchase price**. Both are reachable in the normal Settings →
add-holding flow, and a r/FIREPakistan reader who pokes will find one. The nine-tab bar and the missing first-run card
are still the first impression.

Not "TWO MORE BEATS" either: every remaining item is small, scoped, and does not touch the architecture — two
one-condition fixes with a test each, a tab reduction, one empty-state card, and a license file. The prior audit used
the same judgement at 70.5 and the work it asked for was done; this beat should finish the honesty items and stop.

### Exact work list for the next beat

1. Align the FIRE verdict with the displayed target (R2) + a render test for the explicit-target-with-expenses case.
2. Make the NAV line honest without a live quote (R1) + a PortfolioScreen render test.
3. Cut to five tabs and add the first-run "Add your first holding / Set your income and expenses" card.
4. Add the embedded-key/BYOK line to `docs/BETA-LAUNCH-POST.md`'s pre-launch checklist; pick a license.
5. Correct `README.md:95` to the current test count.

Optional: split the APK per ABI — arm64-only would cut roughly 33 MB of the 70 MB download.

---

*No code was changed by this re-grade. Gates re-run fresh at `439e6d1`: `npm run ts:check` exit 0 · `npm test` 251/251.*
