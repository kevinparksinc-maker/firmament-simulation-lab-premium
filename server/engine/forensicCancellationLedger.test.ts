import {describe,it,expect} from "vitest";
import {readFileSync} from "node:fs";
import {resolve} from "node:path";
import {runSimulationBatch} from "./simulationAdapter";
const events=JSON.parse(readFileSync(resolve(process.cwd(),"real-events/annual-rivalry-pilot.json"),"utf8")).events;
type Layer={name:string;scoreA:number;scoreB:number;winner:string;detail?:string;neutralDiagnostic?:{status:string;reason:string}};
const classify=(x:Layer)=>x.scoreA===0&&x.scoreB===0?"zero-both":x.scoreA===x.scoreB?"equal-nonzero":x.scoreA*x.scoreB>0?"both-same-sign":x.scoreA*x.scoreB<0?"opposing-signs":"one-side-only";
describe("all-method forensic cancellation ledger",()=>{
 it("captures 21 methods per frame and the synthesis cancellation mechanism",()=>{
  const games=runSimulationBatch(events).results;
  expect(games).toHaveLength(7);
  const report=games.map((g,i)=>{
   const frame=(name:string,layers:Layer[],total:{scoreA:number;scoreB:number;winner:string})=>{
    expect(layers).toHaveLength(21);
    const rows=layers.map(l=>({name:l.name,a:l.scoreA,b:l.scoreB,differential:Number((l.scoreA-l.scoreB).toFixed(3)),winner:l.winner,mechanism:classify(l),neutralStatus:l.neutralDiagnostic?.status,reason:l.neutralDiagnostic?.reason,detail:l.detail}));
    const sumA=Number(layers.reduce((s,l)=>s+l.scoreA,0).toFixed(3)),sumB=Number(layers.reduce((s,l)=>s+l.scoreB,0).toFixed(3));
    return {name,prediction:total.winner,totalA:total.scoreA,totalB:total.scoreB,sumA,sumB,sumDifferenceA:Number((sumA-total.scoreA).toFixed(3)),sumDifferenceB:Number((sumB-total.scoreB).toFixed(3)),rows};
   };
   return {game:events[i].id,actual:events[i].actualWinner,parity:g.frameParity.valid,
    god:frame("God",g.godView.allLayers,g.godView.synthesis),
    agent:frame("Agent",g.agentView.allLayers,g.agentView.synthesis),
    synthesis:{prediction:g.synthesisView.winner,valid:g.synthesisView.valid,scoreA:g.synthesisView.scoreA,scoreB:g.synthesisView.scoreB,rows:g.synthesisView.methods.map(m=>({name:m.name,a:m.scoreA,b:m.scoreB,differential:Number((m.scoreA-m.scoreB).toFixed(3)),winner:m.winner,mechanism:classify(m)}))}
   };
  });
  console.log("FIRMAMENT_CANCELLATION_LEDGER="+JSON.stringify(report));
 });
});
