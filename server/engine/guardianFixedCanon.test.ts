import { describe, it, expect } from "vitest";
import { guardianOverlay, GUARDIAN_REFERENCE_FRAME } from "./guardianFixedCanon";
describe("Guardian fixed-firmament canon parity", () => {
  it("locks Aldebaran at Taurus 15", () => {
    expect(GUARDIAN_REFERENCE_FRAME).toBe("firmament-aldebaran-15-taurus");
    expect(guardianOverlay(45).fixedStars.find(s => s.name === "Aldebaran")?.separationDegrees).toBe(0);
  });
  it("uses elemental-family decans", () => {
    expect(guardianOverlay(0).decan).toBe("Aries");
    expect(guardianOverlay(10).decan).toBe("Leo");
    expect(guardianOverlay(20).decan).toBe("Sagittarius");
  });
  it("keeps all fixed stars visible regardless of orb", () => {
    expect(guardianOverlay(300).fixedStars).toHaveLength(10);
  });
});
