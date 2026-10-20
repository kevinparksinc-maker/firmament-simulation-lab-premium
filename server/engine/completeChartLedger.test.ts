import {describe,it,expect} from "vitest";
import {completeChartLedger,chartSide} from "./completeChartLedger";
import {auditNeutralMethod} from "./neutralMethodAudit";
import {readFileSync} from "node:fs";
import {resolve} from "node:path";
import {runSimulationBatch} from "./simulationAdapter";
describe("complete chart evidence and neutral accuracy",()=>{
 it("covers all twelve houses, both competitive clusters and cross-side aspects",()=>{
  const bodies=[{planet:"Sun",house:1,longitude:0,sign:"Aries",degreeInSign:0,nakshatra:"Ashwini",manzil:{name:"A"}},{planet:"Moon",house:7,longitude:120,sign:"Leo",degreeInSign:0,nakshatra:"Magha",manzil:{name:"B"}}];
  const l=completeChartLedger(bodies);
  expect(l.houses).toHaveLength(12);expect(l.bodies).toHaveLength(2);expect(l.aspects).toHaveLength(1);expect(l.aspects[0]?.crossSide).toBe(true);
  expect(l.bodies.map(x=>x.decan)).toEqual([1,1]);expect(chartSide(10)).toBe("A");expect(chartSide(4)).toBe("B");
 });
 it("distinguishes equal-nonzero cancellation from directional points",()=>{
  expect(auditNeutralMethod({name:"equal",scoreA:3,scoreB:3}).status).toBe("valid-neutral");
  expect(auditNeutralMethod({name:"directional",scoreA:3,scoreB:1}).status).toBe("triggered");
 });
 it("attaches complete body and aspect ledger to each real frame",()=>{
  const fixtures=JSON.parse(readFileSync(resolve(process.cwd(),"real-events/annual-rivalry-pilot.json"),"utf8")).events;
  for(const g of runSimulationBatch(fixtures).results){
   for(const f of [g.godView,g.agentView]){
    expect(f.fullChartLedger.houses).toHaveLength(12);
    expect(f.fullChartLedger.bodies.length).toBeGreaterThanOrEqual(9);
    expect(f.fullChartLedger.bodies.every(x=>x.nakshatra&&x.decan>=1&&x.decan<=3)).toBe(true);
    expect(f.fullChartLedger.aspects.every(x=>x.orb<=5)).toBe(true);
   }
  }
 });
});
