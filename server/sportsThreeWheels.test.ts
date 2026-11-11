import { describe, expect, it } from "vitest";
import { sportsPregameEvidence, translateSportsThreeWheels } from "./masterSportsAstrologer";

const event = {
  teamA: "Dallas Cowboys", teamB: "Philadelphia Eagles", sport: "NFL" as const,
  location: "Arlington, TX", latitude: 32.7473, longitude: -97.0945,
  startTime: "2026-11-08T18:00:00Z",
};

describe("Horary-style sports three-wheel translation", () => {
  it("preserves complete original engine evidence in the translated record", () => {
    const evidence = sportsPregameEvidence(event);
    const translated = translateSportsThreeWheels(evidence);
    expect(translated.fullTechnicalEvidence).toEqual(evidence);
    expect(translated.ring1GodView.methods).toHaveLength(evidence.godView.allLayers.length);
    expect(translated.ring2AgentMoment.methods).toHaveLength(evidence.agentView.allLayers.length);
    expect(translated.ring3CrossFrame.additionalMethods).toEqual(evidence.additionalMethods);
    expect(translated.natalFoundation.present).toBe(false);
  });
  it("never allows final outcome into pregame evidence", () => {
    const a = translateSportsThreeWheels(sportsPregameEvidence({ ...event, actualWinner: "A" }));
    const b = translateSportsThreeWheels(sportsPregameEvidence({ ...event, actualWinner: "B" }));
    expect(a).toEqual(b);
  });
});
