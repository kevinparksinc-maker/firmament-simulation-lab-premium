import { useMemo, useState } from "react";
import {
  CalendarClock,
  ChevronDown,
  Download,
  FileChartColumn,
  Filter,
  Play,
  RefreshCw,
  X,
} from "lucide-react";

type Sport = "MLB" | "NBA" | "NFL" | "boxing";
type Winner = "A" | "B" | "TIE";

export type FixtureInput = {
  id?: string;
  teamA: string;
  teamB: string;
  sport: Sport;
  location: string;
  latitude?: number;
  longitude?: number;
  startTime: string;
  actualWinner?: Winner;
  agentViewModel?: "astronomical" | "fixed-earth-dawn-anchored";
  sunriseTime?: string;
  sunriseSource?: string;
};

type ManualFixtureDialogProps = {
  open: boolean;
  onClose: () => void;
  onRun: (input: FixtureInput) => Promise<void>;
  isRunning: boolean;
};

const initialFixture = {
  teamA: "",
  teamB: "",
  sport: "MLB" as Sport,
  location: "",
  latitude: "",
  longitude: "",
  startTime: "",
  actualWinner: "unverified",
};

const venueCoordinates: Record<string, { latitude: string; longitude: string }> = {
  "tokyo dome": { latitude: "35.7056", longitude: "139.7519" },
  "oriole park at camden yards": { latitude: "39.2839", longitude: "-76.6217" },
  "yankee stadium": { latitude: "40.8296", longitude: "-73.9262" },
  "fenway park": { latitude: "42.3467", longitude: "-71.0972" },
  "dodger stadium": { latitude: "34.0739", longitude: "-118.2400" },
};

function lookupVenue(value: string) {
  const normalized = value.trim().toLowerCase();
  return venueCoordinates[normalized] ?? Object.entries(venueCoordinates).find(([name]) => normalized.includes(name))?.[1];
}

export function ManualFixtureDialog({ open, onClose, onRun, isRunning }: ManualFixtureDialogProps) {
  const [fixture, setFixture] = useState(initialFixture);
  const [error, setError] = useState("");
  const [venueWasResolved, setVenueWasResolved] = useState(false);

  if (!open) return null;

  const update = (field: keyof typeof initialFixture, value: string) => {
    setFixture((current) => ({ ...current, [field]: value }));
    if (field === "location") {
      const venue = lookupVenue(value);
      if (venue) {
        setFixture((current) => ({ ...current, location: value, latitude: venue.latitude, longitude: venue.longitude }));
        setVenueWasResolved(true);
      } else {
        setVenueWasResolved(false);
      }
    }
    setError("");
  };

  const submit = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    const latitude = fixture.latitude.trim() === "" ? undefined : Number(fixture.latitude);
    const longitude = fixture.longitude.trim() === "" ? undefined : Number(fixture.longitude);

    if (!fixture.teamA.trim() || !fixture.teamB.trim() || !fixture.location.trim() || !fixture.startTime) {
      setError("Teams, venue, and start time are required.");
      return;
    }
    if ((latitude !== undefined && (!Number.isFinite(latitude) || latitude < -90 || latitude > 90)) || (longitude !== undefined && (!Number.isFinite(longitude) || longitude < -180 || longitude > 180))) {
      setError("Enter valid coordinates, or leave both coordinate fields blank.");
      return;
    }

    await onRun({
      id: `manual-${crypto.randomUUID()}`,
      teamA: fixture.teamA.trim(),
      teamB: fixture.teamB.trim(),
      sport: fixture.sport,
      location: fixture.location.trim(),
      latitude,
      longitude,
      startTime: new Date(fixture.startTime).toISOString(),
      ...(fixture.actualWinner === "unverified" ? {} : { actualWinner: fixture.actualWinner as Winner }),
    });
    setFixture(initialFixture);
    setVenueWasResolved(false);
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-start justify-center overflow-y-auto bg-[#020711]/80 p-4 backdrop-blur-sm sm:items-center">
      <div className="my-6 w-full max-w-3xl overflow-hidden rounded-2xl border border-cyan-300/20 bg-[#0b1628] shadow-2xl">
        <div className="flex items-start justify-between border-b border-white/[0.08] px-5 py-4 sm:px-6">
          <div>
            <p className="eyebrow text-cyan-200/80">New research fixture</p>
            <h2 className="mt-1 font-display text-2xl text-white">Run a single event</h2>
            <p className="mt-1 text-xs leading-5 text-slate-400">Use a historical result to score evidence, or leave it unverified for a prospective research record.</p>
          </div>
          <button type="button" onClick={onClose} className="icon-button" aria-label="Close manual fixture dialog"><X size={16} /></button>
        </div>
        <form onSubmit={submit} className="p-5 sm:p-6">
          <div className="grid gap-4 sm:grid-cols-2">
            <label className="space-y-1.5 text-xs text-slate-300">Side A / home or first competitor<input required value={fixture.teamA} onChange={(event) => update("teamA", event.target.value)} className="w-full rounded-lg border border-white/10 bg-black/20 px-3 py-2.5 text-sm text-white outline-none transition focus:border-cyan-300/60" placeholder="e.g., New York Yankees" /></label>
            <label className="space-y-1.5 text-xs text-slate-300">Side B / away or second competitor<input required value={fixture.teamB} onChange={(event) => update("teamB", event.target.value)} className="w-full rounded-lg border border-white/10 bg-black/20 px-3 py-2.5 text-sm text-white outline-none transition focus:border-cyan-300/60" placeholder="e.g., Houston Astros" /></label>
            <label className="space-y-1.5 text-xs text-slate-300">Sport<select value={fixture.sport} onChange={(event) => update("sport", event.target.value)} className="w-full rounded-lg border border-white/10 bg-black/20 px-3 py-2.5 text-sm text-white outline-none transition focus:border-cyan-300/60"><option value="MLB">MLB</option><option value="NFL">NFL</option><option value="NBA">NBA</option><option value="boxing">Boxing</option></select></label>
            <label className="space-y-1.5 text-xs text-slate-300">Verified winner (optional)<select value={fixture.actualWinner} onChange={(event) => update("actualWinner", event.target.value)} className="w-full rounded-lg border border-white/10 bg-black/20 px-3 py-2.5 text-sm text-white outline-none transition focus:border-cyan-300/60"><option value="unverified">No result yet</option><option value="A">Side A</option><option value="B">Side B</option><option value="TIE">Tie</option></select></label>
            <label className="space-y-1.5 text-xs text-slate-300 sm:col-span-2">Venue / location<input required list="known-venues" value={fixture.location} onChange={(event) => update("location", event.target.value)} className="w-full rounded-lg border border-white/10 bg-black/20 px-3 py-2.5 text-sm text-white outline-none transition focus:border-cyan-300/60" placeholder="Start typing a venue (e.g., Tokyo Dome)" /><datalist id="known-venues"><option value="Tokyo Dome" /><option value="Oriole Park at Camden Yards" /><option value="Yankee Stadium" /><option value="Fenway Park" /><option value="Dodger Stadium" /></datalist>{venueWasResolved ? <span className="mt-1 block text-[10px] text-emerald-200">Venue recognized — coordinates filled automatically.</span> : <span className="mt-1 block text-[10px] text-slate-600">Coordinates are looked up automatically for recognized venues.</span>}</label>
            <label className="space-y-1.5 text-xs text-slate-300 sm:col-span-2">Start time (local)<input required type="datetime-local" value={fixture.startTime} onChange={(event) => update("startTime", event.target.value)} className="w-full rounded-lg border border-white/10 bg-black/20 px-3 py-2.5 text-sm text-white outline-none transition focus:border-cyan-300/60" /></label>
            <details className="sm:col-span-2"><summary className="cursor-pointer text-[10px] font-semibold uppercase tracking-[0.16em] text-slate-500">Advanced coordinate override</summary><div className="mt-3 grid gap-4 sm:grid-cols-2"><label className="space-y-1.5 text-xs text-slate-300">Latitude <span className="text-slate-600">optional</span><input inputMode="decimal" value={fixture.latitude} onChange={(event) => update("latitude", event.target.value)} className="w-full rounded-lg border border-white/10 bg-black/20 px-3 py-2.5 text-sm text-white outline-none transition focus:border-cyan-300/60" placeholder="Auto-filled from venue" /></label><label className="space-y-1.5 text-xs text-slate-300">Longitude <span className="text-slate-600">optional</span><input inputMode="decimal" value={fixture.longitude} onChange={(event) => update("longitude", event.target.value)} className="w-full rounded-lg border border-white/10 bg-black/20 px-3 py-2.5 text-sm text-white outline-none transition focus:border-cyan-300/60" placeholder="Auto-filled from venue" /></label></div></details>
          </div>
          {error && <p className="mt-4 rounded-lg border border-rose-300/20 bg-rose-300/[0.08] px-3 py-2 text-xs text-rose-100">{error}</p>}
          <div className="mt-6 flex flex-wrap justify-end gap-2 border-t border-white/[0.08] pt-4"><button type="button" onClick={onClose} className="button-secondary">Cancel</button><button type="submit" disabled={isRunning} className="button-primary"><Play size={14} fill="currentColor" /> {isRunning ? "Calculating…" : "Run fixture"}</button></div>
        </form>
      </div>
    </div>
  );
}

type ResultLayer = {
  name: string;
  verdict: string;
  winner: string;
  scoreA: number;
  scoreB: number;
  detail: string;
  source?: string;
  neutralDiagnostic?: { status: string; reason: string; actionable: boolean };
  frame: "God View" | "AgentView";
};

function resultLayers(result: any): ResultLayer[] {
  return [
    ...result.godView.allLayers.map((layer: Omit<ResultLayer, "frame">) => ({ ...layer, frame: "God View" as const })),
    ...result.agentView.allLayers.map((layer: Omit<ResultLayer, "frame">) => ({ ...layer, frame: "AgentView" as const })),
  ];
}

const verdictStyle: Record<string, string> = {
  hit: "border-emerald-300/20 bg-emerald-300/[0.09] text-emerald-100",
  miss: "border-rose-300/20 bg-rose-300/[0.09] text-rose-100",
  tie: "border-amber-300/20 bg-amber-300/[0.09] text-amber-100",
  unverified: "border-slate-300/15 bg-slate-300/[0.06] text-slate-300",
};

const neutralDiagnosticStyle: Record<string, string> = {
  triggered: "text-emerald-200",
  "valid-neutral": "text-slate-300",
  "shared-evidence-only": "text-cyan-200",
  "hard-coded-neutral": "text-amber-200",
  "missing-input": "text-orange-200",
  unexplained: "text-rose-200",
};

function downloadFile(filename: string, content: string, mime: string) {
  const url = URL.createObjectURL(new Blob([content], { type: mime }));
  const link = document.createElement("a");
  link.href = url;
  link.download = filename;
  link.click();
  window.setTimeout(() => URL.revokeObjectURL(url), 250);
}

function csvCell(value: unknown) {
  const text = String(value ?? "");
  return /[",\n]/.test(text) ? `"${text.replaceAll('"', '""')}"` : text;
}

export function downloadResultBundle(result: any) {
  const stamp = new Date().toISOString().replaceAll(":", "-").replaceAll(".", "-");
  const layers = resultLayers(result);
  const csv = [
    ["event_id", "frame", "method", "verdict", "prediction", "score_a", "score_b", "detail"].join(","),
    ...layers.map((layer) => [result.id, layer.frame, layer.name, layer.verdict, layer.winner, layer.scoreA, layer.scoreB, layer.detail].map(csvCell).join(",")),
  ].join("\n");
  downloadFile(`firmament-event-${stamp}.json`, `${JSON.stringify(result, null, 2)}\n`, "application/json");
  window.setTimeout(() => downloadFile(`firmament-method-audit-${stamp}.csv`, `${csv}\n`, "text/csv;charset=utf-8"), 120);
}

function displayWinner(winner: string | null | undefined, result: any) {
  if (winner === "A") return `${result.input.teamA} (Side A)`;
  if (winner === "B") return `${result.input.teamB} (Side B)`;
  if (winner === "TIE" || winner === "TIE") return "Tie";
  return "Not available";
}

function displayValue(value: unknown) {
  if (value === null || value === undefined || value === "") return "Not supplied";
  return String(value);
}

export function TransparencyPanel({ result }: { result: any }) {
  const input = result.input;
  const actual = result.comparison.actualWinner;
  const frames = [result.godView, result.agentView];
  const baseRows = [
    ["Territorial winner", displayWinner(result.baseline.territorial?.winner, result)],
    ["KP stellar winner", displayWinner(result.baseline.kpStellar?.winner, result)],
    ["Combined baseline winner", displayWinner(result.baseline.winner, result)],
    ["Frame agreement state", displayValue(result.comparison.state)],
    ["Frame agreement winner", displayWinner(result.comparison.winner, result)],
    ["Actual result", displayWinner(actual, result)],
    ["Scoring state", result.comparison.verified ? "Verified: HIT/MISS/TIE scoring enabled" : "Prospective: verdicts remain unverified"],
  ];

  return (
    <section className="mt-6 panel overflow-hidden">
      <div className="panel-header"><div><p className="eyebrow text-cyan-200/80">Transparency layer</p><h2 className="section-title">Every input, assumption, and decision</h2><p className="mt-1 max-w-3xl text-xs leading-5 text-slate-500">This is the complete calculation contract for this run. Nothing below is a confidence estimate or hidden model output; it is the recorded input and the engine’s returned evidence.</p></div><span className="rounded-full border border-cyan-300/20 bg-cyan-300/[0.08] px-2.5 py-1 text-[9px] font-bold uppercase tracking-[0.14em] text-cyan-100">Audit ready</span></div>
      <div className="grid gap-4 border-b border-white/[0.07] p-5 xl:grid-cols-2">
        <div className="rounded-xl border border-white/[0.07] bg-white/[0.025] p-4"><p className="eyebrow">01 / Normalized input</p><div className="mt-3 grid gap-2 sm:grid-cols-2">{[["Event ID", input.id], ["Side A", input.teamA], ["Side B", input.teamB], ["Sport", input.sport], ["Venue", input.location], ["Start time (UTC)", input.startTime], ["Latitude", input.latitude], ["Longitude", input.longitude], ["Actual winner", actual ?? "UNVERIFIED"]].map(([label, value]) => <div key={label} className="rounded-lg border border-white/[0.06] bg-black/10 px-3 py-2"><span className="block text-[9px] uppercase tracking-[0.13em] text-slate-600">{label}</span><strong className="mt-1 block break-words text-[11px] font-medium text-slate-200">{displayValue(value)}</strong></div>)}</div></div>
        <div className="rounded-xl border border-white/[0.07] bg-white/[0.025] p-4"><p className="eyebrow">02 / Engine boundary</p><div className="mt-3 space-y-2">{[["Source", result.engine.source], ["Calculation path", result.engine.calculationPath], ["Fixed-background frame", result.engine.fixedBackground], ["Hamal anchor", result.engine.hamalAnchor], ["AgentView model", input.agentViewModel ?? "astronomical (default)"], ["Sunrise time", input.sunriseTime], ["Sunrise source", input.sunriseSource]].map(([label, value]) => <div key={label} className="grid gap-1 rounded-lg border border-white/[0.06] bg-black/10 px-3 py-2 sm:grid-cols-[155px_1fr]"><span className="text-[9px] uppercase tracking-[0.13em] text-slate-600">{label}</span><strong className="break-words text-[11px] font-medium text-slate-200">{displayValue(value)}</strong></div>)}</div></div>
      </div>
      <div className="border-b border-white/[0.07] p-5"><p className="eyebrow">03 / Decision trace</p><p className="mt-1 text-xs text-slate-500">Baseline and agreement fields are shown exactly as returned. A method winner is the side with the higher raw score; equal scores produce a tie. HIT/MISS is only computed when an actual result is supplied.</p><div className="mt-3 grid gap-2 sm:grid-cols-2 lg:grid-cols-3">{baseRows.map(([label, value]) => <div key={label} className="rounded-lg border border-white/[0.06] bg-black/10 px-3 py-2"><span className="block text-[9px] uppercase tracking-[0.13em] text-slate-600">{label}</span><strong className="mt-1 block text-[11px] font-medium text-slate-200">{value}</strong></div>)}</div></div>
      <div className="border-b border-white/[0.07] p-5"><p className="eyebrow">04 / Frame assumptions and returned synthesis</p><div className="mt-3 grid gap-4 lg:grid-cols-2">{frames.map((frame: any) => <div key={frame.name} className="rounded-xl border border-white/[0.07] bg-white/[0.025] p-4"><div className="flex items-start justify-between gap-3"><div><p className="text-sm font-semibold text-white">{frame.name}</p><p className="mt-1 text-[10px] text-slate-500">{frame.coordinateFrame}</p></div><span className="rounded-full border border-white/10 bg-white/[0.04] px-2 py-1 text-[9px] uppercase tracking-[0.12em] text-slate-300">{displayWinner(frame.synthesis.winner, result)}</span></div><div className="mt-3 space-y-2 text-[11px]">{[["House rule", frame.houseRule], ["Ascendant model", frame.ascendantModel], ["Ascendant longitude", `${displayValue(frame.ascendantLongitude)}°`], ["Sunrise time", frame.sunriseTime], ["Sunrise source", frame.sunriseSource], ["Returned synthesis verdict", frame.synthesis.verdict]].map(([label, value]) => <div key={label} className="flex items-start justify-between gap-4 border-b border-white/[0.05] pb-2 last:border-0 last:pb-0"><span className="text-slate-600">{label}</span><strong className="max-w-[62%] text-right font-medium text-slate-300">{displayValue(value)}</strong></div>)}</div></div>)}</div></div>
      <details className="group p-5"><summary className="cursor-pointer list-none text-[10px] font-bold uppercase tracking-[0.16em] text-cyan-200/80">05 / Show raw engine payload <span className="ml-2 text-slate-600 group-open:hidden">(expand)</span><span className="ml-2 hidden text-slate-600 group-open:inline">(collapse)</span></summary><pre className="mt-4 max-h-[520px] overflow-auto rounded-xl border border-white/[0.07] bg-[#050b14] p-4 text-[10px] leading-5 text-slate-400">{JSON.stringify(result, null, 2)}</pre></details>
    </section>
  );
}

function FramePlacementTable({ label, frame, accent }: { label: string; frame: any; accent: "cyan" | "purple" }) {
  const houses = [...(frame.houses ?? [])].sort((a, b) => a.house - b.house);
  const planets = [...(frame.planets ?? [])].sort((a, b) => a.house - b.house || a.degreeInHouse - b.degreeInHouse);
  return <div className="rounded-xl border border-white/[0.07] bg-white/[0.025] p-4"><div className="flex items-start justify-between gap-3"><div><p className={`eyebrow ${accent === "cyan" ? "text-cyan-200/80" : "text-violet-200/80"}`}>{label}</p><p className="mt-1 text-xs text-slate-500">{displayValue(frame.domeModel)} · Ascendant {displayValue(frame.ascendantLongitude)}° · {planets.length} bodies</p></div><span className="rounded-full border border-white/10 bg-white/[0.04] px-2 py-1 text-[9px] uppercase tracking-[0.12em] text-slate-300">12 houses in order</span></div><div className="mt-4 overflow-x-auto"><table className="w-full min-w-[760px] text-left"><thead><tr className="border-b border-white/[0.07] text-[9px] uppercase tracking-[0.14em] text-slate-600"><th className="px-3 py-2">House</th><th>Sign / cusp</th><th>Star → Sub</th><th>Planets placed in this house</th></tr></thead><tbody>{houses.map((house) => { const occupants = planets.filter((planet) => planet.house === house.house); return <tr key={`${label}-${house.house}`} className="border-b border-white/[0.05] last:border-0 align-top text-[11px] text-slate-400"><td className="px-3 py-3 font-semibold text-white">H{house.house}</td><td className="py-3"><span className="font-medium text-slate-200">{displayValue(house.sign)}</span><span className="ml-2 text-slate-500">{Number(house.cuspLongitude).toFixed(2)}°</span></td><td className="py-3">{displayValue(house.starLord)} <span className="text-slate-700">→</span> {displayValue(house.subLord)}{house.subLordHouse ? <span className="ml-2 text-[10px] text-slate-600">H{house.subLordHouse}</span> : null}</td><td className="py-3">{occupants.length ? <div className="flex flex-wrap gap-1.5">{occupants.map((planet) => <span key={`${label}-${house.house}-${planet.planet}`} className="rounded-md border border-white/10 bg-black/10 px-2 py-1 text-[10px] text-slate-200"><strong>{planet.planet}</strong> {Number(planet.degreeInHouse).toFixed(2)}°{planet.isRetrograde ? <em className="ml-1 text-amber-200">R</em> : null}<span className="ml-1 text-slate-600">{planet.nakshatra} · {planet.manzil?.name ?? "Manzil unavailable"}</span></span>)}</div> : <span className="text-slate-600">No planets placed</span>}</td></tr>; })}</tbody></table></div></div>;
}

export function CalculationProofPanel({ result }: { result: any }) {
  const renderFrame = (frame: any, label: string, accent: "cyan" | "purple") => {
    const proof = frame.proof;
    const winnerLabel = frame.synthesis.winner === "A" ? "Side A · Ascendant" : frame.synthesis.winner === "B" ? "Side B · Descendant" : "Tie";
    return <div className="rounded-xl border border-white/[0.07] bg-white/[0.025] p-4"><div className="flex items-start justify-between gap-3"><div><p className={`eyebrow ${accent === "cyan" ? "text-cyan-200/80" : "text-violet-200/80"}`}>{label}</p><p className="mt-1 text-sm font-semibold text-white">How this frame reached its call</p></div><span className="rounded-full border border-white/10 bg-white/[0.04] px-2 py-1 text-[9px] font-bold uppercase tracking-[0.12em] text-slate-300">{winnerLabel}</span></div><div className="mt-4 grid gap-2 sm:grid-cols-2"><div className="rounded-lg border border-cyan-300/10 bg-cyan-300/[0.04] p-3"><span className="block text-[9px] uppercase tracking-[0.13em] text-cyan-200/60">Side A role</span><strong className="mt-1 block text-xs text-cyan-100">Ascendant</strong><span className="mt-1 block text-[10px] text-slate-500">H{proof.roleAssignment.ascendantHouses.join(", H")}</span></div><div className="rounded-lg border border-violet-300/10 bg-violet-300/[0.04] p-3"><span className="block text-[9px] uppercase tracking-[0.13em] text-violet-200/60">Side B role</span><strong className="mt-1 block text-xs text-violet-100">Descendant</strong><span className="mt-1 block text-[10px] text-slate-500">H{proof.roleAssignment.descendantHouses.join(", H")}</span></div></div><div className="mt-3 rounded-lg border border-white/[0.06] bg-black/10 p-3"><p className="text-[9px] font-bold uppercase tracking-[0.14em] text-slate-600">Frame assumptions</p><p className="mt-2 text-[11px] leading-5 text-slate-400">{frame.houseRule} · {frame.coordinateFrame} · {frame.ascendantModel}{frame.ascendantLongitude !== undefined ? ` · Ascendant ${Number(frame.ascendantLongitude).toFixed(3)}°` : ""}</p></div><details className="mt-3 group"><summary className="cursor-pointer list-none text-[10px] font-bold uppercase tracking-[0.14em] text-cyan-200/80">Show score-by-score proof <span className="ml-2 text-slate-600 group-open:hidden">(expand)</span><span className="ml-2 hidden text-slate-600 group-open:inline">(collapse)</span></summary><div className="mt-3 space-y-2">{proof.decisionTrace.map((step: string, index: number) => <div key={`${label}-${index}`} className="flex gap-3 rounded-lg border border-white/[0.06] bg-black/10 p-3"><span className="flex size-5 shrink-0 items-center justify-center rounded-full bg-white/[0.06] text-[10px] font-bold text-slate-400">{index + 1}</span><p className="text-[11px] leading-5 text-slate-300">{step}</p></div>)}</div><p className="mt-3 text-[10px] leading-5 text-slate-500"><strong className="text-slate-400">Synthesis formula:</strong> {proof.scoreFormula}</p></details></div>;
  };
  return <section className="mt-6 panel overflow-hidden"><div className="panel-header"><div><p className="eyebrow text-amber-200/80">Calculation proof</p><h2 className="section-title">How each frame got its answer</h2><p className="mt-1 max-w-3xl text-xs leading-5 text-slate-500">This is the school-math-work section: it prints the Ascendant/Descendant role mapping, frame assumptions, every method’s raw A/B score, and the synthesis roll-up. It does not hide the choice behind a label.</p></div><span className="rounded-full border border-amber-300/20 bg-amber-300/[0.08] px-2.5 py-1 text-[9px] font-bold uppercase tracking-[0.14em] text-amber-100">Proof trace</span></div><div className="grid gap-4 p-5 xl:grid-cols-2">{renderFrame(result.godView, "God View · fixed background", "cyan")}{renderFrame(result.agentView, "AgentView · event-local", "purple")}</div></section>;
}

export function HousePlacementPanel({ result }: { result: any }) {
  return <section className="mt-6 panel overflow-hidden"><div className="panel-header"><div><p className="eyebrow text-violet-200/80">Chart structure</p><h2 className="section-title">Houses in order & planetary placements</h2><p className="mt-1 max-w-3xl text-xs leading-5 text-slate-500">Houses are listed H1 through H12 for each frame. Planet chips show the returned house assignment, degree within house, nakshatra, and retrograde state; an empty row means no body was assigned to that house.</p></div><span className="rounded-full border border-violet-300/20 bg-violet-300/[0.08] px-2.5 py-1 text-[9px] font-bold uppercase tracking-[0.14em] text-violet-100">Ordered output</span></div><div className="grid gap-4 p-5 xl:grid-cols-2"><FramePlacementTable label="God View · fixed background" frame={result.chart.godView} accent="cyan" /><FramePlacementTable label="AgentView · event-local" frame={result.chart.agentView} accent="purple" /></div></section>;
}

export function MethodExplorer({ result, onExplain }: { result: any; onExplain?: (layer: ResultLayer) => void }) {
  const [frame, setFrame] = useState<"all" | "God View" | "AgentView">("all");
  const [verdict, setVerdict] = useState("all");
  const [sort, setSort] = useState<"method" | "evidence">("evidence");
  const [expanded, setExpanded] = useState<string | null>(null);
  const [expandedGroups, setExpandedGroups] = useState<Record<string, boolean>>({ "God View": true, AgentView: true });
  const layers = useMemo(() => resultLayers(result), [result]);
  const visibleLayers = useMemo(() => layers
    .filter((layer) => frame === "all" || layer.frame === frame)
    .filter((layer) => verdict === "all" || layer.verdict === verdict)
    .sort((a, b) => sort === "method" ? a.name.localeCompare(b.name) : (b.scoreA + b.scoreB) - (a.scoreA + a.scoreB) || a.name.localeCompare(b.name)), [frame, layers, sort, verdict]);
  const groups = ["God View", "AgentView"].map((group) => ({ group, layers: visibleLayers.filter((layer) => layer.frame === group) })).filter((item) => item.layers.length);

  return (
    <section className="mt-6 panel overflow-hidden">
      <div className="panel-header gap-4"><div><p className="eyebrow">Evidence navigator</p><h2 className="section-title">Method-level inspection</h2><p className="mt-1 text-xs text-slate-500">Filter all {layers.length} frame-method evaluations and expand a row for its recorded explanation.</p><p className="mt-2 text-[10px] text-amber-200/80">Not evaluated means no HIT/MISS score exists yet. Neutral diagnostics now distinguish a valid neutral result, shared evidence, missing input, and hard-coded logic that needs implementation.</p></div><button onClick={() => downloadResultBundle(result)} className="button-secondary shrink-0"><Download size={14} /> Download audit</button></div>
      <div className="grid gap-3 border-y border-white/[0.07] px-5 py-4 md:grid-cols-3"><label className="text-[10px] font-semibold uppercase tracking-[0.16em] text-slate-500">Frame<select value={frame} onChange={(event) => setFrame(event.target.value as typeof frame)} className="mt-1.5 w-full rounded-lg border border-white/10 bg-white/[0.03] px-3 py-2 text-xs normal-case tracking-normal text-slate-200 outline-none"><option value="all">All frames</option><option value="God View">God View</option><option value="AgentView">AgentView</option></select></label><label className="text-[10px] font-semibold uppercase tracking-[0.16em] text-slate-500">Result<select value={verdict} onChange={(event) => setVerdict(event.target.value)} className="mt-1.5 w-full rounded-lg border border-white/10 bg-white/[0.03] px-3 py-2 text-xs normal-case tracking-normal text-slate-200 outline-none"><option value="all">Every status</option><option value="hit">Hits</option><option value="miss">Misses</option><option value="tie">Ties</option><option value="unverified">Not evaluated</option></select></label><label className="text-[10px] font-semibold uppercase tracking-[0.16em] text-slate-500">Sort<select value={sort} onChange={(event) => setSort(event.target.value as typeof sort)} className="mt-1.5 w-full rounded-lg border border-white/10 bg-white/[0.03] px-3 py-2 text-xs normal-case tracking-normal text-slate-200 outline-none"><option value="evidence">Evidence magnitude</option><option value="method">Method name</option></select></label></div>
      <div className="grid gap-2 border-b border-white/[0.07] bg-black/10 px-5 py-3 sm:grid-cols-4"><div><span className="block text-[9px] uppercase tracking-[0.14em] text-slate-600">Showing</span><strong className="text-sm text-slate-200">{visibleLayers.length} / {layers.length}</strong></div><div><span className="block text-[9px] uppercase tracking-[0.14em] text-slate-600">Hits</span><strong className="text-sm text-emerald-200">{visibleLayers.filter((layer) => layer.verdict === "hit").length}</strong></div><div><span className="block text-[9px] uppercase tracking-[0.14em] text-slate-600">Conflicts</span><strong className="text-sm text-rose-200">{visibleLayers.filter((layer) => layer.verdict === "miss").length}</strong></div><div><span className="block text-[9px] uppercase tracking-[0.14em] text-slate-600">Not evaluated</span><strong className="text-sm text-amber-200">{visibleLayers.filter((layer) => layer.verdict === "unverified").length}</strong></div><div><span className="block text-[9px] uppercase tracking-[0.14em] text-slate-600">Needs method work</span><strong className="text-sm text-rose-200">{visibleLayers.filter((layer) => layer.neutralDiagnostic?.actionable).length}</strong></div></div>
      <div className="divide-y divide-white/[0.06]">
        {groups.map(({ group, layers: groupLayers }) => { const open = expandedGroups[group] ?? true; return <div key={group}><button onClick={() => setExpandedGroups((current) => ({ ...current, [group]: !open }))} className="flex w-full items-center justify-between gap-3 bg-white/[0.025] px-5 py-3 text-left hover:bg-white/[0.045]"><div><p className="text-xs font-semibold text-slate-200">{group}</p><p className="mt-0.5 text-[10px] text-slate-500">{group === "God View" ? "Permanent fixed-background frame" : "Local moving-Ascendant frame"}</p></div><div className="flex items-center gap-3"><span className="rounded-full border border-white/10 bg-white/[0.04] px-2 py-1 text-[9px] uppercase tracking-[0.12em] text-slate-400">{groupLayers.length} methods</span><ChevronDown size={16} className={`text-slate-500 transition ${open ? "rotate-180" : ""}`} /></div></button>{open && groupLayers.map((layer) => { const key = `${layer.frame}-${layer.name}`; const isExpanded = expanded === key; return <div key={key} className="px-5 py-3.5"><div className="flex items-start gap-3"><button onClick={() => setExpanded(isExpanded ? null : key)} className="flex min-w-0 flex-1 items-start gap-3 text-left"><span className={`mt-0.5 min-w-[4.5rem] rounded-full border px-2 py-1 text-center text-[9px] font-bold uppercase tracking-[0.12em] ${verdictStyle[layer.verdict] ?? verdictStyle.unverified}`}>{layer.verdict === "unverified" ? "not evaluated" : layer.verdict}</span><div className="min-w-0 flex-1"><p className="truncate text-xs font-semibold text-slate-200">{layer.name}</p><p className="mt-0.5 text-[10px] text-slate-500">Side {layer.winner} · A {layer.scoreA.toFixed(1)} / B {layer.scoreB.toFixed(1)}</p>{layer.neutralDiagnostic && <p className={`mt-1 text-[9px] uppercase tracking-[0.11em] ${neutralDiagnosticStyle[layer.neutralDiagnostic.status] ?? "text-slate-500"}`}>Diagnostic · {layer.neutralDiagnostic.status.replaceAll("-", " ")}</p>}</div><ChevronDown size={16} className={`mt-1 shrink-0 text-slate-500 transition ${isExpanded ? "rotate-180" : ""}`} /></button>{onExplain && <button onClick={() => onExplain(layer)} className="button-quiet shrink-0 text-[10px]" title="Ask the research assistant to explain this method">Explain this row</button>}</div>{isExpanded && <div className="ml-[5.25rem] mt-3 rounded-lg border border-white/[0.07] bg-white/[0.025] p-3 text-xs leading-5 text-slate-400"><p>{layer.detail || "The engine did not return a narrative explanation for this evaluation."}</p>{layer.neutralDiagnostic && <p className={`mt-2 text-[11px] ${neutralDiagnosticStyle[layer.neutralDiagnostic.status] ?? "text-slate-400"}`}><strong>Neutral audit:</strong> {layer.neutralDiagnostic.reason}</p>}{layer.source && <p className="mt-2 text-[10px] uppercase tracking-[0.12em] text-slate-600">Source · {layer.source}</p>}</div>}</div>;})}</div>})}
        {!groups.length && <div className="px-5 py-10 text-center text-xs text-slate-500"><Filter className="mx-auto mb-2" size={18} />No methods match these filters.</div>}
      </div>
    </section>
  );
}

export function RunHistoryPanel({ runs, isLoading, onRefresh }: { runs: any[] | undefined; isLoading: boolean; onRefresh: () => void }) {
  return (
    <section className="mt-6 panel overflow-hidden"><div className="panel-header"><div><p className="eyebrow">Persisted runs</p><h2 className="section-title">Recent batch history</h2><p className="mt-1 text-xs text-slate-500">Batch replay status is stored with the source data and refreshed independently of the active run.</p></div><button onClick={onRefresh} className="icon-button" aria-label="Refresh batch history"><RefreshCw size={15} className={isLoading ? "animate-spin" : ""} /></button></div><div className="divide-y divide-white/[0.06]">{isLoading && <div className="px-5 py-5 text-xs text-slate-500">Loading persisted runs…</div>}{!isLoading && !runs?.length && <div className="px-5 py-7 text-center"><CalendarClock className="mx-auto text-slate-600" size={20} /><p className="mt-2 text-xs text-slate-500">No persisted batch runs yet. Import a CSV and start a replay to create the first record.</p></div>}{runs?.map((run) => { const processed = run.completedEvents + run.failedEvents; const percent = run.totalEvents ? Math.round((processed / run.totalEvents) * 100) : 0; return <div key={run.id} className="px-5 py-3.5"><div className="flex items-start justify-between gap-3"><div><p className="text-xs font-semibold text-slate-200">Run #{run.id} <span className="font-normal text-slate-500">· Dataset #{run.datasetId}</span></p><p className="mt-1 text-[10px] text-slate-500">{run.createdAt ? new Date(run.createdAt).toLocaleString() : "Timestamp unavailable"}</p></div><span className={`rounded-full border px-2 py-1 text-[9px] font-bold uppercase tracking-[0.13em] ${run.status === "complete" ? "border-emerald-300/20 bg-emerald-300/[0.08] text-emerald-200" : run.status === "failed" ? "border-rose-300/20 bg-rose-300/[0.08] text-rose-200" : "border-amber-300/20 bg-amber-300/[0.08] text-amber-200"}`}>{run.status}</span></div><div className="mt-3 flex items-center gap-3"><div className="h-1.5 flex-1 overflow-hidden rounded-full bg-white/[0.06]"><div className="h-full rounded-full bg-gradient-to-r from-cyan-300 to-violet-300" style={{ width: `${percent}%` }} /></div><span className="text-[10px] text-slate-500">{processed}/{run.totalEvents}</span></div></div>; })}</div></section>
  );
}

export function ResearchWorkspaceHeader({ onNewFixture }: { onNewFixture: () => void }) {
  return <button onClick={onNewFixture} className="button-primary"><FileChartColumn size={15} /> New fixture</button>;
}
