import {describe,it,expect} from "vitest";
import {readFileSync} from "node:fs";
import {resolve} from "node:path";
import {runSimulationBatch} from "./simulationAdapter";
import {calculateRestoredTerritorial,type TerritorialPlanet} from "./territorialStack";
const planets=(names:string[]):TerritorialPlanet[]=>names.map((name,i)=>({planet:name,tropicalLongitude:i*23,house:i%12+1,sign:["Aries","Taurus","Gemini","Cancer","Leo","Virgo","Libra","Scorpio","Sagittarius","Capricorn","Aquarius","Pisces"][Math.floor((i*23)/30)]!,degreeInHouse:3,degreeInSign:3,altitude:2,isRetrograde:false,nakshatra:"Ashwini"}));
const all=["Sun","Moon","Mercury","Venus","Mars","Jupiter","Saturn"];
const run=(p:TerritorialPlanet[])=>calculateRestoredTerritorial(p,0,x=>Math.floor((((x%360)+360)%360)/30)+1,"god");
describe("Territorial fail-closed guards",()=>{
 it("rejects missing house ruler instead of skipping houses",()=>expect(()=>run(planets(all.filter(p=>p!=="Mars")))).toThrow(/missing ruling planet Mars/));
 it("rejects nonfinite sect input instead of assuming day",()=>{const p=planets(all);p.find(x=>x.planet==="Sun")!.altitude=Number.NaN;expect(()=>run(p)).toThrow(/Sun altitude/);});
 it("rejects absent Lot longitudes instead of defaulting to Aries zero",()=>{const p=planets(all);p.find(x=>x.planet==="Sun")!.tropicalLongitude=Number.NaN;expect(()=>run(p)).toThrow(/missing finite longitude/);});
 it("calculates night-dependent Arabic Lots from night Fortune and Spirit, not day intermediate values",()=>{
  const p=planets(all);p.find(x=>x.planet==="Sun")!.altitude=-10;
  const lots=run(p).evidence.arabicLots;
  const get=(name:string)=>lots.find(x=>x.name===name)!.longitude;
  expect(get("Lot of Fortune")).toBe(337);
  expect(get("Lot of Spirit")).toBe(23);
  expect(get("Lot of Eros")).toBe(314);
  expect(get("Lot of Victory")).toBe(268);
 });
 it("does not regress the seven rivalry event frame outputs",()=>{
  const fixtures=JSON.parse(readFileSync(resolve(process.cwd(),"real-events/annual-rivalry-pilot.json"),"utf8")).events;
  const result=runSimulationBatch(fixtures);
  expect(result.results).toHaveLength(7);
  expect(result.results.every(x=>x.frameParity.valid)).toBe(true);
 });
});
