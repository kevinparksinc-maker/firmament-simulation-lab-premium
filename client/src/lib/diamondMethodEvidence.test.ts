import { describe,expect,it } from "vitest";
import {extractReferencedHouses,mapMethodsToDiamond,countMappedMethods} from "./diamondMethodEvidence";
const method=(name:string,detail:string,calculation?:{formula:string;inputs:string[];steps:string[]})=>({
 name,detail,scoreA:3,scoreB:1,winner:"A" as const,source:"method-evidence",calculation,
});
describe("All 42 North Indian method visual bindings",()=>{
 it("recognizes engine house labels accurately, without matching false H120 digits",()=>{
  expect(extractReferencedHouses(["Sun H1; House 7; house #12","Moon H10, h3, H120 not real","H0 and H13 are out of range"])).toEqual([1,3,7,10,12]);
 });
 it("never invents house attribution for chart-wide aspects or methods lacking proof",()=>{
  const rows=mapMethodsToDiamond([method("Chart-wide aspects","Two planets connected within 5°. No explicit house.")]);
  expect(rows[0].mentionedHouses).toEqual([]);
  expect(rows[0].scope).toBe("chart-wide-or-unresolved");
 });
 it("uses both arithmetic inputs and details as explicit HOUSE references",()=>{
  const rows=mapMethodsToDiamond([method("Chaldean Decans","lord in H2",{
    formula:"Σ decan ruler house fit",inputs:["Mars H6; Jupiter House 11"],steps:["H6 contribution to A"],
  })]);
  expect(rows[0].mentionedHouses).toEqual([2,6,11]);
  expect(rows[0].hasCalculationTrace).toBe(true);
 });
 it("preserves original score, method count, and status without vote fabrication",()=>{
  const source=Array.from({length:42},(_,i)=>method("Method "+i,"No individual house source",undefined));
  const mapped=mapMethodsToDiamond(source);
  expect(countMappedMethods(source)).toEqual({total:42,explicitHouseMentions:0,chartWideOrUnresolved:42,traceAvailable:0});
  expect(mapped.map(x=>x.method.scoreA)).toEqual(source.map(x=>x.scoreA));
  expect(mapped.map(x=>x.method.name)).toEqual(source.map(x=>x.name));
 });
});
