import { useEffect, useMemo, useRef, useState, type ComponentType } from "react";
import {
  Activity,
  ArrowUpRight,
  CalendarClock,
  CalendarDays,
  CheckCircle2,
  ChevronDown,
  CircleHelp,
  Clock3,
  Compass,
  Database,
  Download,
  ExternalLink,
  FileChartColumn,
  Filter,
  Flame,
  FlaskConical,
  Gauge,
  GitBranch,
  Globe2,
  Info,
  Layers3,
  Map,
  MoreHorizontal,
  Orbit,
  Play,
  Radio,
  RefreshCw,
  Search,
  Settings2,
  ShieldCheck,
  Sparkles,
  Star,
  Target,
  Telescope,
  TrendingUp,
  Upload,
  Waves,
  X,
  Zap,
} from "lucide-react";
import { toast } from "sonner";
import { trpc } from "@/lib/trpc";
import {
  CalculationProofPanel,
  downloadResultBundle,
  HousePlacementPanel,
  ManualFixtureDialog,
  MethodExplorer,
  TransparencyPanel,
  type FixtureInput,
  RunHistoryPanel,
} from "@/components/ResearchWorkbench";
import { AIChatBox, type Message } from "@/components/AIChatBox";

type LabTab = "overview" | "market" | "replay" | "audit" | "assistant";

type Template = {
  id: string;
  sport: string;
  code: string;
  label: string;
  events: number;
  range: string;
  status: "ready" | "draft";
  accent: "amber" | "cyan" | "purple" | "slate";
};

const templates: Template[] = [
  { id: "mlb-2024", sport: "MLB", code: "MLB", label: "2024 Regular Season Replay", events: 2430, range: "Mar 28 — Sep 29, 2024", status: "ready", accent: "amber" },
  { id: "nfl-2023", sport: "NFL", code: "NFL", label: "2023 Championship Continuum", events: 272, range: "Sep 7, 2023 — Jan 7, 2024", status: "ready", accent: "cyan" },
  { id: "nba-2024", sport: "NBA", code: "NBA", label: "2023–24 Dynasty Series", events: 1230, range: "Oct 24, 2023 — Apr 14, 2024", status: "ready", accent: "purple" },
  { id: "custom", sport: "Custom", code: "CSV", label: "Client Telemetry Ingestion", events: 0, range: "Awaiting CSV ingestion", status: "draft", accent: "slate" },
];

function LuxuryPill({ children, tone = "slate" }: { children: React.ReactNode; tone?: "slate" | "cyan" | "gold" | "emerald" | "amber" | "purple" }) {
  const styles = {
    slate: "border-white/10 bg-white/[0.04] text-slate-300",
    cyan: "border-cyan-400/30 bg-cyan-400/10 text-cyan-200 shadow-[0_0_12px_rgba(34,211,238,0.15)]",
    gold: "border-amber-400/30 bg-amber-400/10 text-amber-200 shadow-[0_0_12px_rgba(251,191,36,0.15)]",
    emerald: "border-emerald-400/30 bg-emerald-400/10 text-emerald-200 shadow-[0_0_12px_rgba(52,211,153,0.15)]",
    amber: "border-orange-400/30 bg-orange-400/10 text-orange-200 shadow-[0_0_12px_rgba(251,146,60,0.15)]",
    purple: "border-violet-400/30 bg-violet-400/10 text-violet-200 shadow-[0_0_12px_rgba(167,139,250,0.15)]",
  };
  return (
    <span className={`inline-flex items-center gap-1.5 rounded-full border px-3 py-1 text-[10px] font-semibold tracking-[0.14em] uppercase backdrop-blur-md ${styles[tone]}`}>
      {children}
    </span>
  );
}

function StatWidget({
  icon: Icon,
  eyebrow,
  value,
  subvalue,
  detail,
  accentGlow,
  indicator,
}: {
  icon: typeof Activity;
  eyebrow: string;
  value: string;
  subvalue?: string;
  detail: string;
  accentGlow: string;
  indicator?: "active" | "ready" | "neutral";
}) {
  return (
    <div className="obs-panel obs-panel-interactive group relative overflow-hidden p-6">
      <div className={`celestial-glow -right-12 -top-12 h-36 w-36 ${accentGlow}`} />
      <div className="relative z-10 flex flex-col justify-between h-full">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <span className="text-[10px] font-bold uppercase tracking-[0.2em] text-slate-400 font-mono">{eyebrow}</span>
            {indicator === "active" && (
              <span className="relative flex h-2 w-2">
                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75" />
                <span className="relative inline-flex rounded-full h-2 w-2 bg-emerald-500" />
              </span>
            )}
          </div>
          <div className="rounded-xl border border-white/10 bg-white/[0.04] p-2.5 text-slate-300 transition-colors group-hover:border-cyan-400/30 group-hover:text-cyan-300">
            <Icon size={18} strokeWidth={1.5} />
          </div>
        </div>

        <div className="mt-5">
          <div className="flex items-baseline gap-2">
            <span className="font-serif text-3xl font-bold tracking-tight text-white lg:text-4xl">{value}</span>
            {subvalue && <span className="text-xs font-medium text-slate-400 font-mono">{subvalue}</span>}
          </div>
          <p className="mt-2 text-xs leading-relaxed text-slate-400">{detail}</p>
        </div>
      </div>
    </div>
  );
}

function AstrometricMap({ frame, mode }: { frame: string; mode: "god" | "agent" }) {
  const isGod = mode === "god";
  return (
    <div className="obs-panel relative h-[240px] overflow-hidden p-4 group">
      <div className="celestial-mesh" />
      <div className={`celestial-glow ${isGod ? "top-4 left-1/4 h-32 w-32 bg-cyan-500/20" : "bottom-4 right-1/4 h-32 w-32 bg-purple-500/20"}`} />
      
      {/* Decorative Constellation Overlay */}
      <svg className="absolute inset-0 h-full w-full opacity-60" viewBox="0 0 540 240" preserveAspectRatio="none">
        <circle cx={isGod ? "160" : "360"} cy="120" r="90" fill="none" stroke="rgba(255,255,255,0.06)" strokeDasharray="3 3" />
        <circle cx={isGod ? "160" : "360"} cy="120" r="45" fill="none" stroke="rgba(255,255,255,0.08)" />
        <path
          d={isGod ? "M-20 180 C80 90 120 220 200 130 S340 50 440 130 S500 160 560 70" : "M-20 70 C90 170 150 20 240 120 S370 230 450 120 S520 90 560 190"}
          fill="none"
          stroke={isGod ? "url(#godGrad)" : "url(#agentGrad)"}
          strokeWidth="1.8"
        />
        <defs>
          <linearGradient id="godGrad" x1="0" y1="0" x2="1" y2="0">
            <stop offset="0%" stopColor="#38bdf8" stopOpacity="0.2" />
            <stop offset="50%" stopColor="#38bdf8" stopOpacity="0.9" />
            <stop offset="100%" stopColor="#f59e0b" stopOpacity="0.7" />
          </linearGradient>
          <linearGradient id="agentGrad" x1="0" y1="0" x2="1" y2="0">
            <stop offset="0%" stopColor="#c084fc" stopOpacity="0.2" />
            <stop offset="50%" stopColor="#c084fc" stopOpacity="0.9" />
            <stop offset="100%" stopColor="#38bdf8" stopOpacity="0.7" />
          </linearGradient>
        </defs>
        <circle cx={isGod ? "200" : "330"} cy={isGod ? "130" : "115"} r="4.5" fill={isGod ? "#fcd34d" : "#e879f9"} />
        <circle cx={isGod ? "200" : "330"} cy={isGod ? "130" : "115"} r="18" fill="none" stroke={isGod ? "#fcd34d" : "#e879f9"} strokeOpacity="0.3" className="animate-ping" />
      </svg>

      <div className="relative z-10 flex h-full flex-col justify-between">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            <span className={`h-2 w-2 rounded-full ${isGod ? "bg-cyan-400 shadow-[0_0_8px_#22d3ee]" : "bg-purple-400 shadow-[0_0_8px_#c084fc]"}`} />
            <span className="font-display text-sm font-semibold tracking-wide text-white">{frame}</span>
          </div>
          <LuxuryPill tone={isGod ? "gold" : "purple"}>
            {isGod ? "Hamal Anchor • 13° Aries" : "Local Topocentric"}
          </LuxuryPill>
        </div>

        <div className="flex items-end justify-between border-t border-white/[0.08] pt-3">
          <div>
            <p className="text-[10px] font-mono uppercase tracking-[0.2em] text-slate-400">Reference Frame</p>
            <p className="mt-1 text-xs font-medium text-slate-200">
              {isGod ? "Invariant Sidereal Background" : "Event Horizon Topography"}
            </p>
          </div>
          <span className="text-[10px] font-mono text-cyan-300/80">J2000.0 FIXED</span>
        </div>
      </div>
    </div>
  );
}

function CelestialPlacementTable({ planets }: { planets: Array<{ planet: string; sign: string; house: number; degreeInHouse: number; nakshatra: string; starLord: string; subLord: string; isRetrograde: boolean }> }) {
  return (
    <div className="mt-6 overflow-hidden rounded-2xl border border-white/[0.1] bg-black/30 backdrop-blur-md">
      <div className="flex items-center justify-between border-b border-white/[0.08] px-5 py-4 bg-gradient-to-r from-white/[0.02] to-transparent">
        <div>
          <p className="text-[10px] font-mono uppercase tracking-[0.2em] text-cyan-300">Ephemeris Placements</p>
          <h3 className="text-sm font-semibold text-white">Fixed-Background Celestial Topology</h3>
        </div>
        <LuxuryPill tone="gold">{planets.length} Celestial Bodies</LuxuryPill>
      </div>
      <div className="overflow-x-auto">
        <table className="w-full min-w-[780px] text-left">
          <thead>
            <tr className="border-b border-white/[0.06] text-[10px] font-mono uppercase tracking-[0.16em] text-slate-400 bg-white/[0.01]">
              <th className="px-5 py-3">Celestial Body</th>
              <th>Zodiacal Sign</th>
              <th>House</th>
              <th>Degree / Min</th>
              <th>Lunar Mansion (Nakshatra)</th>
              <th>Star → Sub Lord</th>
              <th className="text-right px-5">State</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-white/[0.04]">
            {planets.map((planet) => (
              <tr key={planet.planet} className="text-xs text-slate-300 hover:bg-white/[0.02] transition-colors">
                <td className="px-5 py-3.5 font-semibold text-white flex items-center gap-2">
                  <span className="h-1.5 w-1.5 rounded-full bg-cyan-400" />
                  {planet.planet}
                </td>
                <td className="font-medium text-slate-200">{planet.sign}</td>
                <td>
                  <span className="rounded-md border border-white/10 bg-white/[0.03] px-2 py-0.5 text-[11px] font-mono text-cyan-300">
                    H{planet.house}
                  </span>
                </td>
                <td className="font-mono text-slate-200">{planet.degreeInHouse.toFixed(2)}°</td>
                <td className="text-slate-300">{planet.nakshatra}</td>
                <td className="font-mono text-slate-400">
                  <span className="text-slate-200">{planet.starLord}</span>
                  <span className="mx-1 text-slate-600">→</span>
                  <span className="text-cyan-300">{planet.subLord}</span>
                </td>
                <td className="px-5 text-right">
                  {planet.isRetrograde ? (
                    <span className="inline-flex items-center gap-1 text-[10px] font-semibold text-amber-300 bg-amber-400/10 border border-amber-400/20 px-2 py-0.5 rounded-full">
                      Retrograde
                    </span>
                  ) : (
                    <span className="inline-flex items-center gap-1 text-[10px] font-semibold text-emerald-300 bg-emerald-400/10 border border-emerald-400/20 px-2 py-0.5 rounded-full">
                      Direct
                    </span>
                  )}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}

function LuxuryGameBrief({ result }: { result: any }) {
  const teamName = (side: string | null | undefined) =>
    side === "A" ? result.input.teamA : side === "B" ? result.input.teamB : side === "TIE" ? "Undecided" : "Unverified";
  const actual = result.comparison.actualWinner as string | null;
  const god = result.godView.synthesis.winner as string;
  const agent = result.agentView.synthesis.winner as string;
  const baseline = result.baseline.winner as string;
  const hits = result.godView.summary.hits + result.agentView.summary.hits;
  const total = result.godView.allLayers.length + result.agentView.allLayers.length;
  const agreement = god === agent && god !== "TIE" ? "Dual-Frame Consensus" : god === "TIE" || agent === "TIE" ? "Indeterminate" : "Polarized Divergence";
  const evidence = hits / Math.max(total, 1) >= 0.7 && agreement === "Dual-Frame Consensus" ? "Strong Confidence" : hits / Math.max(total, 1) >= 0.45 ? "Equivocal Evidence" : "Conflicted Evidence";

  const supporting = [
    ...result.godView.allLayers.map((layer: any) => ({ ...layer, frame: "God View" })),
    ...result.agentView.allLayers.map((layer: any) => ({ ...layer, frame: "AgentView" })),
  ].filter((layer: any) => layer.verdict === "hit");

  const conflicting = [
    ...result.godView.allLayers.map((layer: any) => ({ ...layer, frame: "God View" })),
    ...result.agentView.allLayers.map((layer: any) => ({ ...layer, frame: "AgentView" })),
  ].filter((layer: any) => layer.verdict === "miss");

  const explanation = agreement === "Dual-Frame Consensus"
    ? `Both the fixed sidereal baseline (God View) and topocentric event projection (AgentView) converged decisively on ${teamName(god)}. Strong geometric harmony was verified across invariant and observer-local horizons.`
    : `A structural bifurcation was detected: God View favored ${teamName(god)} through invariant celestial coordinates, whereas AgentView indicated ${teamName(agent)} via topocentric ascendant dynamics. Research audit requires isolated method weighting.`;

  return (
    <section className="mt-8 obs-panel overflow-hidden border-cyan-400/25 shadow-[0_24px_80px_rgba(34,211,238,0.06)]">
      <div className="obs-panel-header">
        <div className="flex items-center gap-3">
          <div className="rounded-xl border border-cyan-400/30 bg-cyan-400/10 p-2.5 text-cyan-300">
            <Telescope size={20} />
          </div>
          <div>
            <p className="text-[10px] font-mono uppercase tracking-[0.22em] text-cyan-300">Executive Synthesis</p>
            <h2 className="font-serif text-xl font-bold tracking-tight text-white">Observatory Decision Brief</h2>
          </div>
        </div>
        <LuxuryPill tone={evidence === "Strong Confidence" ? "emerald" : evidence === "Equivocal Evidence" ? "gold" : "amber"}>
          {evidence}
        </LuxuryPill>
      </div>

      <div className="grid gap-6 p-6 lg:grid-cols-[1.3fr_1fr_1fr]">
        <div className="rounded-2xl border border-white/10 bg-gradient-to-br from-white/[0.04] to-transparent p-6">
          <span className="text-[10px] font-mono uppercase tracking-[0.2em] text-slate-400">System Convergence Target</span>
          <p className="mt-3 font-serif text-3xl font-bold text-white tracking-wide">{teamName(baseline)}</p>
          <p className="mt-1 text-xs text-slate-400">Harmonized Baseline Synthesis Output</p>
          <div className="mt-6 flex flex-wrap items-center gap-2.5">
            <span className={`inline-flex items-center gap-1.5 rounded-full border px-3 py-1 text-[10px] font-mono font-bold tracking-wider uppercase ${actual ? (baseline === actual ? "border-emerald-400/30 bg-emerald-400/10 text-emerald-200" : "border-rose-400/30 bg-rose-400/10 text-rose-200") : "border-white/10 bg-white/5 text-slate-300"}`}>
              {actual ? (baseline === actual ? "✓ HISTORICAL HIT" : "✗ HISTORICAL MISS") : "AWAITING VERIFIED SCORE"}
            </span>
            <span className="inline-flex items-center gap-1.5 rounded-full border border-cyan-400/30 bg-cyan-400/10 px-3 py-1 text-[10px] font-mono font-bold text-cyan-200 uppercase">
              {agreement}
            </span>
          </div>
        </div>

        <div className="rounded-2xl border border-white/10 bg-white/[0.02] p-6">
          <span className="text-[10px] font-mono uppercase tracking-[0.2em] text-slate-400">Ground Truth Validation</span>
          <p className="mt-3 font-serif text-2xl font-bold text-white">{teamName(actual)}</p>
          <p className="mt-1 text-xs text-slate-400">{actual ? "Officially Certified Historical Result" : "Prospective Event • Unscored"}</p>
          <div className="mt-6 grid grid-cols-2 gap-3 pt-4 border-t border-white/[0.08]">
            <div>
              <span className="block text-[9px] font-mono uppercase tracking-widest text-slate-500">God View</span>
              <strong className="mt-1 block text-sm font-semibold text-slate-200">{teamName(god)}</strong>
            </div>
            <div>
              <span className="block text-[9px] font-mono uppercase tracking-widest text-slate-500">AgentView</span>
              <strong className="mt-1 block text-sm font-semibold text-slate-200">{teamName(agent)}</strong>
            </div>
          </div>
        </div>

        <div className="rounded-2xl border border-white/10 bg-white/[0.02] p-6">
          <span className="text-[10px] font-mono uppercase tracking-[0.2em] text-slate-400">Empirical Method Accuracy</span>
          <div className="mt-3 flex items-baseline gap-2">
            <span className="font-serif text-3xl font-bold text-white">{hits}</span>
            <span className="text-sm font-mono text-slate-500">/ {total} layers verified</span>
          </div>
          <p className="mt-1 text-xs text-slate-400">Dual-perspective geometric congruence ratio</p>
          <div className="mt-6">
            <div className="h-2 w-full overflow-hidden rounded-full bg-white/[0.08]">
              <div
                className="h-full rounded-full bg-gradient-to-r from-cyan-400 to-emerald-400 shadow-[0_0_12px_rgba(52,211,153,0.5)] transition-all duration-700"
                style={{ width: `${Math.min(100, (hits / Math.max(total, 1)) * 100)}%` }}
              />
            </div>
            <div className="mt-2 flex justify-between text-[10px] font-mono text-slate-400">
              <span>Agreement Score</span>
              <span>{Math.round((hits / Math.max(total, 1)) * 100)}%</span>
            </div>
          </div>
        </div>
      </div>

      <div className="border-t border-white/[0.08] p-6 bg-white/[0.01]">
        <div className="max-w-4xl">
          <p className="text-[10px] font-mono uppercase tracking-[0.2em] text-cyan-300">Epistemic Analysis</p>
          <p className="mt-2 text-sm leading-relaxed text-slate-200">{explanation}</p>
        </div>

        <div className="mt-6 grid gap-6 md:grid-cols-2">
          <div className="rounded-xl border border-emerald-400/20 bg-emerald-400/[0.03] p-4">
            <div className="flex items-center justify-between">
              <span className="text-xs font-semibold text-emerald-300 flex items-center gap-1.5">
                <CheckCircle2 size={15} /> Validating Corroborating Layers
              </span>
              <span className="rounded-full bg-emerald-400/10 px-2 py-0.5 text-xs font-mono font-bold text-emerald-300">
                {supporting.length}
              </span>
            </div>
            <div className="mt-3 space-y-2 max-h-48 overflow-y-auto pr-1">
              {supporting.length ? (
                supporting.map((layer: any) => (
                  <div key={`support-${layer.frame}-${layer.name}`} className="flex items-center justify-between text-xs py-1 border-b border-emerald-400/10 last:border-0">
                    <span className="text-slate-300">{layer.name}</span>
                    <span className="text-[10px] font-mono text-slate-500">{layer.frame}</span>
                  </div>
                ))
              ) : (
                <p className="text-xs text-slate-500">No verified supporting layers found.</p>
              )}
            </div>
          </div>

          <div className="rounded-xl border border-rose-400/20 bg-rose-400/[0.03] p-4">
            <div className="flex items-center justify-between">
              <span className="text-xs font-semibold text-rose-300 flex items-center gap-1.5">
                <X size={15} /> Conflicting Divergent Layers
              </span>
              <span className="rounded-full bg-rose-400/10 px-2 py-0.5 text-xs font-mono font-bold text-rose-300">
                {conflicting.length}
              </span>
            </div>
            <div className="mt-3 space-y-2 max-h-48 overflow-y-auto pr-1">
              {conflicting.length ? (
                conflicting.map((layer: any) => (
                  <div key={`conflict-${layer.frame}-${layer.name}`} className="flex items-center justify-between text-xs py-1 border-b border-rose-400/10 last:border-0">
                    <span className="text-slate-300">{layer.name}</span>
                    <span className="text-[10px] font-mono text-slate-500">{layer.frame}</span>
                  </div>
                ))
              ) : (
                <p className="text-xs text-slate-500">No conflicting layers encountered.</p>
              )}
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}

export default function Home() {
  const [activeTab, setActiveTab] = useState<LabTab>("overview");
  const [activeTemplate, setActiveTemplate] = useState("mlb-2024");
  const [selectedSport, setSelectedSport] = useState("All sports");
  const [isRunning, setIsRunning] = useState(false);
  const [runProgress, setRunProgress] = useState(0);
  const [showConfig, setShowConfig] = useState(false);
  const [showManualFixture, setShowManualFixture] = useState(false);
  const [agentViewModel, setAgentViewModel] = useState<"astronomical" | "fixed-earth-dawn-anchored">("astronomical");
  const [sunriseTime, setSunriseTime] = useState("2024-04-01T12:10:13.153Z");
  const [sunriseSource, setSunriseSource] = useState("Weather Channel");
  const [search, setSearch] = useState("");
  const [scheduleDate, setScheduleDate] = useState(() => new Date().toISOString().slice(0, 10));
  const [scheduleSport, setScheduleSport] = useState<"ALL" | "MLB" | "NBA" | "NFL">("ALL");
  const [simulationResult, setSimulationResult] = useState<any>(null);
  const [importedDataset, setImportedDataset] = useState<{ id: number; name: string; rowCount: number; validRowCount: number; invalidRowCount: number } | null>(null);
  const [activeRunId, setActiveRunId] = useState<number | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const gameBriefRef = useRef<HTMLDivElement>(null);

  const simulateEvent = trpc.simulate.event.useMutation();
  const importCsv = trpc.datasets.importCsv.useMutation();
  const startRun = trpc.runs.start.useMutation();
  const runStatus = trpc.runs.get.useQuery({ runId: activeRunId ?? 0 }, { enabled: Boolean(activeRunId), refetchInterval: activeRunId ? 1000 : false });
  const runHistory = trpc.runs.list.useQuery({ limit: 8 });
  const scheduleQuery = trpc.schedules.list.useQuery({ date: scheduleDate, sport: scheduleSport });

  const [chatMessages, setChatMessages] = useState<Message[]>([
    { role: "system", content: "You are the Firmament research assistant." },
  ]);
  const chatMutation = trpc.ai.chat.useMutation({
    onSuccess: (response) => setChatMessages((current) => [...current, { role: "assistant", content: response.content }]),
    onError: () => toast.error("The research assistant could not respond right now."),
  });

  const filteredTemplates = useMemo(() => {
    return templates.filter((template) => {
      const matchesSport = selectedSport === "All sports" || template.sport === selectedSport;
      const matchesSearch = `${template.label} ${template.sport}`.toLowerCase().includes(search.toLowerCase());
      return matchesSport && matchesSearch;
    });
  }, [search, selectedSport]);

  useEffect(() => {
    if (runStatus.data?.status === "complete" || runStatus.data?.status === "partial" || runStatus.data?.status === "failed") {
      setIsRunning(false);
      setRunProgress(runStatus.data.progressPercent);
      void runHistory.refetch();
      if (runStatus.data.status === "complete") {
        toast.success("Batch replay complete", { description: `${runStatus.data.completedEvents.toLocaleString()} events calculated and persisted.` });
      }
      if (runStatus.data.status === "partial") {
        toast.warning("Batch replay finished with partial errors", { description: `${runStatus.data.failedEvents} events failed during calculation.` });
      }
    }
  }, [runStatus.data]);

  useEffect(() => {
    if (simulationResult) {
      window.setTimeout(() => gameBriefRef.current?.scrollIntoView({ behavior: "smooth", block: "start" }), 100);
    }
  }, [simulationResult]);

  const importFile = async (file: File) => {
    try {
      setIsRunning(true);
      const response = await importCsv.mutateAsync({
        name: file.name.replace(/\.csv$/i, "") || "Imported event set",
        sourceFileName: file.name,
        csv: await file.text(),
      });
      setImportedDataset({
        id: response.datasetId,
        name: file.name,
        rowCount: response.rowCount,
        validRowCount: response.validRowCount,
        invalidRowCount: response.invalidRowCount,
      });
      setIsRunning(false);
      toast.success("Dataset validated and imported", {
        description: `${response.validRowCount.toLocaleString()} valid events ready for simulation.`,
      });
    } catch (error) {
      setIsRunning(false);
      toast.error("CSV import failed", { description: error instanceof Error ? error.message : "The dataset could not be validated." });
    }
  };

  const runSimulation = async () => {
    if (isRunning) return;
    setIsRunning(true);
    setRunProgress(15);

    if (importedDataset) {
      try {
        const response = await startRun.mutateAsync({ datasetId: importedDataset.id });
        setActiveRunId(response.runId);
        setRunProgress(1);
        toast.success("Batch replay initiated", { description: `${response.totalEvents.toLocaleString()} validated events processing.` });
      } catch (error) {
        setIsRunning(false);
        toast.error("Batch replay failed", { description: error instanceof Error ? error.message : "Run execution failed." });
      }
      return;
    }

    const intervals = [35, 62, 80, 95, 100];
    intervals.forEach((val, idx) => {
      setTimeout(() => {
        setRunProgress(val);
        if (val === 100) setIsRunning(false);
      }, (idx + 1) * 350);
    });

    try {
      const result = await simulateEvent.mutateAsync({
        id: "engine-smoke-test-mlb-002",
        teamA: "New York Yankees",
        teamB: "Houston Astros",
        sport: "MLB",
        location: "Houston, TX",
        latitude: 29.7604,
        longitude: -95.3698,
        startTime: "2024-04-02T00:10:00.000Z",
        actualWinner: "B",
        agentViewModel,
        ...(agentViewModel === "fixed-earth-dawn-anchored" ? { sunriseTime: new Date(sunriseTime).toISOString(), sunriseSource } : {}),
      });
      setSimulationResult(result);
      toast.success("Simulation convergence completed", { description: "High-precision telemetry synthesized below." });
    } catch (error) {
      setIsRunning(false);
      toast.error("Simulation failed", { description: error instanceof Error ? error.message : "Engine returned an error." });
    }
  };

  const runManualFixture = async (fixture: FixtureInput) => {
    if (isRunning) return;
    setIsRunning(true);
    setRunProgress(20);
    try {
      const result = await simulateEvent.mutateAsync({
        ...fixture,
        agentViewModel,
        ...(agentViewModel === "fixed-earth-dawn-anchored" ? { sunriseTime: new Date(sunriseTime).toISOString(), sunriseSource } : {}),
      });
      setSimulationResult(result);
      setRunProgress(100);
      toast.success("Custom fixture resolved", { description: `${fixture.teamA} vs ${fixture.teamB} calculated successfully.` });
    } catch (error) {
      toast.error("Fixture calculation failed", { description: error instanceof Error ? error.message : "Engine failed." });
    } finally {
      setIsRunning(false);
    }
  };

  const runScheduledGame = async (game: any) => {
    await runManualFixture({
      id: game.id,
      teamA: game.teamA,
      teamB: game.teamB,
      sport: game.sport,
      location: game.location,
      latitude: game.latitude,
      longitude: game.longitude,
      startTime: game.startTime,
    });
  };

  const downloadSampleCsv = () => {
    const csv = [
      "id,teamA,teamB,sport,location,latitude,longitude,startTime,actualWinner",
      "sample-mlb-001,New York Yankees,Houston Astros,MLB,Houston TX,29.7604,-95.3698,2024-04-02T00:10:00.000Z,B",
      "sample-nfl-001,Kansas City Chiefs,San Francisco 49ers,NFL,Las Vegas NV,36.1699,-115.1398,2024-02-11T23:30:00.000Z,A",
    ].join("\n");
    const url = URL.createObjectURL(new Blob([csv], { type: "text/csv;charset=utf-8" }));
    const link = document.createElement("a");
    link.href = url;
    link.download = "firmament-simulation-sample.csv";
    link.click();
    URL.revokeObjectURL(url);
    toast.success("Sample CSV downloaded");
  };

  const explainMethod = (layer: any) => {
    const question = `Explain the ${layer.frame} method “${layer.name}”. Its status is ${layer.verdict}, it selected Side ${layer.winner}, and its raw scores are A ${Number(layer.scoreA).toFixed(1)} / B ${Number(layer.scoreB).toFixed(1)}.`;
    const next = [...chatMessages, { role: "user" as const, content: question }];
    setChatMessages(next);
    const context = simulationResult
      ? JSON.stringify({ event: simulationResult.input, actualWinner: simulationResult.comparison.actualWinner, selectedLayer: layer })
      : undefined;
    chatMutation.mutate({ messages: next, context });
    window.setTimeout(() => document.getElementById("research-assistant")?.scrollIntoView({ behavior: "smooth", block: "center" }), 80);
  };

  return (
    <div className="relative min-h-screen bg-[#040813] text-[#e3ebf6]">
      {/* Ambient Lighting FX */}
      <div className="fixed inset-0 pointer-events-none overflow-hidden">
        <div className="celestial-glow top-0 right-1/4 h-[500px] w-[500px] bg-cyan-600/10" />
        <div className="celestial-glow bottom-0 left-1/4 h-[600px] w-[600px] bg-purple-900/15" />
      </div>

      <div className="relative mx-auto flex min-h-screen max-w-[1680px]">
        {/* Luxury Sidebar */}
        <aside className="hidden w-[270px] shrink-0 border-r border-white/[0.08] bg-[#070d1a]/85 backdrop-blur-2xl p-6 lg:flex lg:flex-col lg:justify-between">
          <div>
            <div className="flex items-center gap-3 px-1">
              <div className="relative flex h-10 w-10 items-center justify-center rounded-xl border border-cyan-400/40 bg-gradient-to-br from-cyan-400/20 to-purple-600/20 text-cyan-300 shadow-[0_0_20px_rgba(34,211,238,0.25)]">
                <Orbit size={22} className="anim-celestial-spin" />
              </div>
              <div>
                <p className="font-serif text-lg font-bold tracking-wider text-white">FIRMAMENT</p>
                <p className="text-[9px] font-mono tracking-[0.25em] text-cyan-300">OBSERVATORY LAB</p>
              </div>
            </div>

            <div className="mt-10">
              <span className="px-2 text-[9px] font-mono font-bold uppercase tracking-[0.25em] text-slate-500">
                Core Modules
              </span>
              <nav className="mt-3 space-y-1">
                {[
                  { id: "overview" as LabTab, icon: Activity, label: "Overview", note: "Workspace" },
                  { id: "market" as LabTab, icon: Globe2, label: "Market Feed", note: "Live" },
                  { id: "replay" as LabTab, icon: FlaskConical, label: "Replay Engine", note: "Data" },
                  { id: "audit" as LabTab, icon: Compass, label: "Audit Matrix", note: "Proof" },
                  { id: "assistant" as LabTab, icon: Sparkles, label: "Research Assistant", note: "Neural" },
                ].map((item) => {
                  const isActive = activeTab === item.id;
                  return (
                    <button
                      key={item.id}
                      onClick={() => setActiveTab(item.id)}
                      className={`flex w-full items-center gap-3 rounded-xl px-3.5 py-2.5 text-xs font-medium transition-all ${
                        isActive
                          ? "border border-cyan-400/30 bg-gradient-to-r from-cyan-400/15 to-transparent text-white shadow-[inset_3px_0_0_#38bdf8]"
                          : "text-slate-400 hover:bg-white/[0.04] hover:text-slate-200"
                      }`}
                    >
                      <item.icon size={16} className={isActive ? "text-cyan-300" : "text-slate-500"} />
                      <span>{item.label}</span>
                      <span className={`ml-auto text-[9px] font-mono ${isActive ? "text-cyan-300" : "text-slate-600"}`}>{item.note}</span>
                    </button>
                  );
                })}
              </nav>
            </div>

            <div className="mt-8">
              <span className="px-2 text-[9px] font-mono font-bold uppercase tracking-[0.25em] text-slate-500">
                Telemetry Archives
              </span>
              <nav className="mt-3 space-y-1">
                {[
                  { icon: Database, label: "Historical Ephemeris" },
                  { icon: GitBranch, label: "Invariant Standards" },
                  { icon: Target, label: "Scoring Verification" },
                ].map((item) => (
                  <button
                    key={item.label}
                    onClick={() => toast.info(`${item.label} available in telemetry logs.`)}
                    className="flex w-full items-center gap-3 rounded-xl px-3.5 py-2.5 text-xs font-medium text-slate-400 hover:bg-white/[0.04] hover:text-slate-200 transition-colors"
                  >
                    <item.icon size={16} className="text-slate-500" />
                    <span>{item.label}</span>
                  </button>
                ))}
              </nav>
            </div>
          </div>

          <div className="rounded-2xl border border-white/[0.08] bg-gradient-to-br from-white/[0.03] to-transparent p-4">
            <div className="flex items-center gap-2 text-amber-300">
              <ShieldCheck size={16} />
              <span className="text-[10px] font-mono font-bold uppercase tracking-wider">Engine Anchor Verified</span>
            </div>
            <p className="mt-2 text-[11px] leading-relaxed text-slate-400">
              J2000.0 Sidereal Invariant Standard pinned to 13° Aries / Hamal. Real-time deterministic computation active.
            </p>
          </div>
        </aside>

        {/* Main Content Area */}
        <main className="min-w-0 flex-1 px-6 py-6 sm:px-10 lg:px-12 lg:py-8">
          <ManualFixtureDialog
            open={showManualFixture}
            onClose={() => setShowManualFixture(false)}
            onRun={runManualFixture}
            isRunning={isRunning}
          />

          {/* Top Header */}
          <header className="flex flex-col gap-6 border-b border-white/[0.08] pb-8 sm:flex-row sm:items-center sm:justify-between">
            <div>
              <div className="flex items-center gap-2.5">
                <span className="relative flex h-2 w-2">
                  <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-cyan-400 opacity-75" />
                  <span className="relative inline-flex rounded-full h-2 w-2 bg-cyan-400" />
                </span>
                <p className="text-[10px] font-mono uppercase tracking-[0.25em] text-cyan-300">
                  Astrometric Sports Intelligence Platform
                </p>
              </div>
              <h1 className="mt-3 font-serif text-3xl font-bold tracking-tight text-white sm:text-4xl lg:text-5xl">
                Sports Market Observatory
              </h1>
              <p className="mt-2 max-w-2xl text-sm leading-relaxed text-slate-400">
                Cross-referencing live market pricing with invariant sidereal geometry and topocentric celestial coordinates.
              </p>
            </div>

            <div className="flex flex-wrap items-center gap-3">
              <button
                onClick={() => setShowConfig(!showConfig)}
                className={`glass-button ${showConfig ? "border-cyan-400/50 text-cyan-200 bg-cyan-400/10" : ""}`}
              >
                <Settings2 size={16} /> Run Configuration
              </button>

              <button
                onClick={() => setShowManualFixture(true)}
                className="gold-button"
              >
                <FileChartColumn size={16} /> Custom Fixture
              </button>

              <button
                onClick={() => simulationResult ? downloadResultBundle(simulationResult) : toast.info("Run a simulation first to export the research bundle.")}
                className="glass-button"
                aria-label="Export Bundle"
              >
                <Download size={16} />
              </button>
            </div>
          </header>

          <nav aria-label="Lab workspace tabs" className="sticky top-4 z-20 mt-6 rounded-2xl border border-white/[0.1] bg-[#08111f]/90 p-1.5 shadow-[0_18px_50px_rgba(0,0,0,0.35)] backdrop-blur-xl">
            <div className="grid grid-cols-2 gap-1 sm:grid-cols-5">
              {[
                { id: "overview" as LabTab, label: "Overview", sub: "At a glance", icon: Activity },
                { id: "market" as LabTab, label: "Market Feed", sub: "Live fixtures", icon: Globe2 },
                { id: "replay" as LabTab, label: "Replay Engine", sub: "Datasets & runs", icon: FlaskConical },
                { id: "audit" as LabTab, label: "Audit Matrix", sub: simulationResult ? "Proof available" : "Run a test", icon: ShieldCheck },
                { id: "assistant" as LabTab, label: "Assistant", sub: "Ask the lab", icon: Sparkles },
              ].map((tab) => {
                const isActive = activeTab === tab.id;
                return (
                  <button key={tab.id} onClick={() => setActiveTab(tab.id)} className={`flex items-center gap-2 rounded-xl px-3 py-2.5 text-left transition-all ${isActive ? "bg-cyan-400/12 text-white shadow-[inset_0_0_0_1px_rgba(34,211,238,0.28)]" : "text-slate-400 hover:bg-white/[0.04] hover:text-slate-200"}`}>
                    <tab.icon size={15} className={isActive ? "text-cyan-300" : "text-slate-500"} />
                    <span className="min-w-0"><span className="block truncate text-[11px] font-semibold">{tab.label}</span><span className={`hidden truncate text-[9px] font-mono sm:block ${isActive ? "text-cyan-300/80" : "text-slate-600"}`}>{tab.sub}</span></span>
                  </button>
                );
              })}
            </div>
          </nav>

          {activeTab === "overview" && <>
          {/* High-Class Telemetry Dashboard Cards */}
          <section className="mt-8 grid gap-5 sm:grid-cols-2 xl:grid-cols-4">
            <StatWidget
              icon={Database}
              eyebrow="Corpus Archives"
              value="3,932"
              subvalue="Verified Events"
              detail="Historical seasons staged across MLB, NFL & NBA leagues."
              accentGlow="bg-cyan-500/15"
              indicator="ready"
            />
            <StatWidget
              icon={TrendingUp}
              eyebrow="Consensus Accuracy"
              value="54.7%"
              subvalue="Baseline MLB"
              detail="Empirical verification against moneyline closing lines."
              accentGlow="bg-emerald-500/15"
              indicator="active"
            />
            <StatWidget
              icon={Compass}
              eyebrow="Coordinate Frames"
              value="02"
              subvalue="Bifurcated Model"
              detail="Fixed sidereal God View vs topocentric local horizon."
              accentGlow="bg-purple-500/15"
              indicator="ready"
            />
            <StatWidget
              icon={Zap}
              eyebrow="Engine Precision"
              value="J2000"
              subvalue="Deterministic"
              detail="Astronomy-engine planetary coordinates accurate to 0.001°."
              accentGlow="bg-amber-500/15"
              indicator="active"
            />
          </section>

          {/* Quick Start Hero Banner */}
          <section className="mt-8 obs-panel p-6 sm:p-8 bg-gradient-to-r from-cyan-950/30 via-[#071324]/60 to-purple-950/20 border-cyan-400/20">
            <div className="flex flex-col gap-6 lg:flex-row lg:items-center lg:justify-between">
              <div>
                <div className="flex items-center gap-2">
                  <Star size={14} className="text-amber-400 fill-amber-400" />
                  <p className="text-[10px] font-mono uppercase tracking-[0.22em] text-cyan-300">
                    Instant Simulation Protocol
                  </p>
                </div>
                <h2 className="mt-2 font-serif text-2xl font-bold tracking-tight text-white">
                  Empirical Market & Celestial Synthesis
                </h2>
                <p className="mt-1 max-w-2xl text-xs sm:text-sm leading-relaxed text-slate-300">
                  Select a live scheduled game from the real-time board below, or execute our calibrated historical benchmark (Yankees vs Astros) to examine the dual-frame mathematical proof.
                </p>
              </div>

              <div className="flex flex-wrap items-center gap-3">
                <button
                  onClick={runSimulation}
                  disabled={isRunning}
                  className="cyan-button"
                >
                  <Play size={16} fill="currentColor" />
                  {simulationResult ? "Recalculate Benchmark Test" : "Run Advanced Simulation Test"}
                </button>
                <button
                  onClick={downloadSampleCsv}
                  className="glass-button"
                >
                  <Download size={16} /> Sample Data CSV
                </button>
              </div>
            </div>

            <div className="mt-8 grid gap-4 md:grid-cols-3">
              {[
                { step: "01", title: "Calibrated Benchmark", text: "Instant analysis of Yankees vs Astros historical closing lines." },
                { step: "02", title: "Dual-Frame Invariant", text: "Compare ancient Hamal fixed background against local observer horizons." },
                { step: "03", title: "Transparent Audit", text: "Mathematical proof trace scoring every method layer with zero hidden weights." },
              ].map((item) => (
                <div key={item.step} className="rounded-xl border border-white/[0.08] bg-white/[0.02] p-4 flex gap-3.5 items-start">
                  <span className="flex h-7 w-7 shrink-0 items-center justify-center rounded-lg border border-cyan-400/30 bg-cyan-400/10 font-mono text-xs font-bold text-cyan-300">
                    {item.step}
                  </span>
                  <div>
                    <strong className="text-xs font-semibold text-white">{item.title}</strong>
                    <p className="mt-1 text-[11px] leading-relaxed text-slate-400">{item.text}</p>
                  </div>
                </div>
              ))}
            </div>
          </section>

          </>}

          {/* Configuration Drawer */}
          {activeTab === "overview" && showConfig && (
            <div className="mt-6 obs-panel p-6 border-cyan-400/30 bg-cyan-950/20">
              <div className="flex items-center justify-between border-b border-white/[0.08] pb-4">
                <div className="flex items-center gap-3">
                  <div className="rounded-xl bg-cyan-400/10 p-2 text-cyan-300">
                    <Settings2 size={18} />
                  </div>
                  <div>
                    <h3 className="text-sm font-semibold text-white">Engine Parameters & Ascendant Models</h3>
                    <p className="text-xs text-slate-400">Configure coordinate frame assumptions for topocentric AgentView.</p>
                  </div>
                </div>
                <button onClick={() => setShowConfig(false)} className="text-slate-400 hover:text-white transition-colors">
                  <X size={18} />
                </button>
              </div>

              <div className="mt-5 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
                <div className="rounded-xl border border-white/10 bg-white/[0.02] p-4">
                  <span className="text-[10px] font-mono uppercase tracking-wider text-slate-500">Celestial Origin</span>
                  <p className="mt-1 font-serif text-sm font-semibold text-white">Hamal / Ancient Fixed</p>
                </div>
                <div className="rounded-xl border border-white/10 bg-white/[0.02] p-4">
                  <span className="text-[10px] font-mono uppercase tracking-wider text-slate-500">Sidereal Anchor</span>
                  <p className="mt-1 font-serif text-sm font-semibold text-white">13°00′00″ Aries</p>
                </div>
                <div className="rounded-xl border border-white/10 bg-white/[0.02] p-4">
                  <span className="text-[10px] font-mono uppercase tracking-wider text-slate-500">AgentView Ascendant Model</span>
                  <select
                    value={agentViewModel}
                    onChange={(e) => setAgentViewModel(e.target.value as typeof agentViewModel)}
                    className="mt-1 w-full bg-transparent text-sm font-semibold text-cyan-300 outline-none cursor-pointer"
                  >
                    <option value="astronomical" className="bg-[#0b1222] text-white">Spherical-Earth Astronomical</option>
                    <option value="fixed-earth-dawn-anchored" className="bg-[#0b1222] text-white">Fixed-Earth Dawn-Anchored</option>
                  </select>
                </div>
                <div className="rounded-xl border border-white/10 bg-white/[0.02] p-4">
                  <span className="text-[10px] font-mono uppercase tracking-wider text-slate-500">Integration Status</span>
                  <p className="mt-1 font-mono text-xs font-semibold text-emerald-400 flex items-center gap-1.5">
                    <span className="h-2 w-2 rounded-full bg-emerald-400" /> Active & Locked
                  </p>
                </div>
              </div>

              {agentViewModel === "fixed-earth-dawn-anchored" && (
                <div className="mt-4 rounded-xl border border-amber-400/20 bg-amber-400/5 p-4 grid gap-4 sm:grid-cols-2">
                  <div>
                    <label className="text-[11px] font-mono uppercase tracking-wider text-amber-200">
                      Sunrise Anchor (UTC / ISO 8601)
                    </label>
                    <input
                      value={sunriseTime}
                      onChange={(e) => setSunriseTime(e.target.value)}
                      className="mt-1.5 w-full rounded-lg border border-white/10 bg-black/40 px-3 py-2 text-xs font-mono text-white outline-none focus:border-amber-400/50"
                    />
                  </div>
                  <div>
                    <label className="text-[11px] font-mono uppercase tracking-wider text-amber-200">
                      Sunrise Ephemeris Source
                    </label>
                    <input
                      value={sunriseSource}
                      onChange={(e) => setSunriseSource(e.target.value)}
                      className="mt-1.5 w-full rounded-lg border border-white/10 bg-black/40 px-3 py-2 text-xs text-white outline-none focus:border-amber-400/50"
                    />
                  </div>
                </div>
              )}
            </div>
          )}

          {activeTab === "audit" && !simulationResult && (
            <section className="mt-8 obs-panel p-10 text-center">
              <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-2xl border border-cyan-400/30 bg-cyan-400/10 text-cyan-300"><ShieldCheck size={24} /></div>
              <p className="mt-5 text-[10px] font-mono uppercase tracking-[0.22em] text-cyan-300">Audit Matrix Standing By</p>
              <h2 className="mt-2 font-serif text-2xl font-bold text-white">Run a simulation to unlock the proof trace</h2>
              <p className="mx-auto mt-2 max-w-lg text-sm leading-relaxed text-slate-400">The audit workspace will separate executive synthesis, frame transparency, mathematical proof, house placement, and method-level verification.</p>
              <button onClick={() => { setActiveTab("overview"); window.setTimeout(() => void runSimulation(), 80); }} className="cyan-button mx-auto mt-6"><Play size={15} fill="currentColor" /> Run Benchmark Test</button>
            </section>
          )}

          {activeTab === "audit" && simulationResult && (
            <div ref={gameBriefRef} className="animate-in fade-in-50 duration-500">
              <LuxuryGameBrief result={simulationResult} />
            </div>
          )}

          {activeTab === "market" && <>
          {/* Real-time Market Favorites Board */}
          <section className="mt-8 obs-panel overflow-hidden">
            <div className="obs-panel-header">
              <div className="flex items-center gap-3">
                <div className="rounded-xl border border-emerald-400/30 bg-emerald-400/10 p-2.5 text-emerald-300">
                  <Globe2 size={20} />
                </div>
                <div>
                  <p className="text-[10px] font-mono uppercase tracking-[0.2em] text-emerald-300">Live Consensus Monitor</p>
                  <h2 className="font-serif text-xl font-bold tracking-tight text-white">Sports Market Feed</h2>
                </div>
              </div>
              <LuxuryPill tone="emerald">
                {scheduleQuery.isFetching ? "Syncing..." : `${scheduleQuery.data?.length ?? 0} Fixtures Available`}
              </LuxuryPill>
            </div>

            <div className="grid gap-4 border-b border-white/[0.08] p-5 sm:grid-cols-[180px_160px_auto] bg-white/[0.01]">
              <div>
                <label className="text-[10px] font-mono uppercase tracking-wider text-slate-400">Date Filter</label>
                <input
                  type="date"
                  value={scheduleDate}
                  onChange={(e) => setScheduleDate(e.target.value)}
                  className="mt-1.5 w-full rounded-xl border border-white/10 bg-white/[0.03] px-3 py-2 text-xs text-white outline-none focus:border-cyan-400/40"
                />
              </div>
              <div>
                <label className="text-[10px] font-mono uppercase tracking-wider text-slate-400">Sport Division</label>
                <select
                  value={scheduleSport}
                  onChange={(e) => setScheduleSport(e.target.value as typeof scheduleSport)}
                  className="mt-1.5 w-full rounded-xl border border-white/10 bg-[#08111f] px-3 py-2 text-xs text-white outline-none focus:border-cyan-400/40 cursor-pointer"
                >
                  <option value="ALL">All Divisions</option>
                  <option value="MLB">MLB Baseball</option>
                  <option value="NBA">NBA Basketball</option>
                  <option value="NFL">NFL Football</option>
                </select>
              </div>
              <div className="flex items-end">
                <p className="text-[11px] text-slate-400">
                  Direct feed from official league schedules and closing sportsbooks. Select any fixture to trigger full dual-frame celestial telemetry.
                </p>
              </div>
            </div>

            <div className="divide-y divide-white/[0.06]">
              {scheduleQuery.isLoading && (
                <div className="p-8 text-center text-xs font-mono text-slate-400">Connecting to sports schedule feeds...</div>
              )}
              {!scheduleQuery.isLoading && !scheduleQuery.data?.length && (
                <div className="p-10 text-center text-xs text-slate-500">
                  No fixtures retrieved for this date and sport. Adjust date filter or select another sport.
                </div>
              )}
              {scheduleQuery.data?.map((game: any) => (
                <div key={game.id} className="flex flex-col gap-4 p-5 sm:flex-row sm:items-center sm:justify-between hover:bg-white/[0.02] transition-colors">
                  <div className="min-w-0">
                    <div className="flex flex-wrap items-center gap-2.5">
                      <span className="rounded-lg border border-cyan-400/20 bg-cyan-400/10 px-2.5 py-0.5 text-[10px] font-mono font-bold text-cyan-200 uppercase">
                        {game.sport}
                      </span>
                      <p className="text-base font-semibold text-white">
                        {game.teamA} <span className="font-normal text-slate-500 text-sm">at</span> {game.teamB}
                      </p>
                    </div>
                    <p className="mt-1.5 text-xs text-slate-400">
                      {new Date(game.startTime).toLocaleString()} • {game.venue} • {game.location}
                    </p>
                    <div className="mt-2.5 flex flex-wrap items-center gap-3">
                      <span className="text-[10px] font-mono uppercase tracking-wider text-slate-500">Consensus Favorite:</span>
                      {game.favoriteTeam ? (
                        <span className="text-xs font-semibold text-emerald-300 bg-emerald-400/10 border border-emerald-400/20 px-2.5 py-0.5 rounded-full">
                          {game.favoriteTeam}
                        </span>
                      ) : (
                        <span className="text-xs text-amber-300 font-mono">Odds Pending</span>
                      )}
                      {game.favoriteTeam && (
                        <span className="text-xs font-mono text-slate-500">
                          Home {game.homeMoneyline ?? "—"} / Away {game.awayMoneyline ?? "—"}
                        </span>
                      )}
                    </div>
                  </div>

                  <button
                    onClick={() => void runScheduledGame(game)}
                    disabled={isRunning}
                    className="cyan-button shrink-0 text-xs py-2 px-4"
                  >
                    <Play size={14} fill="currentColor" /> Analyze Geometry
                  </button>
                </div>
              ))}
            </div>
          </section>

          </>}

          {activeTab === "assistant" && <>
          {/* AI Epistemic Lab / Research Assistant */}
          <section id="research-assistant" className="mt-8 obs-panel overflow-hidden">
            <div className="obs-panel-header">
              <div className="flex items-center gap-3">
                <div className="rounded-xl border border-purple-400/30 bg-purple-400/10 p-2.5 text-purple-300">
                  <Sparkles size={20} />
                </div>
                <div>
                  <p className="text-[10px] font-mono uppercase tracking-[0.2em] text-purple-300">Neural Interpretation</p>
                  <h2 className="font-serif text-xl font-bold tracking-tight text-white">Observatory Research Assistant</h2>
                </div>
              </div>
              <LuxuryPill tone="purple">Context-Aware LLM</LuxuryPill>
            </div>
            <div className="p-6">
              <AIChatBox
                messages={chatMessages}
                onSendMessage={(content) => {
                  const next = [...chatMessages, { role: "user" as const, content }];
                  setChatMessages(next);
                  const context = simulationResult
                    ? JSON.stringify({
                        event: simulationResult.input,
                        comparison: simulationResult.comparison,
                        baseline: simulationResult.baseline,
                        godView: {
                          winner: simulationResult.godView.synthesis.winner,
                          hits: simulationResult.godView.summary.hits,
                        },
                        agentView: {
                          winner: simulationResult.agentView.synthesis.winner,
                          hits: simulationResult.agentView.summary.hits,
                        },
                      })
                    : undefined;
                  chatMutation.mutate({ messages: next, context });
                }}
                isLoading={chatMutation.isPending}
                height="380px"
                emptyStateMessage="Inquire about dual-frame theory, planetary house lordships, or audit transparency."
                suggestedPrompts={[
                  "Why do God View and AgentView diverge?",
                  "Explain the 13° Aries Hamal anchor origin.",
                  "How is 'Not Evaluated' distinguished from zero score?",
                ]}
              />
            </div>
          </section>

          </>}

          {/* Technical Transparency & Proof Panels */}
          {activeTab === "audit" && simulationResult && (
            <div className="space-y-8 mt-8">
              <TransparencyPanel result={simulationResult} />
              <CalculationProofPanel result={simulationResult} />
              <HousePlacementPanel result={simulationResult} />

              <section className="obs-panel overflow-hidden">
                <div className="obs-panel-header">
                  <div>
                    <p className="text-[10px] font-mono uppercase tracking-[0.2em] text-cyan-300">Layer Analysis</p>
                    <h2 className="font-serif text-xl font-bold text-white">Full Celestial Placement Inspection</h2>
                  </div>
                  <LuxuryPill tone="emerald">Verified Ephemeris</LuxuryPill>
                </div>
                <div className="p-6">
                  <CelestialPlacementTable planets={simulationResult.chart.godView.planets} />
                </div>
              </section>

              <MethodExplorer result={simulationResult} onExplain={explainMethod} />
            </div>
          )}

          {activeTab === "replay" && <>
          {/* Event Corpus & Astrometric Maps */}
          <section className="mt-8 grid gap-8 xl:grid-cols-[minmax(0,1.35fr)_minmax(380px,0.9fr)]">
            {/* Event Library Card */}
            <div className="obs-panel overflow-hidden">
              <div className="obs-panel-header">
                <div>
                  <p className="text-[10px] font-mono uppercase tracking-[0.2em] text-cyan-300">Corpus Repository</p>
                  <h2 className="font-serif text-xl font-bold text-white">Historical Replay Datasets</h2>
                </div>
                <button
                  onClick={() => setShowManualFixture(true)}
                  className="glass-button text-xs py-1.5 px-3"
                >
                  <FileChartColumn size={14} /> New Fixture
                </button>
              </div>

              <div className="flex flex-col gap-3 border-b border-white/[0.08] p-5 sm:flex-row bg-white/[0.01]">
                <div className="relative flex-1">
                  <Search size={15} className="absolute left-3.5 top-3 text-slate-400" />
                  <input
                    value={search}
                    onChange={(e) => setSearch(e.target.value)}
                    placeholder="Search season datasets..."
                    className="w-full rounded-xl border border-white/10 bg-white/[0.03] pl-10 pr-4 py-2 text-xs text-white outline-none focus:border-cyan-400/40"
                  />
                </div>
                <select
                  value={selectedSport}
                  onChange={(e) => setSelectedSport(e.target.value)}
                  className="rounded-xl border border-white/10 bg-[#08111f] px-3 py-2 text-xs text-white outline-none focus:border-cyan-400/40 cursor-pointer"
                >
                  <option>All sports</option>
                  <option>MLB</option>
                  <option>NFL</option>
                  <option>NBA</option>
                  <option>Custom</option>
                </select>
              </div>

              <div className="divide-y divide-white/[0.06]">
                {filteredTemplates.map((template) => (
                  <button
                    key={template.id}
                    onClick={() => setActiveTemplate(template.id)}
                    className={`flex w-full items-center gap-4 p-5 text-left transition-colors ${
                      activeTemplate === template.id
                        ? "bg-gradient-to-r from-cyan-400/10 via-transparent to-transparent border-l-2 border-cyan-400"
                        : "hover:bg-white/[0.02]"
                    }`}
                  >
                    <div className="flex h-10 w-11 shrink-0 items-center justify-center rounded-xl border border-white/10 bg-white/[0.04] font-mono text-xs font-bold text-white">
                      {template.code}
                    </div>
                    <div className="min-w-0 flex-1">
                      <div className="flex items-center gap-2">
                        <span className="font-semibold text-sm text-white truncate">{template.label}</span>
                        <LuxuryPill tone={template.status === "ready" ? "emerald" : "slate"}>
                          {template.status}
                        </LuxuryPill>
                      </div>
                      <p className="mt-1 text-xs text-slate-400">
                        {template.range} • {template.events ? `${template.events.toLocaleString()} events` : "Awaiting data"}
                      </p>
                    </div>
                    <ArrowUpRight size={16} className="text-slate-500" />
                  </button>
                ))}
              </div>

              <div className="flex flex-wrap items-center justify-between gap-3 border-t border-white/[0.08] p-5 bg-white/[0.01]">
                <p className="text-xs text-slate-400">Ingest custom sports fixtures with verified timestamps and venue locations.</p>
                <div className="flex items-center gap-2">
                  <input
                    ref={fileInputRef}
                    type="file"
                    accept=".csv,text/csv"
                    className="hidden"
                    onChange={(e) => {
                      const file = e.target.files?.[0];
                      if (file) void importFile(file);
                      e.currentTarget.value = "";
                    }}
                  />
                  <button
                    onClick={() => fileInputRef.current?.click()}
                    className="glass-button text-xs py-2 px-3.5"
                  >
                    <Upload size={14} /> Upload Custom CSV
                  </button>
                </div>
              </div>
            </div>

            {/* Astrometric Projection Maps */}
            <div className="space-y-6">
              <AstrometricMap frame="God View (Sidereal Invariant)" mode="god" />
              <AstrometricMap frame="AgentView (Topocentric Horizon)" mode="agent" />
            </div>
          </section>

          </>}

          {activeTab === "replay" && <>
          {/* Persisted Batch Replays History */}
          <div className="mt-8">
            <RunHistoryPanel
              runs={runHistory.data}
              isLoading={runHistory.isLoading}
              onRefresh={() => void runHistory.refetch()}
            />
          </div>
          </>}

          {/* High-End Academic Observatory Footer */}
          <footer className="mt-14 flex flex-col gap-4 border-t border-white/[0.08] py-8 text-xs text-slate-500 sm:flex-row sm:items-center sm:justify-between font-mono">
            <span>Firmament Astrometric Simulation Laboratory • Version 2.4.0</span>
            <div className="flex items-center gap-4">
              <span>Standard Ephemeris: JPL DE440 / J2000.0</span>
              <span className="h-1 w-1 rounded-full bg-slate-600" />
              <span>Sidereal Anchor: Hamal 13°00′</span>
            </div>
          </footer>
        </main>
      </div>
    </div>
  );
}
