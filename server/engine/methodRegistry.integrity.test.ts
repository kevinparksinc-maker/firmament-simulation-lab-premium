import { describe, expect, it } from "vitest";
import { METHOD_REGISTRY, getMethodSpec, runMethod } from "./methodRegistry";
describe("method doctrine registry integrity", () => {
 it("has unique method IDs and declared versions", () => {
  expect(new Set(METHOD_REGISTRY.map(x=>x.id)).size).toBe(METHOD_REGISTRY.length);
  expect(METHOD_REGISTRY.every(x=>x.version.length>0)).toBe(true);
 });
 it("keeps Chinese mansion J2000 research evidence-only", () => {
  const m=getMethodSpec("CHINESE_28_XIU_STELLAR_RA_V1");
  expect(m?.mode).toBe("EVIDENCE_ONLY");
  expect(m?.configuration.frame).toBe("ICRS_J2000");
 });
 it("requires natal context for natal Vimshottari", () => {
  const method=getMethodSpec("NATAL_VIMSHOTTARI_V1");
  expect(method?.requiredInputs).toContain("natalContext");
  const result=runMethod("NATAL_VIMSHOTTARI_V1",{prediction:{} as never,eventTime:new Date("2026-01-01T00:00:00Z")});
  expect(result.evaluable).toBe(false);
  expect(result.scoreA).toBeNull();
 });
 it("rejects an invalid event timestamp before invoking method calculations",()=>{
  expect(()=>runMethod("HARMONICS_V2",{prediction:{} as never,eventTime:new Date("invalid")})).toThrow(/Invalid method event time/);
 });
});
