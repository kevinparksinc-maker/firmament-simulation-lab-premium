import {describe,it,expect} from "vitest";
import {readFileSync} from "node:fs";
import {resolve} from "node:path";
import {runSimulationBatch} from "./simulationAdapter";
describe("collective scoring policy regression",()=>{
 it("turns Upachaya from each competitor and excludes lunar nodes from retrograde",()=>{
  const fixtures=JSON.parse(readFileSync(resolve(process.cwd(),"real-events/annual-rivalry-pilot.json"),"utf8")).events;
  const games=runSimulationBatch(fixtures).results;
  expect(games).toHaveLength(7);
  for (const game of games) for (const frame of [game.godView,game.agentView]){
   expect(frame.allLayers).toHaveLength(21);
   const retro=frame.allLayers.find(x=>x.name==="Retrograde condition")!;
   expect(retro.calculation?.formula).toContain("nodes excluded");
   expect(retro.detail).not.toMatch(/(?:Rahu|Ketu) H\d+:/);
   const growth=frame.allLayers.find(x=>x.name==="Upachaya growth")!;
   expect(growth.calculation?.formula).toContain("H9/H12/H4/H5");
   expect(growth.calculation?.formula).toContain("nodes excluded");
  }
 });
});