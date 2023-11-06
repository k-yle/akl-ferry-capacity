import { Departure, StaticTimetableDB } from "../types.def.js";
import { addDay, getInNMinutes, getNow, getToday } from "../util/date.js";

/** hide depatures that left more this many minute ago */
const MAX_MINUTES_AGO_TO_INCLUDE = 30;

export const findDepaturesForStation = (
  stationId: string,
  staticTimetableDB: StaticTimetableDB | null,
  chosenDate: "today" | "tomorrow"
): Departure[] => {
  if (!staticTimetableDB) return [];

  let date = getToday();
  if (chosenDate === "tomorrow") {
    date = addDay(new Date(date), 1).toISOString().split("T")[0];
  }

  // only include a cutoff if we're processing the current day
  const cutoffTime =
    chosenDate === "tomorrow"
      ? "00:00:00"
      : getInNMinutes(getNow(), -MAX_MINUTES_AGO_TO_INCLUDE);

  // assumption: a stop only appears once in a trip.
  // this currently works by coincidence for beach haven,
  // because of how AT splits the trips in two.

  const candidateTrips = Object.values(staticTimetableDB.trips).filter(
    (trip) =>
      trip.dates.includes(date) && // this service operates today
      trip.stopTimes.some(
        (stopTime, stopIndex, { length: numberOfStops }) =>
          // cheapest checks first for efficiency
          stopTime.stop === stationId && // this service stops here
          // gt/lt is safe bc the format is HH:mm:ss
          stopTime.time > cutoffTime && // this service departed already
          stopIndex !== numberOfStops - 1 // but don't include this trip if it terminates here (since passengers can't board)
      )
  );

  const depatures = candidateTrips
    .map((trip): Departure => {
      const stopTime = trip.stopTimes.find((time) => time.stop === stationId)!;
      return {
        ...trip,
        pier: stopTime.pier ? +stopTime.pier : undefined,
        time: stopTime.time,
        destinationLive: stopTime.headsign,
        date,
      };
    })
    .sort((a, b) => (a.time < b.time ? -1 : 1)); // gt/lt is safe bc the format is HH:mm:ss

  return depatures;
};
