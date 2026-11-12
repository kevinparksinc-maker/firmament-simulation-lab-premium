# Sports intelligence integration

## Analyst v2

The live sports route now builds `SportsAdjudication` before invoking the model. The provider receives the selected relationship chains, deterministic ranking and significance, contradiction ledger, applicable adjudication rules, and separate pregame conditions. The source graph, doctrine tables, formulas, technical chart, and unselected method output are local. The response still carries the technical chart for inspection.

- The evaluator connects actual Agent placements, cusp rulerships, recorded contacts, and reciprocal domicile receptions. It reuses Premium's existing dignity and reception calculations. A God sector is recorded as background geometry. Team ownership is taken from the Agent territory ledger.
- One item represents each planet. An explicit versioned rubric bounds connectivity points, favors actual H1/H7 rulership, and promotes links across team territories. Mixed testimony remains `BOTH` and contributes no directional Tier 1 mass. The 21-method engine remains a separate baseline. The rubric is experimental.
- The package includes all Tier 1 and contested items, the highest three Tier 2 items per side, and an available counterpoint when needed. The current chart has twelve eligible bodies, which bounds the package below the illustrative 15–25 item target.
- The contradiction ledger preserves mixed rulership, summarizes actual God/Agent score reversals, and supplies a brief scope rule for the archived conjunction classification. Unresolved conflicts can be adjudicated in context. The evaluator lacks directed Graha Drishti, Drig Bala, and sourced functional-beneficence or derived-house priorities. Mansion data is contextual.
- The judge builds both cases and returns exact evidence IDs and contradiction IDs. Local validation enforces side eligibility, rule authorization, and complete contradiction coverage. A confidence or ranking disagreement becomes an audit flag. Structural validation establishes citation integrity. Free-text entailment still requires review.
- The route attempts one Gemini invocation per usable chart. Provider or validation failure returns the local evaluator result with an explicit status and zero repair calls. Audit telemetry records payload bytes, returned token usage, latency, citation coverage, and contradiction coverage.

### Replay

```sh
node --import tsx scripts/benchmark-sports-analyst.ts
node --import tsx scripts/benchmark-sports-analyst.ts --live
```

The replay uses the latest 20 market-assigned historical fixtures and withholds the outcomes from the judgment path. The non-astrological comparator uses a smoothed prior favorite win rate in the same sport, with a one-day cutoff. The raw favorite and the existing deterministic 21-method synthesis are also reported. The live switch requires a configured Gemini key and records one adjudication per usable fixture.

In the local run the mean package was 12,475 bytes, down from 131,871 bytes for the previous package. Charts supplied 6–10 items. Mean deterministic latency was 389 ms during local validation and included a cold-run outlier. The local fallback picked 3 of 20 and abstained on 17. It was correct on those three picks. The existing 21-method synthesis had 11 hits, the market favorite had 10, and the chronological comparator had 4. These fixture results describe the deterministic paths. Live model accuracy, exact token counts, and end-to-end latency remain unmeasured.

## Previous branch implementation

This branch starts at Premium `80bc659d449a135b65c0347a9da6b8e053c7fc12`. The companion Guardian development branch is `feat/canon-intelligence`, based on `c596e34012ac54aec9575cb30b3ce56fbc9aa348`.

## Request flow

1. The existing `ai.sportsReading` or `ai.sportsChat` route calls `interpretSportsEvent`. The simulation runs once with the outcome field removed. The linked pregame feed can provide physical observations independently.
2. `sportsIntelligence.ts` indexes recorded bodies and houses, creates separate occupancy and rulership edges, and attaches the recorded planetary contacts. All twelve local cusp rulerships are represented, including rulers that serve both sides. God sectors are kept as fixed-background locations.
3. The evaluator reads all core and supplemental outcomes. The ranking uses relative score margin as a review aid, never as a new score. It detects opposed A/B conclusions for the same method across the two frames and retains evidence for both sides. Ties and unavailable results have explicit status. God and Agent observations are correlated projections of one sky.
4. The packet includes the 21 core methods per frame, their existing 21 joint outputs when parity passes, the full per-frame method registry, three supplemental joint outputs, and all eight experimental verdicts. Rule and evidence references point to the actual method and frame. Full technical evidence and the previous three-wheel representation are still available in the response.
5. The existing Gemini client makes one provider request for each sports reasoning invocation. A provider error, malformed judgment, unsupported citation, or incorrect baseline comparison fails the request locally. There is no automatic sports retry or repair request. An explicit user follow-up is a separate reasoning invocation. Deterministic simulation and batch execution make no AI calls.
6. The AI may reach an independent judgment. Citation validation enforces the returned evidence ID, exact method, and matching frame. It does not prove that every free-text assertion follows from a citation.

## Guardian Canon refresh

From Guardian, after installing its existing dependencies:

```sh
node --import tsx scripts/export-sports-canon.ts > ../firmament-simulation-lab-premium/server/engine/guardianCanon.generated.json
```

The committed JSON is generated data. Canon definitions are authored in Guardian. Premium loads the projection locally and records whether each linked technique shares a concept, uses a different implementation, or provides doctrine only. The evidence package does not claim Guardian calculation parity or use a different zodiac conversion. Update the two branches together when the export schema or a linked method changes.

## Verification and gaps

- Provider tests cover a single fetch for success, HTTP 429/503, transport failure, and a truncated response. Missing configuration makes zero provider requests.
- Sports interpretation tests verify the complete method roster, graph, disagreement links, unchanged engine scores, outcome removal, valid citations, and rejection without a second call.
- Live Gemini and live physical feeds require deployment credentials and an eligible upcoming linked event. Local tests use fixtures and mocks.
- Guardian Shadbala, Bhava Bala, Graha Drishti, Sefer Yetzirah, Genesis, and transit are explicit gaps in Premium's evidence package. Other Guardian links may point to Premium variants. The two engines use distinct XYZ providers, sunrise implementations, node models, and fixed-star configurations.
- The archived Chaldean decan and conjunction scorers, Venus eligibility inconsistencies, and translation-of-light proxy are disclosed in the packet. This branch does not recalibrate scores or assert historical prediction accuracy.

## Local results

The full suite passed all 138 tests across 44 files. The starting revision passed 130 tests and failed four, all in sports interpretation and the outdated provider fixture. The production build passed. The TypeScript check still reports the same 40 diagnostics from legacy Forge environment fields as the starting revision.

For the Dallas–Philadelphia fixture, the serialized reasoning package was 133,424 bytes versus 803,116 bytes for the previous three-wheel prompt payload, an 83% reduction. The package retained 100 evidence rows and flagged nine opposite cross-frame method outcomes.
