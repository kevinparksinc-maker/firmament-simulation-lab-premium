import {describe,it,expect} from "vitest";
import {
 CHINESE_J2000_ANCHORS,CHINESE_J2000_MANSIONS,
 CHINESE_J2000_MANSION_WARNINGS
} from "../../shared/chineseMansionJ2000Stars";
import {
 buildChineseMansionSectors,chineseMansionForRA,
 chineseMansionHouseIntersections
} from "../../shared/chineseMansions";

describe("real sourced J2000 Hipparcos/Yale 28 Chinese mansions reference catalog",()=>{
 it("uses precisely 28 observed catalog positions, never 28 equal slices",()=>{
  expect(CHINESE_J2000_ANCHORS).toHaveLength(28);
  expect(CHINESE_J2000_MANSIONS).toHaveLength(28);
  expect(CHINESE_J2000_ANCHORS.every(x=>x.epoch==="J2000"&&x.frame==="equatorial")).toBe(true);
  expect(CHINESE_J2000_MANSIONS.reduce((a,s)=>a+s.widthDegrees,0)).toBeCloseTo(360,9);
  expect(CHINESE_J2000_MANSIONS.some(s=>Math.abs(s.widthDegrees-360/28)>5)).toBe(true);
  expect(new Set(CHINESE_J2000_MANSIONS.map(s=>s.widthDegrees.toFixed(4))).size).toBe(28);
  expect(CHINESE_J2000_MANSIONS.every(s=>s.widthDegrees>0)).toBe(true);
 });
 it("checks reference stars Spica/HIP65474 and Antares/HIP80763 against sourced J2000 catalog",()=>{
  expect(CHINESE_J2000_ANCHORS.find(x=>x.hip===65474)?.raDegrees).toBe(201.2983);
  expect(CHINESE_J2000_ANCHORS.find(x=>x.hip===80763)?.raDegrees).toBe(247.3517);
  expect(CHINESE_J2000_MANSIONS.find(x=>x.hip===65474)?.name).toBe("Jiao");
  const heart=chineseMansionForRA(247.36,CHINESE_J2000_MANSIONS,"J2000");
  expect(heart?.name).toBe("Xin");
  expect(chineseMansionForRA(247.36,CHINESE_J2000_MANSIONS,"OF-DATE")).toBeNull();
 });
 it("preserves unequal full span under zodiac/house 360° overlay and flags any sky-order caveat",()=>{
  expect(buildChineseMansionSectors(CHINESE_J2000_ANCHORS).status).toBe("READY");
  expect(Array.isArray(CHINESE_J2000_MANSION_WARNINGS)).toBe(true);
  for(const s of CHINESE_J2000_MANSIONS){
   const spans=chineseMansionHouseIntersections(s,"agent",55.673652896);
   expect(spans.reduce((sum,x)=>sum+x.degrees,0)).toBeCloseTo(s.widthDegrees,8);
  }
 });
});
