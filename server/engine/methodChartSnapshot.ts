import type { Prediction } from "./firmamentEngine";
import { WHEEL_GEOMETRY_VERSION, houseCusp, locateInHouse, type FirmamentFrame } from "./houseFrameFoundation";

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
  coordinateConvention: typeof WHEEL_GEOMETRY_VERSION;
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
  // The snapshot's Lagna/Ascendant must match the house chart that each method
  // receives; otherwise a sign-based method silently projects onto Agent
  // houses even when it is supposedly running God View.
  clone.ascendantLongitude = anchor;
  // Reproject the single ephemeris position into this frame once, BEFORE
  // handing the chart to any method. Methods never do this themselves.
  for (const planet of clone.planets) {
    const placement = locateInHouse(planet.backgroundWheelLongitude, frame, anchor);
    planet.house = placement.house;
    planet.degreeInHouse = placement.degreeInHouse;
  }
  for (const house of clone.houses) {
    house.cuspLongitude = houseCusp(house.house, frame, anchor);
  }
  freezeTree(clone);
  return Object.freeze({
    frame,
    eventTime: new Date(eventTime),
    ascendantLongitude: anchor,
    prediction: clone,
    coordinateConvention: WHEEL_GEOMETRY_VERSION,
  });
}
