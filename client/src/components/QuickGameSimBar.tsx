import { useState, useMemo } from "react";
import {
  Calendar,
  CheckCircle2,
  ChevronDown,
  ChevronUp,
  Clock,
  Compass,
  Flame,
  HelpCircle,
  MapPin,
  Play,
  RotateCcw,
  Sparkles,
  Trophy,
  Zap,
} from "lucide-react";
import {
  SPORTS_VENUES,
  findMatchingVenue,
  QUICK_GAME_PRESETS,
  type QuickGamePreset,
} from "@/lib/sportsVenues";

export type QuickGameInput = {
  teamA: string;
  teamB: string;
  favoredTeam: string;
  underdogTeam: string;
  sport: "MLB" | "NBA" | "NFL" | "NHL" | "MLS" | "NCAAF" | "NCAAB" | "boxing";
  location: string;
  latitude?: number;
  longitude?: number;
  startTime: string;
  actualWinner?: "A" | "B" | "TIE";
};

type Props = {
  isPending: boolean;
  onSimulate: (input: QuickGameInput) => Promise<void>;
  activeSimulationTeamA?: string;
  activeSimulationTeamB?: string;
};

function formatDatetimeLocal(date: Date) {
  const pad = (n: number) => String(n).padStart(2, "0");
  const year = date.getFullYear();
  const month = pad(date.getMonth() + 1);
  const day = pad(date.getDate());
  const hours = pad(date.getHours());
  const mins = pad(date.getMinutes());
  return `${year}-${month}-${day}T${hours}:${mins}`;
}

export function QuickGameSimBar({ isPending, onSimulate }: Props) {
  const [isOpen, setIsOpen] = useState(true);

  // Form State
  const [sport, setSport] = useState<QuickGameInput["sport"]>("NCAAF");
  const [team1, setTeam1] = useState("Ohio State Buckeyes");
  const [team2, setTeam2] = useState("Michigan Wolverines");
  const [favoredTeamIndex, setFavoredTeamIndex] = useState<1 | 2>(1); // 1 = Team 1 is favored, 2 = Team 2 is favored
  const [venueInput, setVenueInput] = useState("Ohio Stadium (The Horseshoe)");
  const [latitude, setLatitude] = useState<string>("40.0016");
  const [longitude, setLongitude] = useState<string>("-83.0197");
  const [isCoordinatesLocked, setIsCoordinatesLocked] = useState(true);
  const [showCoordinateOverride, setShowCoordinateOverride] = useState(false);

  // Default to today at 7:30 PM local
  const [startTimeLocal, setStartTimeLocal] = useState(() => {
    const d = new Date();
    d.setHours(19, 30, 0, 0);
    return formatDatetimeLocal(d);
  });

  const [actualWinner, setActualWinner] = useState<"unverified" | "A" | "B" | "TIE">("unverified");

  // Venue auto-lookup on change
  const handleVenueChange = (val: string) => {
    setVenueInput(val);
    const matched = findMatchingVenue(val);
    if (matched) {
      setLatitude(matched.latitude.toString());
      setLongitude(matched.longitude.toString());
      setIsCoordinatesLocked(true);
    } else {
      setIsCoordinatesLocked(false);
    }
  };

  // Quick preset loader
  const applyPreset = (preset: QuickGamePreset) => {
    setSport(preset.sport);
    setTeam1(preset.favoredTeam);
    setTeam2(preset.underdogTeam);
    setFavoredTeamIndex(1); // team1 is the favored team in presets
    setVenueInput(preset.venueName);
    setLatitude(preset.latitude.toString());
    setLongitude(preset.longitude.toString());
    setIsCoordinatesLocked(true);

    const d = new Date();
    d.setHours(d.getHours() + preset.defaultTimeOffsetHours, 0, 0, 0);
    setStartTimeLocal(formatDatetimeLocal(d));
    setActualWinner("unverified");
  };

  // Quick time setters
  const setQuickTime = (type: "tonight" | "tomorrow" | "saturday") => {
    const d = new Date();
    if (type === "tonight") {
      d.setHours(19, 30, 0, 0);
    } else if (type === "tomorrow") {
      d.setDate(d.getDate() + 1);
      d.setHours(13, 0, 0, 0);
    } else if (type === "saturday") {
      const day = d.getDay();
      const diff = (6 - day + 7) % 7 || 7;
      d.setDate(d.getDate() + diff);
      d.setHours(15, 30, 0, 0);
    }
    setStartTimeLocal(formatDatetimeLocal(d));
  };

  const favoredTeam = favoredTeamIndex === 1 ? team1 : team2;
  const underdogTeam = favoredTeamIndex === 1 ? team2 : team1;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!team1.trim() || !team2.trim() || !venueInput.trim() || !startTimeLocal) return;

    const latNum = latitude.trim() ? Number(latitude) : undefined;
    const lngNum = longitude.trim() ? Number(longitude) : undefined;

    const isoStart = new Date(startTimeLocal).toISOString();

    await onSimulate({
      teamA: favoredTeam.trim(),
      teamB: underdogTeam.trim(),
      favoredTeam: favoredTeam.trim(),
      underdogTeam: underdogTeam.trim(),
      sport,
      location: venueInput.trim(),
      latitude: Number.isFinite(latNum) ? latNum : undefined,
      longitude: Number.isFinite(lngNum) ? lngNum : undefined,
      startTime: isoStart,
      actualWinner: actualWinner === "unverified" ? undefined : actualWinner,
    });
  };

  return (
    <section className="quick-sim-card mb-6 overflow-hidden rounded-2xl border border-cyan-400/25 bg-gradient-to-br from-[#0c1f38] via-[#091526] to-[#120f26] p-5 shadow-[0_20px_60px_rgba(0,0,0,0.45)]">
      {/* Header bar */}
      <div className="flex flex-wrap items-center justify-between gap-3 border-b border-cyan-400/15 pb-4">
        <div className="flex items-center gap-3">
          <div className="grid h-10 w-10 place-items-center rounded-xl border border-cyan-300/40 bg-cyan-400/10 text-cyan-200 shadow-[0_0_20px_rgba(130,239,255,0.25)]">
            <Zap size={20} className="fill-cyan-300 text-cyan-100" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <span className="text-[10px] font-extrabold tracking-[0.2em] text-cyan-300 uppercase">
                Instant Sportsbook Predictor
              </span>
              <span className="rounded-full border border-emerald-400/30 bg-emerald-400/10 px-2 py-0.5 text-[9px] font-bold text-emerald-300 uppercase">
                40-Method Dual-Frame
              </span>
            </div>
            <h2 className="font-display text-xl font-bold tracking-tight text-slate-100 sm:text-2xl">
              Quick Game Simulation
            </h2>
          </div>
        </div>

        <div className="flex items-center gap-2">
          <button
            type="button"
            onClick={() => setIsOpen(!isOpen)}
            className="flex items-center gap-1.5 rounded-lg border border-slate-700/60 bg-slate-900/40 px-3 py-1.5 text-xs font-semibold text-slate-300 hover:border-cyan-400/40 hover:text-cyan-200 transition"
          >
            {isOpen ? (
              <>
                <span>Collapse Bar</span>
                <ChevronUp size={14} />
              </>
            ) : (
              <>
                <span>Open Game Setup</span>
                <ChevronDown size={14} />
              </>
            )}
          </button>
        </div>
      </div>

      {isOpen && (
        <form onSubmit={handleSubmit} className="mt-4 space-y-4">
          {/* Quick Presets Row */}
          <div>
            <div className="mb-2 flex items-center justify-between">
              <span className="text-[10px] font-bold tracking-[0.14em] text-slate-400 uppercase">
                ⚡ 1-Click Matchup Presets
              </span>
              <span className="text-[10px] text-slate-500">Click to fill all fields instantly</span>
            </div>
            <div className="flex gap-2 overflow-x-auto pb-1 scrollbar-none">
              {QUICK_GAME_PRESETS.map((preset) => (
                <button
                  key={preset.label}
                  type="button"
                  onClick={() => applyPreset(preset)}
                  className="flex shrink-0 items-center gap-1.5 rounded-lg border border-slate-700/70 bg-slate-800/40 px-2.5 py-1.5 text-xs font-medium text-slate-300 transition hover:border-cyan-400/50 hover:bg-cyan-950/30 hover:text-cyan-200"
                >
                  <span>{preset.label}</span>
                </button>
              ))}
            </div>
          </div>

          {/* Main Grid: Teams, Sport, Location, Kickoff */}
          <div className="grid gap-4 lg:grid-cols-12">
            {/* Matchup & Favorite Selector (6 Cols) */}
            <div className="rounded-xl border border-slate-700/50 bg-black/25 p-3.5 lg:col-span-6">
              <div className="mb-2.5 flex items-center justify-between">
                <span className="text-[10px] font-extrabold tracking-[0.14em] text-cyan-300 uppercase">
                  1. Matchup & Sportsbook Odds Role
                </span>
                <span className="text-[10px] text-slate-400">
                  Click badge to toggle who is favored
                </span>
              </div>

              <div className="grid gap-2.5 sm:grid-cols-2">
                {/* Team 1 Input */}
                <div className="space-y-1">
                  <div className="flex items-center justify-between">
                    <label className="text-xs font-semibold text-slate-300">Team 1</label>
                    <button
                      type="button"
                      onClick={() => setFavoredTeamIndex(1)}
                      className={`rounded px-1.5 py-0.5 text-[9px] font-extrabold uppercase transition ${
                        favoredTeamIndex === 1
                          ? "bg-amber-400/20 text-amber-300 border border-amber-400/40 shadow-[0_0_8px_rgba(245,192,103,0.3)]"
                          : "text-slate-500 hover:text-slate-300"
                      }`}
                    >
                      {favoredTeamIndex === 1 ? "★ Favored (Side A)" : "Make Favorite"}
                    </button>
                  </div>
                  <input
                    type="text"
                    required
                    value={team1}
                    onChange={(e) => setTeam1(e.target.value)}
                    placeholder="e.g. Ohio State"
                    className="w-full rounded-lg border border-slate-700/80 bg-slate-900/60 px-3 py-2 text-sm font-semibold text-slate-100 placeholder-slate-600 focus:border-cyan-400 focus:outline-none"
                  />
                </div>

                {/* Team 2 Input */}
                <div className="space-y-1">
                  <div className="flex items-center justify-between">
                    <label className="text-xs font-semibold text-slate-300">Team 2</label>
                    <button
                      type="button"
                      onClick={() => setFavoredTeamIndex(2)}
                      className={`rounded px-1.5 py-0.5 text-[9px] font-extrabold uppercase transition ${
                        favoredTeamIndex === 2
                          ? "bg-amber-400/20 text-amber-300 border border-amber-400/40 shadow-[0_0_8px_rgba(245,192,103,0.3)]"
                          : "text-slate-500 hover:text-slate-300"
                      }`}
                    >
                      {favoredTeamIndex === 2 ? "★ Favored (Side A)" : "Make Favorite"}
                    </button>
                  </div>
                  <input
                    type="text"
                    required
                    value={team2}
                    onChange={(e) => setTeam2(e.target.value)}
                    placeholder="e.g. Michigan"
                    className="w-full rounded-lg border border-slate-700/80 bg-slate-900/60 px-3 py-2 text-sm font-semibold text-slate-100 placeholder-slate-600 focus:border-cyan-400 focus:outline-none"
                  />
                </div>
              </div>

              {/* Role explanation */}
              <div className="mt-2.5 flex items-center justify-between rounded-lg bg-slate-900/40 px-2.5 py-1.5 text-[11px] text-slate-400 border border-slate-800">
                <span>
                  <strong className="text-amber-300 font-semibold">{favoredTeam}</strong> is favored (Ascendant).{" "}
                  <strong className="text-slate-300 font-semibold">{underdogTeam}</strong> is underdog (Descendant).
                </span>
                <span className="hidden sm:inline text-[10px] text-slate-500">
                  Firmament Role Rule
                </span>
              </div>
            </div>

            {/* Sport & League (2 Cols) */}
            <div className="rounded-xl border border-slate-700/50 bg-black/25 p-3.5 lg:col-span-2">
              <span className="mb-2 block text-[10px] font-extrabold tracking-[0.14em] text-cyan-300 uppercase">
                2. Sport League
              </span>
              <div className="grid grid-cols-2 gap-1.5 sm:grid-cols-3 lg:grid-cols-1">
                {(
                  [
                    ["NCAAF", "College FB"],
                    ["NFL", "NFL Football"],
                    ["NBA", "NBA Basketball"],
                    ["MLB", "MLB Baseball"],
                    ["boxing", "Combat / Boxing"],
                  ] as const
                ).map(([code, name]) => (
                  <button
                    key={code}
                    type="button"
                    onClick={() => setSport(code)}
                    className={`rounded-lg px-2.5 py-1 text-left text-xs font-semibold transition ${
                      sport === code
                        ? "border border-cyan-400/60 bg-cyan-400/20 text-cyan-200"
                        : "border border-slate-800 bg-slate-900/30 text-slate-400 hover:text-slate-200"
                    }`}
                  >
                    {name}
                  </button>
                ))}
              </div>
            </div>

            {/* Venue & Location with Autocomplete (4 Cols) */}
            <div className="rounded-xl border border-slate-700/50 bg-black/25 p-3.5 lg:col-span-4">
              <div className="mb-2 flex items-center justify-between">
                <span className="text-[10px] font-extrabold tracking-[0.14em] text-cyan-300 uppercase">
                  3. Stadium / Venue
                </span>
                {isCoordinatesLocked ? (
                  <span className="flex items-center gap-1 text-[9px] font-bold text-emerald-300">
                    <CheckCircle2 size={11} /> GPS Locked
                  </span>
                ) : (
                  <span className="text-[9px] text-amber-300">Type venue name</span>
                )}
              </div>

              <div className="relative">
                <input
                  type="text"
                  required
                  list="sports-stadiums"
                  value={venueInput}
                  onChange={(e) => handleVenueChange(e.target.value)}
                  placeholder="Start typing stadium (e.g. Ohio Stadium, Arrowhead, Fenway)..."
                  className="w-full rounded-lg border border-slate-700/80 bg-slate-900/60 px-3 py-2 text-sm text-slate-100 placeholder-slate-600 focus:border-cyan-400 focus:outline-none"
                />
                <datalist id="sports-stadiums">
                  {SPORTS_VENUES.map((v) => (
                    <option key={v.name} value={v.name}>
                      {v.city} ({v.sport})
                    </option>
                  ))}
                </datalist>
              </div>

              {/* Coordinates line */}
              <div className="mt-2 flex items-center justify-between text-[11px] text-slate-400">
                <span className="flex items-center gap-1 truncate">
                  <MapPin size={12} className={isCoordinatesLocked ? "text-emerald-400" : "text-slate-500"} />
                  {latitude && longitude
                    ? `${Number(latitude).toFixed(2)}°N, ${Number(longitude).toFixed(2)}°W`
                    : "No coordinates detected"}
                </span>
                <button
                  type="button"
                  onClick={() => setShowCoordinateOverride(!showCoordinateOverride)}
                  className="text-[10px] text-cyan-400 hover:underline"
                >
                  {showCoordinateOverride ? "Hide GPS" : "Edit GPS"}
                </button>
              </div>

              {showCoordinateOverride && (
                <div className="mt-2 grid grid-cols-2 gap-2 pt-2 border-t border-slate-800">
                  <div>
                    <label className="text-[9px] text-slate-500">Lat (-90 to 90)</label>
                    <input
                      type="number"
                      step="0.0001"
                      value={latitude}
                      onChange={(e) => {
                        setLatitude(e.target.value);
                        setIsCoordinatesLocked(false);
                      }}
                      className="w-full rounded border border-slate-700 bg-black/40 px-2 py-1 text-xs text-white"
                    />
                  </div>
                  <div>
                    <label className="text-[9px] text-slate-500">Lng (-180 to 180)</label>
                    <input
                      type="number"
                      step="0.0001"
                      value={longitude}
                      onChange={(e) => {
                        setLongitude(e.target.value);
                        setIsCoordinatesLocked(false);
                      }}
                      className="w-full rounded border border-slate-700 bg-black/40 px-2 py-1 text-xs text-white"
                    />
                  </div>
                </div>
              )}
            </div>
          </div>

          {/* Time & Start Bar + Run Button */}
          <div className="flex flex-wrap items-center justify-between gap-4 rounded-xl border border-cyan-400/20 bg-slate-900/60 p-3.5">
            {/* Start Time Picker */}
            <div className="flex flex-wrap items-center gap-3">
              <div className="flex items-center gap-2">
                <Clock size={16} className="text-cyan-300" />
                <span className="text-xs font-semibold text-slate-300">Kickoff Time:</span>
              </div>
              <input
                type="datetime-local"
                required
                value={startTimeLocal}
                onChange={(e) => setStartTimeLocal(e.target.value)}
                className="rounded-lg border border-slate-700 bg-black/40 px-3 py-1.5 text-xs font-semibold text-cyan-200 focus:border-cyan-400 focus:outline-none"
              />
              <div className="flex gap-1.5">
                <button
                  type="button"
                  onClick={() => setQuickTime("tonight")}
                  className="rounded border border-slate-700/60 bg-slate-800/40 px-2 py-1 text-[10px] font-medium text-slate-300 hover:border-cyan-400 hover:text-cyan-200"
                >
                  Tonight 7:30p
                </button>
                <button
                  type="button"
                  onClick={() => setQuickTime("tomorrow")}
                  className="rounded border border-slate-700/60 bg-slate-800/40 px-2 py-1 text-[10px] font-medium text-slate-300 hover:border-cyan-400 hover:text-cyan-200"
                >
                  Tomorrow 1p
                </button>
                <button
                  type="button"
                  onClick={() => setQuickTime("saturday")}
                  className="rounded border border-slate-700/60 bg-slate-800/40 px-2 py-1 text-[10px] font-medium text-slate-300 hover:border-cyan-400 hover:text-cyan-200"
                >
                  Saturday 3:30p
                </button>
              </div>
            </div>

            {/* Backtest actual winner selector */}
            <div className="flex items-center gap-2">
              <span className="text-[10px] font-semibold text-slate-400">Score Mode:</span>
              <select
                value={actualWinner}
                onChange={(e) => setActualWinner(e.target.value as any)}
                className="rounded-lg border border-slate-700 bg-slate-950 px-2.5 py-1 text-xs text-slate-300"
              >
                <option value="unverified">Prospective (Pre-game call)</option>
                <option value="A">Favorite Won (Side A)</option>
                <option value="B">Underdog Won (Side B)</option>
                <option value="TIE">Push / Tie</option>
              </select>
            </div>

            {/* Big Run Button */}
            <button
              type="submit"
              disabled={isPending}
              className="inline-flex items-center justify-center gap-2 rounded-xl border border-cyan-300/40 bg-gradient-to-r from-cyan-400 via-sky-300 to-indigo-400 px-6 py-2.5 text-sm font-extrabold text-slate-950 shadow-[0_0_25px_rgba(130,239,255,0.4)] transition hover:brightness-110 active:scale-95 disabled:opacity-50"
            >
              <Play size={16} fill="currentColor" />
              {isPending ? "Calculating 40 Methods…" : "⚡ Run Matchup Simulation"}
            </button>
          </div>
        </form>
      )}
    </section>
  );
}
