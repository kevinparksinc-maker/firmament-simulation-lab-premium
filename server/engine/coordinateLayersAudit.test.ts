import { describe, expect, it } from "vitest";
import { calculateAscendantLongitude, generatePredictionForModel, kpDetailsFromCanonicalLongitude, manzilFromLongitude, NAKSHATRA_ARC_DEGREES, MANZIL_ARC_DEGREES, ARABIC_LUNAR_MANSIONS, NAKSHATRAS } from "./firmamentEngine";
import { getChaldeanDecan } from "./territorialStack";
import { houseCusp, locateInHouse } from "./houseFrameFoundation";

/**
 * Research audit: verifies INTERNAL consistency of the deliberately zero-tilt
 * equatorial background and documents where traditional ecliptic/sidereal
 * layers are NOT established. It must not be mistaken for method certification.
 */
const names=["Aries","Taurus","Gemini","Cancer","Leo","Virgo","Libra","Scorpio","Sagittarius","Capricorn","Aquarius","Pisces"];
const norm=(x:number)=>(x%360+360)%360;
const sign=(lon:number)=>names[Math.floor(norm(lon)/30)]!;
const loc=(lon:number)=>({absoluteDegrees:Number(norm(lon).toFixed(6)),sign:sign(lon),degreeInSign:Number((norm(lon)%30).toFixed(6))});
const event={teamA:"Mike Tyson",teamB:"Buster Douglas",gameType:"boxing" as const,location:"Tokyo Dome, Bunkyo, Tokyo, Japan",startTime:new Date("1990-02-11T03:00:00Z"),coordinates:{latitude:35.7056,longitude:139.7519}};

describe("zero-tilt coordinate-layer diagnostics at Tokyo Dome",()=>{
 it("outputs each of 12 bodies with houses, decans, Nakshatra/pada/KP and Manzil; no other frame is silently rotated",()=>{
  const east=generatePredictionForModel(event,"azimuth");
  const god=generatePredictionForModel(event,"fixed-zodiac-wheel");
  const asc=calculateAscendantLongitude(event.startTime,event.coordinates.latitude,event.coordinates.longitude);
  expect(east.ascendantLongitude).toBeCloseTo(asc,8);
  expect(east.planets).toHaveLength(12);
  const report={
    model:"USER_DEFINED_ZERO_TILT_EQUATORIAL_J2000_ANGLES",
    event:event.startTime.toISOString(),
    ascendant:loc(asc), 
    nakshatraSpan:NAKSHATRA_ARC_DEGREES,
    manzilSpan:MANZIL_ARC_DEGREES,
    bodyCount:east.planets.length,
    houses: [] as unknown[],
    bodies: [] as unknown[],
    flags: [
      "Astronomy.GeoVector EQJ angles used as ecliptic zodiac sectors; this is a custom correspondence, not independently verified classical longitudes.",
      "Mean nodes are calculated from an ecliptic-degree formula, not explicitly rotated to the EQJ axes used for the other ten bodies.",
      "Solar altitude and all other altitudes are currently 0° placeholder values.",
      "Fixed stars in archive use manually hardcoded wheel degrees, not measured per-object J2000 RA on a common frame.",
      "Mansions and Nakshatras are equal wheel divisions from 0° Aries, not separately established star-anchored sector boundaries."
    ]
  };
  for(const house of [1,12,11,10,9,8,7,6,5,4,3,2]){
    const start=houseCusp(house,"agent",asc);
    const end=houseCusp(house===1?12:house-1,"agent",asc);
    report.houses.push({house,side:[1,2,3,6,10,11].includes(house)?"Mike Tyson":"Buster Douglas",cusp:loc(start),end:loc(end),occupants:east.planets.filter(p=>p.house===house).map(p=>p.planet)});
  }
  for(const planet of east.planets) {
    const deg=norm(planet.backgroundWheelLongitude);
    const stellar=kpDetailsFromCanonicalLongitude(deg,event.startTime,false);
    const manzil=manzilFromLongitude(deg);
    const face=getChaldeanDecan(sign(deg),deg%30);
    const godPlanet=god.planets.find(p=>p.planet===planet.planet)!;
    expect(planet.backgroundWheelLongitude).toBeCloseTo(godPlanet.backgroundWheelLongitude,10);
    expect(locateInHouse(deg,"agent",asc).house).toBe(planet.house);
    expect(planet.sign).toBe(sign(deg));
    expect(planet.nakshatra).toBe(stellar.nakshatra);
    expect(planet.manzil.name).toBe(manzil.name);
    expect(NAKSHATRAS).toContain(stellar.nakshatra);
    expect(ARABIC_LUNAR_MANSIONS).toContain(manzil.name);
    report.bodies.push({
      planet:planet.planet,house:planet.house,side:[1,2,3,6,10,11].includes(planet.house)?"Mike Tyson":"Buster Douglas",
      position:loc(deg),houseDegree:Number(planet.degreeInHouse.toFixed(6)),
      decan:face.decan,decanRuler:face.ruler,
      nakshatra:stellar.nakshatra,nakshatraNumber:Math.floor(deg/NAKSHATRA_ARC_DEGREES)+1,pada:stellar.pada,kpStarLord:stellar.starLord,kpSubLord:stellar.subLord,
      arabicMansion:manzil.name,arabicMansionNumber:manzil.index,arabicMansionDegree:manzil.degreeInMansion,
      sourceDataSunOrBodyAltitude:planet.altitude,
    });
  }
  console.log("COORDINATE_LAYER_AUDIT_BEGIN");
  console.log("COORDINATE_LAYER_AUDIT_SUMMARY "+JSON.stringify({ascendant:report.ascendant,bodyCount:report.bodyCount,flags:report.flags}));
  for(const h of report.houses)console.log("COORDINATE_LAYER_AUDIT_HOUSE "+JSON.stringify(h));
  for(const p of report.bodies)console.log("COORDINATE_LAYER_AUDIT_BODY "+JSON.stringify(p));
  console.log("COORDINATE_LAYER_AUDIT_END");
 });
});
