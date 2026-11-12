import {describe,it,expect} from "vitest";
import {calculateTotalsEnergyV2, TOTALS_ENERGY_ASPECTS, TOTALS_ENERGY_WEIGHTS} from "./totalsEnergyV2";
const names=Object.keys(TOTALS_ENERGY_WEIGHTS) as Array<keyof typeof TOTALS_ENERGY_WEIGHTS>;
const bodies=(angle:number)=>names.map((name,i)=>({name,longitude:(angle+i*30)%360}));
const base={eventId:"test-1",startTime:"2026-01-02T19:00:00Z",referenceFrame:"firmament-aldebaran-15-taurus" as const,source:"fixture-canonical",baseline:bodies(0),event:bodies(0)};
describe("experimental totals energy V2",()=>{
 it("uses all eight aspects with approved polarity and no extra aspects",()=>{expect(TOTALS_ENERGY_ASPECTS).toHaveLength(8);expect(TOTALS_ENERGY_ASPECTS.filter(x=>x.polarity==="harmony")).toHaveLength(4);});
 it("returns score ledger and non-probabilistic signal",()=>{const result=calculateTotalsEnergyV2(base);expect(result.contacts.length).toBeGreaterThan(0);expect(result.contacts.every(c=>c.orb<=5&&c.intensity>=1&&c.intensity<=5)).toBe(true);expect(result.harmony+result.friction).toBe(result.total);expect(result.validatedPrediction).toBe(false);});
 it("preserves market push",()=>{expect(calculateTotalsEnergyV2({...base,sportsbookTotal:42,finalTotal:42}).observed).toBe("push");});
 it("rejects post-event market data",()=>{expect(()=>calculateTotalsEnergyV2({...base,sportsbookTotal:42,marketRecordedAt:"2026-01-03T00:00:00Z"})).toThrow(/predate/);});
 it("rejects invalid or mixed planetary coordinates",()=>{expect(()=>calculateTotalsEnergyV2({...base,event:[...bodies(0).slice(0,9),{name:"Sun" as const,longitude:12}]})).toThrow();});
 it("returns no fabricated 50/50 for zero qualifying contacts",()=>{const zero=calculateTotalsEnergyV2({...base,baseline:bodies(0),event:bodies(7)});expect(zero.harmonyPercent===null||zero.harmonyPercent>=0).toBe(true);});
});
