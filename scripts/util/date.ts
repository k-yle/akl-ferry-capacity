import { ExceptionType, type Calendar, type CalendarDates } from "gtfs-types";

const DAY_NAMES = [
  "sunday",
  "monday",
  "tuesday",
  "wednesday",
  "thursday",
  "friday",
  "saturday",
] satisfies (keyof Calendar)[];
type DayName = (typeof DAY_NAMES)[number];

/** @param startDate is mutated */
const getNextDayOfTheWeek = (dayName: DayName, startDate: Date): Date => {
  const dayOfWeek = DAY_NAMES.indexOf(dayName);
  if (dayOfWeek < 0) throw new Error("Invalid day");
  startDate.setUTCHours(0, 0, 0, 0);
  startDate.setUTCDate(
    startDate.getUTCDate() + ((dayOfWeek + 7 - startDate.getUTCDay()) % 7)
  );
  return startDate;
};

/** adds hyphens to the ISODate */
const parseGTFSDate = (date: string) =>
  `${date
    .match(/(\d{4})(\d{2})(\d{2})/)!
    .slice(1)
    .join("-")}T00:00:00Z`;

/**
 * parses `calendar.txt` and `calendar_dates.txt`, returning
 * a list of real ISO dates.
 */
export const getDatesForTrip = (
  calendar: Calendar,
  exceptions: CalendarDates[] | undefined = []
): string[] => {
  let dates: string[] = [];

  const endDate = new Date(parseGTFSDate(calendar.end_date));
  for (const dayName of DAY_NAMES) {
    if (+calendar[dayName] === 1) {
      let nextDay = new Date(parseGTFSDate(calendar.start_date));
      // eslint-disable-next-line no-constant-condition
      while (true) {
        nextDay = getNextDayOfTheWeek(
          dayName,
          new Date(+nextDay + 1000 * 60 * 60 * 24)
        );
        if (+nextDay < +endDate) {
          dates.push(nextDay.toISOString().split("T")[0]);
        } else break;
      }
    }
  }

  for (const exception of exceptions) {
    const isoDate = parseGTFSDate(exception.date).split("T")[0];
    if (+exception.exception_type === ExceptionType.SERVICE_ADDED) {
      // added services
      dates.push(isoDate);
    } else {
      // removed services
      dates = dates.filter((date) => date !== isoDate);
    }
  }

  return dates.sort((a, b) => +new Date(a) - +new Date(b));
};
