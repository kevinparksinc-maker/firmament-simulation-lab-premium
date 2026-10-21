import { describe, expect, it } from "vitest";
import { readFileSync } from "node:fs";
import { resolve } from "node:path";

// The saved market-assignment fields must exist consistently in the
// ORM, the additive SQL migration, migration journal, and full snapshot.
describe("saved sportsbook provenance migration", () => {
  const read = (path: string) => readFileSync(resolve(process.cwd(), path), "utf8");

  it("adds all four fields without dropping historical rows", () => {
    const sql = read("drizzle/0001_method_odds_provenance.sql");
    for (const name of ["favoredTeam","underdogTeam","roleAssignmentSource","oddsSource"]) {
      expect(sql).toContain(`ADD COLUMN \`${name}\``);
    }
    expect(sql).not.toMatch(/DROP TABLE|DELETE FROM|TRUNCATE TABLE|DROP COLUMN/i);
  });

  it("registers a unique consecutive migration and complete linked snapshot", () => {
    const journal = JSON.parse(read("drizzle/meta/_journal.json"));
    expect(journal.entries.map((entry: { idx: number }) => entry.idx)).toEqual([0,1]);
    expect(journal.entries[1].tag).toBe("0001_method_odds_provenance");

    const base = JSON.parse(read("drizzle/meta/0000_snapshot.json"));
    const next = JSON.parse(read("drizzle/meta/0001_snapshot.json"));
    expect(next.prevId).toBe(base.id);
    expect(next.id).not.toBe(base.id);
    for (const name of ["favoredTeam","underdogTeam","roleAssignmentSource","oddsSource"]) {
      expect(next.tables.simulation_events.columns[name].notNull).toBe(false);
    }
  });
});
