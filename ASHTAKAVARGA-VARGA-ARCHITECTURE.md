# Ashtakavarga and Varga Architecture Summary

## 1. Purpose and boundary

The Ashtakavarga and Varga layers are implemented as **experimental, read-only evidence generators**. They calculate structured testimony and expose it beside the existing Firmament baseline without changing the live Territorial/KP winner.

```text
Existing Prediction
        |
        +--> Varga layer -------------> structural evidence
        |
        +--> Ashtakavarga layer ------> quantified positional support
        |
        +--> Harmonics / Dasha -------> other experimental testimony
        |
        +--> verdicts[] + crossLayer
```

Every experimental verdict carries:

```ts
{
  layer: "varga" | "ashtakavarga",
  method: string,
  scoreA: number,
  scoreB: number,
  winner: "A" | "B" | "TIE" | "NOT_EVALUABLE",
  confidence: number,
  rationale: string[],
  evidence: EvidenceItem[],
  status: "experimental-read-only"
}
```

The experimental house families intentionally follow the specification and remain separate from the production engine's current neutral-house treatment:

```ts
sideA: [1, 2, 3, 6, 10, 11]
sideB: [4, 5, 7, 8, 9, 12]
```

## 2. Varga engine

### Source and output

Implementation location:

```text
server/engine/experimentalLayers.ts
```

The public entry point is:

```ts
calculateVargaLayer(prediction, divisions, houseFamilies)
```

The default divisions are:

```text
D3, D9, D10, D27, D30
```

Each planetary placement is returned as a `VargaPlacement`:

```ts
{
  planet: string,
  division: number,
  method: string,
  sourceLongitude: number,
  vargaSignIndex: number,
  vargaSign: string,
  degreeWithinVarga: number,
  house: number,
  lord: string,
  side: "A" | "B" | "NEUTRAL"
}
```

### Explicit conventions

| Division | Recorded method | Functional role |
|---|---|---|
| D3 | `PARASHARI` | Competitive effort and execution |
| D9 | `PARASHARI_NAVAMSA` | Planetary refinement / structural support |
| D10 | `PARASHARI_DASAMSA` | Performance and professional expression |
| D27 | `TRADITIONAL_ELEMENTAL_BASELINE` | Strength and weakness diagnostic |
| D30 | `PARASHARI_TRIMSAMSA` | Adversity, breakdown, and vulnerability |

### Calculation flow

1. Normalize the planet's fixed-background longitude.
2. Identify the source sign and degree within that sign.
3. Determine the divisional part.
4. Apply the explicit division convention to obtain a Varga sign.
5. Derive the Varga house relative to the divisional Ascendant sign.
6. Resolve the Varga sign lord.
7. Map the resulting house through the experimental A/B family configuration.
8. Preserve the full placement as evidence.
9. Apply role weights only to the read-only layer verdict:
   - D3: `1.2`
   - D9: `0.8`
   - D10: `1.1`
   - D27: `1.0`
   - D30: `0.8`

The Varga layer does **not** assign a winner merely because one planet lands in an A or B house. It records the placement, convention, house, lord, and side mapping so the result can be audited and backtested.

## 3. Ashtakavarga engine

### Public entry point

```ts
calculateAshtakavargaLayer(prediction, houseFamilies)
```

The implementation produces seven Bhinnashtakavarga rows for:

```text
Sun, Moon, Mars, Mercury, Jupiter, Venus, Saturn
```

Rahu and Ketu are excluded. Lagna is included as the eighth **reference point**.

### Classical calculation flow

For each target planet:

1. Convert the target and all reference positions to zodiac-sign indices from the canonical longitude.
2. Use the eight reference points: seven classical grahas plus Lagna.
3. Calculate the relative sign distance from each reference to each of the twelve target signs.
4. Apply the target-specific Parashari bindu table.
5. Sum the eight contributions into a 12-sign BAV row.
6. Sum all seven BAV rows by sign to produce Sarvashtakavarga (SAV).
7. Project the SAV signs into chart houses using the Ascendant sign.
8. Only after that projection, calculate the application's A/B house-family averages.

The implementation exposes both the raw sign-based BAV/SAV map and the experimental A/B projection. This prevents the local house system from contaminating the classical BAV calculation itself.

### Regression checks

The fixed classical row totals are: 

```text
Sun 48
Moon 49
Mars 39
Mercury 54
Jupiter 56
Venus 52
Saturn 39
----------------
SAV checksum 337
```

These totals are chart-independent and are therefore used as automated regression checks. If a row fails its checksum, the calculation should be treated as invalid before interpreting its distribution.

### Output

```ts
{
  planet: string,
  bindus: number[],
  total: number,
  expectedTotal: number,
  sideA: number,
  sideB: number
}
```

The SAV surface additionally exposes twelve house records containing house number, sign, bindus, and A/B/neutral family membership.

Ashtakavarga remains quantified positional support. Its A/B projection is an experimental application layer, not a classical astrological verdict.

## 4. Cross-layer integration

`calculateExperimentalLayers()` returns both layer-specific details and a common evidence surface:

```ts
{
  status: "experimental-read-only",
  houseFamilies,
  verdicts: [harmonics, varga, ashtakavarga, dasha],
  crossLayer,
  harmonics,
  varga,
  ashtakavarga,
  dasha
}
```

The cross-layer analyzer maps:

- **Structural testimony** → Varga winner.
- **Relational testimony** → Harmonic winner.
- **Temporal testimony** → Dasha winner.
- **Quantified positional support** → Ashtakavarga evidence, retained independently.

If the active testimony layers disagree, `crossLayer.disagreement` is set to `true` and the rationale explicitly preserves that disagreement. No experimental result overwrites the production baseline.

## 5. API exposure

For each simulation event, the adapter returns both chart frames:

```ts
result.experimentalLayers.godView
result.experimentalLayers.agentView
```

Each frame carries the same four-layer contract, calculated from that frame's prediction. The existing `godView.allLayers`, `agentView.allLayers`, production baseline scores, and frame parity outputs remain unchanged.

## 6. Validation and coverage

Focused evidence-layer coverage was generated with:

```bash
pnpm exec vitest run \
  server/engine/experimentalLayers.test.ts \
  server/engine/simulationAdapter.test.ts \
  --coverage \
  --coverage.include=server/engine/experimentalLayers.ts \
  --coverage.reportsDirectory=coverage/evidence-layers
```

Results:

| Metric | Coverage |
|---|---:|
| Statements | 97.77% |
| Branches | 85.96% |
| Functions | 100% |
| Lines | 97.77% |

The focused suite passed **9 tests**. The full integration suite passed **29 tests** across **6 test files**. The full-project coverage output is available under `coverage/`, and the focused HTML report is under `coverage/evidence-layers/`.

## 7. Classical Ashtakavarga and Vimshottari upgrade

The experimental implementation now separates classical calculations from the A/B research overlay.

### Ashtakavarga

`calculateAshtakavargaLayer()` now uses the eight classical reference points: Sun, Moon, Mars, Mercury, Jupiter, Venus, Saturn, and Lagna. BAV is calculated by **zodiac-sign distance**, not by the local chart house number. The seven target rows use the classical contribution tables and expose the fixed checksum totals:

```text
Sun 48 · Moon 49 · Mars 39 · Mercury 54 · Jupiter 56 · Venus 52 · Saturn 39
Total SAV checksum: 337
```

The resulting Sarvashtakavarga map is then projected into the application's house families using the Ascendant sign. That projection remains an experimental A/B layer and is explicitly not presented as a classical Ashtakavarga winner.

### Vimshottari

`calculateVimshottariDasha(moonLongitude, birthTime, atTime)` now computes:

1. Birth Moon Nakshatra.
2. Nakshatra lord.
3. Remaining balance of the first Mahadasha from the untraversed Nakshatra arc.
4. Subsequent Mahadashas in the fixed 120-year sequence.
5. Active Antardasha.
6. Active Pratyantardasha.

`calculateDashaLayer()` accepts an optional `DashaNatalContext`. When supplied, the temporal layer uses the natal Vimshottari timeline. Existing event-only simulations retain the old event-time Nakshatra/Sub/Sub-Sub chain, but it is now explicitly labeled as a fallback rather than a natal-age Dasha claim.

### Harmonics

Default harmonic orbs are now harmonic-specific rather than a universal 6° orb. The default H2-H12 schedule narrows progressively from 6° at H2 to 1.5° at H12. This is a modeling control intended to reduce the opportunity-density bias created by having more target angles at higher harmonics. It is not an empirically validated optimum; the values should be frozen and tested before being treated as a predictive improvement.

## 8. Research next steps

1. Freeze a historical event corpus and outcome labels.
2. Compare each layer against the unchanged baseline.
3. Test alternative D3/D27/D30 conventions as separate method versions.
4. Validate the Ashtakavarga support tables against the intended classical source.
5. Add time-series harmonic snapshots without changing the static event chart.
6. Only consider production weighting after incremental-information backtests show durable value.
