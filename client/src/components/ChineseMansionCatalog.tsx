import { useState } from "react";
import { CHINESE_J2000_MANSIONS,CHINESE_J2000_MANSION_WARNINGS } from "../../../shared/chineseMansionJ2000Stars";
import {
  CHINESE_MANSION_CATALOG, CHINESE_MANSION_QUADRANTS,
  CHINESE_MANSION_VERSION,
} from "../../../shared/chineseMansions";

/** Shows the complete real determinative-star roster alongside the live
 * wheel without claiming that unevaluated HIP right ascensions are known.
 * This remains independent of all Vedic/Arabic/decans/sports scores.
 */
export function ChineseMansionCatalog() {
  const [expanded,setExpanded]=useState(false);
  return <section className="mt-3 rounded-xl border border-fuchsia-400/20 bg-black/30 p-3 text-slate-100" aria-label="Chinese twenty-eight lunar mansions">
    <div className="flex items-center justify-between gap-2">
      <div>
        <p className="text-xs font-bold text-fuchsia-200">Chinese 28 Xiù · determinative-star framework</p>
        <p className="text-[11px] text-slate-400">Four directional palaces · seven mansions each · unequal actual star-based widths</p>
      </div>
      <button className="rounded-md border border-fuchsia-300/30 px-2 py-1 text-xs text-fuchsia-200" onClick={()=>setExpanded(v=>!v)}>
        {expanded ? "Hide 28" : "View all 28"}
      </button>
    </div>
    <p className="mt-2 text-[11px] text-amber-200">
      28 determinative stars calibrated from the Yale Bright Star Catalog J2000 equatorial positions. The pink marks on the circular wheel use their UNEQUAL reference-star right ascensions, never 28 equal slices. The local Ascendant clock's frame reconciliation remains under audit.
    </p>
    {expanded && <div className="mt-3 grid gap-3 sm:grid-cols-2">
      {CHINESE_MANSION_QUADRANTS.map((region,index)=><div key={region.name} className="rounded-lg border border-white/10 p-2">
        <p className="text-xs font-semibold">{region.name} · {region.direction} · {region.phase}</p>
        <div className="mt-2 space-y-1">
          {CHINESE_MANSION_CATALOG.slice(index*7,index*7+7).map((m,i)=><p key={m[3]} className="text-[11px] text-slate-300">
            <span className="text-fuchsia-200">{index*7+i+1}. {m[1]} {m[0]}</span> — {m[2]} · HIP {m[3]} · RA {CHINESE_J2000_MANSIONS.find(x=>x.hip===m[3])?.startRa.toFixed(4)}°
          </p>)}
        </div>
      </div>)}
    </div>}
    {CHINESE_J2000_MANSION_WARNINGS.length>0 && <p className="mt-2 text-xs text-amber-200">{CHINESE_J2000_MANSION_WARNINGS.join(" ")}</p>}
    <p className="mt-2 text-[9px] text-slate-500">{CHINESE_MANSION_VERSION} · J2000 reference overlay only; no sports scores or interpretations added</p>
  </section>;
}
