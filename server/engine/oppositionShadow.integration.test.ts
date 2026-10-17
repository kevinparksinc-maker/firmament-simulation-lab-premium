import { describe, expect, it } from "vitest";
import { runFullPackageDualFrameChallenger } from "./fullPackageDualFrameChallenger";
describe("opposition shadow full package isolation", () => {
  it("runs the shadow as a separate frame without changing the original output", () => {
    const input = { teamA: "Favorite", teamB: "Underdog", location: "New York, NY", gameType: "MLB" as const, startTime: new Date("2024-06-15T19:10:00Z") };
    const before = runFullPackageDualFrameChallenger(input);
    const shadow = runFullPackageDualFrameChallenger(input, { oppositionShadow: true });
    const after = runFullPackageDualFrameChallenger(input);
    expect(after.god.synthesis).toEqual(before.god.synthesis);
    expect(after.agent.synthesis).toEqual(before.agent.synthesis);
    expect(shadow.god.ascendantLongitude).toBe(180);
    expect(shadow.agent.ascendantLongitude).toBeCloseTo((before.agent.ascendantLongitude + 180) % 360, 1);
    expect(shadow.god.foundation.layers.map(l => l.name)).toEqual(before.god.foundation.layers.map(l => l.name));
    expect(shadow.god.addedLayers.map(l => l.name)).toEqual(before.god.addedLayers.map(l => l.name));
    expect(shadow.parity.methodParity).toBe(true);
  });
});
