import { afterEach, describe, expect, it, vi } from "vitest";
vi.mock("./_core/llm", () => ({ invokeLLM: vi.fn() }));
import { invokeLLM } from "./_core/llm";
import {
  interpretSportsEvent,
  sportsPregameEvidence,
} from "./masterSportsAstrologer";
import { validateSportsCitations } from "./engine/sportsIntelligence";
import { METHOD_REGISTRY } from "./engine/methodRegistry";

const event = {
  teamA: "Dallas Cowboys",
  teamB: "Philadelphia Eagles",
  favoredTeam: "Dallas Cowboys",
  underdogTeam: "Philadelphia Eagles",
  roleAssignmentSource: "manual" as const,
  sport: "NFL" as const,
  location: "Arlington, TX",
  latitude: 32.7473,
  longitude: -97.0945,
  startTime: "2026-11-08T18:00:00Z",
};

const judgment = {
  selectedSide: "NO_PICK",
  baselineAgreement: "disagree",
  reasoning:
    "Both frames have competing testimony. The local ledger supports the official side arithmetically, but the relationship evidence leaves room for an independent no-pick conclusion.",
  decisiveEvidence: [
    {
      frame: "god",
      method: "chart",
      finding: "The God View placement is available.",
      evidenceIds: ["god:occupancy:Sun"],
    },
  ],
  opposingEvidence:
    "The opposing side has relevant indications that require consideration.",
  missingInformation: [],
  confidence: "low",
};

function mockJudgment(value: unknown) {
  vi.mocked(invokeLLM).mockResolvedValue({
    id: "mock",
    created: 0,
    model: "gemini-test",
    choices: [
      {
        index: 0,
        finish_reason: "STOP",
        message: { role: "assistant", content: JSON.stringify(value) },
      },
    ],
  });
}

afterEach(() => vi.clearAllMocks());

describe("complete pregame sports interpretation", () => {
  it("makes one reasoning call with a compact, complete method roster and traceable graph", async () => {
    const original = sportsPregameEvidence(event);
    const baseline = original.synthesisView;
    const response = {
      ...judgment,
      baselineAgreement: baseline.winner === "TIE" ? "agree" : "disagree",
    };
    mockJudgment(response);
    const result = await interpretSportsEvent({ ...event, actualWinner: "A" });
    expect(invokeLLM).toHaveBeenCalledTimes(1);
    const request = vi.mocked(invokeLLM).mock.calls[0][0];
    expect(request.singleAttempt).toBe(true);
    const message = String(request.messages[1].content);
    const payload = JSON.parse(
      message.slice(message.indexOf("\n") + 1)
    ) as typeof result.intelligence;
    expect(message).not.toMatch(/actualWinner|Hit\/miss test:/);
    expect(message.length).toBeLessThan(
      JSON.stringify(result.threeWheels).length
    );
    expect(payload.evidence.filter(row => row.kind === "core")).toHaveLength(
      63
    );
    expect(
      payload.evidence.filter(row => row.kind === "registered")
    ).toHaveLength(METHOD_REGISTRY.length * 2 + 3);
    expect(
      payload.evidence.filter(row => row.kind === "experimental")
    ).toHaveLength(8);
    expect(payload.canon.methods).toHaveLength(20);
    expect(
      payload.canon.methods.find(row => row.id === "vedic-shadbala")?.relation
    ).toBe("unavailable");
    expect(
      payload.canon.methods.find(row => row.id === "elemental-decans")?.relation
    ).toBe("variant");
    expect(payload.graph.bodies).toHaveLength(12);
    expect(payload.graph.houses).toHaveLength(24);
    expect(
      payload.graph.edges.filter(edge => edge.kind === "rules")
    ).toHaveLength(12);
    expect(
      payload.graph.edges.filter(edge => edge.kind === "occupies")
    ).toHaveLength(24);
    expect(
      payload.graph.edges.filter(edge => edge.kind === "aspect").length
    ).toBeGreaterThan(0);
    expect(payload.evaluation.crossFrameContradictions.length).toBeGreaterThan(
      0
    );
    for (const conflict of payload.evaluation.crossFrameContradictions) {
      expect(
        payload.evidence.find(row => row.id === conflict.god)?.winner
      ).not.toBe(
        payload.evidence.find(row => row.id === conflict.agent)?.winner
      );
    }
    expect(result.baseline).toMatchObject({
      winner: baseline.winner,
      scoreA: baseline.scoreA,
      scoreB: baseline.scoreB,
    });
    expect(result.interpretation).toBe(judgment.reasoning);
    expect(result.modelProvenance.model).toBe("gemini-test");
    expect(() =>
      validateSportsCitations(payload, [
        { frame: "agent", method: "chart", evidenceIds: ["god:occupancy:Sun"] },
      ])
    ).toThrow("SPORTS_REASONING_UNSUPPORTED_CITATION");
    expect(() =>
      validateSportsCitations(payload, [
        {
          frame: "agent",
          method: "NATAL_VIMSHOTTARI_V1",
          evidenceIds: ["agent:registered:NATAL_VIMSHOTTARI_V1"],
        },
      ])
    ).toThrow("SPORTS_REASONING_UNSUPPORTED_CITATION");
  });

  it("produces identical pregame evidence regardless of supplied final winner", () => {
    expect(sportsPregameEvidence({ ...event, actualWinner: "A" })).toEqual(
      sportsPregameEvidence({ ...event, actualWinner: "B" })
    );
  });

  it("rejects unsupported citations after the first call without a repair request", async () => {
    const baseline = sportsPregameEvidence(event).synthesisView;
    mockJudgment({
      ...judgment,
      baselineAgreement: baseline.winner === "TIE" ? "agree" : "disagree",
      decisiveEvidence: [
        { ...judgment.decisiveEvidence[0], evidenceIds: ["fabricated-id"] },
      ],
    });
    await expect(interpretSportsEvent(event)).rejects.toThrow(
      "SPORTS_REASONING_UNSUPPORTED_CITATION"
    );
    expect(invokeLLM).toHaveBeenCalledTimes(1);
  });

  it("raises an explicit error instead of publishing empty generic text", async () => {
    vi.mocked(invokeLLM).mockResolvedValue({
      id: "mock",
      created: 0,
      model: "gemini-test",
      choices: [
        {
          index: 0,
          finish_reason: "STOP",
          message: { role: "assistant", content: " " },
        },
      ],
    });
    await expect(interpretSportsEvent(event)).rejects.toThrow(
      "SPORTS_AI_EMPTY_RESPONSE"
    );
    expect(invokeLLM).toHaveBeenCalledTimes(1);
  });
});
