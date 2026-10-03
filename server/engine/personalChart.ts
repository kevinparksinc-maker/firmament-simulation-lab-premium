import { equalHouseZonePlacement, generateFixedJ2000PlanetReadings, generatePredictionForModel, NAKSHATRAS, NAKSHATRA_ARC_DEGREES, type GameInput } from "./firmamentEngine";
import { geometryRelation, nakshatraCenter } from "./celestialGeometry";

export type PersonalChartInput = {
  birthDateTime: string;
  birthLocation: string;
  birthLatitude: number;
  birthLongitude: number;
  transitDateTime: string;
  transitLocation: string;
  transitLatitude: number;
  transitLongitude: number;
};

const snapshot = (prediction: ReturnType<typeof generatePredictionForModel>) => ({
  ascendantLongitude: prediction.ascendantLongitude,
  localSiderealTime: prediction.localSiderealTime,
  houses: prediction.houses.map((house) => ({ house: house.house, cuspLongitude: house.cuspLongitude, sign: house.sign })),
  planets: prediction.planets.map((planet) => { const nakshatraIndex = NAKSHATRAS.indexOf(planet.nakshatra as typeof NAKSHATRAS[number]); return { planet: planet.planet, longitude: planet.backgroundWheelLongitude, sign: planet.sign, degreeInSign: planet.degreeInSign, house: planet.house, degreeInHouse: planet.degreeInHouse, nakshatra: planet.nakshatra, pada: planet.pada, manzil: planet.manzil, houseOverlays: { manzil: equalHouseZonePlacement(planet.manzil.startLongitude, planet.manzil.endLongitude, prediction.ascendantLongitude), nakshatra: equalHouseZonePlacement(nakshatraIndex * NAKSHATRA_ARC_DEGREES, (nakshatraIndex + 1) * NAKSHATRA_ARC_DEGREES, prediction.ascendantLongitude) }, starLord: planet.starLord, subLord: planet.subLord, isRetrograde: planet.isRetrograde }; }),
});

const fixedSnapshot = (date: Date) => {
  const planets = generateFixedJ2000PlanetReadings(date);
  return { ascendantLongitude: 0, localSiderealTime: 0, houses: Array.from({ length: 12 }, (_, index) => ({ house: index + 1, cuspLongitude: index * 30, sign: ["Aries", "Taurus", "Gemini", "Cancer", "Leo", "Virgo", "Libra", "Scorpio", "Sagittarius", "Capricorn", "Aquarius", "Pisces"][index] })), planets: planets.map((planet) => ({ planet: planet.planet, longitude: planet.backgroundWheelLongitude, sign: planet.sign, degreeInSign: planet.degreeInSign, house: planet.firmamentHouse, degreeInHouse: planet.firmamentDegreeInHouse, nakshatra: planet.nakshatra, pada: planet.pada, manzil: planet.manzil, starLord: planet.starLord, subLord: planet.subLord, isRetrograde: planet.isRetrograde })) };
};

function gameInput(date: Date, location: string, latitude: number, longitude: number): GameInput {
  return { teamA: "Natal", teamB: "Transit", gameType: "boxing", location, coordinates: { latitude, longitude }, startTime: date };
}

export function buildPersonalChart(input: PersonalChartInput) {
  const birthDate = new Date(input.birthDateTime);
  const transitDate = new Date(input.transitDateTime);
  if (Number.isNaN(birthDate.getTime()) || Number.isNaN(transitDate.getTime())) throw new Error("Birth and transit date-times must be valid ISO dates");
  const natalLocal = generatePredictionForModel(gameInput(birthDate, input.birthLocation, input.birthLatitude, input.birthLongitude), "azimuth");
  const transitLocal = generatePredictionForModel(gameInput(transitDate, input.transitLocation, input.transitLatitude, input.transitLongitude), "azimuth");
  const natalFixed = fixedSnapshot(birthDate);
  const transitFixed = fixedSnapshot(transitDate);
  const natalPlanets = natalFixed.planets;
  const transitPlanets = transitFixed.planets;
  const planetaryAspects: any[] = [];
  const planetManzilAspects: any[] = [];
  const planetNakshatraAspects: any[] = [];
  for (const transit of transitPlanets) {
    for (const natal of natalPlanets) {
      const relation = geometryRelation(`Transit ${transit.planet}`, transit.longitude, `Natal ${natal.planet}`, natal.longitude);
      if (relation) planetaryAspects.push(relation);
      const manzilRelation = geometryRelation(`Transit ${transit.planet}`, transit.longitude, `Natal ${natal.planet} · ${natal.manzil.name} center`, natal.manzil.centerLongitude);
      if (manzilRelation) planetManzilAspects.push(manzilRelation);
      const nakshatra = nakshatraCenter(natal.nakshatra);
      if (nakshatra) {
        const nakshatraRelation = geometryRelation(`Transit ${transit.planet}`, transit.longitude, `Natal ${natal.planet} · ${nakshatra.name} center`, nakshatra.centerLongitude);
        if (nakshatraRelation) planetNakshatraAspects.push(nakshatraRelation);
      }
    }
  }
  const convergences = planetaryAspects.flatMap((relation) => {
    const transitPlanet = relation.source.replace("Transit ", "");
    const target = relation.target.replace("Natal ", "");
    const mansion = planetManzilAspects.find((candidate) => candidate.source === relation.source && candidate.target.startsWith(relation.target));
    const nakshatra = planetNakshatraAspects.find((candidate) => candidate.source === relation.source && candidate.target.startsWith(relation.target));
    return mansion || nakshatra ? [{ subject: transitPlanet, target, relationship: relation.relationship, layers: ["transit-to-natal aspect", ...(mansion ? ["natal Manzil-center aspect"] : []), ...(nakshatra ? ["natal Nakshatra-center aspect"] : [])], strength: relation.weight + (mansion?.weight ?? 0) + (nakshatra?.weight ?? 0) }] : [];
  });
  const geometry = { orb: 5, planetaryAspects, planetManzilAspects, planetNakshatraAspects, convergences, counts: { planetaryAspects: planetaryAspects.length, planetManzilAspects: planetManzilAspects.length, planetNakshatraAspects: planetNakshatraAspects.length, convergences: convergences.length } };
  return { input, natal: { godView: natalFixed, agentView: snapshot(natalLocal) }, transit: { godView: transitFixed, agentView: snapshot(transitLocal) }, geometry };
}
