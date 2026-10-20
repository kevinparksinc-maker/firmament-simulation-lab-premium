import {it} from "vitest";
import {readFileSync} from "node:fs";
import {resolve} from "node:path";
import {runSimulationBatch} from "./simulationAdapter";
it("emits full 2023 Iron Bowl method walkthrough and family charts",()=>{
 const events=JSON.parse(readFileSync(resolve(process.cwd(),"real-events/annual-rivalry-pilot.json"),"utf8")).events;
 const out=runSimulationBatch(events.filter((g:{id:string})=>g.id==="rivalry-2023-iron-bowl")).results[0];
 console.log("IRONBOWL_FULL_EVIDENCE="+JSON.stringify({
  god:{asc:out.godView.ascendantLongitude,chart:out.godView.fullChartLedger,methods:out.godView.proof.methodWalkthrough.map((x:any)=>({n:x.number,name:x.method,formula:x.appliedRule,scoringInputs:x.scoringInputs,scoringSteps:x.scoringSteps,a:x.scoreA,b:x.scoreB,status:x.scoringProofStatus}))},
  agent:{asc:out.agentView.ascendantLongitude,chart:out.agentView.fullChartLedger,methods:out.agentView.proof.methodWalkthrough.map((x:any)=>({n:x.number,name:x.method,formula:x.appliedRule,scoringInputs:x.scoringInputs,scoringSteps:x.scoringSteps,a:x.scoreA,b:x.scoreB,status:x.scoringProofStatus}))},
  synthesis:out.synthesisView.methods.map((x:any)=>({name:x.name,a:x.scoreA,b:x.scoreB,winner:x.winner}))
 }));
 console.log("IRONBOWL_HOUSELORD_STEPS="+JSON.stringify({god:out.godView.proof.methodWalkthrough.slice(0,3).map((x:any)=>({name:x.method,inputs:x.scoringInputs,steps:x.scoringSteps})),agent:out.agentView.proof.methodWalkthrough.slice(0,3).map((x:any)=>({name:x.method,inputs:x.scoringInputs,steps:x.scoringSteps}))}));
});