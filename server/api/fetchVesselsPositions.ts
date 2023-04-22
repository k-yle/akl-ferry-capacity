import type { GTFSRealtime } from "gtfs-types";
import { tripObj, vesselInfo } from "../db.ts";
import { DatedCoord, TripObj, Vessel } from "../types.def.ts";
import { API_HEADERS } from "../constants.ts";
import { deriveCog } from "../util/geo.ts";

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

// only cached in memory
const prevPositions: { [mmsi: number]: DatedCoord[] } = {};

let cache: [data: VesselOnRoute[], savedAt: number] | undefined;

export async function fetchVesselsPositions(): Promise<
  NonNullable<typeof cache>
> {
  if (cache && (Date.now() - cache[1]) / 1000 / 60 < CACHE_MINUTES) {
    return cache;
  }

  const realtime: GTFSRealtime = await fetch(
    "https://api.at.govt.nz/realtime/legacy",
    {
      headers: {
        ...API_HEADERS,
        "Ocp-Apim-Subscription-Key": process.env.AT_MAIN_API_KEY!,
      },
    }
  ).then((r) => r.json());

  const now = Date.now();

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

  cache = [vesselsOnRoute, now];

  return cache;
}
