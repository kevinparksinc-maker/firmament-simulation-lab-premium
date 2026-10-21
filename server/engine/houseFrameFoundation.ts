/**
 * All 360° zodiac + house geometry is owned by the one shared core.
 * Importing from this historic path remains compatible with existing methods.
 * Do not implement any separate modulo-12/house-direction arithmetic here.
 */
export {
  ZODIAC_SIGNS, WHEEL_GEOMETRY_VERSION, HOUSE_ARC_DEGREES,
  normalizeLongitude, zodiacAt, houseAnchor, houseCusp,
  locateInHouse, arcHouseOverlaps, projectSignValuesToEqualHouses, legacyReverseHouse,
  counterclockwiseWheelAngle,
} from "../../shared/firmamentWheel";
export type { FirmamentFrame, HousePosition, LongitudeArc, HouseOverlap } from "../../shared/firmamentWheel";
