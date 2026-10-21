import { describe, expect, it } from "vitest";
import {
  ALL_36_DECANS, ELEMENTAL_DECAN_RULERS, decanAtLongitude,
  decanForSignDegree, decanHouseOverlaps,
} from "../../shared/firmamentDecans";
import { ZODIAC_SIGNS, locateInHouse } from "../../shared/firmamentWheel";
import { getElementalDecan } from "./territorialStack";
import { runSingleMethodEvent } from "./isolatedMethodRunner";
import { generatePredictionForModel } from "./firmamentEngine";

describe("Firmament exact-degree elemental-family decans: all 36 on fixed zodiac wheel",()=>{
  it("has 36 consecutive, gap-free 10-degree faces, correct 12-sign elemental sign-family rulers",()=>{
    const documentedRulers=[
      ["Mars","Sun","Jupiter"],["Venus","Mercury","Saturn"],
      ["Mercury","Venus","Saturn"],["Moon","Mars","Jupiter"],
      ["Sun","Jupiter","Mars"],["Mercury","Saturn","Venus"],
      ["Venus","Saturn","Mercury"],["Mars","Jupiter","Moon"],
      ["Jupiter","Mars","Sun"],["Saturn","Venus","Mercury"],
      ["Saturn","Mercury","Venus"],["Jupiter","Moon","Mars"],
    ];
    expect(ELEMENTAL_DECAN_RULERS).toEqual(documentedRulers);
    expect(ALL_36_DECANS).toHaveLength(36);
    for(let i=0;i<36;i++){
      const d=ALL_36_DECANS[i]!;
      expect(d.number).toBe(i+1);
      expect(d.startLongitude).toBe(i*10);
      expect(d.endLongitude).toBe((i+1)*10);
      expect(d.sign).toBe(ZODIAC_SIGNS[Math.floor(i/3)]);
      expect(d.face).toBe(i%3+1);
      expect(d.ruler).toBe(documentedRulers[Math.floor(i/3)]![i%3]);
      expect(decanAtLongitude(i*10+9.999999).number).toBe(i+1);
      expect(decanAtLongitude((i+1)*10).number).toBe((i+1)%36+1);
    }
  });
  it("does not misplace boundary degrees 9.999→10, 19.999→20, 29.999→next sign",()=>{
    expect(decanForSignDegree("Taurus",9.999999)).toMatchObject({decan:1,ruler:"Venus"});
    expect(decanForSignDegree("Taurus",10)).toMatchObject({decan:2,ruler:"Mercury"});
    expect(decanForSignDegree("Taurus",20)).toMatchObject({decan:3,ruler:"Saturn"});
    expect(decanAtLongitude(59.999999).ruler).toBe("Saturn");
    expect(decanAtLongitude(60).ruler).toBe("Mercury");
    expect(decanAtLongitude(359.999999).ruler).toBe("Mars");
    expect(decanAtLongitude(360)).toMatchObject({sign:"Aries",face:1,ruler:"Mars"});
  });
  it("rejects impossible sign-relative positions instead of silently clamping to a ruler",()=>{
    for(const degree of [-0.00001,30,360,Number.NaN,Number.POSITIVE_INFINITY]){
      expect(()=>getElementalDecan("Taurus",degree)).toThrow(RangeError);
    }
    expect(()=>getElementalDecan("Unlisted",5)).toThrow(RangeError);
  });
  it("holds a Taurus third-face ruler fixed while its 10-degree arc crosses H12/H1",()=>{
    // Exact Ascendant Taurus 25°. Taurus face 3: absolute [50°,60°).
    const fixed=decanAtLongitude(55);
    expect(fixed).toMatchObject({number:6,sign:"Taurus",face:3,ruler:"Saturn"});
    const sections=decanHouseOverlaps(6,"agent",55);
    expect(sections.map(x=>[x.house,x.degrees])).toEqual([[12,5],[1,5]]);
    expect(locateInHouse(54.999999,"agent",55).house).toBe(12);
    expect(locateInHouse(55,"agent",55).house).toBe(1);
    expect(decanAtLongitude(54.999999).number).toBe(decanAtLongitude(55).number);
    expect(decanHouseOverlaps(6,"god",55)).toMatchObject([{house:2,degrees:10}]);
  });
  it("audits 12 actual Tyson/Douglas chart bodies; decan names stay fixed, houses move with ASC",()=>{
    const startTime="1990-02-11T03:00:00.000Z"; // approximate first bell
    const coordinates={latitude:35.7056,longitude:139.7519};
    const input={
      teamA:"Mike Tyson",teamB:"Buster Douglas",
      favoredTeam:"Mike Tyson",underdogTeam:"Buster Douglas",
      roleAssignmentSource:"manual" as const,
      sport:"boxing" as const,location:"Tokyo Dome, Tokyo",
      latitude:coordinates.latitude,longitude:coordinates.longitude,
      startTime,actualWinner:"B" as const,
    };
    const chart=generatePredictionForModel({
      teamA:input.teamA,teamB:input.teamB,gameType:"boxing",
      location:input.location,coordinates,startTime:new Date(startTime),
    },"azimuth");
    const method=runSingleMethodEvent(input,"CORE_04");
    expect(chart.planets).toHaveLength(12);
    expect(method.agent.inputs).toHaveLength(12);
    expect(method.god.inputs).toHaveLength(12);
    const observed=chart.planets.map(planet=>{
      const face=decanAtLongitude(planet.backgroundWheelLongitude);
      const corresponding=method.agent.chart.bodies.find(p=>p.planet===planet.planet)!;
      expect(corresponding.house).toBe(locateInHouse(planet.backgroundWheelLongitude,"agent",chart.ascendantLongitude).house);
      expect(getElementalDecan(planet.sign,planet.degreeInSign)).toMatchObject({decan:face.face,ruler:face.ruler});
      return {
        body:planet.planet,longitude:Number(planet.backgroundWheelLongitude.toFixed(6)),
        sign:face.sign,degreeInSign:Number((planet.backgroundWheelLongitude%30).toFixed(6)),
        face:face.face,decanNumber:face.number,ruler:face.ruler,
        house:corresponding.house,
        team:[1,2,3,6,10,11].includes(corresponding.house)?"Mike Tyson":"Buster Douglas",
      };
    });
    console.log("FIRMAMENT_DECAN_AUDIT_START");
    console.log("FIRMAMENT_DECAN_AUDIT_ASC "+chart.ascendantLongitude.toFixed(9));
    observed.forEach(row=>console.log("FIRMAMENT_DECAN_AUDIT_BODY "+JSON.stringify(row)));
    console.log("FIRMAMENT_DECAN_AUDIT_SCORES "+JSON.stringify({
      god:{tyson:method.god.scoreA,douglas:method.god.scoreB},
      agent:{tyson:method.agent.scoreA,douglas:method.agent.scoreB},
      synthesis:{tyson:method.combined.scoreA,douglas:method.combined.scoreB},
      classification:method.combined.result,
      methodCertification:method.certification,
    }));
    expect(method.methodName.toLowerCase()).toContain("decan");
  });
});
