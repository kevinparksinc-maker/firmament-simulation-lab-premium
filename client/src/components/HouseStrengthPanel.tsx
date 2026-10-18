import type { HouseStrengthAudit } from "../../../server/engine/houseStrengthAudit";

const fmt=(number:number)=>number.toFixed(3);
function FrameAudit({label,audit,teamA,teamB}:{label:string;audit:HouseStrengthAudit;teamA:string;teamB:string}) {
 return <article className="hs-frame">
  <div className="hs-frame-head"><strong>{label}</strong><span>ACTIVATION ONLY · NOT THE MODEL PICK</span></div>
  <div className="hs-score"><div><small>ASC HOUSE FAMILY · {teamA}</small><strong>{fmt(audit.scoreA)}</strong></div><div><small>DSC HOUSE FAMILY · {teamB}</small><strong>{fmt(audit.scoreB)}</strong></div></div>
  <p className="hs-key">Experimental activation lean: <strong>{audit.hypotheticalLeader==="TIE"?"balanced":audit.hypotheticalLeader==="A"?teamA:teamB}</strong>. This result does not alter any existing verdict.</p>
  <div className="hs-houses" aria-label={label+" house strengths"}>
   {audit.houseTotals.map(h=><div key={h.house} title={`House ${h.house} · ${h.class} · factor ${h.weight} · ${h.planets.join(", ")||"no planets"}`}>
    <span>H{h.house} · {h.family}</span><strong>{fmt(h.score)}</strong><small>{Math.round(h.weight*100)}% {h.class}</small>
   </div>)}
  </div>
  <details className="hs-details"><summary>Inspect every planetary contribution</summary>
    {audit.planetEvidence.length===0?<p>No valid planet placements provided.</p>:<div className="hs-ledger">
      {audit.planetEvidence.map((row,i)=><div key={row.planet+"-"+i}>
       <div><strong>{row.planet} · H{row.house} ({row.family})</strong><span>{fmt(row.weightedContribution)} capped units</span></div>
       <small>{row.longitude.toFixed(4)}° · House strength {Math.round(row.houseWeight*100)}% × Degree strength {Math.round(row.degreeWeight*100)}%</small>
       <small>Arabic Manzil {row.manzil.index}: {row.manzil.name} ({row.manzil.degreeInto}° in sector) · Nakshatra {row.nakshatra.index}: {row.nakshatra.name} · {row.decan.name} of {row.decan.sign}</small>
       {row.chosenContact?<small>Single strongest relationship: {row.chosenContact.kind} {row.chosenContact.target}, {row.chosenContact.angle}°, orb {row.chosenContact.orb.toFixed(3)}°</small>:<small>No eligible angular contact within the configured 5° orb.</small>}
      </div>)}
    </div>}
  </details>
 </article>;
}
export function HouseStrengthPanel({god,agent,teamA,teamB}:{god:HouseStrengthAudit;agent:HouseStrengthAudit;teamA:string;teamB:string}){
 return <section className="hs-panel" id="house-strength-audit" aria-label="Experimental North Indian house strength investigation">
  <div className="hs-heading"><div><p className="eyebrow">NORTH INDIAN RESEARCH · CAPPED HOUSE ACTIVATION</p><h2>What changes when the houses carry weight?</h2><p>Same calculated planetary placements, two frames. House class × one strongest degree contact per planet. Every step is inspectable and the original 42-method engine is unchanged.</p></div><span className="hs-status">EXPERIMENTAL · READ ONLY</span></div>
  <div className="hs-frames"><FrameAudit label="God View · Permanent Aries Zero" audit={god} teamA={teamA} teamB={teamB}/><FrameAudit label="Agent View · Local Event" audit={agent} teamA={teamA} teamB={teamB}/></div>
  <details className="hs-methodology"><summary>Read the scoring rule and its limitations</summary>
    <p>Angular Houses 1/4/7/10: 100%. Succedent Houses 2/5/8/11: 80%. Cadent Houses 3/6/9/12: 60%. These are <strong>proposed experimental strength multipliers</strong>—not universal traditional values.</p>
    <p>Aspect strength by exact orb: ≤1° 100%, ≤2° 80%, ≤3° 60%, ≤5° 40%, beyond 5° zero. Includes actual planetary contacts and named mansion, Nakshatra, and decan <em>centers</em> as geometric research references.</p>
    <p><strong>No double counting:</strong> A planet contributes a maximum of one capped house × degree product. The relationship closest to an eligible configured aspect is used only once. Reference centers are not physical planets or classical Vedic graha aspects.</p>
    <p><strong>No prediction override:</strong> This is an activation measure, not an outcome probability. All 42 original method scores, house-family assignments, sportsbook team roles, and final selections remain exactly as they were.</p>
  </details>
 </section>;
}
