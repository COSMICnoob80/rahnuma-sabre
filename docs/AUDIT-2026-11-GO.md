# AUDIT (GO VERDICT PASS) — Rahnuma SABRE r16 (versionCode 16)

- **Audited at:** HEAD `72d7b6a` (the r16 forge), feature commit `0fec0fd` (post-ready polish)
- **Prior audits:** `docs/AUDIT-2026-11.md` — 70.5/100 · `docs/AUDIT-2026-11-RE.md` — 75.0/100 ·
  `docs/AUDIT-2026-11-FINAL.md` — 76.5/100, ONE MORE BEAT (four items)
- **Artefact inspected:** `~/Downloads/releases/rahnuma-sabre-r16-local-v16.apk` — 70,138,075 B,
  sha256 `ace57d3e4c342f5d3defc335cfd4b7045a71cb513ff0e2f44d149f943a8134f2`,
  `apkanalyzer manifest version-code` = **16**
- **Gates re-run fresh for this pass:** `npm run ts:check` exit **0** · `npm test` **258/258 pass**, 0 fail, 0 skipped, 0 todo
- **Method:** this is the fourth look and the scope was the four FINAL-audit items only. Each item was checked
  against its own line in `docs/AUDIT-2026-11-FINAL.md` §6, on disk and in the shipped artefact, not from the
  commit message. Then the tree was diffed against `0fec0fd` to prove nothing else moved. Only the criteria the
  four items touch are re-scored; every other grade is carried with its r15 reason. Grading rule unchanged:
  **a 6 says 6**, and an item earns its move only if it genuinely re-scores.

---

## 1. The delta since the FINAL pass

```
0fec0fd  feat(polish): first-run card + tab fix + LICENSE + doc lines (versionCode 16, audit-final items)
72d7b6a  build(r16): forge local v16 — post-ready polish (ladder rotated)
```

`0fec0fd` touches 12 files: `AppNavigator.tsx`, `DashboardScreen.tsx`, `MoreScreen.tsx` (new), `LICENSE` (new),
`README.md`, `docs/BETA-LAUNCH-POST.md`, `package.json`, `app.json`, `android/app/build.gradle`, `SPINE.md`,
`tests/dashboardRender.test.ts`, `tests/costScreen.test.ts`. `72d7b6a` (the forge) touches **SPINE.md only** and
carried no source. `git diff --name-only 0fec0fd..HEAD -- src tests` = **0 files**, so the shipped code is
exactly the code the feature commit produced.

---

## 2. Per-item verification

### Item 1 — cut the bottom bar to five — **SHIPPED**

`grep -c "<Tab.Screen" src/navigation/AppNavigator.tsx` = **5**: Dashboard, Portfolio, CommandCenter
(`tabBarLabel: 'Command'`), Budget, Settings (`AppNavigator.tsx:141-149`). Directory, Costs, Calculators and
Advisory were removed from the tab navigator and re-registered as **root-stack** routes (`:179-191`), reached
through a new `More` stack screen (`:179`) whose entries are labelled and navigate to each route
(`MoreScreen.tsx`). A `headerRight` `More` button (`AppNavigator.tsx:99-114,138`) opens it from any tab header.

Navigation integrity — the failure mode of a tab cut is a dead `navigate()` target. I grepped every screen for
`navigate('Directory'|'Costs'|'Calculators'|'Advisory'|'More')`: the only tab-origin reference is
`DashboardScreen.tsx:229` `navigation.navigate('Calculators')`, and `Calculators` is a root-stack route reachable
from anywhere in the stack (a tab screen is inside `Tabs`, a child of the root stack), so it resolves. **No dead
target.**

### Item 2 — first-run card — **SHIPPED (reproduced)**

`DashboardScreen.tsx:67` `isFirstRun = holdings.length === 0 && assets.length === 0` — "no ledger of any kind",
the honest definition. The card (`:124-157`) renders `Start here`, one purpose sentence, the **three verbatim
SIGINT-FIREPAKISTAN §3 lines** ("Your portfolio never leaves your phone — no account, no signup, no cloud." /
"Rahnuma will never tell you to buy or sell. It restates your own plan and the price." / "Every build is a public
GitHub release with a verifiable sha — install it, or read the code first."), the CTA "Import your statement or
add your first holding below.", and the two actions "Add your first holding" (→ Portfolio) and "Set your monthly
income and expenses" (→ Budget). No advice language.

Two mounted-screen tests pin it (`tests/dashboardRender.test.ts:173-203,205-226`): the card and all seven strings
render on an empty ledger, and both the card and the CTA are **absent** once one holding exists. Dashboard render
coverage is now **7 cases** (was 5).

### Item 3 — MIT license — **SHIPPED, with one contradiction**

`LICENSE` (1,069 B) is the MIT text, `Copyright (c) 2026 COSMICnoob80`; `package.json:5` `"license": "MIT"`.
`gh repo view --json licenseInfo` returns `{key: mit, name: MIT License}` — GitHub detects it. Both halves of the
FINAL item are done.

**Defect found inside this item's scope:** `README.md:166` still reads
`*TBD — License will be determined before public release.*`. The repo now has an MIT `LICENSE`, a `license` field,
and an MIT detection badge, and the front page still tells the reader the license is undetermined. That is a
checkable claim on the public document the post directs people to — the same class as the r13 Blocker #2
mechanism, and the opposite of SIGINT §3 "don't promise what the build doesn't do."

### Item 4 — the two doc lines — **PARTIAL**

- `docs/BETA-LAUNCH-POST.md:59` — the embedded-key/BYOK line is present verbatim: *"Public/production build is
  **BYOK-only** — no embedded key in the shipped bundle (the preview APK's embedded free-tier key is documented
  in README and is extractable)."* The last criterion-7 hold-back is answered. **Done.**
- `README.md:95` — was `250`, edited to `256`. The FINAL item's own wording was "correct … to the **current** test
  count." At ship the suite is **258** (`npm test`: `tests 258`), because the same commit added two first-run
  render tests. So the corrected number is wrong again immediately. **Not done to the letter** — the README says
  256, reality is 258.

---

## 3. No regressions from this beat — checked, not assumed

- **Tree:** `git diff --name-only 0fec0fd..HEAD -- src tests` = 0; only SPINE moved at the forge.
- **Suite:** 256 → **258** (+2: the two first-run render cases), 258/258 pass, TS strict clean, 0 skipped/todo.
- **`tests/costScreen.test.ts`:** the versionCode assertion was changed to a sync check (app.json ≡ build.gradle)
  rather than a hardcoded number — it still passes at 16.
- **Leak gate:** `grep -rnE "gsk_[A-Za-z0-9]{10,}|AIza[0-9A-Za-z_-]{30,}|sk-or-v1-[A-Za-z0-9]{20,}"` over
  `src tests scripts docs README.md android/app/src` → **0** matches (exit 1).
- **Artefact provenance:** r16 APK 70,138,075 B (r15: 70,134,527 B, **+3,548 B**); `assets/index.android.bundle`
  **1,822,468 B** (r15: 1,818,920 B, +3,548 — the delta matches the APK, so the APK carries the rebuilt bundle,
  not a versionCode re-stamp); `rahnuma-sabre-latest.apk` byte-identical (`cmp`/sha both `ace57d3e…`);
  `gh release list` shows **r16 Latest**, asset 70,138,075 B; N-1 r15 re-verified `4f9da99e…` unchanged.
- **Footprint unchanged:** `lib/*.so` 55,248,488 B across 56 entries (4 ABIs), `classes*.dex` 20,496,892 B.

---

## 4. Adjusted scores — only the criteria the four items touch

| # | Criterion (weight) | r15 | **r16** | Delta | Reason |
|---|---|---|---|---|---|
| 5 | **UX polish & coherence** (/10) | 6 | **7** | **+1** | The r14 hold-back was three underminers: `FIRE Achieved!` at 66.7% (R2, closed in r15), the nine-tab bar, and no first-run guidance. The last two ship here — a **5-tab** daily surface with a `More` sheet, and a calm first-run card that states the three product truths before the numbers. The first impression is no longer "unfinished". **Not 8:** Urdu is unchanged (13 hardcoded lines over 3 files; every tab label English), so one real UX leg is still partial. |
| 7 | **Security posture** (/10) | 7 | **8** | **+1** | The r14 hold-back was verbatim "partial credit held back because `docs/BETA-LAUNCH-POST.md`'s checklist lacks the disclosure line." The line is now present (`:59`), so the shipped-key trade-off is disclosed in **both** the README and the launch checklist, with a BYOK-only gate for production. The named reason is discharged, not re-argued. |
| 9 | **Community readiness** (/5) | 4 | **4** | — | **Held, deliberately.** The two named gaps — license TBD and no first-run path — are now materially addressed (MIT `LICENSE` + field + GitHub detection; first-run card). But this criterion measures what a *community reader* can trust, and the README still declares the license **TBD** (`:166`) while the repo is MIT, and still states **256** tests while the suite is **258**. A reader who opens the repo — the exact thing the post tells them to do — meets two wrong claims. The artifacts improved; the reader-facing truth did not, so the grade holds until those two lines are true. |

Carried unchanged with their r15 reasons: 1 — 7/15 (10.5), 2 — 7/15 (10.5), 3 — 8/15 (12.0, no new capability;
mutual-fund NAVs / scenario simulator / onboarding still missing), 4 — 8/15 (12.0, 2 of 12 screens have render
coverage — Dashboard and Portfolio — unchanged breadth), 6 — 6/10 (6.0), 8 — 8/10 (8.0), 10 — 5/5 (2.5).

| # | Criterion | Grade | Weight | Points |
|---|---|---|---|---|
| 1 | Core promise — never-advising, Urdu-hybrid, on-device privacy | 7 | 15 | 10.5 |
| 2 | Data truthfulness | 7 | 15 | 10.5 |
| 3 | Feature completeness | 8 | 15 | 12.0 |
| 4 | Reliability & tests | 8 | 15 | 12.0 |
| 5 | UX polish & coherence | **7** | 10 | 7.0 |
| 6 | Performance & footprint | 6 | 10 | 6.0 |
| 7 | Security posture | **8** | 10 | 8.0 |
| 8 | Regulatory/PR safety | 8 | 10 | 8.0 |
| 9 | Community readiness | 4 | 5 | 2.0 |
| 10 | Beta-post gut call | 5 | 5 | 2.5 |

**Weighted total: 78.5 / 100 → 7.85 / 10 (7.9)**

**Delta vs 76.5: +2.0**, which is criterion 5 (+1 × 10 = +1.0) and criterion 7 (+1 × 10 = +1.0). Nothing else
moved because nothing else changed.

---

## 5. VERDICT: **NOT POST NOW** — two one-line doc truths, then go

Every one of the four FINAL items is physically in the build: 5 tabs, the first-run card with the verbatim SIGINT
lines, MIT `LICENSE` + field, the BYOK checklist line, 258/258 green, r16 Latest and byte-verified. The work the
last three audits asked for is done.

But this pass found two **checkable false claims on the public README** — the exact mechanism that blocked posting
at r13 (Blocker #2) and was flagged again at r15. Neither is a money statement and neither needs a code change or
a rebuild (the README is not in the APK), but the SIGINT playbook's own rule #5 is *"don't promise what the build
doesn't do,"* and the post tells the reader to read the repo. Posting while the front page says the license is
`TBD` and the suite is `256` is the self-inflicted wound the audits kept naming.

### Exact remainder — two lines, no code, no forge

1. **`README.md:95`** — `256` → **`258`** tests.
2. **`README.md:166`** — replace `*TBD — License will be determined before public release.*` with the MIT
   statement (point at `LICENSE`).

With those two lines true, **the verdict flips to POST NOW** and nothing else is outstanding. Everything below is
already staged and needs no rewrite — only executing.

### Posting checklist (SIGINT-FIREPAKISTAN §3) — staged, execute on the two-line flip

1. **Title pattern** — a concrete artifact in a concrete constraint, never positioning:
   *"Built an on-device PSX portfolio ledger in Pakistan — no account, no cloud, works offline [screenshot]"*
   (the "Built my own X in Y" shape scored 33/38 — the best in the ledger).
2. **Screenshots** — open with a **real, readable ledger with numbers**, not a logo or hero; screenshot post
   first, *then* the install/link post the next day (the 33/38 → 14/2 two-step).
3. **What not to do** — no link-drop without context (row 7: 1/0); no DM funnel (rule 6, enforced); no anonymous
   "we"; don't post LLM output as analysis; don't promise what the build doesn't do; **never say buy or sell**,
   in the post or the comments.

Timing: weekday evening, **Thursday ~20:00–21:30 PKT**.

---

*No code was changed by this pass. Gates re-run fresh at `72d7b6a`: `npm run ts:check` exit 0 · `npm test`
258/258. The only two open items are the two README lines above.*
