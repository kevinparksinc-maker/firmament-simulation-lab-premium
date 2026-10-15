import { useMemo, useState } from "react";

import { ArrowLeft, Download, Orbit, Play, RefreshCw, ShieldAlert, Sparkles, Video } from "lucide-react";
import { trpc } from "@/lib/trpc";
import "./DailyStudio.css";

type Sport = "ALL" | "MLB" | "NBA" | "NFL" | "NHL" | "MLS" | "NCAAF" | "NCAAB";
type Game = {
  id: string; sport: Exclude<Sport, "ALL">; teamA: string; teamB: string; location: string;
  latitude?: number; longitude?: number; startTime: string; status: string; source: string;
  favoriteTeam?: string; underdogTeam?: string; oddsStatus: "available" | "unavailable";
  scoreA?: string; scoreB?: string; isLive?: boolean;
};
type ResearchResult = {
  input: { teamA: string; teamB: string; startTime: string; sport: string };
  baseline: { winner: "A" | "B" | "TIE"; combined: { scoreA: number; scoreB: number } };
  godView: { synthesis: { winner: "A" | "B" | "TIE"; scoreA: number; scoreB: number }; allLayers: Array<{name:string;winner:string;scoreA:number;scoreB:number;detail:string}> };
  agentView: { synthesis: { winner: "A" | "B" | "TIE"; scoreA: number; scoreB: number }; allLayers: Array<{name:string;winner:string;scoreA:number;scoreB:number;detail:string}> };
  engine: { calculationPath: string; fixedBackground: string };
  methodResults: { registryVersion: string };
  evaluationFramework: { primaryResearchEligible: boolean };
};
type Entry = {
  fixture: Game; generatedAt: string; roleAssignment: "feed-favorite" | "unassigned";
  eligible: boolean; reason?: string; result?: ResearchResult; error?: string;
};
type BroadcastRecord = {
  format: "firmament-daily-slate-v1"; date: string; createdAt: string; slateId: string;
  lockStatus: "local-export-not-publicly-committed"; scope: Sport; entries: Entry[];
};
function dateLocal() { const now=new Date(); return [now.getFullYear(),String(now.getMonth()+1).padStart(2,"0"),String(now.getDate()).padStart(2,"0")].join("-"); }
function fmt(value: string) { return new Date(value).toLocaleString(undefined,{dateStyle:"medium",timeStyle:"short"}); }
function winner(entry: Entry) {
  const w=entry.result?.baseline.winner;
  if (!w || w==="TIE") return "NO CALL";
  return w==="A" ? entry.result!.input.teamA : entry.result!.input.teamB;
}
function exportFile(name:string, content:string, type:string) {
  const blob=new Blob([content],{type}); const url=URL.createObjectURL(blob);
  const anchor=document.createElement("a"); anchor.href=url; anchor.download=name;
  document.body.appendChild(anchor); anchor.click(); anchor.remove(); window.setTimeout(()=>URL.revokeObjectURL(url),1500);
}
function explanation(entry: Entry) {
  if (!entry.result) return entry.reason ?? entry.error ?? "No calculation available.";
  const r=entry.result, god=r.godView.synthesis, agent=r.agentView.synthesis;
  return [
    "PREGAME MODEL RECORD — experimental, not a probability or betting signal",
    `Predicted winner: ${winner(entry)}. God View: ${god.winner} (A ${god.scoreA.toFixed(2)} / B ${god.scoreB.toFixed(2)}). Agent View: ${agent.winner} (A ${agent.scoreA.toFixed(2)} / B ${agent.scoreB.toFixed(2)}).`,
    `Frame assessment: ${god.winner===agent.winner?"CONVERGENT":"SPLIT / CONFLICTING"}.`,
    `Reference: ${r.engine.fixedBackground}; method registry ${r.methodResults.registryVersion}.`,
    "God View evidence:",
    ...r.godView.allLayers.map(l=>`  ${l.name}: ${l.winner} (A ${l.scoreA.toFixed(2)} / B ${l.scoreB.toFixed(2)}). ${l.detail}`),
    "Agent View evidence:",
    ...r.agentView.allLayers.map(l=>`  ${l.name}: ${l.winner} (A ${l.scoreA.toFixed(2)} / B ${l.scoreB.toFixed(2)}). ${l.detail}`)
  ].join("\n");
}
function script(record:BroadcastRecord) {
  const called=record.entries.filter(e=>e.result && e.eligible && e.result.baseline.winner!=="TIE");
  const omitted=record.entries.length-called.length;
  return [
    "FIRMAMENT DAILY PREGAME OBSERVATORY — RECORDING SCRIPT",
    `Slate: ${record.date} | Generated ${fmt(record.createdAt)} | ${record.entries.length} scheduled fixtures | ${called.length} model calls | ${omitted} uncalled / unevaluable.`,
    "INTRO: Welcome to the Firmament experiment. These forecasts were generated before kickoff using a fixed stellar reference and separate God View and Agent View calculation frames. They are uncalibrated research predictions, not guarantees. Every scored result will be reviewed publicly.",
    ...record.entries.map((e,i)=>[
      `GAME ${i+1}: ${e.fixture.sport} — ${e.fixture.teamA} versus ${e.fixture.teamB}. Start ${fmt(e.fixture.startTime)}.`,
      `MODEL CALL: ${e.eligible?winner(e):"NO PUBLIC CALL"}.`,
      e.result?`God: ${e.result.godView.synthesis.winner} / Agent: ${e.result.agentView.synthesis.winner}. ${e.result.godView.synthesis.winner===e.result.agentView.synthesis.winner?"Frames agree.":"Frames disagree — inspect both."}`:`Excluded: ${e.reason??e.error??"No result"}.`
    ].join("\n")),
    "OUTRO: All games, including abstentions and errors, are listed in the downloadable record. We will return after official final scores to count hits, misses, and exclusions. Check the original timestamped published record, not an edited retrospective.",
    "NOTICE: This locally exported file is NOT an immutable public commitment. Publish it before game start to establish a verifiable external timestamp."
  ].join("\n\n");
}
export default function DailyStudio() {
  const [date,setDate]=useState(dateLocal);
  const [sport,setSport]=useState<Sport>("ALL");
  const [record,setRecord]=useState<BroadcastRecord|null>(null);
  const [working,setWorking]=useState(false);
  const [progress,setProgress]=useState("");
  const [selected,setSelected]=useState<string|null>(null);
  const list=trpc.schedules.list.useQuery({date,sport},{staleTime:30_000,retry:1});
  const simulate=trpc.simulate.event.useMutation();
  const games=(list.data??[]) as Game[];
  const scored=useMemo(()=>record?.entries.filter(e=>e.eligible && e.result && e.result.baseline.winner!=="TIE").length??0,[record]);
  const create=async()=>{
    if(working)return;
    setWorking(true);setRecord(null);
    const now=new Date();
    const entries:Entry[]=[];
    try {
      for(const [index,fixture] of games.entries()){
        setProgress(`Analyzing ${index+1} of ${games.length}: ${fixture.teamA} / ${fixture.teamB}`);
        const startMs=new Date(fixture.startTime).getTime();
        const favorite=fixture.favoriteTeam;
        const underdog=fixture.underdogTeam;
        const recognized=Boolean(favorite && underdog && favorite!==underdog && [fixture.teamA,fixture.teamB].includes(favorite!) && [fixture.teamA,fixture.teamB].includes(underdog!));
        const entry:Entry={fixture,generatedAt:new Date().toISOString(),roleAssignment:recognized?"feed-favorite":"unassigned",eligible:recognized};
        if(!Number.isFinite(startMs)||startMs<=Date.now()){entry.eligible=false;entry.reason="Game already started, or its start time is invalid. Pregame generation withheld.";entries.push(entry);continue;}
        if(!recognized){entry.reason="No verified favorite/underdog roles in the available pregame feed. Excluded from published accuracy.";entries.push(entry);continue;}
        try {
          const result=await simulate.mutateAsync({
            id:fixture.id,teamA:fixture.teamA,teamB:fixture.teamB,favoredTeam:favorite!,underdogTeam:underdog!,roleAssignmentSource:"market-odds",sport:fixture.sport,
            location:fixture.location||"Venue not supplied",startTime:fixture.startTime,
            ...(Number.isFinite(fixture.latitude)&&Number.isFinite(fixture.longitude)?{latitude:fixture.latitude,longitude:fixture.longitude}:{}),
          });
          // Recheck after computation: never record a public pregame call made after start.
          if(Date.now()>=startMs){entry.eligible=false;entry.reason="Calculation finished after scheduled start; excluded from pregame slate.";}
          else entry.result=result as ResearchResult;
        } catch(err){entry.eligible=false;entry.error=err instanceof Error?err.message:"Engine returned an error.";}
        entries.push(entry);
      }
      setRecord({format:"firmament-daily-slate-v1",date,scope:sport,createdAt:now.toISOString(),slateId:`slate-${date}-${now.getTime()}`,lockStatus:"local-export-not-publicly-committed",entries});
      setSelected(entries.find(e=>e.result)?.fixture.id??null);
    }finally{setWorking(false);setProgress("");}
  };
  const actualFor=(e:Entry)=>{
    const game=games.find(g=>g.id===e.fixture.id);
    if(!game || !/final|completed|full time|after penalties/i.test(game.status))return "PENDING";
    const a=Number(game.scoreA), b=Number(game.scoreB);
    if(!Number.isFinite(a)||!Number.isFinite(b))return "PENDING";
    if(!e.eligible||!e.result||e.result.baseline.winner==="TIE")return "UNSCORED";
    if(a===b)return "DRAW / EXCLUSION REVIEW";
    const actual=a>b?e.fixture.teamA:e.fixture.teamB;
    return winner(e)===actual?"HIT":"MISS";
  };
  const selectedEntry=record?.entries.find(e=>e.fixture.id===selected);
  return <div className="broadcast-shell">
    <div className="broadcast-aurora" aria-hidden="true" />
    <header className="broadcast-top"><a className="broadcast-back" href="/"><ArrowLeft size={17}/> Command deck</a><span className="broadcast-wordmark"><Orbit size={19}/> FIRMAMENT <b>/ BROADCAST STUDIO</b></span><span className="broadcast-live"><i/> EXPERIMENTAL · PRE-GAME</span></header>
    <main className="broadcast-content">
      <section className="broadcast-hero"><div><p className="broadcast-eyebrow">CELESTIAL OBSERVATORY / DAILY EXPERIMENTS</p><h1>Tomorrow's results.<br/><em>Today's recorded calls.</em></h1><p>One research slate across the sports calendar. Independent God View and Agent View, complete method testimony, and downloadable YouTube presentation materials.</p></div><div className="broadcast-orbit"><div className="broadcast-orbit-mid"><Orbit size={42}/><strong>2050</strong><span>TRANSPARENT FUTURES</span></div></div></section>
      <section className="broadcast-controls"><label>Event date <input type="date" value={date} disabled={working} onChange={e=>{setDate(e.target.value);setRecord(null);}}/></label><label>Sport <select value={sport} disabled={working} onChange={e=>{setSport(e.target.value as Sport);setRecord(null);}}>{(["ALL","MLB","NBA","NFL","NHL","MLS","NCAAF","NCAAB"] as Sport[]).map(s=><option key={s} value={s}>{s==="ALL"?"ALL SPORTS":s}</option>)}</select></label><button className="broadcast-subtle" disabled={working} onClick={()=>void list.refetch()}><RefreshCw size={16}/> Refresh</button><button className="broadcast-primary" disabled={working||list.isLoading||games.length===0} onClick={()=>void create()}><Play size={16}/>{working?"Calculating…":"Generate pregame slate"}</button></section>
      {progress&&<p className="broadcast-progress" role="status">{progress}</p>}
      {list.isError&&<p className="broadcast-warning">Schedules unavailable: {list.error.message}</p>}
      <div className="broadcast-metrics"><div><span>Scheduled fixtures</span><strong>{games.length}</strong></div><div><span>Eligible predictions</span><strong>{scored}</strong></div><div><span>Abstentions / unscored</span><strong>{record?record.entries.length-scored:"—"}</strong></div><div><span>Publication status</span><strong>{record?"LOCAL DRAFT":"NOT GENERATED"}</strong></div></div>
      <section className="broadcast-grid"><div className="broadcast-panel"><div className="broadcast-panel-head"><div><p className="broadcast-eyebrow">01 / GAME SLATE</p><h2>Today's celestial scoreboard</h2></div><span>{record?"Pregame calculations available":"Awaiting run"}</span></div>
        {games.length===0&&!list.isLoading?<div className="broadcast-empty">No scheduled fixtures found for this day or the providers did not return data.</div>:games.map(game=>{const entry=record?.entries.find(e=>e.fixture.id===game.id);return <button key={game.id} className={`broadcast-fixture ${selected===game.id?"broadcast-selected":""}`} onClick={()=>setSelected(game.id)}><span className="broadcast-fixture-sport">{game.sport}</span><span className="broadcast-fixture-teams"><strong>{game.teamA}</strong><small>vs</small><strong>{game.teamB}</strong><em>{fmt(game.startTime)}</em></span><span className="broadcast-fixture-state">{entry?entry.eligible&&entry.result?winner(entry):"NO CALL":"SCHEDULED"}<small>{entry?actualFor(entry):game.status}</small></span></button>})}
      </div><div className="broadcast-panel broadcast-detail"><div className="broadcast-panel-head"><div><p className="broadcast-eyebrow">02 / CALCULATION PROOF</p><h2>Two frames. One published claim.</h2></div><Sparkles size={21}/></div>{selectedEntry?<><h3>{selectedEntry.fixture.teamA} <span>vs</span> {selectedEntry.fixture.teamB}</h3><p>{selectedEntry.fixture.sport} · {fmt(selectedEntry.fixture.startTime)}</p><div className="broadcast-verdict">{selectedEntry.eligible&&selectedEntry.result?winner(selectedEntry):"NO PUBLIC CALL"}<small>{selectedEntry.eligible?"Uncalibrated model winner — not probability":"Reason: "+(selectedEntry.reason??selectedEntry.error??"No data")}</small></div>{selectedEntry.result&&<><div className="broadcast-frames"><div><span>GOD VIEW</span><b>{selectedEntry.result.godView.synthesis.winner}</b><small>Fixed celestial reference</small></div><div><span>AGENT VIEW</span><b>{selectedEntry.result.agentView.synthesis.winner}</b><small>Event-local calculation</small></div></div><details><summary>View complete method-by-method proof</summary><pre>{explanation(selectedEntry)}</pre></details></>}</>:<div className="broadcast-empty">Generate a slate and select a game to inspect every method.</div>}</div></section>
      {record&&<section className="broadcast-panel broadcast-export"><div><p className="broadcast-eyebrow">03 / YOUTUBE PRODUCTION</p><h2>Publish the record before kickoff.</h2><p>The exports include excluded fixtures and complete model evidence. Files saved to your device are editable and are <strong>not</strong> an immutable public record. Upload the JSON and/or a video with an independent timestamp before games start.</p></div><div className="broadcast-export-buttons"><button onClick={()=>exportFile(`firmament-${date}-evidence.json`,JSON.stringify(record,null,2),"application/json")}><Download size={16}/> Full evidence JSON</button><button onClick={()=>exportFile(`firmament-${date}-youtube-script.txt`,script(record),"text/plain")}><Video size={16}/> YouTube script</button><button onClick={()=>exportFile(`firmament-${date}-results.csv`,["sport,teamA,teamB,gameId,startTime,prediction,scoreStatus,roleSource",...record.entries.map(e=>[e.fixture.sport,e.fixture.teamA,e.fixture.teamB,e.fixture.id,e.fixture.startTime,e.eligible?winner(e):"NO CALL",actualFor(e),e.roleAssignment].map(value=>`"${String(value).replaceAll('"','""')}"`).join(","))].join("\n"),"text/csv")}><Download size={16}/> Results ledger CSV</button></div></section>}
      <p className="broadcast-footnote"><ShieldAlert size={16}/> No betting advice. Unassigned favorites and unavailable calculations remain visible as abstentions. Score reconciliation uses the current schedule feed and requires confirmation of final results. An immutable server-side publication ledger and automated video rendering are future integrations, not part of this first build.</p>
    </main>
  </div>;
}
