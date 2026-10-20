export type ChartBody={planet:string;longitude:number;house:number;sign:string;degreeInSign?:number;nakshatra:string;manzil?:{name:string}};
export const TEAM_A_HOUSES=[1,2,3,6,10,11] as const;
export const TEAM_B_HOUSES=[4,5,7,8,9,12] as const;
export function chartSide(house:number):"A"|"B" {if(TEAM_A_HOUSES.includes(house as never))return "A";if(TEAM_B_HOUSES.includes(house as never))return "B";throw new Error("Invalid competitive house "+house)}
const normalize=(v:number)=>((v%360)+360)%360;
export function completeChartLedger(planets:ChartBody[]){
 const houses=Array.from({length:12},(_,i)=>({house:i+1,side:chartSide(i+1),occupants:planets.filter(p=>p.house===i+1).map(p=>p.planet)}));
 const bodies=planets.map(p=>({planet:p.planet,house:p.house,side:chartSide(p.house),longitude:p.longitude,sign:p.sign,nakshatra:p.nakshatra,manzil:p.manzil?.name??null,decan:Math.min(3,Math.max(1,Math.floor((p.degreeInSign ?? normalize(p.longitude)%30)/10)+1))}));
 const targets=[{name:"conjunction",angle:0},{name:"sextile",angle:60},{name:"square",angle:90},{name:"trine",angle:120},{name:"opposition",angle:180}];
 const aspects: Array<{left:string;right:string;leftHouse:number;rightHouse:number;leftSide:"A"|"B";rightSide:"A"|"B";kind:string;orb:number;crossSide:boolean}>=[];
 for(let i=0;i<planets.length;i++)for(let j=i+1;j<planets.length;j++){
  const p=planets[i]!,q=planets[j]!,diff=Math.abs(normalize(p.longitude)-normalize(q.longitude)),distance=Math.min(diff,360-diff);
  const match=targets.map(t=>({...t,orb:Math.abs(distance-t.angle)})).sort((a,b)=>a.orb-b.orb)[0]!;
  if(match.orb>5)continue;
  aspects.push({left:p.planet,right:q.planet,leftHouse:p.house,rightHouse:q.house,leftSide:chartSide(p.house),rightSide:chartSide(q.house),kind:match.name,orb:Number(match.orb.toFixed(3)),crossSide:chartSide(p.house)!==chartSide(q.house)});
 }
 return {houses,bodies,aspects};
}
