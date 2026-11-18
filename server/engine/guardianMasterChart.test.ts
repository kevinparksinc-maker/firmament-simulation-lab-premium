import { describe, expect, it } from "vitest";
import { calculateGuardianMasterChart, summarizeGuardianMasterChart } from "./guardianMasterChart";

describe("Guardian master chart integration", () => {
  it("calculates both frames and publishes the method ledger", async () => {
    const snapshot = await calculateGuardianMasterChart({
      birthDateTime: "1990-02-11T14:00:00.000Z",
      birthLocation: "Tokyo, Japan",
      birthLatitude: 35.6762,
      birthLongitude: 139.6503,
      transitDateTime: "2026-11-18T23:00:00.000Z",
      transitLocation: "New York, NY",
      transitLatitude: 40.7128,
      transitLongitude: -74.006,
    });
    const summary = summarizeGuardianMasterChart(snapshot);

    expect(summary.engineVersion).toBe("firmament-master-2026.3");
    expect(summary.mode).toBe("combined");
    expect(summary.planets).toHaveLength(10);
    expect(summary.houses).toHaveLength(12);
    expect(summary.totalMethods).toBeGreaterThan(0);
    expect(summary.computedWithResultCount).toBeGreaterThan(0);
    expect(summary.transit?.planetCount).toBeGreaterThan(0);
    expect(summary.snapshotId).toMatch(/^umc-[a-f0-9]{16}$/);
  });
});
