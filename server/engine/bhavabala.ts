/**
 * Bhavabala (house strength) component aggregation, in virupas.
 * Inputs MUST come from separately verified classical calculations.
 * This does not invent missing house-lord, directional or aspect scores.
 */
export type BhavabalaComponents = {
  bhavadhipati: number; // strength of house lord (derived from validated Shadbala)
  bhavadig: number; // directional house strength
  bhavadrishti: number; // signed planetary aspect influence on house
};
export type BhavabalaHouseInput = {
  house: number; cuspLongitude: number;
  components: BhavabalaComponents;
  sourceByComponent: Record<keyof BhavabalaComponents,string>;
};
export type BhavabalaChartInput = {
  frame:"firmament-aldebaran-15-taurus"; view:"agent"|"god";
  eventTime:string; ascendantLongitude:number;
  houses: BhavabalaHouseInput[];
};
const keys=["bhavadhipati","bhavadig","bhavadrishti"] as const;
const normalize=(x:number)=>((x%360)+360)%360;
export function calculateBhavabala(input:BhavabalaChartInput){
  if(input.frame!=="firmament-aldebaran-15-taurus"||!["agent","god"].includes(input.view)||!Number.isFinite(Date.parse(input.eventTime)))throw Error("Invalid Bhavabala chart provenance");
  if(!Number.isFinite(input.ascendantLongitude))throw Error("Invalid ascendant longitude");
  if(input.houses.length!==12||new Set(input.houses.map(h=>h.house)).size!==12)throw Error("Exactly 12 distinct houses required");
  const houses=input.houses.map(h=>{
    if(!Number.isInteger(h.house)||h.house<1||h.house>12)throw Error("Invalid house index");
    const expected=normalize(input.ascendantLongitude+(h.house-1)*30);
    if(!Number.isFinite(h.cuspLongitude)||Math.abs(((normalize(h.cuspLongitude)-expected+540)%360)-180)>1e-7)throw Error("House cusp inconsistent with zodiac-forward Equal Houses");
    for(const key of keys){
      if(!Number.isFinite(h.components[key]))throw Error("Missing or invalid "+key+" for house "+h.house);
      if(!h.sourceByComponent[key]?.trim())throw Error("Missing provenance for "+key+" house "+h.house);
    }
    const totalVirupas=keys.reduce((sum,k)=>sum+h.components[k],0);
    return {house:h.house,cuspLongitude:expected,components:{...h.components},
      sourceByComponent:{...h.sourceByComponent},totalVirupas,totalRupas:totalVirupas/60,
      scoringEligible:false,status:"component-inputs-require-doctrinal-verification" as const};
  }).sort((a,b)=>a.house-b.house);
  return {frame:input.frame,view:input.view,eventTime:input.eventTime,
    ascendantLongitude:normalize(input.ascendantLongitude),houses,
    status:"research-only" as const};
}
