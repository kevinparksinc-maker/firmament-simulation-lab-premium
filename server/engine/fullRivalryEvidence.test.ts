import { describe,expect,it } from "vitest";
import {readFileSync} from "node:fs";
import {resolve} from "node:path";
import {runSimulationBatch} from "./simulationAdapter";
const data=JSON.parse(readFileSync(resolve(process.cwd(),"real-events/annual-rivalry-pilot.json"),"utf8"));
describe("full seven-game three-view method evidence",()=>{
 it("exports all 21 method inputs and formulas per frame",()=>{
  const batch=runSimulationBatch(data.events);
  const report=batch.results.map((g,i)=>({
   fixture:data.events[i],
   predictions:{god:g.godView.synthesis,agent:g.agentView.synthesis,synthesis:{scoreA:g.synthesisView.scoreA,scoreB:g.synthesisView.scoreB,winner:g.synthesisView.winner,formula:g.synthesisView.formula},baseline:g.baseline.winner},
   parity:g.frameParity,
   god:g.godView.allLayers.map(x=>({name:x.name,winner:x.winner,scoreA:x.scoreA,scoreB:x.scoreB,detail:x.detail,formula:x.calculation?.formula,inputs:x.calculation?.inputs,steps:x.calculation?.steps,source:x.source})),
   agent:g.agentView.allLayers.map(x=>({name:x.name,winner:x.winner,scoreA:x.scoreA,scoreB:x.scoreB,detail:x.detail,formula:x.calculation?.formula,inputs:x.calculation?.inputs,steps:x.calculation?.steps,source:x.source})),
   synthesis:g.synthesisView.methods
  }));
  expect(report).toHaveLength(7);
  expect(report.every(r=>r.god.length===21&&r.agent.length===21&&r.synthesis.length===21)).toBe(true);
  console.log("FIRMAMENT_FULL_RIVALRY_EVIDENCE_START");
  console.log(JSON.stringify(report));
  console.log("FIRMAMENT_FULL_RIVALRY_EVIDENCE_END");
 });
});
