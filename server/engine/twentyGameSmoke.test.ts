import { describe, expect, it } from "vitest";
import { readFileSync } from "node:fs";
import { resolve } from "node:path";
import { runSimulationBatch } from "./simulationAdapter";
import { compareFrameMethods, summarizeMethodComparison } from "../../client/src/lib/crossFrameMethods";

type Fixture = { id:string; teamA:string;teamB:string;sport:"MLB"|"NCAAF"|"NFL";location:string;latitude:number;longitude:number;startTime:string;actualWinner:"A"|"B";roleAssignmentSource:"market-odds" };
const source = JSON.parse(readFileSync(resolve(process.cwd(),"real-events/historical-benchmark-games.json"),"utf8")) as {events:Fixture[]};
describe("20 historical game smoke test — exploratory, not independently audited",()=>{
 it("runs both frames and compares every method against recorded winners",()=>{
  const fixtures=source.events.slice(0,20);
  expect(fixtures).toHaveLength(20);
  const batch=runSimulationBatch(fixtures);
  expect(batch.results).toHaveLength(20);
  const count=(rows:{winner:string}[],winner:string)=>rows.filter(row=>row.winner===winner).length;
  const aggregate = new Map<string,{gHits:number;gMisses:number;gTies:number;aHits:number;aMisses:number;aTies:number}>();
  const games=batch.results.map((game,index)=>{
   const pairs=compareFrameMethods(game.godView.allLayers,game.agentView.allLayers);
   const comparison=summarizeMethodComparison(pairs);
   expect(pairs).toHaveLength(21);
   expect(comparison.compared).toBe(21);
   const actual=fixtures[index]!.actualWinner;
   for(const row of pairs){
    const value=aggregate.get(row.name)??{gHits:0,gMisses:0,gTies:0,aHits:0,aMisses:0,aTies:0};
    for(const [reading,hit,miss,tie] of [[row.god,"gHits","gMisses","gTies"],[row.agent,"aHits","aMisses","aTies"]] as const){
     if(!reading)continue;
     if(reading.winner==="TIE")value[tie]++;
     else if(reading.winner===actual)value[hit]++;
     else value[miss]++;
    }
    aggregate.set(row.name,value);
   }
   return {id:game.input.id,actual,baseline:game.baseline.winner,god:game.godView.synthesis.winner,agent:game.agentView.synthesis.winner,agree:comparison.agreements,reverse:comparison.reversals,neutral:comparison.neutral,godHits:count(game.godView.allLayers.filter(layer=>layer.verdict==="hit"),actual) };
  });
  const summary={games:games.length,baselineHits:games.filter(g=>g.baseline===g.actual).length,godHits:games.filter(g=>g.god===g.actual).length,agentHits:games.filter(g=>g.agent===g.actual).length,frameAgreement:games.filter(g=>g.god===g.agent).length,totalMethodAgreements:games.reduce((a,g)=>a+g.agree,0),totalReversals:games.reduce((a,g)=>a+g.reverse,0),totalNeutral:games.reduce((a,g)=>a+g.neutral,0),methodRanking:[...aggregate.entries()].map(([name,v])=>({name,...v})).sort((a,b)=>(b.gHits+b.aHits)-(a.gHits+a.aHits))};
  console.log("FIRMAMENT_20_GAME_SMOKE_RESULT="+JSON.stringify({summary,games}));
 });
});
