import { useMemo, useState } from "react";
import "./NorthIndianChart.css";

/**
 * North Indian kundli: fixed house cells (1 at top, 7 opposite at bottom),
 * house numbers increase counterclockwise. Rashi/cusp signs and planets change.
 *
 * Visual adapter only. Never recalculates or overwrites a prediction engine's
 * recorded house. Exact 30° equal cusps stay in the model coordinate frame.
 */
const HOUSE_CENTERS = [
  { x: 200, y: 103 }, { x: 102, y: 57 }, { x: 57, y: 103 },
  { x: 103, y: 200 }, { x: 57, y: 297 }, { x: 102, y: 343 },
  { x: 200, y: 297 }, { x: 298, y: 343 }, { x: 343, y: 297 },
  { x: 297, y: 200 }, { x: 343, y: 103 }, { x: 298, y: 57 },
] as const;
const SIGNS = ["Aries", "Taurus", "Gemini", "Cancer", "Leo", "Virgo", "Libra", "Scorpio", "Sagittarius", "Capricorn", "Aquarius", "Pisces"];
const GLYPHS: Record<string,string> = { Sun:"☉",Moon:"☽",Mercury:"☿",Venus:"♀",Mars:"♂",Jupiter:"♃",Saturn:"♄",Uranus:"♅",Neptune:"♆",Pluto:"♇",Rahu:"☊",Ketu:"☋", "North Node":"☊","South Node":"☋" };
export const normalize = (v:number) => (v%360+360)%360;
export const signAtLongitude = (lon:number) => Math.floor(normalize(lon)/30)+1;
export function equalHouseFor(longitude:number, anchor:number){
  return Math.floor(normalize(longitude-anchor)/30)+1;
}
export const NORTH_INDIAN_CELLS = HOUSE_CENTERS;

export type NorthPlanet = {
  planet: string;
  house: number;
  tropicalLongitude?: number;
  backgroundWheelLongitude?: number;
  longitude?: number;
  sign?: string;
  nakshatra?: string;
  isRetrograde?: boolean;
};
type Props = {
  label: string;
  mode: "god" | "agent";
  ascendantLongitude: number;
  planets: NorthPlanet[];
  compact?: boolean;
  /** God View's fixed background geometry vs the event-local moving longitude. */
  showCuspDegrees?: boolean;
};

export function NorthIndianChart({label,mode,ascendantLongitude,planets,compact=false,showCuspDegrees=true}:Props){
  const [selected,setSelected]=useState(1);
  const anchor=mode==="god"?0:ascendantLongitude;
  const houses=useMemo(()=>HOUSE_CENTERS.map((position,index)=>{
    const house=index+1;
    const cusp=normalize(anchor+index*30);
    const bodies=planets.filter(body=>body.house===house);
    return { ...position,house,cusp,signNumber:signAtLongitude(cusp),bodies };
  }),[anchor,planets]);
  const invalid=planets.filter(body=>!Number.isInteger(body.house)||body.house<1||body.house>12);
  // A supplied planet-house relationship is authoritative. Comparing with a
  // longitude is an audit, not a reason to silently relocate the planet.
  const discrepancies=planets.flatMap(body=>{
    const lon=mode==="god"?body.backgroundWheelLongitude??body.longitude:body.tropicalLongitude??body.longitude;
    if(lon==null||!Number.isFinite(lon)||!Number.isInteger(body.house)||body.house<1||body.house>12)return [];
    const projected=equalHouseFor(lon,anchor);
    return projected===body.house?[]:[`${body.planet}: engine H${body.house}, equal-cusp geometry H${projected}`];
  });
  const active=houses[selected-1]!;
  const accent=mode==="god"?"#92e5ed":"#e4c5f9";
  return <section className={`ni-chart ${compact?"ni-compact":""}`} aria-label={`${label}: North Indian house chart`}>
    <header className="ni-heading"><div><span className="ni-kicker">{mode==="god"?"PERMANENT GOD FRAME":"EVENT-LOCAL AGENT FRAME"} · NORTH INDIAN FORMAT</span><h3>{label}</h3></div><span className="ni-pill">H1 ↑ · H7 ↓</span></header>
    <div className="ni-grid">
      <div className="ni-graphic">
        <svg role="img" aria-label="North Indian kundli with fixed houses, first house at top, second to upper left, seventh at bottom and tenth at right; planets appear in recorded engine houses" viewBox="0 0 400 400">
          <rect x="2" y="2" width="396" height="396" fill="#07152c" stroke="#e9cb8d" strokeWidth="2.3" rx="3"/>
          <path d="M200 2 L398 200 L200 398 L2 200 Z" fill="none" stroke="#afc4dc" strokeWidth="1.35"/>
          <path d="M2 2 L398 398 M398 2 L2 398" fill="none" stroke="#9badc6" strokeWidth="1.35"/>
          <path d="M200 2 L200 398 M2 200 L398 200" stroke="#b0bece" strokeWidth=".25" strokeOpacity=".08"/>
          {houses.map(h=>{
            const focused=h.house===selected;
            const code=h.bodies.map(body=>GLYPHS[body.planet]??body.planet.slice(0,2)).join(" ");
            return <g key={h.house}>
              {focused&&<circle cx={h.x} cy={h.y+5} r={h.house===1||h.house===7||h.house===4||h.house===10?49:35} fill={accent} fillOpacity=".085" stroke={accent} strokeOpacity=".45" strokeWidth="1.2" strokeDasharray="3 4"/>}
              <text x={h.x} y={h.y-14} textAnchor="middle" fill="#f0d79e" fontSize="12" fontWeight="700">H{h.house}</text>
              <text x={h.x} y={h.y+3} textAnchor="middle" fill="#92cbe2" fontSize="10">R{h.signNumber} · {SIGNS[h.signNumber-1].slice(0,3)}</text>
              <text x={h.x} y={h.y+19} textAnchor="middle" fill="#f3edf4" fontSize={code.length>12?10:12}>{code.slice(0,17)||"—"}</text>
              <title>{`House ${h.house}, cusp ${h.cusp.toFixed(2)}° (${SIGNS[h.signNumber-1]}); ${h.bodies.map(b=>b.planet).join(", ")||"no planets"}`}</title>
            </g>;
          })}
          <text x="200" y="15" fill="#ead19d" fontSize="10" textAnchor="middle">ASC / H1</text>
          <text x="200" y="392" fill="#ead19d" fontSize="10" textAnchor="middle">DSC / H7</text>
        </svg>
      </div>
      <div className="ni-detail">
        <p className="ni-detail-kicker">SELECT A HOUSE</p>
        <div className="ni-house-picker" role="group" aria-label="Inspect house">{houses.map(h=><button key={h.house} type="button" aria-pressed={selected===h.house} onClick={()=>setSelected(h.house)}>{h.house}</button>)}</div>
        <div className="ni-focus"><span>HOUSE {selected} · {selected===1?"ASCENDANT":selected===7?"DESCENDANT":"FIXED CELL"}</span><strong>{SIGNS[active.signNumber-1]} · Rashi {active.signNumber}</strong>{showCuspDegrees&&<small>Equal cusp {active.cusp.toFixed(2)}° · {mode==="god"?"fixed zero anchor":"local Ascendant anchor"}</small>}
          <p>{active.bodies.length?active.bodies.map(b=>b.planet+(b.isRetrograde?" ℞":"")).join(" · "):"No recorded planets in this house."}</p>
        </div>
        <p className="ni-guide">Houses stay fixed: 1 top, 2 upper-left, 4 left, 7 bottom, 10 right, 12 upper-right. Signs and placements come from the model, not from rotating the diamond.</p>
      </div>
    </div>
    {(invalid.length>0||discrepancies.length>0)&&<details className="ni-audit"><summary>Placement audit · {invalid.length+discrepancies.length} items need review</summary><p>This screen preserves the engine's house numbers. Differences may reflect another coordinate system or an engine inconsistency; they are not corrected by drawing.</p>{invalid.map(x=><p key={x.planet}>{x.planet}: invalid engine house {x.house}</p>)}{discrepancies.map((x,i)=><p key={i}>{x}</p>)}</details>}
    <p className="ni-footer">God: permanent 0° Aries reference. Agent: event-local equal-house anchor. Chart style does not change any prediction method, method weight or verdict.</p>
  </section>;
}
