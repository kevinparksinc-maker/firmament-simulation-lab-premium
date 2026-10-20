import {describe,expect,it} from "vitest";
import {readFileSync} from "node:fs";
import {resolve} from "node:path";
import {runSimulationBatch} from "./simulationAdapter";
describe("five-degree and full-chart attribution regression",()=>{
 it("runs all 21 methods in both frames and publishes valid synthesis",()=>{
  const fixtures=JSON.parse(readFileSync(resolve(process.cwd(),"real-events/annual-rivalry-pilot.json"),"utf8")).events;
  const {results}=runSimulationBatch(fixtures);
  expect(results).toHaveLength(7);
  for(const g of results){
   expect(g.frameParity.valid).toBe(true);
   expect(g.godView.allLayers).toHaveLength(21);
   expect(g.agentView.allLayers).toHaveLength(21);
   expect(g.synthesisView.methods).toHaveLength(21);
   for(const f of [g.godView,g.agentView]){
    const chart=f.allLayers.find(x=>x.name==="Chart-wide aspects");
    const hfu=f.allLayers.find(x=>x.name==="Harmonious vs friction aspects");
    expect(chart).toBeDefined();
    expect(hfu).toBeDefined();
    expect(chart!.calculation?.formula).toContain("5°");
    expect(hfu!.calculation?.formula).toContain("cross-side contacts score both");
    expect(f.allLayers.reduce((a,x)=>a+x.scoreA,0)).toBeCloseTo(f.synthesis.scoreA,2);
    expect(f.allLayers.reduce((a,x)=>a+x.scoreB,0)).toBeCloseTo(f.synthesis.scoreB,2);
   }
  }
 });
});
