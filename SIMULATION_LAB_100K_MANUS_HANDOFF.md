# SIMULATION LAB PREMIUM — 100,000 EVENT COMPLETION CONTRACT
Status: Implementation-ready handoff; **not** a claim of a completed 100,000-event validation run.
Target repo: kevinparksinc-maker/firmament-simulation-lab-premium
Companion canonical chart repo: kevinparksinc-maker/firmament-guardian (The Absolute).
Do not merge this branch until acceptance gates pass.

## 0. Findings verified in main before branch
- `server/engine/firmamentEngine.ts` calculates with `astronomy-engine`; `package.json` depends on `astronomy-engine`, not `sweph`.
- `server/engine/guardianEphemerisAdapter.ts` currently accepts an injected provider and rejects non-Guardian positions. **It is not a real Swiss Ephemeris provider.**
- `server/engine/frameworkContract.ts` declares 21 exact methods, including **Chaldean Decans**, and uses `ASC_DSC_ALL_HOUSES_V1`. User's target is 31, with **Elemental Family Decans**. Preserve historical roster/version for reproducibility, introduce a new versioned target roster after auditing.
- `server/engine/houseFrameFoundation.ts` computes house labels with a **reverse** sequence; The Absolute's `server/astrologyCore.ts` uses **forward** Equal House indexing. This is a real parity conflict. **No silent reversal**.
- `server/batchRunner.ts` loads the whole dataset and stores all results in memory, updates DB progress after each event, and runs pattern discovery on that in-memory list. This must be redesigned for 100k.
- `docs/BABYLONIAN-EPHEMERIS-INTEGRATION-CONTRACT.md` and `docs/SHARED_CELESTIAL_SNAPSHOT_CONTRACT.md` already exist; reconcile them with this handoff rather than duplicating competing engines.

## 1. Nonnegotiable canonical calculation source
- Use the exact source calculation pipeline from The Absolute's `server/astronomy.ts`, `server/firmament-geometry.ts`, `server/astrologyCore.ts`, `shared/hybrid.ts` and applicable tests, preferably a versioned shared package imported by both apps. A network service with a versioned response and pinned build is acceptable only if equivalence, reproducibility and outages are handled. No independently improvised coordinate transform.
- Canonical reference frame string: `firmament-aldebaran-15-taurus`. `sweph` mode 14 (`SE_SIDM_ALDEBARAN_15TAU`), `SEFLG_SIDEREAL`; The Absolute currently uses Moshier calculation flags `4|256`. Match the actual source **exactly** and record source flags, library version, ephemeris dataset, timezone, location, input precision, calculation version and frame on each snapshot.
- Do not use J2000 as zodiac anchor, no additional precession drift or tilt/obliquity in the **user-defined custom chart convention**, and no double application of the ayanamsha. Astronomical raw source calculations still retain their scientifically defined reference system; document transformations rather than claiming physical zero obliquity.
- Canonical local sidereal angle = normalize(sweph.sidtime(jd)*15 + observerEastLongitude - mode14Ayanamsha(jd)); Ascendant = normalize(theta+90); MC = theta; Descendant = normalize(Asc+180). Keep same as actual Guardian source, not a substitute.
- Agent Equal House H1 starts at exact Ascendant degree; cusp(Hn)=normalize(Asc+30*(n-1)); planetHouse=1+floor(normalize(planetLongitude-Asc)/30). God house=1+floor(normalize(longitude)/30). The reverse house labels in Premium are legacy: explicitly version/migrate them. Keep 1,2,3,6,10,11 Asc-side vs 4,5,7,8,9,12 Desc-side for **team assignment**, independently of visual orientation.
- Longitude, signs, angles, fixed stars, aspects, mansions and decans must derive from same snapshot; never mix tropical-of-date, J2000, sidereal, local horizon values as if interchangeable. Maintain God and Agent views side by side; God/Agent are not two independent ephemerides.
- Fixed stars available independent of aspect hits. Missing historical catalog data must be marked unavailable, not guessed.

## 2. Canonical event snapshot API and provider
Implement `server/engine/absoluteSnapshotProvider.ts` backed by actual Swiss Ephemeris/Guardian shared code (not just type declarations). Suggested input: eventId, UTC event start timestamp, IANA timezone, event location latitude/longitude, optional elevation, team roles, version. Suggested output: `referenceFrame`, `ephemerisEngine`, `mode`, `flags`, `sourceVersion`, `julianDay`, `timestampUtc`, `observer`, `godView`, `agentView`, `ascendant`, `midheaven`, `descendant`, `houseCusps`, `planetPositions`, `retrograde`, `aspects`, `fixedStars`, `nakshatras`, `manzils`, `chineseMansions`, `decans`, `lots`, `calculationWarnings`, `hash`.
Make snapshot immutable after prediction; hash normalized inputs + calculation version + ephemeris configuration + output. Cache by hash for repeat events. Reject unknown frame and missing critical inputs rather than silently switching to `astronomy-engine`. When `sweph` or required data unavailable, fail explicitly. Source `guardianEphemerisAdapter.ts` must call the provider and verify each planet; remove placeholder injection from production route.
Cross-repo fixture tests for at least Dallas 1986-11-20 10:06 CST and historic game timestamps: compare all ten planets, angles, houses, nodes, star overlays and aspects to Guardian within explicit numeric tolerance (e.g. <=0.0001 degree where algorithms truly identical). Golden files must record versions and inputs. Date/time and daylight-saving transitions must be tested.

## 3. Full method ledger: retain 21; target 31 without fabricated methods
Read `server/engine/methodRegistry.ts`, `server/engine/frameworkContract.ts`, `server/engine/simulationAdapter.ts`, `server/engine/fullPackageDualFrameChallenger.ts` and method tests. Export machine-readable manifest for **each** current method: id, label, version, mathematical inputs, required bodies, sign/house frame, rules, God score, Agent score, synthesis score, predicted side, confidence or margin (not fake probability), missing-data reason, and score contribution.
- Preserve the 21-method legacy version for historical comparison; **do not silently change it**.
- Build new versioned target roster of 31 **only after** matching the user's previously approved 31-method list or obtaining approval for the exact remaining definitions. Never pad with duplicate/neutral methods to reach 31.
- Elemental Family Decans must replace Chaldean Decans in the **new** framework: first decan sign's ruler, second and third same-element sign rulers in zodiac order; map exact 0–10, 10–20, 20–30 sign degrees, boundary-tested. Preserve old Chaldean label only for old-version historical replay.
- Include 27 Nakshatras, 28 Arabic Manzils, 28 Chinese mansions (catalog-grounded), fixed stars, Lots, Vedic timing/Ashtakavarga, planetary war, dignity, receptions, Moon VOC, harmonic aspects, God/Agent synthesis as **evidence/method inputs** when implemented and actually computable; no false 'computed' labels. For Chinese mansions, do not use invented equal 360/28 widths where source catalog is missing.
- No 'neutral' prediction masquerading as a valid winner. Explicit score ties show exact numeric values and deterministic tie status. Truly missing method inputs => `unavailable` with reason and excluded from scored denominators. No hidden score cancellation or unreported weight changes.
- Every method row must show both team sides and God/Agent/synthesis, evidence and source snapshot; preserve contradictory methods in visible output.

## 4. Event truth and market baseline
Use immutable event manifest: eventId, league, season, UTC start, venue/location, home/away, favorite/underdog, sportsbook source, market timestamp, odds format, closing/opening choice, actual winner, result source, game status, and quality flags. Distinguish missing market data from guessed favorite. Role assignment follows user's approved sportsbook favorite mapping; record how Asc/Desc side chosen and never retroactively swap based on winner.
Prediction timestamp and locked pick MUST precede actual result disclosure in the blind evaluation pipeline. Implement outcome-blind read path; store truth in a separate results table and join only after prediction lock. Quarantine missing/cancelled/postponed/duplicate/incorrect-time events. Fix known bad Yankees–Astros 2024-04-01 fixture by source verification before inclusion; don't silently substitute.
Market baseline = observed sportsbook favorite hit rate on the **same evaluated events**, with missing market games excluded from comparative denominators. Show lift against market and uncertainty; do not claim edge based on raw hit rate alone.

## 5. 100,000 event batch execution
Refactor `server/batchRunner.ts` into durable job processing. Never load all 100k event payloads or complete result objects in memory.
- Dataset pagination/keyset by stable event id; bounded chunks (e.g. 100–500), concurrency configurable with worker count and CPU budget; preserve deterministic event order for stored results.
- Run states: queued, running, pausing, paused, completed, partial, failed, cancelled. Store runId, datasetId, config hash, framework version, method roster hash, source version, createdAt, lastHeartbeat, cursor/checkpoint, processed, verified, failed, unavailable, skipped, retryCount.
- Exactly-once **logical** persistence via unique(runId,eventId,methodId,frameworkVersion) for method rows and unique(runId,eventId) for event outcomes; retries idempotent. Transactionally store per-event results and advance cursor. Recovery resumes from durable checkpoint after crash.
- Per-event errors captured without killing whole run; retry only transient failures with capped exponential backoff, permanent validation failures quarantined. Rate-limit progress DB writes (per chunk or elapsed interval), not once per game.
- Precompute/cache canonical chart snapshots by event/location/version; no per-method redundant ephemeris computation. Avoid shared mutable sweph global sidereal/topocentric state across uncontrolled workers; use process isolation or serialized provider calls.
- Stream aggregated counters and method metrics to DB; run pattern discovery in a second streaming or database-driven pass, not `results.map(...)` on all 100k. Persist aggregate stats, and store rule support/validation separately.
- UI presets 1, 200, 1,000, 10,000, **100,000**; progress bar, elapsed time, ETA (measured), pause/resume/cancel, throughput, verified/failed/unavailable, version labels, export CSV/JSON and complete audit trail.
- Do not start a real 100k run automatically. Dry-run 1 -> 20 -> 200 -> 1k -> 10k -> 100k only after resource checks and validation.

## 6. Blind test, patterns, validation, statistics
- Freeze source data, event selection, method weights, hypotheses, favorite mapping and decision thresholds before viewing outcomes.
- Split by chronological time and/or blocked calendar days, preventing same-day correlated events across training/holdout. Use train, validation, final untouched holdout; no retrospective rule selection on final holdout.
- Per method and combined: eligible N, unavailable N, predicted side, hit/miss, tie count, win rate with uncertainty interval, market favorite rate on same sample, lift, calibration where numeric probabilities exist, league/season breakdown, missing-data sensitivity.
- Cluster uncertainty by calendar day (and consider league/season) to avoid treating all games as independent. Pattern discovery/replication must be out-of-sample and report sample support, discovery lift, holdout lift, and confidence intervals.
- Do not label 80% accuracy or 100k success as achieved before actual locked holdout results. Explicitly separate software test success from predictive validity.

## 7. UI and traceability
On each event show event/time/venue, odds favorite, assigned Asc/Desc side, canonical chart source/version, God and Agent charts, North Indian diamond chart (correct sign/house/planet orientation), all method rows with evidence and numeric team-side scores, conflicting votes, total and margin, selected winner, lock timestamp, actual outcome only after lock, and verified hit/miss.
Expose raw planet degrees, Asc, house cusps, Nakshatras/Manzils/Chinese mansion provenance, Elemental Family Decans, fixed-star data, aspects, Lots, and unscored reasons. No decorative fake placements.
Support responsive mobile and large batch dashboard. Export versioned per-event trace and aggregate result.

## 8. Ordered Manus implementation sequence
1. Establish build baseline: `pnpm install --frozen-lockfile`, `pnpm check`, `pnpm test`, `pnpm build`. Capture failures before changes.
2. Implement and test shared canonical Swiss mode-14 snapshot provider; pin dependency and version; prove parity against The Absolute; no J2000 chart substitution.
3. Resolve reverse/forward house conflict with versioned migration and exact house parity. Preserve role-side map.
4. Wire all simulation paths and registered methods to canonical snapshots; remove production fallback. Preserve method roster until audit.
5. Produce 21-method machine-readable coverage matrix; define missing ten for 31-method target only from approved source definitions.
6. Build durable paginated 100k runner, schema/migrations, checkpoints, retries, idempotency, progress API, pause/resume/cancel.
7. Build outcome-blind dataset lock, per-method evidence ledger, sportsbook favorite baseline, pattern holdout and statistical reports.
8. Wire UI to real server outputs; implement presets and exports.
9. Test end-to-end: 1, 20, 200, 1k, 10k; then resource-estimate and authorize 100k.
10. Open PR, report exact files changed, tests passed, method availability, observed performance and remaining blockers. Merge only after review.

## 9. Required automated acceptance gates
- Golden parity of Guardian vs Premium on same UTC+location: planets, Asc/Desc/MC, Equal House cusps/assignments, God/Agent, decans, aspects; explicit versioned tolerance.
- Reject mixed coordinate frames, missing event time/location, wrong timezone, double-shift, nonfinite longitude, missing ephemeris provider.
- Correct side mapping for all 12 houses; opposite side consistency; correct team assignment with odds and no leakage.
- All registered methods have stable ids, traceable source and score, both frames and synthesis or explicit unavailable; roster manifest counts truthful.
- Simulated runner crash at 10%, resume with zero duplicates and matching deterministic results; transient retries; permanent failures; pause/resume/cancel.
- 100k synthetic **load** test checks bounded memory, no quadratic scans, throughput, checkpoint and exact event count; distinguish synthetic load from 100k historical blind validation.
- No outcomes visible before pick lock; same sample for favorite baseline; no training/holdout leakage.
- Dashboard metrics reconcile exactly with persisted event/method rows; exports round-trip.
- CI `pnpm check`, `pnpm test`, `pnpm build` green; only then candidate for main.

## 10. Scope and truthfulness
This handoff commits specifications and optional helper code to a feature branch. It does NOT claim the shared Swiss engine, 31 approved methods, 100k runner, data corpus, CI, or predictive validation are already finished. Manus must implement and prove each gate. No release or production merge by implication.
