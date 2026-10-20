# Firmament Framework Compliance Audit — all 21 methods

## The controlling user-defined framework

This is the standard the code MUST satisfy, not a retrospective explanation of the existing scoring:

- **Ascendant / sportsbook favorite:** Houses **1, 2, 3, 6, 10, 11**.
- **Descendant / sportsbook underdog:** Houses **4, 5, 7, 8, 9, 12**.
- Evaluate **all 12 houses**, their rulers, **all included planets**, their **house positions and relationships**, lunar mansions (including Vedic Nakshatras and Arabic Manzils), decans, and relevant aspects; each method must explain and score what it uses instead of silently reducing the entire chart to one or two significators.
- **Universal 5° aspect-orb limit** and preferred weight levels **100%, 80%, 60%, 40%**. The mapping of degrees to these four tiers has not yet been formally specified in the repository; inventing thresholds would change the user's rules.
- Two coordinate systems: fixed Aries-zero wheel (God View) and event-local moving Ascendant (Agent View). Each runs all 21 methods independently. **Synthesis** independently produces 21 fused method scores and its own prediction from matching frame-method evidence; it does not represent an independent astronomical measurement.
- Full explainability for each body: position, house and side, nakshatra/pada, manzil, decan, applicable aspects/orbs, beneficial/frictional interpretation, contribution sign, and provenance.
- **No formula changes without a signed version bump, source diff and explicit method-spec review.**

## Audit definition

**Wired** = layer exists and executes. **Complete** = implements all applicable user framework and tradition rules. **Verified** = pass comparison to independent golden fixtures and planetary evidence. These are DIFFERENT statuses.

| # | Current method | Wired | Primary observed limitation | Compliance |
|---:|---|---|---|---|
| 1 | Cluster territory & house-lord placement | Yes | Scores 12 ruler house placements ±1 (angular modifier); does not itself process all planet-to-house aspects, lunations, mansions, or full planetary network | Partial |
| 2 | Nakshatra influence | Yes | Trait/Gana/Yoni and ruler-derived weighting, not a demonstrated all-planet/house Nakshatra/pada/aspect audit | Partial |
| 3 | Essential dignity | Yes | Only exaltation, debility and domicile scored; triplicity, terms, faces and reception not fully included here | Partial |
| 4 | Chaldean Decans | Yes | 12-sign face/ruler context exists but lacks integrated aspect-by-house and planet-by-planet audit | Partial |
| 5 | Planetary war | Yes | Tight 3° conjunction with chosen priority; traditional planet eligibility and graha-yuddha details incomplete | Approximation |
| 6 | Arabic Lots | Yes | Multiple lots placed/scored but house-specific meaning and complete aspect network not proven | Partial |
| 7 | Arabic mansion context | Yes | Same-manzil proximity heuristic; not complete 28-manzil planetary+house score | Experimental |
| 8 | Nine-planet influence | Yes | Nine-body scores exist but not guaranteed full planetary pair/house network | Partial |
| 9 | Fixed-star amplifications | Yes | Sparse house-lord conjunction; 7/7 null in pilot. Catalog/epoch and all-star coverage unverified | Partial |
| 10 | Retrograde condition | Yes | Per-retrograde -1 house-side, without comprehensive ruler/aspect/dasha context | Partial |
| 11 | Lunar flow | Yes | Mostly Moon's occupied side (+8 angular, +5 other), not all lunar aspects/mansions and application dynamics | Partial |
| 12 | Chart-wide aspects | Yes | **5° violated** (8° conjunction/square/trine/opposition, 6° sextile); global aspect net assigned A/B without examining whose houses benefit | Noncompliant |
| 13 | Moon phase / VOC | Yes, context | Explicit 0/0 SHARED excluded from decision; Moon VOC future sign-exit calculation absent | Incomplete |
| 14 | Nodes (Rahu/Ketu) | Yes | Assigned polarity by house only; full node aspects/mansions and integrated planet-side relations not established | Partial |
| 15 | Upachaya growth | Yes | Focused on malefics occupying H3/H6/H10/H11; not automatically symmetrical as competitive houses | Partial |
| 16 | Via Combusta | Yes | Placement-only penalty for ruler in 195°–225°, not complete chart relationship handling | Partial |
| 17 | Besiegement | Yes | Shorter Mars–Saturn arc proximity proxy; applying/separating validity absent | Approximation |
| 18 | Mutual reception | Yes | Reciprocal domicile among classical planets; other reception conditions and house relationships unscored | Partial |
| 19 | Translation of light | Yes | Geometric third-body proxy with 6°/8° aspect function; applying/separating order absent | Noncompliant |
| 20 | Harmonious vs friction aspects | Yes | 5° aspect matches but **cross-side contacts descriptive only**; continuous orb taper, contrary to discrete requested weighting | Noncompliant |
| 21 | KP Star → Sub → Sub–Sub | Yes | Final A/B win-fit imported from KP calculation, without a full all-planet, all-house KP trace inside this layer | Needs independent verification |

**The layer list is not 21 independent complete canons.** Several are intentionally narrow components of a larger foundation. A rule applicable to the whole chart must be expressed at the level of the complete pipeline and evidenced there, rather than blindly forcing every individual method to calculate unrelated doctrines.

## Confirmed structural behavior

- God View: fixed Aries-zero equal houses, moving real planets; not a permanently frozen J2000 solar system.
- Agent View: event local horizon / moving Ascendant, 30° equal houses.
- God and Agent method totals include the current seven Territorial foundation components plus 13 recovered additions and the KP result. The old comments describe the foundation as seven, but **the current `territorialStack.ts` evidence emits eight named layers** (cluster, nakshatra, dignity, decans, war, Lots, manzil, nine-planet). Confirm actual 21 roster (eight plus thirteen). Inaccurate comments and documentation must not override code.
- A method can show 0/0 from not triggering, absent input, missing implementation, or intentionally shared context; these cases are currently inadequately distinguished.
- Some signed A/B values balance within or across methods. A summation being arithmetically correct does not make the method correct.
- A swallowed Territorial exception produces an invalid parity flag but God/Agent frame results may still appear. Invalid foundational data should fail closed.

## Change-control requirements

The newly installed `frameworkContract.ts` **documents** and tests the 12-house map, fixed 5° limit, specified weight levels, and the 21 method roster. It does **not yet force every existing scoring function to honor the 5° limit**, nor invent a conversion for the four weight levels. This is deliberately a no-algorithm-change audit.

Before declaring any method complete, its code must emit a **planet × house × method** ledger recording applicability, exact degree, house cusp, manzil, nakshatra/pada, decan, aspect angle, orb, role, contribution, and reason excluded. Required inputs missing → clear failure/no-call, never an optimistic neutral.

## Acceptance / release gate

1. Agree the numerical 100/80/60/40 tier boundaries and the directional semantics of every cross-side contact with the user's existing canon; otherwise retain exact user prose and report the unresolved decision.
2. One universal geometry/aspect library with **5°** cutoff, 0/360° wrap, and explicit contribution provenance; ban method-specific fallback to 6° or 8°.
3. All 12 houses and body coverage validated per method as relevant; do not silently treat sparse significator rules as whole-system Territorial.
4. Compare each of 21 implemented methods against golden documented placements and known calculations in both coordinate frames.
5. Distinguish contextual from directional signals without discarding the contextual interpretation; no SHARED evidence should masquerade as an implemented competitive outcome.
6. Verify cross-frame method parity, signed contribution arithmetic, fail-closed foundations and fused Synthesis without extra undocumented weighting.
7. Add CI guard for unauthorized formula edits: methodology version and 21 rule fingerprints pinned in the repository, with human review on changes.
8. Run historical tests only **after** these method audits pass; no outcome-driven weight tuning.

**Verdict:** Framework specification documented; 21 slots presently wired; **full correctness NOT CERTIFIED**. No claim is made that the existing engines are fully implementing the comprehensive interpretive framework.
