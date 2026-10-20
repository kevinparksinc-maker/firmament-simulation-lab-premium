# Full 21-method code integrity audit — continuation

**Scope:** actual engine source after PR #29, before this PR. **Protocol:** audit against the fixed six-house Ascendant/Descendant framework; no tuning against known outcomes. **Status:** source-derived static inspection and targeted regression tests, not full independent doctrinal or predictive certification.

## Confirmed newly corrected defects in this branch

1. **Missing house lord was skipped**: `calculateRestoredTerritorial()` previously did `if (side === "neutral" || !placement) continue`, which could silently evaluate fewer than the required 12 rulers. Now fails closed.
2. **Missing lot-body longitude fabricated Aries 0°**: `canonicalLots` previously used `?.tropicalLongitude ?? 0`. Now requires actual finite body longitude.
3. **Missing Sun altitude implied day sect**: prior `(Sun?.altitude ?? 0) < 0`. Now fails unless Sun altitude exists and is finite.
4. **Missing decan ruler was placed in House 2**: prior `rulerPlacement?.house ?? 2`. Now fails.
5. **Night-dependent Arabic Lots had daylight intermediate values**: Fortune and Spirit were instantiated for daytime even if `night=true`, then passed into other Lot definitions. Primary Fortune/Spirit outputs reversed at night, but Eros/Victory/Necessity/Courage and other derived Lots used inconsistent inputs. Now the shared Fortune/Spirit intermediates reverse with sect; verified by deterministic night-lot fixtures.

These are **actual calculation fixes**, not speculative improvements to accuracy. They may change results for previously evaluated night games.

## Method-by-method implementation status (all 21)

| # | Method | Inputs really used | Remaining validation gap |
|---|---|---|---|
| 1 | Territory and house-lord placement | 12 house rulers, current lord house, opponent cluster, angular penalty | Complete all-body/all-house territorial effect and independent ruler fixtures |
| 2 | Nakshatra influence | House-lord Nakshatra, trait profile, gana, yoni, dignity | Independently check 27 profiles, coordinate conventions and the relationship to house occupants |
| 3 | Essential dignity | Lord's sign, exaltation, debility, domicile | Traditional triplicity, term/bound, face and fall/detriment coverage not independently verified |
| 4 | Chaldean Decans | Each planet sign/decan and decan ruler's house-side | Separate decan of every planet and house cusp; no false house fallback after this PR |
| 5 | Planetary war | Pairs qualifying <=3 degrees; priority-winner list | Eligibility and traditional graha yuddha doctrine versus simple conjunction proxy |
| 6 | Arabic Lots | 18 named lots, source-tagged formulas, sect and house side | Sect-dependent intermediates corrected here; source text, exact formulas and event day/night verification still necessary |
| 7 | Arabic mansion context | All body Manzil IDs, same-sector close pairs <=5° | Cross-side co-mansion still descriptive only; true Arabic 28-station meanings not fully credited |
| 8 | Nine-planet influence | Every supplied body house side; Sun/Moon 1.4 else 1 | Confirm all expected bodies, duplicated nodes and relevance of fixed weight |
| 9 | Fixed-star amplification | Recovered-star catalog, eligible house lords, longitude proximity | Validate catalog epoch and star longitudes; dormant/neutral on pilot |
| 10 | Retrograde condition | Retrograde flags and house side, -1 per retrograde body | Independently verify ephemeris motion and side-specific semantics |
| 11 | Lunar flow | Moon occupied house, bonus +8 angular else +5 | Not full lunar mansion/aspect/application/VOC condition |
| 12 | Chart-wide aspects | Whole-chart pair contacts <=5° credited to involved competitive house sides after PR #28 | House-to-cusp aspects, double count reconciliation and independent geometry reference |
| 13 | Moon phase / VOC | Sun-Moon angle phase, SHARED 0/0 | True prospective Moon applying aspects and sign-exit remain unimplemented |
| 14 | Rahu/Ketu | Node placements, Rahu plus / Ketu minus, angular strength 2 | Correct celestial node model, all house interactions and tradition-specific directional meaning |
| 15 | Upachaya | Malefics occupying 3/6/10/11 | Competitive descendant-side equivalence and other upachaya aspects |
| 16 | Via Combusta | House-lord positions in [195°,225°) | Repeated-ruler attribution and doctrinal specificity |
| 17 | Besiegement | Mars/Saturn arc and enclosed house lord, proxy ≤60° | Applying/separating enclosure and actual perfection, not present |
| 18 | Mutual reception | Classical planet reciprocal domicile + occupied sides | Additional reception types and role of shared pair |
| 19 | Translation of light | Non-lord geometric contacts to both side lord clusters | Timing and application vs separation; aspect geometry is a proxy |
| 20 | Harmony vs Friction | Planetary pairs, conjunction/sextile/square/trine/opposition <=5°, same-side and symmetric cross-side points | User's 100/80/60/40 exact orb bands unspecified; no full house-cusp relationships; currently continuous decay |
| 21 | KP Star/Sub/Sub-Sub | Final existing KP family win-fit A/B fed into full package | End-to-end KP intermediate values and recalculation source fixtures still needed |

## Wider scoring pipeline

- User Ascendant houses 1/2/3/6/10/11 and Descendant houses 4/5/7/8/9/12 are present in the source.
- `completeChartLedger` introduced in PR #29 logs each body, assigned house-side, Nakshatra, Arabic mansion and decan number, as well as aspects within five degrees. It is **evidence**, not proof each of the 21 layers uses each field.
- `fullPackageDualFrameChallenger` sums seven Territorial foundation layers plus thirteen additional recovered layers plus KP. `Moon phase / VOC` stays informational and excluded; equal A/B sides can cancel directionally.
- CrossFrame Synthesis pairs 21 matching names and blends God + Agent A/B with 50/50 coefficients, not an independent source of celestial positions.
- Historical hit percentages on seven rivalry games cannot diagnose doctrinal correctness, and some fixtures use scheduled times and odds requiring independent validation.

## Pending correction gates

1. One documented methodology contract with 5° universal geometrical relation, tested chart cusp/planet relations, and explicitly defined 100/80/60/40 weight tiers (do not infer unknown band boundaries).
2. Independent ephemeris, Arabic Manzil, Nakshatra, decan, fixed-star and sect fixtures at sign/house and 0°/360° boundaries.
3. Implement Moon applying/separating/sign-exit, true VOC, besiegement and translation of light; do not call those traditional rules complete until evidence exists.
4. Ensure no missing inputs can silently generate valid winners anywhere in all 21 methods; this PR guards four Territorial/Arabic Lot entry points only.
5. Review source-level, coefficient-level changes before merging. Freeze exact methodology version and write a side-by-side formula change ledger.
6. Rerun all archived fixtures after each formula correction but never fit coefficients from the known outcomes.

**No claim:** This audit does not establish that all 21 methods are fully correct or scientifically predictive. It identifies actual input-integrity defects, implements guards and corrects Arabic Lot sect intermediates.
