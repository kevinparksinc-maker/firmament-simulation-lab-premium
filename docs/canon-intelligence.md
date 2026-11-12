# Sports intelligence integration

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
