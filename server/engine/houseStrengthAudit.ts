/**
 * Experimental, auditable North Indian house strength layer.
 *
 * The actual engine house (not drawn coordinates) determines family allegiance.
 * Angular / succedent / cadent factors are an explicit research hypothesis,
 * NOT a universal traditional rule or a historically validated sports model.
 * Each body can contribute at most ONE capped evidence unit across ALL
 * degree contacts. This avoids stacking its planet, manzil, nakshatra, and decan
 * correlations into four independent votes for the same body.
 *
 * Analysis ONLY: never mutate foundation, addedLayers, baseline or synthesis.
 */
import { ARABIC_LUNAR_MANSIONS, MANZIL_ARC_DEGREES, NAKSHATRAS, NAKSHATRA_ARC_DEGREES } from "./firmamentEngine";

export const HOUSE_STRENGTH_PROFILE = "angular-100-succedent-80-cadent-60-v1" as const;
export const DEGREE_STRENGTH_PROFILE = "orb-100-80-60-40-v1" as const;
const SIDE_A = new Set([1, 2, 3, 6, 10, 11]);
const SIDE_B = new Set([4, 5, 7, 8, 9, 12]);
const ANGULAR = new Set([1, 4, 7, 10]);
const SUCCEDENT = new Set([2, 5, 8, 11]);
const ANGLES = [0, 30, 45, 60, 72, 90, 108, 120, 135, 144, 150, 180] as const;
const SIGN_NAMES = ["Aries","Taurus","Gemini","Cancer","Leo","Virgo","Libra","Scorpio","Sagittarius","Capricorn","Aquarius","Pisces"];
export type HouseStrengthBody = { planet: string; house: number; longitude: number };
export type ContactKind = "planet" | "manzil-center" | "nakshatra-center" | "decan-center";
export type HouseStrengthContact = {
  target: string; kind: ContactKind; targetLongitude: number;
  angle: number; orb: number; degreeWeight: number;
};
export type PlanetHouseStrength = {
  planet: string; house: number; longitude: number;
  family: "A"|"B"; class: "angular"|"succedent"|"cadent";
  houseWeight: number; chosenContact: HouseStrengthContact|null;
  degreeWeight: number; weightedContribution: number;
  manzil: {index:number; name:string; degreeInto:number};
  nakshatra: {index:number; name:string; degreeInto:number};
  decan: {index:number; name:string; sign:string; degreeInto:number};
};
export type HouseStrengthAudit = {
  status: "experimental-read-only";
  convention: {houseProfile:typeof HOUSE_STRENGTH_PROFILE; degreeProfile:typeof DEGREE_STRENGTH_PROFILE; maxOrb:number; maxContributionPerPlanet:number; coordinateRule:string; antiDoubleCount:string; limitations:string[]};
  houseTotals: Array<{house:number; family:"A"|"B"; class:"angular"|"succedent"|"cadent"; weight:number; score:number; planets:string[]}>;
  planetEvidence:PlanetHouseStrength[];
  scoreA:number; scoreB:number; differential:number; hypotheticalLeader:"A"|"B"|"TIE";
  excluded: Array<{planet:string;reason:string}>;
};
const normalize=(v:number)=>(v%360+360)%360;
const round=(v:number)=>Number(v.toFixed(4));
export function houseWeight(house:number){
  if (!Number.isInteger(house)||house<1||house>12) throw new Error("Invalid house: "+house);
  return ANGULAR.has(house)?1:SUCCEDENT.has(house)?.8:.6;
}
export const sideOfHouse=(house:number):"A"|"B"=> {
  if(SIDE_A.has(house))return "A";
  if(SIDE_B.has(house))return "B";
  throw new Error("Invalid house: "+house);
};
export function degreeWeight(orb:number):number{
  if(!Number.isFinite(orb)||orb<0||orb>5)return 0;
  return orb<=1?1:orb<=2?.8:orb<=3?.6:.4;
}
const separation=(a:number,b:number)=>{const diff=Math.abs(normalize(a)-normalize(b));return Math.min(diff,360-diff)};
export function relationship(longitude:number,other:number){
  if(!Number.isFinite(longitude)||!Number.isFinite(other))return null;
  const d=separation(longitude,other);
  const target=ANGLES.map(angle=>({angle,orb:Math.abs(angle-d)})).sort((a,b)=>a.orb-b.orb)[0];
  return target.orb<=5?{angle:target.angle,orb:round(target.orb),degreeWeight:degreeWeight(target.orb)}:null;
}
function division(longitude:number,length:number,names:readonly string[]){
  const normal=normalize(longitude);
  const index=Math.min(names.length-1,Math.floor(normal/length));
  return {index:index+1,name:names[index],degreeInto:round(normal-index*length)};
}
function compareContacts(a:HouseStrengthContact,b:HouseStrengthContact){
  if(a.degreeWeight!==b.degreeWeight)return b.degreeWeight-a.degreeWeight;
  if(a.orb!==b.orb)return a.orb-b.orb;
  // Prefer an actual planet over an abstract center on a tied geometry.
  const priority:Record<ContactKind,number>={planet:0,"manzil-center":1,"nakshatra-center":2,"decan-center":3};
  return priority[a.kind]-priority[b.kind]||a.target.localeCompare(b.target);
}
export function calculateHouseStrengthAudit(bodies:HouseStrengthBody[]):HouseStrengthAudit{
  const accepted=bodies.filter(x=>Number.isFinite(x.longitude)&&Number.isInteger(x.house)&&x.house>=1&&x.house<=12);
  const excluded=bodies.filter(x=>!accepted.includes(x)).map(x=>({planet:x.planet,reason:"Missing longitude or valid house 1–12"}));
  const centerTables=[
    {kind:"manzil-center" as const,points:ARABIC_LUNAR_MANSIONS.map((name,i)=>({name,longitude:(i+.5)*MANZIL_ARC_DEGREES}))},
    {kind:"nakshatra-center" as const,points:NAKSHATRAS.map((name,i)=>({name,longitude:(i+.5)*NAKSHATRA_ARC_DEGREES}))},
    {kind:"decan-center" as const,points:Array.from({length:36},(_,i)=>({name:`Decan ${i%3+1} of ${SIGN_NAMES[Math.floor(i/3)]}`,longitude:i*10+5}))},
  ];
  const planetEvidence:PlanetHouseStrength[]=accepted.map((body,index)=>{
    const longitude=normalize(body.longitude);
    const contacts:HouseStrengthContact[]=[];
    for(let j=0;j<accepted.length;j++){
      if(index===j)continue;
      const target=accepted[j];const rel=relationship(longitude,target.longitude);
      if(rel)contacts.push({target:target.planet,kind:"planet",targetLongitude:round(normalize(target.longitude)),...rel});
    }
    for(const group of centerTables)for(const center of group.points){
      const rel=relationship(longitude,center.longitude);
      if(rel)contacts.push({target:center.name,kind:group.kind,targetLongitude:round(normalize(center.longitude)),...rel});
    }
    contacts.sort(compareContacts);
    const chosenContact=contacts[0]??null;
    const hWeight=houseWeight(body.house);
    const dWeight=chosenContact?.degreeWeight??0;
    const manzil=division(longitude,MANZIL_ARC_DEGREES,ARABIC_LUNAR_MANSIONS);
    const nakshatra=division(longitude,NAKSHATRA_ARC_DEGREES,NAKSHATRAS);
    const decanIndex=Math.min(35,Math.floor(longitude/10));
    return {
      planet:body.planet,house:body.house,longitude:round(longitude),family:sideOfHouse(body.house),
      class:ANGULAR.has(body.house)?"angular" as const:SUCCEDENT.has(body.house)?"succedent" as const:"cadent" as const,
      houseWeight:hWeight,chosenContact,degreeWeight:dWeight,weightedContribution:round(hWeight*dWeight),
      manzil,nakshatra,decan:{index:decanIndex+1,name:`Decan ${decanIndex%3+1}`,sign:SIGN_NAMES[Math.floor(decanIndex/3)],degreeInto:round(longitude%10)},
    };
  });
  const houseTotals=Array.from({length:12},(_,i)=>{
    const house=i+1;const rows=planetEvidence.filter(x=>x.house===house);
    return {house,family:sideOfHouse(house),class:ANGULAR.has(house)?"angular" as const:SUCCEDENT.has(house)?"succedent" as const:"cadent" as const,
      weight:houseWeight(house),score:round(rows.reduce((sum,x)=>sum+x.weightedContribution,0)),planets:rows.map(x=>x.planet)};
  });
  const scoreA=round(houseTotals.filter(h=>h.family==="A").reduce((sum,h)=>sum+h.score,0));
  const scoreB=round(houseTotals.filter(h=>h.family==="B").reduce((sum,h)=>sum+h.score,0));
  return {
    status:"experimental-read-only",
    convention:{
      houseProfile:HOUSE_STRENGTH_PROFILE,degreeProfile:DEGREE_STRENGTH_PROFILE,maxOrb:5,maxContributionPerPlanet:1,
      coordinateRule:"One frame's own longitude and engine-calculated house per planet; house geometry never reverses.",
      antiDoubleCount:"Only the single strongest degree contact of each planet can contribute. Additional planet, manzil, nakshatra and decan contacts remain in existing method ledgers; never sum them here.",
      limitations:["Angular/succedent/cadent multipliers are a declared research hypothesis, not a universal classical weight.","Mansion/Nakshatra/decan center aspects are geometric comparisons, not classical planetary aspects.","An occupied house is not inherently a positive predictive event; this ledger measures activation, not success or winning probability.","Research-only totals do not affect the original 42-method verdict, frame syntheses or sportsbook baseline."],
    },
    houseTotals,planetEvidence,scoreA,scoreB,differential:round(scoreA-scoreB),
    hypotheticalLeader:Math.abs(scoreA-scoreB)<.0001?"TIE":scoreA>scoreB?"A":"B",
    excluded,
  };
}
