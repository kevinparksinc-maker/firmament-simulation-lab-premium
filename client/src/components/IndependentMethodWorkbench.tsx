import { useMemo, useState } from "react";
import { trpc } from "@/lib/trpc";
import { MethodScorecard, type ScorecardCache } from "./MethodScorecard";

type Sport = "MLB" | "NBA" | "NFL" | "NHL" | "MLS" | "NCAAF" | "NCAAB" | "TENNIS" | "boxing";

export function IndependentMethodWorkbench() {
  const fields = trpc.simulate.methodFields.useQuery();
  const datasets = trpc.datasets.list.useQuery();
  const evaluate = trpc.simulate.method.useMutation();
  const startBatch = trpc.runs.start.useMutation();

  const [selected, setSelected] = useState("CORE_01");
  const [expanded, setExpanded] = useState<string | null>(null);
  const [runningId, setRunningId] = useState<string | null>(null);
  const [cache, setCache] = useState<ScorecardCache>({});
  const [teamA, setTeamA] = useState("");
  const [teamB, setTeamB] = useState("");
  const [sport, setSport] = useState<Sport>("MLB");
  const [location, setLocation] = useState("");
  const [latitude, setLatitude] = useState("");
  const [longitude, setLongitude] = useState("");
  const [startTime, setStartTime] = useState("");
  const [actual, setActual] = useState<"A" | "B" | "TIE" | "">("");
  const [datasetId, setDatasetId] = useState("");
  const [runId, setRunId] = useState<number | null>(null);
  const [inputError, setInputError] = useState<string | null>(null);

  const batchStatus = trpc.runs.get.useQuery(
    { runId: runId ?? 1 },
    { enabled: runId !== null, refetchInterval: runId !== null ? 3000 : false },
  );

  // Any change to a fixture input invalidates only the DISPLAY of old rows;
  // cached results are never falsely relabeled as the new game's scores.
  const signature = useMemo(() => JSON.stringify({
    teamA, teamB, sport, location, latitude, longitude, startTime, actual,
    roleAssignmentSource: "manual",
  }), [teamA, teamB, sport, location, latitude, longitude, startTime, actual]);

  const selectedField = fields.data?.find(field => field.id === selected);
  const selectMethod = (id: string) => { setSelected(id); setRunId(null); };
  function runOne(methodId: string) {
    setInputError(null);
    if (!fields.data?.some(field => field.id === methodId)) {
      setInputError("Choose a registered method.");
      return;
    }
    if (!teamA.trim() || !teamB.trim() || !location.trim()) {
      setInputError("Enter both teams and the real event venue/location.");
      return;
    }
    if (!startTime.trim() || !Number.isFinite(new Date(startTime).getTime()) ||
        !/([+-]\d{2}:\d{2}|Z)$/i.test(startTime)) {
      setInputError("Enter an exact ISO 8601 start time with timezone, such as 2026-10-20T19:00:00Z.");
      return;
    }
    if ((latitude.trim() && !longitude.trim()) || (longitude.trim() && !latitude.trim())) {
      setInputError("Supply BOTH latitude and longitude, or leave both blank.");
      return;
    }
    if (latitude.trim() && (!Number.isFinite(Number(latitude)) || Number(latitude) < -90 || Number(latitude) > 90 ||
        !Number.isFinite(Number(longitude)) || Number(longitude) < -180 || Number(longitude) > 180)) {
      setInputError("Check the location coordinates.");
      return;
    }
    const event = {
      teamA: teamA.trim(), teamB: teamB.trim(), sport, location: location.trim(),
      startTime: new Date(startTime).toISOString(),
      roleAssignmentSource: "manual" as const,
      ...(latitude.trim() && longitude.trim() ? { latitude: Number(latitude), longitude: Number(longitude) } : {}),
      ...(actual ? { actualWinner: actual } : {}),
    };
    // Capture the fingerprint at the moment this specific method was requested.
    const requestedSignature = signature;
    setRunningId(methodId);
    setSelected(methodId);
    setExpanded(methodId);
    evaluate.mutate({ event, methodId }, {
      onSuccess: result => {
        setCache(previous => ({ ...previous, [methodId]: { result, signature: requestedSignature } }));
        setRunningId(null);
      },
      onError: () => setRunningId(null),
    });
  }

  const summary = batchStatus.data?.summary as null | {
    mode?: string;
    methodId?: string;
    methodPerformance?: {
      games: number; researchEligible: number; hits: number; misses: number;
      equalScoreResults: number; noTriggers: number; zeroNetUnresolved: number;
      notEvaluable: number; directionalAccuracyPercent: number | null; overallHitRatePercent: number | null;
      coveragePercent: number | null; favoriteOnlyHitRatePercent: number | null;
    };
  } | undefined;
  const performance = summary?.methodPerformance;
  const formatPercent = (value: number | null | undefined) => value == null ? "Unavailable" : `${value.toFixed(2)}%`;

  return <section id="independent-methods" className="mt-6 rounded-2xl border border-cyan-400/30 bg-slate-950/95 p-4 text-white md:p-6">
    <div className="flex flex-wrap items-start justify-between gap-3">
      <div>
        <p className="text-xs font-bold uppercase tracking-widest text-cyan-300">Firmament · Independent Research Laboratory</p>
        <h2 className="mt-1 text-2xl font-semibold">One method. Two views. Clear results.</h2>
        <p className="mt-2 max-w-3xl text-sm text-slate-300">Choose your fixture once, then run any of the 31 methods individually. Compare actual God/Agent scores directly in the matrix below and expand a row to audit its calculation. No other method can secretly affect that row.</p>
      </div>
      <span className="rounded-lg border border-cyan-300/25 px-3 py-2 text-sm text-cyan-100">{fields.data?.length ?? "…"} individual fields</span>
    </div>
    <div className="mt-5 rounded-xl border border-white/10 bg-slate-900/65 p-4">
      <div className="flex flex-wrap items-baseline justify-between gap-2">
        <h3 className="text-lg font-semibold text-white">1. Game inputs</h3>
        <p className="text-xs text-slate-400">These apply to every individual method on the scorecard.</p>
      </div>
      <div className="mt-4 grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
        <label className="text-xs text-slate-300">Ascendant / Team A
          <input className="mt-1 w-full rounded-md border border-slate-600 bg-slate-950 p-2 text-sm text-white" placeholder="Verified favorite, or Team A" value={teamA} onChange={event => setTeamA(event.target.value)}/>
        </label>
        <label className="text-xs text-slate-300">Descendant / Team B
          <input className="mt-1 w-full rounded-md border border-slate-600 bg-slate-950 p-2 text-sm text-white" placeholder="Underdog, or Team B" value={teamB} onChange={event => setTeamB(event.target.value)}/>
        </label>
        <label className="text-xs text-slate-300">Sport
          <select className="mt-1 w-full rounded-md border border-slate-600 bg-slate-950 p-2 text-sm text-white" value={sport} onChange={event => setSport(event.target.value as Sport)}>
            {(["MLB","NBA","NFL","NHL","MLS","NCAAF","NCAAB","TENNIS","boxing"] as const).map(value => <option key={value} value={value}>{value}</option>)}
          </select>
        </label>
        <label className="text-xs text-slate-300">Venue or city
          <input className="mt-1 w-full rounded-md border border-slate-600 bg-slate-950 p-2 text-sm text-white" placeholder="Stadium, city, state" value={location} onChange={event => setLocation(event.target.value)}/>
        </label>
        <label className="text-xs text-slate-300">Latitude
          <input className="mt-1 w-full rounded-md border border-slate-600 bg-slate-950 p-2 text-sm text-white" placeholder="e.g. 36.1699" value={latitude} onChange={event => setLatitude(event.target.value)}/>
        </label>
        <label className="text-xs text-slate-300">Longitude
          <input className="mt-1 w-full rounded-md border border-slate-600 bg-slate-950 p-2 text-sm text-white" placeholder="e.g. -115.1398" value={longitude} onChange={event => setLongitude(event.target.value)}/>
        </label>
        <label className="text-xs text-slate-300">Exact start, ISO 8601 + timezone
          <input className="mt-1 w-full rounded-md border border-slate-600 bg-slate-950 p-2 text-sm text-white" placeholder="2026-10-20T19:00:00Z" value={startTime} onChange={event => setStartTime(event.target.value)}/>
        </label>
        <label className="text-xs text-slate-300">Historical actual winner (optional)
          <select className="mt-1 w-full rounded-md border border-slate-600 bg-slate-950 p-2 text-sm text-white" value={actual} onChange={event => setActual(event.target.value as typeof actual)}>
            <option value="">Unknown / upcoming event</option><option value="A">Team A won</option><option value="B">Team B won</option><option value="TIE">Actual tie</option>
          </select>
        </label>
      </div>
      <div className="mt-4 flex flex-wrap items-center gap-3">
        <button type="button" onClick={() => runOne(selected)} disabled={runningId !== null || fields.isLoading}
          className="rounded-lg bg-cyan-400 px-4 py-2.5 text-sm font-bold text-slate-950 disabled:opacity-50">
          {runningId ? `Running ${runningId}…` : `Run selected method: ${selectedField?.name ?? selected}`}
        </button>
        <span className="text-xs text-slate-400">Input mapping is manual in this panel; historical favorite accuracy requires a separately sourced odds dataset.</span>
      </div>
      {inputError && <p role="alert" className="mt-2 text-sm text-amber-200">{inputError}</p>}
      {evaluate.error && <p role="alert" className="mt-2 text-sm text-red-300">{evaluate.error.message}</p>}
      {fields.error && <p role="alert" className="mt-2 text-sm text-red-300">Method roster unavailable: {fields.error.message}</p>}
    </div>

    <MethodScorecard
      fields={fields.data ?? []}
      cache={cache}
      signature={signature}
      selectedId={selected}
      expandedId={expanded}
      runningId={runningId}
      onSelect={selectMethod}
      onExpand={id => { setSelected(id); setExpanded(previous => previous === id ? null : id); }}
      onRun={runOne}
    />

    <div className="mt-5 rounded-xl border border-violet-400/30 bg-slate-900/65 p-4">
      <div className="flex flex-wrap items-start justify-between gap-2">
        <div><h3 className="text-lg font-semibold text-white">2. Run 10,000 historical games on ONE method</h3>
          <p className="mt-1 text-sm text-slate-300">Select a saved historical dataset and test just <strong>{selectedField?.name ?? selected}</strong>. This does not execute or score the other 30 methods.</p></div>
        <span className="text-xs text-violet-200">Independent per-method research</span>
      </div>
      <div className="mt-4 flex flex-wrap items-center gap-3">
        <select aria-label="Choose historical dataset" className="min-w-[220px] rounded-md border border-slate-600 bg-slate-950 px-3 py-2 text-sm text-white" value={datasetId} onChange={event => setDatasetId(event.target.value)}>
          <option value="">Select historical dataset</option>
          {(datasets.data ?? []).map(dataset => <option value={dataset.id} key={dataset.id}>{dataset.name} — {dataset.validRowCount} valid games</option>)}
        </select>
        <button type="button" disabled={!datasetId || startBatch.isPending} onClick={() => {
          const id = selected;
          setRunId(null);
          startBatch.mutate({ datasetId: Number(datasetId), methodId: id }, {
            onSuccess: response => setRunId(response.runId),
          });
        }} className="rounded-lg bg-violet-400 px-4 py-2.5 text-sm font-bold text-slate-950 disabled:opacity-50">
          {startBatch.isPending ? "Starting independent test…" : `Test ${selected} against dataset`}
        </button>
      </div>
      {startBatch.error && <p role="alert" className="mt-2 text-red-300">{startBatch.error.message}</p>}
      {runId !== null && <div className="mt-4 rounded-lg border border-white/10 bg-slate-950/75 p-4 text-sm">
        <h4 className="font-semibold text-violet-200">Method test run #{runId} · {batchStatus.data?.status ?? "Loading"}</h4>
        <p className="mt-1 text-slate-300">Completed {batchStatus.data?.completedEvents ?? 0} of {batchStatus.data?.totalEvents ?? "?"} · failed {batchStatus.data?.failedEvents ?? 0}</p>
        {performance && <div className="mt-4 grid gap-3 sm:grid-cols-3 lg:grid-cols-4">
          {([
            ["Research-eligible games", performance.researchEligible],
            ["Correct directional calls", performance.hits],
            ["Incorrect directional calls", performance.misses],
            ["Equal raw scores", performance.equalScoreResults],
            ["No qualifying trigger", performance.noTriggers],
            ["Unresolved zero net", performance.zeroNetUnresolved],
            ["Incomplete / not evaluable", performance.notEvaluable],
            ["Directional accuracy", formatPercent(performance.directionalAccuracyPercent)],
            ["Directional coverage", formatPercent(performance.coveragePercent)],
            ["Favorite-only baseline", formatPercent(performance.favoriteOnlyHitRatePercent)],
          ] as const).map(([title, value]) => <div key={title} className="rounded-lg border border-white/10 p-3">
            <span className="block text-xs text-slate-400">{title}</span>
            <strong className="mt-1 block text-lg text-white">{value}</strong>
          </div>)}
        </div>}
        {summary && <details className="mt-3"><summary className="cursor-pointer text-xs text-violet-200">View full research JSON and qualification notes</summary><pre className="mt-2 max-h-72 overflow-auto whitespace-pre-wrap rounded-lg bg-slate-950 p-3 text-xs text-slate-300">{JSON.stringify(summary, null, 2)}</pre></details>}
      </div>}
      <p className="mt-3 text-xs text-slate-400">Verify source odds, original kickoff time, outcomes, and held-out seasons before deciding that a method is useful or should be removed. Scores are experimental, not validated betting guidance.</p>
    </div>
  </section>;
}
