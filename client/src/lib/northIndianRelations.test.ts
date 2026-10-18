import { describe, expect, it } from "vitest";
import { aspectBetween, buildNorthIndianDegreeEvidence, division, HOUSE_FAMILY_ASC, HOUSE_FAMILY_DSC } from "./northIndianRelations";
describe("North Indian lunar mansion and decan degrees",()=>{
 it("covers 28 Arabic lunar mansions, 27 Nakshatras and all 36 decans",()=>{
  expect(division(0,"manzil").index).toBe(1);
  expect(division(359.999,"manzil").index).toBe(28);
  expect(division(359.999,"nakshatra").index).toBe(27);
  expect(division(359.999,"decan").index).toBe(36);
  expect(division(12.857142857,"manzil").index).toBe(1);
  expect(division(13,"manzil").index).toBe(2);
  expect(division(10,"decan").index).toBe(2);
 });
 it("uses the five degree orb and 100/80/60/40 degree weights",()=>{
  expect(aspectBetween(359,0)?.strengthPercent).toBe(100);
  expect(aspectBetween(358.5,0)?.strengthPercent).toBe(80);
  expect(aspectBetween(357.5,0)?.strengthPercent).toBe(60);
  expect(aspectBetween(355.5,0)?.strengthPercent).toBe(40);
  expect(aspectBetween(354,0)).toBeNull();
 });
 it("assigns house-family evidence without changing engine house numbers",()=>{
  const e=buildNorthIndianDegreeEvidence([{planet:"Sun",longitude:13,house:1},{planet:"Moon",longitude:133,house:7}]);
  expect(e.placements[0].houseFamily).toBe("ASC");
  expect(e.placements[1].houseFamily).toBe("DSC");
  expect(e.placements[0].house).toBe(1);
  expect(e.placements[1].house).toBe(7);
  expect([...HOUSE_FAMILY_ASC,...HOUSE_FAMILY_DSC].sort((a,b)=>a-b)).toEqual([1,2,3,4,5,6,7,8,9,10,11,12]);
 });
 it("records source-target planet house relationships with exact longitude",()=>{
  const e=buildNorthIndianDegreeEvidence([{planet:"Mars",longitude:359,house:2},{planet:"Venus",longitude:1,house:9}]);
  const contact=e.contacts.find(x=>x.targetKind==="planet");
  expect(contact).toMatchObject({source:"Mars",target:"Venus",aspect:"conjunction",orb:2,sourceHouse:2,targetHouse:9,sourceLongitude:359,targetLongitude:1,strengthPercent:80});
 });
 it("labels geometric center contacts instead of presenting mansions as planets",()=>{
  const e=buildNorthIndianDegreeEvidence([{planet:"Moon",longitude:360/56,house:1}]);
  const manzil=e.contacts.find(x=>x.targetKind==="Arabic Manzil center"&&x.target==="Al-Sharatain");
  expect(manzil?.orb).toBe(0);
  expect(manzil?.strengthPercent).toBe(100);
  expect(manzil?.targetHouse).toBeUndefined();
 });
});
