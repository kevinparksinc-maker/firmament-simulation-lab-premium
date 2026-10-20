import {describe,it,expect} from "vitest";
import {readFileSync} from "node:fs";
import {resolve} from "node:path";
import {runSimulationBatch} from "./simulationAdapter";
describe("visible Dasha and Ashtakavarga methods",()=>{
 it("publishes three distinct techniques in both frames and separate synthesis",()=>{
  const events=JSON.parse(readFileSync(resolve(process.cwd(),"real-events/annual-rivalry-pilot.json"),"utf8")).events;
  const result=runSimulationBatch(events.filter((e:{id:string})=>e.id==="rivalry-2023-iron-bowl")).results[0];
  for(const frame of [result.additionalMethods.godView,result.additionalMethods.agentView]){
   expect(frame.map(m=>m.id)).toEqual(["ASHTAKAVARGA_V1","EVENT_LUNAR_DASHA_CHAIN_V1","NATAL_VIMSHOTTARI_V1"]);
   expect(frame[0]!.evaluable).toBe(true);
   expect(frame[1]!.evaluable).toBe(true);
   expect(frame[2]!.evaluable).toBe(false);
   expect(frame[2]!.limitation).toContain("natal chart");
   expect(frame[2]!.scoreA).toBeNull();
  }
  expect(result.additionalMethods.synthesis).toHaveLength(3);
  expect(result.additionalMethods.synthesis[2]!.prediction).toBe("NONE");
  expect(result.godView.allLayers).toHaveLength(21);
  expect(result.agentView.allLayers).toHaveLength(21);
 });
});