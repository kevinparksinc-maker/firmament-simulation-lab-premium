import { describe, expect, it } from "vitest";
import { CHINESE_28_MANSIONS, CHINESE_XIU_QUADRANTS, chineseMansionAt, resolveChineseMansionArcs } from "../../shared/chineseLunarMansions";

describe("Chinese Twenty-Eight Xiù: star-anchored, never equal-division impostors",()=>{
  it("lists 28 determinant stars in correct Four Symbols sequence",()=>{
    expect(CHINESE_28_MANSIONS).toHaveLength(28);
    expect(CHINESE_XIU_QUADRANTS).toEqual(["Azure Dragon","Black Tortoise","White Tiger","Vermilion Bird"]);
    expect(CHINESE_28_MANSIONS.map(x=>x.id)).toEqual([
      "Jiao","Kang","Di","Fang","Xin","Wei","Ji",
      "Dou","Niu","Nu","Xu","Wei2","Shi","Bi",
      "Kui","Lou","Wei3","Mao","Bi2","Zi","Shen",
      "Jing","Gui","Liu","Xing","Zhang","Yi","Zhen"
    ]);
    expect(CHINESE_28_MANSIONS.every((x,i)=>x.quadrant===CHINESE_XIU_QUADRANTS[Math.floor(i/7)])).toBe(true);
    expect(CHINESE_28_MANSIONS[0]?.starId).toBe("α Vir");
    expect(CHINESE_28_MANSIONS[19]?.starId).toBe("φ¹ Ori");
  });
  it("refuses to fabricate any mansion boundary before star catalogue is supplied",()=>{
    expect(resolveChineseMansionArcs()).toBeNull();
    expect(resolveChineseMansionArcs(null)).toBeNull();
    expect(()=>resolveChineseMansionArcs({frame:"J2000_EQJ_RA",epoch:"J2000.0",provenance:"",starts:Array(28).fill(0)})).toThrow();
    expect(()=>resolveChineseMansionArcs({frame:"J2000_EQJ_RA",epoch:"J2000.0",provenance:"test",starts:Array(28).fill(0)})).toThrow();
  });
  it("supports nonuniform star-based widths and exact placement when all coordinates are verified",()=>{
    // Pure geometry test only; these angles are SYNTHETIC, not the real star positions.
    const widths=Array.from({length:28},(_,i)=>i===0?14:i===1?11:335/26);
    const starts=widths.map((_,i)=>widths.slice(0,i).reduce((a,b)=>a+b,0));
    const arcs=resolveChineseMansionArcs({frame:"J2000_EQJ_RA",epoch:"J2000.0",provenance:"synthetic-test-only",starts});
    expect(arcs).toHaveLength(28);
    expect(arcs![0]!.angularWidth).toBeCloseTo(14,8);
    expect(arcs![1]!.angularWidth).toBeCloseTo(11,8);
    expect(arcs!.reduce((sum,a)=>sum+a.angularWidth,0)).toBeCloseTo(360,8);
    expect(chineseMansionAt(2,arcs!)?.id).toBe("Jiao");
    expect(chineseMansionAt(14,arcs!)?.id).toBe("Kang");
    expect(chineseMansionAt(25,arcs!)?.id).toBe("Di");
  });
  it("explicitly refuses an epoch with out-of-sequence determinative star RA",()=>{
    const starts=Array.from({length:28},(_,i)=>i*(360/28));
    starts[20]=starts[19]!-1; // known possible Zi/Shen order inversion at some epochs
    expect(()=>resolveChineseMansionArcs({frame:"J2000_EQJ_RA",epoch:"J2000.0",provenance:"synthetic-order-test",starts})).toThrow(/order disagrees/);
  });
});
