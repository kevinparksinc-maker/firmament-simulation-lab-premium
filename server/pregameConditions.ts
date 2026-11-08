import type { SimulationEventInput } from "./engine/simulationAdapter";

export type PregameConditions = {
  checkedAt:string; source:string|null; status:"provider-reported"|"not-verified";
  weather:string|null; injuries:Array<{team:string;player:string;status:string}>;
  severeWeather:boolean; availabilityStatus:"provider-reported-incomplete"|"not-verified";
  notes:string[];
};
/** Pregame-only external context. A missing report never means clear weather or a healthy roster. */
export async function getPregameConditions(input:SimulationEventInput):Promise<PregameConditions> {
  const result:PregameConditions={checkedAt:new Date().toISOString(),source:null,status:"not-verified",weather:null,injuries:[],severeWeather:false,availabilityStatus:"not-verified",notes:[]};
  const id=input.id?.match(/^(?:live-)?nfl-(\d+)$/)?.[1];
  if(input.sport!=="NFL" || !id) {result.notes.push("No linked NFL schedule event. Weather and player availability NOT VERIFIED.");return result;}
  if(Date.now()>=Date.parse(input.startTime)) {result.notes.push("Historical/live replay: current weather or roster reports are excluded from pregame evidence.");return result;}
  const url=`https://site.api.espn.com/apis/site/v2/sports/football/nfl/summary?event=${id}`;
  try {
    const response=await fetch(url,{signal:AbortSignal.timeout(8000)});
    if(!response.ok) throw new Error(`HTTP ${response.status}`);
    const data=await response.json() as any;
    const competition=data.header?.competitions?.[0];
    const teams=(competition?.competitors??[]).map((item:any)=>item.team?.displayName);
    if(!teams.includes(input.teamA) || !teams.includes(input.teamB) || Date.parse(competition?.date)!==Date.parse(input.startTime)) throw new Error("Provider matchup or kickoff does not match the calculated event");
    // Do not carry scores, winners, game plays, or odds movements into this evidence.
    const weather=data.gameInfo?.weather;
    if(typeof weather?.displayValue==="string" && weather.displayValue.trim()) {
      result.weather=weather.displayValue.trim();
      if(Number.isFinite(weather.temperature)) result.weather+=` · ${weather.temperature}°F`;
      result.severeWeather=/thunder|storm|heavy rain|blizzard|tornado|hurricane/i.test(result.weather ?? "");
      result.status="provider-reported";
    }
    for(const group of data.injuries??[]) for(const item of group.injuries??[]) {
      const player=item.athlete?.displayName,team=group.team?.displayName,status=item.status;
      if(typeof player==="string" && typeof status==="string" && teams.includes(team)) result.injuries.push({team,player,status});
    }
    if(result.injuries.length) result.availabilityStatus="provider-reported-incomplete";
    result.source=url;
    result.notes.push(result.weather ? "Provider game-weather summary; wind, rain intensity, roof status and field conditions require separate confirmation." : "Weather NOT VERIFIED: provider supplied no usable forecast.");
    result.notes.push(result.injuries.length ? "Reported injuries may be incomplete; this is not an official final inactive list. Confirm important player availability before kickoff." : "Player availability NOT VERIFIED: absence of an injury report does not establish a healthy roster.");
    if(result.severeWeather) result.notes.push("SEVERE WEATHER: NO-BET research flag. Preserve the chart reading and explain the disruption risk.");
  } catch(error) {result.notes.push(`Pregame condition feed unavailable: ${error instanceof Error?error.message:"request failed"}. Weather and player availability NOT VERIFIED.`);}
  return result;
}
