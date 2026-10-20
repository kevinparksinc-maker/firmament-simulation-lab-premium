import { describe, expect, it } from "vitest";
import { compareFrameMethods, summarizeMethodComparison } from "./crossFrameMethods";

const layer = (name: string, winner: "A"|"B"|"TIE", scoreA: number, scoreB: number) => ({name,winner,scoreA,scoreB});

describe("cross-frame method comparison", () => {
  it("classifies same-side picks, reversals and neutral cases without changing scores", () => {
    const god = [layer("Mansions","A",5,2),layer("Territory","B",1,4),layer("Aspects","TIE",0,0),layer("Moon","A",2,1)];
    const agent = [layer("Mansions","A",4,2),layer("Territory","A",3,1),layer("Aspects","TIE",0,0),layer("Moon","TIE",0,0)];
    const values = compareFrameMethods(god, agent);
    expect(values.map(v=>v.relationship)).toEqual(["agreement","reversal","both-neutral","one-neutral"]);
    expect(values[0]?.godMargin).toBe(3);
    expect(values[1]?.agentMargin).toBe(2);
    expect(summarizeMethodComparison(values)).toEqual({compared:4,agreements:1,reversals:1,neutral:2,missing:0});
    expect(god[0]?.scoreA).toBe(5);
  });

  it("keeps unmatched methods visible as missing rather than falsely paired", () => {
    const values = compareFrameMethods([layer("A","A",2,0)],[layer("B","B",0,2)]);
    expect(values).toHaveLength(2);
    expect(values.every(v=>v.relationship==="missing")).toBe(true);
  });
});
