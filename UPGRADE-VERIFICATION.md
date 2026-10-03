# Dasha / Ashtakavarga / Harmonics Upgrade Verification

## Verification date

2026-09-25

## Commands

```bash
pnpm check
pnpm test
```

## Results

- TypeScript check: **passed**
- Test files: **5 passed, 1 failed**
- Tests: **30 passed, 1 failed**
- Total tests: **31**

The failing test is:

```text
server/engine/experimentalLayers.test.ts
  classical ashtakavarga and vimshottari
  computes a natal Vimshottari chain from Moon longitude and birth epoch
```

Failure:

```text
expected mahadasha.start to equal birth time
expected: 1990-02-11T09:00:00.000Z
received: 2019-02-11T15:00:00.000Z
```

This is a **test expectation defect**, not an implementation crash. The test requests the active Dasha at 2026-09-25. Given a 4-year starting balance from birth, the first Mahadasha ends in 1994 and the active Mahadasha at the requested date correctly begins in 2019. The assertion should check that the first generated Mahadasha timeline period starts at birth, or should assert the active period's expected 2019 start instead.

## Upgrade claims verified

### Ashtakavarga

- Replaced the old house-distance approximation with sign-based BAV.
- Includes the seven classical grahas plus Lagna as eight references.
- Excludes Rahu/Ketu.
- Row checksums pass:

| Planet | Actual | Expected |
|---|---:|---:|
| Sun | 48 | 48 |
| Moon | 49 | 49 |
| Mars | 39 | 39 |
| Mercury | 54 | 54 |
| Jupiter | 56 | 56 |
| Venus | 52 | 52 |
| Saturn | 39 | 39 |

- SAV checksum: **337**
- SAV average: **28.083**
- A/B scoring remains explicitly labeled as an application-specific projection rather than classical Ashtakavarga itself.

### Vimshottari Dasha

- Adds `calculateVimshottariDasha()`.
- Test input Moon longitude `48°` resolves to:
  - Nakshatra: **Rohini**
  - Star Lord: **Moon**
  - Starting balance: **4 years**
  - Active Mahadasha at 2026-09-25: **Jupiter**
  - Active Antardasha: **Ketu**
  - Active Pratyantardasha: **Saturn**
- Event-only callers retain an explicitly labeled fallback:

```text
Event-time Nakshatra/Sub/Sub-Sub chain
```

### Harmonics

The default orb policy is now harmonic-specific:

| Harmonic | Orb |
|---|---:|
| H2 | 6° |
| H3 | 5° |
| H4 | 4° |
| H5 | 3.5° |
| H6 | 3° |
| H7 | 2.75° |
| H8 | 2.5° |
| H9 | 2.25° |
| H10 | 2° |
| H11 | 1.75° |
| H12 | 1.5° |

## Files changed in the upgrade

- `server/engine/experimentalLayers.ts`
- `server/engine/experimentalLayers.test.ts`
- `server/engine/firmamentEngine.ts`
- `server/engine/simulationAdapter.ts`
- `server/engine/index.ts`
- `ASHTAKAVARGA-VARGA-ARCHITECTURE.md`
- `CHANGES-DASHA-ASHTAKAVARGA-HARMONICS.md`

## Recommendation

The upgrade is substantively stronger than the current app, especially for Ashtakavarga and harmonic normalization. Before merging it into the current app:

1. Fix the single Dasha test assertion described above.
2. Re-run the full suite.
3. Re-run the 12-game MLB backtest to measure whether classical BAV/SAV now discriminates instead of producing 12 ties.
4. Keep the upgrade separate from production until the revised backtest is reviewed.
