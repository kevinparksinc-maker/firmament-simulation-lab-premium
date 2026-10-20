export type SynthesisSide = "A" | "B" | "TIE";
export type FrameMethod = { name: string; scoreA: number; scoreB: number; winner?: SynthesisSide };
export type SynthesizedMethod = { name: string; scoreA: number; scoreB: number; winner: SynthesisSide; godScoreA:number; godScoreB:number; agentScoreA:number; agentScoreB:number; formula:string };
export type SynthesisPrediction = { version: "CROSS_FRAME_SYNTHESIS_V1"; scoreA:number; scoreB:number; margin:number; winner:SynthesisSide; methods:SynthesizedMethod[]; formula:string; valid:boolean; reason:string };
const round=(x:number)=>Math.round(x*100)/100;
const winner=(a:number,b:number,threshold=0):SynthesisSide=>Math.abs(a-b)<threshold || a===b?"TIE":a>b?"A":"B";

/** Standalone deterministic predictive output: exactly one joint score per matched method.
 * This does not use historical outcomes or tune weights. God and Agent are
 * correlated observations of one sky, so 50/50 blending is a hypothesis.
 */
export function synthesizeFramePredictions(god:readonly FrameMethod[],agent:readonly FrameMethod[],parityValid:boolean):SynthesisPrediction{
 const byAgent=new Map(agent.map(x=>[x.name,x]));
 const valid=parityValid && god.length===21 && agent.length===21 && new Set(god.map(x=>x.name)).size===21 && new Set(agent.map(x=>x.name)).size===21 && god.every(x=>byAgent.has(x.name));
 const methods: SynthesizedMethod[]=valid?god.map(g=>{
  const a=byAgent.get(g.name)!;
  const scoreA=round((g.scoreA+a.scoreA)/2),scoreB=round((g.scoreB+a.scoreB)/2);
  return {name:g.name,scoreA,scoreB,winner:winner(scoreA,scoreB),godScoreA:g.scoreA,godScoreB:g.scoreB,agentScoreA:a.scoreA,agentScoreB:a.scoreB,formula:"Synthesis A/B = 0.5 × God A/B + 0.5 × Agent A/B"};
 }):[];
 const scoreA=round(methods.reduce((t,m)=>t+m.scoreA,0)),scoreB=round(methods.reduce((t,m)=>t+m.scoreB,0));
 return {version:"CROSS_FRAME_SYNTHESIS_V1",scoreA,scoreB,margin:round(Math.abs(scoreA-scoreB)),winner:valid?winner(scoreA,scoreB,1.5):"TIE",methods,valid,reason:valid?"Matched all 21 methods with equal fixed coefficients in both frames.":"Invalid parity, missing method, or unexpected method count. Prediction withheld.",formula:"Each of 21 synthesis methods averages matching God and Agent A/B scores equally; sum the 21 outputs; differential below 1.5 is a tie."};
}
