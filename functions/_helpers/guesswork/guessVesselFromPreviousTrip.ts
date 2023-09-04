import { FERRY_TERMINALS } from "../constants.js";
import {
  TripObjectFile,
  VesselOnRoute,
  VesselTripConfidence,
} from "../types.def.js";
import { TODAY } from "../util/date.js";

/**
 * If a vessel has been sitting around for longer than this,
 * then it's unlikely to still be on the same route.
 */
const MAX_MINUTES_BETWEEN_TRIPS = 29;

/** Given a `hh:mm:ss` time, it adds/substracts the given
 * number of minutes, returns a `hh:mm:ss` time.
 */
export const getInNMinutes = (hhmmss: string, minuteOffset: number) => {
  const date = new Date(`1970-01-01T${hhmmss}Z`);
  date.setUTCMinutes(date.getUTCMinutes() + minuteOffset);
  return date.toISOString().split("T")[1].split(".")[0];
};

export function guessVesselFromPreviousTrip(
  vessel: VesselOnRoute,
  tripObjectFile: TripObjectFile
): VesselOnRoute["trip"] {
  const lastTrip = vessel.trip;
  if (!lastTrip) return null;

  const lastTripEnd = lastTrip.stopTimes.at(-1)!;
  const minutesAfterLastTripEnd = getInNMinutes(
    lastTripEnd.time,
    MAX_MINUTES_BETWEEN_TRIPS
  );

  /**
   * All trips for today that starts from where the current trip ends.
   */
  const outboundTrip = Object.values(tripObjectFile)
    .filter((trip) => {
      const nextTripStart = trip.stopTimes[0];
      return (
        trip.rsn === lastTrip.rsn &&
        trip.dates.includes(TODAY) &&
        nextTripStart.stop === lastTripEnd.stop &&
        // gt/lt is safe bc the format is HH:mm:ss
        nextTripStart.time > lastTripEnd.time &&
        nextTripStart.time < minutesAfterLastTripEnd
      );
    })
    .sort((a, b) =>
      // we can safely compare the time as a string, because they are formatted as HH:mm:ss
      a.stopTimes[0].time.localeCompare(b.stopTimes[0].time)
    )[0];

  // we couldn't find the next trip
  if (!outboundTrip) return null;

  const hasLayoverSpace =
    FERRY_TERMINALS[+lastTripEnd.stop as keyof typeof FERRY_TERMINALS][3];

  return {
    ...outboundTrip,
    confidence: hasLayoverSpace
      ? VesselTripConfidence.UNCERTAIN
      : VesselTripConfidence.VERY_LIKELY,
  };
}
