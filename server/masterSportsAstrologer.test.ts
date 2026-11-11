import { describe, expect, it, vi, afterEach } from "vitest";
vi.mock("./_core/llm", () => ({ invokeLLM: vi.fn() }));
import { invokeLLM } from "./_core/llm";
import { interpretSportsEvent, sportsPregameEvidence } from "./masterSportsAstrologer";
const event = { teamA:"Dallas Cowboys",teamB:"Philadelphia Eagles",favoredTeam:"Dallas Cowboys",underdogTeam:"Philadelphia Eagles",roleAssignmentSource:"manual" as const,sport:"NFL" as const,location:"Arlington, TX",latitude:32.7473,longitude:-97.0945,startTime:"2026-11-08T18:00:00Z" };
afterEach(() => vi.clearAllMocks());
describe("complete pregame sports interpretation", () => {
  it("sends every computed core method, additional result and both charts to the interpreter", async () => {
    const evidence = sportsPregameEvidence(event);
    const baseline = evidence.synthesisView;
    const selectedSide = baseline.winner === "TIE" ? "NO_PICK" : baseline.winner;
    const judgment = { selectedSide, reasoning: "The computed evidence supports this interpretation across the complete God and Agent views. Both sides have competing testimony, but the stronger cross-frame indications determine the final judgment rather than a single score.", decisiveEvidence: [{frame:"god",method:"chart",finding:"The complete God View is available for interpretation."}], opposingEvidence:"The opposing side has relevant indications that require consideration.",missingInformation:[],confidence:"low",baselineAgreement:"agree" };
    vi.mocked(invokeLLM).mockResolvedValue({model:"gemini-test",choices:[{message:{content:JSON.stringify(judgment)}}]} as any);
    const result=await interpretSportsEvent(event);
    const request=vi.mocked(invokeLLM).mock.calls[0][0];
    const payload=JSON.parse(String(request.messages[1].content).split("evidence without changing its scores:\n")[1]);
    expect(original.godView.allLayers).toHaveLength(21);
    expect(original.agentView.allLayers).toHaveLength(21);
    expect(original.synthesisView.methods).toHaveLength(21);
    expect(original.synthesisView.valid).toBe(true);
    expect(original.chart.agentView.planets).toHaveLength(12);
    expect(original.methodResults.godView.length).toBeGreaterThan(5);
    expect(original.additionalMethods).toBeDefined();
    expect(payload.godView.allLayers.every((layer:any)=>layer.detail.length>0)).toBe(true);
    expect(result.interpretation).toBe(judgment.reasoning);
    expect(result.modelProvenance.model).toBe("gemini-test");
  });
  it("produces identical pregame evidence regardless of supplied final winner", () => {
    expect(sportsPregameEvidence({...event,actualWinner:"A"})).toEqual(sportsPregameEvidence({...event,actualWinner:"B"}));
  });
  it("raises an explicit error instead of publishing empty generic text", async () => {
    vi.mocked(invokeLLM).mockResolvedValue({choices:[{message:{content:" "}}]} as any);
    await expect(interpretSportsEvent(event)).rejects.toThrow("SPORTS_AI_EMPTY_RESPONSE");
  });
});
