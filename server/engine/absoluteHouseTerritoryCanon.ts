/** Canon-derived house significations.
 * Source: The Absolute, server/astrologyKnowledge/canon/housesAndFrames.ts
 * Imported as static doctrine only; astronomical calculations remain in Premium.
 * Sports team assignments are Premium-specific and NOT part of the traditional Canon.
 */
export const ABSOLUTE_HOUSE_CANON = [
  {
    "house": 1,
    "title": "The Helm (Horoskopos)",
    "topics": [
      "Identity, physical body, vitality, temperament, and self-presentation",
      "First moves, personal agency, and how the person meets the world"
    ]
  },
  {
    "house": 2,
    "title": "Gate of Hades",
    "topics": [
      "Money, moveable possessions, livelihood, resources, and practical self-sufficiency",
      "Felt self-worth, material security, and what one values enough to steward"
    ]
  },
  {
    "house": 3,
    "title": "Goddess (Dea)",
    "topics": [
      "Everyday communication, speech, writing, siblings, neighbors, and local environment",
      "Short journeys, daily errands, practical learning, and immediate mental habits"
    ]
  },
  {
    "house": 4,
    "title": "Subterranean Pivot (Hypogeion)",
    "topics": [
      "Home, family of origin, ancestry, father/parents, land, and private foundations",
      "The emotional root system, inner sanctuary, and how matters conclude"
    ]
  },
  {
    "house": 5,
    "title": "Good Fortune (Agathe Tyche)",
    "topics": [
      "Creative self-expression, children, romance, courtship, play, joy, and risk-taking",
      "What one creates from the heart and offers to the world for delight"
    ]
  },
  {
    "house": 6,
    "title": "Bad Fortune (Kake Tyche)",
    "topics": [
      "Daily labor, service, craft, discipline, physical health routines, and problem-solving",
      "Subordinates, apprentices, small animals, and the friction of daily maintenance"
    ]
  },
  {
    "house": 7,
    "title": "The Setting Place (Dysis)",
    "topics": [
      "Committed partnership, marriage, business partners, contracts, and one-to-one encounter",
      "Open rivals, legal opponents, and the qualities mirrored back by another person"
    ]
  },
  {
    "house": 8,
    "title": "The Idle Place (Epikataphora)",
    "topics": [
      "Shared finances, debt, taxes, inheritance, and the partner's resources",
      "Psychological vulnerability, trust under high stakes, grief, loss, and deep regeneration"
    ]
  },
  {
    "house": 9,
    "title": "God (Theos)",
    "topics": [
      "Philosophy, religion, higher education, law, publishing, mentorship, and long journeys",
      "The search for overarching truth, ethics, and worldview"
    ]
  },
  {
    "house": 10,
    "title": "Midheaven (Mesouranema)",
    "topics": [
      "Vocation, career, public reputation, authority, leadership, and visible contribution",
      "How a person is judged by the public and what they build in the world"
    ]
  },
  {
    "house": 11,
    "title": "Good Spirit (Agathos Daimon)",
    "topics": [
      "Alliances, friends, communities, networks, patrons, and shared aspirations",
      "Gains from one's vocation (2nd from the 10th) and long-range hopes"
    ]
  },
  {
    "house": 12,
    "title": "Bad Spirit (Kakos Daimon)",
    "topics": [
      "Solitude, retreat, behind-the-scenes preparation, subconscious patterns, and hidden burdens",
      "Self-undoing, secret adversaries, spiritual surrender, and gestation before rebirth"
    ]
  }
] as const;

const ASC_HOUSES = new Set([1, 2, 3, 6, 10, 11]);
const SIGNS = ["Aries","Taurus","Gemini","Cancer","Leo","Virgo","Libra","Scorpio","Sagittarius","Capricorn","Aquarius","Pisces"] as const;
const RULERS: Record<string,string> = {
  Aries:"Mars", Taurus:"Venus", Gemini:"Mercury", Cancer:"Moon",
  Leo:"Sun", Virgo:"Mercury", Libra:"Venus", Scorpio:"Mars",
  Sagittarius:"Jupiter", Capricorn:"Saturn", Aquarius:"Saturn", Pisces:"Jupiter",
};
export type CanonPlanetPlacement = {
  planet: string;
  house: number;
  sign?: string;
  backgroundWheelLongitude?: number;
};
export type CanonHouseFrame = {
  houses: readonly { house: number; cuspLongitude: number }[];
  planets: readonly CanonPlanetPlacement[];
};
export function buildHouseTerritoryCanon(frame: CanonHouseFrame, teamA: string, teamB: string) {
  if (frame.houses.length !== 12) throw new Error("HOUSE_CANON_REQUIRES_12_CUSPS");
  const houses = ABSOLUTE_HOUSE_CANON.map(canon => {
    const cusp = frame.houses.find(h => h.house === canon.house);
    if (!cusp || !Number.isFinite(cusp.cuspLongitude)) throw new Error(`HOUSE_CANON_MISSING_CUSP_${canon.house}`);
    const sign = SIGNS[Math.floor((((cusp.cuspLongitude % 360) + 360) % 360) / 30)]!;
    const ruler = RULERS[sign]!;
    const ownerSide = ASC_HOUSES.has(canon.house) ? "A" : "B";
    const rulerPlacement = frame.planets.find(p => p.planet === ruler);
    const occupantPlanets = frame.planets.filter(p => p.house === canon.house).map(p => p.planet);
    return {
      house: canon.house, ownerSide, ownerTeam: ownerSide === "A" ? teamA : teamB,
      canonTitle: canon.title, significations: canon.topics,
      cuspLongitude: cusp.cuspLongitude, cuspSign: sign,
      ruler,
      rulerPlacement: rulerPlacement ? {
        house: rulerPlacement.house,
        sign: rulerPlacement.sign ?? null,
        territorialSide: ASC_HOUSES.has(rulerPlacement.house) ? "A" : "B",
        territorialTeam: ASC_HOUSES.has(rulerPlacement.house) ? teamA : teamB,
      } : null,
      occupants: occupantPlanets,
      crossTerritoryRuler: rulerPlacement ? (ASC_HOUSES.has(rulerPlacement.house) ? "A" : "B") !== ownerSide : null,
    };
  });
  const planetaryRulerships = frame.planets.map(planet => {
    const ruledHouses = houses.filter(house => house.ruler === planet.planet).map(house => ({
      house: house.house,
      cuspSign: house.cuspSign,
      ownerSide: house.ownerSide,
      ownerTeam: house.ownerTeam,
      significations: house.significations,
      crossesTerritory: house.crossTerritoryRuler,
    }));
    const placementSide = ASC_HOUSES.has(planet.house) ? "A" : "B";
    return {
      planet: planet.planet,
      placementHouse: planet.house,
      placementSign: planet.sign ?? null,
      placementSide,
      placementTeam: placementSide === "A" ? teamA : teamB,
      rulesHouses: ruledHouses,
      ruledHouseCount: ruledHouses.length,
      rulesBothTeams: ruledHouses.some(h => h.ownerSide === "A") && ruledHouses.some(h => h.ownerSide === "B"),
      connections: ruledHouses.map(h => ({
        fromHouse: h.house,
        toPlacementHouse: planet.house,
        fromTeam: h.ownerTeam,
        toTeam: placementSide === "A" ? teamA : teamB,
        direction: h.ownerSide === placementSide ? "within-team" : "cross-team",
      })),
    };
  });
  return {
    planetaryRulerships,
    source: "The Absolute: housesAndFrames.ts (static Canon house meanings)",
    status: "interpretive-evidence-only",
    scope: "Agent View, equal-house cusps, team territory",
    warning: "House meanings are traditional symbolism. Ruler placement and territory are calculated facts; they are not statistically validated win probabilities. Venus may appear as a cusp ruler but is excluded from sports scoring.",
    houses,
  };
}
