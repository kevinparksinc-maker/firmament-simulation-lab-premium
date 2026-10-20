import {describe,expect,it} from "vitest";
import {calculateRestoredTerritorial,type TerritorialPlanet} from "./territorialStack";
import {readFileSync} from "node:fs";
import {resolve} from "node:path";
import {runSimulationBatch} from "./simulationAdapter";
const names=["Sun","Moon","Mercury","Venus","Mars","Jupiter","Saturn"];
const signs=["Aries","Taurus","Gemini","Cancer","Leo","Virgo","Libra","Scorpio","Sagittarius","Capricorn","Aquarius","Pisces"];
const fixture=():TerritorialPlanet[]=>names.map((name,i)=>({planet:name,house:i+1,tropicalLongitude:i*30+25,sign:signs[i]!,degreeInSign:25,degreeInHouse:1,altitude:10,isRetrograde:false,nakshatra:"Ashwini"}));
const calc=(x:TerritorialPlanet[])=>calculateRestoredTerritorial(x,0,lon=>Math.floor((((lon%360)+360)%360)/30)+1,"god");
describe("Decan coordinate and input integrity",()=>{
 it("uses sign degree, never degree measured from equal-house cusp",()=>{
  const result=calc(fixture());
  const sun=result.evidence.decans.find(p=>p.planet==="Sun");
  expect(sun?.decan).toBe(3);
  expect(sun?.degreeInSign).toBe(25);
 });
 it("rejects sign-longitude mismatch rather than trusting a decan label",()=>{
  const p=fixture();p[0]!.sign="Taurus";
  expect(()=>calc(p)).toThrow(/sign\/longitude mismatch/);
 });
 it("recalculates original rivalry frames without missing input",()=>{
  const e=JSON.parse(readFileSync(resolve(process.cwd(),"real-events/annual-rivalry-pilot.json"),"utf8")).events;
  const results=runSimulationBatch(e).results;
  expect(results).toHaveLength(7);expect(results.every(g=>g.frameParity.valid)).toBe(true);
 });
});