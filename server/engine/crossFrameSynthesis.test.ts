import {describe,it,expect} from "vitest";
import {synthesizeFramePredictions} from "./crossFrameSynthesis";
import {runSimulationEvent} from "./simulationAdapter";
const mk=(name:string,a:number,b:number)=>({name,scoreA:a,scoreB:b,winner:a>b?"A" as const:a<b?"B" as const:"TIE" as const});
describe("independent 21-method predictive synthesis",()=>{
 it("combines all 21 matched methods without modifying parent scores",()=>{
  const god=Array.from({length:21},(_,i)=>mk("M"+i,4,0));
  const agent=Array.from({length:21},(_,i)=>mk("M"+i,0,2));
  const result=synthesizeFramePredictions(god,agent,true);
  expect(result.valid).toBe(true); expect(result.methods).toHaveLength(21);
  expect(result.methods[0]).toMatchObject({scoreA:2,scoreB:1,winner:"A"});
  expect(result.scoreA).toBe(42);expect(result.scoreB).toBe(21);expect(result.winner).toBe("A");
  expect(god[0]?.scoreA).toBe(4);
 });
 it("withholds prediction when parity fails",()=>{
  const result=synthesizeFramePredictions([mk("M",4,1)],[],false);
  expect(result.valid).toBe(false);expect(result.winner).toBe("TIE");
 });
 it("creates genuine third prediction for a real fixture",()=>{
  const result=runSimulationEvent({teamA:"Dallas Cowboys",teamB:"Green Bay Packers",sport:"NFL",location:"Arlington, TX",latitude:32.7473,longitude:-97.0945,startTime:"2024-01-14T21:30:00Z",actualWinner:"B"});
  expect(result.synthesisView.valid).toBe(true);
  expect(result.synthesisView.methods).toHaveLength(21);
  expect(result.synthesisView.formula).toContain("21");
 });
});
