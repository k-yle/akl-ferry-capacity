import { expect, describe, it, vi } from "vitest";
import { guessVesselFromPosition } from "../guessVesselFromPosition.js";
import {
  VesselTripConfidence,
  type VesselOnRoute,
  type TripObjectFile,
} from "../../types.def.js";

vi.mock("../../util/date.js", () => ({
  getToday: () => "2022-11-12",
  getNow: () => "13:45:56",
}));

const tripObjectFile: TripObjectFile = {
  t1: {
    // this one is too early
    tripId: "t1",
    rsn: "HMB",
    dates: ["2022-11-12"],
    destination: "Half Moon Bay",
    operator: "Explore",
    stopTimes: [
      { stop: "97001", time: "13:00:00", pier: "1", headsign: "" },
      { stop: "96001", time: "13:45:00", pier: "5", headsign: "" },
    ],
  },
  t2: {
    // this one is for the wrong day
    tripId: "t2",
    rsn: "HMB",
    dates: ["2022-11-10"],
    destination: "Half Moon Bay",
    operator: "Explore",
    stopTimes: [
      { stop: "97001", time: "14:00:00", pier: "1", headsign: "" },
      { stop: "96001", time: "14:45:00", pier: "5", headsign: "" },
    ],
  },
  t3: {
    // this one is plausible
    tripId: "t3",
    rsn: "HMB",
    dates: ["2022-11-12"],
    destination: "Half Moon Bay",
    operator: "Explore",
    stopTimes: [
      { stop: "97001", time: "14:00:00", pier: "1", headsign: "" },
      { stop: "96001", time: "14:45:00", pier: "5", headsign: "" },
    ],
  },
};

const createVessel = ({
  lat,
  lng,
  cog,
}: {
  lat: number;
  lng: number;
  cog?: number;
}) =>
  ({
    nmea2000: { lat, lng, cog },
    vessel: { operators: [{ name: "Union Steam Ship Co" }] },
  }) as VesselOnRoute;

describe("guessVesselFromPosition", () => {
  it("returns null if no polygons match", () => {
    expect(
      guessVesselFromPosition(createVessel({ lat: 1, lng: 2 }), tripObjectFile)
    ).toBeNull();
    expect(
      guessVesselFromPosition(
        createVessel({ lat: -36.83726148647799, lng: 174.76951401429721 }),
        tripObjectFile
      )
    ).toBeNull();
  });

  it("returns the route, no angles involved", () => {
    expect(
      guessVesselFromPosition(
        createVessel({ lat: -36.84244960391359, lng: 174.76713486374558 }),
        tripObjectFile
      )
    ).toStrictEqual({
      rsn: "DEV",
      destination: "Devonport",
      operator: "Union Steam Ship Co",

      confidence: VesselTripConfidence.LIKELY,
      tripId: "",
      stopTimes: [],
      dates: [],
    });
  });

  it("uses the angle 1", () => {
    expect(
      guessVesselFromPosition(
        createVessel({
          lat: -36.84773845645748,
          lng: 174.88265547186995,
          cog: 100,
        }),
        tripObjectFile
      )
    ).toStrictEqual({
      // this time it matched a trip ID
      ...tripObjectFile.t3,
      confidence: VesselTripConfidence.LIKELY,
    });
  });

  it("uses the angle 2", () => {
    expect(
      guessVesselFromPosition(
        createVessel({
          lat: -36.84773845645748,
          lng: 174.88265547186995,
          cog: 359,
        }),
        tripObjectFile
      )
    ).toStrictEqual({
      rsn: "HMB",
      destination: "Downtown",
      operator: "Union Steam Ship Co",

      confidence: VesselTripConfidence.LIKELY,
      tripId: "",
      stopTimes: [],
      dates: [],
    });
  });

  it("returns null if there are multiple possible trips", () => {
    expect(
      guessVesselFromPosition(
        createVessel({ lat: -36.84279728384385, lng: 174.76699809406733 }),
        tripObjectFile
      )
    ).toBeNull();
  });
});
