# Firmament Engine Review & Analysis

## Overview

Your engine is **well-structured** and **ambitious**. The dual-frame architecture is sophisticated, and you have good test coverage starting. However, there are critical gaps that need to be filled before the engine is production-ready.

---

## ✅ What's Working Well

### 1. **Architecture**
- Clean separation: `simulationAdapter.ts` → `firmamentEngine.ts` → method layers
- Dual-frame design (God View + Agent View) is implemented
- tRPC integration is solid for API exposure
- Method registry pattern is good for extensibility

### 2. **Test Coverage Exists**
- `experimentalLayers.test.ts`
- `frameMode.test.ts`
- `chartEvidence.test.ts`
- `methodRegistry.test.ts`
- `simulationAdapter.test.ts`

This is better than most projects, but coverage is shallow.

### 3. **Report Generation**
- `simulationReport.ts` has proper aggregation logic
- CSV and JSON export are implemented
- Good hit/miss/unverified categorization
- Method ranking by hit rate is useful

### 4. **Data Pipeline**
- CSV import with validation (`simulationData.ts`)
- Batch runner (`batchRunner.ts`)
- Database persistence layer (`simulationDb.ts`, `db.ts`)

---

## ⚠️ Critical Issues

### 1. **No Backtesting Framework**
**The biggest gap.** You have fixtures in `simulate.ts`, but:
- No historical validation
- No win-loss tracking by method
- No confidence calibration
- No edge case regression tests

**Impact:** Can't prove your methods actually work.

### 2. **Method Logic Opacity**
Looking at `firmamentEngine.ts` (88KB!) and `territorialStack.ts` (27KB):
- Hard to trace why a method scored what
- No inline documentation of calculation steps
- Calculations are procedural, not declarative
- Difficult to debug a single method's logic

### 3. **No Input Validation**
- Latitude/longitude are validated in routers, but not used consistently
- No sanity checks on start times (is the game in the past or future?)
- No sport-specific logic validation
- No handling of edge cases (games at midnight, hemisphere-crossing, etc.)

### 4. **Logging is Minimal**
- Can't trace why a prediction differed between runs
- No intermediate step logging
- No observability into method calculations
- Makes debugging very hard

### 5. **Frame Parity is Untested**
- You compute `frameParity` in the output
- But no tests validate when/why frames should differ
- No regression tests for consistency

### 6. **No Performance Benchmarks**
- How long does a single event take?
- How long for 1,000 events?
- Memory usage?
- Database query performance?

---

## 🔧 What Needs to Happen

### Phase 1: Engine Instrumentation (1-2 weeks)

**Add Logging:**
```typescript
// Create server/engine/logger.ts
export interface CalculationTrace {
  methodName: string;
  input: unknown;
  steps: { stepName: string; result: unknown; timestamp: number }[];
  output: unknown;
  durationMs: number;
  error?: string;
}

export class EngineLogger {
  private traces: CalculationTrace[] = [];
  
  traceMethod(methodName: string, fn: () => T): T {
    const start = Date.now();
    try {
      const result = fn();
      this.traces.push({ methodName, durationMs: Date.now() - start, output: result });
      return result;
    } catch (error) {
      this.traces.push({ 
        methodName, 
        durationMs: Date.now() - start, 
        error: error.message 
      });
      throw error;
    }
  }
  
  export(): CalculationTrace[] {
    return this.traces;
  }
}
```

**Add Input Validation:**
```typescript
// Create server/engine/validation.ts
export function validateEventInput(input: SimulationEventInput) {
  if (!input.teamA || !input.teamB) 
    throw new Error("Both teams required");
  
  const startTime = new Date(input.startTime);
  if (isNaN(startTime.getTime())) 
    throw new Error("Invalid start time");
  
  // Check if game is in reasonable past (not 10 years old)
  const maxAge = 365 * 10;
  if (Date.now() - startTime.getTime() > maxAge * 24 * 60 * 60 * 1000)
    throw new Error("Event too far in past");
  
  // Sport-specific validation
  if (input.sport === "boxing" && input.latitude === undefined)
    throw new Error("Boxing matches need location coords");
  
  return true;
}
```

### Phase 2: Backtesting Framework (2-3 weeks)

**Create a dedicated backtest module:**
```typescript
// server/engine/backtest.ts
export interface BacktestConfig {
  events: SimulationEventInput[];  // Known outcomes
  methods?: string[];  // Test specific methods
  exportPath?: string;  // Save results
}

export interface BacktestResult {
  method: string;
  frame: "god" | "agent";
  predictions: Array<{
    eventId: string;
    predicted: "A" | "B" | "TIE";
    actual: "A" | "B" | "TIE" | "UNVERIFIED";
    correct: boolean;
    confidence: number;  // 0-1
  }>;
  accuracy: number;  // % correct
  precision: number;  // TP / (TP + FP)
  recall: number;    // TP / (TP + FN)
  f1Score: number;
}

export async function runBacktest(config: BacktestConfig): Promise<BacktestResult[]> {
  // Run all events
  // For each method, track prediction vs actual
  // Calculate metrics
  // Export to CSV for analysis
}
```

**Backtest datasets to create:**
- 10 known MLB games (last season, various teams)
- 10 known NBA games
- 5 edge cases (midnight games, cross-country, playoffs, etc.)
- Run quarterly with latest code

### Phase 3: Method-Level Testing (2-3 weeks)

**Add snapshot tests for each method:**
```typescript
// server/engine/__snapshots__/methods.test.ts
describe("Cluster Territory Method", () => {
  it("scores home team higher when stronger in 1st house", () => {
    const input = {
      teamA: "Yankees",
      teamB: "Astros",
      frame: "god",
      planets: [...], // fixed
    };
    const result = clusterTerritoryMethod(input);
    expect(result).toMatchSnapshot();
    expect(result.scoreA).toBeGreaterThan(result.scoreB);
  });

  it("handles retrograde planets correctly", () => {
    const input = { ...baseInput, planets: [...withRetro] };
    const result = clusterTerritoryMethod(input);
    // Assert specific score relationship
  });
});
```

**Do this for the top 5-10 methods first.**

### Phase 4: Integration & Frame Parity (1-2 weeks)

**Test that God View and Agent View diverge meaningfully:**
```typescript
// server/engine/frameMode.test.ts (expand existing)
describe("Frame Parity", () => {
  it("produces different scores when frame reference differs", () => {
    const godResult = simulateFrame("god", yankees_astros_fixture);
    const agentResult = simulateFrame("agent", yankees_astros_fixture);
    
    // Frames should sometimes disagree, but not randomly
    expect(godResult.synthesis.winner).toBeDefined();
    expect(agentResult.synthesis.winner).toBeDefined();
    
    // If they agree, the agreement should be meaningful
    if (godResult.synthesis.winner === agentResult.synthesis.winner) {
      // Scores should be similar confidence-wise
      expect(Math.abs(
        godResult.synthesis.scoreA - agentResult.synthesis.scoreA
      )).toBeLessThan(10);
    }
  });

  it("traces why frames diverged", () => {
    const result = runSimulationEvent(fixture);
    expect(result.frameParity.changedLayers).toBeDefined();
    expect(result.frameParity.reason).toBeTruthy();
  });
});
```

---

## 📋 Engine Readiness Checklist

### Before You Deploy

- [ ] **Logging & Tracing**
  - [ ] Every method call logs inputs/outputs
  - [ ] Calculation steps are traceable
  - [ ] Can replay a run and see exact math
  - [ ] Logs include timestamps and duration

- [ ] **Input Validation**
  - [ ] All event inputs validated before simulation
  - [ ] Clear error messages for invalid data
  - [ ] Edge cases documented (midnight games, etc.)
  - [ ] Sport-specific rules enforced

- [ ] **Core Method Tests**
  - [ ] Top 10 methods have >3 test cases each
  - [ ] Snapshot tests for known scenarios
  - [ ] Retrograde/special condition tests
  - [ ] All tests pass consistently

- [ ] **Backtesting**
  - [ ] 25+ known historical games tested
  - [ ] Accuracy >= 50% (better than coin flip)
  - [ ] No single method with 0% accuracy
  - [ ] Methods that overperform (>75%) flagged

- [ ] **Frame Consistency**
  - [ ] God View and Agent View agree on >= 60% of cases
  - [ ] When they disagree, reason is logged
  - [ ] Frame parity calculations are deterministic
  - [ ] Same input always produces same output

- [ ] **Performance**
  - [ ] Single event simulation < 100ms
  - [ ] 1000 events < 60 seconds
  - [ ] Memory usage < 500MB for batch
  - [ ] Database queries indexed properly

- [ ] **Database Integrity**
  - [ ] All simulations saved with complete trace
  - [ ] Batch runs recoverable from crashes
  - [ ] No data loss on server restart
  - [ ] Can audit any result 1 year later

- [ ] **Documentation**
  - [ ] README explaining each method
  - [ ] Why God View vs Agent View matters
  - [ ] Known limitations documented
  - [ ] How to interpret scores (0-100 scale?)

- [ ] **CI/CD**
  - [ ] Tests run on every commit
  - [ ] Backtests run weekly
  - [ ] Performance benchmarks tracked
  - [ ] Regressions detected automatically

---

## 🧪 Recommended Testing Structure

```
server/
├── engine/
│   ├── __tests__/
│   │   ├── backtest.test.ts          (historical games)
│   │   ├── methods/
│   │   │   ├── cluster-territory.test.ts
│   │   │   ├── nakshatra.test.ts
│   │   │   └── ...
│   │   ├── frame-parity.test.ts      (god vs agent)
│   │   ├── edge-cases.test.ts        (midnight, hemispheres, etc.)
│   │   └── regression.test.ts        (known bad predictions)
│   ├── __fixtures__/
│   │   ├── games/
│   │   │   ├── yankees-astros.json
│   │   │   └── ...
│   │   └── charts/
│   │       ├── retrograde.json
│   │       └── ...
│   ├── backtest.ts                    (NEW)
│   ├── logger.ts                      (NEW)
│   ├── validation.ts                  (NEW)
│   └── ...
```

---

## 🎯 Your Next Steps (Priority Order)

1. **This Week**
   - Add logging to `firmamentEngine.ts`
   - Create validation layer
   - Run one backtest on 10 known games manually
   - Document what you see

2. **Next Week**
   - Add method-level unit tests
   - Implement frame parity tests
   - Create backtest framework
   - Set up CI/CD for tests

3. **Week 3**
   - Run full backtest (25+ games)
   - Fix any methods with <40% accuracy
   - Add performance benchmarks
   - Document all methods

4. **Week 4**
   - Engine should feel bulletproof
   - Ready for product layer
   - Can trace any prediction
   - Backtest runs weekly

---

## 🚩 Red Flags to Watch

- **Method scores constantly flipping** → Input validation issue
- **God/Agent views always agree** → Frame logic might be broken
- **Accuracy < 45%** → Methods need review
- **Slow performance** → Check database queries
- **Can't explain a prediction** → Logging missing
- **Same input, different output** → Determinism issue

---

## Questions to Answer Before Production

1. **What does a "good" accuracy look like?** 52%? 60%? 70%?
2. **How confident should each prediction be?** Scale: 0-100? Probability?
3. **When should the engine refuse to predict?** (Missing data, etc.)
4. **How old can historical data be?** (1 season? 5 years? All time?)
5. **What's your SLA for a prediction?** (Must complete in 100ms? 1s?)
6. **Can you explain every prediction?** (If not, it's not ready.)

---

## Resources

- Backtesting guide: https://github.com/gbeced/backtesting
- Test patterns: https://martinfowler.com/articles/testPyramid.html
- Metrics explained: https://en.wikipedia.org/wiki/Precision_and_recall

Good luck! Your engine has potential. Now make it trustworthy. 🚀
