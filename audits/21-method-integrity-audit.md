# Full 21-method integrity audit — God, Agent, Synthesis
Date: 2026-10-19. Scope: source-code static audit and regression invariants, not a certification of traditional validity or predictive power.

## Severity and operational decision
**DO NOT treat the 7-game or 20-game accuracy as verified method accuracy.** All 21 named method slots are wired in each view, but implementing a method slot is not equal to correctly implementing the full doctrine. Several methods use approximations or different weight conventions, and the 21 method outputs are not independent.

**Confirmed structural checks**:
- 7 territorial layers + 13 recovered archive layers + 1 full KP layer = 21 per frame.
- God house rule: fixed Aries-zero. Agent: moving event ascendant (unless explicitly selected other model).
- House membership sets: Ascendant 1,2,3,6,10,11 and Descendant 4,5,7,8,9,12.
- Frame winner = sum of territorial foundation plus non-SHARED added layers; abs(differential) below 1.5 becomes TIE.
- Separate Synthesis pairs the same method name across frames and uses 0.5 God + 0.5 Agent on raw A/B scores. All three are related measures of one chart; Synthesis is not an independent measurement.
- Main regression test currently verifies execution and 21 rows; it does not validate all calculations against independent reference tables.

## Method-by-method audit queue and current implementation

| # | Method | Implemented in | Source-level observation | Audit status |
|---:|---|---|---|---|
| 1 | Cluster territory & house-lord placement | Territorial | All 12 house rulers: +1 same cluster, bonus +1 ruler in own house; -1 on enemy cluster and extra angular penalty. Does **not** calculate all cross-planet and house aspects inside this component. | **Specification mismatch / needs full design** |
| 2 | Nakshatra influence | Territorial | 27-profile trait/Gana/Yoni and dignity-derived points to house rulers; not a demonstrated independent classical predictive rule. | **Needs independent reference fixtures** |
| 3 | Essential dignity | Territorial | Exaltation +2, debility -2, own sign +1, otherwise neutral. Missing other traditional essential dignity categories from this score. | **Partial** |
| 4 | Chaldean Decans | Territorial | Chaldean faces 0–10,10–20,20–30; face/cluster ruler scoring. | **Needs cusp and lord reference tests** |
| 5 | Planetary war | Territorial | Planet-pair conjunction <=3°, winner determined by priority list; simplified compared with strict classical graha yuddha rules. | **Approximation** |
| 6 | Arabic Lots | Territorial | Lots computed once/chart; A/B credited by house. Must independently verify formulas, diurnal/nocturnal branch, frame/sect, and each lot's doctrine. | **Needs independent tests** |
| 7 | Arabic mansion context | Territorial | Same-manzil co-location of pair within 5° scored to one side; not established as a classical 28-manzil judgment by this test. | **Experimental** |
| 8 | Nine-planet influence | Territorial | Nine-body house placements plus scored body effects. Need planet-by-planet side ledger and treatment of lunar nodes. | **Needs independent reference fixtures** |
| 9 | Fixed-star amplifications | Recovered additions | Sparse conjunction-based scored contacts to house lords; 7/7 neutral on the pilot. Need ephemeris epoch, star precession and accepted star catalog verified. | **Needs data/reference audit** |
| 10 | Retrograde condition | Recovered additions | Retrograde placement modifies the occupied house-side score; cannot assume retrograde is always beneficial or harmful without doctrine. | **Interpretive approximation** |
| 11 | Lunar flow | Recovered additions | Directional scoring primarily driven by Moon house/side, not a complete transit aspects, application, mansion, phase and motion doctrine. | **Partial** |
| 12 | Chart-wide aspects | Recovered additions | Planet-pair geometric method with signed global differential. Verify all contacts, house assignment, orbs and no duplication with HFU. | **Needs cross-method reconciliation** |
| 13 | Moon phase / VOC | Recovered additions | Phase context is computed; VOC explicitly undetermined, layer marked SHARED and excluded from winner. | **Not fully implemented** |
| 14 | Nodes (Rahu/Ketu) | Recovered additions | Node house/side bonuses and penalties; test whether each node's sign, mansion and aspects are applied per user design. | **Partial** |
| 15 | Upachaya growth | Recovered additions | Malefic placement in 3/6/10/11; the competitive meaning of houses differs by side and needs reconciliation with six-house teams. | **Needs doctrine and parity review** |
| 16 | Via Combusta | Recovered additions | Scoring house lords in 15° Libra through 15° Scorpio; must distinguish doctrine, frame, and use beyond placement-only. | **Partial** |
| 17 | Besiegement | Recovered additions | Geometric bracketing by Mars/Saturn; does not establish applying/separating malefic enclosure. 7/7 neutral in pilot. | **Approximation / not traditional perfection** |
| 18 | Mutual reception | Recovered additions | Reciprocal domicile reception among seven classical planets. Other forms and connection to relevant houses not fully modeled. | **Partial** |
| 19 | Translation of light | Recovered additions | Third body connected by major geometric aspects to clusters; requires separating-then-applying timing to meet strict doctrine. | **Approximation** |
| 20 | Harmonious vs friction aspects (HFU) | Recovered additions | All body pairs within 5° for 0/60/90/120/180. Same-side aspects directional; **cross-side contacts are only logged**. Current weighting continuous 1 - orb/5, not user's requested discrete 100/80/60/40 sequence. | **Confirmed specification mismatch** |
| 21 | KP Star → Sub → Sub–Sub chain | Recovered additions / existing KP | Gets final asc/desc KP win-fit scores; need trace from each family ruler through star/sub/sub-sub to sign, house and influence. | **Needs internal scoring trace audit** |

## Highest-priority engineering defects and gaps
1. **Cross-side HFU**: a matched cross-cluster aspect makes no contribution to the verdict. Requires a defined doctrine-aware directional effect, not a blind patch that rewards every contact.
2. **Orb weights**: HFU uses continuous taper rather than explicit 100/80/60/40 policy. Formalize how these four levels map to 0°–5° before changing mathematical results.
3. **Territorial completeness**: the displayed Territorial row is a narrow house-lord position measure; the full Territorial stack contains other separate method lines. Decide whether the intended complete method means a distinct comprehensive Territorial index or all seven territorial foundation parts together.
4. **Void of course and besiegement/translation**: full time-dependent planetary applications missing; do not convert neutrality into arbitrary prediction points.
5. **Double-counting**: dignities, manzils/nakshatras, planetary war, planetary aspects and related ruler placements may be represented in multiple scores. Create a shared provenance ledger to identify reused placements and aspects.
6. **Input confidence**: several rivalry fixtures rely on scheduled kickoff rather than actual starting whistle. Favorite designations and historical odds need source-linked audit; method correctness cannot be judged from inaccurate inputs.
7. **Confidence**: engine `margin` is an absolute score margin, not a calibrated probability; describe it accurately.
8. **Silent fallback**: full package catches Territorial exceptions and substitutes zero-value seven-layer foundation. This should quarantine the fixture, explicitly invalidate synthesis and expose the exception, not silently issue a verdict.
9. **Synthesis truncation**: fusion rounds each method to 2 decimal places before sum; its aggregate can differ from direct fusion of unrounded frame totals. Test this numerically and specify tolerances.

## Necessary acceptance criteria before re-testing prediction accuracy
- A deterministic one-page specification for all 21 methods (required input, coordinate frame, all 12 houses, aspect families, cutoff, orb weights, signed side effect, no-call rule).
- Independent unit fixtures for each method including boundary aspects, sign and house edges, 359–0 wrap, angles and retrograde.
- A method-by-method audit matrix for all 21 showing raw planetary positions, sources, score contribution, and proof the result equals the defined formula, separately in God and Agent.
- Numeric sum invariants: frame total equals sum of included 21 method scores within rounding tolerance, and Synthesis equals explicitly specified fusion.
- Fail closed when a required method throws, rather than generating an apparently valid forecast with missing inputs.
- Historically grounded kickoff/odds verification, holdout years and comparisons to favorite-only baseline.

**State:** First-pass source audit finished; **none of 21 methods certified fully correct**. Do not misrepresent CI green status as doctrinal correctness. No scoring changes made in this audit (avoids tuning to known outcomes).
