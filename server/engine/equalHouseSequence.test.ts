import {describe,it,expect} from "vitest";
import {houseCusp,locateInHouse,arcHouseOverlaps} from "./houseFrameFoundation";
import {fixedHouseFromLongitude} from "./firmamentEngine";
describe("ascending equal houses, unchanged zodiac longitudes",()=>{
 it("makes Scorpio house 1 followed by Sagittarius 2 and Capricorn 3",()=>{
  const asc=210;
  for (const [signStart,house] of [[210,1],[240,2],[270,3],[300,4],[330,5],[0,6],[180,12]]){
   const p=locateInHouse(signStart+10,"agent",asc);
   expect(p.house).toBe(house);
   expect(p.degreeInHouse).toBeCloseTo(10);
   expect(houseCusp(house,"agent",asc)).toBeCloseTo(signStart);
  }
 });
 it("keeps signs determined by zodiac, not house number",()=>{
  expect(fixedHouseFromLongitude(240.1)).toMatchObject({house:9,sign:"Sagittarius"});
  expect(fixedHouseFromLongitude(210.1)).toMatchObject({house:8,sign:"Scorpio"});
 });
 it("attributes an arc to the same equal-house numbering",()=>{
  const segments=arcHouseOverlaps({startLongitude:240,endLongitude:250},"agent",210);
  expect(segments).toHaveLength(1);
  expect(segments[0]!.house).toBe(2);
 });
});