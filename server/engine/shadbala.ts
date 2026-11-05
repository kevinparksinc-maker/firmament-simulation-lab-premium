/** Classical seven-planet Shadbala research core. All six bala components must be
 * supplied by separately verified astronomical/doctrinal calculators.
 * This module does not fabricate absent components or claim classical completeness.
 */
export const SHADBALA_PLANETS = ["Sun","Moon","Mars","Mercury","Jupiter","Venus","Saturn"] as const;
export type ShadbalaPlanet = typeof SHADBALA_PLANETS[number];
export const REQUIRED_VIRUPAS: Record<ShadbalaPlanet,number> = {
 Sun:390, Moon:360, Mars:300, Mercury:420, Jupiter:390, Venus:330, Saturn:300
};
export type SixfoldComponents = {
 sthana:number; dig:number; kala:number; cheshta:number; naisargika:number; drik:number;
};
export type ShadbalaInput = {
 planet:ShadbalaPlanet; components:SixfoldComponents;
 frame:"firmament-aldebaran-15-taurus"; view:"god"|"agent";
 eventTime:string; calculationSources:Record<keyof SixfoldComponents,string>;
};
const COMPONENT_NAMES=["sthana","dig","kala","cheshta","naisargika","drik"] as const;
export function calculateShadbala(input:ShadbalaInput){
 if(!SHADBALA_PLANETS.includes(input.planet))throw new Error("Classical Shadbala supports seven planets only");
 if(input.frame!=="firmament-aldebaran-15-taurus"||!["god","agent"].includes(input.view)||!Number.isFinite(Date.parse(input.eventTime)))throw new Error("Invalid Shadbala chart provenance");
 for(const name of COMPONENT_NAMES){
  if(!Number.isFinite(input.components[name]))throw new Error("Missing or invalid "+name+" bala");
  if(!input.calculationSources[name]?.trim())throw new Error("Missing doctrine provenance for "+name);
 }
 // Drik Bala can be negative; do not clamp signed aspectual influence.
 const totalVirupas=COMPONENT_NAMES.reduce((sum,name)=>sum+input.components[name],0);
 const requiredVirupas=REQUIRED_VIRUPAS[input.planet];
 return {planet:input.planet,view:input.view,frame:input.frame,eventTime:input.eventTime,
  components:{...input.components},calculationSources:{...input.calculationSources},
  totalVirupas,totalRupas:totalVirupas/60,requiredVirupas,
  strengthRatio:totalVirupas/requiredVirupas,meetsTraditionalMinimum:totalVirupas>=requiredVirupas,
  favorableToTeam:null,scoringEligible:false,
  status:"component-inputs-require-doctrinal-verification" as const};
}
export function calculateShadbalaDualView(god:ShadbalaInput,agent:ShadbalaInput){
 if(god.view!=="god"||agent.view!=="agent"||god.planet!==agent.planet||god.eventTime!==agent.eventTime)
  throw new Error("Mismatched Shadbala dual-view input");
 return {god:calculateShadbala(god),agent:calculateShadbala(agent)};
}
