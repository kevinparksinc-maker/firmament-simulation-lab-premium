import {describe,it,expect} from "vitest";
import {houseCusp,locateInHouse,arcHouseOverlaps} from "./houseFrameFoundation";
import {fixedEclipticHouseFromLongitude} from "./firmamentEngine";
describe("reverse numbered houses, unchanged zodiac longitudes",()=>{
 it("makes Scorpio house 1 followed by Sagittarius 12 and Capricorn 11",()=>{
  const asc=210;
  for (const [signStart,house] of [[210,1],[240,12],[270,11],[300,10],[330,9],[0,8],[180,2]]){
   const p=locateInHouse(signStart+10,"agent",asc);
   expect(p.house).toBe(house);
   expect(p.degreeInHouse).toBeCloseTo(10);
   expect(houseCusp(house,"agent",asc)).toBeCloseTo(signStart);
  }
 });
 it("keeps signs determined by zodiac, not house number",()=>{
  expect(fixedEclipticHouseFromLongitude(240.1)).toMatchObject({house:5,sign:"Sagittarius"});
  expect(fixedEclipticHouseFromLongitude(210.1)).toMatchObject({house:6,sign:"Scorpio"});
 });
 it("attributes an arc to the same reversed numbering",()=>{
  const segments=arcHouseOverlaps({startLongitude:240,endLongitude:250},"agent",210);
  expect(segments).toHaveLength(1);
  expect(segments[0]!.house).toBe(12);
 });
});