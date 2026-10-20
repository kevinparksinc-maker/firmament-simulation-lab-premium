import {describe,it,expect} from "vitest";
import {ASCENDANT_HOUSES,DESCENDANT_HOUSES,UNIVERSAL_ASPECT_ORB_DEGREES,USER_ORB_WEIGHT_TIERS,EXPECTED_METHOD_COUNT,frameworkSide,assertFrameworkMethodRoster} from "./frameworkContract";
import {runSimulationEvent} from "./simulationAdapter";
import {readFileSync} from "node:fs";
import {resolve} from "node:path";
describe("user-authored universal framework invariants",()=>{
 it("covers each of the 12 houses exactly once",()=>{
  expect([...ASCENDANT_HOUSES,...DESCENDANT_HOUSES].sort((a,b)=>a-b)).toEqual([1,2,3,4,5,6,7,8,9,10,11,12]);
  for(const h of ASCENDANT_HOUSES)expect(frameworkSide(h)).toBe("A");
  for(const h of DESCENDANT_HOUSES)expect(frameworkSide(h)).toBe("B");
  expect(()=>frameworkSide(13)).toThrow();
 });
 it("records the user specified orbital contract without silently inventing tier boundaries",()=>{
  expect(UNIVERSAL_ASPECT_ORB_DEGREES).toBe(5);
  expect(USER_ORB_WEIGHT_TIERS).toEqual([100,80,60,40]);
 });
 it("requires all 21 names in both frame outputs and 21 syntheses",()=>{
  const f=JSON.parse(readFileSync(resolve(process.cwd(),"real-events/annual-rivalry-pilot.json"),"utf8")).events[0];
  const result=runSimulationEvent(f);
  for(const rows of [result.godView.allLayers,result.agentView.allLayers,result.synthesisView.methods]){
   expect(rows).toHaveLength(EXPECTED_METHOD_COUNT);
   expect(()=>assertFrameworkMethodRoster(rows.map(x=>x.name))).not.toThrow();
  }
 });
});
