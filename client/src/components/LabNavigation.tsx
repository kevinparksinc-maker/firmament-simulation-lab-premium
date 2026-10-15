import { Activity, Archive, Beaker, BookOpen, Compass, Database, Layers3, Orbit, Radar, ShieldCheck, Sparkles, Stars } from "lucide-react";
import { Link } from "wouter";

/** One real navigation contract for the command deck, daily studio and all research panels. */
const modules = [
 {href:"/",label:"Command Deck",icon:Radar,id:"command"},
 {href:"/daily",label:"Daily Broadcast Studio",icon:Sparkles,id:"daily"},
 {href:"/#frames",label:"God / Agent Frames",icon:Compass,id:"frames"},
 {href:"/#method-constellation",label:"Method Constellation",icon:Stars,id:"constellation"},
 {href:"/#method-ledger",label:"Method Evidence Ledger",icon:Layers3,id:"methods"},
 {href:"/#calculation-proof",label:"Calculation Proof",icon:Beaker,id:"proof"},
 {href:"/#provenance",label:"Provenance Archive",icon:Database,id:"archive"},
] as const;

export function LabSidebar({active}:{active:"command"|"daily"}) {
 return <aside className="obs-sidebar lab-shared-sidebar" aria-label="Firmament simulation lab navigation">
  <Link href="/" className="obs-brand lab-brand-link"><span className="brand-seal"><Orbit size={23}/></span><span><strong>FIRMAMENT</strong><span>CELESTIAL SPORTS LAB</span></span></Link>
  <nav className="sidebar-section lab-navigation" aria-label="Laboratory modules">
    <span>THE OBSERVATORY</span>
    {modules.map(({href,label,icon:Icon,id})=><Link key={href} href={href}
      aria-current={id===active?"page":undefined} className={id===active?"lab-nav-active":""}>
      <Icon size={17} aria-hidden="true"/>{label}
    </Link>)}
  </nav>
  <div className="sidebar-section lab-system-channels">
   <span>RESEARCH SYSTEM</span>
   <div className="system-line"><i/><div><b>Fixed background</b><small>God View · 0° Aries</small></div></div>
   <div className="system-line"><i/><div><b>Local perspective</b><small>Agent View · Event horizon</small></div></div>
   <div className="system-line"><i/><div><b>Calculation evidence</b><small>Every method remains inspectable</small></div></div>
  </div>
  <div className="sidebar-rule"><ShieldCheck size={16}/><p>Experimental symbolic research. Model calls are not verified probabilities or wagering advice.</p></div>
 </aside>;
}

/** Mobile-safe module links never depend on an invisible desktop sidebar. */
export function LabMobileNav({active}:{active:"command"|"daily"}) {
 return <nav className="lab-mobile-nav" aria-label="Mobile research navigation">
  <Link href="/" aria-current={active==="command"?"page":undefined}><Radar size={16}/> Command Deck</Link>
  <Link href="/daily" aria-current={active==="daily"?"page":undefined}><Sparkles size={16}/> Daily Studio</Link>
  <Link href="/#frames"><Compass size={16}/> Frames</Link>
  <Link href="/#method-ledger"><BookOpen size={16}/> Evidence</Link>
  <Link href="/#provenance"><Archive size={16}/> Sources</Link>
 </nav>;
}
