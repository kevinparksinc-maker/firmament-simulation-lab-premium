import { SPORTS_VENUES } from "../shared/sportsVenues";
import { SCOREBOARD_SPORTS, type ScheduleSport } from "../shared/scoreboard";
export type { ScheduleSport } from "../shared/scoreboard";

type GameState = "live" | "scheduled" | "final" | "inactive";

function gameState(state?: string, status = ""): GameState {
  if (/postpon|cancel|suspend|abandon|forfeit|delayed/i.test(status)) return "inactive";
  if (state === "in" || state === "Live") return "live";
  if (state === "post" || state === "Final") return "final";
  if (state === "pre" || state === "Preview") return "scheduled";
  return "inactive";
}

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
  state: GameState;
  timeConfirmed?: boolean;
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

export function coordinatesFor(venue: string) {
  if (venueCoordinates[venue]) return venueCoordinates[venue];
  const normalize = (value: string) => value.toLowerCase().replace(/[^a-z0-9]/g, "");
  const key = normalize(venue);
  if (!key) return undefined;
  const known = SPORTS_VENUES.find(item => normalize(item.name) === key || normalize(item.name.split(" (")[0]) === key || key.includes(normalize(item.name.split(" (")[0])) || item.alias?.some(alias => normalize(alias) === key));
  return known ? [known.latitude, known.longitude] as [number,number] : undefined;
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
  const games = payload.dates?.flatMap((entry: any) => entry.games ?? []) ?? [];
  if (games.length === 0) return [];
  const oddsPayload = await fetchJson(`https://site.api.espn.com/apis/site/v2/sports/baseball/mlb/scoreboard?dates=${dateKey(date)}`).catch(() => ({ events: [] }));
  const oddsByMatchup = new Map<string, any>();
  for (const event of oddsPayload.events ?? []) {
    const competition = event.competitions?.[0];
    const away = competition?.competitors?.find((item: any) => item.homeAway === "away")?.team?.displayName;
    const home = competition?.competitors?.find((item: any) => item.homeAway === "home")?.team?.displayName;
    if (away && home) oddsByMatchup.set(`${away}|${home}`, competition);
  }
  return games.map((game: any) => {
    const venue = game.venue?.name ?? game.teams?.home?.team?.venue?.name ?? "Venue unavailable";
    const [latitude, longitude] = coordinatesFor(venue) ?? [];
    const away = game.teams.away.team.name;
    const home = game.teams.home.team.name;
    const competition = oddsByMatchup.get(`${away}|${home}`);
    const odds = competition?.odds?.[0];
    const favoriteTeam = odds?.homeTeamOdds?.favorite ? home : odds?.awayTeamOdds?.favorite ? away : undefined;
    const status = game.status?.detailedState ?? "Status unavailable";
    const state = gameState(game.status?.abstractGameState, status);
    return {
      id: `mlb-${game.gamePk}`,
      sport: "MLB" as const,
      teamA: away,
      teamB: home,
      venue,
      location: game.teams.home.team.locationName ? `${game.teams.home.team.locationName}, ${game.teams.home.team.parentOrgName ?? "USA"}` : venue,
      ...(latitude !== undefined ? { latitude, longitude } : {}),
      startTime: game.gameDate,
      status,
      state,
      timeConfirmed: game.status?.startTimeTBD !== true,
      source: "MLB Stats API + ESPN odds",
      favoriteTeam,
      underdogTeam: favoriteTeam ? (favoriteTeam === home ? away : home) : undefined,
      homeMoneyline: odds?.moneyline?.home?.close?.odds,
      awayMoneyline: odds?.moneyline?.away?.close?.odds,
      oddsProvider: odds?.provider?.displayName ?? "ESPN odds feed",
      oddsStatus: favoriteTeam ? "available" : "unavailable",
      ...(favoriteTeam ? { oddsUpdatedAt: new Date().toISOString() } : {}),
      isLive: state === "live",
      scoreA: game.teams.away.score?.toString(),
      scoreB: game.teams.home.score?.toString(),
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
  // ESPN's default college scoreboards can omit games outside the ranked slate.
  const group = sport === "NCAAB" ? "&groups=50&limit=1000" : sport === "NCAAF" ? "&groups=80&limit=1000" : "";
  const payload = await fetchJson(`https://site.api.espn.com/apis/site/v2/sports/${path}/scoreboard?dates=${dateKey(date)}${group}`);
  return (payload.events ?? []).flatMap((event: any): ScheduledGame | [] => {
    const competition = event.competitions?.[0];
    const competitors = competition?.competitors ?? [];
    const away = competitors.find((team: any) => team.homeAway === "away") ?? competitors[1];
    const home = competitors.find((team: any) => team.homeAway === "home") ?? competitors[0];
    const venue = competition?.venue?.fullName ?? "Venue unavailable";
    const city = competition?.venue?.address?.city;
    const type = competition?.status?.type ?? event.status?.type;
    const status = type?.shortDetail ?? type?.description ?? "Status unavailable";
    const state = gameState(type?.state, [type?.name, status].join(" "));
    const start = new Date(competition?.date ?? event.date);
    const teamA = away?.team?.displayName;
    const teamB = home?.team?.displayName;
    if (!teamA || !teamB || !Number.isFinite(start.getTime())) return [];
    const odds = competition?.odds?.[0];
    const favoriteTeam = odds?.homeTeamOdds?.favorite === true ? teamB : odds?.awayTeamOdds?.favorite === true ? teamA : undefined;
    const coordinates = coordinatesFor(venue);
    return {
      id: `${sport.toLowerCase()}-${event.id}`,
      sport,
      teamA,
      teamB,
      venue,
      location: city ? [city, competition?.venue?.address?.state ?? competition?.venue?.address?.country].filter(Boolean).join(", ") : venue,
      startTime: start.toISOString(),
      status,
      state,
      timeConfirmed: competition?.timeValid !== false,
      source: "ESPN schedule feed",
      ...(coordinates ? {latitude:coordinates[0],longitude:coordinates[1]} : {}),
      favoriteTeam,
      underdogTeam: favoriteTeam ? (favoriteTeam === teamB ? teamA : teamB) : undefined,
      homeMoneyline: odds?.moneyline?.home?.close?.odds,
      awayMoneyline: odds?.moneyline?.away?.close?.odds,
      oddsProvider: odds?.provider?.displayName ?? odds?.provider?.name ?? "ESPN odds feed",
      oddsStatus: favoriteTeam ? "available" : "unavailable",
      ...(odds ? { oddsUpdatedAt: new Date().toISOString() } : {}),
      isLive: state === "live",
      scoreA: away?.score?.toString(),
      scoreB: home?.score?.toString(),
      period: type?.shortDetail ?? type?.detail,
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
          const type = node.status?.type;
          const status = type?.shortDetail ?? type?.description ?? "Status unavailable";
          const state = gameState(type?.state, [type?.name, status].join(" "));
          const venue = node.venue?.fullName ?? parent?.venue?.fullName ?? parent?.name ?? "Tennis venue unavailable";
          const score = (competitor: any) => {
            if (competitor?.score != null) return String(competitor.score);
            const sets = (competitor?.linescores ?? []).flatMap((set: any) =>
              Number.isFinite(set.value) ? [String(set.value)] : []);
            return sets.length > 0 ? sets.join(" ") : undefined;
          };
          const eventName = parent?.name ?? parent?.shortName ?? tour;
          found.push({id,sport:"TENNIS",teamA:left,teamB:right,venue,location:venue,
            startTime:parsedDate.toISOString(),status,state,timeConfirmed:node.timeValid !== false,
            source:`ESPN ${tour} tennis scoreboard`,oddsStatus:"unavailable",isLive:state==="live",
            scoreA:score(first),scoreB:score(second),
            period:type?.shortDetail ?? type?.detail ?? `${tour} · ${eventName}`});
        }
      }
    }
    for (const field of ["events","competitions","matches","draws","groups","groupings"]) {
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
  if (results.every(result => result.status === "rejected")) throw new Error("Tennis feeds unavailable");
  return results.flatMap(result => result.status==="fulfilled" ? result.value : []);
}

function scheduleForSport(sport: ScheduleSport, date: string) {
  if (sport === "MLB") return mlbSchedule(date);
  if (sport === "TENNIS") return tennisSchedule(date);
  return espnSchedule(sport, date);
}

export async function listScheduledGames(date: string, sport: ScheduleSport | "ALL" = "ALL") {
  const sports = sport === "ALL" ? SCOREBOARD_SPORTS : [sport];
  const results = await Promise.allSettled(sports.map(item => scheduleForSport(item, date)));
  if (results.every(result => result.status === "rejected")) throw new Error("SCHEDULE_FEED_UNAVAILABLE: The schedule provider could not be reached. Refresh or enter the matchup manually.");
  return results.flatMap(result => result.status === "fulfilled" ? result.value : []).sort((a, b) => a.startTime.localeCompare(b.startTime));
}

const scoreboardCache = new Map<string, { expiresAt: number; games: Promise<ScheduledGame[]> }>();

function cachedScoreboard(sport: ScheduleSport, date: string) {
  const key = `${sport}:${date}`;
  const now = Date.now();
  const cached = scoreboardCache.get(key);
  if (cached && cached.expiresAt > now) return cached.games;

  scoreboardCache.forEach((entry, entryKey) => {
    if (entry.expiresAt <= now) scoreboardCache.delete(entryKey);
  });
  if (scoreboardCache.size >= 96) {
    const oldest = scoreboardCache.keys().next().value;
    if (oldest) scoreboardCache.delete(oldest);
  }
  const games = scheduleForSport(sport, date).catch(error => {
    if (scoreboardCache.get(key)?.games === games) scoreboardCache.delete(key);
    throw error;
  });
  scoreboardCache.set(key, { games, expiresAt: now + 25_000 });
  return games;
}

function adjacentDates(date: string) {
  return [-1, 0, 1].map(offset => {
    const day = new Date(`${date}T12:00:00Z`);
    day.setUTCDate(day.getUTCDate() + offset);
    return day.toISOString().slice(0, 10);
  });
}

export async function listScoreboard(date: string, sport: ScheduleSport | "ALL", timeZone: string) {
  const formatDate = new Intl.DateTimeFormat("en-US", { year: "numeric", month: "2-digit", day: "2-digit", timeZone });
  const [year, month, day] = date.split("-");
  const localDate = `${month}/${day}/${year}`;
  const sports = sport === "ALL" ? SCOREBOARD_SPORTS : [sport];
  const dates = adjacentDates(date);
  const unavailable = new Set<ScheduleSport>();
  const fixtures = new Map<string, ScheduledGame>();
  await Promise.all(sports.map(async item => {
    const results = await Promise.allSettled(dates.map(day => cachedScoreboard(item, day)));
    if (results.some(result => result.status === "rejected")) unavailable.add(item);
    // Prefer the requested date's record when feeds overlap.
    for (const index of [0, 2, 1]) {
      const result = results[index];
      if (result.status === "fulfilled") {
        for (const game of result.value) fixtures.set(game.id, game);
      }
    }
  }));

  const games = Array.from(fixtures.values()).sort((a, b) => a.startTime.localeCompare(b.startTime));
  const now = new Date();
  return {
    live: formatDate.format(now) === localDate ? games.filter(game => game.state === "live") : [],
    upcoming: games.filter(game => game.state === "scheduled" && formatDate.format(new Date(game.startTime)) === localDate &&
      (game.timeConfirmed === false || Date.parse(game.startTime) > now.getTime())),
    unavailableSports: sports.filter(item => unavailable.has(item)),
    updatedAt: now.toISOString(),
  };
}

export async function listLiveGames(date: string) {
  const [previousDate] = adjacentDates(date);
  const [games, previousGames] = await Promise.all([
    listScheduledGames(date, "ALL"),
    listScheduledGames(previousDate, "ALL"),
  ]);
  const unique = new Map([...previousGames, ...games].map(game => [game.id, game]));
  return Array.from(unique.values()).filter(game => game.isLive);
}
