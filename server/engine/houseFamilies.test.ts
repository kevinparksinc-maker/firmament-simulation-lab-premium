import { describe, expect, it } from "vitest";
import { ASCENDANT_CLUSTER, DESCENDANT_CLUSTER, NEUTRAL_HOUSES, clusterForHouse } from "./firmamentEngine";

describe("Firmament competitive house families", () => {
  it("assigns each of twelve equal houses to exactly one side", () => {
    expect([...ASCENDANT_CLUSTER].sort((a, b) => a - b)).toEqual([1, 2, 3, 6, 10, 11]);
    expect([...DESCENDANT_CLUSTER].sort((a, b) => a - b)).toEqual([4, 5, 7, 8, 9, 12]);
    expect(NEUTRAL_HOUSES).toHaveLength(0);
    const all = [...ASCENDANT_CLUSTER, ...DESCENDANT_CLUSTER];
    expect(new Set(all).size).toBe(12);
    expect([...all].sort((a, b) => a - b)).toEqual(Array.from({ length: 12 }, (_, i) => i + 1));
    for (const house of ASCENDANT_CLUSTER) expect(clusterForHouse(house)).toBe("ascendant");
    for (const house of DESCENDANT_CLUSTER) expect(clusterForHouse(house)).toBe("descendant");
  });
});
