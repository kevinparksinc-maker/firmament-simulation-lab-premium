import { useState } from "react";
import { trpc } from "@/lib/trpc";

type Sport = "MLB" | "NBA" | "NFL" | "NHL" | "MLS" | "NCAAF" | "NCAAB" | "TENNIS" | "boxing";

export function IndependentMethodWorkbench() {
  const fields = trpc.simulate.methodFields.useQuery();
  const datasets = trpc.datasets.list.useQuery();
  const evaluate = trpc.simulate.method.useMutation();
  const startBatch = trpc.runs.start.useMutation();
  const [selected, setSelected] = useState("CORE_01");
  const [teamA, setTeamA] = useState("Team A / favorite");
  const [teamB, setTeamB] = useState("Team B / underdog");
  const [sport, setSport] = useState<Sport>("MLB");
  const [location, setLocation] = useState("Las Vegas, NV");
  const [latitude, setLatitude] = useState("36.1699");
  const [longitude, setLongitude] = useState("-115.1398");
  const [startTime, setStartTime] = useState("2026-09-24T19:00:00.000Z");
  const [actual, setActual] = useState<"A" | "B" | "TIE" | "">("");
  const [datasetId, setDatasetId] = useState("");
  const [runId, setRunId] = useState<number | null>(null);
  const batchStatus = trpc.runs.get.useQuery({ runId: runId ?? 1 }, { enabled: runId !== null, refetchInterval: runId !== null ? 2500 : false });
  const result = evaluate.data;
  const field = fields.data?.find(m => m.id === selected);
  const format = (v: number | null) => v === null ? "Missing" : v.toFixed(5);
  const labelFor = (status: string) => ({
    A: teamA, B: teamB, EQUAL_SCORES: "Equal strength (see both scores)",
    NO_QUALIFYING_CONDITION: "No qualifying condition — NOT a tie",
    ZERO_NET_UNRESOLVED: "Both net scores zero — investigate cancellation versus missing triggers",
    MISSING_INPUT: "Missing input — NOT a tie",
    EVIDENCE_ONLY: "Evidence only / incomplete — NOT a scored tie",
  } as Record<string, string>)[status] ?? status;

  function runOne() {
    if (!teamA.trim() || !teamB.trim() || !location.trim() || !startTime.trim()) return;
    if (!Number.isFinite(Date.parse(startTime))) return;
    evaluate.mutate({
      methodId: selected,
      event: {
        teamA, teamB, sport, location,
        startTime: new Date(startTime).toISOString(),
        roleAssignmentSource: "manual",
        ...(latitude.trim() && longitude.trim() && Number.isFinite(Number(latitude)) && Number.isFinite(Number(longitude))
          ? { latitude: Number(latitude), longitude: Number(longitude) } : {}),
        ...(actual ? { actualWinner: actual } : {}),
      },
    });
  }

  return <section id="independent-methods" className="mt-6 rounded-2xl border border-cyan-400/30 bg-slate-950/95 p-4 text-white md:p-6">
    <div className="flex flex-wrap justify-between gap-2">
      <div><p className="text-xs font-bold uppercase tracking-widest text-cyan-300">Independent Method Laboratory</p>
        <h2 className="mt-1 text-2xl font-semibold">31 fields · one method at a time</h2>
        <p className="mt-2 text-sm text-slate-300">Pick ONE method. Only its dual-frame scoring is evaluated. No other method contributes points, and ties never hide raw scores.</p>
      </div>
      <span className="h-fit rounded-lg border border-cyan-300/25 px-3 py-2 text-xs text-cyan-100">{fields.data?.length ?? 31} method fields</span>
    </div>
    <div className="mt-5 grid gap-2 sm:grid-cols-2 lg:grid-cols-3" aria-label="Select one method">
      {(fields.data ?? []).map((m, i) => <button type="button" key={m.id}
        className={`rounded-lg border p-3 text-left text-sm transition ${selected === m.id ? "border-cyan-300 bg-cyan-400/15 text-white" : "border-slate-700 bg-slate-900/75 text-slate-300 hover:border-slate-400"}`}
        onClick={() => { setSelected(m.id); evaluate.reset(); setRunId(null); }} aria-pressed={selected === m.id}>
        <strong className="block">{String(i + 1).padStart(2, "0")}. {m.name}</strong>
        <span className="mt-1 block text-xs text-slate-400">{m.family} · {m.id}</span>
      </button>)}
    </div>
    {fields.error && <p className="mt-3 text-amber-300">Could not load the method registry: {fields.error.message}</p>}
    <div className="mt-5 rounded-xl border border-white/10 bg-slate-900/60 p-4">
      <h3 className="font-bold text-cyan-200">Selected: {field?.name ?? selected}</h3>
      <p className="mt-1 text-xs text-slate-400">Enter an event for one method. The timestamp must include UTC offset or Z; the event must use the real location and start time for trustworthy results.</p>
      <div className="mt-4 grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
        <label className="text-xs text-slate-300">Ascendant / Team A<input className="mt-1 w-full rounded border border-slate-600 bg-slate-950 p-2" value={teamA} onChange={e => setTeamA(e.target.value)}/></label>
        <label className="text-xs text-slate-300">Descendant / Team B<input className="mt-1 w-full rounded border border-slate-600 bg-slate-950 p-2" value={teamB} onChange={e => setTeamB(e.target.value)}/></label>
        <label className="text-xs text-slate-300">Sport<select className="mt-1 w-full rounded border border-slate-600 bg-slate-950 p-2" value={sport} onChange={e => setSport(e.target.value as Sport)}>{["MLB","NBA","NFL","NHL","MLS","NCAAF","NCAAB","TENNIS","boxing"].map(t=><option key={t} value={t}>{t}</option>)}</select></label>
        <label className="text-xs text-slate-300">Venue/location<input className="mt-1 w-full rounded border border-slate-600 bg-slate-950 p-2" value={location} onChange={e => setLocation(e.target.value)}/></label>
        <label className="text-xs text-slate-300">Latitude<input className="mt-1 w-full rounded border border-slate-600 bg-slate-950 p-2" value={latitude} onChange={e => setLatitude(e.target.value)}/></label>
        <label className="text-xs text-slate-300">Longitude<input className="mt-1 w-full rounded border border-slate-600 bg-slate-950 p-2" value={longitude} onChange={e => setLongitude(e.target.value)}/></label>
        <label className="text-xs text-slate-300">Start time (ISO 8601)<input className="mt-1 w-full rounded border border-slate-600 bg-slate-950 p-2" value={startTime} onChange={e => setStartTime(e.target.value)}/></label>
        <label className="text-xs text-slate-300">Actual winner (optional)<select className="mt-1 w-full rounded border border-slate-600 bg-slate-950 p-2" value={actual} onChange={e=>setActual(e.target.value as typeof actual)}><option value="">Unknown</option><option value="A">Team A</option><option value="B">Team B</option><option value="TIE">Tie</option></select></label>
      </div>
      <button type="button" disabled={evaluate.isPending} onClick={runOne} className="mt-4 rounded-lg bg-cyan-500 px-4 py-2 text-sm font-bold text-slate-950 disabled:opacity-50">
        {evaluate.isPending ? "Calculating this method…" : "Run only this method"}
      </button>
      {evaluate.error && <p className="mt-3 text-sm text-red-300">Method failed: {evaluate.error.message}</p>}
    </div>
    {result && <div className="mt-4 rounded-xl border border-amber-400/30 bg-slate-900/75 p-4">
      <p className="text-xs uppercase tracking-widest text-amber-300">{result.methodName} · {result.frameMethodStatus} · {result.certification}</p>
      <h3 className="mt-2 text-xl font-semibold">Single-method result: {labelFor(result.combined.result)}</h3>
      <p className="mt-1 text-sm text-slate-300">Comparison: {result.comparison}. No points from the other 30 methods were added.</p>
      <div className="mt-4 grid gap-3 md:grid-cols-3">
        {[result.god, result.agent].map(f => <div className="rounded-lg border border-white/10 p-3" key={f.frame}>
          <h4 className="font-bold text-cyan-200">{f.frame}</h4>
          <p className="mt-2">A: <strong>{format(f.scoreA)}</strong></p>
          <p>B: <strong>{format(f.scoreB)}</strong></p>
          <p>Difference: <strong>{format(f.difference)}</strong></p>
          <p className="mt-2 text-xs text-amber-200">{labelFor(f.result)}</p>
          <details className="mt-3 text-xs"><summary className="cursor-pointer text-cyan-300">Formula, steps, all houses and bodies</summary>
            <p className="mt-2">{f.formula}</p>
            <p className="mt-2 text-amber-200">{f.completeness}</p>
            <p className="mt-2">12 houses: {f.chart.houses.map(h => `H${h.house} (${h.side}): ${h.occupants.join(", ") || "unoccupied"}`).join(" · ")}</p>
            <p className="mt-2">Body inventory: {f.chart.bodies.map(b => `${b.planet} H${b.house} ${b.sign}`).join(" · ")}</p>
            <p className="mt-2">Aspects found: {f.chart.aspects.map(a => `${a.left}/${a.right} ${a.kind} orb ${a.orb}°`).join(" · ") || "none within 5°"}</p>
            {f.inputs.map((v,i)=><p className="mt-1" key={`input-${i}`}>Input: {v}</p>)}
            {f.steps.map((v,i)=><p className="mt-1" key={`step-${i}`}>Step: {v}</p>)}
            {f.evidence.map((v,i)=><p className="mt-1" key={`evidence-${i}`}>Evidence: {v}</p>)}
          </details>
        </div>)}
        <div className="rounded-lg border border-amber-300/30 p-3">
          <h4 className="font-bold text-amber-200">Two-frame comparison of THIS method</h4>
          <p className="mt-2">A: <strong>{format(result.combined.scoreA)}</strong></p>
          <p>B: <strong>{format(result.combined.scoreB)}</strong></p>
          <p>Difference: <strong>{format(result.combined.difference)}</strong></p>
          <p className="mt-2 text-xs text-slate-300">{result.combined.calculation}</p>
        </div>
      </div>
      <p className="mt-3 text-xs text-amber-200">An actual zero is retained as raw arithmetic when no eligible condition triggered; it is not a fake score or an equal-strength verdict. Missing inputs remain missing. Certification is still pending.</p>
    </div>}
    <div className="mt-5 rounded-xl border border-white/10 bg-slate-900/60 p-4">
      <h3 className="font-bold">Test this ONE method against a historical dataset</h3>
      <p className="mt-1 text-sm text-slate-300">Select a previously imported CSV dataset (up to 10,000 games). The run persists each game's separate God/Agent calculation and reports method-specific hits, misses, equal scores, no-triggers, and coverage.</p>
      <div className="mt-3 flex flex-wrap gap-2">
        <select value={datasetId} onChange={e=>setDatasetId(e.target.value)} className="min-w-[220px] rounded border border-slate-600 bg-slate-950 p-2 text-sm" aria-label="Select historical dataset">
          <option value="">Select imported dataset</option>
          {(datasets.data ?? []).map(d => <option key={d.id} value={d.id}>{d.name} ({d.validRowCount} valid games)</option>)}
        </select>
        <button type="button" disabled={!datasetId || startBatch.isPending} onClick={()=>{
          startBatch.mutate({datasetId:Number(datasetId),methodId:selected},{onSuccess:d=>setRunId(d.runId)});
        }} className="rounded-lg bg-violet-400 px-3 py-2 text-sm font-bold text-slate-950 disabled:opacity-50">Run historical test for {selected}</button>
      </div>
      {startBatch.error && <p className="mt-2 text-red-300">{startBatch.error.message}</p>}
      {runId !== null && <div className="mt-3 text-sm">
        <p>Run #{runId}: {batchStatus.data?.status ?? "loading"} · {batchStatus.data?.completedEvents ?? 0} of {batchStatus.data?.totalEvents ?? "?"} · failed {batchStatus.data?.failedEvents ?? 0}</p>
        {batchStatus.data?.summary && <details className="mt-2"><summary className="cursor-pointer text-cyan-300">See method-specific performance summary</summary><pre className="mt-2 overflow-x-auto whitespace-pre-wrap rounded bg-slate-950 p-3 text-xs">{JSON.stringify(batchStatus.data.summary, null, 2)}</pre></details>}
      </div>}
      <p className="mt-3 text-xs text-slate-400">Favorite-only comparisons require archived, source-labelled sportsbook odds and recorded historical outcomes; entries without this evidence are excluded from accuracy statistics.</p>
    </div>
  </section>;
}
