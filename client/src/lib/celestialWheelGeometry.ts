/** Celestial wheel presentation only.
 * 0° Aries at 12 o'clock; positive longitude increases COUNTERCLOCKWISE.
 * All rings, house cusps, labels and planet glyphs must use this transform.
 * Never invert ephemeris longitude or numerical house calculations.
 */
export function wheelAngle(longitude: number): number {
  if (!Number.isFinite(longitude)) throw new Error("Wheel longitude must be finite");
  return (-longitude - 90) * Math.PI / 180;
}
export function wheelPoint(longitude: number, radius: number, center = 110) {
  const angle = wheelAngle(longitude);
  return { x: center + Math.cos(angle) * radius, y: center + Math.sin(angle) * radius };
}
export function equalHouseCenter(anchor: number, house: number): number {
  if (!Number.isInteger(house) || house < 1 || house > 12) throw new Error("House must be 1–12");
  return anchor + (house - 1) * 30 + 15;
}
