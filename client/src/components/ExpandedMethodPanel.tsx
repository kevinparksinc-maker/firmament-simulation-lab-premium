import { useState } from "react";

export type ExpandedMethodExperimentDisplay = {
  version: string;
  status: string;
  methodCount: number;
  countedMethods: number;
  excludedMethods: number;
  voteA: number;
  voteB: number;
  winner: "A" | "B" | "TIE";
  baseline21Winner: "A" | "B" | "TIE";
  valid: boolean;
  reason: string;
  formula: string;
  requirements: { supportedHouses: number; supportedBodies: number; aspectOrbDegrees: number; scoringTraceCertified: boolean; historicalValidityCertified: boolean };
  methods: Array<{
    id: string; name: string; family: string; source: string;
    scoreGodA: number | null; scoreGodB: number | null;
    scoreAgentA: number | null; scoreAgentB: number | null;
    prediction: "A" | "B" | "TIE" | "NONE";
    vote: number; counted: boolean; status: string;
    reason: string; certification: string; calculationVersion: string; evidence: string[];
  }>;
};

export function ExpandedMethodPanel({ experiment, teamA, teamB }: {
  experiment: ExpandedMethodExperimentDisplay;
  teamA: string;
  teamB: string;
}) {
  const [showTable, setShowTable] = useState(false);
  const [expanded, setExpanded] = useState<string | null>(null);
  const sideLabel = (winner: "A" | "B" | "TIE") => winner === "A" ? teamA : winner === "B" ? teamB : "NO CALL";
  const score = (value: number | null) => value === null ? "—" : value.toFixed(3);
  return <section className="mt-4 rounded-xl border border-violet-400/30 bg-slate-950/90 p-4 md:p-6" aria-label="31 method experimental comparison">
    <div className="flex flex-wrap items-start justify-between gap-3">
      <div>
        <p className="text-xs font-bold uppercase tracking-widest text-violet-300">Research challenger · not certified</p>
        <h3 className="mt-1 text-xl font-semibold text-white">21-method baseline vs 31-line experiment</h3>
        <p className="mt-1 text-sm text-slate-300">All registered techniques appear here. Invalid/missing-input methods abstain rather than silently scoring zero.</p>
      </div>
      <span className="rounded-lg border border-violet-400/30 px-3 py-1 text-xs text-violet-200">{experiment.methodCount} method lines</span>
    </div>
    <div className="mt-4 grid grid-cols-2 gap-3 md:grid-cols-4">
      {[
        ["Original 21", sideLabel(experiment.baseline21Winner)],
        ["31-line research vote", experiment.valid ? sideLabel(experiment.winner) : "WITHHELD"],
        ["Counted", String(experiment.countedMethods)],
        ["Excluded/abstaining", String(experiment.excludedMethods)],
      ].map(([label, value]) => <div key={label} className="rounded-lg border border-white/10 bg-slate-900/70 p-3">
        <span className="block text-xs text-slate-400">{label}</span>
        <strong className="mt-2 block text-sm text-white">{value}</strong>
      </div>)}
    </div>
    <p className="mt-3 text-xs text-slate-400">Research ballots: {experiment.voteA} for {teamA}; {experiment.voteB} for {teamB}. {experiment.formula}</p>
    <p className="mt-2 text-xs text-amber-200">{experiment.reason}</p>
    <p className="mt-2 text-xs text-slate-400">Checklist inventory: {experiment.requirements.supportedHouses} houses, {experiment.requirements.supportedBodies} bodies; 5° declared orb. Per-method doctrine, complete scoring traces, and predictive validity have NOT been certified.</p>
    <button type="button" className="mt-4 w-full rounded-lg border border-violet-400/50 px-4 py-3 text-left text-sm font-semibold text-violet-100 hover:bg-violet-400/10" onClick={() => setShowTable(!showTable)} aria-expanded={showTable}>
      {showTable ? "Hide" : "Show"} all {experiment.methodCount} method statuses and exact scores
    </button>
    {showTable && <div className="mt-3 overflow-x-auto">
      <table className="w-full min-w-[860px] text-left text-xs">
        <thead><tr className="border-b border-white/20 text-slate-400"><th className="p-2">Method</th><th className="p-2">God A / B</th><th className="p-2">Agent A / B</th><th className="p-2">Cross-frame pick</th><th className="p-2">Used?</th><th className="p-2">Status</th></tr></thead>
        <tbody>{experiment.methods.map(method => <tr key={method.id} className="border-b border-white/10 align-top">
          <td className="p-2"><button type="button" className="text-left font-semibold text-violet-200 underline decoration-dotted" onClick={() => setExpanded(expanded === method.id ? null : method.id)} aria-expanded={expanded === method.id}>{method.name}</button><span className="block text-slate-400">{method.id} · {method.family}</span>
            {expanded === method.id && <div className="mt-2 max-w-lg space-y-1 whitespace-normal text-slate-300"><p>{method.reason}</p><p>Calculation version: {method.calculationVersion}; certification: {method.certification}</p>{method.evidence.map((e,i)=><p key={i}>{e}</p>)}</div>}
          </td>
          <td className="p-2 text-slate-200">{score(method.scoreGodA)} / {score(method.scoreGodB)}</td>
          <td className="p-2 text-slate-200">{score(method.scoreAgentA)} / {score(method.scoreAgentB)}</td>
          <td className="p-2 text-slate-200">{method.prediction}</td>
          <td className="p-2 text-slate-200">{method.counted ? "Yes" : "No"}</td>
          <td className="p-2 text-amber-200">{method.status}</td>
        </tr>)}</tbody>
      </table>
    </div>}
  </section>;
}
