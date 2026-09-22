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
  Compass,
  CheckCircle2,
  AlertTriangle,
  HelpCircle,
  Sparkles,
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
  "minute maid park": { latitude: "29.7573", longitude: "-95.3555" },
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
      setError("Competitor titles, venue coordinates, and UTC start time are required.");
      return;
    }
    if ((latitude !== undefined && (!Number.isFinite(latitude) || latitude < -90 || latitude > 90)) || (longitude !== undefined && (!Number.isFinite(longitude) || longitude < -180 || longitude > 180))) {
      setError("Enter valid decimal coordinates or leave blank for geocoding.");
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
      actualWinner: fixture.actualWinner === "unverified" ? undefined : (fixture.actualWinner as Winner),
    });
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 p-4 backdrop-blur-md animate-in fade-in-50 duration-200">
      <div className="obs-panel relative w-full max-w-xl overflow-hidden border-cyan-400/30 shadow-[0_24px_80px_rgba(0,0,0,0.8)]">
        <div className="obs-panel-header">
          <div>
            <p className="text-[10px] font-mono uppercase tracking-[0.2em] text-cyan-300">Custom Event Specifier</p>
            <h3 className="font-serif text-lg font-bold text-white">Ingest Bespoke Fixture</h3>
          </div>
          <button type="button" onClick={onClose} className="text-slate-400 hover:text-white transition-colors" aria-label="Close dialog">
            <X size={18} />
          </button>
        </div>
        <form onSubmit={submit} className="p-6">
          <div className="grid gap-4 sm:grid-cols-2">
            <div>
              <label className="text-[11px] font-mono uppercase tracking-wider text-slate-300">Side A / Competitor 1</label>
              <input required value={fixture.teamA} onChange={(e) => update("teamA", e.target.value)} className="mt-1.5 w-full rounded-xl border border-white/10 bg-black/30 px-3.5 py-2.5 text-xs text-white outline-none focus:border-cyan-400/50" placeholder="e.g., Boston Red Sox" />
            </div>
            <div>
              <label className="text-[11px] font-mono uppercase tracking-wider text-slate-300">Side B / Competitor 2</label>
              <input required value={fixture.teamB} onChange={(e) => update("teamB", e.target.value)} className="mt-1.5 w-full rounded-xl border border-white/10 bg-black/30 px-3.5 py-2.5 text-xs text-white outline-none focus:border-cyan-400/50" placeholder="e.g., New York Yankees" />
            </div>
            <div>
              <label className="text-[11px] font-mono uppercase tracking-wider text-slate-300">Sport Division</label>
              <select value={fixture.sport} onChange={(e) => update("sport", e.target.value)} className="mt-1.5 w-full rounded-xl border border-white/10 bg-[#0b1222] px-3.5 py-2.5 text-xs text-white outline-none focus:border-cyan-400/50 cursor-pointer">
                <option value="MLB">MLB Baseball</option>
                <option value="NFL">NFL Football</option>
                <option value="NBA">NBA Basketball</option>
                <option value="boxing">Boxing / Combat</option>
              </select>
            </div>
            <div>
              <label className="text-[11px] font-mono uppercase tracking-wider text-slate-300">Verified Outcome</label>
              <select value={fixture.actualWinner} onChange={(e) => update("actualWinner", e.target.value)} className="mt-1.5 w-full rounded-xl border border-white/10 bg-[#0b1222] px-3.5 py-2.5 text-xs text-white outline-none focus:border-cyan-400/50 cursor-pointer">
                <option value="unverified">Awaiting Completion (Prospective)</option>
                <option value="A">Side A Confirmed Winner</option>
                <option value="B">Side B Confirmed Winner</option>
                <option value="TIE">Dead Heat / Tie</option>
              </select>
            </div>
            <div className="sm:col-span-2">
              <label className="text-[11px] font-mono uppercase tracking-wider text-slate-300">Stadium / Geographic Coordinates</label>
              <input required list="known-venues" value={fixture.location} onChange={(e) => update("location", e.target.value)} className="mt-1.5 w-full rounded-xl border border-white/10 bg-black/30 px-3.5 py-2.5 text-xs text-white outline-none focus:border-cyan-400/50" placeholder="e.g. Dodger Stadium or Tokyo Dome" />
              <datalist id="known-venues">
                <option value="Tokyo Dome" />
                <option value="Oriole Park at Camden Yards" />
                <option value="Yankee Stadium" />
                <option value="Fenway Park" />
                <option value="Dodger Stadium" />
                <option value="Minute Maid Park" />
              </datalist>
              {venueWasResolved && <span className="mt-1.5 block text-[11px] font-mono text-emerald-400">✓ Coordinates auto-calibrated from venue registry.</span>}
            </div>
            <div className="sm:col-span-2">
              <label className="text-[11px] font-mono uppercase tracking-wider text-slate-300">Timestamp (Local Horizon)</label>
              <input required type="datetime-local" value={fixture.startTime} onChange={(e) => update("startTime", e.target.value)} className="mt-1.5 w-full rounded-xl border border-white/10 bg-black/30 px-3.5 py-2.5 text-xs text-white outline-none focus:border-cyan-400/50" />
            </div>
          </div>
          {error && <p className="mt-4 rounded-xl border border-rose-400/30 bg-rose-400/10 p-3 text-xs text-rose-200">{error}</p>}
          <div className="mt-6 flex justify-end gap-3 border-t border-white/[0.08] pt-4">
            <button type="button" onClick={onClose} className="glass-button">Cancel</button>
            <button type="submit" disabled={isRunning} className="cyan-button">
              <Play size={14} fill="currentColor" /> {isRunning ? "Synthesizing…" : "Run Simulation"}
            </button>
          </div>
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
  frame: "God View" | "AgentView";
};

function resultLayers(result: any): ResultLayer[] {
  return [
    ...result.godView.allLayers.map((layer: Omit<ResultLayer, "frame">) => ({ ...layer, frame: "God View" as const })),
    ...result.agentView.allLayers.map((layer: Omit<ResultLayer, "frame">) => ({ ...layer, frame: "AgentView" as const })),
  ];
}

const verdictStyle: Record<string, string> = {
  hit: "border-emerald-400/30 bg-emerald-400/10 text-emerald-200 shadow-[0_0_8px_rgba(52,211,153,0.15)]",
  miss: "border-rose-400/30 bg-rose-400/10 text-rose-200 shadow-[0_0_8px_rgba(251,113,133,0.15)]",
  tie: "border-amber-400/30 bg-amber-400/10 text-amber-200 shadow-[0_0_8px_rgba(251,191,36,0.15)]",
  unverified: "border-slate-400/20 bg-slate-400/5 text-slate-400",
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
  downloadFile(`firmament-telemetry-${stamp}.json`, `${JSON.stringify(result, null, 2)}\n`, "application/json");
  window.setTimeout(() => downloadFile(`firmament-audit-${stamp}.csv`, `${csv}\n`, "text/csv;charset=utf-8"), 120);
}

function displayWinner(winner: string | null | undefined, result: any) {
  if (winner === "A") return `${result.input.teamA} (Side A)`;
  if (winner === "B") return `${result.input.teamB} (Side B)`;
  if (winner === "TIE") return "Undecided / Tie";
  return "Not Available";
}

function displayValue(value: unknown) {
  if (value === null || value === undefined || value === "") return "Not Supplied";
  return String(value);
}

export function TransparencyPanel({ result }: { result: any }) {
  const input = result.input;
  const actual = result.comparison.actualWinner;
  const frames = [result.godView, result.agentView];
  const baseRows = [
    ["Territorial Stack Consensus", displayWinner(result.baseline.territorial?.winner, result)],
    ["KP Stellar Sub-Lord Model", displayWinner(result.baseline.kpStellar?.winner, result)],
    ["Consolidated Baseline Vector", displayWinner(result.baseline.winner, result)],
    ["Dual-Frame Agreement Topology", displayValue(result.comparison.state)],
    ["Agreement Target", displayWinner(result.comparison.winner, result)],
    ["Historical Outcome Certification", displayWinner(actual, result)],
    ["Scoring Modality", result.comparison.verified ? "Historical Scoreboard: Active" : "Prospective Horizon: Scoring Suspended"],
  ];

  return (
    <section className="obs-panel overflow-hidden">
      <div className="obs-panel-header">
        <div>
          <p className="text-[10px] font-mono uppercase tracking-[0.2em] text-cyan-300">Epistemic Transparency</p>
          <h2 className="font-serif text-xl font-bold text-white">Complete Contract, Model & Trace Audit</h2>
        </div>
        <span className="rounded-full border border-cyan-400/30 bg-cyan-400/10 px-3 py-1 text-[10px] font-mono font-bold uppercase tracking-wider text-cyan-300">
          Deterministic Trace
        </span>
      </div>

      <div className="grid gap-6 border-b border-white/[0.08] p-6 xl:grid-cols-2 bg-white/[0.01]">
        <div className="rounded-2xl border border-white/10 bg-white/[0.02] p-5">
          <p className="text-[10px] font-mono uppercase tracking-[0.2em] text-cyan-300">01 / Ingested Event Parameters</p>
          <div className="mt-4 grid gap-2.5 sm:grid-cols-2">
            {[
              ["Identifier", input.id],
              ["Side A Team", input.teamA],
              ["Side B Team", input.teamB],
              ["League / Sport", input.sport],
              ["Venue Coordinates", input.location],
              ["Epoch Time (UTC)", input.startTime],
              ["Latitude", input.latitude],
              ["Longitude", input.longitude],
              ["Verified Winner", actual ?? "UNVERIFIED"],
            ].map(([label, value]) => (
              <div key={label} className="rounded-xl border border-white/10 bg-black/20 p-3">
                <span className="block text-[9px] font-mono uppercase tracking-widest text-slate-400">{label}</span>
                <strong className="mt-1 block break-words text-xs font-semibold text-white">{displayValue(value)}</strong>
              </div>
            ))}
          </div>
        </div>

        <div className="rounded-2xl border border-white/10 bg-white/[0.02] p-5">
          <p className="text-[10px] font-mono uppercase tracking-[0.2em] text-cyan-300">02 / Engine Boundary Specifications</p>
          <div className="mt-4 space-y-2">
            {[
              ["Astrometric Engine", result.engine.source],
              ["Calculation Pipeline", result.engine.calculationPath],
              ["Invariant Reference", result.engine.fixedBackground],
              ["Sidereal Hamal Anchor", result.engine.hamalAnchor],
              ["AgentView Coordinate System", input.agentViewModel ?? "astronomical (default)"],
              ["Sunrise Epoch", input.sunriseTime],
              ["Sunrise Data Source", input.sunriseSource],
            ].map(([label, value]) => (
              <div key={label} className="flex items-center justify-between gap-4 rounded-xl border border-white/10 bg-black/20 px-3.5 py-2.5">
                <span className="text-[10px] font-mono uppercase tracking-wider text-slate-400">{label}</span>
                <strong className="text-xs font-mono text-cyan-200">{displayValue(value)}</strong>
              </div>
            ))}
          </div>
        </div>
      </div>

      <div className="border-b border-white/[0.08] p-6">
        <p className="text-[10px] font-mono uppercase tracking-[0.2em] text-cyan-300">03 / Convergence Output & Metrics</p>
        <div className="mt-4 grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
          {baseRows.map(([label, value]) => (
            <div key={label} className="rounded-xl border border-white/10 bg-black/20 p-3.5">
              <span className="block text-[9px] font-mono uppercase tracking-widest text-slate-400">{label}</span>
              <strong className="mt-1 block text-xs font-semibold text-slate-200">{value}</strong>
            </div>
          ))}
        </div>
      </div>

      <details className="group p-6">
        <summary className="cursor-pointer list-none text-[11px] font-mono font-bold uppercase tracking-wider text-cyan-300 hover:text-cyan-200 transition-colors">
          04 / Raw Astrometric Telemetry JSON <span className="text-slate-500 group-open:hidden">(Click to Expand)</span>
        </summary>
        <pre className="mt-4 max-h-[460px] overflow-auto rounded-2xl border border-white/10 bg-[#02050e] p-5 font-mono text-[11px] leading-relaxed text-slate-400">
          {JSON.stringify(result, null, 2)}
        </pre>
      </details>
    </section>
  );
}

function FramePlacementTable({ label, frame, accent }: { label: string; frame: any; accent: "cyan" | "purple" }) {
  const houses = [...(frame.houses ?? [])].sort((a, b) => a.house - b.house);
  const planets = [...(frame.planets ?? [])].sort((a, b) => a.house - b.house || a.degreeInHouse - b.degreeInHouse);
  return (
    <div className="rounded-2xl border border-white/10 bg-white/[0.02] p-5">
      <div className="flex items-center justify-between gap-3 border-b border-white/[0.08] pb-4">
        <div>
          <p className={`text-[10px] font-mono uppercase tracking-[0.2em] ${accent === "cyan" ? "text-cyan-300" : "text-purple-300"}`}>{label}</p>
          <p className="mt-1 text-xs text-slate-400">Ascendant: {displayValue(frame.ascendantLongitude)}° • {planets.length} Celestial Bodies</p>
        </div>
        <span className="rounded-full border border-white/10 bg-white/[0.04] px-2.5 py-1 text-[9px] font-mono font-bold text-slate-300 uppercase">
          12 Cusps
        </span>
      </div>
      <div className="mt-4 overflow-x-auto">
        <table className="w-full min-w-[700px] text-left">
          <thead>
            <tr className="border-b border-white/[0.06] text-[10px] font-mono uppercase tracking-wider text-slate-400">
              <th className="px-3 py-2.5">House</th>
              <th>Zodiac Cusp</th>
              <th>Star → Sub Lord</th>
              <th>Planetary Occupants</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-white/[0.04]">
            {houses.map((house) => {
              const occupants = planets.filter((planet) => planet.house === house.house);
              return (
                <tr key={`${label}-${house.house}`} className="text-xs text-slate-300">
                  <td className="px-3 py-3 font-semibold text-white font-mono">H{house.house}</td>
                  <td className="py-3">
                    <span className="font-medium text-slate-200">{displayValue(house.sign)}</span>
                    <span className="ml-2 font-mono text-[11px] text-slate-500">{Number(house.cuspLongitude).toFixed(2)}°</span>
                  </td>
                  <td className="py-3 font-mono text-slate-400">
                    <span className="text-slate-200">{displayValue(house.starLord)}</span>
                    <span className="mx-1 text-slate-600">→</span>
                    <span className="text-cyan-300">{displayValue(house.subLord)}</span>
                  </td>
                  <td className="py-3">
                    {occupants.length ? (
                      <div className="flex flex-wrap gap-1.5">
                        {occupants.map((planet) => (
                          <span key={`${label}-${house.house}-${planet.planet}`} className="rounded-lg border border-white/10 bg-black/30 px-2 py-0.5 text-[10px] text-slate-200">
                            <strong>{planet.planet}</strong> {Number(planet.degreeInHouse).toFixed(2)}°
                            {planet.isRetrograde && <span className="ml-1 text-amber-300 font-bold">R</span>}
                          </span>
                        ))}
                      </div>
                    ) : (
                      <span className="text-slate-600 text-[11px]">Unoccupied</span>
                    )}
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
    </div>
  );
}

export function CalculationProofPanel({ result }: { result: any }) {
  const renderFrame = (frame: any, label: string, accent: "cyan" | "purple") => {
    const proof = frame.proof;
    const winnerLabel = frame.synthesis.winner === "A" ? "Side A (Ascendant Vector)" : frame.synthesis.winner === "B" ? "Side B (Descendant Vector)" : "Balanced";
    return (
      <div className="rounded-2xl border border-white/10 bg-white/[0.02] p-5">
        <div className="flex items-center justify-between gap-3 border-b border-white/[0.08] pb-4">
          <div>
            <p className={`text-[10px] font-mono uppercase tracking-[0.2em] ${accent === "cyan" ? "text-cyan-300" : "text-purple-300"}`}>{label}</p>
            <h3 className="text-sm font-semibold text-white">Mathematical Proof Breakdown</h3>
          </div>
          <span className="rounded-full border border-cyan-400/30 bg-cyan-400/10 px-3 py-1 text-[10px] font-mono font-bold text-cyan-200 uppercase">
            {winnerLabel}
          </span>
        </div>

        <div className="mt-4 grid gap-3 sm:grid-cols-2">
          <div className="rounded-xl border border-cyan-400/20 bg-cyan-400/5 p-3.5">
            <span className="text-[10px] font-mono uppercase tracking-wider text-cyan-300">Side A Domain</span>
            <strong className="mt-1 block text-xs font-semibold text-white">Ascendant / 1st House Axis</strong>
            <span className="text-[10px] font-mono text-slate-400">Houses: {proof.roleAssignment.ascendantHouses.join(", ")}</span>
          </div>
          <div className="rounded-xl border border-purple-400/20 bg-purple-400/5 p-3.5">
            <span className="text-[10px] font-mono uppercase tracking-wider text-purple-300">Side B Domain</span>
            <strong className="mt-1 block text-xs font-semibold text-white">Descendant / 7th House Axis</strong>
            <span className="text-[10px] font-mono text-slate-400">Houses: {proof.roleAssignment.descendantHouses.join(", ")}</span>
          </div>
        </div>

        <details className="mt-4 group">
          <summary className="cursor-pointer list-none text-[11px] font-mono font-bold uppercase tracking-wider text-cyan-300 hover:text-cyan-200">
            Show Decision Trace Steps <span className="text-slate-500 group-open:hidden">(Expand)</span>
          </summary>
          <div className="mt-3 space-y-2">
            {proof.decisionTrace.map((step: string, index: number) => (
              <div key={`${label}-${index}`} className="flex gap-3 rounded-xl border border-white/10 bg-black/30 p-3 text-xs leading-relaxed text-slate-300">
                <span className="flex h-5 w-5 shrink-0 items-center justify-center rounded-full bg-white/10 font-mono text-[10px] font-bold text-cyan-300">
                  {index + 1}
                </span>
                <p>{step}</p>
              </div>
            ))}
          </div>
        </details>
      </div>
    );
  };

  return (
    <section className="obs-panel overflow-hidden">
      <div className="obs-panel-header">
        <div>
          <p className="text-[10px] font-mono uppercase tracking-[0.2em] text-cyan-300">Astrometric Calculations</p>
          <h2 className="font-serif text-xl font-bold text-white">Mathematical Proof & Synthesis Trace</h2>
        </div>
        <span className="rounded-full border border-amber-400/30 bg-amber-400/10 px-3 py-1 text-[10px] font-mono font-bold uppercase tracking-wider text-amber-300">
          Zero Obfuscation
        </span>
      </div>
      <div className="grid gap-6 p-6 xl:grid-cols-2">
        {renderFrame(result.godView, "God View (Sidereal Invariant)", "cyan")}
        {renderFrame(result.agentView, "AgentView (Topocentric Local)", "purple")}
      </div>
    </section>
  );
}

export function HousePlacementPanel({ result }: { result: any }) {
  return (
    <section className="obs-panel overflow-hidden">
      <div className="obs-panel-header">
        <div>
          <p className="text-[10px] font-mono uppercase tracking-[0.2em] text-cyan-300">Geometric Horizon</p>
          <h2 className="font-serif text-xl font-bold text-white">House Cusps & Planetary Distributions</h2>
        </div>
        <span className="rounded-full border border-purple-400/30 bg-purple-400/10 px-3 py-1 text-[10px] font-mono font-bold uppercase tracking-wider text-purple-300">
          Dual Topology
        </span>
      </div>
      <div className="grid gap-6 p-6 xl:grid-cols-2">
        <FramePlacementTable label="God View Sidereal Framework" frame={result.chart.godView} accent="cyan" />
        <FramePlacementTable label="AgentView Topocentric Framework" frame={result.chart.agentView} accent="purple" />
      </div>
    </section>
  );
}

export function MethodExplorer({ result, onExplain }: { result: any; onExplain?: (layer: ResultLayer) => void }) {
  const [frame, setFrame] = useState<"all" | "God View" | "AgentView">("all");
  const [verdict, setVerdict] = useState("all");
  const [sort, setSort] = useState<"method" | "evidence">("evidence");
  const [expanded, setExpanded] = useState<string | null>(null);
  const [expandedGroups, setExpandedGroups] = useState<Record<string, boolean>>({ "God View": true, AgentView: true });

  const layers = useMemo(() => resultLayers(result), [result]);
  const visibleLayers = useMemo(() => {
    return layers
      .filter((layer) => frame === "all" || layer.frame === frame)
      .filter((layer) => verdict === "all" || layer.verdict === verdict)
      .sort((a, b) => (sort === "method" ? a.name.localeCompare(b.name) : (b.scoreA + b.scoreB) - (a.scoreA + a.scoreB) || a.name.localeCompare(b.name)));
  }, [frame, layers, sort, verdict]);

  const groups = ["God View", "AgentView"]
    .map((group) => ({ group, layers: visibleLayers.filter((layer) => layer.frame === group) }))
    .filter((item) => item.layers.length);

  return (
    <section className="obs-panel overflow-hidden">
      <div className="obs-panel-header">
        <div>
          <p className="text-[10px] font-mono uppercase tracking-[0.2em] text-cyan-300">Methodological Dissection</p>
          <h2 className="font-serif text-xl font-bold text-white">Granular Layer Verification</h2>
        </div>
        <button onClick={() => downloadResultBundle(result)} className="glass-button text-xs py-1.5 px-3">
          <Download size={14} /> Export Audit Matrix
        </button>
      </div>

      <div className="grid gap-4 border-b border-white/[0.08] p-5 sm:grid-cols-3 bg-white/[0.01]">
        <div>
          <label className="text-[10px] font-mono uppercase tracking-wider text-slate-400">Framework</label>
          <select value={frame} onChange={(e) => setFrame(e.target.value as typeof frame)} className="mt-1.5 w-full rounded-xl border border-white/10 bg-[#08111f] px-3 py-2 text-xs text-white outline-none focus:border-cyan-400/40 cursor-pointer">
            <option value="all">All Frameworks</option>
            <option value="God View">God View Only</option>
            <option value="AgentView">AgentView Only</option>
          </select>
        </div>
        <div>
          <label className="text-[10px] font-mono uppercase tracking-wider text-slate-400">Verdict Status</label>
          <select value={verdict} onChange={(e) => setVerdict(e.target.value)} className="mt-1.5 w-full rounded-xl border border-white/10 bg-[#08111f] px-3 py-2 text-xs text-white outline-none focus:border-cyan-400/40 cursor-pointer">
            <option value="all">Every Evaluation Status</option>
            <option value="hit">Hits (Corroborated)</option>
            <option value="miss">Misses (Divergent)</option>
            <option value="tie">Ties</option>
            <option value="unverified">Awaiting Validation</option>
          </select>
        </div>
        <div>
          <label className="text-[10px] font-mono uppercase tracking-wider text-slate-400">Sorting Metric</label>
          <select value={sort} onChange={(e) => setSort(e.target.value as typeof sort)} className="mt-1.5 w-full rounded-xl border border-white/10 bg-[#08111f] px-3 py-2 text-xs text-white outline-none focus:border-cyan-400/40 cursor-pointer">
            <option value="evidence">Score Differential</option>
            <option value="method">Methodological Alphabetical</option>
          </select>
        </div>
      </div>

      <div className="divide-y divide-white/[0.06]">
        {groups.map(({ group, layers: groupLayers }) => {
          const open = expandedGroups[group] ?? true;
          return (
            <div key={group}>
              <button onClick={() => setExpandedGroups((curr) => ({ ...curr, [group]: !open }))} className="flex w-full items-center justify-between p-5 text-left bg-white/[0.02] hover:bg-white/[0.04] transition-colors">
                <div>
                  <h4 className="text-sm font-semibold text-white">{group}</h4>
                  <p className="text-xs text-slate-400">{group === "God View" ? "Invariant Sidereal Horizon" : "Topocentric Observer Horizon"}</p>
                </div>
                <div className="flex items-center gap-3">
                  <span className="font-mono text-xs text-cyan-300">{groupLayers.length} Methods Evaluated</span>
                  <ChevronDown size={16} className={`text-slate-400 transition-transform ${open ? "rotate-180" : ""}`} />
                </div>
              </button>

              {open && (
                <div className="divide-y divide-white/[0.04]">
                  {groupLayers.map((layer) => {
                    const key = `${layer.frame}-${layer.name}`;
                    const isExpanded = expanded === key;
                    return (
                      <div key={key} className="p-5 hover:bg-white/[0.01] transition-colors">
                        <div className="flex items-start justify-between gap-4">
                          <button onClick={() => setExpanded(isExpanded ? null : key)} className="flex flex-1 items-start gap-4 text-left">
                            <span className={`rounded-full border px-2.5 py-0.5 text-[10px] font-mono font-bold uppercase tracking-wider ${verdictStyle[layer.verdict] ?? verdictStyle.unverified}`}>
                              {layer.verdict === "unverified" ? "PENDING" : layer.verdict}
                            </span>
                            <div>
                              <p className="text-xs font-semibold text-white">{layer.name}</p>
                              <p className="mt-0.5 font-mono text-[11px] text-slate-400">
                                Vector: Side {layer.winner} • Differential Score: A ({layer.scoreA.toFixed(1)}) vs B ({layer.scoreB.toFixed(1)})
                              </p>
                            </div>
                          </button>
                          {onExplain && (
                            <button onClick={() => onExplain(layer)} className="glass-button text-[11px] py-1 px-2.5">
                              Explain Layer
                            </button>
                          )}
                        </div>
                        {isExpanded && (
                          <div className="mt-4 rounded-xl border border-white/10 bg-black/30 p-4 text-xs leading-relaxed text-slate-300">
                            <p>{layer.detail || "Mathematical conditions verified without additional remarks."}</p>
                            {layer.source && <p className="mt-2 text-[10px] font-mono text-cyan-300/80">Source Axiom: {layer.source}</p>}
                          </div>
                        )}
                      </div>
                    );
                  })}
                </div>
              )}
            </div>
          );
        })}
      </div>
    </section>
  );
}

export function RunHistoryPanel({ runs, isLoading, onRefresh }: { runs: any[] | undefined; isLoading: boolean; onRefresh: () => void }) {
  return (
    <section className="obs-panel overflow-hidden">
      <div className="obs-panel-header">
        <div>
          <p className="text-[10px] font-mono uppercase tracking-[0.2em] text-cyan-300">Batch Processing Registry</p>
          <h2 className="font-serif text-xl font-bold text-white">Persisted Telemetry Replays</h2>
        </div>
        <button onClick={onRefresh} className="glass-button text-xs py-1.5 px-3">
          <RefreshCw size={14} className={isLoading ? "animate-spin" : ""} /> Sync History
        </button>
      </div>

      <div className="divide-y divide-white/[0.06]">
        {isLoading && <div className="p-8 text-center text-xs font-mono text-slate-400">Reading batch run records...</div>}
        {!isLoading && !runs?.length && (
          <div className="p-10 text-center text-xs text-slate-500">
            No batch runs executed yet. Import a historical season CSV to generate high-volume replay logs.
          </div>
        )}
        {runs?.map((run) => {
          const processed = run.completedEvents + run.failedEvents;
          const percent = run.totalEvents ? Math.round((processed / run.totalEvents) * 100) : 0;
          return (
            <div key={run.id} className="p-5 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between hover:bg-white/[0.01] transition-colors">
              <div>
                <div className="flex items-center gap-2.5">
                  <span className="font-mono text-xs font-bold text-white">RUN #{run.id}</span>
                  <span className="text-xs text-slate-400 font-mono">Dataset #{run.datasetId}</span>
                  <span className={`rounded-full border px-2 py-0.5 text-[9px] font-mono font-bold uppercase tracking-wider ${run.status === "complete" ? "border-emerald-400/30 bg-emerald-400/10 text-emerald-200" : "border-amber-400/30 bg-amber-400/10 text-amber-200"}`}>
                    {run.status}
                  </span>
                </div>
                <p className="mt-1 text-[11px] text-slate-500 font-mono">
                  Initiated: {run.createdAt ? new Date(run.createdAt).toLocaleString() : "Unknown"}
                </p>
              </div>

              <div className="flex items-center gap-4 min-w-[200px]">
                <div className="h-1.5 flex-1 overflow-hidden rounded-full bg-white/[0.08]">
                  <div className="h-full rounded-full bg-gradient-to-r from-cyan-400 to-emerald-400" style={{ width: `${percent}%` }} />
                </div>
                <span className="text-xs font-mono text-slate-400">{processed} / {run.totalEvents}</span>
              </div>
            </div>
          );
        })}
      </div>
    </section>
  );
}
