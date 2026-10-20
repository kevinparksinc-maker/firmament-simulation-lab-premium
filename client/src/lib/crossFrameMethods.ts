export type MethodSide = "A" | "B" | "TIE";
export type MethodReading = {
  name: string;
  winner: MethodSide;
  scoreA: number;
  scoreB: number;
};
export type MethodComparison = {
  name: string;
  god: MethodReading | null;
  agent: MethodReading | null;
  relationship: "agreement" | "reversal" | "both-neutral" | "one-neutral" | "missing";
  godMargin: number | null;
  agentMargin: number | null;
};

const margin = (reading: MethodReading) => reading.scoreA - reading.scoreB;

/**
 * Compares recorded methods without re-running or changing their calculations.
 * Agreement reflects the same pick, NOT two independent votes or accuracy.
 */
export function compareFrameMethods(
  god: readonly MethodReading[],
  agent: readonly MethodReading[],
): MethodComparison[] {
  const agentByName = new Map(agent.map(method => [method.name, method]));
  const godByName = new Map(god.map(method => [method.name, method]));
  const names = Array.from(new Set([...god.map(method => method.name), ...agent.map(method => method.name)]));
  return names.map(name => {
    const g = godByName.get(name) ?? null;
    const a = agentByName.get(name) ?? null;
    const relationship: MethodComparison["relationship"] =
      !g || !a ? "missing"
      : g.winner === "TIE" && a.winner === "TIE" ? "both-neutral"
      : g.winner === "TIE" || a.winner === "TIE" ? "one-neutral"
      : g.winner === a.winner ? "agreement" : "reversal";
    return {
      name, god: g, agent: a, relationship,
      godMargin: g ? margin(g) : null,
      agentMargin: a ? margin(a) : null,
    };
  });
}

export function summarizeMethodComparison(rows: readonly MethodComparison[]) {
  return {
    compared: rows.filter(row => row.relationship !== "missing").length,
    agreements: rows.filter(row => row.relationship === "agreement").length,
    reversals: rows.filter(row => row.relationship === "reversal").length,
    neutral: rows.filter(row => row.relationship === "both-neutral" || row.relationship === "one-neutral").length,
    missing: rows.filter(row => row.relationship === "missing").length,
  };
}
