import { FERRY_TERMINALS } from "../constants.js";
import {
  StationId,
  TripObjectFile,
  VesselOnRoute,
  VesselTripConfidence,
} from "../types.def.js";
import { getInNMinutes, getToday } from "../util/date.js";

/**
 * If a vessel has been sitting around for longer than this,
 * then it's unlikely to still be on the same route.
 */
const MAX_MINUTES_BETWEEN_TRIPS = 29;

export function guessVesselFromPreviousTrip(
  vessel: VesselOnRoute,
  tripObjectFile: TripObjectFile
): VesselOnRoute["trip"] {
  const lastTrip = vessel.trip;
  if (!lastTrip) return null;

  const lastTripEnd = lastTrip.stopTimes.at(-1)!;
  if (!lastTripEnd) return null;
  const minutesAfterLastTripEnd = getInNMinutes(
    lastTripEnd.time,
    MAX_MINUTES_BETWEEN_TRIPS
  );

  const TODAY = getToday();

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
        nextTripStart.time >= lastTripEnd.time &&
        nextTripStart.time < minutesAfterLastTripEnd
      );
    })
    .sort((a, b) =>
      // we can safely compare the time as a string, because they are formatted as HH:mm:ss
      a.stopTimes[0].time.localeCompare(b.stopTimes[0].time)
    )[0];

  // we couldn't find the next trip
  if (!outboundTrip) return null;

  const hasLayoverSpace = FERRY_TERMINALS[+lastTripEnd.stop as StationId][3];

  return {
    ...outboundTrip,
    confidence: hasLayoverSpace
      ? VesselTripConfidence.UNCERTAIN
      : VesselTripConfidence.VERY_LIKELY,
  };
}
