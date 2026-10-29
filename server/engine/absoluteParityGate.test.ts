import {describe,it,expect} from 'vitest';
import {absoluteEqualHouse,absoluteGodHouse,absoluteHouseCusps,absoluteZeroTiltAngles,absoluteTeamSide,assertAbsoluteSnapshot} from './absoluteParityGate';
describe('Absolute parity gate',()=>{
 it('uses forward degree-precise Equal Houses, not Premium reverse labels',()=>{expect(absoluteEqualHouse(300,270)).toBe(2);expect(absoluteEqualHouse(0,270)).toBe(4);expect(absoluteEqualHouse(269.999,270)).toBe(12);expect(absoluteHouseCusps(345).slice(0,3)).toEqual([345,15,45]);});
 it('separates God and Agent houses',()=>{expect(absoluteGodHouse(215)).toBe(8);expect(absoluteEqualHouse(215,345)).toBe(8);});
 it('keeps eastern horizon, MC, DSC relationship',()=>{expect(absoluteZeroTiltAngles(269)).toEqual({ascendant:359,descendant:179,midheaven:269});});
 it('maps every house to exactly one approved team side',()=>{expect(Array.from({length:12},(_,i)=>absoluteTeamSide(i+1))).toEqual(['asc','asc','asc','desc','desc','asc','desc','desc','desc','asc','asc','desc']);});
 it('rejects incompatible chart frame instead of silently falling back',()=>{expect(()=>assertAbsoluteSnapshot({referenceFrame:'j2000',siderealMode:14,timestampUtc:'2026-01-01T00:00:00Z',latitude:0,longitude:0,ascendant:0,sourceVersion:'v1',planetLongitudes:{}})).toThrow();});
});
