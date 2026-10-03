import { useMemo } from "react";

type Planet = {
  planet: string;
  sign: string;
  house: number;
  degreeInHouse: number;
  tropicalLongitude?: number;
  backgroundWheelLongitude?: number;
  nakshatra: string;
  manzil?: { name: string; index: number; degreeInMansion: number };
  isRetrograde: boolean;
};

type House = { house: number; cuspLongitude: number; sign: string };

type Props = {
  label: string;
  mode: "god" | "agent";
  ascendantLongitude: number;
  planets: Planet[];
  houses: House[];
  showAspects?: boolean;
  showManzils?: boolean;
  showNakshatras?: boolean;
  showDecans?: boolean;
  showStars?: boolean;
};

export type ChartOverlayState = { aspects: boolean; manzils: boolean; nakshatras: boolean; decans: boolean; stars: boolean };

export function ChartControls({ eventTime, stepMinutes, onStep, playing, onTogglePlaying, overlays, onToggleOverlay, disabled }: { eventTime: string; stepMinutes: number; onStep: (minutes: number) => void; playing: boolean; onTogglePlaying: () => void; overlays: ChartOverlayState; onToggleOverlay: (key: keyof ChartOverlayState) => void; disabled?: boolean }) {
  const toggleLabels: Array<[keyof ChartOverlayState, string]> = [["aspects", "Aspects · 5° orb"], ["manzils", "28 Manzils"], ["nakshatras", "27 Nakshatras"], ["decans", "36 Decans"], ["stars", "Fixed stars"]];
  return <div className="mt-4 rounded-xl border border-white/[0.07] bg-black/15 p-3"><div className="flex flex-wrap items-center gap-2"><span className="eyebrow mr-1">Time navigator</span><button className="button-secondary px-2.5 py-1.5 text-[10px]" disabled={disabled} onClick={() => onStep(-40)}>−40 min</button><button className="button-secondary px-2.5 py-1.5 text-[10px]" disabled={disabled} onClick={() => onStep(-30)}>−30 min</button><button className="button-primary px-2.5 py-1.5 text-[10px]" disabled={disabled} onClick={() => onStep(30)}>+30 min</button><button className="button-primary px-2.5 py-1.5 text-[10px]" disabled={disabled} onClick={() => onStep(40)}>+40 min</button><button className="button-secondary ml-auto px-3 py-1.5 text-[10px]" disabled={disabled} onClick={onTogglePlaying}>{playing ? "Pause motion" : "Play motion"}</button></div><div className="mt-3 flex flex-wrap items-center gap-2"><span className="text-[10px] uppercase tracking-[0.14em] text-slate-600">Step {stepMinutes} min</span><span className="text-[10px] text-slate-500">{new Date(eventTime).toLocaleString()}</span><span className="mx-1 h-3 w-px bg-white/10" />{toggleLabels.map(([key, text]) => <button key={key} onClick={() => onToggleOverlay(key)} className={`rounded-full border px-2 py-1 text-[9px] uppercase tracking-[0.11em] transition ${overlays[key] ? "border-cyan-300/25 bg-cyan-300/[0.09] text-cyan-200" : "border-white/10 bg-white/[0.025] text-slate-600"}`}>{text}</button>)}</div><p className="mt-2 text-[10px] leading-4 text-slate-600">Motion recalculates the ephemeris and ascendant at each selected time. Houses move with the selected frame; the fixed overlays remain anchored to the 360° wheel.</p></div>;
}

const SIGNS = ["Aries", "Taurus", "Gemini", "Cancer", "Leo", "Virgo", "Libra", "Scorpio", "Sagittarius", "Capricorn", "Aquarius", "Pisces"];
const SYMBOLS = ["♈", "♉", "♊", "♋", "♌", "♍", "♎", "♏", "♐", "♑", "♒", "♓"];
const GLYPHS: Record<string, string> = { Sun: "☉", Moon: "☽", Mercury: "☿", Venus: "♀", Mars: "♂", Jupiter: "♃", Saturn: "♄", Rahu: "☊", Ketu: "☋" };
const COLORS: Record<string, string> = { Sun: "#f3c878", Moon: "#d9e8ff", Mercury: "#85e6d1", Venus: "#f4b5d5", Mars: "#ff8e86", Jupiter: "#b8a6ff", Saturn: "#91b7dc", Rahu: "#c4a6ff", Ketu: "#a8a3c4" };
const ASPECTS = [0, 30, 45, 60, 72, 90, 108, 120, 135, 144, 150, 180];
const normalize = (value: number) => ((value % 360) + 360) % 360;
const polar = (cx: number, cy: number, radius: number, longitude: number) => {
  const angle = ((longitude - 90) * Math.PI) / 180;
  return { x: cx + Math.cos(angle) * radius, y: cy + Math.sin(angle) * radius };
};
const arcPath = (cx: number, cy: number, radius: number, start: number, end: number) => {
  const a = polar(cx, cy, radius, start);
  const b = polar(cx, cy, radius, end);
  const large = end - start > 180 ? 1 : 0;
  return `M ${a.x} ${a.y} A ${radius} ${radius} 0 ${large} 1 ${b.x} ${b.y}`;
};
const separation = (a: number, b: number) => {
  const d = Math.abs(normalize(a) - normalize(b));
  return Math.min(d, 360 - d);
};

export function EventChartWheel({ label, mode, ascendantLongitude, planets, houses, showAspects = true, showManzils = true, showNakshatras = true, showDecans = true, showStars = true }: Props) {
  const cx = 260;
  const cy = 260;
  const outer = 226;
  const zodiacInner = 184;
  const mansionInner = 170;
  const nakshatraInner = 156;
  const planetRadius = 125;
  const background = mode === "god" ? "#071a26" : "#110e25";
  const accent = mode === "god" ? "#52e2ff" : "#c2a0ff";
  const houseStart = mode === "god" ? 0 : ascendantLongitude;
  const planetPositions = useMemo(() => planets.map((planet, index) => {
    const longitude = normalize(planet.backgroundWheelLongitude ?? planet.tropicalLongitude ?? 0);
    const collisions = planets.slice(0, index).filter((other) => separation(longitude, normalize(other.backgroundWheelLongitude ?? other.tropicalLongitude ?? 0)) < 7).length;
    return { ...planet, longitude, visualLongitude: longitude + collisions * 3.5 };
  }), [planets]);
  const aspects = useMemo(() => {
    const lines: Array<{ a: Planet & { longitude: number }; b: Planet & { longitude: number }; color: string }> = [];
    for (let i = 0; i < planetPositions.length; i += 1) {
      for (let j = i + 1; j < planetPositions.length; j += 1) {
        const distance = separation(planetPositions[i]!.longitude, planetPositions[j]!.longitude);
        const major = ASPECTS.find((target) => Math.abs(distance - target) <= 5);
        if (major !== undefined) lines.push({ a: planetPositions[i]!, b: planetPositions[j]!, color: major === 90 || major === 180 ? "#f18caa" : "#83baff" });
      }
    }
    return lines;
  }, [planetPositions]);

  return (
    <section className="mt-5 overflow-hidden rounded-2xl border border-white/[0.08] bg-[#08101d]/90 shadow-[0_24px_80px_rgba(0,0,0,.24)]">
      <div className="flex flex-wrap items-start justify-between gap-3 border-b border-white/[0.07] px-5 py-4">
        <div>
          <p className={`eyebrow ${mode === "god" ? "text-cyan-200/80" : "text-violet-200/80"}`}>Visual event chart</p>
          <h2 className="section-title mt-1">{label}</h2>
          <p className="mt-1 max-w-2xl text-xs leading-5 text-slate-500">Fixed 360° zodiac background with 28 Manzils, 27 Nakshatras, decan boundaries, fixed stars, and the selected house perspective.</p>
        </div>
        <div className="flex flex-wrap gap-2 text-[10px] uppercase tracking-[0.14em]">
          <span className="rounded-full border border-cyan-300/20 bg-cyan-300/[0.07] px-2.5 py-1 text-cyan-200">{mode === "god" ? "Fixed wheel houses" : "Exact-degree equal houses"}</span>
          <span className="rounded-full border border-white/10 bg-white/[0.04] px-2.5 py-1 text-slate-400">{planets.length} bodies</span>
        </div>
      </div>
      <div className="grid items-center gap-5 p-4 lg:grid-cols-[minmax(420px,560px)_1fr] lg:p-6">
        <div className="mx-auto w-full max-w-[560px]">
          <svg viewBox="0 0 520 520" className="h-auto w-full" role="img" aria-label={`${label} visual event chart`}>
            <defs>
              <radialGradient id={`chart-bg-${mode}`} cx="50%" cy="45%" r="65%"><stop offset="0%" stopColor={mode === "god" ? "#15364a" : "#2b1d4a"} stopOpacity=".72" /><stop offset="100%" stopColor={background} stopOpacity=".98" /></radialGradient>
              <filter id={`chart-glow-${mode}`}><feGaussianBlur stdDeviation="3" result="blur" /><feMerge><feMergeNode in="blur" /><feMergeNode in="SourceGraphic" /></feMerge></filter>
            </defs>
            <circle cx={cx} cy={cy} r={outer + 7} fill={`url(#chart-bg-${mode})`} stroke="rgba(255,255,255,.12)" strokeWidth="1" />
            <circle cx={cx} cy={cy} r={outer} fill="none" stroke="rgba(255,255,255,.28)" strokeWidth="1.2" />
            <circle cx={cx} cy={cy} r={zodiacInner} fill="rgba(255,255,255,.018)" stroke="rgba(255,255,255,.18)" strokeWidth="1" />
            <circle cx={cx} cy={cy} r={mansionInner} fill="none" stroke="rgba(122,202,255,.24)" strokeWidth="1" />
            <circle cx={cx} cy={cy} r={nakshatraInner} fill="none" stroke="rgba(226,183,108,.2)" strokeWidth="1" />
            {SIGNS.map((sign, index) => {
              const start = index * 30;
              const point = polar(cx, cy, (outer + zodiacInner) / 2, start + 15);
              return <g key={sign}><path d={arcPath(cx, cy, outer, start, start + 30)} fill="none" stroke={index % 2 ? "rgba(255,255,255,.07)" : "rgba(90,210,236,.11)"} strokeWidth="28" /><line x1={polar(cx, cy, zodiacInner, start).x} y1={polar(cx, cy, zodiacInner, start).y} x2={polar(cx, cy, outer, start).x} y2={polar(cx, cy, outer, start).y} stroke="rgba(255,255,255,.25)" strokeWidth="1" /><text x={point.x} y={point.y + 5} textAnchor="middle" fill="rgba(238,246,255,.78)" fontSize="19" fontFamily="Georgia, serif">{SYMBOLS[index]}</text><text x={point.x} y={point.y + 21} textAnchor="middle" fill="rgba(148,163,184,.62)" fontSize="6.5" letterSpacing="1.2">{sign.toUpperCase()}</text></g>;
            })}
            {showManzils && Array.from({ length: 28 }, (_, index) => {
              const longitude = index * (360 / 28);
              const a = polar(cx, cy, mansionInner - 3, longitude);
              const b = polar(cx, cy, mansionInner + 7, longitude);
              return <line key={`manzil-${index}`} x1={a.x} y1={a.y} x2={b.x} y2={b.y} stroke="#72c8e9" strokeOpacity=".58" strokeWidth={index % 7 === 0 ? 1.8 : .7} />;
            })}
            {showNakshatras && Array.from({ length: 27 }, (_, index) => {
              const longitude = index * (360 / 27);
              const a = polar(cx, cy, nakshatraInner - 3, longitude);
              const b = polar(cx, cy, nakshatraInner + 6, longitude);
              return <line key={`nakshatra-${index}`} x1={a.x} y1={a.y} x2={b.x} y2={b.y} stroke="#e3bb73" strokeOpacity=".55" strokeWidth={index % 3 === 0 ? 1.3 : .6} />;
            })}
            {showDecans && Array.from({ length: 36 }, (_, index) => {
              const longitude = index * 10;
              const a = polar(cx, cy, outer - 4, longitude);
              const b = polar(cx, cy, outer + (index % 3 === 0 ? 5 : 2), longitude);
              return <line key={`decan-${index}`} x1={a.x} y1={a.y} x2={b.x} y2={b.y} stroke="rgba(255,255,255,.35)" strokeWidth={index % 3 === 0 ? 1 : .45} />;
            })}
            {houses.map((house) => {
              const longitude = mode === "god" ? house.house * 30 - 30 : house.cuspLongitude;
              const a = polar(cx, cy, 12, longitude);
              const b = polar(cx, cy, nakshatraInner - 7, longitude);
              const labelPoint = polar(cx, cy, 92, longitude + 15);
              return <g key={`house-${house.house}`}><line x1={a.x} y1={a.y} x2={b.x} y2={b.y} stroke={house.house === 1 ? accent : "rgba(255,255,255,.14)"} strokeWidth={house.house === 1 ? 2 : .8} /><text x={labelPoint.x} y={labelPoint.y + 3} textAnchor="middle" fill={house.house === 1 ? accent : "rgba(148,163,184,.55)"} fontSize="8">H{house.house}</text></g>;
            })}
            {showAspects && aspects.map(({ a, b, color }, index) => { const p1 = polar(cx, cy, planetRadius, a.longitude); const p2 = polar(cx, cy, planetRadius, b.longitude); return <line key={`aspect-${index}`} x1={p1.x} y1={p1.y} x2={p2.x} y2={p2.y} stroke={color} strokeOpacity=".42" strokeWidth=".8" />; })}
            {showStars && Array.from({ length: 12 }, (_, index) => { const point = polar(cx, cy, outer - 16, index * 30 + 7); return <circle key={`star-${index}`} cx={point.x} cy={point.y} r="1.5" fill="#f4d58a" opacity=".9" />; })}
            <circle cx={cx} cy={cy} r={planetRadius} fill="rgba(4,8,18,.48)" stroke="rgba(255,255,255,.08)" strokeWidth="1" />
            {planetPositions.map((planet) => {
              const point = polar(cx, cy, planetRadius, planet.visualLongitude);
              const color = COLORS[planet.planet] ?? accent;
              return <g key={planet.planet} filter={`url(#chart-glow-${mode})`}><circle cx={point.x} cy={point.y} r="11" fill="#0a1422" stroke={color} strokeOpacity=".75" strokeWidth="1" /><text x={point.x} y={point.y + 4.5} textAnchor="middle" fill={color} fontSize="14" fontFamily="Georgia, serif">{GLYPHS[planet.planet] ?? planet.planet.slice(0, 1)}</text><text x={point.x} y={point.y - 15} textAnchor="middle" fill="rgba(226,232,240,.8)" fontSize="7">{planet.planet}{planet.isRetrograde ? " R" : ""}</text></g>;
            })}
            <circle cx={cx} cy={cy} r="34" fill="rgba(4,8,18,.82)" stroke={accent} strokeOpacity=".28" />
            <text x={cx} y={cy - 2} textAnchor="middle" fill={accent} fontSize="8" letterSpacing="1.3">{mode === "god" ? "GOD VIEW" : "AGENTVIEW"}</text>
            <text x={cx} y={cy + 12} textAnchor="middle" fill="rgba(226,232,240,.7)" fontSize="8">ASC {normalize(ascendantLongitude).toFixed(1)}°</text>
          </svg>
        </div>
        <div className="space-y-3">
          <div className="rounded-xl border border-white/[0.07] bg-white/[0.025] p-4"><p className="eyebrow text-cyan-200/70">Reading the wheel</p><p className="mt-2 text-sm leading-6 text-slate-300">The outer zodiac and overlay rings stay fixed. Only the house spokes change between God View and AgentView.</p></div>
          <div className="grid grid-cols-2 gap-2 text-[10px] uppercase tracking-[0.12em]"><div className="rounded-lg border border-cyan-300/15 bg-cyan-300/[0.05] p-3 text-cyan-200"><span className="block h-1.5 w-7 rounded-full bg-cyan-300/70" />28 Manzils</div><div className="rounded-lg border border-amber-300/15 bg-amber-300/[0.05] p-3 text-amber-200"><span className="block h-1.5 w-7 rounded-full bg-amber-300/70" />27 Nakshatras</div><div className="rounded-lg border border-white/10 bg-white/[0.03] p-3 text-slate-300"><span className="block h-1.5 w-7 rounded-full bg-white/50" />36 Decans</div><div className="rounded-lg border border-violet-300/15 bg-violet-300/[0.05] p-3 text-violet-200"><span className="block h-1.5 w-7 rounded-full bg-violet-300/70" />Aspects</div></div>
          <div className="rounded-xl border border-white/[0.07] bg-black/10 p-4"><p className="eyebrow">Planet key</p><div className="mt-3 grid grid-cols-2 gap-x-4 gap-y-2">{planetPositions.map((planet) => <div key={`key-${planet.planet}`} className="flex items-center gap-2 text-xs text-slate-300"><span style={{ color: COLORS[planet.planet] ?? accent }} className="w-4 text-center font-serif text-base">{GLYPHS[planet.planet] ?? "•"}</span><span>{planet.planet}</span><span className="ml-auto text-slate-600">H{planet.house}</span></div>)}</div></div>
        </div>
      </div>
    </section>
  );
}

export default EventChartWheel;
