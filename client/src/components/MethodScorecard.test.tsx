import { describe, expect, it } from "vitest";
import { createElement } from "react";
import { renderToStaticMarkup } from "react-dom/server";
import { MethodScorecard } from "./MethodScorecard";
import { runSingleMethodEvent } from "../../../server/engine/isolatedMethodRunner";

const fields = [
  { id: "CORE_01", name: "Cluster territory & house-lord placement", family: "Core", kind: "core" as const },
];
const noop = () => {};
const props = {
  fields,
  signature: "event:1",
  selectedId: "CORE_01",
  expandedId: null as string | null,
  runningId: null as string | null,
  onSelect: noop, onExpand: noop, onRun: noop,
};
const fixture = {
  teamA: "Dodgers", teamB: "Giants", sport: "MLB" as const,
  location: "Los Angeles, CA", latitude: 34.0522, longitude: -118.2437,
  startTime: "2024-06-15T19:10:00.000Z",
  roleAssignmentSource: "manual" as const,
};

describe("31-method visual scorecard contract", () => {
  it("puts Method Name / God / Agent / Synthesis / Breakdown side by side with no fake scores", () => {
    const html = renderToStaticMarkup(createElement(MethodScorecard, { ...props, cache: {} }));
    for (const heading of ["Method name", "God View", "Agent View", "Synthesis", "Results breakdown"]) {
      expect(html).toContain(heading);
    }
    expect(html).toContain("Cluster territory &amp; house-lord placement");
    expect(html).toContain("Not run");
    expect(html).toContain("Run method");
    expect(html).not.toContain("76.4");
  });

  it("always preserves both raw values for equal-score ties and opens the per-frame evidence", () => {
    const original = runSingleMethodEvent(fixture, "CORE_01");
    const result = {
      ...original,
      god: { ...original.god, scoreA: 76.4, scoreB: 76.4, difference: 0, result: "EQUAL_SCORES" as const },
      agent: { ...original.agent, scoreA: 76.4, scoreB: 76.4, difference: 0, result: "EQUAL_SCORES" as const },
      combined: { ...original.combined, scoreA: 76.4, scoreB: 76.4, difference: 0, result: "EQUAL_SCORES" as const },
    };
    const html = renderToStaticMarkup(createElement(MethodScorecard, {
      ...props,
      expandedId: "CORE_01",
      cache: { CORE_01: { signature: "event:1", result } },
    }));
    expect(html).toContain("76.4");
    expect(html).toContain("Equal strength");
    expect(html).toContain("Calculation steps");
    expect(html).toContain("Geometric aspect candidates");
    expect(html).toContain("Synthesis for THIS method only");
  });

  it("does not display stale scores when fixture input signature changes", () => {
    const result = runSingleMethodEvent(fixture, "CORE_01");
    const html = renderToStaticMarkup(createElement(MethodScorecard, {
      ...props, signature: "event:2",
      cache: { CORE_01: { signature: "event:1", result } },
    }));
    expect(html).toContain("Not run");
    expect(html).toContain("Awaiting calculation");
  });
});
