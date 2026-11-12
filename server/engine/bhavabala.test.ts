import {describe,it,expect} from "vitest";
import {calculateBhavabala} from "./bhavabala";
const sourceByComponent={bhavadhipati:"fixture",bhavadig:"fixture",bhavadrishti:"fixture"};
const make=(asc:number)=>({frame:"firmament-aldebaran-15-taurus" as const,view:"agent" as const,eventTime:"2026-10-29T12:00:00Z",ascendantLongitude:asc,
 houses:Array.from({length:12},(_,i)=>({house:i+1,cuspLongitude:(asc+i*30)%360,components:{bhavadhipati:100,bhavadig:30,bhavadrishti:-5},sourceByComponent}))});
describe("Bhavabala twelve-house aggregation",()=>{
 it("aggregates 12 house scores including signed aspects",()=>{const r=calculateBhavabala(make(359));expect(r.houses).toHaveLength(12);expect(r.houses[0].totalVirupas).toBe(125);expect(r.houses[1].cuspLongitude).toBe(29);expect(r.houses[0].scoringEligible).toBe(false);});
 it("rejects inconsistent cusps",()=>{const i=make(20);i.houses[1].cuspLongitude=350;expect(()=>calculateBhavabala(i)).toThrow(/cusp/);});
 it("rejects duplicate house",()=>{const i=make(20);i.houses[1].house=1;expect(()=>calculateBhavabala(i)).toThrow(/12 distinct/);});
 it("rejects missing component provenance",()=>{const i=make(20);i.houses[0].sourceByComponent={...sourceByComponent,bhavadig:""};expect(()=>calculateBhavabala(i)).toThrow(/provenance/);});
});
