export type ScheduleSport = "MLB" | "NBA" | "NFL" | "NHL" | "MLS" | "NCAAF" | "NCAAB" | "TENNIS";

export type ScheduledGame = {
  id: string;
  sport: ScheduleSport;
  teamA: string;
  teamB: string;
  venue: string;
  location: string;
  latitude?: number;
  longitude?: number;
  startTime: string;
  status: string;
  source: string;
  favoriteTeam?: string;
  underdogTeam?: string;
  homeMoneyline?: string;
  awayMoneyline?: string;
  oddsProvider?: string;
  oddsStatus: "available" | "unavailable";
  oddsUpdatedAt?: string;
  isLive?: boolean;
  scoreA?: string;
  scoreB?: string;
  period?: string;
};

const venueCoordinates: Record<string, [number, number]> = {
  "Oriole Park at Camden Yards": [39.2839, -76.6217],
  "Yankee Stadium": [40.8296, -73.9262],
  "Fenway Park": [42.3467, -71.0972],
  "Dodger Stadium": [34.0739, -118.2400],
};

function dateKey(date: string) {
  if (!/^\d{4}-\d{2}-\d{2}$/.test(date)) throw new Error("date must use YYYY-MM-DD");
  return date.replaceAll("-", "");
}

function coordinatesFor(venue: string) {
  return venueCoordinates[venue];
}

async function fetchJson(url: string) {
  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), 8_000);
  try {
    const response = await fetch(url, { signal: controller.signal });
    if (!response.ok) throw new Error(`Schedule request failed (${response.status})`);
    return await response.json() as any;
  } finally {
    clearTimeout(timeout);
  }
}

async function mlbSchedule(date: string): Promise<ScheduledGame[]> {
  const payload = await fetchJson(`https://statsapi.mlb.com/api/v1/schedule?sportId=1&date=${date}&hydrate=venue,team`);
  const oddsPayload = await fetchJson(`https://site.api.espn.com/apis/site/v2/sports/baseball/mlb/scoreboard?dates=${dateKey(date)}`).catch(() => ({ events: [] }));
  const oddsByMatchup = new Map<string, any>();
  for (const event of oddsPayload.events ?? []) {
    const competition = event.competitions?.[0];
    const away = competition?.competitors?.find((item: any) => item.homeAway === "away")?.team?.displayName;
    const home = competition?.competitors?.find((item: any) => item.homeAway === "home")?.team?.displayName;
    if (away && home) oddsByMatchup.set(`${away}|${home}`, competition);
  }
  const games = payload.dates?.flatMap((entry: any) => entry.games ?? []) ?? [];
  return games.map((game: any) => {
    const venue = game.venue?.name ?? game.teams?.home?.team?.venue?.name ?? "Venue unavailable";
    const [latitude, longitude] = coordinatesFor(venue) ?? [];
    const away = game.teams.away.team.name;
    const home = game.teams.home.team.name;
    const competition = oddsByMatchup.get(`${away}|${home}`);
    const odds = competition?.odds?.[0];
    const favoriteTeam = odds?.homeTeamOdds?.favorite ? home : odds?.awayTeamOdds?.favorite ? away : undefined;
    const state = game.status?.abstractGameState;
    return {
      id: `mlb-${game.gamePk}`,
      sport: "MLB" as const,
      teamA: away,
      teamB: home,
      venue,
      location: game.teams.home.team.locationName ? `${game.teams.home.team.locationName}, ${game.teams.home.team.parentOrgName ?? "USA"}` : venue,
      ...(latitude !== undefined ? { latitude, longitude } : {}),
      startTime: game.gameDate,
      status: game.status?.detailedState ?? "Scheduled",
      source: "MLB Stats API + ESPN odds",
      favoriteTeam,
      underdogTeam: favoriteTeam ? (favoriteTeam === home ? away : home) : undefined,
      homeMoneyline: odds?.moneyline?.home?.close?.odds,
      awayMoneyline: odds?.moneyline?.away?.close?.odds,
      oddsProvider: odds?.provider?.displayName ?? "ESPN odds feed",
      oddsStatus: favoriteTeam ? "available" : "unavailable",
      ...(favoriteTeam ? { oddsUpdatedAt: new Date().toISOString() } : {}),
      isLive: state === "Live",
      scoreA: String(game.teams.away.score ?? "0"),
      scoreB: String(game.teams.home.score ?? "0"),
      period: game.status?.detailedState ?? "Scheduled",
    };
  });
}

async function espnSchedule(sport: Exclude<ScheduleSport, "MLB" | "TENNIS">, date: string): Promise<ScheduledGame[]> {
  const paths: Record<Exclude<ScheduleSport, "MLB" | "TENNIS">, string> = {
    NBA: "basketball/nba",
    NFL: "football/nfl",
    NHL: "hockey/nhl",
    MLS: "soccer/usa.1",
    NCAAF: "football/college-football",
    NCAAB: "basketball/mens-college-basketball",
  };
  const path = paths[sport];
  const payload = await fetchJson(`https://site.api.espn.com/apis/site/v2/sports/${path}/scoreboard?dates=${dateKey(date)}`);
  return (payload.events ?? []).map((event: any) => {
    const competition = event.competitions?.[0];
    const competitors = competition?.competitors ?? [];
    const away = competitors.find((team: any) => team.homeAway === "away") ?? competitors[1];
    const home = competitors.find((team: any) => team.homeAway === "home") ?? competitors[0];
    const venue = competition?.venue?.fullName ?? "Venue unavailable";
    const city = competition?.venue?.address?.city;
    const state = event.status?.type?.state;
    return {
      id: `${sport.toLowerCase()}-${event.id}`,
      sport,
      teamA: away?.team?.displayName ?? "Away team",
      teamB: home?.team?.displayName ?? "Home team",
      venue,
      location: city ? `${city}, ${competition?.venue?.address?.state ?? "USA"}` : venue,
      startTime: event.date,
      status: event.status?.type?.shortDetail ?? "Scheduled",
      source: "ESPN schedule feed",
      favoriteTeam: competition?.odds?.[0]?.homeTeamOdds?.favorite ? home?.team?.displayName : competition?.odds?.[0]?.awayTeamOdds?.favorite ? away?.team?.displayName : undefined,
      underdogTeam: competition?.odds?.[0]?.homeTeamOdds?.favorite ? away?.team?.displayName : competition?.odds?.[0]?.awayTeamOdds?.favorite ? home?.team?.displayName : undefined,
      homeMoneyline: competition?.odds?.[0]?.moneyline?.home?.close?.odds,
      awayMoneyline: competition?.odds?.[0]?.moneyline?.away?.close?.odds,
      oddsProvider: competition?.odds?.[0]?.provider?.displayName ?? "ESPN odds feed",
      oddsStatus: competition?.odds?.[0]?.homeTeamOdds?.favorite || competition?.odds?.[0]?.awayTeamOdds?.favorite ? "available" : "unavailable",
      ...(competition?.odds?.[0] ? { oddsUpdatedAt: new Date().toISOString() } : {}),
      isLive: state === "in",
      scoreA: away?.score ?? "0",
      scoreB: home?.score ?? "0",
      period: event.status?.type?.shortDetail ?? event.status?.type?.detail ?? "Scheduled",
    };
  });
}

/** ESPN tennis events may be tournament containers. Emit only real two-player
 * competitions, never tournament headings or invented player names. */
export function parseTennisScoreboard(payload: any, tour: "ATP" | "WTA"): ScheduledGame[] {
  const found: ScheduledGame[] = [];
  const seen = new Set<string>();
  const visit = (node: any, parent?: any, depth = 0) => {
    if (!node || typeof node !== "object" || depth > 8) return;
    const context = node.competitors ? node : parent;
    if (Array.isArray(node.competitors) && node.competitors.length === 2) {
      const [first, second] = node.competitors;
      const name = (c: any) => c?.athlete?.displayName ?? c?.team?.displayName ?? c?.displayName ?? c?.athlete?.fullName;
      const left = name(first), right = name(second);
      const date = node.date ?? parent?.date;
      const parsedDate = typeof date === "string" ? new Date(date) : null;
      if (left && right && parsedDate && !Number.isNaN(parsedDate.getTime())) {
        const id = `tennis-${tour.toLowerCase()}-${node.id ?? parent?.id ?? `${left}-${right}-${date}`}`;
        if (!seen.has(id)) {
          seen.add(id);
          const state = node.status?.type?.state ?? parent?.status?.type?.state ?? "pre";
          const venue = node.venue?.fullName ?? parent?.venue?.fullName ?? parent?.name ?? "Tennis venue unavailable";
          const score = (c:any) => c?.score == null ? "—" : String(c.score);
          const eventName = parent?.name ?? parent?.shortName ?? tour;
          found.push({id,sport:"TENNIS",teamA:left,teamB:right,venue,location:venue,
            startTime:parsedDate.toISOString(),status:node.status?.type?.shortDetail ?? parent?.status?.type?.shortDetail ?? "Scheduled",
            source:`ESPN ${tour} tennis scoreboard`,oddsStatus:"unavailable",isLive:state==="in",
            scoreA:score(first),scoreB:score(second),
            period:node.status?.type?.detail ?? `${tour} · ${eventName}`});
        }
      }
    }
    for (const field of ["events","competitions","matches","draws","groups"]) {
      const children = node[field];
      if (Array.isArray(children)) for (const child of children) visit(child,node,depth+1);
    }
  };
  visit(payload);
  return found;
}

async function tennisSchedule(date:string): Promise<ScheduledGame[]> {
  const tours = ["atp","wta"] as const;
  const results = await Promise.allSettled(tours.map(async tour => {
    const payload = await fetchJson(`https://site.api.espn.com/apis/site/v2/sports/tennis/${tour}/scoreboard?dates=${dateKey(date)}`);
    return parseTennisScoreboard(payload,tour.toUpperCase() as "ATP"|"WTA");
  }));
  return results.flatMap(result => result.status==="fulfilled" ? result.value : []);
}

export async function listScheduledGames(date: string, sport: ScheduleSport | "ALL" = "ALL") {
  const sports: ScheduleSport[] = sport === "ALL" ? ["MLB", "NBA", "NFL", "NHL", "MLS", "NCAAF", "NCAAB", "TENNIS"] : [sport];
  const results = await Promise.allSettled(sports.map((item) => item === "MLB" ? mlbSchedule(date) : item === "TENNIS" ? tennisSchedule(date) : espnSchedule(item, date)));
  return results.flatMap((result) => result.status === "fulfilled" ? result.value : []).sort((a, b) => a.startTime.localeCompare(b.startTime));
}

export async function listLiveGames(date: string) {
  const currentDate = new Date(`${date}T12:00:00.000Z`);
  currentDate.setUTCDate(currentDate.getUTCDate() - 1);
  const previousDate = currentDate.toISOString().slice(0, 10);
  const [games, previousGames] = await Promise.all([
    listScheduledGames(date, "ALL"),
    listScheduledGames(previousDate, "ALL"),
  ]);
  const liveGames = [...games, ...previousGames].filter((game) => game.isLive);
  // Keep the rail useful during quiet windows. The UI labels these as Upcoming;
  // they are never treated as live events by the calculation handoff.
  return liveGames.length > 0 ? liveGames : games.slice(0, 12);
}
