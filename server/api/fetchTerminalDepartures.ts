import { API_HEADERS } from "../constants.ts";
import { tripObj } from "../db.ts";
import type { AT, Departure, TerminalLiveInfo } from "../types.def.ts";

/** cache data in memory for max 10mins */
const CACHE_MINUTES = 10;

const cache: {
  [stationId: string]: TerminalLiveInfo;
} = {};

export async function fetchTerminalDepartures(
  stationId: number
): Promise<TerminalLiveInfo> {
  if (
    cache[stationId] &&
    (Date.now() - cache[stationId].lastUpdated) / 1000 / 60 < CACHE_MINUTES
  ) {
    return cache[stationId];
  }

  const atMovements: AT.StationAPIResponse = await fetch(
    `https://api.at.govt.nz/serviceinfo/v1/departures/${stationId}?scope=tripsData`,
    {
      headers: {
        ...API_HEADERS,
        "Ocp-Apim-Subscription-Key": process.env.AT_ALT_API_KEY!,
      },
    }
  ).then((r) => r.json());

  const out: TerminalLiveInfo = {
    lastUpdated: Date.now(),
    alerts: atMovements.response.extensions,
    departures: atMovements.response.movements.map((movement): Departure => {
      const pier = +(
        movement.arrivalPlatformName || movement.departurePlatformName
      );
      return {
        ...tripObj[movement.trip_id],
        tripId: movement.trip_id,
        destinationLive: movement.destinationDisplay,
        pier: Number.isNaN(pier) ? undefined : pier,
        time: movement.scheduledDepartureTime || movement.scheduledArrivalTime,
        cancelled: movement.arrivalStatus === "cancelled",
      };
    }),
  };

  cache[stationId] = out;

  return cache[stationId];
}
