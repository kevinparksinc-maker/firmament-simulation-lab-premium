import { describe, expect, it } from "vitest";
import { selectIndependentGameCount, SUPPORTED_INDEPENDENT_GAME_COUNTS } from "./batchSelection";

describe("explicit 1 / 200 / 10000 historical event selection", () => {
  const source = Array.from({length: 10_000}, (_,index) => ({
    id: `historical-event-${index+1}`,
    sourceRow: index + 2,
  }));
  it("exposes three clearly defined research sizes", () => {
    expect(SUPPORTED_INDEPENDENT_GAME_COUNTS).toEqual([1,200,10000]);
  });
  for (const count of [1,200,10000] as const) {
    it(`chooses exactly ${count} distinct ordered source events`, () => {
      const result = selectIndependentGameCount(source,count);
      expect(result).toHaveLength(count);
      expect(result[0]?.id).toBe("historical-event-1");
      expect(result.at(-1)?.id).toBe(`historical-event-${count}`);
      expect(new Set(result.map(x=>x.id)).size).toBe(count);
      expect(source).toHaveLength(10_000);
    });
  }
  it("never pads a short dataset with artificial repeated games",()=>{
    expect(()=>selectIndependentGameCount(source.slice(0,150),200)).toThrow(/150 valid games; 200 are required/);
    expect(()=>selectIndependentGameCount(source.slice(0,199),200)).toThrow(/200 are required/);
    expect(()=>selectIndependentGameCount(source.slice(0,200),10000)).toThrow(/10000 are required/);
  });
  it("rejects unsupported counts rather than silently accepting a whole-dataset fallback",()=>{
    expect(()=>selectIndependentGameCount(source,30 as 1)).toThrow(/exactly 1, 200 or 10000/);
  });
});
