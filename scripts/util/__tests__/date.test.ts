import { describe, expect, it } from "vitest";
import { type Calendar, type CalendarDates, ExceptionType } from "gtfs-types";
import { getDatesForTrip } from "../date.ts";

describe("getDatesForTrip", () => {
  it("can parse calendar.txt and calendar_dates.txt", () => {
    const calendar = {
      start_date: "20230102",
      end_date: "20230213",
      monday: 1,
      wednesday: 1,
      sunday: 0,
    } as Calendar;
    const exceptions: CalendarDates[] = [
      {
        service_id: "",
        date: "20230130", // remove this monday
        exception_type: ExceptionType.SERVICE_REMOVED,
      },
      {
        service_id: "",
        date: "20230131", // add this tuesday
        exception_type: ExceptionType.SERVICE_ADDED,
      },
    ];
    expect(getDatesForTrip(calendar, exceptions)).toStrictEqual([
      // first Mo missing since the startDate is exclusive
      "2023-01-04", // We
      "2023-01-09", // Mo
      "2023-01-11", // We
      "2023-01-16", // Mo
      "2023-01-18", // We
      "2023-01-23", // Mo
      "2023-01-25", // We
      // Monday was removed
      "2023-01-31", // Tu - special one added
      "2023-02-01", // We
      "2023-02-06", // Mo
      "2023-02-08", // We
      // last Mo missing since the endDate is exclusive
    ]);
  });
});
