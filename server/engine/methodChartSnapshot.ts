import type { Prediction } from "./firmamentEngine";
import { houseCusp, locateInHouse, type FirmamentFrame } from "./houseFrameFoundation";

/**
 * Methods receive one completed, read-only celestial snapshot per frame.
 * The coordinator supplies event time; methods may interpret time-dependent
 * doctrine but must never recalculate event positions or advance the clock.
 */
export type MethodChartSnapshot = Readonly<{
  frame: FirmamentFrame;
  eventTime: Date;
  ascendantLongitude: number;
  prediction: Prediction;
  coordinateConvention: "aries-zero-360-equal-houses-v1";
}>;

function freezeTree(value: unknown, seen = new WeakSet<object>()): void {
  if (!value || typeof value !== "object" || seen.has(value)) return;
  seen.add(value);
  // Dates are copied for the snapshot; don't traverse their native internals.
  if (value instanceof Date) return;
  for (const field of Object.values(value)) freezeTree(field, seen);
  Object.freeze(value);
}

export function buildMethodChartSnapshot(
  prediction: Prediction,
  eventTime: Date,
  frame: FirmamentFrame,
  ascendantLongitude = frame === "god" ? 0 : prediction.ascendantLongitude,
): MethodChartSnapshot {
  if (!Number.isFinite(eventTime.getTime())) throw new RangeError("Invalid snapshot time");
  const clone = structuredClone(prediction);
  const anchor = frame === "god" ? 0 : ascendantLongitude;
  // Fail closed if the evidence supplied to a method contradicts the shared
  // house geometry. Do not silently rewrite a planet's source longitude.
  for (const planet of clone.planets) {
    const expected = locateInHouse(planet.backgroundWheelLongitude, frame, anchor);
    if (planet.house !== expected.house) {
      throw new Error(`Method snapshot mismatch (${frame}): ${planet.planet} supplied H${planet.house}, expected H${expected.house} at longitude ${planet.backgroundWheelLongitude}`);
    }
  }
  for (const house of clone.houses) {
    const expected = houseCusp(house.house, frame, anchor);
    const delta = Math.abs(((house.cuspLongitude - expected + 540) % 360) - 180);
    if (delta > 0.0001) throw new Error(`Method snapshot mismatch (${frame}): H${house.house} cusp ${house.cuspLongitude} vs ${expected}`);
  }
  freezeTree(clone);
  return Object.freeze({
    frame,
    eventTime: new Date(eventTime),
    ascendantLongitude: anchor,
    prediction: clone,
    coordinateConvention: "aries-zero-360-equal-houses-v1" as const,
  });
}
