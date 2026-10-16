# Firmament Premium — Methods, Wiring and Usability Audit

Audit initiated 2026-10-14. Scope: main branch snapshot 9327aeab63569540f527b5a3b100cc6c3f4555e5. This report separates verified source findings from runtime verification still required.

## Foundational specification
- Equal-house system; house assignment 1,2,3,6,10,11 to Side A and 4,5,7,8,9,12 to Side B.
- Apply all eligible planetary bodies and house rulers, not a two-planet shortcut.
- Use the fixed stellar background for God View and event-local chart for Agent View, without conflating coordinate frames.
- Universal 5-degree aspect orb for the Firmament harmony/friction policy. Traditional exceptions must be explicit and separately identified.
- Distinguish calculation validity, traditional interpretive attribution, experimental competitive weighting, and measured predictive performance.

## Verified issues from source
1. CRITICAL — server/engine/firmamentEngine.ts:15-17 defines ASCENDANT_CLUSTER [1,3,6,10,11], DESCENDANT_CLUSTER [7,9,12,4,5], NEUTRAL_HOUSES [2,8]. Contradicts the specified six-house allocations; reconcile all dependent methods and add exhaustive 12-house tests before altering scoring.
2. HIGH — server/engine/territorialStack.ts:137-155 and 261 describes planetary war using priority conjunctions within 3 degrees. Audit eligibility and astronomical definition; label any simplified conjunction competition as experimental, not classical Graha Yuddha.
3. HIGH — server/engine/territorialStack.ts:263 exposes Arabic mansion context with 0/0 scores. Treat as EVIDENCE_ONLY / NOT_SCORED, never as an evaluated tie.
4. HIGH — server/engine/experimentalLayers.ts:3 and server/engine/simulationAdapter.ts:321 isolate experimental methods from production synthesis. Registry entries may be marked PREDICTIVE even though they do not affect final production winner; expose separate execution and synthesis statuses.
5. HIGH — server/engine/experimentalLayers.ts:4-18 has both calibrated-orb harmonics V1 and universal 5-degree V2. Ensure intended policy is selected consistently, document deviations.
6. MEDIUM — server/engine/experimentalLayers.ts:196-203 maps varga placement evidence into weighted side totals. Verify each divisional formula independently; predictive weight is a Firmament hypothesis, not a traditional rule.
7. HIGH — UPGRADE-VERIFICATION.md records 30 passing and one failing test as of 2026-09-25, reportedly an incorrect Vimshottari assertion. Re-run tests and verify the assertion against independent dated period examples.
8. MEDIUM — EVIDENCE-LAYER-COVERAGE.md records 18.16% project-wide statement coverage on 2026-09-25. Expand critical calculation, frame, integration, and UI tests; report current figures, not historical figures.

## Production method inventory and themes
| Method | Theme | Audit focus |
|---|---|---|
| Cluster territory & house-lord placement | Competition / territorial control | Full 12-house assignment, rulers, cusp and planetary testimony |
| Nakshatra influence | Vedic lunar mansion | Correct 27 boundaries, pada, rulers, fixed-frame mapping |
| Essential dignity | Traditional planetary condition | Correct domicile/exaltation/detriment/fall tables and frame |
| Chaldean Decans | Ten-degree faces | Chaldean ruler sequence, zodiac boundary behavior |
| Planetary war | Graha Yuddha | Eligibility, longitudinal/latitude separation and no arbitrary winner |
| Arabic Lots | Hellenistic/Arabic sensitive points | Day/night formula, source attribution, chart house assignment |
| Nine-planet influence | Planetary environment | All intended planets and nodes, balanced side assignment |
| Fixed-star amplifications | Stellar conjunctions | Frozen star coordinates, orb, no historical discovery-date confusion |
| Retrograde condition | Motion | Real apparent motion, no generic positive/negative assumption |
| Lunar flow | Moon motion/aspects | Timing, aspects, house context, harmony/friction |
| Chart-wide aspects | Planetary geometry | Circular distances, 5-degree orb, all relevant house occupants |
| Moon phase / VOC | Lunar timing | Phase geometry, VOC tradition and next aspect boundary |
| Nodes (Rahu/Ketu) | Nodal axis | Astronomical node definitions, symmetric interpretation |
| Upachaya growth | Vedic house development | 3/6/10/11 significance and side context |
| Via Combusta | Traditional condition | Degree boundaries and applicability to significators |
| Besiegement | Planetary constraint | Applying/separating relationships, malefic eligibility |
| Mutual reception | Rulership exchange | Ruler tables, dignity type, planetary eligibility |
| Translation of light | Horary aspect transmission | Separating/applying order, speed and valid significators |
| Harmonious vs friction aspects | Operational energy flow | Universal 5-degree orb, full house and planetary coverage |
| KP Star → Sub → Sub-Sub | Stellar chain | 249 subdivisions, boundaries, house significations and frame |

## Registered research methods
Harmonics V1 (variable-orb research); Harmonics V2 (universal 5-degree); Vargas D3/D9/D10/D27/D30; BAV/SAV Ashtakavarga; event lunar chain; natal Vimshottari. Confirm method-level input requirements, NOT_EVALUABLE state, source mathematics and whether called from UI/API/batch/synthesis.

## End-to-end verification matrix
1. UI event form -> tRPC router -> validation -> adapter -> astronomy engine -> fixed/event chart snapshots -> territorial foundation -> 20 method family extensions -> research registry -> synthesis -> persistence -> report -> UI display.
2. Trace each method by function and invocation site; distinguish reachable, registered-but-unused, evidence-only, experimental, predictive, and production-weighted.
3. Confirm God and Agent produce deterministic results, with explicit coordinate differences and independent calculation proof.
4. Check import CSV, schedules, historical results, batch size 10,000, progress, exports, retry/failure paths, mobile layouts, accessibility and navigation.
5. Run tests, typecheck, build and frozen historical backtests; measure per-method coverage, abstentions, calibration, leakage and reproducibility. A single historical day cannot validate predictive accuracy.

## Release gates
- No unexplained neutral houses, invented scores or silent fallbacks.
- Every method has declared inputs, output, status, formula provenance, and calculation trace.
- Every result explains planets/houses/aspects and side A/B allocation in plain English.
- Current tests and build pass, frozen backtests reproducible, baseline regression explicitly measured.
- No changes to main until runtime verification and review.

## Current status
This is an initial source-grounded audit artifact and remediation specification, NOT a completed full runtime audit. No numerical accuracy or production-readiness certification is claimed.
