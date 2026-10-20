import {describe,it,expect} from "vitest";
import {readFileSync} from "node:fs";
import {resolve} from "node:path";
import {runSimulationBatch} from "./simulationAdapter";
describe("complete per-method proof inventory",()=>{
 it("exposes formula, scoring lines, every planet and every house in all 42 frame methods",()=>{
  const fixtures=JSON.parse(readFileSync(resolve(process.cwd(),"real-events/annual-rivalry-pilot.json"),"utf8")).events;
  const game=runSimulationBatch(fixtures.filter((e:{id:string})=>e.id==="rivalry-2023-iron-bowl")).results[0];
  for(const frame of [game.godView,game.agentView]){
   expect(frame.proof.methodWalkthrough).toHaveLength(21);
   for(const method of frame.proof.methodWalkthrough){
    const proof=method.exactCalculation;
    expect(proof.completePlanetInventory).toHaveLength(12);
    expect(proof.completeHouseInventory).toHaveLength(12);
    expect(proof.completeHouseInventory.map(h=>h.house).sort((a,b)=>a-b)).toEqual(Array.from({length:12},(_,i)=>i+1));
    expect(proof.formula).toBeTruthy();
    expect(proof.scoringSteps.length).toBeGreaterThan(0);
    expect(proof.limitations.join(" ")).toContain("not necessarily used");
    expect(method.arithmetic).toContain("minus");
   }
  }
 });
});