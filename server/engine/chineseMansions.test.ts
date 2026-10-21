import {describe,it,expect} from "vitest";
import {CHINESE_MANSIONS,compileChineseMansionCatalog,chineseMansionAtRa,buildChineseMansionEvidence,DEFAULT_CHINESE_MANSIONS,STELLARIUM_J2000_CHINESE_CATALOG} from "./chineseMansions";
describe("12 Gates Chinese 28 mansions",()=>{
 it("loads 28 sourced J2000 star anchors with a complete unequal-width circle",()=>{
  expect(STELLARIUM_J2000_CHINESE_CATALOG.anchors).toHaveLength(28);
  expect(DEFAULT_CHINESE_MANSIONS.boundaries).toHaveLength(28);
  expect(DEFAULT_CHINESE_MANSIONS.boundaries.reduce((a,b)=>a+b.widthDegrees,0)).toBeCloseTo(360,6);
  expect(DEFAULT_CHINESE_MANSIONS.boundaries.some(b=>Math.abs(b.widthDegrees-360/28)>1)).toBe(true);
  expect(chineseMansionAtRa(201.29833333333332,DEFAULT_CHINESE_MANSIONS).mansion.hanzi).toBe("角");
 });
 const mock = {frame:"ICRS_J2000" as const,source:"TEST ONLY — synthetic nonuniform fixture",anchors:CHINESE_MANSIONS.map((m,i)=>({star:m.determinativeStar,rightAscensionDegrees: (i===0?0:i*360/28+(i%3)*0.1)}))};
 it("has four groups of seven and unique determinative stars",()=>{
  expect(CHINESE_MANSIONS).toHaveLength(28);
  expect(new Set(CHINESE_MANSIONS.map(m=>m.determinativeStar)).size).toBe(28);
  expect(new Set(CHINESE_MANSIONS.map(m=>m.quadrant)).size).toBe(4);
 });
 it("uses star boundaries, not equal longitude sections",()=>{
  const compiled=compileChineseMansionCatalog(mock);
  expect(compiled.boundaries[0]!.widthDegrees).not.toBe(360/28);
  expect(chineseMansionAtRa(0,compiled).mansion.index).toBe(1);
  expect(chineseMansionAtRa(359.99,compiled).mansion.index).toBe(28);
  expect(chineseMansionAtRa(compiled.boundaries[1]!.startRightAscensionDegrees,compiled).mansion.index).toBe(2);
 });
 it("fails closed when catalogue is incomplete",()=>{
  expect(()=>compileChineseMansionCatalog({...mock,anchors:mock.anchors.slice(1)})).toThrow();
 });
 it("evaluates every supplied planet and house",()=>{
  const compiled=compileChineseMansionCatalog(mock);
  const bodies=Array.from({length:12},(_,i)=>({planet:"P"+i,j2000RaDegrees:i*24,house:i+1}));
  expect(buildChineseMansionEvidence(bodies,compiled).assignments).toHaveLength(12);
 });
});
