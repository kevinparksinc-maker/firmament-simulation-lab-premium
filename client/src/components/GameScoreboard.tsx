import { useState } from "react";
import { ChevronRight, LoaderCircle, RefreshCw } from "lucide-react";
import type { ScheduledGame } from "../../../server/schedules";
import { SCOREBOARD_LABELS, SCOREBOARD_SPORTS, type ScoreboardSport } from "../../../shared/scoreboard";
import { trpc } from "@/lib/trpc";
import "./GameScoreboard.css";

export type VenueCoordinates = { latitude: number; longitude: number };
type Props = {
  pendingId: string | null;
  disabled: boolean;
  onRead: (game: ScheduledGame, coordinates?: VenueCoordinates) => Promise<void>;
};

const timeZone = Intl.DateTimeFormat().resolvedOptions().timeZone;
const clock = new Intl.DateTimeFormat(undefined, { hour: "numeric", minute: "2-digit", timeZoneName: "short" });

function localDate(offset = 0) {
  const day = new Date();
  day.setDate(day.getDate() + offset);
  return `${day.getFullYear()}-${String(day.getMonth() + 1).padStart(2, "0")}-${String(day.getDate()).padStart(2, "0")}`;
}

function GameCard({ game, busy, disabled, onRead }: {
  game: ScheduledGame;
  busy: boolean;
  disabled: boolean;
  onRead: Props["onRead"];
}) {
  const [showCoordinates, setShowCoordinates] = useState(false);
  const live = game.state === "live";
  const timeConfirmed = game.timeConfirmed !== false;
  const needsCoordinates = game.latitude === undefined || game.longitude === undefined;

  return <article className="scoreboard-card">
    <div className="scoreboard-card-top">
      <span>{SCOREBOARD_LABELS[game.sport]}</span>
      <span className={live ? "scoreboard-in-play" : ""}>
        {live ? `Live · ${game.period ?? game.status}` : timeConfirmed ? clock.format(new Date(game.startTime)) : "Time TBD"}
      </span>
    </div>
    <div className="scoreboard-teams">
      <div><strong>{game.teamA}</strong>{live && <b>{game.scoreA ?? "—"}</b>}</div>
      <div><strong>{game.teamB}</strong>{live && <b>{game.scoreB ?? "—"}</b>}</div>
    </div>
    <p className="scoreboard-venue">{game.venue === game.location ? game.venue : `${game.venue} · ${game.location}`}</p>
    {timeConfirmed ? <button type="button" className="scoreboard-read" disabled={disabled}
      aria-label={`Game read for ${game.teamA} vs ${game.teamB}`}
      aria-expanded={needsCoordinates ? showCoordinates : undefined}
      onClick={() => needsCoordinates ? setShowCoordinates(value => !value) : void onRead(game)}>
      {busy ? "Calculating…" : "Game read"} {busy ? <LoaderCircle size={15} className="spin" /> : <ChevronRight size={15} />}
    </button> : <p className="scoreboard-venue">Game read available when the start time is confirmed.</p>}
    {showCoordinates && timeConfirmed && <form className="scoreboard-coordinates" onSubmit={event => {
      event.preventDefault();
      const form = new FormData(event.currentTarget);
      void onRead(game, { latitude: Number(form.get("latitude")), longitude: Number(form.get("longitude")) });
    }}>
      <p>Enter the venue coordinates to calculate this game.</p>
      <label>Latitude<input name="latitude" type="number" required step="any" min={-90} max={90} /></label>
      <label>Longitude<input name="longitude" type="number" required step="any" min={-180} max={180} /></label>
      <button type="submit" className="run-button" disabled={disabled}>{busy ? "Calculating…" : "Calculate game"}</button>
    </form>}
  </article>;
}

export function GameScoreboard({ pendingId, disabled, onRead }: Props) {
  const [sport, setSport] = useState<ScoreboardSport>("ALL");
  const [view, setView] = useState<"live" | "upcoming" | null>(null);
  const [dayOffset, setDayOffset] = useState(0);
  const date = localDate(view === "upcoming" ? dayOffset : 0);
  const board = trpc.schedules.scoreboard.useQuery({ date, sport, timeZone }, {
    refetchInterval: 30_000,
    staleTime: 20_000,
    retry: 1,
  });
  const data = board.data;
  const activeView = view ?? (data && data.live.length === 0 ? "upcoming" : "live");
  const games = data?.[activeView] ?? [];
  const unavailable = data?.unavailableSports ?? [];
  const emptyMessage = unavailable.length > 0 && games.length === 0
    ? "Some scores or schedules are unavailable."
    : activeView === "live" ? "No games in play right now." : "No upcoming games for this date.";

  return <section className="game-scoreboard" id="live-scoreboard" aria-labelledby="scoreboard-heading">
    <div className="scoreboard-heading">
      <h1 id="scoreboard-heading">Games</h1>
      <button type="button" className="scoreboard-refresh" disabled={board.isFetching} onClick={() => void board.refetch()}>
        <RefreshCw size={16} className={board.isFetching ? "spin" : ""} /> Refresh
      </button>
    </div>
    <div className="scoreboard-views" role="group" aria-label="Game status">
      <button type="button" aria-pressed={activeView === "live"} onClick={() => setView("live")}>
        <i className="scoreboard-live-dot" /> Live {data && date === localDate() && <small>{data.live.length}</small>}
      </button>
      <button type="button" aria-pressed={activeView === "upcoming"} onClick={() => setView("upcoming")}>Upcoming</button>
    </div>
    <div className="scoreboard-sports" role="group" aria-label="Sports">
      {(["ALL", ...SCOREBOARD_SPORTS] as const).map(value => <button key={value} type="button" aria-pressed={sport === value}
        onClick={() => setSport(value)}>{SCOREBOARD_LABELS[value]}</button>)}
    </div>
    {activeView === "upcoming" && <div className="scoreboard-dates" role="group" aria-label="Upcoming game date">
      {Array.from({ length: 7 }, (_, offset) => {
        const day = new Date(`${localDate(offset)}T12:00:00`);
        const label = offset === 0 ? "Today" : offset === 1 ? "Tomorrow" : day.toLocaleDateString(undefined, { weekday: "short", day: "numeric" });
        return <button key={offset} type="button" aria-pressed={dayOffset === offset}
          onClick={() => { setView("upcoming"); setDayOffset(offset); }}>{label}</button>;
      })}
    </div>}
    {board.isError && <p className="scoreboard-notice" role="alert">
      {data ? "Refresh failed. Showing the last available update." : "The game feed is unavailable. Tap Refresh to try again."}
    </p>}
    {unavailable.length > 0 && <p className="scoreboard-notice" role="status">
      Feed incomplete for {unavailable.map(value => SCOREBOARD_LABELS[value]).join(", ")}.
    </p>}
    {games.length > 0 ? <div className="scoreboard-grid">
      {games.map(game => <GameCard key={game.id} game={game} busy={pendingId === game.id} disabled={disabled} onRead={onRead} />)}
    </div> : (!board.isError || data) && <div className="scoreboard-empty" role="status">
      {board.isPending ? <><LoaderCircle size={18} className="spin" /> Loading games…</> : emptyMessage}
      {!board.isPending && activeView === "live" && <button type="button" onClick={() => setView("upcoming")}>See upcoming games <ChevronRight size={16} /></button>}
    </div>}
    {data && <p className="scoreboard-updated">Updated {new Date(data.updatedAt).toLocaleTimeString(undefined, { hour: "numeric", minute: "2-digit", second: "2-digit" })} · Refreshes every 30 seconds</p>}
  </section>;
}
