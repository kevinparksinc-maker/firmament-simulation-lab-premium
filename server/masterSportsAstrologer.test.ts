import { afterEach, describe, expect, it, vi } from "vitest";
vi.mock("./_core/llm", () => ({ invokeLLM: vi.fn() }));
import { invokeLLM } from "./_core/llm";
import { interpretSportsEvent } from "./masterSportsAstrologer";
import {
  validateAnalystJudgment,
  type AnalystJudgment,
  type SportsAdjudication,
} from "./engine/sportsAdjudication";

const event = {
  teamA: "Dallas Cowboys",
  teamB: "Philadelphia Eagles",
  sport: "NFL" as const,
  location: "Arlington, TX",
  latitude: 32.7473,
  longitude: -97.0945,
  startTime: "2026-11-08T18:00:00Z",
};

function reply(packet: SportsAdjudication): AnalystJudgment {
  const support = (side: "ASC" | "DSC") =>
    packet.evidence
      .filter(row => row.side === side || row.side === "BOTH")
      .slice(0, 2)
      .map(row => ({ evidenceId: row.id, claim: row.significance }));
  return {
    predictedWinner: "NO_PICK",
    confidence: 0.4,
    ascCase: support("ASC"),
    dscCase: support("DSC"),
    contradictionsAddressed: packet.contradictions.map(row => ({
      contradictionId: row.id,
      resolution: row.ruleId ? "rule" : "judgment",
      citedRuleId: row.ruleId,
      reasoning: row.nature.slice(0, 340),
    })),
    decisiveFactor: null,
    opposingEvidence: null,
    confidenceBasis: "Mixed testimony limits directional confidence.",
  };
}

function mockResponse(
  change: (judgment: AnalystJudgment) => AnalystJudgment = value => value
) {
  vi.mocked(invokeLLM).mockImplementation(async request => {
    const packet = JSON.parse(
      String(request.messages[1].content)
    ) as SportsAdjudication;
    return {
      id: "mock",
      created: 0,
      model: "gemini-test",
      usage: {
        prompt_tokens: 2800,
        completion_tokens: 530,
        total_tokens: 3330,
      },
      choices: [
        {
          index: 0,
          finish_reason: "STOP",
          message: {
            role: "assistant",
            content: JSON.stringify(change(reply(packet))),
          },
        },
      ],
    };
  });
}
afterEach(() => vi.resetAllMocks());

describe("sports analyst", () => {
  it("sends evaluated, deduplicated chains and records one validated independent judgment", async () => {
    mockResponse();
    const result = await interpretSportsEvent({ ...event, actualWinner: "A" });
    expect(invokeLLM).toHaveBeenCalledTimes(1);
    const request = vi.mocked(invokeLLM).mock.calls[0][0];
    expect(request.singleAttempt).toBe(true);
    const payload = String(request.messages[1].content);
    expect(payload).not.toMatch(
      /actualWinner|methodTraces|guardianCanon|traditionalTitle|cartesianChart|fullTechnicalEvidence/
    );
    expect(Buffer.byteLength(payload)).toBeLessThan(20_000);
    const packet = result.analyst;
    expect(new Set(packet.evidence.map(row => row.chain.planet)).size).toBe(
      packet.evidence.length
    );
    expect(
      packet.evidence.find(row => row.chain.planet === "Saturn")
    ).toMatchObject({
      tier: 1,
      side: "BOTH",
      chain: { rulesHouses: [1, 12], occupiesHouse: 3 },
    });
    expect(
      packet.evidence.find(row => row.chain.planet === "Moon")
    ).toMatchObject({
      side: "ASC",
      chain: { rulesHouses: [6], occupiesHouse: 10 },
    });
    expect(packet.contradictions.length).toBeGreaterThan(0);
    expect(result.analystAudit.status).toBe("accepted");
    expect(result.analystAudit.usage?.prompt_tokens).toBe(2800);
    expect(result.analystAudit.metrics?.contradictionsAddressed).toBe(
      packet.contradictions.length
    );
    expect(result.interpretation).toContain("[EV-");
  });

  it("falls back after invalid citations and never sends a repair call", async () => {
    mockResponse(judgment => ({
      ...judgment,
      ascCase: [
        { evidenceId: "EV-999", claim: "Invalid evidence" },
        ...judgment.ascCase.slice(1),
      ],
    }));
    const result = await interpretSportsEvent(event);
    expect(invokeLLM).toHaveBeenCalledTimes(1);
    expect(result.judgment).toBeNull();
    expect(result.prediction.source).toBe("deterministic_evaluator");
    expect(result.analystAudit.failureCode).toBe(
      "SPORTS_ANALYST_UNSUPPORTED_CITATION"
    );
  });

  it("requires all contradictions and validates admissible rule IDs", async () => {
    mockResponse();
    const { analyst } = await interpretSportsEvent(event);
    const valid = reply(analyst);
    expect(() =>
      validateAnalystJudgment(analyst, {
        ...valid,
        contradictionsAddressed: [],
      })
    ).toThrow("SPORTS_ANALYST_MISSING_CONTRADICTIONS");
    const [first, ...rest] = valid.contradictionsAddressed;
    expect(() =>
      validateAnalystJudgment(analyst, {
        ...valid,
        contradictionsAddressed: [
          { ...first, resolution: "rule", citedRuleId: "UNKNOWN" },
          ...rest,
        ],
      })
    ).toThrow("SPORTS_ANALYST_UNSUPPORTED_RULE");
    expect(
      validateAnalystJudgment(analyst, { ...valid, confidence: 0.99 }).metrics
        .confidenceOutsideBand
    ).toBe(true);
  });

  it("returns the local result after a provider failure", async () => {
    vi.mocked(invokeLLM).mockRejectedValue(new Error("provider unavailable"));
    const result = await interpretSportsEvent(event);
    expect(invokeLLM).toHaveBeenCalledTimes(1);
    expect(result.analystAudit.status).toBe("provider");
    expect(result.prediction.source).toBe("deterministic_evaluator");
  });
});
