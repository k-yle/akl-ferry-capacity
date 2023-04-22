import { Coord, DatedCoord } from "../types.def.ts";

const { sin, cos, atan2, sqrt, PI: π } = Math;

const R = 6371; // radius of the earth in km

/** degrees to rad */
const fromᐤ = (deg: number) => deg * (π / 180);
/** rad to degrees */
const toᐤ = (rad: number) => rad / (π / 180);

/** returns the distance in metres between two coordinates */
export function distanceBetween(a: Coord, b: Coord): number {
  const dLat = fromᐤ(b.lat - a.lat);
  const dLon = fromᐤ(b.lng - a.lng);
  const ā =
    sin(dLat / 2) * sin(dLat / 2) +
    cos(fromᐤ(a.lat)) * cos(fromᐤ(b.lat)) * sin(dLon / 2) * sin(dLon / 2);
  const c = 2 * atan2(sqrt(ā), sqrt(1 - ā));
  return 1000 * R * c;
}

/** Returns a bearing in degrees (North = 0°) */
export const bearingBetween = (a: Coord, b: Coord) => {
  const [x1, y1] = [fromᐤ(a.lng), fromᐤ(a.lat)];
  const [x2, y2] = [fromᐤ(b.lng), fromᐤ(b.lat)];

  const x = cos(y1) * sin(y2) - sin(y1) * cos(y2) * cos(x2 - x1);
  const y = sin(x2 - x1) * cos(y2);
  const θ = atan2(y, x);
  return (toᐤ(θ) + 360) % 360;
};

/** returns the COG derivied from the previous stored positions */
export function deriveCog(positions: DatedCoord[]): number | null {
  const [last, secondLast] = positions;

  if (!last || !secondLast) return null; // not enough data points

  // for now this is a crude calculation based on the last 2 points

  // > 10mins between the last 2 coords is far too long for the result to be reliable.
  const minutesBetween = (last.date - secondLast.date) / 1000 / 60;
  if (minutesBetween > 10) return null;

  if (distanceBetween(last, secondLast) < 10) {
    // <10metres between the last two coordinates, so we can't make
    // any meaningful conclusions.
    return null;
  }

  return bearingBetween(secondLast, last);
}
