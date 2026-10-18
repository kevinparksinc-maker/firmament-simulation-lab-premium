/**
 * Inspectable degree-based North Indian chart evidence.
 * Positions are evaluated on the source coordinate frame; labels do not
 * determine which house the prediction engine assigns to a planet.
 * Mansion/decan center contacts are geometric reference correspondences,
 * NOT claims that those divisions are physical bodies or classical graha drishti.
 */
export const ARABIC_MANZILS = [
 "Al-Sharatain","Al-Butain","Al-Thurayya","Al-Dabaran","Al-Haqa","Al-Hana",
 "Al-Dhira","Al-Nathra","Al-Tarf","Al-Jabhah","Al-Zubrah","Al-Sarfah",
 "Al-Awwa","Al-Simak","Al-Ghafr","Al-Zubana","Al-Iklil","Al-Qalb",
 "Al-Shaulah","Al-Na'amah","Al-Baldah","Sa'd al-Dhabih","Sa'd Bula",
 "Sa'd al-Su'ud","Sa'd al-Akhbiyah","Al-Fargh al-Muqaddam","Al-Fargh al-Mu'akhkhar","Batn al-Hut",
] as const;
export const NAKSHATRAS = [
 "Ashwini","Bharani","Krittika","Rohini","Mrigashira","Ardra","Punarvasu","Pushya","Ashlesha",
 "Magha","Purva Phalguni","Uttara Phalguni","Hasta","Chitra","Swati","Vishakha","Anuradha","Jyeshtha",
 "Mula","Purva Ashadha","Uttara Ashadha","Shravana","Dhanishta","Shatabhisha","Purva Bhadrapada","Uttara Bhadrapada","Revati",
] as const;
const ANGLES=[0,30,45,60,72,90,108,120,135,144,150,180] as const;
const ASPECT_NAMES:Record<number,string>={0:"conjunction",30:"semisextile",45:"semisquare",60:"sextile",72:"quintile",90:"square",108:"triquintile",120:"trine",135:"sesquiquadrate",144:"biquintile",150:"quincunx",180:"opposition"};
export const normalizeDegree=(value:number)=>((value%360)+360)%360;
export const angularSeparation=(a:number,b:number)=>{
 const distance=Math.abs(normalizeDegree(a)-normalizeDegree(b));
 return Math.min(distance,360-distance);
};
export const HOUSE_FAMILY_ASC=[1,2,3,6,10,11] as const;
export const HOUSE_FAMILY_DSC=[4,5,7,8,9,12] as const;
export type DegreeBody={planet:string;house:number;longitude:number};
export type DegreeDivision={index:number;name:string;start:number;end:number;center:number;offset:number};
export type DegreeContact={source:string;target:string;targetKind:"planet"|"Arabic Manzil center"|"Nakshatra center"|"decan center";angle:number;aspect:string;orb:number;strengthPercent:100|80|60|40;sourceHouse:number;targetHouse?:number;sourceLongitude:number;targetLongitude:number};
export function division(longitude:number,kind:"manzil"|"nakshatra"|"decan"):DegreeDivision {
 const degree=normalizeDegree(longitude);
 const length=kind==="manzil"?360/28:kind==="nakshatra"?360/27:10;
 const index=Math.min(Math.round(360/length)-1,Math.floor(degree/length));
 const start=index*length;
 const name=kind==="manzil"?ARABIC_MANZILS[index]:kind==="nakshatra"?NAKSHATRAS[index]:`Decan ${index%3+1} · sign ${Math.floor(index/3)+1}`;
 return {index:index+1,name,start,end:start+length,center:start+length/2,offset:degree-start};
}
export function aspectBetween(a:number,b:number) {
 if(!Number.isFinite(a)||!Number.isFinite(b))return null;
 const d=angularSeparation(a,b);
 const near=ANGLES.map(angle=>({angle,orb:Math.abs(d-angle)})).sort((a,b)=>a.orb-b.orb)[0];
 if(near.orb>5)return null;
 const strengthPercent:100|80|60|40=near.orb<=1?100:near.orb<=2?80:near.orb<=3?60:40;
 return {angle:near.angle,aspect:ASPECT_NAMES[near.angle],orb:Number(near.orb.toFixed(3)),strengthPercent};
}
export function buildNorthIndianDegreeEvidence(bodies:DegreeBody[]){
 const valid=bodies.filter(b=>Number.isFinite(b.longitude)&&Number.isInteger(b.house)&&b.house>=1&&b.house<=12);
 const placements=valid.map(b=>({...b,longitude:normalizeDegree(b.longitude),manzil:division(b.longitude,"manzil"),nakshatra:division(b.longitude,"nakshatra"),decan:division(b.longitude,"decan"),houseFamily:HOUSE_FAMILY_ASC.includes(b.house as any)?"ASC" as const:"DSC" as const}));
 const contacts:DegreeContact[]=[];
 const centers={
  manzil:ARABIC_MANZILS.map((name,i)=>({name,longitude:(i+.5)*360/28})),
  nakshatra:NAKSHATRAS.map((name,i)=>({name,longitude:(i+.5)*360/27})),
  decan:Array.from({length:36},(_,i)=>({name:`Decan ${i%3+1} · sign ${Math.floor(i/3)+1}`,longitude:i*10+5})),
 };
 for(let i=0;i<placements.length;i++){
  const first=placements[i];
  // Each planet evaluated against every other planet once, never twice.
  for(let j=i+1;j<placements.length;j++){
   const second=placements[j];const a=aspectBetween(first.longitude,second.longitude);
   if(a)contacts.push({source:first.planet,target:second.planet,targetKind:"planet",...a,sourceHouse:first.house,targetHouse:second.house,sourceLongitude:first.longitude,targetLongitude:second.longitude});
  }
  // Same 5° aspect gate for every reference center. The center is a point,
  // not the whole mansion/decan area; explicit name prevents conflation.
  for(const [key,kind] of [["manzil","Arabic Manzil center"],["nakshatra","Nakshatra center"],["decan","decan center"]] as const){
   for(const target of centers[key]){
    const a=aspectBetween(first.longitude,target.longitude);
    if(a)contacts.push({source:first.planet,target:target.name,targetKind:kind,...a,sourceHouse:first.house,sourceLongitude:first.longitude,targetLongitude:target.longitude});
   }
  }
 }
 return {placements,contacts,orb:5,weightConvention:"100/80/60/40 by distance inside 5°",houseFamilies:{asc:HOUSE_FAMILY_ASC,dsc:HOUSE_FAMILY_DSC}};
}
