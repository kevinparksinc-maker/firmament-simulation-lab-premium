import {describe,it,expect} from "vitest";
import {readFileSync} from "node:fs";
import {resolve} from "node:path";
import {runSimulationBatch} from "./simulationAdapter";
describe("method-by-method transparent scoring walkthrough",()=>{
 it("shows actual rule, scoring inputs, steps, whole family context, and A/B arithmetic for each of 21 methods per frame",()=>{
  const e=JSON.parse(readFileSync(resolve(process.cwd(),"real-events/annual-rivalry-pilot.json"),"utf8")).events;
  for(const game of runSimulationBatch(e).results)for(const frame of [game.godView,game.agentView]){
   expect(frame.proof.methodWalkthrough).toHaveLength(21);
   frame.proof.methodWalkthrough.forEach((m,i)=>{
    expect(m.method).toBe(frame.allLayers[i].name);
    expect(m.scoreA).toBe(frame.allLayers[i].scoreA);
    expect(m.scoreB).toBe(frame.allLayers[i].scoreB);
    expect(m.housesA).toEqual([1,2,3,6,10,11]);
    expect(m.housesB).toEqual([4,5,7,8,9,12]);
    expect(m.appliedRule.length).toBeGreaterThan(0);
    expect(m.familyEvidence.length).toBeGreaterThan(0);
    expect(m.familyEvidence.every(x=>x.startsWith("FAMILY EVIDENCE (not additional score):"))).toBe(true);
    expect(m.scoringInputs.every(x=>!x.startsWith("FAMILY EVIDENCE (not additional score):"))).toBe(true);
    expect(m.differenceAminusB).toBeCloseTo(m.scoreA-m.scoreB,2);
   });
  }
 });
});