/** Fail-closed parity gate for The Absolute's canonical chart contract. */
export const ABSOLUTE_FRAME = 'firmament-aldebaran-15-taurus' as const;
export const ABSOLUTE_SIDEREAL_MODE = 14 as const;
export const ASC_SIDE_HOUSES = [1,2,3,6,10,11] as const;
export const DESC_SIDE_HOUSES = [4,5,7,8,9,12] as const;
export function normalizeAbsoluteLongitude(value:number):number {if(!Number.isFinite(value))throw new Error('Nonfinite longitude');return ((value%360)+360)%360;}
export function absoluteEqualHouse(longitude:number,ascendant:number):number {return 1+Math.floor(normalizeAbsoluteLongitude(longitude-ascendant)/30);}
export function absoluteGodHouse(longitude:number):number {return 1+Math.floor(normalizeAbsoluteLongitude(longitude)/30);}
export function absoluteHouseCusps(ascendant:number):number[] {return Array.from({length:12},(_,i)=>normalizeAbsoluteLongitude(ascendant+i*30));}
export function absoluteZeroTiltAngles(thetaCanonical:number){const midheaven=normalizeAbsoluteLongitude(thetaCanonical);const ascendant=normalizeAbsoluteLongitude(midheaven+90);return {ascendant,descendant:normalizeAbsoluteLongitude(ascendant+180),midheaven};}
export function absoluteTeamSide(house:number):'asc'|'desc' {if(!Number.isInteger(house)||house<1||house>12)throw Error('Invalid house');return (ASC_SIDE_HOUSES as readonly number[]).includes(house)?'asc':'desc';}
export type AbsoluteSnapshot = {referenceFrame:string;siderealMode:number;timestampUtc:string;latitude:number;longitude:number;ascendant:number;planetLongitudes:Record<string,number>;sourceVersion:string};
export function assertAbsoluteSnapshot(snapshot:AbsoluteSnapshot):AbsoluteSnapshot {if(snapshot.referenceFrame!==ABSOLUTE_FRAME||snapshot.siderealMode!==ABSOLUTE_SIDEREAL_MODE)throw Error('Simulation Lab requires Guardian Aldebaran mode-14 snapshot');if(!Number.isFinite(Date.parse(snapshot.timestampUtc))||!Number.isFinite(snapshot.latitude)||Math.abs(snapshot.latitude)>90||!Number.isFinite(snapshot.longitude)||Math.abs(snapshot.longitude)>180||!snapshot.sourceVersion)throw Error('Incomplete canonical snapshot metadata');normalizeAbsoluteLongitude(snapshot.ascendant);for(const [planet,longitude] of Object.entries(snapshot.planetLongitudes)){if(!planet||!Number.isFinite(longitude)||longitude<0||longitude>=360)throw Error('Invalid canonical planet '+planet);}for(const required of ['Sun','Moon','Mercury','Venus','Mars','Jupiter','Saturn','Uranus','Neptune','Pluto'])if(!(required in snapshot.planetLongitudes))throw Error('Missing canonical planet '+required);return snapshot;}
