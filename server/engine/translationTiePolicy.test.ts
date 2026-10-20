import { describe,it,expect } from "vitest";
import { chooseTranslationSide } from "./fullPackageDualFrameChallenger";
describe("translation distance comparison has no directional tie bias",()=>{
 it("returns no winner for exact and floating-point-equivalent distances",()=>{
  expect(chooseTranslationSide(60,60)).toBe("TIE");
  expect(chooseTranslationSide(60,60+1e-12)).toBe("TIE");
 });
 it("awards strictly closer contacts to either family symmetrically",()=>{
  expect(chooseTranslationSide(59,60)).toBe("A");
  expect(chooseTranslationSide(60,59)).toBe("B");
 });
 it("fails closed on invalid input",()=>{
  expect(()=>chooseTranslationSide(Number.NaN,60)).toThrow();
 });
});
