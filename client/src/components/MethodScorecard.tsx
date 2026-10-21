import { Fragment, useState } from "react";
import type { SingleMethodEventResult, SingleMethodFrame } from "../../../server/engine/isolatedMethodRunner";

export type ScorecardMethodField = {
  id: string;
  name: string;
  family: string;
  kind: "core" | "registry";
};

export type ScorecardCache = Record<string, {
  signature: string;
  result: SingleMethodEventResult;
}>;

type ScorecardProps = {
  fields: readonly ScorecardMethodField[];
  cache: ScorecardCache;
  signature: string;
  selectedId: string;
  expandedId: string | null;
  runningId: string | null;
  onSelect: (id: string) => void;
  onExpand: (id: string) => void;
  onRun: (id: string) => void;
};

function formatScore(value: number | null) {
  if (value === null || !Number.isFinite(value)) return "—";
  return Number(value.toFixed(5)).toString();
}

function briefStatus(value: string) {
  switch (value) {
    case "A": return "Ascendant leads";
    case "B": return "Descendant leads";
    case "EQUAL_SCORES": return "Equal strength";
    case "NO_QUALIFYING_CONDITION": return "No trigger";
    case "ZERO_NET_UNRESOLVED": return "Unresolved zero net";
    case "MISSING_INPUT": return "Missing inputs";
    case "EVIDENCE_ONLY": return "Evidence only";
    default: return value;
  }
}

function ScoreCell({ frame }: { frame?: Pick<SingleMethodFrame, "scoreA" | "scoreB" | "difference" | "result"> }) {
  if (!frame) return <span className="text-slate-500">Not run</span>;
  return <div className="min-w-[126px] space-y-1">
    <div className="flex items-baseline justify-between gap-2"><span className="text-xs text-slate-400">A</span><strong className="font-mono text-sm tabular-nums text-white">{formatScore(frame.scoreA)}</strong></div>
    <div className="flex items-baseline justify-between gap-2"><span className="text-xs text-slate-400">B</span><strong className="font-mono text-sm tabular-nums text-white">{formatScore(frame.scoreB)}</strong></div>
    <div className="border-t border-white/10 pt-1 text-xs text-cyan-200">{briefStatus(frame.result)}{frame.difference === null ? "" : ` · Δ ${formatScore(frame.difference)}`}</div>
  </div>;
}

function FrameBreakdown({ frame }: { frame: SingleMethodFrame }) {
  return <div className="min-w-0 rounded-xl border border-white/10 bg-slate-950/70 p-4">
    <h4 className="font-semibold text-cyan-200">{frame.frame}</h4>
    <div className="mt-2 flex flex-wrap items-baseline gap-x-5 gap-y-1 font-mono text-sm text-white">
      <span>A: {formatScore(frame.scoreA)}</span>
      <span>B: {formatScore(frame.scoreB)}</span>
      <span>Δ: {formatScore(frame.difference)}</span>
    </div>
    <p className="mt-2 text-sm text-amber-200">{briefStatus(frame.result)}</p>
    <dl className="mt-4 space-y-2 text-xs text-slate-300">
      <div><dt className="font-semibold text-slate-100">Formula / scoring rule</dt><dd className="mt-1 break-words">{frame.formula}</dd></div>
      <div><dt className="font-semibold text-slate-100">Execution scope</dt><dd className="mt-1">{frame.completeness}</dd></div>
    </dl>
    <details className="mt-3 rounded-lg border border-white/10 p-3">
      <summary className="cursor-pointer text-sm font-medium text-cyan-200">Scored inputs and calculations ({frame.inputs.length} inputs, {frame.steps.length} steps)</summary>
      <div className="mt-3 max-h-72 space-y-1 overflow-y-auto text-xs text-slate-300">
        <p className="font-semibold text-slate-200">Inputs</p>
        {frame.inputs.length ? frame.inputs.map((item, index) => <p key={`i-${index}`} className="break-words">{index + 1}. {item}</p>) : <p>No scored-input trace supplied. Certification remains incomplete.</p>}
        <p className="pt-3 font-semibold text-slate-200">Calculation steps</p>
        {frame.steps.length ? frame.steps.map((item, index) => <p key={`s-${index}`} className="break-words">{index + 1}. {item}</p>) : <p>Individual scoring steps are not supplied by this method yet.</p>}
        <p className="pt-3 font-semibold text-slate-200">Other evidence</p>
        {frame.evidence.map((item, index) => <p key={`e-${index}`} className="break-words">{item}</p>)}
      </div>
    </details>
    <details className="mt-2 rounded-lg border border-white/10 p-3">
      <summary className="cursor-pointer text-sm font-medium text-cyan-200">All houses, planets, and qualifying aspects</summary>
      <div className="mt-3 space-y-3 text-xs text-slate-300">
        <div className="grid gap-1 sm:grid-cols-2">
          {frame.chart.houses.map(house => <p key={house.house}>
            <strong>H{house.house} · {house.side}</strong> — {house.occupants.join(", ") || "Unoccupied"}
          </p>)}
        </div>
        <div className="border-t border-white/10 pt-2">
          <p className="mb-2 font-semibold text-slate-100">Body positions ({frame.chart.bodies.length})</p>
          {frame.chart.bodies.map(body => <p key={body.planet}>{body.planet}: {body.longitude.toFixed(3)}° · {body.sign} · H{body.house} · {body.nakshatra} · {body.manzil ?? "Manzil unavailable"} · decan {body.decan}</p>)}
        </div>
        <div className="border-t border-white/10 pt-2">
          <p className="mb-2 font-semibold text-slate-100">Geometric aspect candidates ({frame.chart.aspects.length})</p>
          {frame.chart.aspects.length ? frame.chart.aspects.map((aspect, index) => <p key={index}>{aspect.left} / {aspect.right} · {aspect.kind} · orb {aspect.orb.toFixed(3)}° · H{aspect.leftHouse} / H{aspect.rightHouse} · {aspect.crossSide ? "cross-side" : "same-side"}</p>) : <p>No qualifying major planet-pair aspects within the recorded 5° range.</p>}
        </div>
        <p className="text-amber-200">The chart inventory is context. It does not itself certify that every item contributed to this method's score.</p>
      </div>
    </details>
  </div>;
}

export function MethodScorecard({ fields, cache, signature, selectedId, expandedId, runningId, onSelect, onExpand, onRun }: ScorecardProps) {
  const [filter, setFilter] = useState<"all" | "tested" | "not-run" | "needs-review">("all");
  const current = (id: string) => cache[id]?.signature === signature ? cache[id].result : undefined;
  const completed = fields.filter(field => current(field.id)).length;
  const flagged = fields.filter(field => {
    const result = current(field.id);
    return Boolean(result && (result.frameMethodStatus !== "READY_FOR_EXPERIMENT" || ["MISSING_INPUT", "ZERO_NET_UNRESOLVED", "NO_QUALIFYING_CONDITION"].includes(result.combined.result)));
  }).length;
  const rows = fields.filter(field => {
    const result = current(field.id);
    return filter === "all" || filter === "tested" && Boolean(result) ||
      filter === "not-run" && !result || filter === "needs-review" && Boolean(result && (result.frameMethodStatus !== "READY_FOR_EXPERIMENT" || result.combined.result === "ZERO_NET_UNRESOLVED" || result.combined.result === "MISSING_INPUT"));
  });
  return <section className="mt-5 rounded-xl border border-cyan-400/30 bg-slate-900/60 p-3 sm:p-4" aria-label="Independent method scorecard">
    <div className="flex flex-wrap items-start justify-between gap-3">
      <div>
        <h3 className="text-xl font-semibold text-white">31-method comparison scorecard</h3>
        <p className="mt-1 max-w-3xl text-sm text-slate-300">One method per row. Each Run button tests only that method in God View and Agent View. Synthesis combines those two views of the <strong>same method</strong>, never scores from other rows.</p>
      </div>
      <div className="flex gap-2">
        <div className="rounded-lg border border-white/10 px-3 py-2 text-center"><strong className="block text-lg text-white">{completed}/{fields.length}</strong><span className="text-xs text-slate-400">tested</span></div>
        <div className="rounded-lg border border-amber-400/20 px-3 py-2 text-center"><strong className="block text-lg text-amber-200">{flagged}</strong><span className="text-xs text-slate-400">flagged</span></div>
      </div>
    </div>
    <div className="mt-4 flex flex-wrap gap-2" aria-label="Filter method scorecard">
      {([["all","All 31"],["tested","Tested"],["not-run","Not tested"],["needs-review","Needs review"]] as const).map(([value,label]) =>
        <button type="button" key={value} onClick={() => setFilter(value)} aria-pressed={filter === value}
          className={`rounded-full border px-3 py-1.5 text-xs font-medium ${filter === value ? "border-cyan-300 bg-cyan-400/15 text-cyan-100" : "border-slate-600 text-slate-300 hover:border-slate-400"}`}>{label}</button>)}
    </div>
    <p className="mt-3 text-xs text-slate-400">A = Ascendant side; B = Descendant side. Δ = A minus B. A displayed 0 is an actual score, not a placeholder. Not run, no trigger, missing input, and equal strength are different conditions.</p>
    <div className="mt-3 space-y-3 lg:hidden" aria-label="Mobile method scorecards">
      {rows.map(field => {
        const result = current(field.id), open = expandedId === field.id, busy = runningId === field.id;
        return <article key={field.id} className={`rounded-xl border p-3 ${selectedId === field.id ? "border-cyan-300/70 bg-cyan-400/10" : "border-slate-700 bg-slate-950/70"}`}>
          <button type="button" onClick={() => onSelect(field.id)} className="w-full text-left">
            <h4 className="text-sm font-semibold text-white">{field.name}</h4>
            <p className="mt-1 text-xs text-slate-400">{field.id} · {field.family}</p>
          </button>
          <div className="mt-3 grid grid-cols-2 gap-2">
            <div className="rounded-lg border border-white/10 p-3">
              <p className="mb-2 text-xs font-bold uppercase text-cyan-200">God View</p><ScoreCell frame={result?.god}/>
            </div>
            <div className="rounded-lg border border-white/10 p-3">
              <p className="mb-2 text-xs font-bold uppercase text-cyan-200">Agent View</p><ScoreCell frame={result?.agent}/>
            </div>
            <div className="col-span-2 rounded-lg border border-violet-400/25 p-3">
              <p className="mb-2 text-xs font-bold uppercase text-violet-200">Synthesis · this method only</p><ScoreCell frame={result?.combined}/>
            </div>
          </div>
          <div className="mt-3 flex flex-wrap gap-2">
            <button type="button" onClick={() => onRun(field.id)} disabled={runningId !== null}
              className="rounded-lg bg-cyan-400 px-3 py-2 text-xs font-bold text-slate-950 disabled:opacity-50">{busy ? "Calculating…" : result ? "Rerun method" : "Run method"}</button>
            {result && <button type="button" aria-expanded={open} onClick={() => onExpand(field.id)}
              className="rounded-lg border border-slate-500 px-3 py-2 text-xs text-white">{open ? "Hide breakdown" : "View breakdown"}</button>}
          </div>
          {result && open && <div className="mt-4 space-y-3">
            <p className="text-xs text-amber-200">{result.frameMethodStatus.replaceAll("_"," ")} · {result.comparison.replaceAll("_"," ")} · NOT CERTIFIED</p>
            <FrameBreakdown frame={result.god}/>
            <FrameBreakdown frame={result.agent}/>
            <div className="rounded-lg border border-violet-400/20 p-3">
              <h5 className="text-sm font-semibold text-violet-200">Within-method synthesis</h5>
              <p className="mt-2 font-mono text-xs text-white">A {formatScore(result.combined.scoreA)} · B {formatScore(result.combined.scoreB)} · Δ {formatScore(result.combined.difference)}</p>
              <p className="mt-2 text-xs text-amber-200">{briefStatus(result.combined.result)}</p>
              <p className="mt-2 text-xs text-slate-300">{result.combined.calculation}</p>
            </div>
          </div>}
        </article>;
      })}
    </div>
    <div className="mt-3 hidden overflow-x-auto rounded-lg border border-white/10 lg:block">
      <table className="w-full min-w-[990px] table-fixed border-collapse text-left text-sm">
        <colgroup><col style={{ width: "27%" }}/><col style={{ width: "18%" }}/><col style={{ width: "18%" }}/><col style={{ width: "18%" }}/><col style={{ width: "19%" }}/></colgroup>
        <thead className="sticky top-0 z-10 bg-slate-800 text-xs uppercase tracking-wide text-slate-200">
          <tr>
            <th scope="col" className="border-b border-white/15 p-3">Method name</th>
            <th scope="col" className="border-b border-white/15 p-3">God View</th>
            <th scope="col" className="border-b border-white/15 p-3">Agent View</th>
            <th scope="col" className="border-b border-white/15 p-3">Synthesis</th>
            <th scope="col" className="border-b border-white/15 p-3">Results breakdown</th>
          </tr>
        </thead>
        <tbody>
          {rows.map((field, index) => {
            const result = current(field.id), open = expandedId === field.id;
            const isRunning = runningId === field.id;
            return <Fragment key={field.id}>
              <tr className={`border-b border-white/10 align-middle ${selectedId === field.id ? "bg-cyan-400/10" : index % 2 ? "bg-white/[0.025]" : "bg-slate-950/30"}`}>
                <th scope="row" className="p-3 align-middle">
                  <button className="text-left" type="button" onClick={() => onSelect(field.id)} aria-pressed={selectedId === field.id}>
                    <span className="font-semibold text-white">{field.name}</span>
                    <span className="mt-1 block text-xs font-normal text-slate-400">{String(fields.indexOf(field) + 1).padStart(2,"0")} · {field.family} · {field.id}</span>
                  </button>
                </th>
                <td className="border-l border-white/5 p-3"><ScoreCell frame={result?.god}/></td>
                <td className="border-l border-white/5 p-3"><ScoreCell frame={result?.agent}/></td>
                <td className="border-l border-white/5 p-3"><ScoreCell frame={result?.combined}/></td>
                <td className="border-l border-white/5 p-3">
                  <div className="flex flex-col items-start gap-1.5">
                    <button type="button" onClick={() => onRun(field.id)} disabled={runningId !== null}
                      className="w-full rounded-md bg-cyan-500 px-3 py-2 text-xs font-semibold text-slate-950 disabled:opacity-50">
                      {isRunning ? "Calculating…" : result ? "Rerun method" : "Run method"}
                    </button>
                    {result ? <button type="button" onClick={() => onExpand(field.id)} aria-expanded={open}
                      className="w-full rounded-md border border-slate-500 px-3 py-2 text-xs font-medium text-slate-100 hover:border-cyan-300">
                      {open ? "Hide breakdown ↑" : "View breakdown ↓"}
                    </button> : <span className="text-xs text-slate-500">Awaiting calculation</span>}
                    {result && <span className={`text-xs font-semibold ${result.frameMethodStatus === "READY_FOR_EXPERIMENT" ? "text-cyan-200" : "text-amber-200"}`}>{result.frameMethodStatus.replaceAll("_", " ")}</span>}
                  </div>
                </td>
              </tr>
              {result && open && <tr className="border-b border-cyan-400/25 bg-slate-900">
                <td colSpan={5} className="p-4 sm:p-5">
                  <div className="mb-4 flex flex-wrap items-center justify-between gap-3">
                    <div><h4 className="text-lg font-semibold text-white">{field.name} — calculation breakdown</h4>
                      <p className="mt-1 text-xs text-slate-400">Comparison with actual outcome: {result.comparison.replaceAll("_"," ")} · {result.certification.replaceAll("_"," ")} · Ascendant: {result.agentAscendantModelVersion.replaceAll("_"," ")} · Houses: {result.wheelGeometryVersion.replaceAll("_"," ")}</p></div>
                    <span className="rounded-lg border border-amber-400/30 px-3 py-2 text-xs font-semibold text-amber-200">{result.frameMethodStatus.replaceAll("_"," ")}</span>
                  </div>
                  <div className="grid gap-3 xl:grid-cols-2">
                    <FrameBreakdown frame={result.god}/>
                    <FrameBreakdown frame={result.agent}/>
                  </div>
                  <div className="mt-3 rounded-lg border border-violet-400/25 p-4">
                    <h4 className="font-semibold text-violet-200">Synthesis for THIS method only</h4>
                    <p className="mt-2 font-mono text-sm text-white">A {formatScore(result.combined.scoreA)} · B {formatScore(result.combined.scoreB)} · Δ {formatScore(result.combined.difference)}</p>
                    <p className="mt-1 text-sm text-amber-200">{briefStatus(result.combined.result)}</p>
                    <p className="mt-2 text-xs text-slate-300">{result.combined.calculation}</p>
                <p className="mt-2 text-xs text-cyan-200">Ascendant model: {result.agentAscendantModelVersion.replaceAll("_"," ")}</p>
                    {result.methodologyNotes.map((note, i) => <p key={i} className="mt-2 text-xs text-amber-200">{note}</p>)}
                  </div>
                </td>
              </tr>}
            </Fragment>;
          })}
        </tbody>
      </table>
      {!rows.length && <p className="p-4 text-sm text-slate-300">No methods match this filter for the current game inputs.</p>}
    </div>
    <p className="mt-3 text-xs text-slate-400">This is a research interface, not a claim that these methods have been validated for sports prediction. Test statuses reset when event inputs change so old scores are never shown as if they belong to a new game.</p>
  </section>;
}
