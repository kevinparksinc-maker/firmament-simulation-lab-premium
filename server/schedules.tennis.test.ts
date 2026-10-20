import { describe,expect,it } from "vitest";
import {parseTennisScoreboard} from "./schedules";

describe("ATP/WTA scoreboard normalization",()=>{
 it("extracts tournament-nested matches and never treats the tournament itself as a match",()=>{
  const payload={events:[{id:"tournament",name:"Test Open",competitions:[
   {id:"match-1",date:"2026-10-19T20:00:00Z",status:{type:{state:"in",shortDetail:"Set 2"}},
    competitors:[{athlete:{displayName:"Player One"},score:"6 3"},{athlete:{displayName:"Player Two"},score:"4 2"}]},
   {id:"bye",date:"2026-10-19T22:00:00Z",competitors:[{athlete:{displayName:"One"}}]}
  ]}]};
  const result=parseTennisScoreboard(payload,"ATP");
  expect(result).toHaveLength(1);
  expect(result[0]).toMatchObject({sport:"TENNIS",teamA:"Player One",teamB:"Player Two",isLive:true,scoreA:"6 3",scoreB:"4 2",oddsStatus:"unavailable"});
  expect(result[0]?.favoriteTeam).toBeUndefined();
 });
 it("ignores incomplete fixtures instead of manufacturing players or dates",()=>{
  expect(parseTennisScoreboard({events:[{competitions:[{competitors:[{},{}]}]}]},"WTA")).toEqual([]);
 });
});
