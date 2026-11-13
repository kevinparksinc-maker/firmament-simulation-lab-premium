import { afterEach, describe, expect, it, vi } from "vitest";
import { listScoreboard } from "./schedules";

function event(id: string, date: string, state: string, name = "", timeValid = true) {
  return {
    id, date,
    competitions: [{
      timeValid,
      venue: { fullName: "Reed Arena", address: { city: "College Station", state: "TX" } },
      status: { type: { state, name, shortDetail: state === "in" ? "8:12 - 2nd" : undefined } },
      competitors: [
        { homeAway: "away", team: { displayName: "Oklahoma State Cowboys" }, score: "53" },
        { homeAway: "home", team: { displayName: "Texas A&M Aggies" }, score: "55" },
      ],
    }],
  };
}

afterEach(() => {
  vi.useRealTimers();
  vi.unstubAllGlobals();
});

describe("live and upcoming scoreboard", () => {
  it("requests the Division I slate, honors the viewer date, and keeps finals and postponements out", async () => {
    vi.useFakeTimers();
    vi.setSystemTime(new Date("2026-11-13T01:00:00Z"));
    const fetch = vi.fn(async (url: string) => {
      const date = new URL(url).searchParams.get("dates");
      const live = event("in-play", "2026-11-12T00:00Z", "in");
      const events = date === "20261111" ? [live] : date === "20261112" ? [
        live,
        event("tonight", "2026-11-13T02:00Z", "pre"),
        event("final", "2026-11-12T23:00Z", "post"),
        event("postponed", "2026-11-13T02:00Z", "pre", "STATUS_POSTPONED"),
        event("late", "2026-11-13T00:59Z", "pre"),
        event("time-tbd", "2026-11-12T20:00Z", "pre", "STATUS_SCHEDULED", false),
      ] : [event("tomorrow", "2026-11-14T01:00Z", "pre")];
      return { ok: true, json: async () => ({ events }) };
    });
    vi.stubGlobal("fetch", fetch);
    const today = await listScoreboard("2026-11-12", "NCAAB", "America/Los_Angeles");
    expect(fetch.mock.calls.map(([url]) => new URL(url).searchParams.get("groups"))).toEqual(["50", "50", "50"]);
    expect(today.live).toMatchObject([{ id: "ncaab-in-play", scoreA: "53", scoreB: "55", period: "8:12 - 2nd" }]);
    expect(today.upcoming.map(game => game.id)).toEqual(["ncaab-time-tbd", "ncaab-tonight"]);
    expect(today.upcoming[1]).toMatchObject({ latitude: 30.60578, longitude: -96.34619 });
    expect(today.unavailableSports).toEqual([]);

    const tomorrow = await listScoreboard("2026-11-13", "NCAAB", "America/Los_Angeles");
    expect(tomorrow.live).toEqual([]);
    expect(tomorrow.upcoming.map(game => game.id)).toEqual(["ncaab-tomorrow"]);
  });

  it("identifies an unavailable feed even when adjacent dates return no fixtures", async () => {
    vi.stubGlobal("fetch", vi.fn(async (url: string) => {
      if (url.includes("20261122")) throw new Error("offline");
      return { ok: true, json: async () => ({ events: [] }) };
    }));
    const data = await listScoreboard("2026-11-22", "NBA", "America/Los_Angeles");
    expect(data.unavailableSports).toEqual(["NBA"]);
    expect(data.upcoming).toEqual([]);
  });
});
