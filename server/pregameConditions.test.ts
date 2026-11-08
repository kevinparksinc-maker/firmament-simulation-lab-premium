import { afterEach, describe, expect, it, vi } from "vitest";
import {getPregameConditions} from "./pregameConditions";
const event={id:"nfl-123",sport:"NFL" as const,teamA:"Team A",teamB:"Team B",location:"Test",startTime:"2099-11-08T18:00:00Z"};
afterEach(()=>vi.unstubAllGlobals());
function feed(weather?:any,injuries:any[]=[]){return {header:{competitions:[{date:event.startTime,competitors:[{team:{displayName:"Team A"}},{team:{displayName:"Team B"}}]}]},gameInfo:{weather},injuries};}
describe("pregame external condition evidence",()=>{
 it("keeps missing weather and absent injury entries explicitly unverified",async()=>{
  vi.stubGlobal("fetch",vi.fn().mockResolvedValue({ok:true,json:async()=>feed()}));
  const result=await getPregameConditions(event);
  expect(result.weather).toBeNull();expect(result.availabilityStatus).toBe("not-verified");expect(result.severeWeather).toBe(false);
 });
 it("flags provider-reported severe weather and preserves named injury status",async()=>{
  vi.stubGlobal("fetch",vi.fn().mockResolvedValue({ok:true,json:async()=>feed({displayValue:"Heavy rain",temperature:60},[{team:{displayName:"Team A"},injuries:[{athlete:{displayName:"Player A"},status:"Out"}]}])}));
  const result=await getPregameConditions(event);
  expect(result.severeWeather).toBe(true);expect(result.notes.join(" ")).toContain("NO-BET");
  expect(result.injuries).toEqual([{team:"Team A",player:"Player A",status:"Out"}]);
 });
 it("never fetches current roster data for historical replay",async()=>{
  const fetch=vi.fn();vi.stubGlobal("fetch",fetch);
  const result=await getPregameConditions({...event,startTime:"2000-01-01T18:00:00Z"});
  expect(fetch).not.toHaveBeenCalled();expect(result.status).toBe("not-verified");
 });
 it("rejects provider evidence for a different matchup",async()=>{
  vi.stubGlobal("fetch",vi.fn().mockResolvedValue({ok:true,json:async()=>feed({displayValue:"Clear"})}));
  const result=await getPregameConditions({...event,teamA:"Different Team"});
  expect(result.weather).toBeNull();expect(result.notes.join(" ")).toContain("does not match");
 });
});
