import type { GTFSRealtime } from "gtfs-types";
import {
  VesselTripConfidence,
  type Handler,
  type TripObjectFile,
  type VesselInfo,
  type VesselOnRoute,
  type VesselPositionsFile,
} from "../_helpers/types.def.js";
import { API_HEADERS } from "../_helpers/constants.js";
import { deriveCog } from "../_helpers/util/geo.js";
import { guessVesselFromPreviousTrip } from "../_helpers/guesswork/guessVesselFromPreviousTrip.js";
import { guessVesselFromPosition } from "../_helpers/guesswork/guessVesselFromPosition.js";

/** cache data in memory for max 1min */
const CACHE_MINUTES = 1;

function cleanResponse(output: VesselPositionsFile) {
  // @ts-expect-error -- intentional, we don't want to return this to the client
  // eslint-disable-next-line no-param-reassign
  delete output.prevPositions;
  for (const vessel of output.list) {
    // @ts-expect-error -- intentional, we don't want to return this to the client
    if (vessel.trip) delete vessel.trip.dates;
    // @ts-expect-error -- intentional, we don't want to return this to the client
    if (vessel.potentialNextTrip) delete vessel.potentialNextTrip.dates;
  }
  return output;
}

export const onRequest: Handler = async (context) => {
  const cache = await context.env.DB.get<VesselPositionsFile>(
    "vesselPositions",
    "json"
  );

  const now = Date.now();
  if (cache && (now - cache.lastUpdated) / 1000 / 60 < CACHE_MINUTES) {
    return Response.json({ cached: true, ...cleanResponse(cache) });
  }

  const previousPositions = cache?.prevPositions || {};

  const vesselInfo =
    (await context.env.DB.get<VesselInfo>("vesselInfo", "json")) || {};
  const tripObject =
    (await context.env.DB.get<TripObjectFile>("tripObj", "json")) || {};

  const realtime: GTFSRealtime = await fetch(
    "https://api.at.govt.nz/realtime/legacy",
    {
      headers: {
        ...API_HEADERS,
        "Ocp-Apim-Subscription-Key": context.env.AT_MAIN_API_KEY,
      },
    }
  ).then((r) => r.json());

  const vesselsOnRoute = realtime.response
    .entity! // filter out busses, trains, or unknown MMSI numbers
    .filter(
      (vehicle) =>
        vehicle.vehicle?.position &&
        vehicle.vehicle?.vehicle &&
        vehicle.vehicle.vehicle.id in vesselInfo
    )
    // merge with vessel static data
    .map((vehicle): VesselOnRoute => {
      const vessel = vesselInfo[vehicle.id as never as number];
      const bearingStr = vehicle.vehicle!.position!.bearing;
      const maybeSpeedKmph = vehicle.vehicle!.position!.speed;

      const tripId =
        vehicle.trip_update?.trip?.trip_id || vehicle.vehicle?.trip?.trip_id;
      const label = vehicle.vehicle!.vehicle!.label;

      const lat = vehicle.vehicle!.position!.latitude;
      const lng = vehicle.vehicle!.position!.longitude;

      previousPositions[vessel.mmsi] ||= [];
      previousPositions[vessel.mmsi].unshift({ lat, lng, date: now });
      previousPositions[vessel.mmsi].length = 5; // limit how many previous positions we store

      const result: VesselOnRoute = {
        vessel,
        nameFromAIS: label === vehicle.id ? null : label,
        trip:
          tripId && tripObject[tripId]
            ? {
                ...tripObject[tripId],
                confidence: VesselTripConfidence.CERTAIN,
              }
            : null,
        potentialNextTrip: null,
        nmea2000: {
          lat,
          lng,
          heading: bearingStr ? +bearingStr : null,
          cog: deriveCog(previousPositions[vessel.mmsi]),
          speedKts: maybeSpeedKmph ? maybeSpeedKmph / 1.852 : null,
          navStatus: maybeSpeedKmph ? "UnderWayUsingEngine" : "Moored",
        },
      };
      result.trip ||= guessVesselFromPosition(result, tripObject);
      result.potentialNextTrip ||= guessVesselFromPreviousTrip(
        result,
        tripObject
      );

      return result;
    });

  const output: VesselPositionsFile = {
    list: vesselsOnRoute,
    lastUpdated: now,
    prevPositions: previousPositions,
  };

  await context.env.DB.put("vesselPositions", JSON.stringify(output));

  return Response.json({ cached: false, ...cleanResponse(output) });
};
