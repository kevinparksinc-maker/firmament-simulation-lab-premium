import { describe, expect, it } from "vitest";
import { requireGuardianPosition } from "./guardianEphemerisAdapter";
describe("Guardian ephemeris parity boundary", () => {
  it("accepts Guardian mode-14 positions and resolves locked stars", () => {
    const p = requireGuardianPosition(() => ({ planet: "Sun", longitude: 45, referenceFrame: "firmament-aldebaran-15-taurus", source: "guardian-swiss-ephemeris-mode-14" }), new Date("2026-01-01T00:00:00Z"), "Sun");
    expect(p.overlay.fixedStars.find(x => x.name === "Aldebaran")?.separationDegrees).toBe(0);
  });
  it("rejects missing or mismatched canonical inputs instead of silently mixing frames", () => {
    expect(() => requireGuardianPosition(() => ({ planet: "Moon", longitude: 45, referenceFrame: "firmament-aldebaran-15-taurus", source: "guardian-swiss-ephemeris-mode-14" }), new Date(), "Sun")).toThrow();
  });
});
