import {describe,it,expect} from "vitest";
import {calculateShadbala,calculateShadbalaDualView,REQUIRED_VIRUPAS} from "./shadbala";
const components={sthana:150,dig:35,kala:95,cheshta:40,naisargika:17.14,drik:-10};
const calculationSources={sthana:"fixture",dig:"fixture",kala:"fixture",cheshta:"fixture",naisargika:"fixture",drik:"fixture"};
const input={planet:"Mars" as const,components,frame:"firmament-aldebaran-15-taurus" as const,view:"god" as const,eventTime:"2026-10-29T12:00:00Z",calculationSources};
describe("Shadbala sixfold aggregation",()=>{
 it("aggregates signed components and uses classical Mars threshold",()=>{const r=calculateShadbala(input);expect(r.totalVirupas).toBeCloseTo(327.14);expect(r.requiredVirupas).toBe(300);expect(r.strengthRatio).toBeCloseTo(327.14/300);expect(r.scoringEligible).toBe(false);});
 it("preserves distinct traditional thresholds",()=>{expect(REQUIRED_VIRUPAS.Mercury).toBe(420);expect(REQUIRED_VIRUPAS.Venus).toBe(330);});
 it("requires every sourced component",()=>{expect(()=>calculateShadbala({...input,calculationSources:{...calculationSources,drik:""}})).toThrow(/provenance/);});
 it("rejects missing strength inputs",()=>{expect(()=>calculateShadbala({...input,components:{...components,kala:NaN}})).toThrow(/kala/);});
 it("keeps God and Agent separately",()=>{const r=calculateShadbalaDualView(input,{...input,view:"agent"});expect(r.god.view).toBe("god");expect(r.agent.view).toBe("agent");});
});
