import { expect, describe, it, vi } from "vitest";
import {
  getInNMinutes,
  guessVesselFromPreviousTrip,
} from "../guessVesselFromPreviousTrip.js";
import {
  VesselTripConfidence,
  type TripObject,
  type VesselOnRoute,
} from "../../types.def.js";

vi.mock("../../util/date.js", () => ({
  getToday: () => "2022-11-12",
}));

const tripObjectFile = {
  t1: <TripObject>{
    tripId: "t1",
    rsn: "DEV",
    dates: ["2022-11-12"],
    stopTimes: [
      { stop: "96701", time: "08:30:00" },
      { stop: "96001", time: "08:42:00" },
    ],
  },
  t2: <TripObject>{
    tripId: "t2",
    rsn: "DEV",
    dates: ["2022-11-12"],
    stopTimes: [
      { stop: "96001", time: "08:45:00" },
      { stop: "96701", time: "08:57:00" },
    ],
  },
  t3: <TripObject>{
    tripId: "t3",
    rsn: "DEV",
    dates: ["2022-11-12"],
    stopTimes: [
      { stop: "96701", time: "09:00:00" },
      { stop: "96001", time: "09:12:00" },
    ],
  },
  t4: <TripObject>{
    tripId: "t4",
    rsn: "DEV",
    dates: ["2022-11-12"],
    stopTimes: [
      { stop: "96001", time: "09:15:00" },
      { stop: "96701", time: "09:27:00" },
    ],
  },
  t5: <TripObject>{
    tripId: "t5",
    rsn: "DEV",
    dates: ["2022-11-11"], // different day, so this one should be ignored
    stopTimes: [
      { stop: "96001", time: "08:44:00" },
      { stop: "96701", time: "08:57:00" },
    ],
  },
};

describe("guessVesselFromPreviousTrip", () => {
  it("returns null if we don't know the current trip", () => {
    expect(
      guessVesselFromPreviousTrip(<VesselOnRoute>{}, tripObjectFile)
    ).toBeNull();
  });

  it.each`
    currentTrip          | nextTrip             | confidence
    ${tripObjectFile.t1} | ${tripObjectFile.t2} | ${VesselTripConfidence.UNCERTAIN}
    ${tripObjectFile.t2} | ${tripObjectFile.t3} | ${VesselTripConfidence.VERY_LIKELY}
    ${tripObjectFile.t3} | ${tripObjectFile.t4} | ${VesselTripConfidence.UNCERTAIN}
  `(
    "finds the next trip after the current one #%#",
    ({ currentTrip, nextTrip, confidence }) => {
      expect(
        guessVesselFromPreviousTrip(
          <VesselOnRoute>{ trip: currentTrip },
          tripObjectFile
        )
      ).toStrictEqual({
        confidence,
        ...nextTrip,
      });
    }
  );
});

describe("getInNMinutes", () => {
  it.each`
    timeIn        | mins   | timeOut
    ${"12:34:56"} | ${1}   | ${"12:35:56"}
    ${"23:58:00"} | ${3}   | ${"00:01:00"}
    ${"00:05:00"} | ${-10} | ${"23:55:00"}
    ${"12:00:00"} | ${-1}  | ${"11:59:00"}
  `(
    "understands $timeIn + $mins mins = $timeOut",
    ({ timeIn, mins, timeOut }) => {
      expect(getInNMinutes(timeIn, mins)).toBe(timeOut);
    }
  );
});
