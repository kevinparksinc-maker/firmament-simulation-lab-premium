import {describe,it,expect} from "vitest";
import {
 CHINESE_MANSION_CATALOG,CHINESE_MANSION_QUADRANTS,CHINESE_MANSION_VERSION,
 buildChineseMansionSectors,chineseMansionForRA,chineseMansionHouseIntersections,
 type ChineseMansionAnchor,
} from "../../shared/chineseMansions";
describe("28 Chinese Xiu: verified determinative-star geometry, not equal sectors",()=>{
 const fixture=CHINESE_MANSION_CATALOG.map((c,i)=>({
  hip:c[3],raDegrees:(100+i*12+(i%3)*0.4)%360,
  frame:"equatorial" as const,epoch:"SYNTHETIC-TEST-EPOCH",catalogSource:"Synthetic geometry fixture: NOT astronomy"
 }));
 it("carries 28 distinct Stellarium HIP determinative stars and four regions of seven",()=>{
  expect(CHINESE_MANSION_VERSION).toMatch(/EQUATORIAL/);
  expect(CHINESE_MANSION_CATALOG).toHaveLength(28);
  expect(new Set(CHINESE_MANSION_CATALOG.map(x=>x[3])).size).toBe(28);
  expect(CHINESE_MANSION_QUADRANTS.map(x=>x.name)).toEqual([
   "Azure Dragon","Black Tortoise","White Tiger","Vermilion Bird"
  ]);
 });
 it("never invents boundaries if any HIP RA is missing, duplicate or epoch inconsistent",()=>{
  expect(buildChineseMansionSectors([]).status).toBe("NOT_EVALUABLE");
  expect(buildChineseMansionSectors(fixture.slice(1)).status).toBe("NOT_EVALUABLE");
  expect(buildChineseMansionSectors([...fixture.slice(0,27),{...fixture[27]!,epoch:"OTHER"}]).status).toBe("NOT_EVALUABLE");
  expect(buildChineseMansionSectors([...fixture.slice(0,27),{...fixture[27]!,raDegrees:Infinity}]).status).toBe("NOT_EVALUABLE");
  expect(buildChineseMansionSectors([...fixture.slice(0,27),{...fixture[27]!,hip:fixture[0]!.hip}]).status).toBe("NOT_EVALUABLE");
 });
 it("only derives actual boundary spans from supplied RA, with all 360° accounted for",()=>{
  const built=buildChineseMansionSectors(fixture);
  expect(built.status).toBe("READY");
  if(built.status!=="READY")return;
  expect(built.sectors).toHaveLength(28);
  expect(built.sectors.reduce((n,s)=>n+s.widthDegrees,0)).toBeCloseTo(360,8);
  expect(new Set(built.sectors.map(x=>x.widthDegrees.toFixed(6))).size).toBeGreaterThan(2);
  for(const s of built.sectors){
   expect(s.widthDegrees).toBeGreaterThan(0);
   const picked=chineseMansionForRA(s.startRa+Math.min(0.01,s.widthDegrees/2),built.sectors,s.epoch);
   expect(picked?.hip).toBe(s.hip);
   const overlap=chineseMansionHouseIntersections(s,"agent",55.67);
   expect(overlap.reduce((n,x)=>n+x.degrees,0)).toBeCloseTo(s.widthDegrees,8);
  }
  expect(chineseMansionForRA(30,built.sectors,"OTHER-EPOCH")).toBeNull();
 });
 it("preserves physical RA ordering and warns if Zi/Shen boundaries swap",()=>{
  const changed=fixture.map(a=>({...a}));
  const zi=changed.find(x=>x.hip===26207)!;
  const shen=changed.find(x=>x.hip===26727)!;
  const temp=zi.raDegrees;zi.raDegrees=shen.raDegrees;shen.raDegrees=temp;
  const out=buildChineseMansionSectors(changed);
  expect(out.status).toBe("READY");
  if(out.status==="READY")expect(out.warnings.some(w=>w.includes("order"))).toBe(true);
 });
});
