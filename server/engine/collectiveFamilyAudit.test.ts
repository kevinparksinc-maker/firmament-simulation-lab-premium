import {describe,it,expect} from "vitest";
import {readFileSync} from "node:fs";
import {resolve} from "node:path";
import {runSimulationBatch} from "./simulationAdapter";
describe("21-method collective family evidence contract",()=>{
 it("delivers both six-house families and full planetary evidence to every method in each frame",()=>{
  const e=JSON.parse(readFileSync(resolve(process.cwd(),"real-events/annual-rivalry-pilot.json"),"utf8")).events;
  for(const game of runSimulationBatch(e).results){
   for(const frame of [game.godView,game.agentView]){
    expect(frame.allLayers).toHaveLength(21);
    for(const method of frame.allLayers){
     const inputs=method.calculation?.inputs??[];
     const lines=method.calculation?.steps??[];
     expect(lines.some(x=>x.includes("Collective coverage: A houses 1,2,3,6,10,11; B houses 4,5,7,8,9,12"))).toBe(true);
     expect(inputs.some(x=>x.includes("FAMILY EVIDENCE (not additional score): Moon:"))).toBe(true);
     expect(inputs.some(x=>x.includes("Nakshatra")&&x.includes("Manzil")&&x.includes("decan"))).toBe(true);
    }
    expect(frame.fullChartLedger.houses).toHaveLength(12);
   }
  }
 });
});