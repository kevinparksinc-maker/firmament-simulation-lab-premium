export const SCOREBOARD_SPORTS = ["NCAAB", "NBA", "NFL", "NCAAF", "MLB", "NHL", "MLS", "TENNIS"] as const;

export type ScheduleSport = (typeof SCOREBOARD_SPORTS)[number];
export type ScoreboardSport = ScheduleSport | "ALL";

export const SCOREBOARD_LABELS: Record<ScoreboardSport, string> = {
  ALL: "All sports",
  NCAAB: "NCAA Basketball",
  NBA: "NBA",
  NFL: "NFL",
  NCAAF: "NCAA Football",
  MLB: "MLB",
  NHL: "NHL",
  MLS: "MLS",
  TENNIS: "ATP / WTA",
};
