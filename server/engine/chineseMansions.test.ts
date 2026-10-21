import {describe,it,expect} from "vitest";
import {CHINESE_MANSIONS,compileChineseMansionCatalog,chineseMansionAtRa,buildChineseMansionEvidence} from "./chineseMansions";
describe("12 Gates Chinese 28 mansions",()=>{
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
