import type { FERRY_TERMINALS } from "./constants.js";

export type Coord = { lat: number; lng: number };
export type DatedCoord = Coord & { date: number };

export type Vessel = {
  name: string;
  qId: string;
  mmsi: number;
  image?: string;

  loa?: number;
  width?: number;
  gt?: number;

  operators: {
    name: string;
    qId: string;
    start?: string;
    end?: string;
  }[];
  capacity: {
    pax?: number;
    bike?: number;
  };
};

export type VesselInfo = {
  [mmsi: number]: Vessel;
};

/** merged the interested details from agency.txt, routes.txt, and trips.txt */
export type TripObject = {
  rsn: string;
  operator: string;
  destination: string;
};
export type TripObjectFile = { [tripId: string]: TripObject };

export type FerryTerminal = [name: string, lat: number, lng: number];
export type FerryRoute = {
  name: string;
  shortName: string;
  stationIds: (keyof typeof FERRY_TERMINALS)[];
};

export type Departure = TripObject & {
  tripId: string;
  destinationLive: string;
  time: string;
  pier: number | undefined;
  cancelled: boolean;
};
export type TerminalLiveInfo = {
  lastUpdated: number;
  alerts: AT.Cancellation[];
  departures: Departure[];
};

export namespace AT {
  export type Movement = {
    scheduledArrivalTime: null;
    scheduledDepartureTime: "2023-04-22T01:30:00.000Z";
    arrivalBoardingActivity: "alighting";
    arrivalPlatformName: string;
    arrivalStatus: "noReport" | "cancelled";
    departureBoardingActivity: "boarding";
    departurePlatformName: "2";
    destinationDisplay: string;
    expectedArrivalTime: null;
    expectedDepartureTime: null;
    inCongestion: false;
    monitored: false;
    route_short_name: string;
    stop_code: string;
    /** ISO Name */
    timestamp: string;
    vehicleJourneyName: string;
    route_id: string;
    shape_id: string;
    trip_id: string;
  };

  export type Cancellation = {
    priority: "high";
    text: string;
  };

  export type StationAPIResponse = {
    status: "OK";
    error: null;
    response: {
      movements: AT.Movement[];
      extensions: AT.Cancellation[];
    };
  };
}

export type Handler = PagesFunction<{
  AT_MAIN_API_KEY: string;
  AT_ALT_API_KEY: string;
  UPLOAD_TOKEN: string;
  DB: KVNamespace;
}>;
