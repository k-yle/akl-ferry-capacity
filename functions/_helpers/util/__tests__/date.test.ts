import { describe, expect, it } from "vitest";
import { getInNMinutes } from "../date.js";

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
