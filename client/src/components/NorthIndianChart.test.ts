import { describe, expect, it } from "vitest";
import { NORTH_INDIAN_CELLS, equalHouseFor, signAtLongitude } from "./NorthIndianChart";

describe("North Indian fixed-house chart correspondence",()=>{
 it("places house 1 above 7, house 2 upper-left and house 10 right",()=>{
   const h=(n:number)=>NORTH_INDIAN_CELLS[n-1];
   expect(h(1).x).toBe(h(7).x);
   expect(h(1).y).toBeLessThan(h(7).y);
   expect(h(2).x).toBeLessThan(h(1).x);
   expect(h(2).y).toBeLessThan(h(1).y);
   expect(h(4).x).toBeLessThan(h(1).x);
   expect(h(4).y).toBe(h(10).y);
   expect(h(10).x).toBeGreaterThan(h(7).x);
   expect(h(12).x).toBeGreaterThan(h(1).x);
 });
 it("retains fixed God View Aries H1 and Libra H7",()=>{
   expect(signAtLongitude(0)).toBe(1);
   expect(signAtLongitude(180)).toBe(7);
   expect(equalHouseFor(0,0)).toBe(1);
   expect(equalHouseFor(180,0)).toBe(7);
 });
 it("agent houses track the exact rising longitude without rotating house geometry",()=>{
   const anchor=201.7;
   expect(equalHouseFor(anchor,anchor)).toBe(1);
   expect(equalHouseFor(anchor+30,anchor)).toBe(2);
   expect(equalHouseFor(anchor+180,anchor)).toBe(7);
   expect(equalHouseFor(anchor+330,anchor)).toBe(12);
   expect(signAtLongitude(anchor)).toBe(7);
   expect(NORTH_INDIAN_CELLS[0]).toEqual({x:200,y:103});
 });
 it("supports wraparound across 359 to 0 and does not reverse house numbers",()=>{
   expect(equalHouseFor(2,332)).toBe(2);
   expect(equalHouseFor(180,0)).toBe(7);
   expect(signAtLongitude(360)).toBe(1);
 });
});
