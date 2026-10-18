import { describe, expect, it } from "vitest";
import { calculateHouseStrengthAudit, degreeWeight, houseWeight, relationship, sideOfHouse } from "./houseStrengthAudit";

describe("experimental bounded North Indian house-weight audit",()=>{
 it("preserves both sport house families across all twelve houses",()=>{
  expect(Array.from({length:12},(_,i)=>sideOfHouse(i+1))).toEqual(["A","A","A","B","B","A","B","B","B","A","A","B"]);
  expect(houseWeight(1)).toBe(1);
  expect(houseWeight(4)).toBe(1);
  expect(houseWeight(7)).toBe(1);
  expect(houseWeight(10)).toBe(1);
  expect(houseWeight(2)).toBe(.8);
  expect(houseWeight(3)).toBe(.6);
 });
 it("retains the 5° gate and fixed four-step degree weights with wraparound",()=>{
  expect(degreeWeight(0)).toBe(1);
  expect(degreeWeight(1.9)).toBe(.8);
  expect(degreeWeight(2.7)).toBe(.6);
  expect(degreeWeight(4.5)).toBe(.4);
  expect(degreeWeight(5.00001)).toBe(0);
  expect(relationship(359,1)).toMatchObject({angle:0,orb:2,degreeWeight:.8});
  expect(relationship(0,6)).toBeNull();
 });
 it("caps every body to a SINGLE degree-strength contribution regardless of dozens of reference matches",()=>{
  const audit=calculateHouseStrengthAudit([{planet:"Mars",house:1,longitude:5},{planet:"Venus",house:7,longitude:5},{planet:"Moon",house:3,longitude:6}]);
  expect(audit.planetEvidence).toHaveLength(3);
  expect(audit.planetEvidence.every(x=>x.weightedContribution<=1)).toBe(true);
  expect(audit.scoreA).toBeLessThanOrEqual(2);
  expect(audit.scoreB).toBeLessThanOrEqual(1);
  expect(audit.planetEvidence.find(x=>x.planet==="Mars")?.chosenContact?.kind).toBe("planet");
 });
 it("uses the same source house/coordinates but independent God and Agent family assignments",()=>{
  const god=calculateHouseStrengthAudit([{planet:"Sun",house:1,longitude:10},{planet:"Moon",house:7,longitude:190}]);
  const agent=calculateHouseStrengthAudit([{planet:"Sun",house:7,longitude:10},{planet:"Moon",house:1,longitude:190}]);
  expect(god.planetEvidence[0].family).toBe("A");
  expect(agent.planetEvidence[0].family).toBe("B");
  expect(god.planetEvidence[0].longitude).toBe(agent.planetEvidence[0].longitude);
 });
 it("rejects unusable house positions without inventing replacements",()=>{
  const audit=calculateHouseStrengthAudit([{planet:"Sun",house:0,longitude:10},{planet:"Moon",house:12,longitude:33}]);
  expect(audit.excluded).toHaveLength(1);
  expect(audit.planetEvidence).toHaveLength(1);
  expect(audit.houseTotals).toHaveLength(12);
  expect(audit.status).toBe("experimental-read-only");
 });
 it("carries precisely 28 mansion, 27 Nakshatra and 36 decan degree locations in the recorded evidence",()=>{
  const audit=calculateHouseStrengthAudit([{planet:"Moon",house:1,longitude:359.9}]);
  const row=audit.planetEvidence[0];
  expect(row.manzil.index).toBe(28);
  expect(row.nakshatra.index).toBe(27);
  expect(row.decan.index).toBe(36);
 });
});
