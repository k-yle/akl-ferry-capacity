import { findDepaturesForStation } from "../../_helpers/timetable/findDepaturesForStation.js";
import type {
  Handler,
  StaticTimetableDB,
  TerminalLiveInfo,
} from "../../_helpers/types.def.js";

/** cache data in memory for max 10mins */
const CACHE_MINUTES = 10;

function cleanResponse(terminal: TerminalLiveInfo) {
  for (const trip of terminal.departures) {
    // @ts-expect-error -- intentional, we don't want to return this to the client
    delete trip.dates;
  }
  return terminal;
}

export const onRequest: Handler = async (context) => {
  const cache =
    (await context.env.DB.get<{
      [stationId: string]: TerminalLiveInfo;
    }>("terminalLiveInfo", "json")) || {};

  const stationId = +context.params.stationId;
  if (
    cache[stationId] &&
    (Date.now() - cache[stationId].lastUpdated) / 1000 / 60 < CACHE_MINUTES
  ) {
    return Response.json({ cached: true, ...cleanResponse(cache[stationId]) });
  }

  const staticTimetableDB = await context.env.DB.get<StaticTimetableDB>(
    "tripObj",
    "json"
  );

  const departures = [
    ...findDepaturesForStation(`${stationId}`, staticTimetableDB, "today"),
    ...findDepaturesForStation(`${stationId}`, staticTimetableDB, "tomorrow"),
  ].slice(0, 60); // limit length

  const out: TerminalLiveInfo = {
    lastUpdated: Date.now(),
    departures,
  };

  cache[stationId] = out;

  await context.env.DB.put("terminalLiveInfo", JSON.stringify(cache));

  return Response.json({ cached: false, ...cleanResponse(cache[stationId]) });
};
