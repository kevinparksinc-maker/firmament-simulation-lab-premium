import { describe, expect, it, vi, afterEach } from "vitest";
vi.mock("./_core/llm", () => ({ invokeLLM: vi.fn() }));
import { invokeLLM } from "./_core/llm";
import { interpretSportsEvent, sportsPregameEvidence } from "./masterSportsAstrologer";
const event = { teamA:"Dallas Cowboys",teamB:"Philadelphia Eagles",favoredTeam:"Dallas Cowboys",underdogTeam:"Philadelphia Eagles",roleAssignmentSource:"manual" as const,sport:"NFL" as const,location:"Arlington, TX",latitude:32.7473,longitude:-97.0945,startTime:"2026-11-08T18:00:00Z" };
afterEach(() => vi.clearAllMocks());
describe("complete pregame sports interpretation", () => {
  it("sends every computed core method, additional result and both charts to the interpreter", async () => {
    vi.mocked(invokeLLM).mockResolvedValue({choices:[{message:{content:"Complete sports interpretation"}}]} as any);
    const result=await interpretSportsEvent(event);
    const request=vi.mocked(invokeLLM).mock.calls[0][0];
    const payload=JSON.parse(String(request.messages[1].content).split("evidence without changing its scores:\n")[1]);
    expect(payload.godView.allLayers).toHaveLength(21);
    expect(payload.agentView.allLayers).toHaveLength(21);
    expect(payload.synthesisView.methods).toHaveLength(21);
    expect(payload.synthesisView.valid).toBe(true);
    expect(payload.chart.agentView.planets).toHaveLength(12);
    expect(payload.methodResults.godView.length).toBeGreaterThan(5);
    expect(payload.additionalMethods).toBeDefined();
    expect(payload.godView.allLayers.every((layer:any)=>layer.detail.length>0)).toBe(true);
    expect(result.interpretation).toBe("Complete sports interpretation");
  });
  it("produces identical pregame evidence regardless of supplied final winner", () => {
    expect(sportsPregameEvidence({...event,actualWinner:"A"})).toEqual(sportsPregameEvidence({...event,actualWinner:"B"}));
  });
  it("raises an explicit error instead of publishing empty generic text", async () => {
    vi.mocked(invokeLLM).mockResolvedValue({choices:[{message:{content:" "}}]} as any);
    await expect(interpretSportsEvent(event)).rejects.toThrow("SPORTS_AI_EMPTY_RESPONSE");
  });
});
