import {
  AlertTriangle,
  ArrowRight,
  CheckCircle2,
  Compass,
  Download,
  Flame,
  Orbit,
  Scale,
  ShieldCheck,
  Trophy,
  Zap,
} from "lucide-react";

type SimulationResult = {
  input: {
    teamA: string;
    teamB: string;
    favoredTeam?: string;
    underdogTeam?: string;
    sport: string;
    location: string;
    startTime: string;
    actualWinner?: "A" | "B" | "TIE";
  };
  baseline: {
    winner: "A" | "B" | "TIE";
    verdict: "hit" | "miss" | "tie" | "unverified";
    combined: { scoreA: number; scoreB: number };
  };
  godView: {
    synthesis: {
      winner: "A" | "B" | "TIE";
      scoreA: number;
      scoreB: number;
      margin: number;
    };
    summary: { hits: number; misses: number };
  };
  agentView: {
    synthesis: {
      winner: "A" | "B" | "TIE";
      scoreA: number;
      scoreB: number;
      margin: number;
    };
    summary: { hits: number; misses: number };
  };
  comparison: {
    state: string;
    winner: "A" | "B" | "TIE";
    verified: boolean;
  };
};

type Props = {
  simulation: SimulationResult | null;
  onDownloadAudit?: () => void;
  onScrollToLedger?: () => void;
  onScrollToTop?: () => void;
};

export function SportsbookCallBanner({
  simulation,
  onDownloadAudit,
  onScrollToLedger,
  onScrollToTop,
}: Props) {
  if (!simulation) return null;

  const { input, baseline, godView, agentView, comparison } = simulation;

  const teamA = input.favoredTeam ?? input.teamA;
  const teamB = input.underdogTeam ?? input.teamB;

  const baselineCallName =
    baseline.winner === "A"
      ? teamA
      : baseline.winner === "B"
        ? teamB
        : "No Direct Pick (Dead Even)";

  const isFavoredPicked = baseline.winner === "A";
  const isUnderdogPicked = baseline.winner === "B";

  const isConsensus = godView.synthesis.winner === agentView.synthesis.winner;

  const godCallName = godView.synthesis.winner === "A" ? teamA : teamB;
  const agentCallName = agentView.synthesis.winner === "A" ? teamA : teamB;

  const scoreDiff = Math.abs(baseline.combined.scoreA - baseline.combined.scoreB);

  return (
    <section className="sportsbook-call-banner mb-6 overflow-hidden rounded-2xl border-2 border-cyan-400/30 bg-gradient-to-br from-[#0c223c] via-[#081525] to-[#16122d] p-5 shadow-[0_20px_50px_rgba(0,0,0,0.5)]">
      {/* Top Banner Tagline */}
      <div className="flex flex-wrap items-center justify-between gap-3 border-b border-cyan-400/15 pb-3">
        <div className="flex items-center gap-2">
          <span className="flex h-2.5 w-2.5 items-center justify-center">
            <span className="absolute h-3 w-3 animate-ping rounded-full bg-cyan-400 opacity-75"></span>
            <span className="relative h-2 w-2 rounded-full bg-cyan-300"></span>
          </span>
          <span className="text-[10px] font-extrabold tracking-[0.2em] text-cyan-300 uppercase">
            Official Simulation Call · {input.sport}
          </span>
          <span className="text-slate-500">·</span>
          <span className="text-xs text-slate-300 font-medium truncate max-w-[280px]">
            {input.location}
          </span>
        </div>

        <div className="flex items-center gap-2">
          {isConsensus ? (
            <span className="flex items-center gap-1.5 rounded-full border border-emerald-400/30 bg-emerald-400/10 px-3 py-0.5 text-xs font-bold text-emerald-300">
              <CheckCircle2 size={13} />
              Dual-Frame Consensus
            </span>
          ) : (
            <span className="flex items-center gap-1.5 rounded-full border border-amber-400/30 bg-amber-400/10 px-3 py-0.5 text-xs font-bold text-amber-300">
              <AlertTriangle size={13} />
              Split Decision (Frames Disagree)
            </span>
          )}
          <span className="text-xs text-slate-400">
            {new Date(input.startTime).toLocaleString(undefined, {
              dateStyle: "short",
              timeStyle: "short",
            })}
          </span>
        </div>
      </div>

      {/* Main Call Display */}
      <div className="mt-4 grid gap-5 lg:grid-cols-12 items-center">
        {/* Large Callout (7 cols) */}
        <div className="lg:col-span-7">
          <span className="text-[11px] font-extrabold tracking-[0.16em] text-slate-400 uppercase">
            Model Projected Winner
          </span>
          <div className="mt-1 flex flex-wrap items-baseline gap-3">
            <h1 className="font-display text-3xl font-black tracking-tight text-white sm:text-4xl">
              {baselineCallName}
            </h1>
            <span
              className={`rounded-lg px-2.5 py-1 text-xs font-extrabold uppercase ${
                isFavoredPicked
                  ? "border border-amber-400/40 bg-amber-400/20 text-amber-300"
                  : isUnderdogPicked
                    ? "border border-violet-400/40 bg-violet-400/20 text-violet-300"
                    : "border border-slate-700 bg-slate-800 text-slate-300"
              }`}
            >
              {isFavoredPicked
                ? "★ Favorite Backed"
                : isUnderdogPicked
                  ? "Underdog Value Call"
                  : "Even Push"}
            </span>
          </div>

          <p className="mt-2 text-xs leading-relaxed text-slate-300">
            {isConsensus
              ? `Both God View (fixed background) and Agent View (local horizon) converge on ${baselineCallName} with a composite differential of +${scoreDiff.toFixed(
                  1
                )} points across 40 evaluation layers.`
              : `Split decision: God View selects ${godCallName} (+${Math.abs(
                  godView.synthesis.margin
                ).toFixed(1)}), while Agent View selects ${agentCallName} (+${Math.abs(
                  agentView.synthesis.margin
                ).toFixed(
                  1
                )}). This signals potential volatility against traditional sportsbook expectations.`}
          </p>

          <div className="mt-3 flex flex-wrap gap-2 text-xs">
            <button
              onClick={onScrollToLedger}
              className="inline-flex items-center gap-1 text-cyan-300 hover:text-cyan-200 underline font-semibold"
            >
              Examine full 40-method audit ledger <ArrowRight size={13} />
            </button>
            <span className="text-slate-600">·</span>
            <button
              onClick={onScrollToTop}
              className="inline-flex items-center gap-1 text-slate-400 hover:text-slate-200"
            >
              Modify fixture
            </button>
          </div>
        </div>

        {/* Frame Score Cards (5 cols) */}
        <div className="grid grid-cols-2 gap-3 lg:col-span-5">
          {/* God View Card */}
          <div className="rounded-xl border border-cyan-400/25 bg-cyan-950/20 p-3.5">
            <div className="flex items-center justify-between text-cyan-300">
              <span className="flex items-center gap-1 text-[10px] font-bold uppercase tracking-wider">
                <Orbit size={13} /> God View
              </span>
              <span className="text-[10px] text-cyan-400/70">Fixed Zodiac</span>
            </div>
            <strong className="mt-2 block truncate text-base font-bold text-slate-100">
              {godCallName}
            </strong>
            <div className="mt-1 flex items-baseline justify-between text-xs text-slate-400">
              <span>Differential</span>
              <strong className="text-cyan-200">
                {godView.synthesis.scoreA.toFixed(1)} / {godView.synthesis.scoreB.toFixed(1)}
              </strong>
            </div>
          </div>

          {/* Agent View Card */}
          <div className="rounded-xl border border-violet-400/25 bg-violet-950/20 p-3.5">
            <div className="flex items-center justify-between text-violet-300">
              <span className="flex items-center gap-1 text-[10px] font-bold uppercase tracking-wider">
                <Compass size={13} /> Agent View
              </span>
              <span className="text-[10px] text-violet-400/70">Local Horizon</span>
            </div>
            <strong className="mt-2 block truncate text-base font-bold text-slate-100">
              {agentCallName}
            </strong>
            <div className="mt-1 flex items-baseline justify-between text-xs text-slate-400">
              <span>Differential</span>
              <strong className="text-violet-200">
                {agentView.synthesis.scoreA.toFixed(1)} / {agentView.synthesis.scoreB.toFixed(1)}
              </strong>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
