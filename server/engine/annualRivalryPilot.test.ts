import { describe, expect, it } from "vitest";
import {readFileSync} from "node:fs";
import {resolve} from "node:path";
import {runSimulationBatch} from "./simulationAdapter";
const data=JSON.parse(readFileSync(resolve(process.cwd(),"real-events/annual-rivalry-pilot.json"),"utf8"));
describe("annual rivalry recurring-cohort exploratory pilot",()=>{
 it("compares God Agent Synthesis and favorite baseline on complete sourced fixtures",()=>{
  const fixtures=data.events;
  expect(fixtures).toHaveLength(7);
  const result=runSimulationBatch(fixtures);
  const perGame=result.results.map((game,i)=>{
   const f=fixtures[i];
   expect(game.synthesisView.methods).toHaveLength(21);
   expect(game.godView.allLayers).toHaveLength(21);
   expect(game.agentView.allLayers).toHaveLength(21);
   const views={god:game.godView.synthesis.winner,agent:game.agentView.synthesis.winner,synthesis:game.synthesisView.winner,baseline:game.baseline.winner,favorite:"A"};
   return {id:f.id,rivalry:f.rivalry,year:new Date(f.startTime).getUTCFullYear(),favored:f.teamA,underdog:f.teamB,actual:f.actualWinner,kickoffQuality:f.kickoffQuality,source:f.sourceUrl,views,methodResults:{god:game.godView.allLayers.map((x)=>({name:x.name,pick:x.winner,scoreA:x.scoreA,scoreB:x.scoreB})),agent:game.agentView.allLayers.map((x)=>({name:x.name,pick:x.winner,scoreA:x.scoreA,scoreB:x.scoreB})),synthesis:game.synthesisView.methods.map((x)=>({name:x.name,pick:x.winner,scoreA:x.scoreA,scoreB:x.scoreB}))}};
  });
  const counts=Object.fromEntries(["god","agent","synthesis","baseline","favorite"].map(k=>[k,{hit:perGame.filter(v=>(v.views as any)[k]===v.actual).length,tie:perGame.filter(v=>(v.views as any)[k]==="TIE").length}]));
  const methods=perGame[0].methodResults.synthesis.map((m:any)=>({name:m.name, ...Object.fromEntries(["god","agent","synthesis"].map(k=>[k,{hit:perGame.filter(v=>(v.methodResults as any)[k].find((n:any)=>n.name===m.name)?.pick===v.actual).length,tie:perGame.filter(v=>(v.methodResults as any)[k].find((n:any)=>n.name===m.name)?.pick==="TIE").length}]))}));
  const byRivalry=[...new Set(perGame.map(g=>g.rivalry))].map(name=>({name,games:perGame.filter(g=>g.rivalry===name).length, ...Object.fromEntries(["god","agent","synthesis","favorite"].map(k=>[k,perGame.filter(v=>v.rivalry===name && (v.views as any)[k]===v.actual).length]))}));
  console.log("FIRMAMENT_RIVALRY_REPORT="+JSON.stringify({games:perGame.length,counts,byRivalry,methods,perGame:perGame.map(({methodResults,...row})=>row)}));
 });
});
