import { Activity, Archive, Beaker, BookOpen, Brain, Compass, Database, Layers3, Orbit, Radar, ShieldCheck, Sparkles, Stars } from "lucide-react";
import { Link } from "wouter";

/** Hash navigation keeps the running simulation in memory on the current page. */
function focusLabSection(event: React.MouseEvent<HTMLAnchorElement>, href: string) {
 if (typeof window === "undefined" || window.location.pathname !== "/" || !href.startsWith("/#")) return;
 const hash = href.slice(2);
 const target = document.getElementById(hash);
 if (!target) return;
 event.preventDefault();
 history.replaceState(null, "", href);
 target.scrollIntoView({ behavior: "smooth", block: "start" });
}

/** One real navigation contract for the command deck, daily studio and all research panels. */
const modules = [
 {href:"/",label:"Command Deck",icon:Radar,id:"command"},
 {href:"/#pattern-intelligence",label:"Pattern Intelligence (AI Memory)",icon:Brain,id:"pattern"},
 {href:"/daily",label:"Daily Broadcast Studio",icon:Sparkles,id:"daily"},
 {href:"/#frame-overlays",label:"God / Agent Frames",icon:Compass,id:"frames"},
 {href:"/#method-laboratory",label:"Method Constellation",icon:Stars,id:"constellation"},
 {href:"/#method-ledger",label:"Method Evidence Ledger",icon:Layers3,id:"methods"},
 {href:"/#decision-breakdown",label:"Decision Breakdown",icon:Beaker,id:"breakdown"},
 {href:"/#evidence-archive",label:"Provenance Archive",icon:Database,id:"archive"},
] as const;

export function LabSidebar({active}:{active:"command"|"daily"|"pattern"}) {
 return <aside className="obs-sidebar lab-shared-sidebar" aria-label="Firmament simulation lab navigation">
  <Link href="/" className="obs-brand lab-brand-link"><span className="brand-seal"><Orbit size={23}/></span><span><strong>FIRMAMENT</strong><span>CELESTIAL SPORTS LAB</span></span></Link>
  <nav className="sidebar-section lab-navigation" aria-label="Laboratory modules">
    <span>THE OBSERVATORY</span>
    {modules.map(({href,label,icon:Icon,id})=><a key={href} href={href} onClick={event=>focusLabSection(event,href)}
      aria-current={id===active?"page":undefined} className={id===active?"lab-nav-active":""}>
      <Icon size={17} aria-hidden="true"/>{label}
    </a>)}
  </nav>
  <div className="sidebar-section lab-system-channels">
   <span>RESEARCH SYSTEM</span>
   <div className="system-line"><i/><div><b>AI Pattern Memory</b><small>Mined formulas &amp; upset traps</small></div></div>
   <div className="system-line"><i/><div><b>Fixed background</b><small>God View · 0° Aries</small></div></div>
   <div className="system-line"><i/><div><b>Local perspective</b><small>Agent View · Event horizon</small></div></div>
   <div className="system-line"><i/><div><b>Calculation evidence</b><small>Every method remains inspectable</small></div></div>
  </div>
  <div className="sidebar-rule"><ShieldCheck size={16}/><p>Experimental symbolic research. Model calls are not verified probabilities or wagering advice.</p></div>
 </aside>;
}

/** Mobile-safe module links never depend on an invisible desktop sidebar. */
export function LabMobileNav({active}:{active:"command"|"daily"|"pattern"}) {
 return <nav className="lab-mobile-nav" aria-label="Mobile research navigation">
  <Link href="/" aria-current={active==="command"?"page":undefined}><Radar size={16}/> Command</Link>
  <a href="/#pattern-intelligence" onClick={event=>focusLabSection(event,"/#pattern-intelligence")}><Brain size={16}/> Patterns</a>
  <Link href="/daily" aria-current={active==="daily"?"page":undefined}><Sparkles size={16}/> Studio</Link>
  <a href="/#frame-overlays" onClick={event=>focusLabSection(event,"/#frame-overlays")}><Compass size={16}/> Frames</a>
  <a href="/#method-ledger" onClick={event=>focusLabSection(event,"/#method-ledger")}><BookOpen size={16}/> Evidence</a>
  <a href="/#evidence-archive" onClick={event=>focusLabSection(event,"/#evidence-archive")}><Archive size={16}/> Sources</a>
 </nav>;
}
