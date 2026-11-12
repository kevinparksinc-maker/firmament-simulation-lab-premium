import guardianCanon from "./guardianCanon.generated.json";
import { METHOD_REGISTRY } from "./methodRegistry";
import type { runSimulationEvent } from "./simulationAdapter";
import type { PregameConditions } from "../pregameConditions";

type Simulation = ReturnType<typeof runSimulationEvent>;
type Frame = "god" | "agent" | "cross-frame" | "physical";
type Side = "A" | "B";
type Score = readonly [number, number];

type Evidence = {
  id: string;
  frame: Frame;
  method: string;
  kind: "core" | "registered" | "experimental" | "chart" | "physical";
  score?: Score;
  winner?: Side | "TIE" | "NONE";
  status: string;
  detail: string;
  source?: string;
};

type HouseNode = `${"god" | "agent"}:H${number}`;
type BodyNode = `body:${string}`;
type Relationship =
  | { id: string; kind: "occupies"; body: BodyNode; house: HouseNode }
  | {
      id: string;
      kind: "rules";
      body: BodyNode;
      house: HouseNode;
      crossesTerritory: boolean | null;
    }
  | {
      id: string;
      kind: "aspect";
      from: BodyNode;
      to: BodyNode;
      aspect: string;
      orb: number;
      weight: number;
    };

const bodyNode = (body: string): BodyNode => `body:${body}`;
const houseNode = (frame: "god" | "agent", house: number): HouseNode =>
  `${frame}:H${house}`;
const isSide = (winner: Evidence["winner"]): winner is Side =>
  winner === "A" || winner === "B";
const methodId = (frame: Frame, kind: Evidence["kind"], key: string) =>
  `${frame}:${kind}:${key}`;

export function buildSportsRelationshipGraph(simulation: Simulation) {
  const { agentView, godView, celestialGeometry } = simulation.chart;
  const territory = simulation.houseTerritoryCanon;
  const bodies = agentView.planets.map(body => {
    const canonName =
      body.planet === "Rahu"
        ? "North Node"
        : body.planet === "Ketu"
          ? "South Node"
          : body.planet;
    return {
      id: bodyNode(body.planet),
      name: body.planet,
      sign: body.sign,
      longitude: body.backgroundWheelLongitude,
      retrograde: body.isRetrograde,
      nakshatra: body.nakshatra,
      pada: body.pada,
      manzil: body.manzil.name,
      starLord: body.starLord,
      subLord: body.subLord,
      meaning:
        guardianCanon.meanings.planets[
          canonName as keyof typeof guardianCanon.meanings.planets
        ]?.terms ?? [],
      signMeaning:
        guardianCanon.meanings.signs[
          body.sign as keyof typeof guardianCanon.meanings.signs
        ]?.terms ?? [],
    };
  });
  const houses = [
    ...godView.houses.map(house => ({
      id: houseNode("god", house.house),
      sign: house.sign,
      cusp: house.cuspLongitude,
      side: null,
    })),
    ...territory.houses.map(house => ({
      id: houseNode("agent", house.house),
      sign: house.cuspSign,
      cusp: house.cuspLongitude,
      side: house.ownerSide,
    })),
  ];
  const edges: Relationship[] = [];
  for (const [frame, chart] of [
    ["god", godView],
    ["agent", agentView],
  ] as const) {
    for (const body of chart.planets) {
      edges.push({
        id: `${frame}:occupancy:${body.planet}`,
        kind: "occupies",
        body: bodyNode(body.planet),
        house: houseNode(frame, body.house),
      });
    }
  }
  for (const house of territory.houses) {
    edges.push({
      id: `agent:rulership:H${house.house}`,
      kind: "rules",
      body: bodyNode(house.ruler),
      house: houseNode("agent", house.house),
      crossesTerritory: house.crossTerritoryRuler,
    });
  }
  for (const contact of celestialGeometry.planetaryAspects) {
    edges.push({
      id: `shared:aspect:${contact.source}:${contact.target}`,
      kind: "aspect",
      from: bodyNode(contact.source),
      to: bodyNode(contact.target),
      aspect: contact.relationship,
      orb: contact.orb,
      weight: contact.weight,
    });
  }
  return { bodies, houses, edges };
}

const guardianCoverage: Record<
  string,
  {
    relation: "shared-concept" | "variant" | "doctrine-only";
    uses: readonly string[];
  }
> = {
  "western-planets-and-signs": {
    relation: "shared-concept",
    uses: [
      "chart",
      "Nine-planet influence",
      "Nodes (Rahu/Ketu)",
      "Retrograde condition",
    ],
  },
  "sumerian-celestial-foundations": {
    relation: "doctrine-only",
    uses: ["chart"],
  },
  "western-houses-and-angles": {
    relation: "shared-concept",
    uses: [
      "chart",
      "Cluster territory & house-lord placement",
      "Upachaya growth",
    ],
  },
  "western-aspects-and-orbs": {
    relation: "variant",
    uses: [
      "Chart-wide aspects",
      "Harmonious vs friction aspects",
      "Planetary war",
      "Besiegement",
      "Translation of light",
    ],
  },
  "western-essential-dignities": {
    relation: "variant",
    uses: ["Essential dignity", "Mutual reception", "Via Combusta"],
  },
  "fixed-stars-royal-watchers": {
    relation: "variant",
    uses: ["Fixed-star amplifications"],
  },
  "arabic-hermetic-lots": { relation: "variant", uses: ["Arabic Lots"] },
  "arabic-lunar-manazil": {
    relation: "shared-concept",
    uses: ["Arabic mansion context"],
  },
  "vedic-nakshatras-and-padas": {
    relation: "shared-concept",
    uses: ["Nakshatra influence", "KP Star → Sub → Sub–Sub chain"],
  },
  "vedic-vargas-divisional": {
    relation: "variant",
    uses: [
      "VARGA_D3_V1",
      "VARGA_D9_V1",
      "VARGA_D10_V1",
      "VARGA_D27_V1",
      "VARGA_D30_V1",
    ],
  },
  "vedic-dasha-and-ashtakavarga": {
    relation: "variant",
    uses: [
      "ASHTAKAVARGA_V1",
      "EVENT_LUNAR_DASHA_CHAIN_V1",
      "NATAL_VIMSHOTTARI_V1",
    ],
  },
  "vedic-planetary-lordship-connections": {
    relation: "shared-concept",
    uses: ["chart", "Cluster territory & house-lord placement"],
  },
  "chinese-lunar-mansions-xiu": {
    relation: "variant",
    uses: ["CHINESE_28_XIU_STELLAR_RA_V1"],
  },
  "elemental-decans": { relation: "variant", uses: ["Chaldean Decans"] },
};

function evaluateEvidence(rows: Evidence[]) {
  const directional = rows.filter(
    row =>
      row.kind === "core" && row.status === "triggered" && isSide(row.winner)
  );
  const rank = (side: Side) =>
    directional
      .filter(row => row.winner === side)
      .sort((a, b) => {
        const relativeMargin = ({ score: [a, b] = [0, 0] }: Evidence) =>
          Math.abs(a - b) / Math.max(1, Math.abs(a) + Math.abs(b));
        return (
          relativeMargin(b) - relativeMargin(a) || a.id.localeCompare(b.id)
        );
      })
      .slice(0, 5)
      .map(row => row.id);
  const byMethod = new Map(
    rows
      .filter(row => row.frame === "agent")
      .map(row => [`${row.kind}:${row.method}`, row])
  );
  const comparison = rows
    .filter(row => row.frame === "god")
    .flatMap(god => {
      const agent = byMethod.get(`${god.kind}:${god.method}`);
      if (!agent || !isSide(god.winner) || !isSide(agent.winner)) return [];
      return [
        {
          method: god.method,
          god: god.id,
          agent: agent.id,
          agrees: god.winner === agent.winner,
        },
      ];
    });
  return {
    rankedCoreEvidence: { A: rank("A"), B: rank("B") },
    crossFrameConvergences: comparison.filter(row => row.agrees),
    crossFrameContradictions: comparison.filter(row => !row.agrees),
    opposingCoreTestimony:
      directional.some(row => row.winner === "A") &&
      directional.some(row => row.winner === "B"),
  };
}

export function buildSportsIntelligence(
  simulation: Simulation,
  conditions: PregameConditions
) {
  const { input, synthesisView, frameParity } = simulation;
  const graph = buildSportsRelationshipGraph(simulation);
  const evidence: Evidence[] = [
    {
      id: "god:chart",
      method: "chart",
      frame: "god",
      kind: "chart",
      status: "computed",
      detail:
        "Fixed-background occupancy, zodiac placements and angular contacts are recorded in the relationship graph.",
    },
    {
      id: "agent:chart",
      method: "chart",
      frame: "agent",
      kind: "chart",
      status: "computed",
      detail:
        "Sunrise-anchored equal-house occupancy and all cusp-ruler relationships are recorded in the graph.",
    },
    {
      id: "cross-frame:chart",
      method: "chart",
      frame: "cross-frame",
      kind: "chart",
      status: synthesisView.valid ? "computed" : "unavailable",
      detail: synthesisView.reason,
    },
    {
      id: "physical:conditions",
      method: "pregameConditions",
      frame: "physical",
      kind: "physical",
      status: conditions.status,
      detail: conditions.notes.join(" "),
    },
  ];
  const formulas: Record<string, string> = {};
  const registeredMethods = Object.fromEntries(
    METHOD_REGISTRY.map(({ id, name, family, version, configuration }) => [
      id,
      { name, family, version, configuration },
    ])
  );
  const methodTraces: Record<string, unknown> = {};
  for (const frame of ["god", "agent"] as const) {
    const view = frame === "god" ? simulation.godView : simulation.agentView;
    for (const row of view.allLayers) {
      const id = methodId(frame, "core", row.name);
      evidence.push({
        id,
        frame,
        method: row.name,
        kind: "core",
        score: [row.scoreA, row.scoreB],
        winner: row.winner,
        status: row.neutralDiagnostic.status,
        detail: row.detail,
        source: row.source,
      });
      if (row.calculation) {
        formulas[id] = row.calculation.formula;
        methodTraces[id] = Array.from(
          new Set([...row.calculation.inputs, ...row.calculation.steps])
        ).filter(
          line =>
            ![
              "Hit/miss test:",
              "Final method output:",
              "FAMILY EVIDENCE (not additional score):",
              "Collective coverage:",
            ].some(prefix => line.startsWith(prefix))
        );
      }
    }
    for (const row of simulation.methodResults[
      frame === "god" ? "godView" : "agentView"
    ]) {
      const id = methodId(frame, "registered", row.methodId);
      evidence.push({
        id,
        frame,
        method: row.methodId,
        kind: "registered",
        ...(row.scoreA === null || row.scoreB === null
          ? {}
          : { score: [row.scoreA, row.scoreB] }),
        winner: row.prediction,
        status: !row.evaluable
          ? "unavailable"
          : row.mode === "EVIDENCE_ONLY"
            ? "evidence-only"
            : "experimental",
        detail: row.detail,
        source: row.calculationVersion,
      });
      if (row.evidence.length)
        methodTraces[id] = row.evidence.map(item => item.explanation);
    }
    for (const row of simulation.experimentalLayers[
      frame === "god" ? "godView" : "agentView"
    ].verdicts) {
      const id = methodId(frame, "experimental", row.layer);
      evidence.push({
        id,
        frame,
        method: row.method,
        kind: "experimental",
        ...(row.winner === "NOT_EVALUABLE"
          ? {}
          : { score: [row.scoreA, row.scoreB] }),
        winner: row.winner === "NOT_EVALUABLE" ? "NONE" : row.winner,
        status: row.status,
        detail: row.rationale.join(" "),
      });
      methodTraces[id] = row.evidence.map(
        item => `${item.label}: ${item.value}`
      );
    }
  }
  for (const row of synthesisView.methods) {
    evidence.push({
      id: methodId("cross-frame", "core", row.name),
      frame: "cross-frame",
      method: row.name,
      kind: "core",
      score: [row.scoreA, row.scoreB],
      winner: row.winner,
      status: row.winner === "TIE" ? "neutral" : "triggered",
      detail: "Recorded blend of the matching God and Agent method scores.",
    });
  }
  for (const row of simulation.additionalMethods.synthesis) {
    evidence.push({
      id: methodId("cross-frame", "registered", row.id),
      frame: "cross-frame",
      method: row.id,
      kind: "registered",
      ...(row.scoreA === null || row.scoreB === null
        ? {}
        : { score: [row.scoreA, row.scoreB] }),
      winner: row.prediction,
      status: row.evaluable ? "experimental" : "unavailable",
      detail:
        "Existing registered-method frame blend; separate from the official core total.",
    });
  }
  const { methods, valid, winner, scoreA, scoreB, margin, reason, formula } =
    synthesisView;
  const canonMethods = guardianCanon.methods.map(method => {
    const coverage = guardianCoverage[method.id];
    const matches = coverage
      ? evidence.filter(row => coverage.uses.includes(row.method))
      : [];
    return {
      id: method.id,
      relation: coverage?.relation ?? "unavailable",
      evidenceIds: matches.map(row => row.id),
      references: {
        meanings: method.meanings,
        rules: method.rules,
        calculations: method.calculations,
      },
    };
  });
  return {
    version: "sports-intelligence-v1",
    event: {
      id: simulation.id,
      startTime: input.startTime,
      sport: input.sport,
      location: input.location,
      teamA: input.teamA,
      teamB: input.teamB,
    },
    chart: {
      ascendant: simulation.chart.agentView.ascendantLongitude,
      sunrise: simulation.engine.cartesianChart.sunrise,
      sunriseSource: simulation.engine.cartesianChart.sunriseSource,
      provenance: simulation.engine.provenance,
      frameParity: { valid: frameParity.valid },
      mansionGeometry: simulation.chart.celestialGeometry.convergences,
    },
    canon: {
      source: guardianCanon.source,
      methods: canonMethods,
      houses: guardianCanon.meanings.houses,
      sumerian: guardianCanon.meanings.sumerian,
    },
    graph,
    baseline: {
      valid,
      winner,
      scoreA,
      scoreB,
      margin,
      reason,
      formula,
      methodCount: methods.length,
    },
    evidence,
    formulas,
    methodTraces,
    registeredMethods,
    evaluation: {
      ...evaluateEvidence(evidence),
      experimentalCrossLayer: {
        god: simulation.experimentalLayers.godView.crossLayer,
        agent: simulation.experimentalLayers.agentView.crossLayer,
      },
    },
    doctrineDifferences: [
      {
        method: "Harmonious vs friction aspects",
        difference:
          "The archived scoring formula treats conjunction as friction. Guardian synthesis treats conjunction as harmony. Use the archived score as recorded and disclose the doctrine difference.",
      },
      {
        method: "Chaldean Decans",
        difference:
          "Premium's archived scoring layer uses Chaldean faces. Guardian's elemental-family decans are a different doctrine.",
      },
      {
        method: "Fixed-star amplifications",
        difference:
          "Premium's recovered archive uses its own frozen anchors and orb; Guardian's symbolic star contacts are a separate reference.",
      },
      {
        method: "Venus eligibility",
        difference:
          "The territory Canon warning says Venus is excluded from sports scoring, while some archived core traces explicitly score Venus. Preserve the trace for each method.",
      },
      {
        method: "Translation of light",
        difference:
          "Premium records a geometric proxy. Traditional perfection needs applying and separating contacts with motion.",
      },
    ],
    conditions,
  };
}

export type SportsIntelligence = ReturnType<typeof buildSportsIntelligence>;

export function validateSportsCitations(
  packet: SportsIntelligence,
  findings: readonly { frame: Frame; method: string; evidenceIds: string[] }[]
) {
  const citations = new Map(packet.evidence.map(row => [row.id, row]));
  const edges = new Map(packet.graph.edges.map(edge => [edge.id, edge]));
  for (const finding of findings) {
    for (const id of finding.evidenceIds) {
      const row = citations.get(id);
      const edge = edges.get(id);
      if (
        edge &&
        finding.method === "chart" &&
        finding.frame !== "physical" &&
        (edge.kind === "aspect" || id.startsWith(finding.frame + ":"))
      )
        continue;
      if (
        !row ||
        row.frame !== finding.frame ||
        row.method !== finding.method ||
        row.status === "unavailable" ||
        row.status === "missing-input"
      ) {
        throw new Error(
          `SPORTS_REASONING_UNSUPPORTED_CITATION: ${id} (${finding.frame}/${finding.method})`
        );
      }
    }
  }
}
