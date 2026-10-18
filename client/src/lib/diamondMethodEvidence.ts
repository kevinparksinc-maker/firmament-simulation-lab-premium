/**
 * Method-to-North-Indian chart evidence adapter.
 * The engine remains the only authority for method scores and winners.
 * Named house mentions from a method's provenance can be HIGHLIGHTED, but do
 * not establish a causal or numerical contribution to the calculation.
 * Methods with no explicit house references stay chart-wide instead of being
 * silently restricted to one or two planets / houses.
 */
export type ChartMethodEvidence = {
  name:string; scoreA:number;scoreB:number;winner:"A"|"B"|"TIE";
  source?:string;detail:string;
  calculation?:{formula:string;inputs:string[];steps:string[]};
};
export type ChartMethodMapping = {
  method:ChartMethodEvidence;
  mentionedHouses:number[];
  scope:"referenced-houses"|"chart-wide-or-unresolved";
  hasCalculationTrace:boolean;
};
export function extractReferencedHouses(lines:string[]):number[]{
 const found=new Set<number>();
 for(const line of lines){
  // H7, H12, House 7, house #7. Avoid matching shorthand like H120.
  const regex=/\b(?:H\s*|house\s*#?\s*)(1[0-2]|[1-9])(?!\d)/gi;
  let match:RegExpExecArray|null;
  while((match=regex.exec(line))!==null)found.add(Number(match[1]));
 }
 return Array.from(found).sort((a,b)=>a-b);
}
export function mapMethodsToDiamond(methods:ChartMethodEvidence[]):ChartMethodMapping[]{
 return methods.map(method=>{
  const trace=method.calculation;
  const mentionedHouses=extractReferencedHouses([
    method.detail,
    ...(trace?[trace.formula,...trace.inputs,...trace.steps]:[]),
  ]);
  return {
    method,mentionedHouses,
    scope:mentionedHouses.length?"referenced-houses" as const:"chart-wide-or-unresolved" as const,
    hasCalculationTrace:Boolean(trace),
  };
 });
}
export function countMappedMethods(methods:ChartMethodEvidence[]){
 const mapped=mapMethodsToDiamond(methods);
 return {
  total:mapped.length,
  explicitHouseMentions:mapped.filter(x=>x.scope==="referenced-houses").length,
  chartWideOrUnresolved:mapped.filter(x=>x.scope==="chart-wide-or-unresolved").length,
  traceAvailable:mapped.filter(x=>x.hasCalculationTrace).length,
 };
}
