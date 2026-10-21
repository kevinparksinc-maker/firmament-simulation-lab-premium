import {describe,it,expect} from "vitest";
import {
  ZODIAC_SIGNS,WHEEL_GEOMETRY_VERSION,
  houseCusp,locateInHouse,arcHouseOverlaps,zodiacAt,legacyReverseHouse,counterclockwiseWheelAngle
} from "../../shared/firmamentWheel";

describe("Firmament V3: one canonical zodiac-order 360° wheel for calculations and charts",()=>{
  it("anchors Aries in H1, puts Taurus AHEAD in H2 and Pisces BEHIND in H12",()=>{
    expect(WHEEL_GEOMETRY_VERSION).toBe("ZODIAC_FORWARD_HOUSE_1_TO_12_V3");
    expect([...ZODIAC_SIGNS]).toEqual(["Aries","Taurus","Gemini","Cancer","Leo","Virgo","Libra","Scorpio","Sagittarius","Capricorn","Aquarius","Pisces"]);
    const expected=[1,2,3,4,5,6,7,8,9,10,11,12];
    expected.forEach((house,index)=>{
      expect(houseCusp(house,"god",0)).toBe(index*30);
      expect(locateInHouse(index*30+10,"god",0).house).toBe(house);
      expect(zodiacAt(houseCusp(house,"god",0)).name).toBe(ZODIAC_SIGNS[index]);
    });
    expect(locateInHouse(350,"god",0).house).toBe(12);
    expect(locateInHouse(30,"god",0).house).toBe(2);
    expect(locateInHouse(180,"god",0).house).toBe(7);
  });
  it("turns wheel without changing zodiac or body longitudes, and H12 precedes the Ascendant",()=>{
    for(const asc of [0,17,47,100,210,359.5]){
      for(let house=1;house<=12;house++){
        const cusp=houseCusp(house,"agent",asc);
        expect(locateInHouse(cusp,"agent",asc).house).toBe(house);
        expect(locateInHouse(cusp+29.999999,"agent",asc).house).toBe(house);
      }
      expect(locateInHouse(asc-1,"agent",asc).house).toBe(12);
      expect(locateInHouse(asc+1,"agent",asc).house).toBe(1);
      expect(locateInHouse(asc+31,"agent",asc).house).toBe(2);
      expect(locateInHouse(asc+181,"agent",asc).house).toBe(7);
    }
  });
  it("reconciles Scorpio-first example: Libra H12 behind and Sagittarius H2 ahead",()=>{
    expect(zodiacAt(210).name).toBe("Scorpio");
    expect(zodiacAt(houseCusp(12,"agent",210)).name).toBe("Libra");
    expect(zodiacAt(houseCusp(2,"agent",210)).name).toBe("Sagittarius");
    expect(locateInHouse(240.001,"agent",210).house).toBe(2);
    expect(legacyReverseHouse(240.001,"agent",210)).toBe(12);
  });
  it("supports exact-degree ascendants without rounding to whole-sign houses",()=>{
    const asc=55.673653;
    expect(zodiacAt(houseCusp(1,"agent",asc)).name).toBe("Taurus");
    expect(zodiacAt(houseCusp(2,"agent",asc)).name).toBe("Gemini");
    expect(zodiacAt(houseCusp(12,"agent",asc)).name).toBe("Aries");
    expect(locateInHouse(84,"agent",asc).house).toBe(1); // Gemini 24° still H1
    expect(locateInHouse(90,"agent",asc).house).toBe(2); // Cancer 0° H2
    expect(locateInHouse(54,"agent",asc).house).toBe(12); // Taurus 24° behind
  });
  it("preserves exact source arcs and house fractions across wrap and signs",()=>{
    for(const asc of [0,47,210,359]){
      for(const width of [10,360/27,360/28]){
        for(let i=0;i<12;i++){
          const z=i*30+25;
          const cells=arcHouseOverlaps({startLongitude:z,endLongitude:z+width},"agent",asc);
          const total=cells.reduce((s,c)=>s+c.degrees,0);
          expect(total).toBeCloseTo(width,9);
          for(const c of cells)expect(c.house).toBe(locateInHouse(c.startLongitude+1e-7,"agent",asc).house);
        }
      }
    }
  });
  it("renders increasing zodiac longitude counterclockwise from the 12 o'clock meridian",()=>{
    expect(counterclockwiseWheelAngle(0)).toBe(-90);
    expect(counterclockwiseWheelAngle(30)).toBe(-120);
    expect(counterclockwiseWheelAngle(330)).toBe(-420);
  });
});
