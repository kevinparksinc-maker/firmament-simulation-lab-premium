# Governing Framework and 21-Method Coverage Audit

## Authority / non-negotiable user rules
This specification is drawn from repeated user instructions and governs every relevant competitive method. It is not inferred from a successful or unsuccessful wager.

1. **Ascendant Side (favorite): houses 1, 2, 3, 6, 10, 11. Descendant Side (underdog): houses 4, 5, 7, 8, 9, 12.** The market favorite maps to Ascendant only when supported by verified odds. If source not verified, quarantine prediction/label as unverified rather than pretending side A is the actual favorite.
2. **Full 360° reference wheel** with equal 30° house steps from the actual event Ascendant in Agent View and a clearly declared fixed reference in God View. Planet positions must be correct for UTC instant, frame and ephemeris; no alteration of physical longitude when assigning team houses.
3. **All twelve houses and all supported planets** must be examined for their positional relationships, rulers, house occupancies, strengths, and aspect interactions. Both sides receive full, reproducible evidence ledgers. Methods may legitimately have narrower doctrine-specific triggers, but they MUST draw from the full chart and explicitly record non-triggers; never silently ignore relevant objects.
4. **Every relevant zodiacal lunar mansion and decan** must be identified for every applicable body/house and carried into the corresponding house/planet interpretation and scoring. Distinguish 27 Nakshatras versus 28 Arabic manzils with separate coordinate conventions, reference tables, boundaries and provenance. Decans = 0–10,10–20,20–30 degrees within a sign with documented rulers.
5. **Unified maximum 5° aspect orb.** All classes and layers must use one policy (and a consistent geometry for 0/60/90/120/180 and any other specifically approved aspects). The user's preferred weight representation is **100/80/60/40**; exact orb-band cut points and whether 5.00° is included require a written mathematical mapping before modifying calculations. Until approved, FLAG any incompatible formula rather than invent thresholds.
6. **All applicable harmonious and frictional interactions** must include within-side and cross-side relationships and credit or debit the correct house side, with the requested conjunction-as-friction policy. Include each side's contacts, not just one/two significators. A directional cross-side formula needs explicit user-defined rule; simply adding all contacts is not an acceptable repair.
7. **21 independently named method lines per frame**; all available applicable data must be calculated/interpreted. A missing prerequisite or missing implementation must be marked NOT IMPLEMENTED / MISSING INPUT, not passed off as `0/0` neutral. Genuine doctrine-defined zero is permissible when supported by a complete trigger audit.
8. **Full auditability and immutability**: for each game/frame/method record rule version, source fixture, chart longitudes, houses, lordship, Nakshatra, manzil, decan, each qualifying aspect/orb/band, point sign, side, provenance, score A/B, cancellations, and why it influenced final score. No modifying base doctrine based on outcomes. Distinguish traditional rules from experimental directional mappings.

## Current-code compliance matrix

| Requirement | Code inspection result | Compliance |
|---|---|---|
| Six Ascendant and six Descendant houses | Both modules match specified sets. | VERIFIED mapping |
| Twelve ruler iterations | `territorialStack.ts` iterates H1–H12, but its named Territorial score tests ruler placement primarily; does not expose a full all-body aspect graph under that score. | PARTIAL |
| One 5° aspect orb | `frictionLayer` uses ≤5°, `aspectType` uses ±6° or ±8°, `planetaryWar` 3° threshold. Need doctrinal differentiation vs universal 5° relation rule. | **CONFLICT** |
| Complete cross-side aspect scoring | HFU logs but does not assign directional points. `chartAspectLayer` allocates a global net to A/B with no house-side attribution. | **CONFLICT** |
| Discrete 100/80/60/40 | HFU uses `max(0,1-orb/5)`; no shared band policy. | **CONFLICT** |
| All bodies in every method | Several methods use subset triggers, sometimes correctly by doctrine; Moon flow measures Moon's occupied side only. Complete eligibility/nontrigger trace not present across all. | PARTIAL / NOT CERTIFIED |
| Every planet decan + Nakshatra + Arabic manzil | Placements represented in component code, but no comprehensive invariant proving all three placements for all eligible bodies and scored house relationships. | NOT CERTIFIED |
| Void of course | Explicitly undecidable from snapshot and excluded (SHARED/0/0). | **NOT IMPLEMENTED as directional condition** |
| True besiegement and translation of light | Static angle/geometry approximations without applying/separating velocity. | **PARTIAL** |
| Fail-closed when foundation invalid | Territorial failure substituted by zero-valued foundation, although frame parity flags error. | **CONFLICT** |
| Independent 21-method doctrinal reference fixtures | Execution tests present, no reference-certified fixtures for 21 complete traditions and both coordinate frames. | NOT CERTIFIED |
| Source/odds/actual event kickoff | Historical pilot uses several scheduled times, incomplete closing-odds verification. | PARTIAL |

## Why the historical 2/7 Territorial hit rate is not a valid test of the user's framework
The table labels one narrow component `Cluster territory & house-lord placement`, whose primary score is ruler location across assigned sides. The user's full territorial theory additionally expects a complete house-wide planetary-aspect network, decan/mansion correspondences and supporting methods. The seven-game fixture also has unverified game-input provenance. The code result is an evaluation of **the present implementation**, not of the user's fully specified framework.

## Change-management acceptance contract
- Audit first; do not silently rewrite doctrine.
- Consolidate one authoritative `firmamentMethodologyV1` declaration with per-method input/output contracts and classification of traditional vs exploratory sports-mapping choices.
- Before approving a scoring change, show exact old formula, new proposed formula, reason, source, and expected invariant changes, and seek explicit user approval for ambiguous coefficients/bands.
- Every code update carries a methodology version and comparison test proving God/Agent/Synthesis propagation, plus signed A/B per-house provenance.
- Do not use historical win rates to choose scoring coefficients; retain held-out years.

## Build acceptance sequence
1. Detect all 21 methods, enumerate named requirements and coverage deficiencies.
2. Generate full 12-house / all-body / all-mansion-decan per-frame chart evidence, with exact source coordinates and aspect candidates (including unscored contacts).
3. Repair time/orb policy and eligibility semantics with explicit tests, after ambiguous orb tiers and cross-side point allocations are defined.
4. Implement applying/separating motion rules where traditional method demands it; distinguish when VOC or any layer is not implemented.
5. Prohibit a valid winner from incomplete or errored required methods.
6. Re-run and compare all fixtures with unchanged weights; only after methodology verification, estimate forecast performance on new data.

**Current verdict:** House mapping verified; the universal all-house, all-body, all-mansion, all-decan scoring and interpretation contract is **NOT SATISFIED**, and no full 21-method correctness certification is justified. This audit establishes precise engineering work rather than making premature reliability claims.
