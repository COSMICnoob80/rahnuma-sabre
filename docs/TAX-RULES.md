# Tax Rules — Provenance and Caveats

Every tax figure in this app must be traceable to a source and carry an honest confidence
level. This file is that record. If a rule here is wrong, the calculator is wrong, and the
fix belongs in `src/utils/calculators.ts` plus `tests/calculators.test.ts`.

---

## Capital Gains Tax on PSX securities

**Primary source:** NCCPL notice, 5 August 2025, setting CGT rates effective 1 July 2025
under the Income Tax Ordinance, 2001 as amended by the **Finance Act 2025**.

| Acquisition window | Treatment | Confidence |
|---|---|---|
| Before 1 July 2013 | Exempt | High — stated directly |
| 1 July 2013 – 30 June 2022 | Legacy slab: 15% (under 1 year) gliding to 0% after 6 years | Low — inferred, not in the FY26 notice |
| 1 July 2022 – 30 June 2024 | Progressive, 12.5% gliding to 0% by holding period | Medium — range stated, boundaries not published |
| On/after 1 July 2024 | **Flat 15%**, any holding period, any ATL status | High — stated directly |

Related rules from the same notice:

- PMEX: flat 5%, ATL and non-ATL alike, from 1 July 2025.
- Mutual funds (MUFAP): 15% for securities acquired after 1 July 2025.
- **Section 4C super tax** on capital-gains income: 0% up to Rs 150 million, rising to 10%
  above Rs 500 million. Surfaced as a note, not computed.

### Where this differs from earlier documentation

The old `SPEC.md` table (15 / 12.5 / 10 / 7.5 / 0 by holding year) described the
pre-Finance-Act-2024 regime and applied it to every acquisition. Two consequences that the
old code got wrong, both now pinned by tests:

- A holding kept 1,500 days used to be taxed at 0%. For anything acquired on or after
  1 July 2024 it is taxed at **15%** — the flat rate has no holding-period relief.
- Holding days alone no longer determine the rate. The **acquisition date** decides which
  regime applies; holding days only matter inside the legacy tranches.

### Caveats to resolve before public launch

1. The 2022–2024 glide-path bucket boundaries are not published in the notice. The current
   implementation applies the legacy 6-year shape capped at 12.5%. Confirm with NCCPL.
2. The 2013–2022 tranche is not addressed by the FY26 notice at all; the pre-2024 schedule
   is used as the best available approximation.
3. Non-ATL double rates applied historically. The notice says post-July-2025 acquisitions are
   flat 15% "regardless of ATL status", so no ATL input is collected. Earlier tranches are
   not covered and may differ.
4. Super tax is aggregate across a tax year, not per trade, so it cannot be computed
   correctly from a single-trade calculator. It is disclosed, never estimated.

**Rule:** when the UI cannot be certain, it must say so. Never present an inferred rate as
settled law.

---

## FIRE withdrawal rate

The 4% figure is the Trinity-study convention, not Pakistani law. Pakistani inflation has
historically run well above US inflation, so the app exposes both the inflation rate and the
withdrawal rate as user inputs and computes the real return explicitly rather than assuming
a nominal figure means anything.
