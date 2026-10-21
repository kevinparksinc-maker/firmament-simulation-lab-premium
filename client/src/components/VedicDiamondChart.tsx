import { ZODIAC_SIGNS, zodiacAt, houseCusp, locateInHouse } from "../../../shared/firmamentWheel";
import { useMemo } from "react";

export type PlanetItem = {
  planet: string;
  sign: string;
  house: number;
  degreeInHouse?: number;
  tropicalLongitude?: number;
  backgroundWheelLongitude?: number;
  nakshatra?: string;
  isRetrograde?: boolean;
};

type Props = {
  frameName: "God View" | "Agent View";
  ascendantLongitude: number;
  planets: PlanetItem[];
  activeTeamA?: string;
  activeTeamB?: string;
};

const PLANET_SYMBOLS: Record<string, string> = {
  Sun: "☉",
  Moon: "☽",
  Mercury: "☿",
  Venus: "♀",
  Mars: "♂",
  Jupiter: "♃",
  Saturn: "♄",
  Uranus: "♅",
  Neptune: "♆",
  Pluto: "♇",
  Rahu: "☊",
  Ketu: "☋",
};

const ZODIAC_NAMES = ZODIAC_SIGNS;

const ZODIAC_SIGNS = ["♈", "♉", "♊", "♋", "♌", "♍", "♎", "♏", "♐", "♑", "♒", "♓"];

// North Indian Kundali House Polygons on a 400x400 SVG grid
const HOUSE_GEOMETRY = [
  // H1: Top Center Diamond (Ascendant / Lagna)
  {
    house: 1,
    role: "A" as const,
    points: "200,0 100,100 200,200 300,100",
    labelPos: { x: 200, y: 72 },
    signPos: { x: 200, y: 35 },
    planetPos: { x: 200, y: 125 },
  },
  // H2: Top-Left Triangle
  {
    house: 2,
    role: "A" as const,
    points: "200,0 0,0 100,100",
    labelPos: { x: 100, y: 45 },
    signPos: { x: 145, y: 35 },
    planetPos: { x: 95, y: 72 },
  },
  // H3: Upper-Left Triangle
  {
    house: 3,
    role: "A" as const,
    points: "0,0 0,200 100,100",
    labelPos: { x: 45, y: 100 },
    signPos: { x: 35, y: 145 },
    planetPos: { x: 50, y: 75 },
  },
  // H4: Left Center Diamond (Nadir / Bandhu)
  {
    house: 4,
    role: "B" as const,
    points: "0,200 100,100 200,200 100,300",
    labelPos: { x: 100, y: 172 },
    signPos: { x: 35, y: 200 },
    planetPos: { x: 100, y: 225 },
  },
  // H5: Lower-Left Triangle
  {
    house: 5,
    role: "B" as const,
    points: "0,200 0,400 100,300",
    labelPos: { x: 45, y: 300 },
    signPos: { x: 35, y: 260 },
    planetPos: { x: 50, y: 335 },
  },
  // H6: Bottom-Left Triangle
  {
    house: 6,
    role: "A" as const,
    points: "0,400 200,400 100,300",
    labelPos: { x: 100, y: 355 },
    signPos: { x: 145, y: 375 },
    planetPos: { x: 95, y: 330 },
  },
  // H7: Bottom Center Diamond (Descendant / Jaya)
  {
    house: 7,
    role: "B" as const,
    points: "200,400 100,300 200,200 300,300",
    labelPos: { x: 200, y: 272 },
    signPos: { x: 200, y: 375 },
    planetPos: { x: 200, y: 325 },
  },
  // H8: Bottom-Right Triangle
  {
    house: 8,
    role: "B" as const,
    points: "200,400 400,400 300,300",
    labelPos: { x: 300, y: 355 },
    signPos: { x: 255, y: 375 },
    planetPos: { x: 305, y: 330 },
  },
  // H9: Lower-Right Triangle
  {
    house: 9,
    role: "B" as const,
    points: "400,400 400,200 300,300",
    labelPos: { x: 355, y: 300 },
    signPos: { x: 365, y: 260 },
    planetPos: { x: 350, y: 335 },
  },
  // H10: Right Center Diamond (Midheaven / Karma)
  {
    house: 10,
    role: "A" as const,
    points: "400,200 300,300 200,200 300,100",
    labelPos: { x: 300, y: 172 },
    signPos: { x: 365, y: 200 },
    planetPos: { x: 300, y: 225 },
  },
  // H11: Upper-Right Triangle
  {
    house: 11,
    role: "A" as const,
    points: "400,200 400,0 300,100",
    labelPos: { x: 355, y: 100 },
    signPos: { x: 365, y: 145 },
    planetPos: { x: 350, y: 75 },
  },
  // H12: Top-Right Triangle
  {
    house: 12,
    role: "B" as const,
    points: "400,0 200,0 300,100",
    labelPos: { x: 300, y: 45 },
    signPos: { x: 255, y: 35 },
    planetPos: { x: 305, y: 72 },
  },
];

export function VedicDiamondChart({
  frameName,
  ascendantLongitude,
  planets,
  activeTeamA = "Side A (Favored)",
  activeTeamB = "Side B (Underdog)",
}: Props) {
  // Determine ascendant zodiac sign index (0 = Aries, 1 = Taurus, ... 11 = Pisces)
  const lagnaSignIndex = Math.floor(((ascendantLongitude % 360) + 360) % 360 / 30);

  // Group planets by house (1-12)
  const planetsByHouse = useMemo(() => {
    const map = new Map<number, PlanetItem[]>();
    for (let h = 1; h <= 12; h++) {
      map.set(h, []);
    }
    planets.forEach((p) => {
      const rawLongitude = p.backgroundWheelLongitude ?? p.tropicalLongitude;
      const h = rawLongitude === undefined
        ? p.house
        : locateInHouse(rawLongitude, frameName === "God View" ? "god" : "agent", ascendantLongitude).house;
      if(h < 1 || h > 12) throw new RangeError("Planet has no valid house");
      const list = map.get(h) ?? [];
      list.push(p);
      map.set(h, list);
    });
    return map;
  }, [planets, frameName, ascendantLongitude]);

  const isGodView = frameName === "God View";

  return (
    <div className="vedic-diamond-container w-full rounded-2xl border border-amber-300/20 bg-gradient-to-b from-[#091526] via-[#060c18] to-[#040812] p-4 text-slate-100 shadow-[0_16px_50px_rgba(0,0,0,0.5)]">
      {/* Title Header */}
      <div className="mb-3 flex flex-wrap items-center justify-between gap-2 border-b border-amber-300/15 pb-2.5">
        <div>
          <span className="text-[9px] font-extrabold uppercase tracking-[0.16em] text-amber-300">
            Vedic North Indian Kundali · Diamond Layout
          </span>
          <h3 className="font-display text-base font-bold text-slate-100 sm:text-lg">
            {frameName} Diamond Chart
          </h3>
        </div>

        <div className="flex items-center gap-2 text-[10px]">
          <span className="flex items-center gap-1 rounded border border-cyan-400/30 bg-cyan-950/40 px-2 py-0.5 text-cyan-200">
            <span className="h-2 w-2 rounded-full bg-cyan-400" />
            Ascendant Houses (H1, 2, 3, 6, 10, 11)
          </span>
          <span className="flex items-center gap-1 rounded border border-violet-400/30 bg-violet-950/40 px-2 py-0.5 text-violet-200">
            <span className="h-2 w-2 rounded-full bg-violet-400" />
            Descendant Houses (H4, 5, 7, 8, 9, 12)
          </span>
        </div>
      </div>

      {/* 400x400 SVG Canvas */}
      <div className="relative mx-auto aspect-square max-w-[420px]">
        <svg viewBox="0 0 400 400" className="h-full w-full select-none" aria-label="North Indian Vedic Diamond Chart">
          <defs>
            <radialGradient id="h1-glow">
              <stop offset="0%" stopColor="#82efff" stopOpacity="0.22" />
              <stop offset="100%" stopColor="#82efff" stopOpacity="0.04" />
            </radialGradient>
            <radialGradient id="h7-glow">
              <stop offset="0%" stopColor="#c9a8ff" stopOpacity="0.22" />
              <stop offset="100%" stopColor="#c9a8ff" stopOpacity="0.04" />
            </radialGradient>
          </defs>

          {/* Outer Border */}
          <rect
            x="2"
            y="2"
            width="396"
            height="396"
            fill="none"
            stroke="rgba(228, 197, 139, 0.45)"
            strokeWidth="2.5"
            rx="4"
          />

          {/* Render 12 Houses */}
          {HOUSE_GEOMETRY.map((hGeom) => {
            const houseNum = hGeom.house;
            const isRoleA = hGeom.role === "A";

            // Sign in this house (1-based Rashi index, 1 = Aries, 12 = Pisces)
            const signNumber = zodiacAt(houseCusp(houseNum, isGodView ? "god" : "agent", ascendantLongitude)).index + 1;
            const signSymbol = ZODIAC_SIGNS[signNumber - 1];

            const occupants = planetsByHouse.get(houseNum) ?? [];

            const isCenterH1 = houseNum === 1;
            const isCenterH7 = houseNum === 7;

            const fillColor = isCenterH1
              ? "url(#h1-glow)"
              : isCenterH7
                ? "url(#h7-glow)"
                : isRoleA
                  ? "rgba(130, 239, 255, 0.045)"
                  : "rgba(201, 168, 255, 0.045)";

            const strokeColor = isRoleA
              ? "rgba(130, 239, 255, 0.35)"
              : "rgba(201, 168, 255, 0.35)";

            return (
              <g key={`house-${houseNum}`}>
                {/* Polygon Sector */}
                <polygon
                  points={hGeom.points}
                  fill={fillColor}
                  stroke={strokeColor}
                  strokeWidth="1.2"
                />

                {/* House Label (e.g. H1, H2) */}
                <text
                  x={hGeom.labelPos.x}
                  y={hGeom.labelPos.y}
                  textAnchor="middle"
                  className="text-[11px] font-black"
                  fill={isRoleA ? "#a6f4ff" : "#dfc9ff"}
                  style={{ fontSize: "11px", fontWeight: 800 }}
                >
                  H{houseNum}
                </text>

                {/* Rashi Sign Symbol & Number */}
                <text
                  x={hGeom.signPos.x}
                  y={hGeom.signPos.y}
                  textAnchor="middle"
                  fill="#e4c58b"
                  style={{ fontSize: "10px", fontWeight: 700 }}
                >
                  {signSymbol} <tspan style={{ fontSize: "8px", fill: "#c4a362" }}>{signNumber}</tspan>
                </text>

                {/* Planets placed in this house */}
                {occupants.length > 0 && (
                  <g>
                    {occupants.slice(0, 4).map((p, pIdx) => {
                      const offsetY = (pIdx - (Math.min(occupants.length, 4) - 1) / 2) * 12;
                      const symbol = PLANET_SYMBOLS[p.planet] ?? p.planet.slice(0, 2);
                      const deg = p.degreeInHouse !== undefined ? `${Math.round(p.degreeInHouse)}°` : "";

                      return (
                        <text
                          key={p.planet}
                          x={hGeom.planetPos.x}
                          y={hGeom.planetPos.y + offsetY}
                          textAnchor="middle"
                          fill="#ffffff"
                          style={{ fontSize: "10px", fontWeight: 700 }}
                        >
                          <tspan fill={isRoleA ? "#d6f9ff" : "#f1e8ff"}>
                            {symbol} {p.planet.slice(0, 3)}
                          </tspan>
                          {p.isRetrograde && <tspan fill="#f59e0b" style={{ fontSize: "8px" }}> (R)</tspan>}
                          {deg && <tspan fill="#94a3b8" style={{ fontSize: "8px" }}> {deg}</tspan>}
                        </text>
                      );
                    })}
                    {occupants.length > 4 && (
                      <text
                        x={hGeom.planetPos.x}
                        y={hGeom.planetPos.y + 24}
                        textAnchor="middle"
                        fill="#cbd5e1"
                        style={{ fontSize: "8px" }}
                      >
                        +{occupants.length - 4} more
                      </text>
                    )}
                  </g>
                )}
              </g>
            );
          })}
        </svg>
      </div>

      {/* Bottom Summary Bar */}
      <div className="mt-3 flex flex-wrap items-center justify-between gap-2 rounded-lg bg-black/40 px-3 py-2 text-[11px] text-slate-400 border border-slate-800">
        <div>
          <span className="text-amber-300 font-semibold">Lagna (H1 Ascendant): </span>
          <span>{ZODIAC_NAMES[lagnaSignIndex]} ({Math.round(ascendantLongitude % 30)}°)</span>
        </div>
        <div className="flex gap-3">
          <span>Side A: <strong className="text-cyan-300 font-semibold">{activeTeamA}</strong></span>
          <span>Side B: <strong className="text-violet-300 font-semibold">{activeTeamB}</strong></span>
        </div>
      </div>
    </div>
  );
}
