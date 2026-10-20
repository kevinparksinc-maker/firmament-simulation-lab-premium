import { useState } from "react";
import { trpc } from "@/lib/trpc";
import type { SingleMethodEventResult } from "../../../server/engine/isolatedMethodRunner";

type Props = { runId: number; methodId: string; runStatus: string };

const numberOrDash = (value: number | null | undefined) =>
  value === null || value === undefined || !Number.isFinite(value) ? "—" : Number(value.toFixed(5)).toString();

function Scores({ scoreA, scoreB, result }: {
  scoreA?: number | null; scoreB?: number | null; result?: string | null;
}) {
  if (scoreA === undefined && scoreB === undefined) return <span className="text-slate-500">No recorded score</span>;
  return <div className="font-mono text-xs text-white">
    <div>A: {numberOrDash(scoreA)}</div>
    <div>B: {numberOrDash(scoreB)}</div>
    <div className="mt-1 font-sans text-xs text-cyan-200">{result?.replaceAll("_"," ") ?? "Unclassified"}</div>
  </div>;
}

export function BatchGameResultsPanel({ runId, methodId, runStatus }: Props) {
  const [page, setPage] = useState(0);
  const [detailId, setDetailId] = useState<number | null>(null);
  const perPage = 20;
  const done = ["complete", "partial", "failed"].includes(runStatus);
  const rows = trpc.runs.entries.useQuery(
    { runId, offset: page * perPage, limit: perPage },
    { refetchInterval: done ? false : 3000 },
  );
  const detail = trpc.runs.entry.useQuery({ runId, resultId: detailId ?? 1 }, { enabled: detailId !== null });
  const result = detail.data?.output as SingleMethodEventResult | null | undefined;
  const showDetail = result && result.version === "SINGLE_METHOD_RESEARCH_V1";
  const processed = (rows.data?.completed ?? 0) + (rows.data?.failed ?? 0);
  const maxPages = Math.max(1, Math.ceil(processed / perPage));

  return <section className="mt-5 rounded-xl border border-cyan-400/20 bg-slate-950/75 p-3 sm:p-4" aria-label="Game-by-game method results">
    <h4 className="text-lg font-semibold text-white">Game-by-game breakdown · {methodId}</h4>
    <p className="mt-1 text-xs text-slate-300">These rows are individual saved game calculations, not averages disguised as game results. Open any row for its original raw scores, formula, and supporting evidence.</p>
    {rows.error && <p role="alert" className="mt-2 text-red-300">{rows.error.message}</p>}
    <div className="mt-3 overflow-x-auto rounded-lg border border-white/10">
      <table className="w-full min-w-[850px] text-left text-xs">
        <thead className="bg-slate-800 text-slate-200">
          <tr>
            <th scope="col" className="p-3">Game / event time</th>
            <th scope="col" className="p-3">God View · A/B</th>
            <th scope="col" className="p-3">Agent View · A/B</th>
            <th scope="col" className="p-3">Synthesis · A/B</th>
            <th scope="col" className="p-3">Result / actual</th>
            <th scope="col" className="p-3">Inspection</th>
          </tr>
        </thead>
        <tbody>
          {(rows.data?.rows ?? []).map((row, index) => <tr key={row.id} className={`border-t border-white/10 align-top ${index % 2 ? "bg-white/[0.025]" : ""}`}>
            <td className="p-3"><strong className="text-white">{row.fixture?.teamA ?? "Game"} vs {row.fixture?.teamB ?? "unknown"}</strong><span className="mt-1 block text-slate-400">{row.fixture?.startTime ? new Date(row.fixture.startTime).toLocaleString() : `Event #${row.eventId}`}</span></td>
            <td className="p-3"><Scores scoreA={row.god?.scoreA} scoreB={row.god?.scoreB} result={row.god?.result}/></td>
            <td className="p-3"><Scores scoreA={row.agent?.scoreA} scoreB={row.agent?.scoreB} result={row.agent?.result}/></td>
            <td className="p-3"><Scores scoreA={row.combined?.scoreA} scoreB={row.combined?.scoreB} result={row.combined?.result}/></td>
            <td className="p-3"><span className="font-semibold text-amber-200">{row.comparison?.replaceAll("_"," ") ?? row.status}</span><span className="mt-1 block text-slate-400">Actual: {row.actualWinner ?? "Unknown"}</span>{row.errorMessage && <p className="mt-2 text-red-300">{row.errorMessage}</p>}</td>
            <td className="p-3"><button type="button" onClick={() => setDetailId(row.id)} className="rounded-lg border border-cyan-400/40 px-3 py-2 font-semibold text-cyan-200 hover:border-cyan-200">View breakdown</button></td>
          </tr>)}
        </tbody>
      </table>
      {!rows.data?.rows.length && <p className="p-4 text-sm text-slate-400">{rows.isLoading ? "Loading recorded games…" : "No recorded games on this page yet."}</p>}
    </div>
    <div className="mt-3 flex items-center justify-between gap-3 text-sm">
      <span className="text-xs text-slate-400">Showing {rows.data?.rows.length ?? 0} records · {processed} finished · page {page + 1} of {maxPages}</span>
      <div className="flex gap-2">
        <button type="button" disabled={page === 0} onClick={() => { setPage(p => Math.max(0,p-1)); setDetailId(null); }} className="rounded-lg border border-slate-600 px-3 py-2 text-xs disabled:opacity-30">Previous</button>
        <button type="button" disabled={(page+1)*perPage >= processed} onClick={() => { setPage(p => p+1); setDetailId(null); }} className="rounded-lg border border-slate-600 px-3 py-2 text-xs disabled:opacity-30">Next</button>
      </div>
    </div>
    {detailId !== null && <div className="mt-4 rounded-xl border border-violet-400/30 bg-slate-900/80 p-4">
      <div className="flex flex-wrap justify-between gap-2">
        <h5 className="font-semibold text-violet-200">Individual game #{detailId} — full method calculation</h5>
        <button type="button" onClick={() => setDetailId(null)} className="text-xs text-slate-300 underline">Close</button>
      </div>
      {detail.isLoading && <p className="mt-2 text-sm text-slate-400">Loading method evidence…</p>}
      {detail.error && <p role="alert" className="mt-2 text-sm text-red-300">{detail.error.message}</p>}
      {showDetail && <div className="mt-3 space-y-4">
        <p className="text-xs text-amber-200">{result.frameMethodStatus.replaceAll("_"," ")} · {result.certification.replaceAll("_"," ")} · {result.comparison.replaceAll("_"," ")}</p>
        <div className="grid gap-3 md:grid-cols-3">
          {([result.god,result.agent] as const).map(frame => <div key={frame.frame} className="min-w-0 rounded-lg border border-white/10 p-3">
            <h6 className="font-semibold text-cyan-200">{frame.frame}</h6>
            <p className="mt-2 font-mono text-xs text-white">A {numberOrDash(frame.scoreA)} · B {numberOrDash(frame.scoreB)} · Δ {numberOrDash(frame.difference)}</p>
            <p className="mt-1 text-xs text-amber-200">{frame.result.replaceAll("_"," ")}</p>
            <details className="mt-3 text-xs text-slate-300"><summary className="cursor-pointer text-cyan-200">Formula, inputs, each calculation step</summary>
              <p className="mt-2">{frame.formula}</p>
              <p className="mt-2 text-amber-200">{frame.completeness}</p>
              <div className="mt-2 max-h-64 space-y-1 overflow-auto">{frame.inputs.map((x,i)=><p key={i}>Input {i+1}: {x}</p>)}{frame.steps.map((x,i)=><p key={i}>Step {i+1}: {x}</p>)}{frame.evidence.map((x,i)=><p key={i}>{x}</p>)}</div>
            </details>
            <details className="mt-2 text-xs text-slate-300"><summary className="cursor-pointer text-cyan-200">12 houses, planets and aspects</summary>
              <div className="mt-2 max-h-64 overflow-auto">
                {frame.chart.houses.map(h=><p key={h.house}>H{h.house}: {h.side}, {h.occupants.join(", ") || "empty"}</p>)}
                {frame.chart.bodies.map(x=><p key={x.planet}>{x.planet} H{x.house} {x.sign} {x.longitude.toFixed(3)}°</p>)}
                {frame.chart.aspects.map((x,i)=><p key={i}>{x.left}/{x.right} {x.kind}, orb {x.orb}°</p>)}
              </div>
            </details>
          </div>)}
          <div className="rounded-lg border border-violet-400/30 p-3">
            <h6 className="font-semibold text-violet-200">Synthesis · this method only</h6>
            <p className="mt-2 font-mono text-xs text-white">A {numberOrDash(result.combined.scoreA)} · B {numberOrDash(result.combined.scoreB)} · Δ {numberOrDash(result.combined.difference)}</p>
            <p className="mt-2 text-xs text-amber-200">{result.combined.result.replaceAll("_"," ")}</p>
            <p className="mt-2 text-xs text-slate-300">{result.combined.calculation}</p>
            {result.methodologyNotes.map((x,i)=><p className="mt-2 text-xs text-amber-200" key={i}>{x}</p>)}
          </div>
        </div>
      </div>}
    </div>}
  </section>;
}
