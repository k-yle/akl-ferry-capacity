import { expect, describe, it, vi } from "vitest";
import { guessVesselFromPosition } from "../guessVesselFromPosition.js";
import {
  VesselTripConfidence,
  type VesselOnRoute,
  type TripObjectFile,
} from "../../types.def.js";

vi.mock("../../util/date.js", async () => ({
  // @ts-expect-error -- see Microsoft/TypeScript#10727
  ...(await vi.importActual("../../util/date.js")),
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
  t4: {
    // this one is plausible (for a vessel standing by at Pier 1 downtown)
    tripId: "t4",
    rsn: "BIRK",
    dates: ["2022-11-12"],
    destination: "Birkenhead",
    operator: "Explore",
    stopTimes: [
      { stop: "96001", time: "14:45:00", pier: "1", headsign: "" },
      { stop: "96601", time: "14:55:00", pier: "1", headsign: "" },
    ],
  },
  t5: {
    // same as t4, but departs earlier
    tripId: "t5",
    rsn: "BAYS",
    dates: ["2022-11-12"],
    destination: "Bayswater",
    operator: "Explore",
    stopTimes: [
      { stop: "96001", time: "14:00:00", pier: "1", headsign: "" },
      { stop: "96401", time: "14:10:00", pier: "1", headsign: "" },
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
      destination: "Downtown",
      operator: "Union Steam Ship Co",

      confidence: VesselTripConfidence.LIKELY,
      tripId: "",
      stopTimes: [
        {
          headsign: "Downtown",
          pier: undefined,
          stop: "96001",
          time: "00:00:09",
        },
      ],
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
      stopTimes: [
        {
          headsign: "Downtown",
          pier: undefined,
          stop: "96001",
          time: "00:00:09",
        },
      ],
      dates: [],
    });
  });

  it("returns the most appropriate trip if there are multiple possible", () => {
    expect(
      guessVesselFromPosition(
        createVessel({ lat: -36.84279728384385, lng: 174.76699809406733 }),
        tripObjectFile
      )
    ).toStrictEqual({
      // both t4 and t5 are plausible, but it picked
      // t5 since it's earlier
      ...tripObjectFile.t5,
      confidence: VesselTripConfidence.LIKELY,
    });
  });

  it.each`
    hour  | tripId
    ${14} | ${"t3"}
    ${15} | ${"t3"}
    ${16} | ${""}
    ${21} | ${""}
  `(
    "does not return a tripId if the next trip is too far in the future %#",
    ({ hour, tripId }) => {
      expect(
        guessVesselFromPosition(
          createVessel({
            lat: -36.84773845645748,
            lng: 174.88265547186995,
            cog: 100,
          }),
          {
            t3: {
              ...tripObjectFile.t3,
              stopTimes: [
                {
                  stop: "97001",
                  time: `${hour}:00:00`,
                  pier: "1",
                  headsign: "",
                },
                {
                  stop: "96001",
                  time: `${hour}:45:00`,
                  pier: "5",
                  headsign: "",
                },
              ],
            },
          }
        )?.tripId
      ).toBe(tripId);
    }
  );
});
