# Forensic audit — method cancellations, scoring changes, and accountability

**Scope:** All 21 current registered prediction layers in God View and Agent View, their 21 paired Synthesis outputs, and seven documented rivalry fixtures. **No prediction formulas have been changed by this audit.**

## Principal findings (verified in main source)
1. **Orb-policy divergence — confirmed.** `fullPackageDualFrameChallenger.ts` `aspectType` uses conjunction ±8°, sextile ±6°, square/trine/opposition ±8°. HFU separately uses 5° for all five aspect types. This violates the user's universal 5° rule. A contact rejected by HFU can still affect Chart-wide Aspects, Translation of Light, and other methods using `aspectType`.
2. **Chart-wide aspects have no team-side attribution — confirmed.** `chartAspectLayer` accumulates the sign of all planet-pair aspects into a global net, sets A=net/2 and B=-net/2, without checking either planet's house or team cluster. This can push a team merely because the overall chart has more trines/squares, even if the contact relates to the opposite team. Method is structurally inconsistent with the all-planets/all-houses competitive premise.
3. **HFU cross-cluster aspects do not vote — confirmed.** Although they are logged, cross-side aspects earn neither side points. Same-side aspects use continuous `1-orb/5`, not the user's 100/80/60/40 tiers.
4. **Certain cancellation is intentional.** `Moon phase / VOC` is `SHARED`, score 0/0 and excluded from totals. It carries descriptive phase context but lacks a true Moon future-aspect-to-sign-exit computation. It should not be represented as functioning directional scoring.
5. **Legitimate non-trigger vs missing logic can look identical.** In seven rivalry games, some methods produce 0/0 for no trigger. But a universal zero from fixed-star, besiegement or VOC cannot be attributed solely to astrological conditions without reference fixtures and robust diagnostics.
6. **Equal side scores cancel in a method vote.** Scores A=B, even nonzero, yield a tie in `layerWinner`; after aggregation different signed contributions can offset. Individual 5/7 method correctness does not dictate the aggregate direction.
7. **Frame aggregate excludes shared layers.** `buildFrame` adds full Territorial foundation and each non-`SHARED` addition, and applies a 1.5 absolute margin for a no-call. Shared scores never contribute; no-call is not a reported method failure.
8. **Catch-and-replace error path.** `buildFrame` catches exceptions thrown by `calculateRestoredTerritorial`, replaces the 7-layer foundation with zeros and carries `foundationError`; other layers may still score. `frameParity` flags this invalid and Synthesis withholds, but God/Agent still publish their frame verdict unless callers gate them. A fail-closed policy is required.
9. **Synthesis may compound misleading weights.** It blends each pair of numerical A/B scores 50/50, rounds individual method scores to two decimals and sums. It is third prediction output, but uses the same correlated underlying evidence; it does not independently validate scoring doctrine.
10. **Raw player history is not a provenance contract.** GitHub records the committing account, not necessarily the prompt author, reviewer approval or authorization. No conclusion that another person secretly changed methods is supported by commit history.

## Tracked substantive file changes

The commit history for `server/engine/fullPackageDualFrameChallenger.ts` includes:
- `a4964d1e77` (2026-09-22) — Manus checkpoint reorganized app tabs.
- `94afd30052` (2026-10-03) — Manus checkpoint added canonical sports simulation and method engine.
- `33adf6adc1` (2026-10-20 UTC) — account `kevinparksinc-maker`: whole-chart HFU and node polarity rewrite.
- `9b02ef6669` (2026-10-20 UTC) — same account: mutual reception, besiegement geometry and VOC wording changes.
- `6368eeac11` (2026-10-20 UTC) — same account: broaden mutual reception to all frame planets.

`server/engine/territorialStack.ts` also changed:
- `aca899d654` (2026-10-20 UTC) — account `kevinparksinc-maker`: Arabic manzil co-location scoring.

Commit dates are UTC, which can display as October 19 in Nevada. The trace does **not** establish that any change was unauthorized.

## Observed cancellation ledger — seven rivalry games

The executable ledger evaluated 147 method rows in each view (21 methods × 7 games). These are **score-state classifications**, not judgments of doctrinal correctness:

| Category | God View | Agent View | Synthesis |
|---|---:|---:|---:|
| A = 0 and B = 0 | 40 | 37 | 39 |
| Equal nonzero A/B | 11 | 9 | 16 |
| Opposite-signed A/B | 33 | 31 | 29 |
| Both A/B nonzero and same sign, unequal | 37 | 39 | 50 |
| Only one side nonzero | 26 | 31 | 13 |
| **Total** | **147** | **147** | **147** |

**Sign convention:** Opposite signs are not automatically a `TIE`: for example A=+3 and B=-3 create an A advantage, not cancellation. Same-signed unequal values also can yield a winner. Only A=B is an exact method tie. Some nonzero methods oppose others in the **aggregate sum**, a separate phenomenon from within-method ties.

**Arithmetic invariant:** In all seven rivalry games, summing the 21 displayed A and B scores exactly reproduces each God and Agent frame total to three decimal places. This verifies the current summation path, **not** the validity of the underlying formulas.

**Critical observation:** The Moon-phase/VOC layer is intentionally 0/0. Fixed-star amplifications and besiegement also returned zero in multiple fixtures. The audit can establish that the output is zero, but deciding whether that is a true non-trigger or an incomplete condition requires independent sky/reference calculations.

## Classification of all 21 methods

| # | Method | Primary cancellation / risk | Action |
|---:|---|---|---|
| 1 | Cluster territory & house-lord | Opposite-house ruler penalties can override placement bonuses; narrow representation of intended Territorial | Independent all-12-house ledger and reference fixtures |
| 2 | Nakshatra influence | Opposite side scores can net out; dignity-related overlap | Verify full 27 profiles and contribution per ruler |
| 3 | Essential dignity | Neutral signs score zero; only exile/exaltation/own modeled | Add full doctrine/reference table |
| 4 | Chaldean Decans | Opposed ruler gains can offset | Boundary and ruler accuracy fixtures |
| 5 | Planetary war | Only tight 3° cases score; other cases zero | Verify conditions and eligibility |
| 6 | Arabic Lots | Day/night/house effects and multiple lots need individual trace | Audit sect and exact Lot positions |
| 7 | Arabic mansion context | Co-location is rare and experimental | Validate source doctrine and boundary |
| 8 | Nine-planet influence | House contributions can cancel | List every planet, side and signed point |
| 9 | Fixed-star amplifications | Entire seven-game sample neutral | Verify star dataset, epoch, contacts and eligibility |
| 10 | Retrograde condition | No retrograde planet or offsetting side penalties | Inspect ephemeris flags and attribution |
| 11 | Lunar flow | Moon's occupied house dominates; can disagree with other layers | Expand intended Moon aspect/mansion rules |
| 12 | Chart-wide aspects | **Global net assigned to A/B without house allegiance; inconsistent orbs** | Rebuild attribution from each side's houses |
| 13 | Moon phase/VOC | **Explicit SHARED 0/0** | Compute true VOC and define effect or leave informational |
| 14 | Rahu/Ketu | Opposite node polarity gives directional outcome by design | Verify node sign/house and physical/derived inputs |
| 15 | Upachaya growth | Scores only malefics in houses 3/6/10/11 | Test both sides and complete doctrine |
| 16 | Via Combusta | Trigger only 195°–225°; repeated house lords can multiply points | Verify unique planet/ruler aggregation |
| 17 | Besiegement | Geometric enclosure can never trigger when Mars/Saturn >60° | Implement applying/separating condition |
| 18 | Mutual reception | Cross-side +1/+1 reception legitimately cancels; domicile only | Assert all reception pairs and variants |
| 19 | Translation of light | Geometric contact proxy and inconsistent aspect orbs | Require motion/applying-separating |
| 20 | HFU | **Cross-side contacts unscored, 5° linear taper differs from 100/80/60/40** | Implement specification with fixtures |
| 21 | KP Star/Sub/Sub–Sub | Family and KP win-fit scores can oppose other methods | Trace all lord stages and differential |

## Why results changed after prior fixes

The initial 20-game smoke test was run before changes to HFU, nodes, mansion co-location, mutual reception, besiegement and phase reporting. On the updated code, God scored 11/20 instead of 12, while Agent scored 13/20 instead of 12. These changes can be causally traced to code modifications and are **not** evidence of a mysterious automatic or covert modification.

## Additional failure: neutral-classifier semantics

`neutralMethodAudit.ts` sets status `triggered` whenever **either** A or B is nonzero, even when A equals B. It calls this a *directional contribution*, which is inaccurate for balanced nonzero methods. With zero scores and a `calculation` + `detail`, it may mark a row `valid-neutral` without independently verifying whether the rule's trigger worked. Consequently a green neutral audit does not certify the method.

## Required controls before claims of correctness

1. Freeze a named immutable methodology version with 21 signed rules and one 5° orb contract; record commit SHA in every report.
2. Explicitly classify `zero-both`, `equal-nonzero`, `opposing-signs`, `same-sign offsets`, `SHARED excluded`, `input missing`, and `error fallback` separately.
3. Add per-method invariant tests proving every summed A/B point and its source chart input; run both frames.
4. Ensure no invalid Territorial foundation can return a directional prediction.
5. Require documented acceptance of changed algorithms; flag source diffs and fingerprint scores in CI for reviews.
6. Keep archived dataset, event-time quality, favorite-odds proof and historical prediction baseline separate; never tune to seven known games.

**Evidence exporter:** `server/engine/forensicCancellationLedger.test.ts` writes a structured `FIRMAMENT_CANCELLATION_LEDGER=` marker to CI logs, one record per fixture with 21 per-view A/B scores, neutral statuses and cancellation types. This tool audits, it does not fix scoring algorithms.
