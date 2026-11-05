import {chartSide,completeChartLedger,type ChartBody} from "./completeChartLedger";
export type FamilyAudit = {
  sides:{A:{houses:number[];occupants:string[];houseRulers:string[]};B:{houses:number[];occupants:string[];houseRulers:string[]}};
  chartBodyCount:number;
  aspectCount:number;
  crossFamilyContacts:number;
  evidence:string[];
};
const SIGNS=["Aries","Taurus","Gemini","Cancer","Leo","Virgo","Libra","Scorpio","Sagittarius","Capricorn","Aquarius","Pisces"];
const RULERS=["Mars","Venus","Mercury","Moon","Sun","Mercury","Venus","Mars","Jupiter","Saturn","Saturn","Jupiter"];
const normalize=(value:number)=>((value%360)+360)%360;
export function buildFamilyAudit(planets:ChartBody[],ascendantLongitude:number,mode:"god"|"agent"):FamilyAudit{
 if(!Number.isFinite(ascendantLongitude))throw new Error("Family audit requires finite ascendant");
 const ledger=completeChartLedger(planets);
 if(ledger.houses.length!==12||new Set(ledger.houses.map(h=>h.house)).size!==12)throw new Error("Family audit requires twelve unique houses");
 if(planets.length===0)throw new Error("Family audit requires planetary positions");
 for(const p of planets){
  if(!Number.isFinite(p.longitude)||p.house<1||p.house>12||!Number.isInteger(p.house))throw new Error("Invalid chart position for "+p.planet);
  if(!p.nakshatra||!p.manzil?.name)throw new Error("Missing lunar mansion evidence for "+p.planet);
 }
 const lord=(house:number)=>{
  const longitude=normalize((mode==="god"?0:ascendantLongitude)+(house-1)*30);
  return RULERS[Math.floor(longitude/30)]!;
 };
 const side=(key:"A"|"B")=>{
  const houses=ledger.houses.filter(h=>h.side===key);
  return {houses:houses.map(h=>h.house),occupants:houses.flatMap(h=>h.occupants),houseRulers:houses.map(h=>lord(h.house))};
 };
 const evidence=ledger.bodies.map(p=>`${p.planet}: H${p.house} ${p.side}; ${p.sign} ${p.longitude.toFixed(3)}°, Nakshatra ${p.nakshatra}, Manzil ${p.manzil}, decan ${p.decan}`);
 evidence.push(...ledger.aspects.map(a=>`${a.left} H${a.leftHouse}(${a.leftSide})/${a.right} H${a.rightHouse}(${a.rightSide}): ${a.kind} orb ${a.orb}°; ${a.crossSide?"cross-family":"within-family"}`));
 return {sides:{A:side("A"),B:side("B")},chartBodyCount:ledger.bodies.length,aspectCount:ledger.aspects.length,crossFamilyContacts:ledger.aspects.filter(a=>a.crossSide).length,evidence};
}
export function attachFamilyAudit<T extends {calculation?:{formula:string;inputs:string[];steps:string[]};detail:string}>(layer:T,audit:FamilyAudit):T{
 const calculation=layer.calculation??{formula:"No explicit scoring calculation",inputs:[],steps:[]};
 return {...layer,calculation:{...calculation,inputs:[...calculation.inputs,...audit.evidence.map(x=>"FAMILY EVIDENCE (not additional score): "+x)],steps:[...calculation.steps,`Collective coverage: A houses ${audit.sides.A.houses.join(",")}; B houses ${audit.sides.B.houses.join(",")}; ${audit.chartBodyCount} bodies; ${audit.aspectCount} qualifying aspects including ${audit.crossFamilyContacts} cross-family`]}} as T;
}
