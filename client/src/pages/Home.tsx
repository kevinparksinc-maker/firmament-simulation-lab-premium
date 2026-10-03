import { useMemo, useState } from "react";
import {
  Activity,
  ArrowDownRight,
  ArrowUpRight,
  Beaker,
  ChevronDown,
  ChevronRight,
  CircleDot,
  Compass,
  Crosshair,
  Database,
  Gauge,
  Layers3,
  LoaderCircle,
  MapPin,
  Orbit,
  Play,
  Radar,
  Settings2,
  ShieldCheck,
  Sparkles,
  Target,
  Trophy,
  Waves,
  X,
  Zap,
} from "lucide-react";
import { toast } from "sonner";
import { trpc } from "@/lib/trpc";

type Verdict = "hit" | "miss" | "tie" | "unverified";
type Side = "A" | "B" | "TIE";
type FrameName = "God View" | "Agent View";

type Layer = {
  name: string;
  scoreA: number;
  scoreB: number;
  winner: Side;
  verdict: Verdict;
  detail: string;
  source?: string;
  calculation?: { formula: string; inputs: string[]; steps: string[] };
};

type Frame = {
  name: string;
  coordinateFrame: string;
  houseRule: string;
  ascendantModel: string;
  ascendantLongitude: number;
  synthesis: { winner: Side; scoreA: number; scoreB: number; margin: number; formula: string; verdict: Verdict };
  allLayers: Layer[];
  summary: { hits: number; misses: number; ties: number; unverified: number };
};

type Planet = {
  planet: string;
  tropicalLongitude: number;
  backgroundWheelLongitude: number;
  house: number;
  sign: string;
  isRetrograde: boolean;
};

type Simulation = {
  input: { teamA: string; teamB: string; sport: string; location: string; startTime: string; actualWinner?: Side };
  engine: { source: string; calculationPath: string; fixedBackground: string; hamalAnchor: string };
  baseline: { winner: Side; verdict: Verdict; combined: { scoreA: number; scoreB: number } };
  godView: Frame;
  agentView: Frame;
  frameParity: { valid: boolean; methodParity: boolean; formulaParity: boolean; sourceParity: boolean; ruleClassParity: boolean; synthesisParity: boolean; reason: string; changedLayers: Array<{ name: string; differentialShift: number }> };
  chart: { godView: { ascendantLongitude: number; planets: Planet[] }; agentView: { ascendantLongitude: number; planets: Planet[] } };
  comparison: { state: string; winner: Side; actualWinner: Side | null; verified: boolean };
};

type OverlayLayer = Layer & { frame: FrameName; index: number };

type Filter = "all" | "support" | "conflict" | "unscored";

const METHOD_NAMES = [
  "Cluster territory",
  "Nakshatra influence",
  "Essential dignity",
  "Chaldean decans",
  "Planetary war",
  "Arabic lots",
  "Arabic mansion context",
  "Nine-planet influence",
  "Fixed-star amplifications",
  "Retrograde condition",
  "Lunar flow",
  "Chart-wide aspects",
  "Moon phase / VOC",
  "Rahu / Ketu nodes",
  "Upachaya growth",
  "Via Combusta",
  "Besiegement",
  "Mutual reception",
  "Translation of light",
  "Harmonious / friction",
  "KP star → sub → sub-sub",
];

const ZODIAC_SIGNS = ["♈", "♉", "♊", "♋", "♌", "♍", "♎", "♏", "♐", "♑", "♒", "♓"];
const PLANET_MARKS: Record<string, string> = {
  Sun: "☉", Moon: "☽", Mercury: "☿", Venus: "♀", Mars: "♂", Jupiter: "♃", Saturn: "♄", Uranus: "♅", Neptune: "♆", Pluto: "♇", Rahu: "☊", Ketu: "☋",
};

const HOUSE_LABELS = [
  ["H1", "Self / identity"], ["H2", "Resources"], ["H3", "Action / communication"], ["H4", "Foundation / home"],
  ["H5", "Performance / creativity"], ["H6", "Work / strain"], ["H7", "Opponent / counterpart"], ["H8", "Risk / change"],
  ["H9", "Belief / distance"], ["H10", "Status / outcome"], ["H11", "Gain / support"], ["H12", "Hidden / loss"],
] as const;

function sideLabel(side: Side | null | undefined, simulation?: Simulation | null) {
  if (!simulation) return side === "A" ? "Side A" : side === "B" ? "Side B" : "No call";
  if (side === "A") return simulation.input.teamA;
  if (side === "B") return simulation.input.teamB;
  return "No clear call";
}

function verdictCopy(verdict: Verdict) {
  if (verdict === "hit") return "Supported";
  if (verdict === "miss") return "Conflicts";
  if (verdict === "tie") return "Tied";
  return "Unscored";
}

function FrameGlyph({ kind }: { kind: "god" | "agent" }) {
  return kind === "god" ? <Orbit size={18} strokeWidth={1.6} /> : <Compass size={18} strokeWidth={1.6} />;
}

function StatusPill({ verdict, children }: { verdict?: Verdict; children: React.ReactNode }) {
  return <span className={`status-pill ${verdict ? `status-${verdict}` : ""}`}>{children}</span>;
}

type LiveGame = {
  id: string;
  sport: string;
  teamA: string;
  teamB: string;
  location: string;
  startTime: string;
  status: string;
  source: string;
  isLive?: boolean;
  scoreA?: string;
  scoreB?: string;
  period?: string;
};

function LiveNowRail({ games, isLoading, selectedId, onRefresh, onSelect }: { games: LiveGame[]; isLoading: boolean; selectedId?: string; onRefresh: () => void; onSelect: (game: LiveGame) => void }) {
  const hasLiveGames = games.some((game) => game.isLive);
  return <section className="live-now-rail">
    <div className="live-now-heading"><div><div className="live-kicker"><span />{hasLiveGames ? "LIVE NOW" : "NEXT UP"} · AUTO-REFRESH 30S</div><h2>{hasLiveGames ? "Games in play across the major sports" : "Next games across the major sports"}</h2><p>Scoreboard data is separate from the Firmament interpretation engine. Select a game when you want to open it as a research event.</p></div><button className="live-refresh" onClick={onRefresh}><LoaderCircle size={14} className={isLoading ? "spin" : ""} />{isLoading ? "Syncing" : "Refresh feed"}</button></div>
    <div className="live-game-track">{isLoading && games.length === 0 ? <div className="live-empty"><LoaderCircle size={18} className="spin" /><span>Checking the live scoreboard…</span></div> : games.length === 0 ? <div className="live-empty"><CircleDot size={18} /><span>No games were returned by the scoreboard sources.</span><small>Sources: MLB Stats API + ESPN scoreboard feeds</small></div> : games.map((game) => <button className={`live-game-card ${selectedId === game.id ? "live-game-card-selected" : ""}`} key={game.id} onClick={() => onSelect(game)}><div className="live-game-top"><StatusPill verdict={game.isLive ? "hit" : "unverified"}><i className={game.isLive ? "live-dot" : "upcoming-dot"} />{game.sport} · {game.isLive ? "LIVE" : "UPCOMING"}</StatusPill><span>{game.period ?? game.status}</span></div><div className="live-matchup"><div><strong>{game.teamA}</strong><b>{game.scoreA ?? "—"}</b></div><div><strong>{game.teamB}</strong><b>{game.scoreB ?? "—"}</b></div></div><div className="live-game-meta"><span><MapPin size={11} />{game.location}</span><em>{selectedId === game.id ? "Selected" : game.status}</em></div></button>)}</div>
    <div className="live-source-line"><span>Coverage: MLB · NBA · NFL · NHL · MLS · NCAA football · NCAA basketball</span><span>Feed timestamp updates with each sync</span></div>
  </section>;
}

function ResultArc({ scoreA, scoreB, teamA, teamB }: { scoreA: number; scoreB: number; teamA: string; teamB: string }) {
  const total = Math.max(scoreA + scoreB, 0.0001);
  const left = Math.max(8, Math.min(92, (scoreA / total) * 100));
  return (
    <div className="result-arc" aria-label={`${teamA} ${scoreA.toFixed(1)}, ${teamB} ${scoreB.toFixed(1)}`}>
      <div className="result-arc-labels"><span>{teamA}</span><strong>{scoreA.toFixed(1)}</strong><strong>{scoreB.toFixed(1)}</strong><span>{teamB}</span></div>
      <div className="result-arc-track"><span style={{ width: `${left}%` }} /></div>
    </div>
  );
}

function FrameCard({ frame, kind, simulation, active, onClick }: { frame: Frame | null; kind: "god" | "agent"; simulation: Simulation | null; active: boolean; onClick: () => void }) {
  const pending = !frame;
  const teamA = simulation?.input.teamA ?? "Ascendant";
  const teamB = simulation?.input.teamB ?? "Descendant";
  const total = frame ? frame.allLayers.length : 20;
  const support = frame?.summary.hits ?? 0;
  const conflict = frame?.summary.misses ?? 0;
  return (
    <button onClick={onClick} className={`frame-card frame-${kind} ${active ? "frame-card-active" : ""}`}>
      <div className="frame-card-top">
        <div className="frame-identity"><div className="frame-icon"><FrameGlyph kind={kind} /></div><div><p>{kind === "god" ? "Frame 01" : "Frame 02"}</p><h3>{kind === "god" ? "God View" : "Agent View"}</h3></div></div>
        <StatusPill verdict={pending ? "unverified" : frame!.synthesis.verdict}>{pending ? "Ready" : verdictCopy(frame!.synthesis.verdict)}</StatusPill>
      </div>
      <div className="frame-card-body">
        <div className="frame-outcome">
          <span>{pending ? "Perspective" : "Frame synthesis"}</span>
          <strong>{pending ? (kind === "god" ? "Fixed background" : "Event-local horizon") : sideLabel(frame!.synthesis.winner, simulation)}</strong>
          <p>{pending ? (kind === "god" ? "Permanent Aries-zero reference" : "Location, time & moving observer") : `${frame!.coordinateFrame} · ${frame!.ascendantModel}`}</p>
        </div>
        {frame ? <ResultArc scoreA={frame.synthesis.scoreA} scoreB={frame.synthesis.scoreB} teamA={teamA} teamB={teamB} /> : <div className="dormant-arc"><span /><span /><span /></div>}
        <div className="frame-summary">
          <div><span>Methods</span><strong>{total}</strong></div>
          <div><span>Support</span><strong className="text-support">{support}</strong></div>
          <div><span>Conflict</span><strong className="text-conflict">{conflict}</strong></div>
        </div>
      </div>
      <span className="frame-select">{active ? "Focused frame" : "Inspect frame"}<ChevronRight size={14} /></span>
    </button>
  );
}

function MethodConstellation({ layers, simulation, selected, onSelect }: { layers: OverlayLayer[]; simulation: Simulation | null; selected: OverlayLayer | null; onSelect: (layer: OverlayLayer) => void }) {
  const centerLabel = simulation ? sideLabel(simulation.baseline.winner, simulation) : "Engine dormant";
  return (
    <section className="panel constellation-panel">
      <div className="panel-heading constellation-heading"><div><p className="eyebrow">Layer telemetry</p><h2>40-method constellation</h2><p>Every point is an independently recorded reading, orbiting the combined baseline rather than disappearing inside it.</p></div><div className="legend"><span><i className="legend-support" /> supported</span><span><i className="legend-conflict" /> conflicts</span><span><i className="legend-unscored" /> awaiting score</span></div></div>
      <div className="constellation-stage">
        <div className="constellation-rings" />
        <div className="constellation-axis axis-x" /><div className="constellation-axis axis-y" />
        {layers.map((layer) => {
          const angle = ((layer.index * 137.5) - 90) * Math.PI / 180;
          const ring = layer.index % 4;
          const radius = 28 + ring * 14;
          const x = 50 + Math.cos(angle) * radius;
          const y = 50 + Math.sin(angle) * radius;
          const selectedNode = selected?.frame === layer.frame && selected?.name === layer.name;
          return <button key={`${layer.frame}-${layer.name}`} onClick={() => onSelect(layer)} className={`constellation-node node-${layer.verdict} ${layer.frame === "God View" ? "node-god" : "node-agent"} ${selectedNode ? "node-selected" : ""}`} style={{ left: `${x}%`, top: `${y}%` }} aria-label={`${layer.frame}: ${layer.name}, ${verdictCopy(layer.verdict)}`}><span>{layer.index + 1}</span><em>{layer.frame === "God View" ? "G" : "A"}</em></button>;
        })}
        <div className="constellation-center"><span>Baseline call</span><strong>{centerLabel}</strong><small>{simulation ? `${simulation.baseline.combined.scoreA.toFixed(1)} / ${simulation.baseline.combined.scoreB.toFixed(1)} composite` : "Run a fixture to resolve signals"}</small></div>
      </div>
      <div className="constellation-footer"><div><span>Frame pair</span><strong>God View + Agent View</strong></div><div><span>Evidence state</span><strong>{simulation ? `${layers.filter((layer) => layer.verdict === "hit").length} supporting signals` : "No fixture evaluated"}</strong></div><div><span>{selected ? `Selected #${selected.index + 1}` : "Read mode"}</span><strong>{selected ? `${selected.frame} · ${selected.name}` : "Click a numbered point to inspect it"}</strong></div></div>
    </section>
  );
}

function HouseKey() {
  return <div className="house-key" aria-label="House meanings">{HOUSE_LABELS.map(([house, label]) => <div key={house}><b>{house}</b><span>{label}</span></div>)}</div>;
}

function Astrolabe({ frame, kind, active, onSelect }: { frame: Frame | null; kind: "god" | "agent"; active: boolean; onSelect: () => void }) {
  const planets = frame ? (frame as Frame & { planets?: Planet[] }).planets : undefined;
  const displayPlanets = planets ?? [];
  const hue = kind === "god" ? "cyan" : "violet";
  const houseZero = kind === "god" ? 0 : frame?.ascendantLongitude ?? 0;
  return <div className="astrolabe-stack"><button className={`astrolabe astrolabe-${hue} ${active ? "astrolabe-active" : ""}`} onClick={onSelect}>
    <div className="astrolabe-header"><div><span>{kind === "god" ? "Fixed coordinate wheel" : "Local event wheel"}</span><h3>{kind === "god" ? "God View astrolabe" : "Agent View astrolabe"}</h3></div><FrameGlyph kind={kind} /></div>
    <div className="wheel-wrap">
      <svg viewBox="0 0 220 220" aria-hidden="true">
        <defs><radialGradient id={`core-${kind}`}><stop offset="0" stopColor={kind === "god" ? "#82efff" : "#c9a8ff"} stopOpacity=".3" /><stop offset="1" stopColor={kind === "god" ? "#82efff" : "#c9a8ff"} stopOpacity="0" /></radialGradient></defs>
        <circle cx="110" cy="110" r="95" className="wheel-ring-outer" /><circle cx="110" cy="110" r="71" className="wheel-ring-inner" /><circle cx="110" cy="110" r="40" fill={`url(#core-${kind})`} className="wheel-core" />
        {ZODIAC_SIGNS.map((sign, index) => { const angle = (index * 30 - 90) * Math.PI / 180; const tx = 110 + Math.cos(angle) * 83; const ty = 110 + Math.sin(angle) * 83; const lx = 110 + Math.cos(angle) * 71; const ly = 110 + Math.sin(angle) * 71; return <g key={sign}><line x1="110" y1="110" x2={lx} y2={ly} className="wheel-spoke" /><text x={tx} y={ty + 4} textAnchor="middle" className="wheel-sign">{sign}</text></g>; })}
        {Array.from({ length: 12 }, (_, index) => { const boundary = (houseZero + index * 30 - 90) * Math.PI / 180; const center = (houseZero + index * 30 + 15 - 90) * Math.PI / 180; const x1 = 110 + Math.cos(boundary) * 40; const y1 = 110 + Math.sin(boundary) * 40; const x2 = 110 + Math.cos(boundary) * 69; const y2 = 110 + Math.sin(boundary) * 69; const tx = 110 + Math.cos(center) * 54; const ty = 110 + Math.sin(center) * 54; return <g key={`house-${index}`}><line x1={x1} y1={y1} x2={x2} y2={y2} className="house-spoke" /><text x={tx} y={ty + 3} textAnchor="middle" className="house-number">H{index + 1}</text></g>; })}
        {displayPlanets.map((planet) => { const longitude = kind === "god" ? planet.backgroundWheelLongitude : planet.tropicalLongitude; const angle = (longitude - 90) * Math.PI / 180; const x = 110 + Math.cos(angle) * 56; const y = 110 + Math.sin(angle) * 56; return <g key={planet.planet}><circle cx={x} cy={y} r="8" className="planet-orb" /><text x={x} y={y + 4} textAnchor="middle" className="planet-mark">{PLANET_MARKS[planet.planet] ?? planet.planet.slice(0, 1)}</text></g>; })}
        <text x="110" y="106" textAnchor="middle" className="wheel-center-title">{kind === "god" ? "ARIES ZERO" : "EVENT ASC"}</text><text x="110" y="122" textAnchor="middle" className="wheel-center-sub">{frame ? `${Math.round(frame.ascendantLongitude)}° ASC` : "AWAITING INPUT"}</text>
      </svg>
      {!frame && <div className="wheel-empty"><span><Radar size={16} /></span><p>Charts resolve with the fixture</p></div>}
    </div>
    <p className="astrolabe-caption">{frame ? `${frame.coordinateFrame} · ${frame.houseRule}` : "Overlay-ready; spatial readings appear after calculation."}</p>
  </button><HouseKey /></div>;
}

function EvidenceCard({ selected, simulation, onClear }: { selected: OverlayLayer | null; simulation: Simulation | null; onClear: () => void }) {
  if (!selected) {
    return <aside className="evidence-focus evidence-empty"><div className="focus-icon"><Crosshair size={18} /></div><div><p className="eyebrow">Evidence inspector</p><h3>Select a method signal</h3><p>Choose a point in the constellation or a row in the ledger to expose its exact frame, scores, verdict, and calculation trace.</p></div></aside>;
  }
  const winningName = sideLabel(selected.winner, simulation);
  const isA = selected.winner === "A";
  return <aside id="evidence-inspector" className={`evidence-focus focus-${selected.verdict}`}>
    <div className="focus-top"><div><p className="eyebrow">Evidence inspector · {selected.frame}</p><h3>{selected.name}</h3></div><button onClick={onClear} className="focus-close" aria-label="Clear selected method"><X size={15} /></button></div>
    <div className="focus-callout"><StatusPill verdict={selected.verdict}>{verdictCopy(selected.verdict)}</StatusPill><strong>{selected.winner === "TIE" ? "No directional advantage" : `${winningName} selected`}</strong><span>{selected.frame === "God View" ? "Fixed background reference" : "Event-local observer reference"}</span></div>
    <div className="focus-explain"><b>What point #{selected.index + 1} is doing</b><p>This is the <strong>{selected.name}</strong> method in the {selected.frame}. It compares the two sides using this method only; it is not a prediction by itself.</p></div>
    <ResultArc scoreA={selected.scoreA} scoreB={selected.scoreB} teamA={simulation?.input.teamA ?? "Side A"} teamB={simulation?.input.teamB ?? "Side B"} />
    <p className="focus-detail">{selected.detail}</p>
    <div className="focus-footer"><span>Source</span><strong>{selected.source ?? "firmament-engine"}</strong><span className={isA ? "side-a" : "side-b"}>{selected.winner === "TIE" ? "TIE" : `SIDE ${selected.winner}`}</span></div>
  </aside>;
}

function FrameExplanation({ simulation }: { simulation: Simulation | null }) {
  const godPick = simulation ? sideLabel(simulation.godView.synthesis.winner, simulation) : "the fixed-background side";
  const agentPick = simulation ? sideLabel(simulation.agentView.synthesis.winner, simulation) : "the event-local side";
  return <section className="frame-explanation"><div className="panel-heading"><div><p className="eyebrow">Why the frames can disagree</p><h2>As above, so below — make the reference explicit.</h2><p>These are two coordinate systems, not two independent realities. A disagreement means the same event was scored from different reference rules; it does not automatically mean one frame is correct.</p></div></div><div className="explanation-grid"><div className="explanation-card explanation-god"><div className="explanation-title"><Orbit size={16} /><b>God View</b><span>Fixed background</span></div><p>Anchors the chart to the permanent Aries-zero / fixed-zodiac reference. It asks: <em>what does the event look like against the stable background?</em></p><strong>{simulation ? `This trace selected ${godPick}.` : "Run a trace to see its selection."}</strong></div><div className="explanation-card explanation-agent"><div className="explanation-title"><Compass size={16} /><b>Agent View</b><span>Event-local horizon</span></div><p>Rotates the event through its time and location, using the local ascendant and house structure. It asks: <em>what does the event look like from the observer on Earth?</em></p><strong>{simulation ? `This trace selected ${agentPick}.` : "Run a trace to see its selection."}</strong></div></div>{simulation && <div className="comparison-note"><strong>{simulation.godView.synthesis.winner === simulation.agentView.synthesis.winner ? "The frames converge." : "The frames are split."}</strong><span>{simulation.godView.synthesis.scoreA.toFixed(1)} / {simulation.godView.synthesis.scoreB.toFixed(1)} in God View versus {simulation.agentView.synthesis.scoreA.toFixed(1)} / {simulation.agentView.synthesis.scoreB.toFixed(1)} in Agent View. Treat this as a research disagreement to investigate—not a result to force into agreement.</span><small className={simulation.frameParity.valid ? "parity-valid" : "parity-invalid"}>{simulation.frameParity.valid ? `Parity check passed · ${simulation.frameParity.changedLayers.length} frame-sensitive layer${simulation.frameParity.changedLayers.length === 1 ? "" : "s"} changed.` : "Parity check failed · do not trust this split until the mismatch is repaired."}</small></div>}</section>;
}

function DecisionBreakdown({ simulation }: { simulation: Simulation | null }) {
  const [expanded, setExpanded] = useState<string | null>(null);
  if (!simulation) return <section className="decision-breakdown"><div className="panel-heading"><div><p className="eyebrow">Decision breakdown</p><h2>Run a trace to see exactly why each frame selects a side.</h2><p>The breakdown will separate the final score from the individual methods that pushed toward or away from that side.</p></div></div></section>;
  const frames: Array<[FrameName, Frame]> = [["God View", simulation.godView], ["Agent View", simulation.agentView]];
  return <section className="decision-breakdown"><div className="panel-heading"><div><p className="eyebrow">Decision breakdown</p><h2>Why each frame selected its side</h2><p>This is an additive audit: final totals first, then every method-level push. Click any method to expose its full calculation detail.</p></div><span className="ledger-count">42 expandable methods</span></div><div className="breakdown-grid">{frames.map(([name, frame]) => { const winner = frame.synthesis.winner; const maxImpact = Math.max(...frame.allLayers.map((layer) => Math.abs(layer.scoreA - layer.scoreB)), 1); return <article className={`breakdown-card breakdown-${name === "God View" ? "god" : "agent"}`} key={name}><div className="breakdown-card-head"><div><p className="eyebrow">{name}</p><h3>{sideLabel(winner, simulation)}</h3></div><StatusPill verdict={frame.synthesis.verdict}>{verdictCopy(frame.synthesis.verdict)}</StatusPill></div><div className="breakdown-score"><div><span>{simulation.input.teamA}</span><strong>{frame.synthesis.scoreA.toFixed(1)}</strong></div><b>vs</b><div><span>{simulation.input.teamB}</span><strong>{frame.synthesis.scoreB.toFixed(1)}</strong></div></div><div className="breakdown-metrics"><div><span>Margin</span><strong>{Math.abs(frame.synthesis.margin).toFixed(1)}</strong></div><div><span>Methods</span><strong>{frame.allLayers.length}</strong></div><div><span>Support / conflict</span><strong>{frame.summary.hits} / {frame.summary.misses}</strong></div></div><div className="breakdown-context"><span>Calculation context</span><strong>{frame.coordinateFrame} · {frame.houseRule}</strong><small>{frame.ascendantModel} · {Math.round(frame.ascendantLongitude)}° ascendant</small></div><div className="breakdown-formula"><span>How the total is formed</span><code>{frame.synthesis.formula}</code></div><div className="full-method-audit"><div className="full-audit-heading"><span>Full method audit</span><small>Signed impact: A is positive · B is negative</small></div>{frame.allLayers.map((layer, index) => { const impact = layer.scoreA - layer.scoreB; const width = Math.min(50, Math.max(2, Math.abs(impact) / maxImpact * 50)); const key = `${name}-${layer.name}`; const isOpen = expanded === key; return <div className={`method-audit-row ${isOpen ? "method-audit-open" : ""}`} key={key}><button className="method-audit-trigger" onClick={() => setExpanded(isOpen ? null : key)} aria-expanded={isOpen}><span className="method-index">{String(index + 1).padStart(2, "0")}</span><span className="method-audit-name"><b>{layer.name}</b><small>{sideLabel(layer.winner, simulation)} · {verdictCopy(layer.verdict)}</small></span><span className="impact-track" aria-label={`Impact ${impact >= 0 ? "toward" : "toward"} ${impact >= 0 ? simulation.input.teamA : simulation.input.teamB}`}><i className="impact-mid" /><i className={`impact-bar ${impact >= 0 ? "impact-a" : "impact-b"}`} style={{ width: `${width}%` }} /></span><strong className={`impact-number ${impact >= 0 ? "number-a" : "number-b"}`}>{impact >= 0 ? "+" : ""}{impact.toFixed(2)}</strong><ChevronDown size={14} className="method-chevron" /></button>{isOpen && <div className="method-audit-detail"><div><span>Raw scores</span><strong>{simulation.input.teamA} {layer.scoreA.toFixed(2)} · {simulation.input.teamB} {layer.scoreB.toFixed(2)}</strong></div><div><span>Source</span><strong>{layer.source ?? "firmament-engine"}</strong></div>{layer.calculation ? <><div className="calculation-formula"><span>Formula</span><code>{layer.calculation.formula}</code></div><div className="calculation-list"><span>Inputs</span>{layer.calculation.inputs.map((input) => <small key={input}>{input}</small>)}</div><div className="calculation-list"><span>Arithmetic / decision steps</span>{layer.calculation.steps.map((step) => <small key={step}>{step}</small>)}</div></> : <p>{layer.detail}</p>}</div>}</div>; })}</div></article>; })}</div></section>;
}

function MethodLedger({ layers, simulation, filter, onFilter, selected, onSelect }: { layers: OverlayLayer[]; simulation: Simulation | null; filter: Filter; onFilter: (filter: Filter) => void; selected: OverlayLayer | null; onSelect: (layer: OverlayLayer) => void }) {
  const filtered = useMemo(() => layers.filter((layer) => filter === "all" || (filter === "support" && layer.verdict === "hit") || (filter === "conflict" && layer.verdict === "miss") || (filter === "unscored" && (layer.verdict === "unverified" || layer.verdict === "tie"))), [filter, layers]);
  const filters: Array<[Filter, string]> = [["all", "All signals"], ["support", "Supported"], ["conflict", "Conflicts"], ["unscored", "Unscored"]];
  return <section className="panel ledger-panel"><div className="panel-heading ledger-heading"><div><p className="eyebrow">Auditable method ledger</p><h2>Signal by signal, frame by frame</h2><p>Expand the decision surface: every method keeps its own winner, strength differential, source frame, and verification status.</p></div><span className="ledger-count">{filtered.length} / 42 visible</span></div>
    <div className="ledger-toolbar"><div className="filter-tabs">{filters.map(([key, label]) => <button key={key} onClick={() => onFilter(key)} className={filter === key ? "filter-active" : ""}>{label}</button>)}</div><div className="ledger-key"><span><i className="key-god" /> God View</span><span><i className="key-agent" /> Agent View</span></div></div>
    <div className="ledger-grid"><div className="ledger-head"><span>Frame / method</span><span>Readout</span><span>Score differential</span><span>State</span></div>{filtered.map((layer) => { const differential = Math.abs(layer.scoreA - layer.scoreB); const selectedRow = selected?.frame === layer.frame && selected?.name === layer.name; return <button className={`ledger-row ${selectedRow ? "ledger-row-selected" : ""}`} key={`${layer.frame}-${layer.name}`} onClick={() => onSelect(layer)}><span className="ledger-method"><i className={layer.frame === "God View" ? "key-god" : "key-agent"} /><b>{layer.name}</b><small>{layer.frame}</small></span><span className="ledger-readout">{sideLabel(layer.winner, simulation)}</span><span className="ledger-score"><strong>{differential.toFixed(2)}</strong><em>{layer.scoreA.toFixed(1)} / {layer.scoreB.toFixed(1)}</em></span><StatusPill verdict={layer.verdict}>{verdictCopy(layer.verdict)}</StatusPill></button>; })}</div>
  </section>;
}

export default function Home() {
  const [simulation, setSimulation] = useState<Simulation | null>(null);
  const [activeFrame, setActiveFrame] = useState<"god" | "agent">("god");
  const [selected, setSelected] = useState<OverlayLayer | null>(null);
  const [filter, setFilter] = useState<Filter>("all");
  const [model, setModel] = useState<"astronomical" | "fixed-earth-dawn-anchored">("astronomical");
  const [showConfig, setShowConfig] = useState(false);
  const [selectedLiveGame, setSelectedLiveGame] = useState<LiveGame | null>(null);
  const simulate = trpc.simulate.event.useMutation();
  const liveDate = new Date().toISOString().slice(0, 10);
  const liveGames = trpc.schedules.live.useQuery({ date: liveDate }, { refetchInterval: 30_000, staleTime: 15_000 });

  const layers = useMemo<OverlayLayer[]>(() => {
    if (simulation) return [
      ...simulation.godView.allLayers.map((layer, index) => ({ ...layer, frame: "God View" as const, index })),
      ...simulation.agentView.allLayers.map((layer, index) => ({ ...layer, frame: "Agent View" as const, index: index + simulation.godView.allLayers.length })),
    ];
    return METHOD_NAMES.flatMap((name, index) => ([
      { name, scoreA: 0, scoreB: 0, winner: "TIE" as Side, verdict: "unverified" as Verdict, detail: "This method is staged for calculation when an event fixture is run.", frame: "God View" as FrameName, index },
      { name, scoreA: 0, scoreB: 0, winner: "TIE" as Side, verdict: "unverified" as Verdict, detail: "This method is staged for calculation when an event fixture is run.", frame: "Agent View" as FrameName, index: index + METHOD_NAMES.length },
    ]));
  }, [simulation]);

  const activeFrameData = activeFrame === "god" ? simulation?.godView ?? null : simulation?.agentView ?? null;
  const activeChart = activeFrame === "god" ? simulation?.chart.godView : simulation?.chart.agentView;
  const frameForWheel = activeFrameData && activeChart ? { ...activeFrameData, planets: activeChart.planets } : null;

  const runFixture = async () => {
    try {
      const live = selectedLiveGame;
      const result = await simulate.mutateAsync({
        id: live ? `live-${live.id}` : "observatory-verified-mlb-001",
        teamA: live?.teamA ?? "New York Yankees",
        teamB: live?.teamB ?? "Houston Astros",
        sport: live?.sport === "MLB" || live?.sport === "NBA" || live?.sport === "NFL" || live?.sport === "NHL" || live?.sport === "MLS" || live?.sport === "NCAAF" || live?.sport === "NCAAB" ? live.sport : "MLB",
        location: live?.location ?? "Houston, Texas",
        latitude: live ? undefined : 29.7604,
        longitude: live ? undefined : -95.3698,
        startTime: live?.startTime ?? "2024-04-02T00:10:00.000Z",
        ...(live ? {} : { actualWinner: "B" as const }),
        agentViewModel: model,
        ...(model === "fixed-earth-dawn-anchored" && !live ? { sunriseTime: "2024-04-01T12:10:13.153Z", sunriseSource: "Configured dawn anchor" } : {}),
      });
      setSimulation(result as Simulation);
      setSelected(null);
      setFilter("all");
      toast.success("Observatory trace complete", { description: live ? `${live.teamA} vs ${live.teamB} loaded as an unverified live research event.` : "Forty frame-method signals are now resolved against the verified fixture." });
    } catch (error) {
      toast.error("Calculation could not complete", { description: error instanceof Error ? error.message : "The engine did not return a usable trace." });
    }
  };

  const openLiveGame = (game: LiveGame) => {
    setSelectedLiveGame(game);
    setSimulation(null);
    setSelected(null);
    toast.success("Live game loaded", { description: `${game.teamA} vs ${game.teamB} is ready. Review the event, then use Calculate selected live game.` });
  };

  const selectLayer = (layer: OverlayLayer) => {
    setSelected(layer);
    window.setTimeout(() => document.getElementById("evidence-inspector")?.scrollIntoView({ behavior: "smooth", block: "center" }), 0);
  };

  const supportCount = layers.filter((layer) => layer.verdict === "hit").length;
  const conflictCount = layers.filter((layer) => layer.verdict === "miss").length;
  const agreement = simulation ? (simulation.godView.synthesis.winner === simulation.agentView.synthesis.winner ? "Convergent" : "Split signal") : "Awaiting trace";

  return <div className="observatory-shell">
    <div className="cosmic-noise" /><div className="aurora aurora-one" /><div className="aurora aurora-two" /><div className="grid-horizon" />
    <aside className="obs-sidebar">
      <div className="obs-brand"><div className="brand-seal"><Orbit size={22} /></div><div><strong>FIRMAMENT</strong><span>Sports Lab / 01</span></div></div>
      <div className="sidebar-section"><span>Lab navigation</span><button className="nav-current"><Radar size={17} />Command deck</button><button><Beaker size={17} />Experiments</button><button><Layers3 size={17} />Frame overlays</button><button><Database size={17} />Evidence archive</button></div>
      <div className="sidebar-section"><span>System channels</span><div className="system-line"><i /><div><b>Engine boundary</b><small>Firmament source pinned</small></div></div><div className="system-line"><i /><div><b>Dual-frame stack</b><small>2 perspectives · 42 methods</small></div></div><div className="system-line muted"><i /><div><b>Pattern lab</b><small>Scheduled next</small></div></div></div>
      <div className="sidebar-rule"><ShieldCheck size={16} /><p>Research interface. Calls remain visibly separated from verified results and should not be treated as wagering advice.</p></div>
    </aside>

    <main className="obs-main">
      <header className="obs-header"><div className="mobile-brand"><div className="brand-seal"><Orbit size={18} /></div><span>FIRMAMENT</span></div><div className="header-path"><span>Research environment</span><ChevronRight size={13} /><strong>Sports prediction simulation lab</strong></div><div className="header-actions"><div className="engine-live"><i />Engine linked</div><button className={`config-button ${showConfig ? "config-active" : ""}`} onClick={() => setShowConfig((current) => !current)}><Settings2 size={15} />Run profile</button><button className="run-button" onClick={runFixture} disabled={simulate.isPending}><Play size={14} fill="currentColor" />{simulate.isPending ? "Resolving trace" : selectedLiveGame ? "Calculate selected live game" : simulation ? "Rerun verified fixture" : "Run verified fixture"}</button></div></header>

      <section className="hero-grid"><div className="hero-copy"><div className="live-kicker"><span />DUAL-FRAME RESEARCH SURFACE</div><h1>Make the <em>logic</em> visible.</h1><p>Firmament Sports Prediction Simulation Lab turns an opaque sports experiment into a navigable decision field—where fixed background, local horizon, and every supporting or conflicting method remain in view.</p><div className="hero-meta"><div><span>Interpretation model</span><strong>{model === "astronomical" ? "Astronomical Agent View" : "Dawn-anchored Agent View"}</strong></div><div><span>Method topology</span><strong>21 methods × 2 frames</strong></div><div><span>Audit posture</span><strong>{simulation?.comparison.verified ? "Verified fixture" : "Trace-ready"}</strong></div></div></div>
        <div className="hero-signal"><div className="signal-dial"><div className="dial-orbit orbit-a" /><div className="dial-orbit orbit-b" /><div className="dial-center"><Waves size={25} /><b>{simulation ? agreement : "40"}</b><span>{simulation ? "frame alignment" : "method signals"}</span></div><span className="dial-star star-one" /><span className="dial-star star-two" /><span className="dial-star star-three" /></div><div className="signal-caption"><strong>{simulation ? `${supportCount} supported · ${conflictCount} conflicting` : "Evidence has a shape"}</strong><span>{simulation ? "Click through the constellation to inspect individual signal strength." : "Run the fixture and chart logic resolves into a 40-point evidence field."}</span></div></div></section>

      {showConfig && <section className="config-dock"><div className="config-dock-title"><Settings2 size={17} /><div><strong>Agent View calibration</strong><span>God View remains fixed to the permanent Aries-zero reference.</span></div></div><div className="model-options"><button className={model === "astronomical" ? "model-selected" : ""} onClick={() => setModel("astronomical")}><Compass size={16} /><span><b>Astronomical</b><small>Spherical-Earth local ascendant</small></span></button><button className={model === "fixed-earth-dawn-anchored" ? "model-selected" : ""} onClick={() => setModel("fixed-earth-dawn-anchored")}><Zap size={16} /><span><b>Dawn anchored</b><small>Configured sunrise reference</small></span></button></div><button className="dock-close" onClick={() => setShowConfig(false)}><X size={16} /></button></section>}

      <LiveNowRail games={(liveGames.data ?? []) as LiveGame[]} isLoading={liveGames.isLoading || liveGames.isFetching} selectedId={selectedLiveGame?.id} onRefresh={() => void liveGames.refetch()} onSelect={openLiveGame} />

      <section className="stats-ribbon"><div><span><Activity size={14} />Baseline status</span><strong>{simulation ? verdictCopy(simulation.baseline.verdict) : "Trace-ready"}</strong><small>{simulation ? sideLabel(simulation.baseline.winner, simulation) : "No model result yet"}</small></div><div><span><Target size={14} />Frame relationship</span><strong>{agreement}</strong><small>{simulation ? `${sideLabel(simulation.godView.synthesis.winner, simulation)} / ${sideLabel(simulation.agentView.synthesis.winner, simulation)}` : "Two frames stand ready"}</small></div><div><span><Gauge size={14} />Evidence density</span><strong>{simulation ? `${supportCount + conflictCount} / 42` : "42 methods"}</strong><small>{simulation ? "Scored readings in current trace" : "Each reading retains its own state"}</small></div><div><span><Trophy size={14} />Fixture</span><strong>{simulation ? (simulation.comparison.verified ? "Verified" : "Unverified") : "Pinned sample"}</strong><small>{simulation ? `${simulation.input.teamA} vs ${simulation.input.teamB}` : "Yankees vs Astros · 02 Apr 2024"}</small></div></section>

      <section className="frame-deck"><div className="section-intro"><div><p className="eyebrow">Perspective pair</p><h2>Two coordinate frames. One auditable decision surface.</h2></div><p>Read their independence before reading their agreement. The experiment gains evidence when each frame is allowed to state its own case.</p></div><div className="frame-grid"><FrameCard frame={simulation?.godView ?? null} kind="god" simulation={simulation} active={activeFrame === "god"} onClick={() => setActiveFrame("god")} /><div className="frame-link"><span>FRAME COMPARISON</span><div><i /><i /><i /></div><strong>{agreement}</strong></div><FrameCard frame={simulation?.agentView ?? null} kind="agent" simulation={simulation} active={activeFrame === "agent"} onClick={() => setActiveFrame("agent")} /></div></section>
      <FrameExplanation simulation={simulation} />
      <DecisionBreakdown simulation={simulation} />

      <section className="visual-grid"><MethodConstellation layers={layers} simulation={simulation} selected={selected} onSelect={selectLayer} /><div className="visual-side"><div className="astrolabe-switch"><button className={activeFrame === "god" ? "wheel-active" : ""} onClick={() => setActiveFrame("god")}>God View wheel</button><button className={activeFrame === "agent" ? "wheel-active" : ""} onClick={() => setActiveFrame("agent")}>Agent View wheel</button></div><Astrolabe frame={frameForWheel} kind={activeFrame} active onSelect={() => setActiveFrame(activeFrame === "god" ? "agent" : "god")} /><EvidenceCard selected={selected} simulation={simulation} onClear={() => setSelected(null)} /></div></section>

      <MethodLedger layers={layers} simulation={simulation} filter={filter} onFilter={setFilter} selected={selected} onSelect={selectLayer} />

      <section className="research-notes"><div><p className="eyebrow">Provenance record</p><h2>Logic remains first-class evidence.</h2><p>The interface only changes the visibility of the calculation. The engine remains in the preserved Firmament boundary, and every surface carries its source frame or verification state.</p></div><div className="note-list"><div><Orbit size={17} /><span><b>Fixed background</b><small>{simulation?.engine.fixedBackground ?? "Aries-zero zodiac wheel, anchored before calculation"}</small></span></div><div><MapPin size={17} /><span><b>Event perspective</b><small>{simulation ? `${simulation.input.location} · ${new Date(simulation.input.startTime).toLocaleString()}` : "Venue and event time resolve at run time"}</small></span></div><div><Sparkles size={17} /><span><b>Engine path</b><small>{simulation?.engine.calculationPath ?? "Chart, geometry, frame challenger, and method audit"}</small></span></div></div></section>
    </main>
  </div>;
}
