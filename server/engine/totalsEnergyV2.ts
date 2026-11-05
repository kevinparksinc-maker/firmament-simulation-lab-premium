/** Experimental totals research. No market wager or predicted probability is implied. */
export const TOTALS_ENERGY_WEIGHTS = { Sun:5, Moon:5, Mercury:4, Venus:3, Mars:5, Jupiter:5, Saturn:5, Uranus:5, Neptune:4, Pluto:5 } as const;
export const TOTALS_ENERGY_ASPECTS = [
  { name:"conjunction", angle:0, weight:5, polarity:"harmony" },
  { name:"trine", angle:120, weight:5, polarity:"harmony" },
  { name:"sextile", angle:60, weight:3, polarity:"harmony" },
  { name:"quintile", angle:72, weight:2, polarity:"harmony" },
  { name:"opposition", angle:180, weight:5, polarity:"friction" },
  { name:"square", angle:90, weight:5, polarity:"friction" },
  { name:"quincunx", angle:150, weight:3, polarity:"friction" },
  { name:"semisquare", angle:45, weight:2, polarity:"friction" },
] as const;
export type TotalsEnergyBody = { name:keyof typeof TOTALS_ENERGY_WEIGHTS; longitude:number; godHouse?:number; agentHouse?:number };
export type TotalsEnergyInput = {
  eventId:string; startTime:string; referenceFrame:"firmament-aldebaran-15-taurus";
  source:string; baseline:TotalsEnergyBody[]; event:TotalsEnergyBody[];
  sportsbookTotal?:number; finalTotal?:number; marketRecordedAt?:string;
};
const separation=(a:number,b:number)=>{const d=((a-b)%360+360)%360;return Math.min(d,360-d);};
const intensity=(orb:number)=>Math.max(1,6-Math.ceil(orb));
function validate(bodies:TotalsEnergyBody[],label:string){
  const names=new Set<string>();
  if(bodies.length!==10) throw new Error(label+" must have exactly ten planets");
  for(const body of bodies){
    if(!(body.name in TOTALS_ENERGY_WEIGHTS)||names.has(body.name)||!Number.isFinite(body.longitude)||body.longitude<0||body.longitude>=360)throw new Error("Invalid "+label+" planet or longitude");
    names.add(body.name);
    for(const h of [body.godHouse,body.agentHouse])if(h!==undefined&&(!Number.isInteger(h)||h<1||h>12))throw new Error("Invalid house");
  }
}
export function calculateTotalsEnergyV2(input:TotalsEnergyInput){
  if(!input.eventId||!input.source||!Number.isFinite(Date.parse(input.startTime)))throw new Error("Missing event provenance");
  if(input.referenceFrame!=="firmament-aldebaran-15-taurus")throw new Error("Canonical chart frame required");
  if(input.sportsbookTotal!==undefined&&(!Number.isFinite(input.sportsbookTotal)||input.sportsbookTotal<0))throw new Error("Invalid sportsbook total");
  if(input.finalTotal!==undefined&&(!Number.isFinite(input.finalTotal)||input.finalTotal<0))throw new Error("Invalid final total");
  if(input.marketRecordedAt!==undefined&&(!Number.isFinite(Date.parse(input.marketRecordedAt))||Date.parse(input.marketRecordedAt)>Date.parse(input.startTime)))throw new Error("Market line must predate game");
  validate(input.baseline,"baseline");validate(input.event,"event");
  const contacts: Array<{baseline:string;event:string;aspect:string;polarity:"harmony"|"friction";orb:number;intensity:number;score:number;baselineGodHouse?:number;eventGodHouse?:number;baselineAgentHouse?:number;eventAgentHouse?:number}>=[];
  for(const a of input.baseline)for(const e of input.event){
    const distance=separation(a.longitude,e.longitude);
    for(const aspect of TOTALS_ENERGY_ASPECTS){
      const orb=Math.abs(distance-aspect.angle);
      if(orb>5)continue;
      contacts.push({baseline:a.name,event:e.name,aspect:aspect.name,polarity:aspect.polarity,orb,intensity:intensity(orb),score:TOTALS_ENERGY_WEIGHTS[a.name]+TOTALS_ENERGY_WEIGHTS[e.name]+aspect.weight+intensity(orb),baselineGodHouse:a.godHouse,eventGodHouse:e.godHouse,baselineAgentHouse:a.agentHouse,eventAgentHouse:e.agentHouse});
      break;
    }
  }
  contacts.sort((a,b)=>b.score-a.score||a.orb-b.orb||a.baseline.localeCompare(b.baseline)||a.event.localeCompare(b.event));
  const harmony=contacts.filter(c=>c.polarity==="harmony").reduce((n,c)=>n+c.score,0);
  const friction=contacts.filter(c=>c.polarity==="friction").reduce((n,c)=>n+c.score,0);
  const total=harmony+friction;
  const signal=total===0?"no-contacts":harmony===friction?"mixed":harmony>friction?"over-hypothesis":"under-hypothesis";
  const observed=input.sportsbookTotal===undefined||input.finalTotal===undefined?undefined:input.finalTotal>input.sportsbookTotal?"over":input.finalTotal<input.sportsbookTotal?"under":"push";
  return {eventId:input.eventId,referenceFrame:input.referenceFrame,source:input.source,experimental:true,modelVersion:"totals-energy-v2-experimental-1",baselineDefinition:"caller-supplied; must be fixed before event",contacts,harmony,friction,total,harmonyPercent:total?100*harmony/total:null,frictionPercent:total?100*friction/total:null,signal,observed,sportsbookTotal:input.sportsbookTotal,finalTotal:input.finalTotal,marketRecordedAt:input.marketRecordedAt,validatedPrediction:false};
}
