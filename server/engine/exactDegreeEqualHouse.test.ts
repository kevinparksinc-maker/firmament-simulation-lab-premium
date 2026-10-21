import { describe, expect, it } from "vitest";
import {
  houseCusp,locateInHouse,projectSignValuesToEqualHouses,
  zodiacAt,WHEEL_GEOMETRY_VERSION
} from "../../shared/firmamentWheel";
import { generatePredictionForModel } from "./firmamentEngine";
import { buildMethodChartSnapshot } from "./methodChartSnapshot";
import { calculateAshtakavargaLayer } from "./experimentalLayers";

describe("Equal-house exact-degree foundation (NO whole-sign shortcut)",()=>{
  it("keeps a whole zodiac sign split across TWO houses when ASC is 25° Taurus",()=>{
    const asc=55; // 25° Taurus
    expect(WHEEL_GEOMETRY_VERSION).toBe("ZODIAC_FORWARD_HOUSE_1_TO_12_V3");
    expect(houseCusp(1,"agent",asc)).toBe(55);
    expect(houseCusp(2,"agent",asc)).toBe(85);
    expect(houseCusp(12,"agent",asc)).toBe(25);
    expect(zodiacAt(50).name).toBe("Taurus");
    expect(zodiacAt(70).name).toBe("Gemini");
    expect(locateInHouse(50,"agent",asc).house).toBe(12); // Taurus 20°
    expect(locateInHouse(56,"agent",asc).house).toBe(1);  // Taurus 26°
    expect(locateInHouse(80,"agent",asc).house).toBe(1);  // Gemini 20°
    expect(locateInHouse(86,"agent",asc).house).toBe(2);  // Gemini 26°
  });
  it("projects fixed sign data into each actual 30° equal house using 5°/25° overlaps",()=>{
    const values=Array.from({length:12},(_,i)=>i*10);
    const houses=projectSignValuesToEqualHouses(values,"agent",55);
    const h1=houses[0]!;
    expect(h1.house).toBe(1);
    expect(h1.signContributions).toHaveLength(2);
    expect(h1.signContributions[0]).toMatchObject({sign:"Taurus",degrees:5,fractionOfHouse:5/30,rawSignValue:10});
    expect(h1.signContributions[1]).toMatchObject({sign:"Gemini",degrees:25,fractionOfHouse:25/30,rawSignValue:20});
    expect(h1.weightedValue).toBeCloseTo(10*5/30+20*25/30,12);
    expect(houses[11]!.signContributions.map(x=>x.sign)).toEqual(["Aries","Taurus"]);
    expect(houses.reduce((sum,h)=>sum+h.weightedValue,0)).toBeCloseTo(values.reduce((sum,v)=>sum+v,0),9);
    expect(projectSignValuesToEqualHouses(values,"god",55).map(x=>x.weightedValue)).toEqual(values);
  });
  it("keeps God's Lagna 0° and Agent's exact Ascendant in separate frozen method snapshots",()=>{
    const event={
      teamA:"Fighter One",teamB:"Fighter Two",gameType:"boxing" as const,
      location:"Tokyo Dome, Tokyo, Japan",
      startTime:new Date("1990-02-11T03:00:00.000Z"),
      coordinates:{latitude:35.7056,longitude:139.7519},
    };
    const prediction=generatePredictionForModel(event,"azimuth");
    const god=buildMethodChartSnapshot(prediction,event.startTime,"god");
    const agent=buildMethodChartSnapshot(prediction,event.startTime,"agent",prediction.ascendantLongitude);
    expect(god.prediction.ascendantLongitude).toBe(0);
    expect(agent.prediction.ascendantLongitude).toBeCloseTo(prediction.ascendantLongitude,10);
    expect(god.prediction.houses.map(h=>h.cuspLongitude)).toEqual(Array.from({length:12},(_,i)=>i*30));
    for(const body of god.prediction.planets){
      const same=agent.prediction.planets.find(q=>q.planet===body.planet)!;
      expect(same.backgroundWheelLongitude).toBe(body.backgroundWheelLongitude);
      expect(body.house).toBe(locateInHouse(body.backgroundWheelLongitude,"god",0).house);
      expect(same.house).toBe(locateInHouse(body.backgroundWheelLongitude,"agent",agent.ascendantLongitude).house);
    }
    const godSAV=calculateAshtakavargaLayer(god.prediction).sarvashtakavarga;
    const agentSAV=calculateAshtakavargaLayer(agent.prediction).sarvashtakavarga;
    expect(godSAV.houses.reduce((s,h)=>s+h.bindus,0)).toBeCloseTo(godSAV.total,8);
    expect(agentSAV.houses.reduce((s,h)=>s+h.bindus,0)).toBeCloseTo(agentSAV.total,8);
    expect(godSAV.houses[0]!.exactDegreeOverlaps).toHaveLength(1);
    expect(agentSAV.houses[0]!.exactDegreeOverlaps).toHaveLength(2);
  });
});
