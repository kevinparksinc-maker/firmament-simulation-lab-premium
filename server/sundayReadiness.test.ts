import { createElement } from "react";
import { renderToStaticMarkup } from "react-dom/server";
import { afterEach, describe, expect, it, vi } from "vitest";
import { SportsbookCallBanner } from "../client/src/components/SportsbookCallBanner";
import { coordinatesFor, listScheduledGames } from "./schedules";
const frame={synthesis:{winner:"TIE",scoreA:10,scoreB:10,margin:0},summary:{hits:0,misses:0}};
const simulation={input:{teamA:"Team A",teamB:"Team B",sport:"NFL",location:"Test",startTime:"2026-11-08T18:00:00Z"},baseline:{winner:"A",verdict:"unverified",combined:{scoreA:999,scoreB:0}},synthesisView:{valid:true,reason:"Matched methods",winner:"B",scoreA:10,scoreB:20,margin:10,verdict:"unverified",methods:Array.from({length:21},(_,i)=>({name:`method-${i}`}))},godView:frame,agentView:frame,comparison:{state:"test",winner:"TIE",verified:false}};
afterEach(()=>vi.unstubAllGlobals());
describe("Sunday result display and schedule integrity",()=>{
 it("uses combined synthesis for headline even when baseline favors the other side",()=>{
   const html=renderToStaticMarkup(createElement(SportsbookCallBanner,{simulation:simulation as any}));
   expect(html).toMatch(/<h1[^>]*>Team B<\/h1>/);
   expect(html).toContain("No pick — tied");
   expect(html).toContain("21-method");
   expect(html).not.toContain("40-method");
 });
 it("withholds an invalid synthesis in the primary call",()=>{
   const html=renderToStaticMarkup(createElement(SportsbookCallBanner,{simulation:{...simulation,synthesisView:{...simulation.synthesisView,valid:false}} as any}));
   expect(html).toContain("No valid pick — calculation failed");
 });
 it("uses known stadium coordinates without mistaking a home city for its stadium",()=>{
   expect(coordinatesFor("AT&T Stadium")).toEqual([32.7473,-97.0945]);
   expect(coordinatesFor("SoFi Stadium")).toEqual([33.9535,-118.3392]);
   expect(coordinatesFor("Lucas Oil Stadium")).toEqual([39.7590621,-86.1638376]);
   expect(coordinatesFor("Santiago Bernabéu")).toEqual([40.4530437,-3.6881970]);
   expect(coordinatesFor("Unknown Stadium")).toBeUndefined();
 });
 it("normalizes ESPN minute-only kickoff timestamps for the event API",async()=>{
   vi.stubGlobal("fetch",vi.fn().mockResolvedValue({ok:true,json:async()=>({events:[{id:"fixture",date:"2026-11-08T18:00Z",status:{type:{state:"pre"}},competitions:[{venue:{fullName:"Arrowhead Stadium",address:{city:"Kansas City",state:"MO"}},competitors:[{homeAway:"away",team:{displayName:"Jets"}},{homeAway:"home",team:{displayName:"Chiefs"}}]}]}]})}));
   const games=await listScheduledGames("2026-11-08","NFL");
   expect(games[0].startTime).toBe("2026-11-08T18:00:00.000Z");
   expect(games[0].latitude).toBe(39.0489);
 });
 it("reports a failed NFL provider rather than returning an empty slate",async()=>{
   vi.stubGlobal("fetch",vi.fn().mockRejectedValue(new Error("offline")));
   await expect(listScheduledGames("2026-11-08","NFL")).rejects.toThrow("SCHEDULE_FEED_UNAVAILABLE");
 });
});
