import { z } from "zod";
import { dignity } from "./territorialStack";
import { buildSportsRelationshipGraph } from "./sportsIntelligence";
import type { runSimulationEvent } from "./simulationAdapter";
import type { PregameConditions } from "../pregameConditions";

type Simulation = ReturnType<typeof runSimulationEvent>;
type Side = "ASC" | "DSC";

export type AnalystEvidence = {
  id: string;
  side: Side | "BOTH";
  strength: number;
  tier: 1 | 2 | 3;
  chain: {
    planet: string;
    rulesHouses: number[];
    occupiesHouse: number;
    godSector: number;
    aspectsHouses: Array<{
      planet: string;
      house: number;
      aspect: string;
      orb: number;
      tendency: "harmony" | "friction" | "geometry-only";
    }>;
    receivesFrom: string[];
    dignity?: string;
    mansion: { system: "Nakshatra"; name: string; pada: number };
  };
  canonRuleIds: string[];
  significance: string;
  sportsRelevance: string;
  contested: boolean;
};

const rule = {
  territory: "TEAM-HOUSE-TERRITORY",
  cusp: "CLASSICAL-CUSP-LORDSHIP",
  priority: "PRIMARY-SIGNIFICATOR",
  aspect: "RECORDED-ASPECT-GEOMETRY",
  reception: "RECIPROCAL-DOMICILE",
  condition: "PREMIUM-ESSENTIAL-DIGNITY",
  mixed: "MIXED-TERRITORY",
} as const;

// Priorities are a versioned sports review rubric. They do not change engine scores.
const decisiveThreshold = 70;
const materialThreshold = 35;
function side(value: string): Side {
  if (value === "A") return "ASC";
  if (value === "B") return "DSC";
  throw new Error("SPORTS_ANALYST_INVALID_TERRITORY");
}
function contactTendency(aspect: string) {
  if (["conjunction", "trine", "sextile"].includes(aspect))
    return "harmony" as const;
  if (["square", "opposition"].includes(aspect)) return "friction" as const;
  return "geometry-only" as const;
}
const houseLabel = (houses: number[]) => houses.map(n => "H" + n).join(", ");

export function buildSportsAdjudication(
  simulation: Simulation,
  conditions: PregameConditions
) {
  const graph = buildSportsRelationshipGraph(simulation);
  const territory = simulation.houseTerritoryCanon;
  const candidates: AnalystEvidence[] = graph.bodies.map((body, index) => {
    const placement = territory.planetaryRulerships.find(
      row => row.planet === body.name
    )!;
    const house = territory.houses.find(
      row => row.house === placement.placementHouse
    )!;
    const god = simulation.chart.godView.planets.find(
      row => row.planet === body.name
    )!;
    const actualEdges = graph.edges.filter(
      edge =>
        (edge.kind === "aspect" || edge.kind === "reception") &&
        (edge.from === body.id || edge.to === body.id)
    );
    const otherBody = (
      edge: Extract<
        (typeof graph.edges)[number],
        { kind: "aspect" | "reception" }
      >
    ) => (edge.from === body.id ? edge.to : edge.from).slice("body:".length);
    const contacts = actualEdges.flatMap(edge => {
      if (edge.kind !== "aspect") return [];
      const planet = otherBody(edge);
      const target = territory.planetaryRulerships.find(
        row => row.planet === planet
      )!;
      return [
        {
          planet,
          house: target.placementHouse,
          aspect: edge.aspect,
          orb: edge.orb,
          tendency: contactTendency(edge.aspect),
        },
      ];
    });
    const receivesFrom = actualEdges.flatMap(edge =>
      edge.kind === "reception" ? [otherBody(edge)] : []
    );
    const ruled = placement.rulesHouses.map(row => row.house);
    const ownership = new Set(placement.rulesHouses.map(row => row.ownerSide));
    const primary = ruled.includes(1) || ruled.includes(7);
    const mixed =
      ownership.size > 1 ||
      placement.rulesHouses.some(row => row.crossesTerritory);
    const contested = contacts.some(
      contact => contact.aspect === "conjunction"
    );
    const condition = ruled.length
      ? dignity(body.name, body.sign).status
      : undefined;
    // Geometry contributes bounded relevance. A contact by itself never transfers team support.
    const connectivity =
      12 +
      12 * ruled.length +
      Math.min(18, contacts.length * 3) +
      Math.min(12, receivesFrom.length * 6);
    const strength = Math.min(100, connectivity + (primary ? 40 : 0));
    const tier =
      mixed || strength >= decisiveThreshold
        ? 1
        : strength >= materialThreshold && ruled.length
          ? 2
          : 3;
    const canonHouse = graph.houses.find(
      node => node.id === `agent:H${house.house}`
    )!;
    const closest = [...contacts]
      .filter(contact => contact.tendency !== "geometry-only")
      .sort((a, b) => a.orb - b.orb)[0];
    const contactMeaning = closest
      ? `; its closest classified contact is ${closest.tendency} with ${closest.planet} in H${closest.house}`
      : "";
    return {
      id: `EV-${String(index + 1).padStart(3, "0")}`,
      side: mixed ? "BOTH" : side(placement.placementSide),
      tier,
      strength,
      contested,
      chain: {
        planet: body.name,
        rulesHouses: ruled,
        occupiesHouse: house.house,
        godSector: god.house,
        aspectsHouses: contacts,
        receivesFrom,
        dignity: condition,
        mansion: { system: "Nakshatra", name: body.nakshatra, pada: body.pada },
      },
      canonRuleIds: [
        rule.territory,
        ...(ruled.length ? [rule.cusp, rule.condition] : []),
        ...(primary ? [rule.priority] : []),
        ...(contacts.length ? [rule.aspect] : []),
        ...(receivesFrom.length ? [rule.reception] : []),
        ...(mixed ? [rule.mixed] : []),
      ],
      significance: `${body.name} occupies H${house.house}${ruled.length ? ` and rules ${houseLabel(ruled)} with ${condition?.toLowerCase()} dignity` : ""}${receivesFrom.length ? `, in reciprocal domicile with ${receivesFrom.join(", ")}` : ""}${contactMeaning}.`,
      sportsRelevance: `${body.name} occupies ${side(house.ownerSide)} territory at H${house.house} (${house.significations[0] ?? canonHouse.sign})${mixed ? " and rules territory on the other side" : ""}.`,
    };
  });
  const ranked = [...candidates].sort(
    (a, b) =>
      a.tier - b.tier || b.strength - a.strength || a.id.localeCompare(b.id)
  );
  const required = new Set(
    ranked.filter(row => row.tier === 1 || row.contested).map(row => row.id)
  );
  for (const teamSide of ["ASC", "DSC"] as const) {
    for (const item of ranked
      .filter(row => row.side === teamSide && row.tier === 2)
      .slice(0, 3))
      required.add(item.id);
    // Keep at least one available counterpoint, even when one side has only context.
    const best = ranked.find(row => row.side === teamSide);
    if (best) required.add(best.id);
  }
  const items = ranked.filter(row => required.has(row.id));
  const agentByMethod = new Map(
    simulation.agentView.allLayers.map(row => [row.name, row.winner])
  );
  const frameReversals = simulation.godView.allLayers.flatMap(row => {
    const agent = agentByMethod.get(row.name);
    return (row.winner === "A" || row.winner === "B") &&
      (agent === "A" || agent === "B") &&
      row.winner !== agent
      ? [`${row.name} (God ${side(row.winner)}, Agent ${side(agent)})`]
      : [];
  });
  const contested = items.filter(item => item.contested).map(item => item.id);
  const contradictions = [
    ...items
      .filter(item => item.side === "BOTH")
      .map(item => ({
        evidenceIds: [item.id],
        nature: `${item.chain.planet} links opposing teams through occupancy and cusp rulership.`,
        priority: "UNRESOLVED_BY_CANON" as const,
        ruleId: null,
      })),
    ...(contested.length
      ? [
          {
            evidenceIds: contested,
            nature:
              "Guardian's harmony teaching and the archived Premium friction score classify the recorded conjunctions differently.",
            priority: "RESOLVED_BY_RULE" as const,
            ruleId: "CONJUNCTION-SCOPE",
          },
        ]
      : []),
    ...(frameReversals.length
      ? [
          {
            evidenceIds: [],
            nature: `These recorded method directions reverse across frames: ${frameReversals.join("; ")}. Treat the two views as related observations.`,
            priority: "UNRESOLVED_BY_CANON" as const,
            ruleId: null,
          },
        ]
      : []),
  ].map((row, i) => ({ ...row, id: `CX-${String(i + 1).padStart(2, "0")}` }));
  const adjudicationRules = contradictions.some(
    row => row.ruleId === "CONJUNCTION-SCOPE"
  )
    ? [
        {
          id: "CONJUNCTION-SCOPE",
          instruction:
            "Interpret the recorded conjunction as harmonious in the Guardian lens. Keep the archived friction score in its separate engine context. The disagreement supplies no extra vote for either team.",
        },
      ]
    : [];
  const mass = (teamSide: Side) =>
    items
      .filter(row => row.tier === 1 && row.side === teamSide)
      .reduce((total, row) => total + row.strength, 0);
  const asc = mass("ASC"),
    dsc = mass("DSC");
  const margin = Math.abs(asc - dsc) / Math.max(asc + dsc, 1);
  const lean = margin < 0.15 ? "NO_PICK" : asc > dsc ? "ASC" : "DSC";
  return {
    version: "sports-adjudication-v2",
    event: {
      teamASC: simulation.input.teamA,
      teamDSC: simulation.input.teamB,
      sport: simulation.input.sport,
      startTime: simulation.input.startTime,
    },
    chartUsable: simulation.synthesisView.valid,
    evidence: items,
    contradictions,
    adjudicationRules,
    ranking: {
      tierOneMass: { ASC: asc, DSC: dsc },
      lean,
      confidenceBand: [0, margin < 0.15 ? 0.55 : 0.75] as const,
    },
    gaps: [
      "Drig Bala and directed Graha Drishti are unavailable",
      "Mansion placements are context",
      "Node-aspect traditions and functional beneficence are unadjudicated",
    ],
    physical: {
      status: conditions.status,
      weather: conditions.weather,
      injuries: conditions.injuries,
      availability: conditions.availabilityStatus,
    },
  };
}

export type SportsAdjudication = ReturnType<typeof buildSportsAdjudication>;
const id = z.string().min(1).max(40);
const short = z.string().trim().min(1).max(340);
const claim = z.object({ evidenceId: id, claim: short }).strict();
export const analystJudgmentSchema = z
  .object({
    predictedWinner: z.enum(["ASC", "DSC", "NO_PICK"]),
    confidence: z.number().min(0).max(1),
    ascCase: z.array(claim).max(3),
    dscCase: z.array(claim).max(3),
    contradictionsAddressed: z.array(
      z
        .object({
          contradictionId: id,
          resolution: z.enum(["rule", "judgment"]),
          citedRuleId: id.nullable(),
          reasoning: short,
        })
        .strict()
    ),
    decisiveFactor: z
      .object({ evidenceId: id, why: short })
      .strict()
      .nullable(),
    opposingEvidence: z
      .object({ evidenceId: id, whyItDoesNotOutweigh: short })
      .strict()
      .nullable(),
    confidenceBasis: short,
  })
  .strict();

export type AnalystJudgment = z.infer<typeof analystJudgmentSchema>;

export function validateAnalystJudgment(
  packet: SportsAdjudication,
  raw: unknown
) {
  const result = analystJudgmentSchema.parse(raw);
  const prose = [
    ...result.ascCase.map(row => row.claim),
    ...result.dscCase.map(row => row.claim),
    ...result.contradictionsAddressed.map(row => row.reasoning),
    result.decisiveFactor?.why,
    result.opposingEvidence?.whyItDoesNotOutweigh,
    result.confidenceBasis,
  ];
  if (
    prose.some(
      line =>
        line && /\[(?:EV-\d+|CX-\d+|[A-Z][A-Z0-9]*(?:-[A-Z0-9]+)+)\]/.test(line)
    )
  ) {
    throw new Error("SPORTS_ANALYST_UNSTRUCTURED_CITATION");
  }
  const items = new Map(packet.evidence.map(row => [row.id, row]));
  const used = new Set<string>();
  const cite = (evidenceId: string, expectedSide?: Side) => {
    const item = items.get(evidenceId);
    if (
      !item ||
      (expectedSide && item.side !== expectedSide && item.side !== "BOTH")
    )
      throw new Error("SPORTS_ANALYST_UNSUPPORTED_CITATION: " + evidenceId);
    used.add(evidenceId);
  };
  for (const [teamSide, claims] of [
    ["ASC", result.ascCase],
    ["DSC", result.dscCase],
  ] as const) {
    const supportCount = packet.evidence.filter(
      row => row.side === teamSide || row.side === "BOTH"
    ).length;
    if (claims.length < Math.min(2, supportCount))
      throw new Error("SPORTS_ANALYST_MISSING_CASE: " + teamSide);
    if (new Set(claims.map(row => row.evidenceId)).size !== claims.length)
      throw new Error("SPORTS_ANALYST_DUPLICATE_CASE");
    claims.forEach(row => cite(row.evidenceId, teamSide));
  }
  if (!packet.chartUsable && result.predictedWinner !== "NO_PICK")
    throw new Error("SPORTS_ANALYST_UNUSABLE_CHART");
  if (result.predictedWinner !== "NO_PICK" && !result.decisiveFactor)
    throw new Error("SPORTS_ANALYST_MISSING_DECISIVE_FACTOR");
  const picked =
    result.predictedWinner === "NO_PICK" ? undefined : result.predictedWinner;
  if (result.decisiveFactor) cite(result.decisiveFactor.evidenceId, picked);
  if (
    picked &&
    !result.opposingEvidence &&
    packet.evidence.some(row => row.side !== picked)
  )
    throw new Error("SPORTS_ANALYST_MISSING_OPPOSITION");
  if (result.opposingEvidence)
    cite(
      result.opposingEvidence.evidenceId,
      picked === "ASC" ? "DSC" : picked === "DSC" ? "ASC" : undefined
    );
  const rules = new Set(packet.adjudicationRules.map(row => row.id));
  const conflicts = new Map(packet.contradictions.map(row => [row.id, row]));
  for (const row of result.contradictionsAddressed) {
    const conflict = conflicts.get(row.contradictionId);
    if (!conflict)
      throw new Error(
        "SPORTS_ANALYST_UNSUPPORTED_CONTRADICTION: " + row.contradictionId
      );
    if (
      conflict.ruleId
        ? row.resolution !== "rule" ||
          row.citedRuleId !== conflict.ruleId ||
          !rules.has(conflict.ruleId)
        : row.resolution !== "judgment" || row.citedRuleId !== null
    )
      throw new Error(
        "SPORTS_ANALYST_UNSUPPORTED_RULE: " + row.contradictionId
      );
    conflicts.delete(row.contradictionId);
  }
  if (conflicts.size)
    throw new Error(
      "SPORTS_ANALYST_MISSING_CONTRADICTIONS: " +
        [...Array.from(conflicts.keys())].join(", ")
    );
  return {
    result,
    metrics: {
      citedEvidence: used.size,
      suppliedEvidence: items.size,
      contradictionsAddressed: result.contradictionsAddressed.length,
      contradictionsSupplied: packet.contradictions.length,
      rankingDisagreement: result.predictedWinner !== packet.ranking.lean,
      confidenceOutsideBand:
        result.confidence > packet.ranking.confidenceBand[1],
    },
  };
}
