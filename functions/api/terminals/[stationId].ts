import { API_HEADERS } from "../../_helpers/constants.js";
import type {
  AT,
  Departure,
  Handler,
  TerminalLiveInfo,
  TripObjFile,
} from "../../_helpers/types.def.js";

/** cache data in memory for max 10mins */
const CACHE_MINUTES = 10;

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
    return Response.json({ cached: true, ...cache[stationId] });
  }

  const atMovements: AT.StationAPIResponse = await fetch(
    `https://api.at.govt.nz/serviceinfo/v1/departures/${stationId}?scope=tripsData`,
    {
      headers: {
        ...API_HEADERS,
        "Ocp-Apim-Subscription-Key": context.env.AT_ALT_API_KEY!,
      },
    }
  ).then((r) => r.json());

  const tripObj =
    (await context.env.DB.get<TripObjFile>("tripObj", "json")) || {};

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

  await context.env.DB.put("terminalLiveInfo", JSON.stringify(cache));

  return Response.json({ cached: false, ...cache[stationId] });
};
