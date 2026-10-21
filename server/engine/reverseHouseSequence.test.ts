import { describe,it,expect } from "vitest";
import { houseCusp,locateInHouse,arcHouseOverlaps,legacyReverseHouse } from "./houseFrameFoundation";
import { fixedEclipticHouseFromLongitude } from "./firmamentEngine";
describe("House numbering follows zodiac forwards; previous reversal is strictly historical",()=>{
 it("makes Scorpio H1, Sagittarius H2, and Libra H12",()=>{
  const asc=210;
  for(const [signStart,house] of [[210,1],[240,2],[270,3],[300,4],[330,5],[0,6],[180,12]]){
   const p=locateInHouse(signStart+10,"agent",asc);
   expect(p.house).toBe(house);
   expect(p.degreeInHouse).toBeCloseTo(10);
   expect(houseCusp(house,"agent",asc)).toBeCloseTo(signStart);
  }
 });
 it("keeps signs fixed and independent of house number",()=>{
  expect(fixedEclipticHouseFromLongitude(240.1)).toMatchObject({house:9,sign:"Sagittarius"});
  expect(fixedEclipticHouseFromLongitude(210.1)).toMatchObject({house:8,sign:"Scorpio"});
 });
 it("assigns a forward zodiac arc to H2, preserving old H12 only in legacy helper",()=>{
  const arc=arcHouseOverlaps({startLongitude:240,endLongitude:250},"agent",210);
  expect(arc).toHaveLength(1);
  expect(arc[0]!.house).toBe(2);
  expect(legacyReverseHouse(241,"agent",210)).toBe(12);
 });
});
