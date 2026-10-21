# Individual Method Laboratory — 31 fields

**Status:** experimental research branch; no method has been independently certified for doctrinal correctness or predictive accuracy. The original 21-method calculator remains available as the unchanged comparison path.

## Single coherent runtime pipeline

```text
Event / imported historical fixture
    │
    ├─ resolved favorite = Ascendant side A
    ├─ resolved underdog = Descendant side B
    ├─ explicit odds source / provenance warning / UTC event time
    ▼
resolveEventContract()  [shared by full and standalone engines]
    ▼
Canonical event + one consistent 360° ephemeris
    ├─ God View: permanent 0° Aries, reverse numbered equal houses
    └─ Agent View: local/dawn-anchored ascending cusp, same planets, reverse numbered houses
         │
         ├─ method registry CORE_01 .. CORE_21
         └─ method registry HARMONICS/VARGA/ASHTAKAVARGA/DASHA .. total 31
                  │
                  ▼
         One method → TWO separate raw A/B ledgers
                  │
                  ▼
         Within-method 50/50 God–Agent arithmetic (never sums other methods)
                  │
                  ├─ raw equal strength A=B → preserve BOTH numeric scores
                  ├─ no proven trigger → true 0/0 if independently evidenced
                  ├─ zero net but missing trigger trace → ZERO_NET_UNRESOLVED
                  ├─ missing natal chart or invalid inputs → MISSING_INPUT
                  └─ doctrine/5°/weights conflict → score visible but NOT certified
                  │
                  ├─ 31-row visual scorecard → expandable evidence breakdown
                  └─ 10,000-game ONE-method batch runner → hit/miss/coverage stats
```

**Shared consistency tests:** `server/engine/pipelineCoherence.test.ts` runs every one of the 31 method fields against the same full simulation and checks God/Agent raw score parity, 12 houses, 12 body positions, and a dawn-anchored Agent View. `server/simulationMigrationIntegrity.test.ts` checks persistent odds-source schema migration consistency.

**Legacy outcomes:** The unchanged 21-method winner model and optional experimental 31-method ballot are separate from this independent method laboratory. A quarantined method keeps real A/B/average scores in the audit, even though it cannot cast a predictive ballot. Historically asserted `market-odds` fixtures without source provenance are still calculated, but downgraded to unverified/manual for any accuracy or pattern-mining claim.

**Still awaiting user-approved doctrine:** Orb tolerance is 5° and the desired weighting values are 100/80/60/40, but the boundaries assigning each band are not defined. We have deliberately NOT guessed cutoffs or fabricated certification. See `server/engine/methodCertificationPolicy.ts` for the centralized list of specific blockers, including Harmonics V1 and V2, chart-wide aspects, friction, classical lunar and horary proxies. This means the app has a coherent *experimental execution* path, not 31 certified predictive methods.

## Tested visual operating controls: 1, 200, 10,000

The `IndependentMethodWorkbench` is mounted directly on `Home.tsx`.
The desktop `MethodScorecard` is one 31-row five-column table:
**Method Name | God View | Agent View | Synthesis | Results Breakdown**.
On mobile each row becomes a compact standalone card. Buttons run exactly
the named method and reveal scoring formula/inputs, 12-house placements and
aspects; they do not launch a hidden 31-method ensemble.

### User journey

1. **Run 1 manual game:** Enter teams, sport, venue, coordinates, ISO kickoff; select a method in the table, press **Run method**, inspect its row. This is an individual event, not a historical-accuracy batch.
2. **Upload historical CSV:** On the same screen choose CSV and dataset name, press **Import and validate CSV**. Invalid rows are counted and rejected; valid rows persist. A verified favorite-only baseline requires an actual bookmaker source, not just A/B labels.
3. **Choose 1 / 200 / 10,000:** Click one test-size tile, select the dataset and method, press **Run N games**. The backend selects exactly the first N valid input rows in source order. It rejects datasets too short, instead of recycling fixtures, simulating phantom games, or automatically running all methods.
4. **Inspect every game:** Batch progress and aggregate hits/misses/coverage appear on the screen; the new `BatchGameResultsPanel` requests 20 rows at a time and displays **Game | God A/B | Agent A/B | Synthesis A/B | Outcome | View Breakdown**. Clicking a game retrieves its archived full method-only evidence; no 10,000-row payload is sent to the browser.

### Environment warning

The current backend starts an asynchronous run inside its API process using a non-awaited Promise. This has **not** been certified as a durable, restart-safe background worker, and serverless container termination may interrupt 200- or 10,000-game runs. Run these tests in staging first with an always-on worker (or migrate the job to a durable queue/Cloud Run Job) before interpreting production-scale completion as reliable. The UI and API reflect recorded progress, not a guaranteed completion.

## Operating modes

- **One-method fixture:** Select one of the 31 fields in the Independent Method Laboratory, enter a real fixture, and press **Run only this method**. The backend calculates its chart frames and invokes only the selected scorer. Original core methods 1–8 use isolated Territorial formulas. Core method 21 (KP) still requires shared upstream KP family resolution but does not add other layers' scores. The other core layers execute their individual calculation functions.
- **One-method history:** Import a dataset containing up to 10,000 events, pick one method field and a dataset, and launch a persisted run. Only the selected method is executed for each event; the run does not invoke the general 21-/31-method scorer or pattern discovery. Per-event proofs are saved, and the run summary reports per-method hits, misses, unresolved zero-net results, equal raw scores, true nontrigger results and coverage.
- **Existing combined mode:** Existing 21-method score-weighted baseline remains as-is; an experimental 31-line vote comparison is separate. The 31-line vote is **not** a validated combined forecasting formula, and no automatic promotion of its methods occurs.

## Scoring states (never mask missing data as a tie)

| State | Meaning |
|---|---|
| `A` / `B` | Method's scored advantage in God/Agent or average of *that same* method's frames |
| `EQUAL_SCORES` | Real numeric A and B scores match; preserve both exact values even if negative or zero after proven cancellation |
| `NO_QUALIFYING_CONDITION` | Independently verified absence of a scored condition in this chart; not a tied prediction |
| `ZERO_NET_UNRESOLVED` | Numeric scores net to zero but evidence does not prove whether scoring triggers were absent or canceled; requires audit |
| `MISSING_INPUT` | Required inputs unavailable, e.g. natal Moon and birth time for true natal Vimshottari |
| `EVIDENCE_ONLY` | Method is descriptive/incomplete, e.g. genuine VOC not determined; exclude from a directional score |

Never invent points, alter a source ephemeris, or force a side merely to avoid an authentic zero. The exact formula, inputs, steps, body/house inventory and both frame scores must be visible.

## Example 10,000-game dataset (CSV)

Required: `favoredTeam,underdogTeam,sport,location,startTime,actualWinner,oddsSource,roleAssignmentSource`.

Recommended: `id,latitude,longitude,homeTeam,awayTeam` and an independent point-in-time odds archive. Use `market-odds` only where actual historical bookmaker odds establish favorite/underdog at the intended snapshot. `actualWinner` must be A for favored-team winner or B for underdog winner; never use home/away as the definition of A/B. `startTime` needs an exact UTC or offset-aware timestamp. A source label is **not independent evidence**; verify original source provenance before making a historical-accuracy claim.

For a reliable 10,000-game study: preregister the method versions, preserve all misses and no-calls, deduplicate fixtures, stratify by sport/season, hold out untouched seasons, report denominator, coverage and uncertainty. Do not select methods using the same holdout used for final validation. Astronomical sports predictions have not been scientifically established; historical hit rates can be accidental.

## Database change required before deployment

The `simulation_events` table gains nullable `favoredTeam`, `underdogTeam`, `roleAssignmentSource` and `oddsSource`. **Do not deploy this branch on an existing database without a reviewed migration**. Apply schema migration with the project's configured Drizzle workflow after validating a backup. Existing rows with no stored odds provenance remain legacy/unverified and must not be silently converted into market-backed examples.

## Certification gates to complete

1. Assert all 12 competitive house assignments, supported bodies and exact frame convention.
2. Show method-specific scored inputs and exclusions (a full chart inventory alone is insufficient).
3. Validate 5° orb and approved 100/80/60/40 mapping; investigate 3° war and 1° fixed-star legacy exceptions.
4. Correct Moon VOC, applying/separating besiegement and translation of light before certification.
5. Add independently verified fixtures for Dasha and every Varga, and document method-specific assumptions.
6. Rerun typecheck, tests, production build and the one-method 10k job on verified data.
7. Approve a method based on auditable correctness and held-out comparison to the favorite-only baseline, not by a raw hit-rate ranking alone.
