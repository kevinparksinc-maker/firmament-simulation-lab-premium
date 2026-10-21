import { describe, expect, it } from "vitest";
import { selectIndependentGameCount, historicalFixtureIdentity, SUPPORTED_INDEPENDENT_GAME_COUNTS } from "./batchSelection";

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
  it("refuses duplicate historical fixtures even if their CSV row IDs differ", () => {
    const sameFixture = {
      sport:"MLB",startTime:"2024-06-15T19:10:00Z",
      location:"Los Angeles, CA",teamA:"Dodgers",teamB:"Giants",
    };
    const rows = Array.from({length:200}, (_,idx) => ({
      ...sameFixture,
      id:`different-id-${idx}`,
      startTime:idx < 2 ? sameFixture.startTime : new Date(Date.parse(sameFixture.startTime)+idx*86_400_000).toISOString(),
    }));
    expect(() => selectIndependentGameCount(rows,200,historicalFixtureIdentity)).toThrow(/Repeated historical fixture/);
    // A reversed home/away listing cannot conceal an identical fixture.
    const reversed = [{...sameFixture},{...sameFixture,teamA:"Giants",teamB:"Dodgers"}];
    expect(historicalFixtureIdentity(reversed[0])).toBe(historicalFixtureIdentity(reversed[1]));
  });
  it("rejects unsupported counts rather than silently accepting a whole-dataset fallback",()=>{
    expect(()=>selectIndependentGameCount(source,30 as 1)).toThrow(/exactly 1, 200 or 10000/);
  });
});
