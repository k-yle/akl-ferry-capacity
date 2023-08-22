import type { GTFSRealtime } from "gtfs-types";
import type {
  DatedCoord,
  Handler,
  TripObj,
  TripObjFile,
  Vessel,
  VesselInfo,
} from "../_helpers/types.def.js";
import { API_HEADERS } from "../_helpers/constants.js";
import { deriveCog } from "../_helpers/util/geo.js";

/** cache data in memory for max 1min */
const CACHE_MINUTES = 1;

export type VesselOnRoute = {
  vessel: Vessel;
  trip: (Partial<TripObj> & { tripId: string }) | null;
  nameFromAIS: string | null;
  nmea2000: {
    lat: number;
    lng: number;
    heading: number | null;
    cog: number | null;
    speedKts: number | null;
    navStatus: string; // 0-15 from n2k
  };
};
export type VesselPositionsFile = {
  list: VesselOnRoute[];
  lastUpdated: number;
  prevPositions: { [mmsi: number]: DatedCoord[] };
};

export const onRequest: Handler = async (context) => {
  const cache = await context.env.DB.get<VesselPositionsFile>(
    "vesselPositions",
    "json"
  );

  const now = Date.now();
  if (cache && (now - cache.lastUpdated) / 1000 / 60 < CACHE_MINUTES) {
    return Response.json({ cached: true, ...cache });
  }

  const prevPositions = cache?.prevPositions || {};

  const vesselInfo =
    (await context.env.DB.get<VesselInfo>("vesselInfo", "json")) || {};
  const tripObj =
    (await context.env.DB.get<TripObjFile>("tripObj", "json")) || {};

  const realtime: GTFSRealtime = await fetch(
    "https://api.at.govt.nz/realtime/legacy",
    {
      headers: {
        ...API_HEADERS,
        "Ocp-Apim-Subscription-Key": context.env.AT_MAIN_API_KEY,
      },
    }
  ).then((r) => r.json());

  const vesselsOnRoute = realtime.response.entity
    // filter out busses, trains, or unknown MMSI numbers
    .filter(
      (vehicle) =>
        vehicle.vehicle?.position && vehicle.vehicle.vehicle.id in vesselInfo
    )
    // merge with vessel static data
    .map((vehicle): VesselOnRoute => {
      const vessel = vesselInfo[vehicle.id as never as number];
      const bearingStr = vehicle.vehicle!.position!.bearing;
      const maybeSpeedKmph = vehicle.vehicle!.position!.speed;

      const tripId =
        vehicle.trip_update?.trip?.trip_id || vehicle.vehicle?.trip?.trip_id;
      const label = vehicle.vehicle!.vehicle.label;

      const lat = vehicle.vehicle!.position!.latitude;
      const lng = vehicle.vehicle!.position!.longitude;

      prevPositions[vessel.mmsi] ||= [];
      prevPositions[vessel.mmsi].unshift({ lat, lng, date: now });
      prevPositions[vessel.mmsi].length = 5; // limit how many previous positions we store

      return {
        vessel,
        nameFromAIS: label === vehicle.id ? null : label,
        trip: tripId ? { tripId, ...tripObj[tripId] } : null,
        nmea2000: {
          lat,
          lng,
          heading: bearingStr ? +bearingStr : null,
          cog: deriveCog(prevPositions[vessel.mmsi]),
          speedKts: maybeSpeedKmph ? maybeSpeedKmph / 1.852 : null,
          navStatus: maybeSpeedKmph ? "UnderWayUsingEngine" : "Moored",
        },
      };
    });

  const output: VesselPositionsFile = {
    list: vesselsOnRoute,
    lastUpdated: now,
    prevPositions,
  };

  await context.env.DB.put("vesselPositions", JSON.stringify(output));

  return Response.json({ cached: false, ...output });
};
