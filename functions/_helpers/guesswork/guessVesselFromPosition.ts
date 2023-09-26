import whichPolygon from "which-polygon";
import { FERRY_TERMINALS } from "../constants.js";
import harbourZones from "../assets/harbourZones.geo.json";
import {
  VesselTripConfidence,
  type VesselOnRoute,
  type TripObjectFile,
} from "../types.def.js";
import { getInNMinutes, getNow, getToday } from "../util/date.js";

const query = whichPolygon(harbourZones);

const isWithinAngle = (
  { min, max }: { min: number; max: number },
  angle: number
) => {
  return min <= max
    ? angle >= min && angle <= max
    : angle >= min || angle <= max;
};

export const guessVesselFromPosition = (
  vessel: VesselOnRoute,
  tripObjectFile: TripObjectFile
): VesselOnRoute["trip"] => {
  const harbourZone = query([vessel.nmea2000.lng, vessel.nmea2000.lat]);
  if (!harbourZone?.options) return null;

  const validJourneys = harbourZone.options.filter(
    (option) =>
      !option.angleRange ||
      (vessel.nmea2000.cog !== null &&
        isWithinAngle(option.angleRange, vessel.nmea2000.cog))
  );

  if (!validJourneys.length) return null;

  const differentRoutes = new Set(
    validJourneys.map((journey) => journey.route)
  );
  if (differentRoutes.size > 1) {
    // multiple possible routes, so we can't make a safe guess
    return null;
  }

  // there could be multiple validJourneys, but they're all from
  // the same route, so just pick the first one.
  const journey = validJourneys[0];

  const TODAY = getToday();
  const NOW = getNow();
  const in2Hours = getInNMinutes(NOW, 2 * 60);

  const nextTrip = Object.values(tripObjectFile)
    .filter(
      (trip) =>
        trip.rsn === journey.route && // trip is on the correct route
        trip.dates.includes(TODAY) && // trip applies today
        +trip.stopTimes[0].stop === journey.to && // trip departs from where this journey ends
        trip.stopTimes[0].time < in2Hours && // trip leaves within the next 2 hours
        trip.stopTimes[0].time > NOW // trip occurs later in the day than right now.
    )
    .sort((a, b) =>
      // we can safely compare the time as a string, because they are formatted as HH:mm:ss
      a.stopTimes[0].time.localeCompare(b.stopTimes[0].time)
    )[0];

  if (nextTrip) {
    return { ...nextTrip, confidence: VesselTripConfidence.LIKELY };
  }

  // we found a journey but not a matching trip...
  const destination = FERRY_TERMINALS[journey.to][0];
  return {
    destination,
    operator: vessel.vessel.operators[0]?.name || "Unknown",
    rsn: journey.route,
    confidence: VesselTripConfidence.LIKELY,

    // TODO: this will probably break something, might be better to return nothing
    dates: [],
    stopTimes: [
      // only add a single stop.
      {
        headsign: destination,
        pier: undefined,
        stop: `${journey.to}`,
        time: "00:00:09",
      },
    ],
    tripId: "",
  };
};
