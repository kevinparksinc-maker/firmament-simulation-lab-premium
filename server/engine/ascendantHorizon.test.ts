import { describe, expect, it } from "vitest";
import * as Astronomy from "astronomy-engine";
import {
  ASCENDANT_HORIZON_VERSION,
  calculateAscendantLongitude,
  calculateLegacyWestHorizonLongitude,
  generatePredictionForModel,
} from "./firmamentEngine";
import { locateInHouse } from "./houseFrameFoundation";
import { runSimulationEvent } from "./simulationAdapter";

const norm = (v: number) => ((v % 360) + 360) % 360;
const aFamily = new Set([1,2,3,6,10,11]);
const bFamily = new Set([4,5,7,8,9,12]);
const fixture = {
  teamA: "Dodgers", teamB: "Giants", sport: "MLB" as const,
  location: "Los Angeles, CA",latitude:34.0522,longitude:-118.2437,
  startTime:"2024-06-15T19:10:00.000Z",
};

describe("Zero-tilt eastern horizon Ascendant correction, version 2", () => {
  it("is explicitly versioned and measures the RA 90° EAST of the sidereal meridian", () => {
    expect(ASCENDANT_HORIZON_VERSION).toBe("ZERO_TILT_EASTERN_HORIZON_V2");
    const date = new Date(fixture.startTime);
    const lst = norm(Astronomy.SiderealTime(Astronomy.MakeTime(date))*15+fixture.longitude);
    const rising = calculateAscendantLongitude(date,fixture.latitude,fixture.longitude);
    const oldSetting = calculateLegacyWestHorizonLongitude(date,fixture.latitude,fixture.longitude);
    expect(norm(rising-lst)).toBeCloseTo(90,8);  // RA=LST+90, rising east
    expect(norm(oldSetting-lst)).toBeCloseTo(270,8); // RA=LST-90, setting west
    expect(norm(oldSetting-rising)).toBeCloseTo(180,8);
    expect(norm(lst-rising)).toBeCloseTo(270,8); // hour angle = -90
    expect(norm(lst-oldSetting)).toBeCloseTo(90,8); // hour angle = +90
  });

  it("does not introduce axial tilt or latitude dependence into the user-defined zero-tilt model", () => {
    const t=new Date(fixture.startTime), lon=fixture.longitude;
    expect(calculateAscendantLongitude(t,34.05,lon)).toBeCloseTo(calculateAscendantLongitude(t,-34.05,lon),10);
    const shifted=calculateAscendantLongitude(t,34.05,lon+30);
    expect(norm(shifted-calculateAscendantLongitude(t,34.05,lon))).toBeCloseTo(30,10);
  });

  it("flips every 12-house side assignment relative to the prior west-horizon error", () => {
    const date=new Date(fixture.startTime), asc=calculateAscendantLongitude(date,fixture.latitude,fixture.longitude);
    const legacy=calculateLegacyWestHorizonLongitude(date,fixture.latitude,fixture.longitude);
    for (let longitude=0;longitude<360;longitude+=3.75){
      const house=locateInHouse(longitude,"agent",asc).house;
      const priorHouse=locateInHouse(longitude,"agent",legacy).house;
      expect(house).toBe((priorHouse+5)%12+1);
      expect(aFamily.has(house)).toBe(bFamily.has(priorHouse));
      expect(bFamily.has(house)).toBe(aFamily.has(priorHouse));
    }
  });

  it("preserves God View but changes local Agent View houses to the corrected east anchor", () => {
    const full=runSimulationEvent(fixture);
    const date=new Date(fixture.startTime);
    const corrected=calculateAscendantLongitude(date,fixture.latitude,fixture.longitude);
    expect(full.godView.ascendantLongitude).toBe(0);
    expect(full.agentView.ascendantLongitude).toBeCloseTo(corrected,5);
    const direct=generatePredictionForModel({
      teamA:fixture.teamA,teamB:fixture.teamB,gameType:"MLB",
      location:fixture.location,startTime:date,
      coordinates:{latitude:fixture.latitude,longitude:fixture.longitude},
    },"azimuth");
    expect(direct.ascendantLongitude).toBeCloseTo(corrected,8);
    for(const planet of direct.planets){
      expect(planet.house).toBe(locateInHouse(planet.backgroundWheelLongitude,"agent",corrected).house);
    }
  });
});
