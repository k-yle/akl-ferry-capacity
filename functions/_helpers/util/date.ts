// simplest way without adding a date library...
export const getToday = () =>
  new Intl.DateTimeFormat("en-NZ", {
    timeZone: "Pacific/Auckland",
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
  })
    .format(new Date())
    .split("/")
    .reverse()
    .join("-");

// the current time. Using locale DE because they use 24 hour time...
// this is a bit of a stupid hack to avoid another dependency
export const getNow = () =>
  new Intl.DateTimeFormat("de-DE", {
    timeZone: "Pacific/Auckland",
    timeStyle: "medium",
  }).format(new Date());

/**
 * GTFS allows hours >24, so we fix this
 */
export const normaliseGtfsTime = (hhmmss: string) => {
  const [hh, mm, ss] = hhmmss.split(":");
  const normalisedHour = `${+hh % 24}`.padStart(2, "0");
  return `${normalisedHour}:${mm}:${ss}`;
};

/** Given a `hh:mm:ss` time, it adds/substracts the given
 * number of minutes, returns a `hh:mm:ss` time.
 */
export const getInNMinutes = (hhmmss: string, minuteOffset: number) => {
  const date = new Date(`1970-01-01T${normaliseGtfsTime(hhmmss)}Z`);
  date.setUTCMinutes(date.getUTCMinutes() + minuteOffset);
  return date.toISOString().split("T")[1].split(".")[0];
};
