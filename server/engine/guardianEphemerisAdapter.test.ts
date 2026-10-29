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
  it("rejects an absent provider result without silently falling back", () => {
    expect(() => requireGuardianPosition(() => undefined as never, new Date("2026-01-01T00:00:00Z"), "Sun")).toThrow(/no position/);
  });
  it("rejects a stale timestamp even when the longitude and frame labels look valid", () => {
    expect(() => requireGuardianPosition(() => ({ planet: "Sun", longitude: 45, referenceFrame: "firmament-aldebaran-15-taurus", source: "guardian-swiss-ephemeris-mode-14", timestamp: "2025-01-01T00:00:00Z" }), new Date("2026-01-01T00:00:00Z"), "Sun")).toThrow(/timestamp/);
  });
  it("accepts a correctly stamped canonical position", () => {
    const result = requireGuardianPosition(() => ({ planet: "Sun", longitude: 45, referenceFrame: "firmament-aldebaran-15-taurus", source: "guardian-swiss-ephemeris-mode-14", timestamp: "2026-01-01T00:00:00Z" }), new Date("2026-01-01T00:00:00Z"), "Sun");
    expect(result.longitude).toBe(45);
  });
});
