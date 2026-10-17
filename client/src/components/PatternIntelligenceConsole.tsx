import { useMemo, useState } from "react";
import {
  AlertTriangle,
  Beaker,
  Brain,
  CheckCircle2,
  ChevronDown,
  Compass,
  Crosshair,
  Database,
  Flame,
  Layers3,
  LoaderCircle,
  Orbit,
  RefreshCw,
  Search,
  ShieldAlert,
  Sparkles,
  Sword,
  Target,
  Trophy,
  XCircle,
  Zap,
} from "lucide-react";
import { trpc } from "@/lib/trpc";

type Props = {
  activeSimulation: any | null;
  onSelectGame?: (gameId: string) => void;
};

export function PatternIntelligenceConsole({ activeSimulation, onSelectGame }: Props) {
  const [activeTab, setActiveTab] = useState<"forensic" | "catalog" | "twins">("forensic");
  const [ruleFilter, setRuleFilter] = useState<"ALL" | "WINNING_FORMULA" | "UPSET_TRAP">("ALL");
  const [searchToken, setSearchToken] = useState("");
  const [minSupport, setMinSupport] = useState(2);

  // Live pattern intelligence for active simulation
  const liveQuery = trpc.patterns.liveIntelligence.useMutation();
  const catalogQuery = trpc.patterns.catalog.useQuery({ minSupport }, { staleTime: 60_000 });

  // Auto-run pattern analysis when activeSimulation changes
  const [liveData, setLiveData] = useState<any | null>(null);
  const [analyzing, setAnalyzing] = useState(false);

  const runLiveIntelligence = async () => {
    if (!activeSimulation) return;
    setAnalyzing(true);
    try {
      const res = await liveQuery.mutateAsync({
        target: {
          id: activeSimulation.id ?? "active-target",
          teamA: activeSimulation.input.teamA,
          teamB: activeSimulation.input.teamB,
          sport: activeSimulation.input.sport ?? "MLB",
          location: activeSimulation.input.location ?? "Venue",
          latitude: activeSimulation.input.latitude,
          longitude: activeSimulation.input.longitude,
          startTime: activeSimulation.input.startTime,
          actualWinner: activeSimulation.comparison?.actualWinner ?? undefined,
          roleAssignmentSource: activeSimulation.input.roleAssignmentSource ?? "market-odds",
        },
      });
      setLiveData(res);
    } catch (err) {
      console.error("Failed to run live intelligence:", err);
    } finally {
      setAnalyzing(false);
    }
  };

  // Re-run whenever a new simulation is produced
  useMemo(() => {
    if (activeSimulation) {
      void runLiveIntelligence();
    }
  }, [activeSimulation?.id, activeSimulation?.input?.teamA, activeSimulation?.input?.teamB]);

  const forensic = liveData?.forensic;
  const activeAlerts = liveData?.activeAlerts ?? [];
  const twins = liveData?.twins ?? [];

  // Filter catalog rules
  const catalogRules = catalogQuery.data?.rules ?? [];
  const filteredRules = useMemo(() => {
    return catalogRules
      .filter((r) => {
        if (ruleFilter !== "ALL" && r.ruleType !== ruleFilter) return false;
        if (searchToken.trim()) {
          const q = searchToken.toLowerCase();
          const matchToken = r.tokens.some((t) => t.toLowerCase().includes(q));
          const matchExpl = r.explanation.toLowerCase().includes(q);
          return matchToken || matchExpl;
        }
        return true;
      })
      .slice(0, 40);
  }, [catalogRules, ruleFilter, searchToken]);

  const catalogStats = useMemo(() => {
    const total = catalogQuery.data?.rules.length ?? 0;
    const formulas = catalogQuery.data?.winningFormulas.length ?? 0;
    const traps = catalogQuery.data?.upsetTraps.length ?? 0;
    const games = catalogQuery.data?.eligibleGames ?? 37;
    return { total, formulas, traps, games };
  }, [catalogQuery.data]);

  return (
    <section className="panel pattern-intelligence-panel" id="pattern-intelligence" style={{ scrollMarginTop: "80px" }}>
      {/* Console Header */}
      <div className="panel-heading" style={{ borderBottom: "1px solid rgba(226,201,155,0.25)", paddingBottom: "1.25rem" }}>
        <div style={{ display: "flex", alignItems: "flex-start", gap: "14px" }}>
          <div
            style={{
              width: "44px",
              height: "44px",
              borderRadius: "12px",
              background: "radial-gradient(circle at 35% 30%, #efce92 0%, #a47633 100%)",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              color: "#050b19",
              boxShadow: "0 0 20px rgba(239,206,146,0.35)",
              flexShrink: 0,
            }}
          >
            <Brain size={24} />
          </div>
          <div>
            <div style={{ display: "flex", alignItems: "center", gap: "8px", flexWrap: "wrap" }}>
              <p className="eyebrow" style={{ margin: 0, color: "#efce92" }}>
                AI Pattern Recognition & Causal Engine
              </p>
              <span
                style={{
                  background: "rgba(156,222,239,0.12)",
                  color: "#9cdeef",
                  border: "1px solid rgba(156,222,239,0.3)",
                  padding: "2px 8px",
                  borderRadius: "999px",
                  fontSize: "10px",
                  fontWeight: 700,
                  letterSpacing: "0.08em",
                  textTransform: "uppercase",
                }}
              >
                FPRE-V2 Causal Matrix
              </span>
            </div>
            <h2 style={{ margin: "4px 0 0", fontSize: "1.5rem", color: "#f5f0e7" }}>
              Recognize Each Hit, Miss &amp; <em>Why It Happened</em>
            </h2>
            <p style={{ margin: "6px 0 0", fontSize: "12px", color: "#b9cadd", maxWidth: "780px", lineHeight: "1.5" }}>
              The intelligence engine remembers multi-game celestial geometry across dozens of verified fixtures.
              It mines recurring winning formulas, exposes underdog upset traps, and conducts a deep post-mortem
              anchored in <strong>territorial battles</strong>, <strong>Chaldean decans</strong>, and{" "}
              <strong>lunar mansions</strong>.
            </p>
          </div>
        </div>

        {/* Global Memory Stat Badges */}
        <div style={{ display: "flex", gap: "10px", flexWrap: "wrap", marginTop: "1rem" }}>
          <div
            style={{
              padding: "6px 12px",
              background: "rgba(255,255,255,0.04)",
              borderRadius: "10px",
              border: "1px solid rgba(226,201,155,0.2)",
              display: "flex",
              alignItems: "center",
              gap: "7px",
              fontSize: "11px",
            }}
          >
            <Database size={14} color="#efce92" />
            <span style={{ color: "#b9cadd" }}>Memory Bank:</span>
            <strong style={{ color: "#f5f0e7" }}>{catalogStats.games} Verified Games</strong>
          </div>
          <div
            style={{
              padding: "6px 12px",
              background: "rgba(16,185,129,0.1)",
              borderRadius: "10px",
              border: "1px solid rgba(16,185,129,0.3)",
              display: "flex",
              alignItems: "center",
              gap: "7px",
              fontSize: "11px",
            }}
          >
            <CheckCircle2 size={14} color="#34d399" />
            <span style={{ color: "#a7f3d0" }}>Winning Formulas:</span>
            <strong style={{ color: "#ecfdf5" }}>{catalogStats.formulas} Mined</strong>
          </div>
          <div
            style={{
              padding: "6px 12px",
              background: "rgba(244,63,94,0.1)",
              borderRadius: "10px",
              border: "1px solid rgba(244,63,94,0.3)",
              display: "flex",
              alignItems: "center",
              gap: "7px",
              fontSize: "11px",
            }}
          >
            <ShieldAlert size={14} color="#fb7185" />
            <span style={{ color: "#fecdd3" }}>Upset Traps:</span>
            <strong style={{ color: "#fff1f2" }}>{catalogStats.traps} Identified</strong>
          </div>
          <button
            onClick={() => void runLiveIntelligence()}
            disabled={analyzing || !activeSimulation}
            style={{
              display: "flex",
              alignItems: "center",
              gap: "6px",
              padding: "6px 12px",
              background: "rgba(156,222,239,0.1)",
              border: "1px solid rgba(156,222,239,0.3)",
              borderRadius: "10px",
              color: "#9cdeef",
              fontSize: "11px",
              fontWeight: 600,
              cursor: activeSimulation ? "pointer" : "not-allowed",
              opacity: activeSimulation ? 1 : 0.5,
            }}
          >
            <RefreshCw size={13} className={analyzing ? "animate-spin" : ""} />
            {analyzing ? "Analyzing..." : "Re-Scan Fixture"}
          </button>
        </div>
      </div>

      {/* Navigation Tabs */}
      <div
        style={{
          display: "flex",
          gap: "8px",
          borderBottom: "1px solid rgba(255,255,255,0.08)",
          padding: "10px 0",
          flexWrap: "wrap",
        }}
      >
        <button
          onClick={() => setActiveTab("forensic")}
          style={{
            padding: "8px 16px",
            borderRadius: "8px",
            border: activeTab === "forensic" ? "1px solid #efce92" : "1px solid transparent",
            background: activeTab === "forensic" ? "rgba(239,206,146,0.12)" : "transparent",
            color: activeTab === "forensic" ? "#fceacc" : "#b9cadd",
            fontSize: "12px",
            fontWeight: 700,
            cursor: "pointer",
            display: "flex",
            alignItems: "center",
            gap: "7px",
          }}
        >
          <Crosshair size={14} color={activeTab === "forensic" ? "#efce92" : "#9cdeef"} />
          Causal Forensics &amp; Why It Happened
        </button>
        <button
          onClick={() => setActiveTab("twins")}
          style={{
            padding: "8px 16px",
            borderRadius: "8px",
            border: activeTab === "twins" ? "1px solid #efce92" : "1px solid transparent",
            background: activeTab === "twins" ? "rgba(239,206,146,0.12)" : "transparent",
            color: activeTab === "twins" ? "#fceacc" : "#b9cadd",
            fontSize: "12px",
            fontWeight: 700,
            cursor: "pointer",
            display: "flex",
            alignItems: "center",
            gap: "7px",
          }}
        >
          <Layers3 size={14} color={activeTab === "twins" ? "#efce92" : "#9cdeef"} />
          Closest Historical Twin Games ({twins.length})
        </button>
        <button
          onClick={() => setActiveTab("catalog")}
          style={{
            padding: "8px 16px",
            borderRadius: "8px",
            border: activeTab === "catalog" ? "1px solid #efce92" : "1px solid transparent",
            background: activeTab === "catalog" ? "rgba(239,206,146,0.12)" : "transparent",
            color: activeTab === "catalog" ? "#fceacc" : "#b9cadd",
            fontSize: "12px",
            fontWeight: 700,
            cursor: "pointer",
            display: "flex",
            alignItems: "center",
            gap: "7px",
          }}
        >
          <Flame size={14} color={activeTab === "catalog" ? "#efce92" : "#9cdeef"} />
          Discovered Pattern Library ({catalogRules.length})
        </button>
      </div>

      {/* TAB 1: Causal Forensics ("Why It Came Out The Way It Did") */}
      {activeTab === "forensic" && (
        <div style={{ marginTop: "1.25rem", display: "grid", gap: "1.25rem" }}>
          {!activeSimulation && (
            <div
              style={{
                padding: "2rem",
                textAlign: "center",
                background: "rgba(0,0,0,0.2)",
                borderRadius: "12px",
                border: "1px dashed rgba(226,201,155,0.3)",
              }}
            >
              <Target size={28} color="#efce92" style={{ margin: "0 auto 8px" }} />
              <h4 style={{ color: "#f5f0e7", margin: "0 0 4px" }}>No Game Currently Selected</h4>
              <p style={{ color: "#b9cadd", fontSize: "12px", margin: 0 }}>
                Select a college football game from the Live / Scheduled rail above or run a sample fixture to generate
                the deep causal post-mortem, decans breakdown, and lunar mansion telemetry.
              </p>
            </div>
          )}

          {activeSimulation && analyzing && (
            <div
              style={{
                padding: "2rem",
                textAlign: "center",
                background: "rgba(0,0,0,0.2)",
                borderRadius: "12px",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                gap: "10px",
              }}
            >
              <LoaderCircle size={20} className="animate-spin" color="#efce92" />
              <span style={{ fontSize: "13px", color: "#f5f0e7" }}>
                Mining multi-game celestial memory and calculating causal attribution...
              </span>
            </div>
          )}

          {activeSimulation && forensic && !analyzing && (
            <>
              {/* Tactical Alerts Bar */}
              {activeAlerts.length > 0 && (
                <div style={{ display: "grid", gap: "10px" }}>
                  {activeAlerts.map((alert: any, idx: number) => {
                    const isHit = alert.type === "CONFIRMED_HIT_FORMULA";
                    return (
                      <div
                        key={idx}
                        style={{
                          padding: "12px 16px",
                          borderRadius: "12px",
                          background: isHit
                            ? "linear-gradient(90deg, rgba(16,185,129,0.15), rgba(6,78,59,0.2))"
                            : "linear-gradient(90deg, rgba(244,63,94,0.18), rgba(136,19,55,0.2))",
                          border: `1px solid ${isHit ? "rgba(16,185,129,0.4)" : "rgba(244,63,94,0.4)"}`,
                          display: "flex",
                          alignItems: "flex-start",
                          gap: "12px",
                        }}
                      >
                        {isHit ? (
                          <Sparkles size={18} color="#34d399" style={{ marginTop: "2px", flexShrink: 0 }} />
                        ) : (
                          <AlertTriangle size={18} color="#fb7185" style={{ marginTop: "2px", flexShrink: 0 }} />
                        )}
                        <div style={{ flex: 1 }}>
                          <div style={{ display: "flex", alignItems: "center", gap: "8px", flexWrap: "wrap" }}>
                            <strong style={{ color: isHit ? "#ecfdf5" : "#fff1f2", fontSize: "13px" }}>
                              {alert.title}
                            </strong>
                            <span
                              style={{
                                background: isHit ? "rgba(16,185,129,0.25)" : "rgba(244,63,94,0.25)",
                                color: isHit ? "#a7f3d0" : "#fecdd3",
                                fontSize: "10px",
                                fontWeight: 700,
                                padding: "2px 8px",
                                borderRadius: "999px",
                              }}
                            >
                              {alert.badge} ({alert.supportGames} matches in memory)
                            </span>
                          </div>
                          <p style={{ margin: "4px 0 0", fontSize: "11px", color: isHit ? "#d1fae5" : "#ffe4e6" }}>
                            {alert.tacticalAdvice}
                          </p>
                          <div style={{ display: "flex", gap: "6px", flexWrap: "wrap", marginTop: "6px" }}>
                            {alert.matchedTokens.map((t: string) => (
                              <code
                                key={t}
                                style={{
                                  fontSize: "9px",
                                  padding: "2px 6px",
                                  borderRadius: "4px",
                                  background: "rgba(0,0,0,0.3)",
                                  color: isHit ? "#6ee7b7" : "#fda4af",
                                }}
                              >
                                {t}
                              </code>
                            ))}
                          </div>
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}

              {/* Main Headline & Post-Mortem Card */}
              <div
                style={{
                  padding: "16px 20px",
                  borderRadius: "14px",
                  background: "linear-gradient(135deg, rgba(26,42,73,0.7), rgba(10,18,34,0.85))",
                  border: "1px solid rgba(226,201,155,0.3)",
                  boxShadow: "0 10px 30px rgba(0,0,0,0.3)",
                }}
              >
                <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", gap: "12px", flexWrap: "wrap" }}>
                  <div>
                    <span
                      style={{
                        fontSize: "10px",
                        fontWeight: 800,
                        letterSpacing: "0.14em",
                        color: "#efce92",
                        textTransform: "uppercase",
                      }}
                    >
                      Causal Attribution Post-Mortem
                    </span>
                    <h3 style={{ margin: "4px 0 0", color: "#f5f0e7", fontSize: "1.2rem", fontWeight: 700 }}>
                      {forensic.causalAttribution.headline}
                    </h3>
                  </div>
                  <div
                    style={{
                      padding: "4px 12px",
                      borderRadius: "999px",
                      fontSize: "11px",
                      fontWeight: 800,
                      letterSpacing: "0.08em",
                      textTransform: "uppercase",
                      background:
                        forensic.verdict === "hit"
                          ? "rgba(16,185,129,0.2)"
                          : forensic.verdict === "miss"
                          ? "rgba(244,63,94,0.2)"
                          : "rgba(156,222,239,0.2)",
                      color:
                        forensic.verdict === "hit"
                          ? "#34d399"
                          : forensic.verdict === "miss"
                          ? "#fb7185"
                          : "#9cdeef",
                      border: `1px solid ${
                        forensic.verdict === "hit"
                          ? "rgba(16,185,129,0.4)"
                          : forensic.verdict === "miss"
                          ? "rgba(244,63,94,0.4)"
                          : "rgba(156,222,239,0.4)"
                      }`,
                    }}
                  >
                    {forensic.verdict === "hit"
                      ? "Verified Hit"
                      : forensic.verdict === "miss"
                      ? "Verified Upset Miss"
                      : "Prospective Pre-Game"}
                  </div>
                </div>

                <p style={{ margin: "10px 0 0", fontSize: "12px", lineHeight: "1.6", color: "#b9cadd" }}>
                  {forensic.causalAttribution.detailedReason}
                </p>

                {/* Tipping Point Badge */}
                <div
                  style={{
                    marginTop: "12px",
                    padding: "8px 12px",
                    background: "rgba(239,206,146,0.08)",
                    border: "1px solid rgba(239,206,146,0.2)",
                    borderRadius: "8px",
                    display: "flex",
                    alignItems: "center",
                    gap: "8px",
                    fontSize: "11px",
                  }}
                >
                  <Zap size={14} color="#efce92" />
                  <span style={{ color: "#efce92", fontWeight: 700 }}>Astrological Tipping Point:</span>
                  <span style={{ color: "#f5f0e7" }}>{forensic.causalAttribution.tippingPoint}</span>
                </div>
              </div>

              {/* Core Battles Triad: Territorial + Decans + Mansions */}
              <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(280px, 1fr))", gap: "1rem" }}>
                {/* 1. Territorial Battle (Core) */}
                <div
                  style={{
                    padding: "16px",
                    borderRadius: "14px",
                    background: "rgba(16,28,53,0.75)",
                    border: "1px solid rgba(204,191,158,0.26)",
                  }}
                >
                  <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: "10px" }}>
                    <div style={{ display: "flex", alignItems: "center", gap: "7px" }}>
                      <Sword size={16} color="#efce92" />
                      <h4 style={{ margin: 0, fontSize: "13px", color: "#f5f0e7", fontWeight: 700 }}>
                        Territorial Battle (Core)
                      </h4>
                    </div>
                    <span
                      style={{
                        fontSize: "10px",
                        fontWeight: 800,
                        padding: "2px 8px",
                        borderRadius: "999px",
                        background:
                          forensic.territorialBattle.advantage === "A"
                            ? "rgba(156,222,239,0.15)"
                            : forensic.territorialBattle.advantage === "B"
                            ? "rgba(196,180,239,0.15)"
                            : "rgba(255,255,255,0.05)",
                        color:
                          forensic.territorialBattle.advantage === "A"
                            ? "#9cdeef"
                            : forensic.territorialBattle.advantage === "B"
                            ? "#c4b4ef"
                            : "#b9cadd",
                      }}
                    >
                      {forensic.territorialBattle.advantage === "A"
                        ? `${activeSimulation.input.teamA} Advantage`
                        : forensic.territorialBattle.advantage === "B"
                        ? `${activeSimulation.input.teamB} Advantage`
                        : "Even Control"}
                    </span>
                  </div>

                  {/* Score bar */}
                  <div style={{ display: "flex", justifyContent: "space-between", fontSize: "11px", marginBottom: "4px" }}>
                    <span style={{ color: "#9cdeef", fontWeight: 600 }}>
                      {activeSimulation.input.teamA}: {forensic.territorialBattle.scoreA.toFixed(1)}
                    </span>
                    <span style={{ color: "#c4b4ef", fontWeight: 600 }}>
                      {activeSimulation.input.teamB}: {forensic.territorialBattle.scoreB.toFixed(1)}
                    </span>
                  </div>
                  <div style={{ height: "6px", background: "rgba(0,0,0,0.3)", borderRadius: "3px", overflow: "hidden", display: "flex" }}>
                    <div
                      style={{
                        width: `${Math.max(
                          10,
                          Math.min(
                            90,
                            (forensic.territorialBattle.scoreA /
                              Math.max(1, forensic.territorialBattle.scoreA + forensic.territorialBattle.scoreB)) *
                              100
                          )
                        )}%`,
                        background: "#9cdeef",
                      }}
                    />
                    <div style={{ flex: 1, background: "#c4b4ef" }} />
                  </div>

                  {/* Cusp Lords & Clusters */}
                  <div style={{ marginTop: "12px", display: "grid", gap: "6px", fontSize: "11px" }}>
                    <div style={{ display: "flex", justifyContent: "space-between", color: "#b9cadd" }}>
                      <span>H1 Cusp Lord:</span>
                      <strong style={{ color: "#f5f0e7" }}>
                        {forensic.territorialBattle.h1Lord.lord} in H{forensic.territorialBattle.h1Lord.placementHouse} (
                        {forensic.territorialBattle.h1Lord.dignity})
                      </strong>
                    </div>
                    <div style={{ display: "flex", justifyContent: "space-between", color: "#b9cadd" }}>
                      <span>H7 Cusp Lord:</span>
                      <strong style={{ color: "#f5f0e7" }}>
                        {forensic.territorialBattle.h7Lord.lord} in H{forensic.territorialBattle.h7Lord.placementHouse} (
                        {forensic.territorialBattle.h7Lord.dignity})
                      </strong>
                    </div>
                    <div style={{ display: "flex", justifyContent: "space-between", color: "#b9cadd" }}>
                      <span>Cusp Custody:</span>
                      <strong style={{ color: "#f5f0e7" }}>
                        {forensic.territorialBattle.ascendantClusterCount} Asc vs{" "}
                        {forensic.territorialBattle.descendantClusterCount} Desc
                      </strong>
                    </div>
                    {forensic.territorialBattle.planetaryWars.length > 0 && (
                      <div style={{ marginTop: "4px", padding: "4px 8px", background: "rgba(244,63,94,0.1)", borderRadius: "6px" }}>
                        <span style={{ color: "#fb7185", fontWeight: 600 }}>Graha Yuddha (Planetary War): </span>
                        <span style={{ color: "#fff" }}>
                          {forensic.territorialBattle.planetaryWars
                            .map((w: any) => `${w.winner} defeats ${w.loser} (${w.degreeDifference?.toFixed(2)}°)`)
                            .join(", ")}
                        </span>
                      </div>
                    )}
                  </div>
                  <p style={{ marginTop: "10px", fontSize: "10.5px", color: "#8fa3bf", lineHeight: "1.4" }}>
                    {forensic.territorialBattle.narrative}
                  </p>
                </div>

                {/* 2. Chaldean Decans (Core) */}
                <div
                  style={{
                    padding: "16px",
                    borderRadius: "14px",
                    background: "rgba(16,28,53,0.75)",
                    border: "1px solid rgba(204,191,158,0.26)",
                  }}
                >
                  <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: "10px" }}>
                    <div style={{ display: "flex", alignItems: "center", gap: "7px" }}>
                      <Compass size={16} color="#efce92" />
                      <h4 style={{ margin: 0, fontSize: "13px", color: "#f5f0e7", fontWeight: 700 }}>
                        Chaldean Decans (Core)
                      </h4>
                    </div>
                    <span
                      style={{
                        fontSize: "10px",
                        fontWeight: 800,
                        padding: "2px 8px",
                        borderRadius: "999px",
                        background:
                          forensic.decanBattle.advantage === "A"
                            ? "rgba(156,222,239,0.15)"
                            : forensic.decanBattle.advantage === "B"
                            ? "rgba(196,180,239,0.15)"
                            : "rgba(255,255,255,0.05)",
                        color:
                          forensic.decanBattle.advantage === "A"
                            ? "#9cdeef"
                            : forensic.decanBattle.advantage === "B"
                            ? "#c4b4ef"
                            : "#b9cadd",
                      }}
                    >
                      {forensic.decanBattle.advantage === "A"
                        ? `${activeSimulation.input.teamA} Decan Edge`
                        : forensic.decanBattle.advantage === "B"
                        ? `${activeSimulation.input.teamB} Decan Edge`
                        : "Balanced Faces"}
                    </span>
                  </div>

                  <div style={{ display: "flex", justifyContent: "space-between", fontSize: "11px", marginBottom: "4px" }}>
                    <span style={{ color: "#9cdeef", fontWeight: 600 }}>
                      Decan Score A: +{forensic.decanBattle.scoreA.toFixed(1)}
                    </span>
                    <span style={{ color: "#c4b4ef", fontWeight: 600 }}>
                      Decan Score B: +{forensic.decanBattle.scoreB.toFixed(1)}
                    </span>
                  </div>
                  <div style={{ height: "6px", background: "rgba(0,0,0,0.3)", borderRadius: "3px", overflow: "hidden", display: "flex" }}>
                    <div
                      style={{
                        width: `${Math.max(
                          10,
                          Math.min(
                            90,
                            (forensic.decanBattle.scoreA /
                              Math.max(0.1, forensic.decanBattle.scoreA + forensic.decanBattle.scoreB)) *
                              100
                          )
                        )}%`,
                        background: "#9cdeef",
                      }}
                    />
                    <div style={{ flex: 1, background: "#c4b4ef" }} />
                  </div>

                  <div style={{ marginTop: "12px", display: "grid", gap: "6px", fontSize: "11px" }}>
                    <div style={{ display: "flex", justifyContent: "space-between", color: "#b9cadd" }}>
                      <span>Own-Face Dignities:</span>
                      <strong style={{ color: "#f5f0e7" }}>
                        Side A: {forensic.decanBattle.faceDignitiesA} | Side B: {forensic.decanBattle.faceDignitiesB}
                      </strong>
                    </div>
                    {forensic.decanBattle.keyRulers.slice(0, 3).map((kr: any, i: number) => (
                      <div key={i} style={{ display: "flex", justifyContent: "space-between", color: "#8fa3bf" }}>
                        <span>
                          {kr.planet} in Decan {kr.decan}:
                        </span>
                        <strong style={{ color: kr.side === "A" ? "#9cdeef" : "#c4b4ef" }}>
                          Ruler {kr.ruler} ({kr.allegiance})
                        </strong>
                      </div>
                    ))}
                  </div>
                  <p style={{ marginTop: "10px", fontSize: "10.5px", color: "#8fa3bf", lineHeight: "1.4" }}>
                    {forensic.decanBattle.narrative}
                  </p>
                </div>

                {/* 3. Little Mansions: Arabic Manzils & Vedic Nakshatras (Core) */}
                <div
                  style={{
                    padding: "16px",
                    borderRadius: "14px",
                    background: "rgba(16,28,53,0.75)",
                    border: "1px solid rgba(204,191,158,0.26)",
                  }}
                >
                  <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: "10px" }}>
                    <div style={{ display: "flex", alignItems: "center", gap: "7px" }}>
                      <Orbit size={16} color="#efce92" />
                      <h4 style={{ margin: 0, fontSize: "13px", color: "#f5f0e7", fontWeight: 700 }}>
                        Little Mansions &amp; Nakshatras (Core)
                      </h4>
                    </div>
                    <span
                      style={{
                        fontSize: "10px",
                        fontWeight: 800,
                        padding: "2px 8px",
                        borderRadius: "999px",
                        background: "rgba(239,206,146,0.15)",
                        color: "#efce92",
                      }}
                    >
                      28 Manzils / 27 Nakshatras
                    </span>
                  </div>

                  <div style={{ marginTop: "8px", display: "grid", gap: "6px", fontSize: "11px" }}>
                    <div style={{ display: "flex", justifyContent: "space-between", color: "#b9cadd" }}>
                      <span>Moon Arabic Manzil:</span>
                      <strong style={{ color: "#efce92" }}>
                        #{forensic.mansionBattle.moonManzil.index} {forensic.mansionBattle.moonManzil.name}
                      </strong>
                    </div>
                    <div style={{ display: "flex", justifyContent: "space-between", color: "#b9cadd" }}>
                      <span>Moon Vedic Nakshatra:</span>
                      <strong style={{ color: "#f5f0e7" }}>
                        {forensic.mansionBattle.moonNakshatra.name} (Pada {forensic.mansionBattle.moonNakshatra.pada})
                      </strong>
                    </div>
                    <div style={{ display: "flex", justifyContent: "space-between", color: "#b9cadd" }}>
                      <span>Nakshatra Star Lord:</span>
                      <strong style={{ color: "#9cdeef" }}>{forensic.mansionBattle.moonNakshatra.starLord}</strong>
                    </div>
                    <div style={{ display: "flex", justifyContent: "space-between", color: "#b9cadd" }}>
                      <span>Sun Arabic Manzil:</span>
                      <strong style={{ color: "#f5f0e7" }}>
                        #{forensic.mansionBattle.sunManzil.index} {forensic.mansionBattle.sunManzil.name}
                      </strong>
                    </div>
                  </div>
                  <p style={{ marginTop: "10px", fontSize: "10.5px", color: "#8fa3bf", lineHeight: "1.4" }}>
                    {forensic.mansionBattle.narrative}
                  </p>
                </div>
              </div>

              {/* Truth-Tellers vs Deceptive Traps */}
              <div
                style={{
                  padding: "16px",
                  borderRadius: "14px",
                  background: "rgba(10,18,34,0.6)",
                  border: "1px solid rgba(255,255,255,0.08)",
                }}
              >
                <h4 style={{ margin: "0 0 8px", fontSize: "12px", color: "#efce92", letterSpacing: "0.1em", textTransform: "uppercase" }}>
                  Method Diagnostic: Truth-Tellers vs. Deceptive Traps
                </h4>
                <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(280px, 1fr))", gap: "1rem" }}>
                  <div style={{ padding: "10px", background: "rgba(16,185,129,0.06)", borderRadius: "8px", border: "1px solid rgba(16,185,129,0.2)" }}>
                    <div style={{ display: "flex", alignItems: "center", gap: "6px", marginBottom: "6px" }}>
                      <CheckCircle2 size={14} color="#34d399" />
                      <strong style={{ color: "#a7f3d0", fontSize: "11px" }}>Truth-Teller Methods (Confirmed Result)</strong>
                    </div>
                    {forensic.causalAttribution.truthTellers.length > 0 ? (
                      <div style={{ display: "flex", flexWrap: "wrap", gap: "4px" }}>
                        {forensic.causalAttribution.truthTellers.map((m: string) => (
                          <span key={m} style={{ background: "rgba(16,185,129,0.18)", color: "#ecfdf5", padding: "2px 7px", borderRadius: "4px", fontSize: "10px" }}>
                            {m}
                          </span>
                        ))}
                      </div>
                    ) : (
                      <span style={{ fontSize: "11px", color: "#8fa3bf" }}>Pre-game resolution pending or all layers split.</span>
                    )}
                  </div>

                  <div style={{ padding: "10px", background: "rgba(244,63,94,0.06)", borderRadius: "8px", border: "1px solid rgba(244,63,94,0.2)" }}>
                    <div style={{ display: "flex", alignItems: "center", gap: "6px", marginBottom: "6px" }}>
                      <XCircle size={14} color="#fb7185" />
                      <strong style={{ color: "#fecdd3", fontSize: "11px" }}>Deceptive Trap Layers (Opposite Signal)</strong>
                    </div>
                    {forensic.causalAttribution.deceptiveTraps.length > 0 ? (
                      <div style={{ display: "flex", flexWrap: "wrap", gap: "4px" }}>
                        {forensic.causalAttribution.deceptiveTraps.map((m: string) => (
                          <span key={m} style={{ background: "rgba(244,63,94,0.18)", color: "#fff1f2", padding: "2px 7px", borderRadius: "4px", fontSize: "10px" }}>
                            {m}
                          </span>
                        ))}
                      </div>
                    ) : (
                      <span style={{ fontSize: "11px", color: "#8fa3bf" }}>No misleading contrary layers detected.</span>
                    )}
                  </div>
                </div>
              </div>
            </>
          )}
        </div>
      )}

      {/* TAB 2: Closest Historical Twin Games */}
      {activeTab === "twins" && (
        <div style={{ marginTop: "1.25rem", display: "grid", gap: "1rem" }}>
          {!twins.length ? (
            <div style={{ padding: "2rem", textAlign: "center", color: "#b9cadd" }}>
              <p>Run a fixture above to match against the 37+ verified historical games in memory.</p>
            </div>
          ) : (
            <>
              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                <div>
                  <h3 style={{ margin: 0, color: "#f5f0e7", fontSize: "14px", fontWeight: 700 }}>
                    Closest Historical Matchups Sharing This Celestial Topology
                  </h3>
                  <p style={{ margin: "2px 0 0", color: "#8fa3bf", fontSize: "11px" }}>
                    Ranked by Jaccard similarity across territorial cluster custody, Chaldean decan faces, and lunar mansions.
                  </p>
                </div>
                <span style={{ fontSize: "11px", color: "#efce92", fontWeight: 700 }}>
                  {twins.length} Twin Fixtures Found
                </span>
              </div>

              <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(280px, 1fr))", gap: "10px" }}>
                {twins.map((twin: any) => {
                  const pct = Math.round((twin.similarity ?? 0) * 100);
                  const isHit = twin.verdict === "hit";
                  const isMiss = twin.verdict === "miss";
                  return (
                    <div
                      key={twin.id}
                      style={{
                        padding: "14px",
                        borderRadius: "12px",
                        background: "rgba(16,28,53,0.7)",
                        border: "1px solid rgba(226,201,155,0.25)",
                        display: "flex",
                        flexDirection: "column",
                        gap: "8px",
                      }}
                    >
                      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start" }}>
                        <div>
                          <span style={{ fontSize: "9px", color: "#efce92", fontWeight: 800, textTransform: "uppercase" }}>
                            {twin.sport} · {new Date(twin.startTime).toLocaleDateString()}
                          </span>
                          <h4 style={{ margin: "2px 0 0", fontSize: "13px", color: "#f5f0e7", fontWeight: 700 }}>
                            {twin.teamA} vs {twin.teamB}
                          </h4>
                        </div>
                        <div
                          style={{
                            padding: "3px 8px",
                            borderRadius: "6px",
                            background: "rgba(239,206,146,0.15)",
                            color: "#efce92",
                            fontWeight: 800,
                            fontSize: "11px",
                          }}
                        >
                          {pct}% Match
                        </div>
                      </div>

                      <div style={{ display: "flex", justifyContent: "space-between", fontSize: "11px", color: "#b9cadd" }}>
                        <span>Baseline Call: Side {twin.predictedWinner}</span>
                        <span style={{ color: isHit ? "#34d399" : isMiss ? "#fb7185" : "#9cdeef", fontWeight: 700 }}>
                          Actual: {twin.actualWinner ? `Side ${twin.actualWinner}` : "Unverified"} ({twin.verdict})
                        </span>
                      </div>

                      {/* Shared Tokens */}
                      <div>
                        <span style={{ fontSize: "9px", color: "#8fa3bf", textTransform: "uppercase", fontWeight: 700 }}>
                          Shared Tokens:
                        </span>
                        <div style={{ display: "flex", flexWrap: "wrap", gap: "4px", marginTop: "4px" }}>
                          {twin.sharedTokens?.map((tok: string) => (
                            <span
                              key={tok}
                              style={{
                                fontSize: "9px",
                                background: "rgba(0,0,0,0.3)",
                                color: "#9cdeef",
                                padding: "1px 5px",
                                borderRadius: "3px",
                              }}
                            >
                              {tok}
                            </span>
                          ))}
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            </>
          )}
        </div>
      )}

      {/* TAB 3: Discovered Pattern Library (Mined Formulas & Traps) */}
      {activeTab === "catalog" && (
        <div style={{ marginTop: "1.25rem", display: "grid", gap: "1rem" }}>
          {/* Filter Bar */}
          <div
            style={{
              display: "flex",
              justifyContent: "space-between",
              alignItems: "center",
              gap: "10px",
              flexWrap: "wrap",
            }}
          >
            <div style={{ display: "flex", gap: "6px", flexWrap: "wrap" }}>
              {(["ALL", "WINNING_FORMULA", "UPSET_TRAP"] as const).map((mode) => (
                <button
                  key={mode}
                  onClick={() => setRuleFilter(mode)}
                  style={{
                    padding: "5px 12px",
                    borderRadius: "6px",
                    fontSize: "11px",
                    fontWeight: 700,
                    border: ruleFilter === mode ? "1px solid #efce92" : "1px solid rgba(255,255,255,0.1)",
                    background: ruleFilter === mode ? "rgba(239,206,146,0.15)" : "transparent",
                    color: ruleFilter === mode ? "#fceacc" : "#b9cadd",
                    cursor: "pointer",
                  }}
                >
                  {mode === "ALL" ? "All Patterns" : mode === "WINNING_FORMULA" ? "Winning Formulas (Hits)" : "Upset Traps (Misses)"}
                </button>
              ))}
            </div>

            <div style={{ display: "flex", alignItems: "center", gap: "8px" }}>
              <div
                style={{
                  display: "flex",
                  alignItems: "center",
                  gap: "6px",
                  background: "rgba(0,0,0,0.3)",
                  border: "1px solid rgba(255,255,255,0.1)",
                  borderRadius: "8px",
                  padding: "4px 8px",
                }}
              >
                <Search size={13} color="#8fa3bf" />
                <input
                  type="text"
                  placeholder="Filter by token (e.g. TERRITORY, DECAN, MANZIL)..."
                  value={searchToken}
                  onChange={(e) => setSearchToken(e.target.value)}
                  style={{
                    background: "transparent",
                    border: "none",
                    outline: "none",
                    color: "#fff",
                    fontSize: "11px",
                    width: "220px",
                  }}
                />
              </div>
              <label style={{ fontSize: "11px", color: "#8fa3bf", display: "flex", alignItems: "center", gap: "4px" }}>
                Min Games:
                <select
                  value={minSupport}
                  onChange={(e) => setMinSupport(Number(e.target.value))}
                  style={{
                    background: "rgba(0,0,0,0.3)",
                    border: "1px solid rgba(255,255,255,0.1)",
                    borderRadius: "6px",
                    color: "#fff",
                    padding: "2px 6px",
                    fontSize: "11px",
                  }}
                >
                  <option value={2}>2+ Games</option>
                  <option value={3}>3+ Games</option>
                  <option value={4}>4+ Games</option>
                  <option value={5}>5+ Games</option>
                </select>
              </label>
            </div>
          </div>

          {/* Rules Grid */}
          <div style={{ display: "grid", gap: "10px" }}>
            {filteredRules.map((rule: any, idx: number) => {
              const isHit = rule.ruleType === "WINNING_FORMULA";
              const isTrap = rule.ruleType === "UPSET_TRAP";
              const acc = Math.round((rule.baselineAccuracy ?? 0) * 100);
              const upsetRate = 100 - acc;

              return (
                <div
                  key={idx}
                  style={{
                    padding: "14px 16px",
                    borderRadius: "12px",
                    background: isHit
                      ? "rgba(16,185,129,0.06)"
                      : isTrap
                      ? "rgba(244,63,94,0.06)"
                      : "rgba(255,255,255,0.03)",
                    border: `1px solid ${
                      isHit
                        ? "rgba(16,185,129,0.25)"
                        : isTrap
                        ? "rgba(244,63,94,0.25)"
                        : "rgba(255,255,255,0.08)"
                    }`,
                    display: "flex",
                    flexDirection: "column",
                    gap: "8px",
                  }}
                >
                  <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", flexWrap: "wrap", gap: "8px" }}>
                    <div style={{ display: "flex", alignItems: "center", gap: "8px" }}>
                      <span
                        style={{
                          fontSize: "10px",
                          fontWeight: 800,
                          padding: "2px 8px",
                          borderRadius: "999px",
                          background: isHit
                            ? "rgba(16,185,129,0.2)"
                            : isTrap
                            ? "rgba(244,63,94,0.2)"
                            : "rgba(255,255,255,0.1)",
                          color: isHit ? "#34d399" : isTrap ? "#fb7185" : "#b9cadd",
                        }}
                      >
                        {isHit ? "Winning Formula" : isTrap ? "Upset Trap Signature" : "Neutral Trend"}
                      </span>
                      <strong style={{ color: "#f5f0e7", fontSize: "12px" }}>
                        {rule.support} Historical Fixtures in Memory
                      </strong>
                    </div>

                    <div style={{ display: "flex", gap: "8px", fontSize: "11px" }}>
                      <span style={{ color: "#9cdeef" }}>
                        Side A: <strong>{rule.sideAWins}</strong>
                      </span>
                      <span style={{ color: "#c4b4ef" }}>
                        Side B: <strong>{rule.sideBWins}</strong>
                      </span>
                      <span style={{ color: isHit ? "#34d399" : "#fb7185", fontWeight: 700 }}>
                        {isHit ? `${acc}% Win Rate` : `${upsetRate}% Upset Rate`}
                      </span>
                    </div>
                  </div>

                  <p style={{ margin: 0, fontSize: "11.5px", color: "#b9cadd", lineHeight: "1.5" }}>
                    {rule.explanation}
                  </p>

                  <div style={{ display: "flex", flexWrap: "wrap", gap: "4px" }}>
                    {rule.tokens.map((tok: string) => (
                      <code
                        key={tok}
                        style={{
                          fontSize: "10px",
                          padding: "2px 6px",
                          borderRadius: "4px",
                          background: "rgba(0,0,0,0.3)",
                          color: tok.startsWith("TERRITORY")
                            ? "#efce92"
                            : tok.startsWith("DECAN")
                            ? "#9cdeef"
                            : tok.startsWith("MOON") || tok.startsWith("SUN")
                            ? "#c4b4ef"
                            : "#e2e8f0",
                        }}
                      >
                        {tok}
                      </code>
                    ))}
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}
    </section>
  );
}
