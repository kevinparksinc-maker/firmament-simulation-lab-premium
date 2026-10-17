export function shadowReferenceLongitude(longitude: number) { return ((longitude + 180) % 360 + 360) % 360; }
