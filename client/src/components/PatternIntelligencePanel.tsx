import React, { useState } from "react";
import { trpc } from "@/lib/trpc";
import {
  Brain,
  Swords,
  ShieldAlert,
  Sparkles,
  Trophy,
  Target,
  Compass,
  Moon,
  Flame,
  CheckCircle2,
  AlertTriangle,
  Activity,
  Layers,
  Search,
  Zap,
} from "lucide-react";

export type PatternIntelligencePanelProps = {
  simulation: any;
  fixtureName?: string;
};

export const PatternIntelligencePanel: React.FC<PatternIntelligencePanelProps> = ({
  simulation,
  fixtureName,
}) => {
  const [activeTab, setActiveTab] = useState<"forensic" | "catalog" | "matcher">("forensic");
  const [filterType, setFilterType] = useState<"ALL" | "WINNING_FORMULA" | "UPSET_TRAP">("ALL");

  // Call the live intelligence endpoint for the active game
  const liveQuery = trpc.patterns.liveIntelligence.useMutation();
  const catalogQuery = trpc.patterns.catalog.useQuery(
    { minSupport: 2 },
    { staleTime: 60_000, enabled: activeTab === "catalog" }
  );

  const [intelligenceData, setIntelligenceData] = useState<any>(null);

  // Trigger live intelligence analysis when simulation changes
  React.useEffect(() => {
    if (simulation?.input) {
      liveQuery.mutate(
        { target: simulation.input },
        {
          onSuccess: (data) => {
            setIntelligenceData(data);
          },
        }
      );
    }
  }, [simulation?.id, simulation?.input?.startTime]);

  const forensic = intelligenceData?.forensic;
  const alerts = intelligenceData?.activeAlerts ?? [];
  const twins = intelligenceData?.twins ?? [];

  const catalogRules = catalogQuery.data?.rules ?? [];
  const filteredCatalog = catalogRules.filter((r: any) => {
    if (filterType === "WINNING_FORMULA") return r.ruleType === "WINNING_FORMULA";
    if (filterType === "UPSET_TRAP") return r.ruleType === "UPSET_TRAP";
    return true;
  });

  return (
    <section className="pattern-intelligence-deck panel mt-6 p-6 border border-[rgba(228,197,139,0.22)] rounded-2xl bg-[linear-gradient(142deg,rgba(15,26,44,0.95),rgba(7,14,28,0.92))] shadow-2xl">
      {/* Header & Subtitle */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 pb-5 border-b border-[rgba(228,197,139,0.15)]">
        <div>
          <div className="flex items-center gap-2 text-xs font-bold tracking-widest uppercase text-[#e4c58b]">
            <Brain size={16} className="text-[#e4c58b] animate-pulse" />
            <span>Firmament Pattern Recognition & Causal Intelligence Engine</span>
          </div>
          <h2 className="text-xl md:text-2xl font-semibold text-[#f5f1e9] mt-1 tracking-tight">
            Causal Forensics & Multi-Game Pattern Memory
          </h2>
          <p className="text-xs text-[#91a5b8] mt-1 max-w-2xl">
            Synthesizes thousands of historical games to understand <em className="text-[#e4c58b] not-italic font-semibold">why</em> each hit or miss occurred. Diagnoses the decisive territorial battles, Chaldean decan faces, and 28 Arabic lunar mansions.
          </p>
        </div>

        {/* View Switcher */}
        <div className="flex items-center gap-1.5 p-1 bg-[rgba(5,13,23,0.7)] border border-[rgba(228,197,139,0.18)] rounded-xl">
          <button
            onClick={() => setActiveTab("forensic")}
            className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold transition-all ${
              activeTab === "forensic"
                ? "bg-[rgba(228,197,139,0.15)] text-[#f4ddb0] border border-[rgba(228,197,139,0.3)] shadow-sm"
                : "text-[#8294a5] hover:text-[#c4d9e4]"
            }`}
          >
            <Swords size={13} />
            <span>Why It Happened</span>
          </button>
          <button
            onClick={() => setActiveTab("matcher")}
            className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold transition-all ${
              activeTab === "matcher"
                ? "bg-[rgba(228,197,139,0.15)] text-[#f4ddb0] border border-[rgba(228,197,139,0.3)] shadow-sm"
                : "text-[#8294a5] hover:text-[#c4d9e4]"
            }`}
          >
            <Zap size={13} />
            <span>Tactical Radar</span>
            {alerts.length > 0 && (
              <span className="w-2 h-2 rounded-full bg-[#ff7388] animate-ping" />
            )}
          </button>
          <button
            onClick={() => setActiveTab("catalog")}
            className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold transition-all ${
              activeTab === "catalog"
                ? "bg-[rgba(228,197,139,0.15)] text-[#f4ddb0] border border-[rgba(228,197,139,0.3)] shadow-sm"
                : "text-[#8294a5] hover:text-[#c4d9e4]"
            }`}
          >
            <Layers size={13} />
            <span>Pattern Memory</span>
          </button>
        </div>
      </div>

      {/* TAB 1: WHY IT HAPPENED (CAUSAL FORENSIC) */}
      {activeTab === "forensic" && (
        <div className="mt-5 space-y-5 animate-in fade-in duration-300">
          {!simulation ? (
            <div className="p-8 text-center border border-dashed border-[rgba(228,197,139,0.18)] rounded-xl text-sm text-[#8294a5]">
              Select a fixture above (such as today's college football game) and click <strong>Calculate</strong> to inspect the causal forensics.
            </div>
          ) : (
            <>
              {/* Verdict Banner */}
              <div
                className={`p-4 rounded-xl border flex flex-col md:flex-row md:items-center justify-between gap-3 ${
                  simulation.baseline.verdict === "hit"
                    ? "bg-[rgba(112,239,190,0.07)] border-[rgba(112,239,190,0.3)]"
                    : simulation.baseline.verdict === "miss"
                    ? "bg-[rgba(255,115,136,0.08)] border-[rgba(255,115,136,0.32)]"
                    : "bg-[rgba(228,197,139,0.06)] border-[rgba(228,197,139,0.25)]"
                }`}
              >
                <div className="flex items-start gap-3">
                  <div
                    className={`mt-0.5 p-2 rounded-lg border ${
                      simulation.baseline.verdict === "hit"
                        ? "bg-[rgba(112,239,190,0.15)] text-[#86efc1] border-[rgba(112,239,190,0.35)]"
                        : simulation.baseline.verdict === "miss"
                        ? "bg-[rgba(255,115,136,0.15)] text-[#ff8ba0] border-[rgba(255,115,136,0.35)]"
                        : "bg-[rgba(228,197,139,0.12)] text-[#f4ddb0] border-[rgba(228,197,139,0.3)]"
                    }`}
                  >
                    {simulation.baseline.verdict === "hit" ? (
                      <CheckCircle2 size={18} />
                    ) : simulation.baseline.verdict === "miss" ? (
                      <AlertTriangle size={18} />
                    ) : (
                      <Sparkles size={18} />
                    )}
                  </div>
                  <div>
                    <div className="flex items-center gap-2">
                      <span className="text-[10px] font-extrabold uppercase tracking-wider px-2 py-0.5 rounded border border-[rgba(228,197,139,0.2)] bg-[rgba(0,0,0,0.25)] text-[#e4c58b]">
                        {simulation.baseline.verdict === "hit"
                          ? "Model Hit"
                          : simulation.baseline.verdict === "miss"
                          ? "Model Miss / Upset"
                          : "Pre-Game Astrological Blueprint"}
                      </span>
                      <span className="text-xs text-[#91a5b8]">
                        Predicted: <strong>Side {simulation.baseline.winner}</strong> ({simulation.baseline.winner === "A" ? simulation.input.teamA : simulation.input.teamB})
                        {simulation.comparison.actualWinner && (
                          <> · Actual Winner: <strong>Side {simulation.comparison.actualWinner}</strong></>
                        )}
                      </span>
                    </div>
                    <h3 className="text-sm md:text-base font-semibold text-[#f5f1e9] mt-1">
                      {forensic?.causalAttribution?.headline ?? "Causal breakdown ready"}
                    </h3>
                  </div>
                </div>

                <div className="flex items-center gap-2 self-start md:self-auto bg-[rgba(0,0,0,0.3)] px-3 py-1.5 rounded-lg border border-[rgba(228,197,139,0.12)] text-xs text-[#cbd5e1]">
                  <Target size={14} className="text-[#e4c58b]" />
                  <span>Tipping Point:</span>
                  <strong className="text-[#f4ddb0]">
                    {forensic?.causalAttribution?.tippingPoint ?? "Territorial Lock"}
                  </strong>
                </div>
              </div>

              {/* Forensic Narrative */}
              {forensic?.causalAttribution?.detailedReason && (
                <div className="p-4 rounded-xl border border-[rgba(228,197,139,0.15)] bg-[rgba(255,255,255,0.015)]">
                  <span className="text-[10px] font-extrabold uppercase tracking-widest text-[#e4c58b]">
                    Intelligence Attribution Trace
                  </span>
                  <p className="text-xs text-[#c5d3df] leading-relaxed mt-1.5">
                    {forensic.causalAttribution.detailedReason}
                  </p>
                </div>
              )}

              {/* THREE CORE PILLARS: Territorial Battles, Chaldean Decans, Lunar Mansions */}
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                {/* 1. Territorial Battles */}
                <div className="p-4 rounded-xl border border-[rgba(228,197,139,0.18)] bg-[linear-gradient(135deg,rgba(17,31,52,0.8),rgba(8,16,30,0.8))] shadow-md">
                  <div className="flex items-center justify-between">
                    <span className="flex items-center gap-1.5 text-[10px] font-extrabold uppercase tracking-wider text-[#e4c58b]">
                      <Swords size={13} />
                      <span>Territorial Battles</span>
                    </span>
                    <span className="text-[10px] font-bold px-2 py-0.5 rounded bg-[rgba(228,197,139,0.1)] text-[#f4ddb0]">
                      {forensic?.territorialBattle?.advantage === "A"
                        ? `Side A (+${forensic.territorialBattle.delta})`
                        : forensic?.territorialBattle?.advantage === "B"
                        ? `Side B (+${Math.abs(forensic.territorialBattle.delta)})`
                        : "Even"}
                    </span>
                  </div>

                  <div className="mt-3 space-y-2 text-xs">
                    <div className="flex justify-between items-center text-[#91a5b8]">
                      <span>Ascendant Cluster (1,2,3,6,10,11):</span>
                      <strong className="text-[#f5f1e9]">{forensic?.territorialBattle?.ascendantClusterCount ?? 0} cusps held</strong>
                    </div>
                    <div className="flex justify-between items-center text-[#91a5b8]">
                      <span>Descendant Cluster (4,5,7,8,9,12):</span>
                      <strong className="text-[#f5f1e9]">{forensic?.territorialBattle?.descendantClusterCount ?? 0} cusps held</strong>
                    </div>
                    <div className="flex justify-between items-center text-[#91a5b8] pt-1 border-t border-[rgba(228,197,139,0.1)]">
                      <span>1st House Lord ({forensic?.territorialBattle?.h1Lord?.lord}):</span>
                      <span className="text-[#cbd5df]">H{forensic?.territorialBattle?.h1Lord?.placementHouse} ({forensic?.territorialBattle?.h1Lord?.dignity})</span>
                    </div>
                    <div className="flex justify-between items-center text-[#91a5b8]">
                      <span>7th House Lord ({forensic?.territorialBattle?.h7Lord?.lord}):</span>
                      <span className="text-[#cbd5df]">H{forensic?.territorialBattle?.h7Lord?.placementHouse} ({forensic?.territorialBattle?.h7Lord?.dignity})</span>
                    </div>
                  </div>

                  <p className="mt-3 text-[11px] text-[#8ea2b4] leading-relaxed pt-2 border-t border-[rgba(228,197,139,0.08)]">
                    {forensic?.territorialBattle?.narrative}
                  </p>
                </div>

                {/* 2. Chaldean Decans */}
                <div className="p-4 rounded-xl border border-[rgba(228,197,139,0.18)] bg-[linear-gradient(135deg,rgba(17,31,52,0.8),rgba(8,16,30,0.8))] shadow-md">
                  <div className="flex items-center justify-between">
                    <span className="flex items-center gap-1.5 text-[10px] font-extrabold uppercase tracking-wider text-[#e4c58b]">
                      <Compass size={13} />
                      <span>Chaldean Decans</span>
                    </span>
                    <span className="text-[10px] font-bold px-2 py-0.5 rounded bg-[rgba(228,197,139,0.1)] text-[#f4ddb0]">
                      Score: {forensic?.decanBattle?.scoreA ?? 0} vs {forensic?.decanBattle?.scoreB ?? 0}
                    </span>
                  </div>

                  <div className="mt-3 space-y-2 text-xs">
                    <div className="flex justify-between items-center text-[#91a5b8]">
                      <span>Decan Advantage:</span>
                      <strong className="text-[#f5f1e9]">
                        {forensic?.decanBattle?.advantage === "A" ? "Side A (Favored)" : forensic?.decanBattle?.advantage === "B" ? "Side B (Underdog)" : "Balanced"}
                      </strong>
                    </div>
                    <div className="flex justify-between items-center text-[#91a5b8]">
                      <span>Own-Face Dignities (Side A):</span>
                      <strong className="text-[#f5f1e9]">{forensic?.decanBattle?.faceDignitiesA ?? 0} planets</strong>
                    </div>
                    <div className="flex justify-between items-center text-[#91a5b8]">
                      <span>Own-Face Dignities (Side B):</span>
                      <strong className="text-[#f5f1e9]">{forensic?.decanBattle?.faceDignitiesB ?? 0} planets</strong>
                    </div>
                  </div>

                  <p className="mt-3 text-[11px] text-[#8ea2b4] leading-relaxed pt-2 border-t border-[rgba(228,197,139,0.08)]">
                    {forensic?.decanBattle?.narrative}
                  </p>
                </div>

                {/* 3. Lunar Mansions (28 Manzils & 27 Nakshatras) */}
                <div className="p-4 rounded-xl border border-[rgba(228,197,139,0.18)] bg-[linear-gradient(135deg,rgba(17,31,52,0.8),rgba(8,16,30,0.8))] shadow-md">
                  <div className="flex items-center justify-between">
                    <span className="flex items-center gap-1.5 text-[10px] font-extrabold uppercase tracking-wider text-[#e4c58b]">
                      <Moon size={13} />
                      <span>28 Manzils & Nakshatras</span>
                    </span>
                    <span className="text-[10px] font-bold px-2 py-0.5 rounded bg-[rgba(228,197,139,0.1)] text-[#f4ddb0]">
                      Station #{forensic?.mansionBattle?.moonManzil?.index ?? 0}
                    </span>
                  </div>

                  <div className="mt-3 space-y-2 text-xs">
                    <div className="flex justify-between items-center text-[#91a5b8]">
                      <span>Moon's Arabic Manzil:</span>
                      <strong className="text-[#f5f1e9]">{forensic?.mansionBattle?.moonManzil?.name ?? "Al-Thurayya"}</strong>
                    </div>
                    <div className="flex justify-between items-center text-[#91a5b8]">
                      <span>Vedic Nakshatra:</span>
                      <strong className="text-[#f5f1e9]">
                        {forensic?.mansionBattle?.moonNakshatra?.name ?? "Rohini"} (Pada {forensic?.mansionBattle?.moonNakshatra?.pada ?? 1})
                      </strong>
                    </div>
                    <div className="flex justify-between items-center text-[#91a5b8]">
                      <span>Star Lord:</span>
                      <span className="text-[#cbd5df]">{forensic?.mansionBattle?.moonNakshatra?.starLord}</span>
                    </div>
                  </div>

                  <p className="mt-3 text-[11px] text-[#8ea2b4] leading-relaxed pt-2 border-t border-[rgba(228,197,139,0.08)]">
                    {forensic?.mansionBattle?.narrative}
                  </p>
                </div>
              </div>

              {/* Truth-Tellers vs Deceptive Traps (When Actual Winner is known) */}
              {simulation.comparison.actualWinner && (
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4 pt-2">
                  <div className="p-3.5 rounded-xl border border-[rgba(112,239,190,0.22)] bg-[rgba(112,239,190,0.03)]">
                    <span className="text-[10px] font-extrabold uppercase tracking-wider text-[#86efc1] flex items-center gap-1.5">
                      <CheckCircle2 size={13} />
                      <span>Truth-Teller Methods (Backed Actual Winner)</span>
                    </span>
                    <div className="flex flex-wrap gap-1.5 mt-2">
                      {forensic?.causalAttribution?.truthTellers?.length ? (
                        forensic.causalAttribution.truthTellers.map((m: string) => (
                          <span
                            key={m}
                            className="px-2 py-0.5 rounded text-[10px] font-medium bg-[rgba(112,239,190,0.12)] text-[#a3f3cf] border border-[rgba(112,239,190,0.2)]"
                          >
                            {m}
                          </span>
                        ))
                      ) : (
                        <span className="text-xs text-[#8294a5]">No single dominant layer; integrated matrix.</span>
                      )}
                    </div>
                  </div>

                  <div className="p-3.5 rounded-xl border border-[rgba(255,115,136,0.22)] bg-[rgba(255,115,136,0.03)]">
                    <span className="text-[10px] font-extrabold uppercase tracking-wider text-[#ff8ba0] flex items-center gap-1.5">
                      <AlertTriangle size={13} />
                      <span>Deceptive Trap Methods (Misled Baseline)</span>
                    </span>
                    <div className="flex flex-wrap gap-1.5 mt-2">
                      {forensic?.causalAttribution?.deceptiveTraps?.length ? (
                        forensic.causalAttribution.deceptiveTraps.map((m: string) => (
                          <span
                            key={m}
                            className="px-2 py-0.5 rounded text-[10px] font-medium bg-[rgba(255,115,136,0.12)] text-[#ffa1b3] border border-[rgba(255,115,136,0.2)]"
                          >
                            {m}
                          </span>
                        ))
                      ) : (
                        <span className="text-xs text-[#8294a5]">None — baseline was clean.</span>
                      )}
                    </div>
                  </div>
                </div>
              )}
            </>
          )}
        </div>
      )}

      {/* TAB 2: TACTICAL RADAR (LIVE ALERTS & HISTORICAL TWINS) */}
      {activeTab === "matcher" && (
        <div className="mt-5 space-y-5 animate-in fade-in duration-300">
          {/* Active Tactical Alerts */}
          <div>
            <div className="flex items-center justify-between mb-3">
              <span className="text-xs font-bold uppercase tracking-wider text-[#e4c58b] flex items-center gap-1.5">
                <Flame size={14} />
                <span>Live Pre-Game Tactical Alerts</span>
              </span>
              <span className="text-[11px] text-[#8294a5]">
                Cross-referenced with 2,000+ historical game patterns
              </span>
            </div>

            {alerts.length === 0 ? (
              <div className="p-4 rounded-xl border border-[rgba(228,197,139,0.15)] bg-[rgba(255,255,255,0.015)] text-xs text-[#91a5b8]">
                No dangerous trap signatures detected. Astrological field is balanced within historical norms.
              </div>
            ) : (
              <div className="space-y-2.5">
                {alerts.map((alert: any, idx: number) => (
                  <div
                    key={idx}
                    className={`p-3.5 rounded-xl border flex flex-col md:flex-row md:items-center justify-between gap-3 ${
                      alert.type === "CONFIRMED_HIT_FORMULA"
                        ? "bg-[rgba(112,239,190,0.06)] border-[rgba(112,239,190,0.25)] text-[#a3f3cf]"
                        : "bg-[rgba(255,115,136,0.08)] border-[rgba(255,115,136,0.3)] text-[#ffa1b3]"
                    }`}
                  >
                    <div>
                      <div className="flex items-center gap-2">
                        <span
                          className={`text-[9px] font-extrabold uppercase px-2 py-0.5 rounded border ${
                            alert.type === "CONFIRMED_HIT_FORMULA"
                              ? "bg-[rgba(112,239,190,0.18)] border-[rgba(112,239,190,0.4)] text-[#6ce8b4]"
                              : "bg-[rgba(255,115,136,0.18)] border-[rgba(255,115,136,0.4)] text-[#ff7891]"
                          }`}
                        >
                          {alert.badge}
                        </span>
                        <h4 className="text-xs font-semibold text-[#f5f1e9]">{alert.title}</h4>
                      </div>
                      <p className="text-[11px] text-[#c5d3df] mt-1 leading-relaxed">
                        {alert.tacticalAdvice}
                      </p>
                    </div>

                    <div className="text-[10px] text-[#8ea2b4] whitespace-nowrap self-end md:self-center">
                      Verified across {alert.supportGames} games
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Historical Twins */}
          <div className="pt-3 border-t border-[rgba(228,197,139,0.12)]">
            <span className="text-xs font-bold uppercase tracking-wider text-[#e4c58b] flex items-center gap-1.5 mb-3">
              <Search size={14} />
              <span>Closest Historical Astrological Twins</span>
            </span>

            {twins.length === 0 ? (
              <div className="p-4 rounded-xl border border-dashed border-[rgba(228,197,139,0.15)] text-center text-xs text-[#8294a5]">
                Run a fixture calculation to surface historical twin games with matching celestial signatures.
              </div>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                {twins.map((twin: any) => (
                  <div
                    key={twin.id}
                    className="p-3 rounded-xl border border-[rgba(228,197,139,0.14)] bg-[rgba(0,0,0,0.2)] flex items-center justify-between gap-3"
                  >
                    <div>
                      <div className="flex items-center gap-2">
                        <span className="text-[10px] font-extrabold px-1.5 py-0.5 rounded bg-[rgba(228,197,139,0.15)] text-[#f4ddb0]">
                          {Math.round(twin.similarity * 100)}% Match
                        </span>
                        <span className="text-xs font-semibold text-[#e8f1f5]">
                          {twin.teamA} vs {twin.teamB}
                        </span>
                      </div>
                      <div className="text-[10px] text-[#8294a5] mt-1">
                        {twin.sport} · {new Date(twin.startTime).toLocaleDateString()}
                      </div>
                    </div>

                    <div className="text-right">
                      <span
                        className={`text-[9px] font-extrabold uppercase px-2 py-0.5 rounded border ${
                          twin.verdict === "hit"
                            ? "bg-[rgba(112,239,190,0.1)] border-[rgba(112,239,190,0.25)] text-[#86efc1]"
                            : twin.verdict === "miss"
                            ? "bg-[rgba(255,115,136,0.1)] border-[rgba(255,115,136,0.25)] text-[#ffa1b3]"
                            : "bg-[rgba(228,197,139,0.1)] border-[rgba(228,197,139,0.25)] text-[#f4ddb0]"
                        }`}
                      >
                        {twin.actualWinner ? `Winner: Side ${twin.actualWinner}` : "Unverified"}
                      </span>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      )}

      {/* TAB 3: PATTERN MEMORY (2,000+ GAMES DISCOVERY CATALOG) */}
      {activeTab === "catalog" && (
        <div className="mt-5 space-y-4 animate-in fade-in duration-300">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
            <span className="text-xs font-bold uppercase tracking-wider text-[#e4c58b] flex items-center gap-1.5">
              <Trophy size={14} />
              <span>Learned Formula Catalog across Historical Games</span>
            </span>

            {/* Filter Pills */}
            <div className="flex items-center gap-1.5 text-xs">
              <button
                onClick={() => setFilterType("ALL")}
                className={`px-2.5 py-1 rounded-lg font-medium transition-all ${
                  filterType === "ALL"
                    ? "bg-[rgba(228,197,139,0.2)] text-[#f4ddb0] border border-[rgba(228,197,139,0.35)]"
                    : "text-[#8294a5] hover:text-[#cbd5e1]"
                }`}
              >
                All ({catalogRules.length})
              </button>
              <button
                onClick={() => setFilterType("WINNING_FORMULA")}
                className={`px-2.5 py-1 rounded-lg font-medium transition-all ${
                  filterType === "WINNING_FORMULA"
                    ? "bg-[rgba(112,239,190,0.15)] text-[#86efc1] border border-[rgba(112,239,190,0.3)]"
                    : "text-[#8294a5] hover:text-[#86efc1]"
                }`}
              >
                Winning Formulas (Hits)
              </button>
              <button
                onClick={() => setFilterType("UPSET_TRAP")}
                className={`px-2.5 py-1 rounded-lg font-medium transition-all ${
                  filterType === "UPSET_TRAP"
                    ? "bg-[rgba(255,115,136,0.15)] text-[#ffa1b3] border border-[rgba(255,115,136,0.3)]"
                    : "text-[#8294a5] hover:text-[#ffa1b3]"
                }`}
              >
                Upset Traps (Misses)
              </button>
            </div>
          </div>

          {catalogQuery.isLoading ? (
            <div className="p-8 text-center text-xs text-[#8294a5] flex items-center justify-center gap-2">
              <Activity className="animate-spin text-[#e4c58b]" size={16} />
              <span>Scanning 2,000-game pattern space...</span>
            </div>
          ) : filteredCatalog.length === 0 ? (
            <div className="p-6 text-center text-xs text-[#8294a5] border border-dashed border-[rgba(228,197,139,0.15)] rounded-xl">
              No matching pattern formulas found under this filter.
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-3 max-h-[460px] overflow-y-auto pr-1">
              {filteredCatalog.map((rule: any, idx: number) => (
                <div
                  key={idx}
                  className={`p-3.5 rounded-xl border ${
                    rule.ruleType === "WINNING_FORMULA"
                      ? "border-[rgba(112,239,190,0.25)] bg-[rgba(112,239,190,0.03)]"
                      : rule.ruleType === "UPSET_TRAP"
                      ? "border-[rgba(255,115,136,0.25)] bg-[rgba(255,115,136,0.03)]"
                      : "border-[rgba(228,197,139,0.15)] bg-[rgba(255,255,255,0.015)]"
                  }`}
                >
                  <div className="flex items-center justify-between gap-2">
                    <span
                      className={`text-[9px] font-extrabold uppercase px-2 py-0.5 rounded border ${
                        rule.ruleType === "WINNING_FORMULA"
                          ? "bg-[rgba(112,239,190,0.12)] text-[#86efc1] border-[rgba(112,239,190,0.3)]"
                          : rule.ruleType === "UPSET_TRAP"
                          ? "bg-[rgba(255,115,136,0.12)] text-[#ffa1b3] border-[rgba(255,115,136,0.3)]"
                          : "bg-[rgba(228,197,139,0.1)] text-[#f4ddb0] border-[rgba(228,197,139,0.2)]"
                      }`}
                    >
                      {rule.ruleType === "WINNING_FORMULA"
                        ? "Winning Formula"
                        : rule.ruleType === "UPSET_TRAP"
                        ? "Upset Trap"
                        : "Correlated Trend"}
                    </span>

                    <span className="text-xs font-bold text-[#f5f1e9]">
                      {Math.round((rule.baselineAccuracy ?? 0.5) * 100)}% Hit Rate
                      <span className="text-[10px] font-normal text-[#8294a5] ml-1">
                        ({rule.support} games)
                      </span>
                    </span>
                  </div>

                  {/* Token Badges */}
                  <div className="flex flex-wrap gap-1 mt-2.5">
                    {rule.tokens.map((token: string) => (
                      <span
                        key={token}
                        className="text-[9px] font-mono px-1.5 py-0.5 rounded bg-[rgba(0,0,0,0.3)] border border-[rgba(228,197,139,0.12)] text-[#cbd5e1]"
                      >
                        {token}
                      </span>
                    ))}
                  </div>

                  <p className="text-[11px] text-[#91a5b8] mt-2 leading-relaxed">
                    {rule.explanation}
                  </p>
                </div>
              ))}
            </div>
          )}
        </div>
      )}
    </section>
  );
};
