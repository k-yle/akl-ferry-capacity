import type { FERRY_ROUTES, FERRY_TERMINALS } from "./constants.js";

export type Coord = { lat: number; lng: number };
export type DatedCoord = Coord & { date: number };

export type Vessel = {
  name: string;
  qId: string;
  mmsi: number;
  image?: string;
  /** ISO Date */
  startDate?: string;

  loa?: number;
  beam?: number;
  gt?: number;

  operators: {
    name: string;
    qId: string;
    start?: string;
    end?: string;
    wikipedia?: string;
    facebook?: string;
  }[];
  capacity: {
    pax?: number;
    seats?: number;
    bike?: number;
  };
};

export type VesselInfo = {
  [mmsi: number]: Vessel;
};

/** merged the interested details from agency.txt, routes.txt, and trips.txt */
export type TripObject = {
  tripId: string;
  rsn: Rsn;
  routeId: string;
  operator: string;
  destination: string;
  /** ISO Dates */
  dates: string[];
  stopTimes: {
    stop: string;
    pier: string | undefined;
    time: string;
    headsign: string;
  }[];
};
export type TripObjectFile = { [tripId: string]: TripObject };

export type StaticTimetableDB = {
  trips: TripObjectFile;
  /** map of stopIds and the routes that stop there */
  stopIds: { [stationId: string]: Rsn[] };
};

export type FerryTerminal = [
  name: string,
  lat: number,
  lng: number,
  /** true if there are multiple berths that are often used interchangably */
  hasLayoverSpace?: boolean,
];

type KeyOfUnion<T> = T extends T ? keyof T : never;
export type Rsn = KeyOfUnion<(typeof FERRY_ROUTES)[keyof typeof FERRY_ROUTES]>;
export type StationId = keyof typeof FERRY_TERMINALS;

export type FerryRoute = {
  name: string;
  shortName: string;
  stationIds: StationId[];
  /** alternative RSNs used for this route */
  altRsn?: string[];
};

export type Departure = TripObject & {
  destinationLive: string;
  time: string;
  pier: number | undefined;
  date: string;
};
export type TerminalLiveInfo = {
  lastUpdated: number;
  departures: Departure[];
};

export type Handler = PagesFunction<{
  AT_MAIN_API_KEY: string;
  UPLOAD_TOKEN: string;
  DB: KVNamespace;
}>;

/**
 * How confident we are that the vessel is actually associated
 * with the `tripId`.
 */
export enum VesselTripConfidence {
  /** If the onboard transmitter is set to the correct `tripId` */
  CERTAIN,
  /**
   * If the inbound vessel at a single-pier suburban terminal is
   * scheduled to immediately return to the city centre, then the
   * same vessel must operate the outbound trip.
   */
  VERY_LIKELY,
  /**
   * If the AIS destination is set to the correct route, and/or
   * if exactly 1 vessel is underway toward this terminal, and there
   * is no other destination that the vessel could be going to.
   */
  LIKELY,
  /**
   * If the vessel is berthed at the correct pier in the city centre,
   * or if it operated the last service on this route.
   */
  UNCERTAIN,
}

export type TripWithConfidence = TripObject & {
  confidence: VesselTripConfidence;
};

export type VesselOnRoute = {
  vessel: Vessel;
  trip: TripWithConfidence | null;
  potentialNextTrip: TripWithConfidence | null;
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

export type Alert = {
  title?: string;
  description?: string;
  url?: string;
  priority: "low" | "high";
  appliesTo: Rsn[];
};

export type VesselPositionsFile = {
  list: VesselOnRoute[];
  lastUpdated: number;
  prevPositions: { [mmsi: number]: DatedCoord[] };
  /** list of tripIds */
  cancellations: string[];
  alerts: Alert[];
};
